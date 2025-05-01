// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // Sepolia 测试网
  SEPOLIA: {
    GEEK_TOKEN: '0xEB94806A5c4F403110F5ee7249465895DBd21779', // 需要替换为实际部署的合约地址
    COURSE_MARKET: '0xb7d304C6fa898459Aa786Aee16EBD54c99742809', // 课程合约
    CERTIFICATE: '0x6A1C24F9b0Ce67F0691c983Fe7c660522BDb9512', // 证书合约
  },
  // 主网
  MAINNET: {
    GEEK_TOKEN: '0x41cb388B29EfC443d5aC1dD511B186249bD0fe45', // 需要替换为实际部署的合约地址
  },
} as const;

// 获取当前网络的合约地址
export const getContractAddress = (chainId: number) => {
  switch (chainId) {
    case 11155111: // Sepolia
      return CONTRACT_ADDRESSES.SEPOLIA;
    case 1: // Mainnet
      return CONTRACT_ADDRESSES.MAINNET;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}; 