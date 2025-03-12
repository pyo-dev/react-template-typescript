import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
	key: "LM_TOAST_POP",
	// storage: sessionStorage,
});

export interface ToastPopItem {
	type?: string;
	iconType?: string;
	title?: string;
	contents?: string;
}

export interface ToastPopState {
	position: {
		bottom: string;
		right: string;
	};
	width: string;
	padding: string;
	items: ToastPopItem | null;
	reset?: Omit<ToastPopState, "reset">; // reset을 선택적으로 추가
}

const LM_TOAST_POP_RESET: Omit<ToastPopState, "reset"> = {
	position: {
		bottom: "0",
		right: "0",
	},
	width: "500px",
	padding: "20px",
	items: null,
};

export const LM_TOAST_POP = atom<ToastPopState>({
	key: "LM_TOAST_POP_ATOM",
	default: {
		reset: LM_TOAST_POP_RESET, // reset 포함
		...LM_TOAST_POP_RESET,
	},
	effects_UNSTABLE: [persistAtom],
});
