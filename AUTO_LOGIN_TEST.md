// 测试自动登录功能的说明

/*
自动登录功能已实现！

工作流程：
1. 应用启动时，AuthContext 会检查 localStorage 中的 auth 数据
2. 如果存在 token 和 userid，则调用:
   request(`/login/token?token=${auth.token}&userid=${auth.userid}`)
3. 请求成功 -> 加载主界面（设置用户状态）
4. 请求失败 -> 加载登录界面（清除本地存储）

测试方法：

方法1：手动测试
1. 打开应用，先正常登录一次
2. 刷新页面，观察是否会自动登录

方法2：开发者工具测试
1. 打开浏览器开发者工具
2. 在 Console 中执行：
   
   // 模拟已登录状态
   localStorage.setItem('auth', JSON.stringify({
     token: 'test-token-123',
     userid: 'test-user-456',
     mobile: '13800138000'
   }));

3. 刷新页面，观察网络请求和界面变化

方法3：API 测试
在 services/api.js 中可以配置模拟响应：

// 成功响应示例
if (url.includes('/login/token')) {
  return Promise.resolve({
    data: {
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      // 其他用户信息
    }
  });
}

// 失败响应示例  
if (url.includes('/login/token')) {
  return Promise.reject(new Error('Token expired'));
}
*/