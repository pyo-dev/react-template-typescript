import { useRecoilState } from "recoil";
import { LM_LODING, LmLodingState } from "@/store/storeLoding"; // LmLodingState를 import

interface HookLmLoding {
	getLmLoding: LmLodingState;
	setLmLoding: (data: Partial<LmLodingState>) => void;
}

export const HOOK_LM_LODING = (): HookLmLoding => {
	const [getLmLoding, updateLmLoding] = useRecoilState(LM_LODING);

	const setLmLoding = (data: Partial<LmLodingState>) => {
		updateLmLoding((prevLmLoding) => ({
			...prevLmLoding,
			...data,
		}));
	};

	return {
		getLmLoding,
		setLmLoding,
	};
};
