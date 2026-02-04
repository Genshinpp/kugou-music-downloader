// src/services/api.js


export const request = async (endpoint, options = {}) => {
    // 构造完整 URL
    let url = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`;
    console.log('request......', url)
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