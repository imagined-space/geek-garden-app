// 引入测试环境所需的扩展
import '@testing-library/jest-dom';

// 模拟 next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    prefetch: jest.fn(),
    pathname: '',
  }),
  usePathname: jest.fn().mockReturnValue('/'),
}));

// 模拟 next/link - 不使用 JSX 语法
jest.mock('next/link', () => {
  // 返回一个函数而不是直接使用 JSX
  return function LinkComponent(props) {
    return {
      type: 'a',
      props: {
        ...props,
        href: props.href || '',
      },
    };
  };
});

// 模拟 jotai
jest.mock('jotai', () => {
  const actualJotai = jest.requireActual('jotai');

  // 创建一个包含init属性的atom
  const mockAtom = init => {
    const atom = actualJotai.atom(init);
    atom.init = init;

    // 添加 name 属性方便测试识别
    Object.defineProperty(atom, 'name', {
      value: 'mockAtom',
      writable: true,
    });

    return atom;
  };

  return {
    ...actualJotai,
    atom: mockAtom,
    useAtom: jest.fn().mockImplementation(atom => {
      return [atom.init || null, jest.fn()];
    }),
  };
});

// 模拟 Web Worker
class MockWorker {
  onmessage = null;
  postMessage = jest.fn();

  constructor() {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            type: 'particles',
            data: [
              {
                size: 10,
                distance: 20,
                duration: 2,
                opacity: 0.5,
                delay: 0.1,
                direction: 45,
                color: 0,
              },
            ],
          },
        });
      }
    }, 50);
  }

  terminate = jest.fn();
}

// @ts-ignore
window.Worker = MockWorker;

// 模拟 window.fs.readFile
Object.defineProperty(window, 'fs', {
  value: {
    readFile: jest.fn().mockResolvedValue(new Uint8Array()),
  },
  writable: true,
});

// 模拟 ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// 模拟 OGL
jest.mock('ogl', () => {
  return {
    Renderer: jest.fn().mockImplementation(() => ({
      gl: {
        canvas: document.createElement('canvas'),
        clearColor: jest.fn(),
      },
      setSize: jest.fn(),
      render: jest.fn(),
    })),
    Program: jest.fn().mockImplementation(() => ({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: { set: jest.fn() } },
        hue: { value: 0 },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: 0 },
        precomputedColors: { value: new Float32Array(9) },
      },
      remove: jest.fn(),
    })),
    Mesh: jest.fn().mockImplementation(() => ({
      geometry: { remove: jest.fn() },
      program: { remove: jest.fn() },
      setParent: jest.fn(),
    })),
    Triangle: jest.fn(),
    Vec3: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
    })),
  };
});

// 先模拟 lightweight-charts
const mockLightweightCharts = {
  createChart: jest.fn().mockImplementation(() => ({
    applyOptions: jest.fn(),
    addSeries: jest.fn().mockImplementation(() => ({
      setData: jest.fn(),
      applyOptions: jest.fn(),
    })),
    timeScale: jest.fn().mockReturnValue({
      fitContent: jest.fn(),
    }),
    subscribeCrosshairMove: jest.fn(),
    unsubscribeCrosshairMove: jest.fn(),
    remove: jest.fn(),
  })),
  CandlestickSeries: {},
  HistogramSeries: {},
  LineSeries: {},
};

// 使用 jest.doMock 而不是 jest.mock 以确保在执行测试之前模拟 lightweight-charts
jest.doMock('lightweight-charts', () => mockLightweightCharts);

// 模拟 language context - 不使用 JSX 语法
jest.mock('@/components/language/Context', () => {
  // 创建一个简单的上下文对象
  const LanguageContext = {
    Provider: function LanguageProvider(props) {
      return {
        type: 'div',
        props: {
          children: props.children,
        },
      };
    },
  };

  return {
    LanguageContext,
    useLanguage: () => ({
      language: 'en',
      setLanguage: jest.fn(),
      t: key => key,
    }),
    LanguageProvider: LanguageContext.Provider,
  };
});

// 模拟 language switcher - 不使用 JSX 语法
jest.mock('@components/language/Switcher', () => {
  return function MockLanguageSwitcher() {
    return {
      type: 'div',
      props: {
        'data-testid': 'language-switcher',
        children: 'Language Switcher',
      },
    };
  };
});

// 模拟 wallet connect button - 不使用 JSX 语法
jest.mock('@components/wallet/CustomConnectButton', () => ({
  CustomConnectButton: function MockCustomConnectButton() {
    return {
      type: 'button',
      props: {
        'data-testid': 'connect-wallet-button',
        children: 'Connect Wallet',
      },
    };
  },
}));

// 模拟 useCourseContract hook
jest.mock('@/hooks/useCourseContract', () => ({
  useCourseContract: () => ({
    purchaseCourse: jest.fn().mockResolvedValue(true),
    getAllCourses: jest.fn(),
    isLoading: false,
  }),
}));

// 模拟 sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// 模拟 wagmi
jest.mock('wagmi', () => {
  return {
    getContract: jest.fn(),
    // 添加其他需要的导出
  };
});

// 模拟 rainbow-me/rainbowkit
jest.mock('@rainbow-me/rainbowkit', () => {
  return {
    ConnectButton: {
      Custom: ({ children }) => {
        // 模拟返回值
        return children({
          account: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: '0x1234...7890',
            displayBalance: '1.5 ETH',
          },
          chain: {
            hasIcon: true,
            iconUrl: 'https://example.com/icon.png',
            iconBackground: '#fff',
            id: 1,
            name: 'Ethereum',
            unsupported: false,
          },
          openAccountModal: jest.fn(),
          openChainModal: jest.fn(),
          openConnectModal: jest.fn(),
          authenticationStatus: 'authenticated',
          mounted: true,
        });
      },
    },
  };
});

// 模拟 web3-react
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn().mockReturnValue({
    active: true,
    account: '0x1234567890123456789012345678901234567890',
    library: {
      getSigner: jest.fn().mockReturnValue({
        getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      }),
    },
  }),
}));
