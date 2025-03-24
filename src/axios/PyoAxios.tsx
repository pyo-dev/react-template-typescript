import axios from 'axios';

// Axios 인스턴스 생성
const PyoAxios = axios.create({
	baseURL: import.meta.env.VITE_APP_API_URL,
	withCredentials: true,
	timeout: 6000 * 5,
});

// 기본 헤더 설정
// PyoAxios.defaults.headers.common['Access-Control-Allow-Origin'] = '*'; // 테스트용으로 임시 주석
PyoAxios.defaults.headers.post['Content-Type'] = 'application/json';
PyoAxios.defaults.headers.put['Content-Type'] = 'application/json';
PyoAxios.defaults.headers.delete['Content-Type'] = 'application/json';

export { PyoAxios };
