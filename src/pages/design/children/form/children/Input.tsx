import {HOOK_PYO_TOAST_POP} from "@/store/hooks/hookToastPop";
import { getEvent } from "@/utils/getEvent";

interface CopyInputProps {
	pyoClass: string;
	state?: string;
}

export const FormInput = () => {
	const { setPyoToastPop } = HOOK_PYO_TOAST_POP();

	const copyInput = ({ pyoClass, state }: CopyInputProps): void => {
		let inputHtml = `<input type="text" className="pyo-input ${pyoClass}" ${
			state ? state : ""
		} />`;
		getEvent.copyText(inputHtml);
		setPyoToastPop({
			items: {
				type: "guide",
				iconType: "check",
				title: "pyo-input input 복사",
				contents: "클립보드에 복사되었습니다.",
			},
		});
	};

	return (
		<>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">Input s-s</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input s-s"
						placeholder="Text Default"
					/>
					<button
						className="pyo-button color-black s-s"
						onClick={() => copyInput({ pyoClass: "s-s" })}
					>
						Default Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input s-s success"
						defaultValue="Text Success"
					/>
					<button
						className="pyo-button color-black s-s"
						onClick={() => copyInput({ pyoClass: "s-s success" })}
					>
						Success Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input s-s error"
						defaultValue="Text Error"
					/>
					<button
						className="pyo-button color-black s-s"
						onClick={() => copyInput({ pyoClass: "s-s error" })}
					>
						Error Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input s-s"
						defaultValue="Text Disabled"
						disabled
					/>
					<button
						className="pyo-button color-black s-s"
						onClick={() =>
							copyInput({ pyoClass: "s-s", state: "disabled" })
						}
					>
						Disabled Copy
					</button>
				</div>
			</div>

			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">Input default</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input"
						placeholder="Text Default"
					/>
					<button
						className="pyo-button color-black"
						onClick={() => copyInput({ pyoClass: "" })}
					>
						Default Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input success"
						defaultValue="Text Success"
					/>
					<button
						className="pyo-button color-black"
						onClick={() => copyInput({ pyoClass: "success" })}
					>
						Success Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input error"
						defaultValue="Text Error"
					/>
					<button
						className="pyo-button color-black"
						onClick={() => copyInput({ pyoClass: "error" })}
					>
						Error Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input"
						defaultValue="Text Disabled"
						disabled
					/>
					<button
						className="pyo-button color-black"
						onClick={() =>
							copyInput({ pyoClass: "", state: "disabled" })
						}
					>
						Disabled Copy
					</button>
				</div>
			</div>

			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">Input s-l</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input s-l"
						placeholder="Text Default"
					/>
					<button
						className="pyo-button color-black"
						onClick={() => copyInput({ pyoClass: "s-l" })}
					>
						Default Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input s-l success"
						defaultValue="Text Success"
					/>
					<button
						className="pyo-button color-black"
						onClick={() => copyInput({ pyoClass: "s-l success" })}
					>
						Success Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input s-l error"
						defaultValue="Text Error"
					/>
					<button
						className="pyo-button color-black"
						onClick={() => copyInput({ pyoClass: "s-l error" })}
					>
						Error Copy
					</button>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						className="pyo-input s-l"
						defaultValue="Text Disabled"
						disabled
					/>
					<button
						className="pyo-button color-black"
						onClick={() =>
							copyInput({ pyoClass: "s-l", state: "disabled" })
						}
					>
						Disabled Copy
					</button>
				</div>
			</div>
		</>
	);
};
