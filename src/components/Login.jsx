// src/components/Login.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { request } from '../services/api';

export default function Login() {
    
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const handleSendCode = async () => {
    try {
      await request(`/captcha/sent?mobile=${mobile}`); // 示例接口
      alert('验证码已发送');
    } catch (error) {
      console.error('发送验证码失败:', error);
      alert('发送失败');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  });


  const handleLogin = async () => {
    try {
      const res = await request(`/login/cellphone?mobile=${mobile}&code=${code}`);
      const data = res.data
      login(data);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('登录失败:', error);
      alert('登录失败');
    }
  };

  return (
    <div className="login-box">
      <h2>手机登录</h2>
      <input placeholder="手机号" value={mobile} onChange={e => setMobile(e.target.value)} />
      <div className="code-row">
        <input placeholder="验证码" value={code} onChange={e => setCode(e.target.value)} />
        <button onClick={handleSendCode}>获取</button>
      </div>
      <button onClick={handleLogin}>登录</button>
    </div>
  );
};