'use client';

import React, { useState } from 'react';
import { Contract } from '@ethersproject/contracts';
import { formatUnits, parseEther, parseUnits } from '@ethersproject/units';
import { Web3ReactProvider, useWeb3React, initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';
import Link from 'next/link';

// 导入合约 ABI
import GeekTokenABI from '@/contracts/abis/GeekToken.json';
import CourseMarketABI from '@/contracts/abis/CourseMarket.json';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
// 定义一个自定义类型来处理区块链错误
interface BlockchainError extends Error {
  code?: string;
  receipt?: { status: number };
  data?: string;
  transactionHash?: string;
}

const [metaMask, metaMaskHooks] = initializeConnector(actions => new MetaMask({ actions }));

const ContractTestPage = () => {
  // Web3React hooks - 注意 v8 版本的 API 变化
  const { account, chainId, connector, provider } = useWeb3React();

  // 状态管理
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [ydCoin, setYdCoin] = useState<string>(CONTRACT_ADDRESSES.SEPOLIA.GEEK_TOKEN);
  const [txHash, setTxHash] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [ethBalance, setEthBalance] = useState<string>('0');

  // 新增状态
  const [contractEthBalance, setContractEthBalance] = useState<string>('0');
  const [tokenName, setTokenName] = useState<string>('');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [tokenTotalSupply, setTokenTotalSupply] = useState<string>('0');
  const [transferAmount, setTransferAmount] = useState<string>('10');
  const [transferTo, setTransferTo] = useState<string>('');
  const [tokenPrice, setTokenPrice] = useState<string>('0');
  const [tokenOwner, setTokenOwner] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [coursePrice, setCoursePrice] = useState<string>('100');
  const [marketAddress, setMarketAddress] = useState<string>(CONTRACT_ADDRESSES.SEPOLIA.COURSE_MARKET);
  const [web2CourseId, setWeb2CourseId] = useState<string>('');
  const [marketCourseId, setMarketCourseId] = useState<string>('');
  const [marketCourseInfo] = useState<any>(null);
  const [studentAddress, setStudentAddress] = useState<string>('');
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('0.01');

  // 添加日志
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // 连接钱包
  const handleConnect = async () => {
    try {
      await metaMask.activate();
      addLog('钱包连接请求已发送');
    } catch (err) {
      setError('连接钱包失败');
      addLog(`连接钱包失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 获取 ETH 余额
  const getEthBalance = async () => {
    if (!account || !provider) {
      return;
    }

    try {
      const balance = await provider.getBalance(account);
      setEthBalance(formatUnits(balance, 18));
      console.log(balance);
      addLog(`获取到 ETH 余额: ${formatUnits(balance, 18)} ETH`);
    } catch (err) {
      setError('获取 ETH 余额失败');
      addLog(`获取 ETH 余额失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 断开钱包连接
  const handleDisconnect = () => {
    if (connector?.deactivate) {
      connector.deactivate();
    }
    addLog('钱包已断开连接');
  };

  // 获取代币余额
  const getTokenBalance = async () => {
    if (!account || !ydCoin || !provider) {
      setError('请先连接钱包并输入代币合约地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tokenContract = new Contract(ydCoin, GeekTokenABI.abi, provider);
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(formatUnits(balance, 0)); // 使用 formatUnits 替代 utils.formatUnits
      addLog(`获取到代币余额: ${formatUnits(balance, 0)} G`);
    } catch (err) {
      setError('获取代币余额失败');
      addLog(`获取代币余额失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // 购买代币 - 调整购买金额
  const buyTokens = async () => {
    if (!account || !ydCoin || !provider) {
      setError('请先连接钱包并输入代币合约地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signer = provider.getSigner();
      const tokenContract = new Contract(ydCoin, GeekTokenABI.abi, signer);

      // 添加错误处理和日志
      addLog(`准备购买代币，合约地址: ${ydCoin}`);

      // 使用用户输入的金额
      const ethAmount = parseEther(purchaseAmount);
      const userBalance = await provider.getBalance(account);

      if (userBalance.lt(ethAmount)) {
        throw new Error(
          `ETH 余额不足，需要至少 ${purchaseAmount} ETH，当前余额: ${formatUnits(userBalance, 18)} ETH`,
        );
      }

      // 检查合约状态和限制
      try {
        // 获取当前供应量和最大供应量
        const totalSupply = await tokenContract.totalSupply();
        const maxSupply = await tokenContract.MAX_SUPPLY();
        const tokensPerEth = await tokenContract.TOKENS_PER_ETH();

        // 计算将获得的代币数量
        const tokenAmount = ethAmount.mul(tokensPerEth).div(parseEther('1'));

        addLog(`当前供应量: ${formatUnits(totalSupply, 0)}`);
        addLog(`最大供应量: ${formatUnits(maxSupply, 0)}`);
        addLog(`预计获得代币: ${formatUnits(tokenAmount, 0)}`);

        // 检查是否会超过最大供应量
        if (totalSupply.add(tokenAmount).gt(maxSupply)) {
          throw new Error(
            `购买将超过最大供应量。当前: ${formatUnits(totalSupply, 0)}, 最大: ${formatUnits(maxSupply, 0)}`,
          );
        }
      } catch (error) {
        const err = error as BlockchainError;

        if (err.message && err.message.includes('购买将超过最大供应量')) {
          throw err;
        }
        addLog(`合约状态检查警告: ${err.message}`);
      }

      // 使用更明确的参数格式，并添加更高的 gasLimit
      addLog('发送交易...');
      const tx = await tokenContract.buyWithETH({
        value: ethAmount,
        gasLimit: 500000, // 增加 gas 限制
      });

      setTxHash(tx.hash);
      addLog(`购买代币交易已发送: ${tx.hash}`);

      // 等待交易确认
      addLog('等待交易确认...');
      const receipt = await tx.wait();

      // 检查交易状态
      if (receipt.status === 0) {
        throw new Error('交易执行失败，可能是合约函数调用出错');
      }

      addLog(`购买代币交易已确认，区块号: ${receipt.blockNumber}`);

      // 更新余额
      setTimeout(() => {
        getTokenBalance();
        getEthBalance();
        initTokenInfo(); // 更新合约信息
      }, 2000); // 延迟 2 秒更新余额，确保区块链状态已更新
    } catch (error) {
      const err = error as BlockchainError;
      console.error('购买代币错误:', err);

      // 提供更详细的错误信息
      if (err.code === 'ACTION_REJECTED') {
        setError('用户拒绝了交易');
        addLog('用户拒绝了交易');
      } else if (err.message && err.message.includes('insufficient funds')) {
        setError('ETH 余额不足');
        addLog('ETH 余额不足，无法完成交易');
      } else if (err.message && err.message.includes('购买将超过最大供应量')) {
        setError(err.message);
        addLog(err.message);
      } else if (err.receipt && err.receipt.status === 0) {
        setError('合约执行失败');
        addLog('合约执行失败，请检查合约函数是否有限制条件');

        // 尝试获取更多信息
        if (err.data) {
          addLog(`错误数据: ${err.data}`);
        }
      } else {
        setError('购买代币失败');
        addLog(`购买代币失败: ${err instanceof Error ? err.message : String(err)}`);

        // 如果有交易哈希，添加链接
        if (err.transactionHash) {
          addLog(
            `可以在 Etherscan 上查看失败的交易: https://sepolia.etherscan.io/tx/${err.transactionHash}`,
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 初始化代币合约信息
  const initTokenInfo = async () => {
    if (!ydCoin || !provider) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tokenContract = new Contract(ydCoin, GeekTokenABI.abi, provider);

      // 获取代币基本信息
      const name = await tokenContract.name();
      const symbol = await tokenContract.symbol();
      const totalSupply = await tokenContract.totalSupply();
      const price = await tokenContract.TOKENS_PER_ETH();
      const owner = await tokenContract.owner();

      // 获取合约ETH余额
      const contractBalance = await provider.getBalance(ydCoin);

      // 更新状态
      setTokenName(name);
      setTokenSymbol(symbol);
      setTokenTotalSupply(formatUnits(totalSupply, 0));
      setTokenPrice(formatUnits(price, 18));
      setTokenOwner(owner);
      setContractEthBalance(formatUnits(contractBalance, 18));

      addLog(`代币信息初始化成功: ${name} (${symbol})`);
      addLog(`总供应量: ${formatUnits(totalSupply, 0)}`);
      addLog(`代币价格: ${formatUnits(price, 18)} ETH`);
      addLog(`合约拥有者: ${owner}`);
      addLog(`合约ETH余额: ${formatUnits(contractBalance, 18)} ETH`);
    } catch (err) {
      setError('初始化代币信息失败');
      addLog(`初始化代币信息失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // 转账代币
  const transferTokens = async () => {
    if (!account || !ydCoin || !provider || !transferTo || !transferAmount) {
      setError('请先连接钱包并输入转账地址和金额');
      return;
    }

    if (!transferTo.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('请输入有效的以太坊地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signer = provider.getSigner();
      const tokenContract = new Contract(ydCoin, GeekTokenABI.abi, signer);

      // 执行转账
      const tx = await tokenContract.transfer(transferTo, transferAmount);
      setTxHash(tx.hash);
      addLog(`转账交易已发送: ${tx.hash}`);

      await tx.wait();
      addLog(`转账成功: ${transferAmount} ${tokenSymbol} 到 ${transferTo}`);

      // 更新余额
      getTokenBalance();
    } catch (err) {
      setError('转账失败');
      addLog(`转账失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // 添加课程到市场 - 修复参数问题
  const addCourseToMarket = async () => {
    if (!account || !marketAddress || !provider || !courseName || !web2CourseId) {
      setError('请先连接钱包并填写课程信息');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signer = provider.getSigner();
      const marketContract = new Contract(marketAddress, CourseMarketABI.abi, signer);

      // 检查是否是合约所有者
      const owner = await marketContract.owner();
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('您不是合约所有者，无法添加课程');
      }

      addLog(`准备添加课程到市场: ${courseName} (Web2 ID: ${web2CourseId})`);

      // 修复参数顺序和类型，确保与合约定义匹配
      console.log('coursePrice', coursePrice);
      console.log('web2CourseId', web2CourseId);
      console.log('courseName', courseName);
      console.log('coursePrice1', parseEther(coursePrice));
      console.log('coursePrice2', parseUnits(coursePrice,0));
      const tx = await marketContract.addCourse(
        web2CourseId, // web2CourseId - 第一个参数
        courseName, // name - 第二个参数
        parseUnits(coursePrice,0), // 第二个参数是格式化小数
        {
          gasLimit: 300000,
        },
      );

      setTxHash(tx.hash);
      addLog(`添加课程交易已发送: ${tx.hash}`);

      // 等待交易确认
      addLog('等待交易确认...');
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error('交易执行失败，可能是合约函数调用出错');
      }

      // 尝试从事件中获取课程ID
      const event = receipt.events?.find((e: any) => e.event === 'CourseAdded');
      if (event && event.args) {
        const newCourseId = event.args.courseId.toString();
        setMarketCourseId(newCourseId);
        addLog(`课程添加成功，ID: ${newCourseId}`);
      } else {
        addLog('课程添加成功，但无法获取课程ID');
      }

      // 清空表单
      setCourseName('');
      setCoursePrice('100');
    } catch (error) {
      const err = error as BlockchainError;
      console.error('添加课程错误:', err);

      if (err.code === 'ACTION_REJECTED') {
        setError('用户拒绝了交易');
        addLog('用户拒绝了交易');
      } else {
        setError('添加课程失败');
        addLog(`添加课程失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 购买课程
  const purchaseCourse = async () => {
    if (!account || !marketAddress || !provider) {
      setError('请先连接钱包并输入Web2课程ID');
      return;
    }
    const web2CourseId = '1';

    setLoading(true);
    setError('');

    try {
      const signer = provider.getSigner();
      const marketContract = new Contract(marketAddress, CourseMarketABI.abi, signer);
      const tokenAddress = await marketContract.geekToken();
      const tokenContract = new Contract(tokenAddress, GeekTokenABI.abi, signer);

      // 获取课程ID和价格
      const courseId = await marketContract.web2ToCourseId(web2CourseId);
      if (courseId.toString() === '0') {
        throw new Error(`课程不存在: ${web2CourseId}`);
      }

      const course = await marketContract.courses(courseId);
      const { price } = course;

      addLog(`准备购买课程: ${course.name} (ID: ${courseId}), 价格: ${formatUnits(price, 0)} G`);

      // 检查代币余额
      const balance = await tokenContract.balanceOf(account);
      if (balance.lt(price)) {
        throw new Error(
          `G代币余额不足，需要 ${formatUnits(price, 0)} G，当前余额: ${formatUnits(balance, 0)} G`,
        );
      }

      // 检查授权
      const allowance = await tokenContract.allowance(account, marketAddress);
      if (allowance.lt(price)) {
        // 需要先授权
        addLog('需要授权代币使用权...');
        const approveTx = await tokenContract.approve(marketAddress, price);
        await approveTx.wait();
        addLog('代币授权成功');
      }

      // 购买课程
      const tx = await marketContract.purchaseCourse(web2CourseId, {
        gasLimit: 300000,
      });

      setTxHash(tx.hash);
      addLog(`购买课程交易已发送: ${tx.hash}`);

      // 等待交易确认
      addLog('等待交易确认...');
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error('交易执行失败，可能是合约函数调用出错');
      }

      addLog(`课程购买成功: ${web2CourseId}`);

      // 更新代币余额
      getTokenBalance();
    } catch (error) {
      const err = error as BlockchainError;
      console.error('购买课程错误:', err);

      if (err.code === 'ACTION_REJECTED') {
        setError('用户拒绝了交易');
        addLog('用户拒绝了交易');
      } else {
        setError('购买课程失败');
        addLog(`购买课程失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 验证课程完成
  const verifyCourseCompletion = async () => {
    if (!account || !marketAddress || !provider || !web2CourseId || !studentAddress) {
      setError('请先连接钱包并填写学生地址和Web2课程ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signer = provider.getSigner();
      const marketContract = new Contract(marketAddress, CourseMarketABI.abi, signer);

      // 检查是否是合约所有者
      const owner = await marketContract.owner();
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('您不是合约所有者，无法验证课程完成');
      }

      addLog(`准备验证课程完成: ${web2CourseId}, 学生: ${studentAddress}`);

      // 验证课程完成
      const tx = await marketContract.verifyCourseCompletion(studentAddress, web2CourseId, {
        gasLimit: 500000,
      });

      setTxHash(tx.hash);
      addLog(`验证课程完成交易已发送: ${tx.hash}`);

      // 等待交易确认
      addLog('等待交易确认...');
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error('交易执行失败，可能是合约函数调用出错');
      }

      // 尝试从事件中获取证书ID
      const event = receipt.events?.find((e: any) => e.event === 'CourseCompleted');
      if (event && event.args) {
        const certificateId = event.args.certificateId.toString();
        addLog(`课程完成验证成功，证书ID: ${certificateId}`);
      } else {
        addLog('课程完成验证成功');
      }
    } catch (error) {
      const err = error as BlockchainError;
      console.error('验证课程完成错误:', err);

      if (err.code === 'ACTION_REJECTED') {
        setError('用户拒绝了交易');
        addLog('用户拒绝了交易');
      } else {
        setError('验证课程完成失败');
        addLog(`验证课程完成失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 检查用户是否已购买课程
  const checkUserCourse = async () => {
    if (!provider || !marketAddress) {
      setError('请先输入市场合约地址、Web2课程ID和学生地址');
      return;
    }
    const web2CourseId = '1';
    const studentAddress = account;
    console.log('web2CourseId', web2CourseId);
    console.log('studentAddress', studentAddress);

    setLoading(true);
    setError('');

    try {
      const marketContract = new Contract(marketAddress, CourseMarketABI.abi, provider);

      // 检查用户是否已购买课程
      const hasCourse = await marketContract.hasCourse(studentAddress, web2CourseId);

      addLog(`用户 ${studentAddress} ${hasCourse ? '已购买' : '未购买'} 课程 ${web2CourseId}`);
    } catch (err) {
      setError('检查用户课程失败');
      addLog(`检查用户课程失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // 查询所有课程 - 优化版
  const getAllCourses = async () => {
    if (!provider || !marketAddress) {
      setError('请先输入市场合约地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const marketContract = new Contract(marketAddress, CourseMarketABI.abi, provider);

      // 获取课程总数 (courseCount 是状态变量，不是方法)
      const courseCount = await marketContract.courseCount();
      console.log('courseCount', courseCount);
      const courseCountNumber = courseCount.toNumber();
      addLog(`课程总数: ${courseCountNumber}`);

      // 如果没有课程，直接返回
      if (courseCountNumber === 0) {
        addLog('市场中没有课程');
        setAllCourses([]);
        setLoading(false);
        return;
      }

      // 获取所有课程信息
      const courses = [];

      // 从 1 开始，因为 courseCount 从 1 开始计数
      for (let i = 1; i <= courseCountNumber; i++) {
        try {
          // 使用 courses 映射获取课程信息
          const course = await marketContract.courses(i);

          // 格式化课程信息
          const courseData = {
            id: i,
            web2CourseId: course.web2CourseId,
            name: course.name,
            price: formatUnits(course.price, 0),
            isActive: course.isActive,
            creator: course.creator,
          };

          courses.push(courseData);
          addLog(`获取到课程 #${i}: ${course.name}`);
        } catch (error) {
          const err = error as BlockchainError;
          addLog(`获取课程 #${i} 失败: ${err.message}`);
        }
      }

      setAllCourses(courses);
      addLog(`成功获取 ${courses.length} 个课程`);
    } catch (err) {
      setError('获取所有课程失败');
      addLog(`获取所有课程失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // 当钱包连接状态改变时更新日志和获取余额
  React.useEffect(() => {
    if (account && provider) {
      addLog(`钱包已连接: ${account}`);
      // 添加延迟确保 provider 已完全初始化
      setTimeout(() => {
        getEthBalance();
        getTokenBalance();
      }, 500);
    }
  }, [account, provider]);

  // 当代币地址变化时初始化代币信息
  React.useEffect(() => {
    if (ydCoin && provider) {
      initTokenInfo();
    }
  }, [ydCoin, provider]);


  // 1. 在状态管理部分添加新状态
const [oldWeb2CourseId, setOldWeb2CourseId] = useState<string>('');
const [newWeb2CourseId, setNewWeb2CourseId] = useState<string>('');
const [courseActive, setCourseActive] = useState<boolean>(true);

// 2. 添加updateCourse函数
// 修改课程
const updateCourse = async () => {
  if (!account || !marketAddress || !provider || !courseName || !oldWeb2CourseId || !newWeb2CourseId) {
    setError('请先连接钱包并填写完整的课程信息');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const signer = provider.getSigner();
    const marketContract = new Contract(marketAddress, CourseMarketABI.abi, signer);

    // 检查是否是合约所有者
    const owner = await marketContract.owner();
    if (owner.toLowerCase() !== account.toLowerCase()) {
      throw new Error('您不是合约所有者，无法修改课程');
    }

    addLog(`准备修改课程: 旧ID=${oldWeb2CourseId}, 新ID=${newWeb2CourseId}, 名称=${courseName}`);

    // 执行修改课程操作
    const tx = await marketContract.updateCourse(
      oldWeb2CourseId,
      newWeb2CourseId,
      courseName,
      parseUnits(coursePrice, 0),
      courseActive,
      {
        gasLimit: 300000,
      }
    );

    setTxHash(tx.hash);
    addLog(`修改课程交易已发送: ${tx.hash}`);

    // 等待交易确认
    addLog('等待交易确认...');
    const receipt = await tx.wait();

    if (receipt.status === 0) {
      throw new Error('交易执行失败，可能是合约函数调用出错');
    }

    // 尝试从事件中获取更新信息
    const event = receipt.events?.find((e: any) => e.event === 'CourseUpdated');
    if (event && event.args) {
      const courseId = event.args.courseId.toString();
      addLog(`课程修改成功，ID: ${courseId}`);
    } else {
      addLog('课程修改成功');
    }

    // 清空旧的课程ID输入
    setOldWeb2CourseId('');
    setNewWeb2CourseId('');
  } catch (error) {
    const err = error as BlockchainError;
    console.error('修改课程错误:', err);

    if (err.code === 'ACTION_REJECTED') {
      setError('用户拒绝了交易');
      addLog('用户拒绝了交易');
    } else {
      setError('修改课程失败');
      addLog(`修改课程失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto  rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">智能合约测试页面</h1>

        {/* 钱包连接部分 */}
        <div className="mb-8 p-4 border border-gray-200 rounded-md">
          <h2 className="text-xl font-semibold mb-4">钱包连接</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {!account ? (
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                连接钱包
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                断开连接
              </button>
            )}

            {account && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">已连接:</span>
                <span className="text-sm font-mono  p-1 rounded">
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
              </div>
            )}

            {chainId && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">当前网络:</span>
                <span className="text-sm font-mono p-1 rounded">
                  {chainId === 1
                    ? 'Mainnet'
                    : chainId === 5
                      ? 'Goerli'
                      : chainId === 11155111
                        ? 'Sepolia'
                        : `Chain ID: ${chainId}`}
                </span>
              </div>
            )}
            {/* 获取ETH余额 */}
            {account && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">ETH余额:</span>
                <span className="text-sm font-mono p-1 rounded">
                  {ethBalance ? parseFloat(ethBalance).toFixed(4) : '0'} ETH
                </span>
                <button
                  onClick={getEthBalance}
                  className="ml-2 text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  刷新
                </button>
              </div>
            )}
            {/* 当前代币余额 */}
            {account && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">当前代币余额:</span>
                <span className="text-sm font-mono p-1 rounded">{tokenBalance || '0'} G</span>
              </div>
            )}
          </div>
        </div>

        {/* GeekToken 测试部分 - 增强版 */}
        <div className="mb-8 p-4 border border-gray-200 rounded-md">
          <h2 className="text-xl font-semibold mb-4">GeekToken 测试</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">代币合约地址</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ydCoin}
                onChange={e => setYdCoin(e.target.value)}
                placeholder="输入GeekToken合约地址"
                className="flex-1 p-2 border border-gray-300 rounded "
              />
              <button
                onClick={initTokenInfo}
                disabled={!provider || loading}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
              >
                刷新信息
              </button>
            </div>
          </div>

          {/* 代币信息显示 */}
          {tokenName && (
            <div className="mb-4 p-3 rounded-md">
              <h3 className="text-md font-medium mb-2">代币信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">名称:</span> {tokenName}
                </div>
                <div>
                  <span className="font-medium">符号:</span> {tokenSymbol}
                </div>
                <div>
                  <span className="font-medium">总供应量:</span> {tokenTotalSupply} {tokenSymbol}
                </div>
                <div>
                  <span className="font-medium">代币价格:</span> {tokenPrice} ETH
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">合约ETH余额:</span> {contractEthBalance} ETH
                </div>
                <div className="md:col-span-2 truncate">
                  <span className="font-medium">合约拥有者:</span> {tokenOwner}
                </div>
              </div>
            </div>
          )}

          {/* 读操作 */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">读操作</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={getTokenBalance}
                disabled={!account || loading}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
              >
                查询余额
              </button>

              <button
                onClick={initTokenInfo}
                disabled={!provider || loading}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
              >
                查询合约信息
              </button>
            </div>
          </div>

          {/* 写操作 */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">写操作</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">购买金额(默认100G币)</label>
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={e => setPurchaseAmount(e.target.value)}
                  placeholder="输入购买金额"
                  className="w-full p-2 text-sm border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={buyTokens}
                disabled={!account || loading}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
              >
                购买代币 (自定义金额)
              </button>
            </div>

            {/* 转账功能 */}
            <div className="p-3 border border-gray-200 rounded-md">
              <h4 className="text-sm font-medium mb-2">代币转账</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">接收地址</label>
                  <input
                    type="text"
                    value={transferTo}
                    onChange={e => setTransferTo(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-2 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">转账数量</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    min="1"
                    className="w-full p-2 text-sm border border-gray-300 rounded"
                  />
                </div>
                <button
                  onClick={transferTokens}
                  disabled={!account || loading || !transferTo}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                >
                  转账
                </button>
              </div>
            </div>
          </div>

          {/* 余额显示 */}
          {tokenBalance !== '0' && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <p className="text-sm">
                <span className="font-medium">代币余额:</span> {tokenBalance} {tokenSymbol}
              </p>
            </div>
          )}

          {/* 交易哈希显示 */}
          {txHash && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <p className="text-sm">
                <span className="font-medium">交易哈希:</span>{' '}
                <Link
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {txHash}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* CourseMarket 测试部分 - 修复 */}
        <div className="mb-8 p-4 border border-gray-200 rounded-md">
          <h2 className="text-xl font-semibold mb-4">CourseMarket 测试</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">市场合约地址</label>
            <input
              type="text"
              value={marketAddress}
              onChange={e => setMarketAddress(e.target.value)}
              placeholder="输入CourseMarket合约地址"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* 添加课程到市场 - 表单 */}
          <div className="mt-6 p-3 border border-gray-200 rounded-md">
            <h3 className="text-md font-medium mb-3">添加课程到市场</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Web2课程ID</label>
                <input
                  type="text"
                  value={web2CourseId}
                  onChange={e => setWeb2CourseId(e.target.value)}
                  placeholder="输入Web2课程ID"
                  className="w-full p-2 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">课程名称</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="输入课程名称"
                  className="w-full p-2 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">课程价格 (G代币)</label>
                <input
                  type="number"
                  value={coursePrice}
                  onChange={e => setCoursePrice(e.target.value)}
                  min="0"
                  className="w-full p-2 text-sm border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={addCourseToMarket}
                disabled={!account || loading || !courseName || !web2CourseId || !marketAddress}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 text-sm"
              >
                添加课程到市场
              </button>
            </div>
{/* 修改课程 - 表单 */}
<div className="mt-6 p-3 border border-gray-200 rounded-md">
  <h3 className="text-md font-medium mb-3">修改课程</h3>
  <div className="space-y-3">
    <div>
      <label className="block text-xs text-gray-600 mb-1">旧的Web2课程ID</label>
      <input
        type="text"
        value={oldWeb2CourseId}
        onChange={e => setOldWeb2CourseId(e.target.value)}
        placeholder="输入旧的Web2课程ID"
        className="w-full p-2 text-sm border border-gray-300 rounded"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 mb-1">新的Web2课程ID</label>
      <input
        type="text"
        value={newWeb2CourseId}
        onChange={e => setNewWeb2CourseId(e.target.value)}
        placeholder="输入新的Web2课程ID"
        className="w-full p-2 text-sm border border-gray-300 rounded"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 mb-1">课程名称</label>
      <input
        type="text"
        value={courseName}
        onChange={e => setCourseName(e.target.value)}
        placeholder="输入课程名称"
        className="w-full p-2 text-sm border border-gray-300 rounded"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 mb-1">课程价格 (G代币)</label>
      <input
        type="number"
        value={coursePrice}
        onChange={e => setCoursePrice(e.target.value)}
        min="0"
        className="w-full p-2 text-sm border border-gray-300 rounded"
      />
    </div>
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={courseActive}
        onChange={e => setCourseActive(e.target.checked)}
        className="mr-2"
      />
      <label className="text-xs text-gray-600">课程是否可购买</label>
    </div>
    <button
      onClick={updateCourse}
      disabled={!account || loading || !courseName || !oldWeb2CourseId || !newWeb2CourseId || !marketAddress}
      className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 text-sm"
    >
      修改课程
    </button>
  </div>
</div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">学生地址</label>
            <input
              type="text"
              value={studentAddress}
              onChange={e => setStudentAddress(e.target.value)}
              placeholder="输入学生地址"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={purchaseCourse}
              disabled={!account || loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              购买课程
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">验证课程完成</label>
            <button
              onClick={verifyCourseCompletion}
              disabled={!account || loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              验证课程完成
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">检查用户课程</label>
            <button
              onClick={checkUserCourse}
              disabled={!account || loading}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
            >
              检查用户课程
            </button>
          </div>

          {/* 课程信息显示 */}
          {marketCourseInfo && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <h3 className="text-md font-medium mb-2">课程信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">课程ID:</span> {marketCourseId}
                </div>
                <div>
                  <span className="font-medium">课程名称:</span> {marketCourseInfo.name}
                </div>
                <div>
                  <span className="font-medium">课程描述:</span> {marketCourseInfo.description}
                </div>
                <div>
                  <span className="font-medium">课程价格:</span> {marketCourseInfo.price} ETH
                </div>
                <div>
                  <span className="font-medium">课程状态:</span>{' '}
                  {marketCourseInfo.active ? '活跃' : '不活跃'}
                </div>
                <div>
                  <span className="font-medium">课程拥有者:</span> {marketCourseInfo.owner}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 查询所有课程 */}
        <div className="mb-8 p-4 border border-gray-200 rounded-md">
          <h2 className="text-xl font-semibold mb-4">查询所有课程</h2>
          <button
            onClick={getAllCourses}
            disabled={!account || loading || !marketAddress}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            查询所有课程
          </button>
          {allCourses.length > 0 && (
            <div className="mt-4 p-3 rounded-md">
              <h3 className="text-md font-medium mb-2">课程列表</h3>
              <div className="space-y-2">
                {allCourses.map((course, index:number) => (
                  <div key={index} className="text-sm">
                    {course.name} - {course.price} G
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 日志和错误显示 */}
        <div className="mt-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <h3 className="text-lg font-medium mb-2">操作日志</h3>
          <div className=" p-3 rounded-md h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">暂无日志</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm mb-1 font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 包装组件以提供 Web3React 上下文
export default function TestContractsPage() {
  return (
    <Web3ReactProvider connectors={[[metaMask, metaMaskHooks]]}>
      <ContractTestPage />
    </Web3ReactProvider>
  );
}

export const runtime = 'edge';