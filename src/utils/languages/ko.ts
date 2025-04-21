import { TranslationDict } from './types';

const koTranslations: TranslationDict = {
  // 헤더
  'nav.home': '홈',
  'nav.knowledgeBase': '지식 베이스',
  'nav.videos': '비디오',
  'nav.market': '시뮬레이션 마켓',
  'button.connectWallet': '지갑 연결',

  // 히어로 섹션
  'hero.welcome': 'Web3 University에 오신 것을 환영합니다',
  'hero.subtitle': '최첨단 블록체인 지식을 탐색하고 전문 기술을 향상시키세요',

  // 추천 코스
  'courses.title': '추천 코스',
  'courses.subtitle': '기초부터 고급까지, 우리는 포괄적인 블록체인 기술 교육을 제공합니다',
  'courses.level.beginner': '초급',
  'courses.level.intermediate': '중급',
  'courses.level.advanced': '고급',
  'courses.blockchain.title': '블록체인 기초',
  'courses.blockchain.desc': '블록체인 기술의 기본 개념, 역사 및 응용 프로그램 이해',
  'courses.smartContract.title': '스마트 계약 개발',
  'courses.smartContract.desc': 'Solidity를 사용하여 스마트 계약을 개발하고 배포하는 방법 학습',
  'courses.defi.title': 'DeFi 프로토콜 분석',
  'courses.defi.desc': 'DeFi 프로토콜 아키텍처, 위험 관리 및 투자 전략에 대한 심층 분석',
  'courses.lessons': '강의',
  'courses.learnMore': '더 알아보기',
  'courses.viewAll': '모든 코스 보기',

  // 통계
  'stats.title': '우리의 성과',
  'stats.subtitle': '블록체인 교육 분야에 지속적으로 기여',
  'stats.students': '학생',
  'stats.courses': '코스',
  'stats.instructors': '강사',
  'stats.employmentRate': '취업률',

  // 학생 후기
  'testimonials.title': '학생 후기',
  'testimonials.subtitle': '우리 학생들의 이야기를 들어보세요',

  // 파트너
  'partners.title': '파트너',
  'partners.subtitle': '업계 선도적인 블록체인 기업 및 기관과 협력',

  // 푸터
  'footer.about': '회사 소개',
  'footer.aboutDesc':
    'Web3 University는 블록체인 교육에 중점을 둔 온라인 학습 플랫폼으로, 블록체인 분야의 전문가 양성에 전념하고 있습니다.',
  'footer.quickLinks': '빠른 링크',
  'footer.home': '홈',
  'footer.courses': '코스',
  'footer.contact': '문의하기',
  'footer.contactInfo': '연락처 정보',
  'footer.email': '이메일: info@ydu.edu',
  'footer.phone': '전화: (123) 456-7890',
  'footer.address': '주소: 베이징시 하이디안구 중관춘',
  'footer.followUs': '팔로우하기',
  'footer.copyright': '© 2025 Web3 University. 모든 권리 보유.',

  // 언어 선택
  'language.zh': '중국어',
  'language.en': '영어',
  'language.ja': '일본어',
  'language.ko': '한국어',

  // 지식 베이스 페이지
  'kb.title': '블록체인 지식 베이스',
  'kb.subtitle': '초보자부터 전문가까지, 가장 포괄적인 블록체인 기술 리소스 라이브러리 탐색',
  'kb.searchPlaceholder': '기사, 태그 또는 키워드 검색...',
  'kb.categories': '기사 카테고리',
  'kb.allCategories': '모든 카테고리',
  'kb.category.blockchain': '블록체인 기초',
  'kb.category.smartContracts': '스마트 계약',
  'kb.category.defi': '탈중앙화 금융',
  'kb.category.nft': '대체 불가능 토큰',
  'kb.category.security': '보안 및 개인 정보',
  'kb.popularTags': '인기 태그',
  'kb.readTime': '분 읽기',
  'kb.readMore': '더 읽기',
  'kb.noResults': '일치하는 기사를 찾을 수 없습니다',
  'kb.tryAdjusting': '검색 기준을 조정하거나 다른 카테고리를 선택해 보세요',
  'kb.clearFilters': '필터 지우기',
  'kb.stayUpdated': '최신 정보 유지',
  'kb.newsletterDesc': '뉴스레터를 구독하여 최신 블록체인 기술 및 산업 동향 받기',
  'kb.emailPlaceholder': '이메일 주소 입력',
  'kb.subscribe': '구독',

  // 마켓 페이지
  'market.title': '시뮬레이션 마켓',
  'market.subtitle':
    '실제 재정적 위험 없이 시뮬레이션 환경에서 암호화폐 시장 운영을 배우세요. 실시간 시장 데이터를 추적하고 거래 전략을 테스트해보세요.',

  // 차트 컴포넌트
  'chart.open': '시가',
  'chart.close': '종가',
  'chart.high': '고가',
  'chart.low': '저가',
  'chart.volume': '거래량',
  'chart.change': '변동률',
  'chart.marketCap': '시가총액',
  'chart.24hVol': '24시간 거래량',

  // Token Exchange
  'tokenExchange.title': '토큰 교환',
  'tokenExchange.connectWallet': '거래하려면 지갑을 연결하세요',
  'tokenExchange.switchNetwork': 'Sepolia 테스트넷으로 전환하세요',
  'tokenExchange.switchToSepolia': 'Sepolia로 전환',
  'tokenExchange.buyYD': 'YD 토큰 구매',
  'tokenExchange.exchangeETH': 'ETH 교환',
  'tokenExchange.ethBalance': 'ETH 잔액',
  'tokenExchange.ydBalance': 'YD 잔액',
  'tokenExchange.ethAmount': 'ETH 수량',
  'tokenExchange.ydAmount': 'YD 수량',
  'tokenExchange.estimated': '예상 수령량',
  'tokenExchange.confirm': '확인',
  'tokenExchange.confirming': '확인 중...',
  'tokenExchange.processing': '처리 중...',
};

export default koTranslations;
