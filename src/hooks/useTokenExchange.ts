import { useState, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import {
  useAccount,
  useBalance,
  useWriteContract,
  useChainId,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useReadContract,
} from 'wagmi';
import { toast } from 'react-hot-toast';
import { sepolia } from 'wagmi/chains';
import { getContractAddress } from '@/config/contracts';
import GeekTokenABI from '@/contracts/abis/GeekToken.json';

export const useTokenExchange = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);

  // 获取当前网络的合约地址
  const contractAddress = chainId ? getContractAddress(chainId).GEEK_TOKEN : null;

  // 获取用户 ETH 余额
  const { data: ethBalanceData, refetch: refetchEthBalance } = useBalance({ address });
  const ethBalance = ethBalanceData
    ? parseFloat(formatEther(ethBalanceData.value)).toFixed(4)
    : '0.0000';

  // 读取 YiDeng 代币余额
  const { data: ydBalance, refetch: refetchYdBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: GeekTokenABI.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // 读取代币兑换比率（暂未使用）
  const { data } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: GeekTokenABI.abi,
    functionName: 'TOKENS_PER_ETH',
  });

  // 合约写入函数
  const { writeContract, isPending, data: hash } = useWriteContract();

  // 监听交易状态
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // 检查是否在 Sepolia 测试网
  const isCorrectNetwork = chainId === sepolia.id;

  // 监听交易成功并刷新余额
  useEffect(() => {
    if (isSuccess) {
      // 延迟一段时间后刷新余额，给区块链一些时间来更新状态
      const timer = setTimeout(async () => {
        await refetchEthBalance();
        await refetchYdBalance();
        setAmount('');
      }, 2000);

      return () => clearTimeout(timer);
    }
    return () => {};
  }, [isSuccess, refetchEthBalance, refetchYdBalance]);

  // 切换网络处理函数
  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: sepolia.id });
    }
    return undefined; // 显式返回值，解决consistent-return问题
  };

  // 交易处理函数
  const handleTransaction = async () => {
    if (!address || !contractAddress || !amount) {
      return;
    }

    try {
      if (isBuying) {
        // 购买G代币
        await writeContract({
          address: contractAddress as `0x${string}`,
          abi: GeekTokenABI.abi,
          functionName: 'buyWithETH',
          value: parseEther(amount),
        });
        toast.success('Redeem Successful');
      } else {
        // 检查用户代币余额
        const userBalance = ydBalance ? BigInt(ydBalance.toString()) : BigInt(0);
        const amountToSell = BigInt(amount);

        if (userBalance < amountToSell) {
          toast.error(`G代币余额不足，当前余额: ${userBalance.toString()} G`);
          return;
        }

        // 出售G代币
        await writeContract({
          address: contractAddress as `0x${string}`,
          abi: GeekTokenABI.abi,
          functionName: 'sellTokens',
          args: [amountToSell],
        });
        toast.success('Redeem Successful');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes('insufficient funds')) {
        toast.error('ETH余额不足');
      } else if (err.message?.includes('execution reverted')) {
        toast.error('交易被拒绝，可能是合约余额不足或网络问题');
      } else {
        toast.error(`交易失败: ${err.message || '未知错误'}`);
      }
    }
  };

  return {
    address,
    isConnected,
    amount,
    setAmount,
    isBuying,
    setIsBuying,
    ethBalance,
    ydBalance,
    isCorrectNetwork,
    isPending,
    isConfirming,
    contractAddress,
    handleSwitchNetwork,
    handleTransaction,
  };
};
