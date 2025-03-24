import { useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { PyoAxios } from '@/axios/PyoAxios';
import { PyoLoding } from "@/components/PyoLoding";
import { PyoToastPop } from "@/components/PyoToastPop";
import { PyoPop } from "@/components/PyoPop";

import {HOOK_PYO_LODING} from '@/store/hooks/hookLoding';

export const PyoCommon = () => {
	const location = useLocation();
	const { setPyoLoding } = HOOK_PYO_LODING();

	useEffect(() => {
		// Axios 인터셉터로 상태 업데이트
		const requestInterceptor = PyoAxios.interceptors.request.use(
		(config) => {
				if (!config.headers?.disableLoading) {
					setPyoLoding({ show: true });
				}
				return config;
			},
			(error) => {
				if (!error.config?.headers?.disableLoading) { 
					setPyoLoding({show: false});
				}
				return Promise.reject(error);
			}
		);

		const responseInterceptor = PyoAxios.interceptors.response.use(
		(response) => {
				if (!response.config.headers?.disableLoading) {
					setPyoLoding({show: false});
				}
				return response;
			},
			(error) => {
				if (!error.config?.headers?.disableLoading) {
					setPyoLoding({show: false});
				}
				return Promise.reject(error);
			}
		);

		// 컴포넌트 언마운트 시 인터셉터 제거
		return () => {
			PyoAxios.interceptors.request.eject(requestInterceptor);
			PyoAxios.interceptors.response.eject(responseInterceptor);
		};
	}, [location]);

	return (
		<>
			<PyoLoding />
			<PyoPop />
			<PyoToastPop />
		</>
	);
};