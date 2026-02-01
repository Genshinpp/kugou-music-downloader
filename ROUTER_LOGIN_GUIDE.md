# 音乐下载器 - 路由和登录拦截说明

## 功能实现

### 1. 路由配置
- 使用 `react-router-dom` 实现 SPA 路由
- 主要路由：
  - `/` - 首页（受保护路由）
  - `/login` - 登录页面

### 2. 认证系统
- 基于 Context API 的认证状态管理
- 本地存储用户信息
- 自动检查登录状态

### 3. 登录拦截
- 未登录用户访问首页自动跳转到登录页
- 登录成功后自动跳转回首页
- 支持手机号验证码登录（模拟）

## 文件结构

```
src/
├── components/
│   ├── Login.jsx          # 登录组件
│   ├── Layout.jsx         # 主布局组件
│   └── ProtectedRoute.jsx # 受保护路由组件
├── contexts/
│   └── AuthContext.jsx    # 认证上下文
├── pages/
│   └── Home.jsx           # 首页组件
├── styles/
│   └── layout.css         # 样式文件
├── router.jsx             # 路由配置
└── main.jsx               # 应用入口
```

## 使用说明

1. 启动应用后会自动跳转到登录页面
2. 输入任意手机号和验证码即可登录（模拟登录）
3. 登录成功后进入音乐搜索首页
4. 点击右上角可退出登录

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```