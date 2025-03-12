import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
	key: "LM_LODING",
	// storage: sessionStorage,
});

const LM_LODING_RESET = {
	show: false,
};

export interface LmLodingState {
	show: boolean;
	reset: typeof LM_LODING_RESET;
}

export const LM_LODING = atom<LmLodingState>({
	key: "LM_LODING_ATOM",
	default: {
		reset: LM_LODING_RESET,
		...LM_LODING_RESET,
	},
	// persistAtom이 필요하다면, effects_UNSTABLE에 추가합니다.
	effects_UNSTABLE: [persistAtom], // 이 줄을 활성화하면 persistAtom을 사용할 수 있습니다.
});
