import {HOOK_LM_TOAST_POP} from "@/store/hooks/hookToastPop";
import { getEvent } from "@/utils/getEvent";

interface CopySelectProps {
	lmClass: string;
	state?: string;
};

export const FormSelect = () => {
	const { setLmToastPop } = HOOK_LM_TOAST_POP();

	// copySelect 함수 타입 적용
	const copySelect = ({ lmClass, state }: CopySelectProps): void => {
		let selectHtml = 
`<select className="lm-input ${lmClass}" ${state ? state : ""}>
	<option>Select option</option>
	<option>select option1</option>
	<option>select option2</option>
	<option>select option3</option>
	<option>select option4</option>
</select>`;
		getEvent.copyText(selectHtml);
		setLmToastPop({
			items: {
				type: "guide",
				iconType: "check",
				title: "lm-input select 복사",
				contents: "클립보드에 복사되었습니다.",
			},
		});
	};

	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-panel-inner-title">Select s-s</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input s-s">
						<option>Select default</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black s-s"
						onClick={() => copySelect({ lmClass: "s-s" })}
					>
						Default Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input s-s success">
						<option>Select Success</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black s-s"
						onClick={() => copySelect({ lmClass: "s-s success" })}
					>
						Success Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input s-s error">
						<option>Select Error</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black s-s"
						onClick={() => copySelect({ lmClass: "s-s error" })}
					>
						Error Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input s-s" disabled>
						<option>Select Disabled</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black s-s"
						onClick={() =>
							copySelect({ lmClass: "s-s", state: "disabled" })
						}
					>
						Disabled Copy
					</button>
				</div>
			</div>

			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-panel-inner-title">Select default</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input">
						<option>Select default</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black"
						onClick={() => copySelect({ lmClass: "" })}
					>
						Default Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input success">
						<option>Select Success</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black"
						onClick={() => copySelect({ lmClass: "success" })}
					>
						Success Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input error">
						<option>Select Error</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black"
						onClick={() => copySelect({ lmClass: "error" })}
					>
						Error Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input" disabled>
						<option>Select Disabled</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black"
						onClick={() =>
							copySelect({ lmClass: "", state: "disabled" })
						}
					>
						Disabled Copy
					</button>
				</div>
			</div>

			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-panel-inner-title">Select s-l</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input s-l">
						<option>Select default</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black"
						onClick={() => copySelect({ lmClass: "s-l" })}
					>
						Default Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input s-l success">
						<option>Select Success</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black"
						onClick={() => copySelect({ lmClass: "s-l success" })}
					>
						Success Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input s-l error">
						<option>Select Error</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black"
						onClick={() => copySelect({ lmClass: "s-l error" })}
					>
						Error Copy
					</button>
				</div>
				<div className="lm-panel-flex-inner">
					<select className="lm-input s-l" disabled>
						<option>Select Disabled</option>
						<option>select option1</option>
						<option>select option2</option>
						<option>select option3</option>
						<option>select option4</option>
					</select>
					<button
						className="lm-button color-black"
						onClick={() =>
							copySelect({ lmClass: "s-l", state: "disabled" })
						}
					>
						Disabled Copy
					</button>
				</div>
			</div>
		</>
	);
};
