// src/hooks/useCourseContract.ts
import { useAtom } from 'jotai';
import { Course } from '@/types/courses';
import { useCallback, useState } from 'react';
import { formatUnits } from '@ethersproject/units';
import CourseMarketABI from '@/contracts/abis/CourseMarket.json';
import GeekTokenABI from '@/contracts/abis/GeekToken.json';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { coursesAtom } from '@/stores/courseStore';
import {
  useAccount,
  useWriteContract,
  usePublicClient,
  useWalletClient,
  useWaitForTransactionReceipt
} from 'wagmi';

// 合约地址可以从配置文件或环境变量获取
const COURSE_MARKET_ADDRESS = CONTRACT_ADDRESSES.SEPOLIA.COURSE_MARKET;
const G_TOKEN_ADDRESS = CONTRACT_ADDRESSES.SEPOLIA.GEEK_TOKEN;

export function useCourseContract() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oldCourses, setCourses] = useAtom(coursesAtom);
  
  const { writeContractAsync } = useWriteContract();

  // 获取所有课程
  const getAllCourses = useCallback(async (): Promise<Course[]> => {
    if (!publicClient) {
      throw new Error('合约未初始化');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 获取课程总数
      const courseCount = await publicClient.readContract({
        address: COURSE_MARKET_ADDRESS,
        abi: CourseMarketABI.abi,
        functionName: 'courseCount',
      });
      
      const courseCountNumber = Number(courseCount || 0);
      
      // 如果没有课程，直接返回空数组
      if (courseCountNumber === 0) {
        return [];
      }
      
      // 获取所有课程信息
      const courses: Course[] = [];
      
      for (let i = 1; i <= courseCountNumber; i++) {
        try {
          // 获取课程信息
          const course:any = await publicClient.readContract({
            address: COURSE_MARKET_ADDRESS,
            abi: CourseMarketABI.abi,
            functionName: 'courses',
            args: [i],
          });
          
          if (!course) continue;
          // 格式化课程信息
          const courseData: Course = {
            web2CourseId: course[0],
            name: course[1],
            price: course[2] ? formatUnits(course[2], 0) : '0',
            isActive: course[3],
            creator: course[4]
          };
          // 如果用户已登录，检查是否已购买
          if (account) {
            try {
              const isPurchased = await publicClient.readContract({
                address: COURSE_MARKET_ADDRESS,
                abi: CourseMarketABI.abi,
                functionName: 'hasCourse',
                args: [account, course[0]],
              });
              courseData.isPurchased = !!isPurchased;
            } catch (err) {
              // 课程不存在或其他错误，默认为未购买
              courseData.isPurchased = false;
              console.log(`检查购买状态失败: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
          courses.push(courseData);
        } catch (error) {
          console.error(`获取课程 #${i} 失败:`, error);
        }
      }
      
      // 根据web2CourseId合并
      for (let index = 0; index < courses.length; index++) {
        const course = courses[index];
        const oldCourse = oldCourses.find(c => c.web2CourseId === course.web2CourseId) || course;
        courses[index] = Object.assign(oldCourse, course);
      }
      setCourses(courses);
      return courses;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取课程失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, account, oldCourses, setCourses]);

  // 获取用户已购买的课程
  const getUserCourses = useCallback(async (userAddress: string): Promise<Course[]> => {
    if (!publicClient) {
      throw new Error('合约未初始化');
    }

    if (!userAddress) {
      throw new Error('用户地址不能为空');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const allCourses = await getAllCourses();
      const userCourses = await Promise.all(
        allCourses.map(async (course) => {
          const isPurchased = await publicClient.readContract({
            address: COURSE_MARKET_ADDRESS,
            abi: CourseMarketABI.abi,
            functionName: 'hasCourse',
            args: [userAddress, course.web2CourseId],
          });
          
          return {
            ...course,
            isPurchased: !!isPurchased
          };
        })
      );
      setCourses(userCourses);
      // 只返回用户已购买的课程
      return userCourses.filter(course => course.isPurchased);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取用户课程失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, getAllCourses, setCourses]);

  // 购买课程
  const purchaseCourse = useCallback(async (web2CourseId: string) => {
    if (!publicClient || !walletClient || !account) {
      throw new Error('用户未登录或合约未初始化');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 获取课程ID和价格
      const courseId = await publicClient.readContract({
        address: COURSE_MARKET_ADDRESS,
        abi: CourseMarketABI.abi,
        functionName: 'web2ToCourseId',
        args: [web2CourseId],
      });
      
      if (courseId?.toString() === '0') {
        throw new Error(`课程不存在: ${web2CourseId}`);
      }
      
      const course:any = await publicClient.readContract({
        address: COURSE_MARKET_ADDRESS,
        abi: CourseMarketABI.abi,
        functionName: 'courses',
        args: [courseId],
      });
      
      if (!course) {
        throw new Error('无法获取课程信息');
      }
      
      const {price} = course;
      
      // 检查代币余额
      const balance:any = await publicClient.readContract({
        address: G_TOKEN_ADDRESS,
        abi: GeekTokenABI.abi,
        functionName: 'balanceOf',
        args: [account],
      });
      
      if (balance < price) {
        throw new Error(`YD代币余额不足，需要 ${price ? formatUnits(price, 0) : '0'} YD，当前余额: ${balance ? formatUnits(balance, 0) : '0'} YD`);
      }
      
      // 检查授权
      const allowance:any = await publicClient.readContract({
        address: G_TOKEN_ADDRESS,
        abi: GeekTokenABI.abi,
        functionName: 'allowance',
        args: [account, COURSE_MARKET_ADDRESS],
      });
      
      if (allowance < price) {
        // 需要先授权
        const hash = await writeContractAsync({
          address: G_TOKEN_ADDRESS,
          abi: GeekTokenABI.abi,
          functionName: 'approve',
          args: [COURSE_MARKET_ADDRESS, price],
        });
        
        // 等待交易确认
        await useWaitForTransactionReceipt({ hash });
      }
      
      // 购买课程
      const hash = await writeContractAsync({
        address: COURSE_MARKET_ADDRESS,
        abi: CourseMarketABI.abi,
        functionName: 'purchaseCourse',
        args: [web2CourseId],
      });
      
      // 等待交易确认
      await publicClient.waitForTransactionReceipt({ hash });
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '购买课程失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, account, writeContractAsync]);

  // 检查课程是否已完成（是否有证书）
  const checkCourseCompletion = useCallback(async (web2CourseId: string, studentAddress: string) => {
    if (!publicClient) {
      throw new Error('合约未初始化');
    }

    try {
      // 获取证书合约地址
      const certificateContract = await publicClient.readContract({
        address: COURSE_MARKET_ADDRESS,
        abi: CourseMarketABI.abi,
        functionName: 'certificate',
      });
      
      if (!certificateContract) {
        return false;
      }
      
      // 检查是否有证书
      const hasCertificate = await publicClient.readContract({
        address: certificateContract as `0x${string}`,
        // 这里需要导入证书合约ABI
        abi: CourseMarketABI.abi, // 暂时使用CourseMarket的ABI，实际应导入CourseCertificate.json
        functionName: 'hasCertificate',
        args: [studentAddress, web2CourseId],
      });
      
      return !!hasCertificate;
    } catch (err) {
      console.error('检查课程完成状态失败:', err);
      return false;
    }
  }, [publicClient]);

  return {
    account,
    isLoading,
    error,
    getAllCourses,
    getUserCourses,
    purchaseCourse,
    checkCourseCompletion
  };
}