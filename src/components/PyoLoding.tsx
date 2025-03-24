import { useState, useEffect } from "react";
import {HOOK_PYO_LODING} from "@/store/hooks/hookLoding";

export const PyoLoding = () => {
	const { getPyoLoding } = HOOK_PYO_LODING();
	const [show, setShow] = useState<boolean>(false);
	const [showClass, setShowClass] = useState<string>("");

	useEffect(() => {
		let setTimeId: NodeJS.Timeout | undefined;
		if (!getPyoLoding.show) {
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
	}, [getPyoLoding]);

	return (
		show && (
			<div className="pyo-loding">
				<div className={`pyo-loding-inner ${showClass}`}>
					<div className="pyo-loding-loader"></div>
				</div>
			</div>
		)
	);
};
