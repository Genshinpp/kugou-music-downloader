// src/utils/env.js
// 环境变量管理工具

// 根据 NODE_ENV 判断当前环境
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// 获取 API 基础地址
export const getBaseUrl = () => {
  if (isDevelopment) {
    // 开发环境
    return import.meta.env.VITE_API_BASE_URL_DEV;
  } else {
    // 生产环境
    return import.meta.env.VITE_API_BASE_URL_PROD;
  }
};

// 环境信息导出
export const ENV = {
  isDevelopment,
  isProduction,
  baseUrl: getBaseUrl(),
  // 可以添加更多环境相关的配置
};

export default ENV;