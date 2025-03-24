import { useRecoilState } from "recoil";
import { PYO_TOAST_POP, ToastPopState } from "@/store/storeToastPop"; // ToastPopState를 import 했습니다.

export const HOOK_PYO_TOAST_POP = () => {
	const [getPyoToastPop, updatePyoToastPop] = useRecoilState<ToastPopState>(PYO_TOAST_POP);

	const setPyoToastPop = (data: Partial<ToastPopState>) => {
		updatePyoToastPop((prevPyoToastPop) => ({
			...prevPyoToastPop,
			...data,
		}));
	};

	return {
		getPyoToastPop,
		setPyoToastPop,
	};
};
