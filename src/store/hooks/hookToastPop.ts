import { useRecoilState } from "recoil";
import { LM_TOAST_POP, ToastPopState } from "@/store/storeToastPop"; // ToastPopState를 import 했습니다.

export const HOOK_LM_TOAST_POP = () => {
	const [getLmToastPop, updateLmToastPop] = useRecoilState<ToastPopState>(LM_TOAST_POP);

	const setLmToastPop = (data: Partial<ToastPopState>) => {
		updateLmToastPop((prevLmToastPop) => ({
			...prevLmToastPop,
			...data,
		}));
	};

	return {
		getLmToastPop,
		setLmToastPop,
	};
};
