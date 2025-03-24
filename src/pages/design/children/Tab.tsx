import {HOOK_PYO_TOAST_POP} from "@/store/hooks/hookToastPop";
import { getEvent } from "@/utils/getEvent";

export const PyoDesignTab = () => {
	const { setPyoToastPop } = HOOK_PYO_TOAST_POP();

	const reqHtml: string[] = [
`<div class="pyo-tab">
	<button class="active">button</button>
	<button>button</button>
	<button>button</button>
	<button>button</button>
	<button>button</button>
</div>`,
`<div class="pyo-tab-type2">
	<button class="active">button</button>
	<button>button</button>
	<button>button</button>
	<button>button</button>
	<button>button</button>
</div>`,
`<div class="pyo-tab-type3">
	<button class="active">button</button>
	<button>button</button>
	<button>button</button>
	<button>button</button>
	<button>button</button>
</div>`,
];

	const copyEl = (index: number): void => {
		getEvent.copyText(reqHtml[index]);
		setPyoToastPop({
			items: {
				type: "guide",
				iconType: "check",
				title: "pyo-tab 복사",
				contents: "클립보드에 복사되었습니다.",
			},
		});
	};

	return (
		<>
			<div
				dangerouslySetInnerHTML={{ __html: reqHtml[0] }}
				onClick={() => copyEl(0)}
			></div>
			<div className="pyo-panel">
				<div
					dangerouslySetInnerHTML={{ __html: reqHtml[1] }}
					onClick={() => copyEl(1)}
				></div>
				<div
					dangerouslySetInnerHTML={{ __html: reqHtml[2] }}
					onClick={() => copyEl(2)}
				></div>
			</div>
		</>
	);
};
