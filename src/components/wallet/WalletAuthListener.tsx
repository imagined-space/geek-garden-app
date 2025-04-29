'use client';

import { useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { toast } from 'react-hot-toast';
import { useAtom } from 'jotai';
import { isAuthenticatedAtom, walletAddressAtom, syncWalletStateAtom } from '@/stores/walletStore';
import useWeb3Auth from '@/hooks/useWeb3Login';
import { useCourseContract } from '@/hooks/useCourseContract';

const WalletAuthListener = () => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { login, isLoggedIn, isLoading, error } = useWeb3Auth();
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [storedAddress] = useAtom(walletAddressAtom);
  const [, syncWalletState] = useAtom(syncWalletStateAtom);
  const {getUserCourses } = useCourseContract();

  // 在监听钱包状态变化的 useEffect 中添加防抖处理
  useEffect(() => {
    // Initialize with undefined and use a more compatible type
    let syncTimer: ReturnType<typeof setTimeout> | undefined;

    if (isConnected && address) {
      console.log('【钱包监听器】检测到钱包已连接:', address);
      // 获取用户课程
      getUserCourses(address);
      // 使用防抖处理避免页面切换时出现状态抖动
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncWalletState({ connected: true, address, chainId });
      }, 150);
    } else if (!isConnected) {
      console.log('【钱包监听器】检测到钱包已断开');
      // 断开连接时也需要防抖
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncWalletState({ connected: false, address: '' });
      }, 150);
    }

    return () => {
      if (syncTimer) clearTimeout(syncTimer);
    };
  }, [isConnected, address, chainId, syncWalletState]);

  // Monitor auth state
  useEffect(() => {
    setIsAuthenticated(!!isLoggedIn);
  }, [isLoggedIn, setIsAuthenticated]);

  // Handle automatic login when wallet is connected but not authenticated
  useEffect(() => {
    // Only attempt login if:
    // 1. Wallet is connected
    // 2. We have an address
    // 3. User is not already logged in
    // 4. Not currently loading
    // 5. We haven't tried to authenticate with this address yet
    const shouldAttemptLogin =
      isConnected &&
      address &&
      !isLoggedIn &&
      !isLoading &&
      address === storedAddress &&
      !isAuthenticated;

    if (shouldAttemptLogin) {
      console.log('【钱包监听器】尝试自动登录...');
      // Display loading toast
      const loadingToast = toast.loading('正在准备登录...');

      // Attempt login
      login()
        .then(user => {
          if (user) {
            toast.success('登录成功！');
            setIsAuthenticated(true);
            console.log('用户已登录:', user);
          } else {
            toast.error('登录失败，请手动尝试登录');
            console.error('登录返回结果为空');
            setIsAuthenticated(false);
          }
        })
        .catch(err => {
          toast.error(`登录失败: ${err?.message || '未知错误'}`);
          console.error('登录出错:', err);
          setIsAuthenticated(false);
        })
        .finally(() => {
          // Dismiss loading toast
          toast.dismiss(loadingToast);
        });
    }
  }, [
    isConnected,
    address,
    isLoggedIn,
    isLoading,
    storedAddress,
    isAuthenticated,
    login,
    setIsAuthenticated,
  ]);

  // Display error messages
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // This component doesn't render anything
  return null;
};

export default WalletAuthListener;
