import { useState, useEffect, useRef } from "react";

interface ToastPopItemProps {
	data: {
		type: string;
		iconType: string;
		title: string;
		contents: string;
	};
	closeAc: () => void;
}

export const PyoToastPopItem: React.FC<ToastPopItemProps> = ({ data, closeAc }) => {
	const [show, setShow] = useState<boolean>(false);
	const [showClass, setShowClass] = useState<string>("");
	const innerRef = useRef<HTMLDivElement | null>(null);
	const [innerHeight, setInnerHeight] = useState<number>(0);

	const itemClose = () => {
		setShowClass("hidden");
		if (innerRef.current) {
			setInnerHeight(0);
		}
		setTimeout(() => {
			setShow(false);
			closeAc();
		}, 510);
	};

	useEffect(() => {
		setShow(true);
		const timer = setTimeout(() => {
			setShowClass("show");
			if (innerRef.current) {
				setInnerHeight(innerRef.current.offsetHeight);
			}

			setTimeout(() => {
				itemClose();
			}, 3000);
		}, 10);

		return () => clearTimeout(timer);
	}, []);

	return (
		show && (
			<div
				className={`pyo-pop-toast ${showClass}`}
				style={{ height: innerHeight }}
			>
				<div className={`inner ${data.type}`} ref={innerRef}>
					<div className="info">
						<div className={`icon ${data.iconType}`}></div>
						<div className="contents">
							<div className="title">{data.title}</div>
							<div className="con">{data.contents}</div>
						</div>
					</div>
					<button className="close" onClick={itemClose}></button>
				</div>
			</div>
		)
	);
};
