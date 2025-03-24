import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
	key: "PYO_LODING",
	// storage: sessionStorage,
});

const PYO_LODING_RESET = {
	show: false,
};

export interface PyoLodingState {
	show: boolean;
	reset: typeof PYO_LODING_RESET;
}

export const PYO_LODING = atom<PyoLodingState>({
	key: "PYO_LODING_ATOM",
	default: {
		reset: PYO_LODING_RESET,
		...PYO_LODING_RESET,
	},
	// persistAtom이 필요하다면, effects_UNSTABLE에 추가합니다.
	effects_UNSTABLE: [persistAtom], // 이 줄을 활성화하면 persistAtom을 사용할 수 있습니다.
});
