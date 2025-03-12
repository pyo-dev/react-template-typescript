import { useState, useEffect } from "react";
import {HOOK_LM_LODING} from "@/store/hooks/hookLoding";

export const LmLoding = () => {
	const { getLmLoding } = HOOK_LM_LODING();
	const [show, setShow] = useState<boolean>(false);
	const [showClass, setShowClass] = useState<string>("");

	useEffect(() => {
		let setTimeId: NodeJS.Timeout | undefined;
		if (!getLmLoding.show) {
			setShowClass("");
			setTimeId = setTimeout(() => {
				setShow(false);
			}, 300);
		} else {
			setShow(true);
			setShowClass("show");
		}

		return () => {
			if (setTimeId) {
				clearTimeout(setTimeId);
			}
		};
	}, [getLmLoding]);

	return (
		show && (
			<div className="lm-loding">
				<div className={`lm-loding-inner ${showClass}`}>
					<div className="lm-loding-loader"></div>
				</div>
			</div>
		)
	);
};
