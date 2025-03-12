import { useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { LmAxios } from '@/axios/LmAxios';
import { LmLoding } from "@/components/LmLoding";
import { LmToastPop } from "@/components/LmToastPop";
import { LmPop } from "@/components/LmPop";

import {HOOK_LM_LODING} from '@/store/hooks/hookLoding';

export const LmCommon = () => {
	const location = useLocation();
	const { setLmLoding } = HOOK_LM_LODING();

	useEffect(() => {
		// Axios 인터셉터로 상태 업데이트
		const requestInterceptor = LmAxios.interceptors.request.use(
		(config) => {
				if (!config.headers?.disableLoading) {
					setLmLoding({ show: true });
				}
				return config;
			},
			(error) => {
				if (!error.config?.headers?.disableLoading) { 
					setLmLoding({show: false});
				}
				return Promise.reject(error);
			}
		);

		const responseInterceptor = LmAxios.interceptors.response.use(
		(response) => {
				if (!response.config.headers?.disableLoading) {
					setLmLoding({show: false});
				}
				return response;
			},
			(error) => {
				if (!error.config?.headers?.disableLoading) {
					setLmLoding({show: false});
				}
				return Promise.reject(error);
			}
		);

		// 컴포넌트 언마운트 시 인터셉터 제거
		return () => {
			LmAxios.interceptors.request.eject(requestInterceptor);
			LmAxios.interceptors.response.eject(responseInterceptor);
		};
	}, [location]);

	return (
		<>
			<LmLoding />
			<LmPop />
			<LmToastPop />
		</>
	);
};