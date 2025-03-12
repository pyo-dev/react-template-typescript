import { useNavigate, useLocation } from "react-router-dom";

interface LmNavButtonProps {
	to?: string; // 선택적 속성
	lmClass?: string;
	lmParents?: boolean;
	lmEvent?: (() => void) | undefined;
	children: React.ReactNode;
}

export const LmNavButton: React.FC<LmNavButtonProps> = ({
	to,
	lmClass = "",
	lmParents = false,
	lmEvent,
	children,
}) => {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const currentPath = `${pathname}${search}`;

	// 부모 경로 포함 여부에 따른 활성화 클래스 설정
	const isActive = lmParents
		? (pathname === "/" && to === "/") || (to !== undefined && pathname.includes(to))
		: to === currentPath;

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		if (lmEvent) {
			lmEvent(); // 전달된 이벤트 호출
		} else if (to) {
			navigate(to); // to가 정의된 경우에만 navigate 호출
		} else {
			console.warn("Navigation path (to) is undefined.");
		}
	};

	return (
		<button
			onClick={handleClick}
			className={`${isActive ? "active" : ""} ${lmClass}`}
		>
			{children}
		</button>
	);
};
