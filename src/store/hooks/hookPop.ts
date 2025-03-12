import { useRecoilState } from "recoil";
import { LM_POP, LmPopState } from "@/store/storePop"; // LmPopState를 import 했습니다.

export const HOOK_LM_POP = () => {
	const [getLmPop, updateLmPop] = useRecoilState<LmPopState>(LM_POP);

	const setLmPop = (data: Partial<LmPopState>) => {
		updateLmPop((prevLmPop: LmPopState) => ({
			...prevLmPop,
			...data,
		}));
	};

	return {
		getLmPop,
		setLmPop,
	};
};
