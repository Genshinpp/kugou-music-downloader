# 路由拦截器测试说明

## 功能说明
已实现的路由拦截器具备以下功能：

### 1. 自动路由保护
- 未登录用户访问 `/` 路径会自动重定向到 `/login`
- 已登录用户可以直接访问主界面

### 2. Token 验证机制
- 页面加载时自动检查 localStorage 中的 auth 信息
- 验证 token 有效性
- 失效的 token 会被自动清除

### 3. 路由结构优化
采用嵌套路由设计：
```
RootLayout (AuthProvider)
├── AppLayout (受保护布局)
│   └── Home (主页面)
└── Login (登录页面)
```

## 测试步骤

### 测试场景1：未登录访问主页
1. 清除浏览器 localStorage
2. 直接访问 http://localhost:5173/
3. 应该自动跳转到登录页面

### 测试场景2：登录后访问主页
1. 在登录页面输入手机号和验证码
2. 成功登录后应该跳转到主页
3. 刷新页面应该保持登录状态

### 测试场景3：Token 过期处理
1. 登录成功后手动修改 localStorage 中的 token
2. 刷新页面应该检测到 token 无效并跳转到登录页

## 文件改动说明

### src/contexts/AuthContext.jsx
- 修复了登录函数的数据存储逻辑
- 统一使用 'auth' 键存储用户信息

### src/router.jsx
- 重构路由结构，使用嵌套路由
- 添加根布局组件统一管理 AuthProvider
- 优化路由配置，提高可维护性

### 核心组件关系
```
AppRouter -> RouterProvider
  └── RootLayout (AuthProvider)
       ├── AppLayout (Layout + ProtectedRoute)
       │    └── Home
       └── Login
```

## 注意事项
- React Fast Refresh 警告不影响功能
- 确保 API 服务正常运行在 localhost:3000
- 开发环境下可使用 npm run dev 启动测试