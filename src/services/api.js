// src/services/api.js
import { getBaseUrl } from '../utils/env';

const BASE_URL = getBaseUrl();


export const request = async (endpoint, options = {}) => {
    // 构造完整 URL
    let url;
    if (endpoint.startsWith('http')) {
        // 绝对路径，直接使用
        url = endpoint;
    } else if (endpoint.startsWith('/api')) {
        // API 路径，直接使用（Nginx 会代理）
        url = endpoint;
    } else {
        // 其他相对路径，拼接基础 URL
        url = `${BASE_URL}${endpoint}`;
    }
    const auth = localStorage.getItem('auth');
    // 将store中的cookie转换为字符串，并设置到请求头中
    const cookie = auth ? Object.entries(auth).map(([k, v]) => `${k}=${v}`).join('; ') : '';

    const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        ...options.headers,
    };

    options = {
        ...options,
        headers,
    }


    return fetch(url, { ...options, credentials: 'include' })
        .then((res) => {
            console.log('res', res)
            if (res.status === 502) {
                return res.json().then((data) => {
                    throw new Error(data.error_msg)
                })
            }
            return res.json()
        })
        .then((data) => {
            console.log('data', data)
            return data
        })
        .catch((error) => {
            throw new Error(error);
        });
}


export const getSongUrl = (hash) => request(`/song/url?hash=${hash}&quality=320`);