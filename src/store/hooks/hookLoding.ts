import { useRecoilState } from "recoil";
import { PYO_LODING, PyoLodingState } from "@/store/storeLoding"; // PyoLodingState를 import

interface HookPyoLoding {
	getPyoLoding: PyoLodingState;
	setPyoLoding: (data: Partial<PyoLodingState>) => void;
}

export const HOOK_PYO_LODING = (): HookPyoLoding => {
	const [getPyoLoding, updatePyoLoding] = useRecoilState(PYO_LODING);

	const setPyoLoding = (data: Partial<PyoLodingState>) => {
		updatePyoLoding((prevPyoLoding) => ({
			...prevPyoLoding,
			...data,
		}));
	};

	return {
		getPyoLoding,
		setPyoLoding,
	};
};
