import {HOOK_PYO_TOAST_POP} from "@/store/hooks/hookToastPop";
import { getEvent } from "@/utils/getEvent";

export const PyoDesignIcon = () => {
	const { setPyoToastPop } = HOOK_PYO_TOAST_POP();

	const iconArry = [
		"all-menu-2",
		"all-menu",
		"arrow-down",
		"arrow-first",
		"arrow-last",
		"arrow-next",
		"arrow-prev",
		"arrow-up",
		"calendar",
		"camera",
		"card-hand",
		"card",
		"cart",
		"check",
		"check-2",
		"clip",
		"coupon",
		"doc",
		"el",
		"feel",
		"gear",
		"hand-best-fill",
		"hand-best",
		"hart-fill",
		"hart",
		"i-2",
		"i",
		"link",
		"lock-open",
		"lock",
		"minus",
		"money-2",
		"money-hand",
		"money-paper",
		"money",
		"note",
		"notebook",
		"pay",
		"people",
		"percent",
		"phone",
		"pin-fill",
		"pin",
		"play",
		"plus",
		"power",
		"print",
		"qr",
		"refresh",
		"repeat",
		"search",
		"smile",
		"speaker-2",
		"speaker",
		"speech",
		"star",
		"tag",
		"upload-2",
		"upload",
		"x-cicle",
		"x",
	];

	const copyEl = (item: string) => {
		const reqHtml: string = `<div class="${item}"></div>`;
		getEvent.copyText(reqHtml);
		setPyoToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'pyo-icon- 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	return (
		<>
			<div className="pyo-panel-guide">
				<div className="pyo-icon-feel color-4"></div>
				해당 css mask 기능은 네이버 인앱에서는 적용되지 않습니다. <br />
				네이버 인앱까지 고려한다면 이미지를 색상별svg로 저장 하셔서 사용하시길 바랍니다.
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				{iconArry.map((item, index) => (
					<div key={index}>
						<div>{`pyo-icon-${item}`}</div>
						<div
							className={`pyo-icon-${item}`}
							onClick={() => copyEl(`pyo-icon-${item}`)}
						></div>
						<div
							className={`pyo-icon-${item} color-1`}
							onClick={() => copyEl(`pyo-icon-${item} color-1`)}
						></div>
						<div
							className={`pyo-icon-${item} color-2`}
							onClick={() => copyEl(`pyo-icon-${item} color-2`)}
						></div>
						<div
							className={`pyo-icon-${item} color-3`}
							onClick={() => copyEl(`pyo-icon-${item} color-3`)}
						></div>
						<div
							className={`pyo-icon-${item} color-4`}
							onClick={() => copyEl(`pyo-icon-${item} color-4`)}
						></div>
						<div
							className={`pyo-icon-${item} color-5`}
							onClick={() => copyEl(`pyo-icon-${item} color-5`)}
						></div>
					</div>
				))}
			</div>
		</>
	);
};
