'use client';

import React, { useState, useEffect } from 'react';
import LanguageSwitcher from '@components/language/Switcher';
import { useLanguage } from '@components/language/Context';
import {CustomConnectButton} from '@components/wallet/CustomConnectButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [glitchLogo, setGlitchLogo] = useState(false);
  
  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // 随机添加闪烁效果
    const glitchInterval = setInterval(() => {
      setGlitchLogo(true);
      setTimeout(() => setGlitchLogo(false), 150);
    }, 7000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(glitchInterval);
    };
  }, []);
  
  // 判断当前路径是否激活
  const isActive = (path: string) => pathname === path;
  
  return (
    <header className={`bg-darker-bg border-b border-neon-blue border-opacity-30 sticky top-0 z-20 transition-all duration-300 ${isScrolled ? 'shadow-lg shadow-neon-blue/10' : ''}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左侧: Logo + 导航链接 */}
          <div className="flex items-center space-x-8">
            {/* Logo 部分 */}
            <Link href="/" className={`flex items-center space-x-3 flex-shrink-0 ${glitchLogo ? 'cyberpunk-glitch' : ''}`}>
              <div className="flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect width="40" height="40" rx="8" fill="#0d0221" />
                  <rect width="38" height="38" rx="7" x="1" y="1" fill="none" stroke="#05d9e8" strokeWidth="1" />
                  <path d="M10 15L20 10L30 15L20 20L10 15Z" fill="#d300c5" />
                  <path d="M15 18V25L20 27.5L25 25V18" stroke="#05d9e8" strokeWidth="1.5" />
                  <path d="M20 20V27.5" stroke="#05d9e8" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <span className="cyberpunk-title text-xl" >Web3 Garden</span>
              </div>
            </Link>

            {/* 导航链接 - 移到左侧和Logo在一起 */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/"
                className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  isActive('/') 
                    ? 'text-neon-blue border-neon-blue' 
                    : 'text-gray-400 border-transparent hover:text-indigo-600'
                }`}
              >
                {t('nav.home') || 'home'}
              </Link>
              <Link 
                href="/knowledge"
                className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  isActive('/knowledge') 
                    ? 'text-neon-blue border-neon-blue' 
                    : 'text-gray-400 border-transparent hover:text-indigo-600'
                }`}
              >
                {t('nav.knowledgeBase') || '知识库'}
              </Link>
              {/* <Link 
                href="/videos"
                className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  isActive('/videos') 
                    ? 'text-neon-blue border-neon-blue' 
                    : 'text-gray-400 border-transparent hover:text-indigo-600'
                }`}
              >
                {t('nav.videos') || '视频'}
              </Link> */}
              <Link 
                href="/market"
                className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  isActive('/market') 
                    ? 'text-neon-blue border-neon-blue' 
                    : 'text-gray-400 border-transparent hover:text-indigo-600'
                }`}
              >
                {t('nav.market') || '模拟市场'}
              </Link>
            </nav>
          </div>

          {/* 右侧操作区: 语言切换 + 自定义连接钱包按钮 */}
          <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
            <LanguageSwitcher />
            <div className="rounded-md">
              <CustomConnectButton />
            </div>
          </div>

          {/* 移动端菜单按钮 - 仅在小屏幕显示 */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="打开导航菜单"
              className="inline-flex items-center justify-center p-2 rounded-md text-neon-blue hover:text-neon-pink focus:outline-none"
            >
              {isMenuOpen ? (
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* 移动端菜单下拉 */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-neon-blue border-opacity-20">
            <Link 
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'bg-neon-blue bg-opacity-10 text-neon-blue' 
                  : 'text-gray-400 hover:bg-dark-bg hover:text-neon-pink'
              }`}
            >
              {t('nav.home') || 'home'}
            </Link>
            <Link 
              href="/knowledge"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/knowledge') 
                  ? 'bg-neon-blue bg-opacity-10 text-neon-blue' 
                  : 'text-gray-400 hover:bg-dark-bg hover:text-neon-pink'
              }`}
            >
              {t('nav.knowledgeBase') || '知识库'}
            </Link>
            <Link 
              href="/videos"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/videos') 
                  ? 'bg-neon-blue bg-opacity-10 text-neon-blue' 
                  : 'text-gray-400 hover:bg-dark-bg hover:text-neon-pink'
              }`}
            >
              {t('nav.videos') || '视频'}
            </Link>
            <Link 
              href="/market"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/market') 
                  ? 'bg-neon-blue bg-opacity-10 text-neon-blue' 
                  : 'text-gray-400 hover:bg-dark-bg hover:text-neon-pink'
              }`}
            >
              {t('nav.market') || '模拟市场'}
            </Link>
            <div className="pt-4 pb-2 border-t border-neon-blue border-opacity-20">
              <div className="flex items-center justify-between">
                <LanguageSwitcher />
                <div className="cyberpunk-border rounded-md">
                  <CustomConnectButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;