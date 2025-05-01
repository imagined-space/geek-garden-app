'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@components/language/Context';

// 定义知识库文章类型
interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  readTime: number;
  publishDate: string;
  author: string;
  image?: string;
}

const KnowledgeBasePage = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [glitchEffect, setGlitchEffect] = useState(false);

  // Apply glitch effect periodically
  useEffect(() => {
    // Random glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 200);
    }, 5000);

    return () => {
      clearInterval(glitchInterval);
    };
  }, []);

  // 知识库分类
  const categories = [
    { id: 'all', name: t('kb.allCategories') },
    { id: 'blockchain-basics', name: t('kb.category.blockchain') },
    { id: 'smart-contracts', name: t('kb.category.smartContracts') },
    { id: 'defi', name: t('kb.category.defi') },
    { id: 'nft', name: t('kb.category.nft') },
    { id: 'security', name: t('kb.category.security') },
  ];

  // 模拟知识库文章数据
  const articles: Article[] = [
    {
      id: 'blockchain-intro',
      title: '区块链技术入门指南',
      description:
        '了解区块链的基本概念、工作原理以及为何它被认为是颠覆性技术。适合初学者的详细介绍。',
      category: 'blockchain-basics',
      tags: ['blockchain', 'beginner'],
      readTime: 5,
      publishDate: '2025-02-10',
      author: 'Alex Chen',
    },
    {
      id: 'ethereum-explained',
      title: '以太坊完全解析',
      description:
        '深入了解以太坊网络的架构、智能合约功能以及它如何支持去中心化应用（DApps）开发。',
      category: 'blockchain-basics',
      tags: ['ethereum', 'smart-contracts'],
      readTime: 8,
      publishDate: '2025-01-15',
      author: 'Maya Rodriguez',
    },
    {
      id: 'solidity-guide',
      title: 'Solidity编程指南',
      description: '学习如何使用Solidity语言编写、测试和部署智能合约。包含实用代码示例和最佳实践。',
      category: 'smart-contracts',
      tags: ['solidity', 'development', 'ethereum'],
      readTime: 12,
      publishDate: '2025-01-28',
      author: 'David Kim',
    },
    {
      id: 'defi-protocols',
      title: 'DeFi协议比较分析',
      description: '比较当前领先的去中心化金融协议，包括借贷平台、去中心化交易所和收益聚合器。',
      category: 'defi',
      tags: ['defi', 'finance', 'yield-farming'],
      readTime: 10,
      publishDate: '2025-02-05',
      author: 'Sarah Johnson',
    },
    {
      id: 'nft-marketplaces',
      title: 'NFT市场完全指南',
      description: '探索NFT生态系统、主要市场平台、创建与交易NFT的方法，以及未来发展趋势。',
      category: 'nft',
      tags: ['nft', 'digital-art', 'marketplaces'],
      readTime: 7,
      publishDate: '2025-02-18',
      author: 'Michael Wang',
    },
    {
      id: 'security-best-practices',
      title: '区块链安全最佳实践',
      description: '保护您的加密资产的关键策略，包括钱包安全、智能合约审计和防范常见的攻击方式。',
      category: 'security',
      tags: ['security', 'best-practices', 'wallet-safety'],
      readTime: 9,
      publishDate: '2025-02-12',
      author: 'Elena Petrova',
    },
  ];

  // 根据搜索和分类筛选文章
  const filteredArticles = articles.filter(article => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // 格式化日期
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <section>
      {/* 知识库页面头部 */}
      <section className="relative bg-dark-bg text-white cyberpunk-overlay">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1
              className={`cyberpunk-title text-3xl md:text-4xl font-bold mb-4 ${glitchEffect ? 'cyberpunk-glitch' : ''}`}
              data-text={t('kb.title')}
            >
              {t('kb.title')}
            </h1>
            <p className="text-lg text-neon-blue mb-8 cyberpunk-glow">{t('kb.subtitle')}</p>

            {/* 搜索框 */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                className="w-full px-4 py-3 pr-10 rounded-md bg-darker-bg border border-neon-blue text-white focus:outline-none focus:ring-2 focus:ring-neon-pink"
                placeholder={t('kb.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <svg
                className="absolute right-3 top-3 h-6 w-6 text-neon-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 斜线分隔符 */}
        <div className="h-16 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, var(--dark-bg) 0%, var(--dark-bg) 50%, var(--darker-bg) 50%, var(--darker-bg) 100%)',
              boxShadow: '0 -10px 20px rgba(5, 217, 232, 0.1)',
            }}
          ></div>
        </div>
      </section>

      {/* 主体内容区域 */}
      <section className="py-12 bg-darker-bg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* 侧边栏分类 */}
            <div className="lg:col-span-3">
              <div className="cyberpunk-card p-6 sticky top-24">
                <h3 className="text-lg font-medium text-neon-blue mb-4">{t('kb.categories')}</h3>
                <ul className="space-y-2">
                  {categories.map(category => (
                    <li key={category.id}>
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-neon-blue bg-opacity-20 text-neon-blue'
                            : 'text-gray-400 hover:bg-darker-bg hover:text-neon-pink'
                        }`}
                      >
                        {category.name}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <h3 className="text-lg font-medium text-neon-blue mb-4">{t('kb.popularTags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {['blockchain', 'ethereum', 'defi', 'nft', 'security', 'solidity'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-neon-purple bg-opacity-20 text-neon-purple hover:bg-neon-pink hover:bg-opacity-30 hover:text-white"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 文章列表 */}
            <div className="lg:col-span-9 mt-8 lg:mt-0">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map(article => (
                    <article
                      key={article.id}
                      className="cyberpunk-card rounded-lg overflow-hidden transition-transform hover:translate-y-[-4px]"
                    >
                      {article.image ? (
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center relative overflow-hidden">
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage:
                                'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                              backgroundSize: '20px 20px',
                            }}
                          ></div>
                          <svg
                            className="h-16 w-16 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-center text-sm text-neon-green mb-3">
                          <span>{formatDate(article.publishDate)}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {article.readTime} {t('kb.readTime')}
                          </span>
                        </div>

                        <h2 className="text-xl font-semibold text-white mb-2 hover:text-neon-blue transition-colors">
                          <Link href={`/kb/${article.id}`} className="block">
                            {article.title}
                          </Link>
                        </h2>

                        <p className="text-gray-400 mb-4 line-clamp-3">{article.description}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-neon-purple rounded-full flex items-center justify-center text-white font-semibold">
                              {article.author.charAt(0)}
                            </div>
                            <span className="ml-2 text-sm text-gray-400">{article.author}</span>
                          </div>

                          <Link
                            href={`/kb/${article.id}`}
                            className="text-sm font-medium text-neon-pink hover:text-neon-blue"
                          >
                            {t('kb.readMore')} →
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-neon-blue"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-white">{t('kb.noResults')}</h3>
                    <p className="mt-1 text-gray-400">{t('kb.tryAdjusting')}</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="mt-4 text-neon-blue hover:text-neon-pink font-medium"
                    >
                      {t('kb.clearFilters')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 订阅区块 */}
      <section className="bg-dark-bg py-12 border-t border-neon-blue border-opacity-20 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="cyberpunk-title text-2xl font-bold text-white mb-4"
              data-text={t('kb.stayUpdated')}
            >
              {t('kb.stayUpdated')}
            </h2>
            <p className="text-gray-400 mb-6">{t('kb.newsletterDesc')}</p>
            <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
              <input
                type="email"
                className="px-4 py-2 rounded-md bg-darker-bg text-white border border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-pink"
                placeholder={t('kb.emailPlaceholder')}
              />
              <button className="cyberpunk-button px-6 py-2 rounded-md">{t('kb.subscribe')}</button>
            </div>
          </div>
        </div>

        {/* 背景装饰 */}
        <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-full">
          <div
            className="h-64 w-full"
            style={{
              background: 'radial-gradient(circle, var(--neon-blue) 0%, rgba(13, 2, 33, 0) 70%)',
              opacity: '0.15',
            }}
          ></div>
        </div>
      </section>
    </section>
  );
};

export default KnowledgeBasePage;

export const runtime = 'edge';