import { useState, useEffect } from "react";
import {HOOK_PYO_POP} from "@/store/hooks/hookPop"; // default import

export const PyoPop = () => {
	const { getPyoPop, setPyoPop } = HOOK_PYO_POP();
	const [showClass, setShowClass] = useState<string>("");

	useEffect(() => {
		setPyoPop({
			show: false,
			type: "alert",
			title: null,
			contents: null,
			cancle_title: "취소",
			cancle_fun: null,
			success_title: "확인",
			success_fun: null,
		});
	}, []);

	useEffect(() => {
		if (getPyoPop.show) {
			setShowClass("show");
		}
	}, [getPyoPop]);

	const hidePop = () => {
		setShowClass("");
		setTimeout(() => {
			setPyoPop({
				show: false,
				type: "alert",
				title: null,
				contents: null,
				cancle_title: "취소",
				cancle_fun: null,
				success_title: "확인",
				success_fun: null,
			});
		}, 300);
	};

	const funCancle = () => {
		if (getPyoPop.cancle_fun) {
			getPyoPop.cancle_fun(hidePop); // hidePop을 인자로 전달
		} else {
			hidePop();
		}
	};

	const funSuccess = () => {
		if (getPyoPop.success_fun) {
			getPyoPop.success_fun(hidePop); // hidePop을 인자로 전달
		} else {
			hidePop();
		}
	};

	return (
		getPyoPop.show && (
			<div className="pyo-pop">
				<div
					className={`pyo-pop-inner ${showClass}`}
					onClick={() => {
						hidePop();
					}}
				>
					<div
						className="pyo-pop-container"
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						{getPyoPop.title && (
							<div
								className="pyo-pop-title"
								dangerouslySetInnerHTML={{
									__html: getPyoPop.title,
								}}
							/>
						)}
						{getPyoPop.contents &&
							(typeof getPyoPop.contents === "object" ? (
								<div className="pyo-pop-contents">
									{getPyoPop.contents}
								</div>
							) : (
								<div
									className="pyo-pop-contents"
									dangerouslySetInnerHTML={{
										__html: getPyoPop.contents,
									}}
								/>
							))}
						<div
							className={`pyo-pop-bt-wrap ${
								!getPyoPop.title && !getPyoPop.contents
									? "no-data"
									: ""
							}`}
						>
							{getPyoPop.type === "confirm" && (
								<button
									className="pyo-pop-bt-cancle"
									onClick={funCancle}
									dangerouslySetInnerHTML={{
										__html: getPyoPop.cancle_title,
									}}
								/>
							)}
							<button
								className="pyo-pop-bt-success"
								onClick={funSuccess}
								dangerouslySetInnerHTML={{
									__html: getPyoPop.success_title,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		)
	);
};