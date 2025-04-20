'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAtom } from 'jotai';
import { walletConnectedAtom } from '@/stores/walletStore';
import { useTokenExchange } from '@/hooks/useTokenExchange';
import { useLanguage } from '@/components/language/Context';
import CountUp from '@/components/ui/CountUp';

// 提取NeonCard组件
const NeonCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative p-6 rounded-xl bg-transparent border border-[#00ffff] shadow-lg transition-all duration-300 hover:border-[#ff00ff] group w-full mb-6">
    <div className="absolute inset-0 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.3)]"></div>
    <div className="relative z-10">{children}</div>
  </div>
);

// 提取NeonButton组件
const NeonButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled = false, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative px-8 py-2 rounded-md bg-transparent border transition-all duration-300
      ${
        disabled
          ? 'border-gray-600 text-gray-500 opacity-50 cursor-not-allowed'
          : 'border-[#3d0050] text-[#ff00ff] hover:border-[#ff00ff]'
      }`}
  >
    <span className="relative z-10">{children}</span>
  </button>
);

// 移除全局样式，使用styled-jsx
const NumberInputStyles = () => (
  <style jsx global>{`
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type='number'] {
      -moz-appearance: textfield;
    }
  `}</style>
);

// 获取按钮文本辅助函数
const getButtonText = (
  isPending: boolean,
  isConfirming: boolean,
  t: (key: string) => string,
): string => {
  if (isPending) {
    return t('tokenExchange.confirming');
  }
  if (isConfirming) {
    return t('tokenExchange.processing');
  }
  return t('tokenExchange.confirm');
};

// 计算估算值辅助函数
const calculateEstimatedValue = (amount: string, isBuying: boolean): string => {
  if (!amount) {
    return '0';
  }

  const numAmount = Number(amount);
  if (isBuying) {
    return (numAmount * 1000).toFixed(0);
  }
  return (numAmount / 1000).toFixed(3);
};

// 主组件
export const TokenExchange: React.FC = () => {
  const [walletConnected] = useAtom(walletConnectedAtom);
  const { t } = useLanguage();
  const {
    address,
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
  } = useTokenExchange();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(e.target.value);
    },
    [setAmount],
  );

  const handleConfirmClick = useCallback(() => {
    handleTransaction();
  }, [handleTransaction]);

  // 计算估算值
  const estimatedValue = calculateEstimatedValue(amount, isBuying);

  // 按钮是否禁用
  const isButtonDisabled = isPending || isConfirming || !amount || !address || !contractAddress;

  // 渲染未连接钱包状态
  if (!walletConnected) {
    return null;
  }

  // 渲染网络不正确状态
  if (!isCorrectNetwork) {
    return (
      <NeonCard>
        <h2 className="text-2xl font-bold text-white mb-6">{t('tokenExchange.title')}</h2>
        <p className="text-gray-300 mb-6">{t('tokenExchange.switchNetwork')}</p>
        <div className="flex justify-center">
          <NeonButton onClick={handleSwitchNetwork}>
            {t('tokenExchange.switchToSepolia')}
          </NeonButton>
        </div>
      </NeonCard>
    );
  }

  // 渲染主界面
  return (
    <NeonCard>
      <h2 className="text-4xl font-bold text-white mb-6">
        {isBuying ? t('tokenExchange.buyYD') : t('tokenExchange.exchangeETH')}
      </h2>

      <div className="flex justify-between items-center mb-6">
        {isBuying ? (
          <>
            <div className="text-gray-300">
              <p>
                {t('tokenExchange.ethBalance')}{' '}
                <CountUp
                  to={Number(ethBalance)}
                  duration={1}
                  separator=","
                  className="text-[#00ffff]"
                  decimalPlaces={4}
                />
              </p>
            </div>
            <button
              onClick={() => {
                setIsBuying(!isBuying);
                setAmount('');
              }}
              className="text-[#00ffff] mx-4 hover:text-[#ff00ff] transition-all duration-300 text-2xl group-hover:text-[#ff00ff]"
            >
              ⇄
            </button>
            <div className="text-gray-300">
              <p>
                {t('tokenExchange.ydBalance')}{' '}
                <CountUp
                  to={ydBalance ? parseInt(ydBalance.toString(), 10) : 0}
                  duration={1}
                  separator=","
                  className="text-[#00ffff]"
                />
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-gray-300">
              <p>
                {t('tokenExchange.ydBalance')}{' '}
                <CountUp
                  to={ydBalance ? parseInt(ydBalance.toString(), 10) : 0}
                  duration={1}
                  separator=","
                  className="text-[#00ffff]"
                />
              </p>
            </div>
            <button
              onClick={() => {
                setIsBuying(!isBuying);
                setAmount('');
              }}
              className="text-[#00ffff] mx-4 hover:text-[#ff00ff] transition-all duration-300 text-2xl group-hover:text-[#ff00ff]"
            >
              ⇄
            </button>
            <div className="text-gray-300">
              <p>
                {t('tokenExchange.ethBalance')}{' '}
                <CountUp
                  to={Number(ethBalance)}
                  duration={1}
                  separator=","
                  className="text-[#00ffff]"
                  decimalPlaces={4}
                />
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex items-center">
          <label htmlFor="amount-input" className="block text-gray-300 whitespace-nowrap text-2xl">
            {isBuying ? t('tokenExchange.ethAmount') : t('tokenExchange.ydAmount')}
          </label>
          <div className="relative flex items-center">
            <input
              id="amount-input"
              type="number"
              value={amount}
              onChange={handleInputChange}
              step={isBuying ? 0.01 : 10}
              min="0"
              className="p-2 ml-4 rounded bg-transparent text-white border border-[#00ffff] focus:outline-none focus:border-[#ff00ff] transition-all duration-300 group-hover:border-[#ff00ff] shadow-[0_0_10px_rgba(0,255,255,0.1)] group-hover:shadow-[0_0_10px_rgba(255,0,255,0.1)]"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
              }}
              aria-label={isBuying ? t('tokenExchange.ethAmount') : t('tokenExchange.ydAmount')}
            />
          </div>
          <NumberInputStyles />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-[#00ffff] group-hover:text-[#ff00ff] transition-colors duration-300">
          {t('tokenExchange.estimated')}: {estimatedValue} {isBuying ? 'YD' : 'ETH'}
        </p>
        <NeonButton onClick={handleConfirmClick} disabled={isButtonDisabled}>
          {getButtonText(isPending, isConfirming, t)}
        </NeonButton>
      </div>
    </NeonCard>
  );
};
