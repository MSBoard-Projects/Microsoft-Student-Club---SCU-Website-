import axios from 'axios';

const apiClient = axios.create({
	baseURL: process.env.REACT_APP_API_URL || '/api',
	timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
	const token = localStorage.getItem('authToken');
	if (config.url === '/auth/login') {
		delete config.headers.Authorization;
	} else if (token && !config.headers.Authorization) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		const currentToken = localStorage.getItem('authToken');
		if (error.response?.status === 401 && currentToken &&
			error.config?.headers?.Authorization === `Bearer ${currentToken}`) {
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
			window.dispatchEvent(new Event('auth-expired'));
		}
		return Promise.reject(error);
	}
);

export default apiClient;
