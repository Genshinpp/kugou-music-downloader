// src/router.jsx
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Login from './components/Login';
import Home from './pages/Home';
import RootLayout from './components/RootLayout';
import AppLayout from './components/AppLayout';

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Home />,
          },
        ],
      },
      {
        path: 'login',
        element: <Login />,
      },
    ],
  },
]);

