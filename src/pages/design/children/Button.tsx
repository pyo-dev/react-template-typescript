import {HOOK_LM_TOAST_POP} from "@/store/hooks/hookToastPop";
import { getEvent } from "@/utils/getEvent";

interface CopyElProps {
	el?: string;
	className?: string;
	disabled?: boolean;
}

export const LmDesignButton = () => {
	const { setLmToastPop } = HOOK_LM_TOAST_POP();

	const copyEl = ({
		el = "button",
		className = "",
		disabled = false,
	}: CopyElProps = {}) => {
		let reqHtml = `<${el} class="lm-button ${className}" ${disabled ? "disabled" : ""}>${el}</${el}>`;
		getEvent.copyText(reqHtml);
		setLmToastPop({
			items: {
				type: "guide",
				iconType: "check",
				title: "lm-button 복사",
				contents: "클립보드에 복사되었습니다.",
			},
		});
	};

	return (
		<>
			<div className="lm-panel">
				<div
					className="lm-panel lm-panel-flex-wrap"
					style={{ backgroundColor: "#EEF0F3" }}
				>
					<a
						href="#;"
						className="lm-button s-s"
						onClick={() => copyEl({ el: "a", className: "s-s" })}
					>
						Anchor small
					</a>
					<a
						href="#;"
						className="lm-button"
						onClick={() => copyEl({ el: "a" })}
					>
						Anchor default
					</a>
					<a
						href="#;"
						className="lm-button s-l"
						onClick={() => copyEl({ el: "a", className: "s-l" })}
					>
						Anchor large
					</a>
				</div>
				<div
					className="lm-panel lm-panel-flex-wrap"
					style={{ backgroundColor: "#EEF0F3" }}
				>
					<button
						className="lm-button s-s"
						onClick={() => copyEl({ className: "s-s" })}
					>
						Button small
					</button>
					<button className="lm-button" onClick={() => copyEl()}>
						Button default
					</button>
					<button
						className="lm-button s-l"
						onClick={() => copyEl({ className: "s-l" })}
					>
						Button large
					</button>
					<button className="lm-button" disabled>
						Button disabled
					</button>
				</div>
				<div className="lm-panel-flex-wrap">
					<button
						className="lm-button line"
						onClick={() => copyEl({ className: "line" })}
					>
						Button
					</button>
					<button
						className="lm-button color-black line"
						onClick={() =>
							copyEl({ className: "color-black line" })
						}
					>
						Button
					</button>
					<button
						className="lm-button color-black"
						onClick={() => copyEl({ className: "color-black" })}
					>
						Button
					</button>
					<button
						className="lm-button color-1 line"
						onClick={() => copyEl({ className: "color-1 line" })}
					>
						Button
					</button>
					<button
						className="lm-button color-1"
						onClick={() => copyEl({ className: "color-1" })}
					>
						Button
					</button>
					<button
						className="lm-button color-2 line"
						onClick={() => copyEl({ className: "color-2 line" })}
					>
						Button
					</button>
					<button
						className="lm-button color-2"
						onClick={() => copyEl({ className: "color-2" })}
					>
						Button
					</button>
					<button
						className="lm-button color-3 line"
						onClick={() => copyEl({ className: "color-3 line" })}
					>
						Button
					</button>
					<button
						className="lm-button color-3"
						onClick={() => copyEl({ className: "color-3" })}
					>
						Button
					</button>
					<button
						className="lm-button color-4 line"
						onClick={() => copyEl({ className: "color-4 line" })}
					>
						Button
					</button>
					<button
						className="lm-button color-4"
						onClick={() => copyEl({ className: "color-4" })}
					>
						Button
					</button>
					<button
						className="lm-button color-5 line"
						onClick={() => copyEl({ className: "color-5 line" })}
					>
						Button
					</button>
					<button
						className="lm-button color-5"
						onClick={() => copyEl({ className: "color-5" })}
					>
						Button
					</button>
				</div>
			</div>
		</>
	);
};
