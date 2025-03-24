import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
	key: "PYO_TOAST_POP",
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

const PYO_TOAST_POP_RESET: Omit<ToastPopState, "reset"> = {
	position: {
		bottom: "0",
		right: "0",
	},
	width: "500px",
	padding: "20px",
	items: null,
};

export const PYO_TOAST_POP = atom<ToastPopState>({
	key: "PYO_TOAST_POP_ATOM",
	default: {
		reset: PYO_TOAST_POP_RESET, // reset 포함
		...PYO_TOAST_POP_RESET,
	},
	effects_UNSTABLE: [persistAtom],
});
