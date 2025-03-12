import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
	key: "LM_POP",
	// storage: sessionStorage,
});

export interface LmPopState {
	// 인터페이스를 export로 바꿨습니다.
	show: boolean;
	type: "alert" | "confirm";
	title: string | null;
	contents: string | JSX.Element | null;
	cancle_title: string;
	cancle_fun: ((hidePop: () => void) => void) | null; // 수정
	success_title: string;
	success_fun: ((hidePop: () => void) => void) | null; // 수정
}

const LM_POP_RESET: LmPopState = {
	show: false,
	type: "alert",
	title: null,
	contents: null,
	cancle_title: "취소",
	cancle_fun: null,
	success_title: "확인",
	success_fun: null,
};

export const LM_POP = atom<LmPopState>({
	key: "LM_POP_ATOM",
	default: LM_POP_RESET,
	effects_UNSTABLE: [persistAtom],
});
