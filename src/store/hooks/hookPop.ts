import { useRecoilState } from "recoil";
import { PYO_POP, PyoPopState } from "@/store/storePop"; // PyoPopState를 import 했습니다.

export const HOOK_PYO_POP = () => {
	const [getPyoPop, updatePyoPop] = useRecoilState<PyoPopState>(PYO_POP);

	const setPyoPop = (data: Partial<PyoPopState>) => {
		updatePyoPop((prevPyoPop: PyoPopState) => ({
			...prevPyoPop,
			...data,
		}));
	};

	return {
		getPyoPop,
		setPyoPop,
	};
};
