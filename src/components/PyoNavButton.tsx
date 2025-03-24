import { useNavigate, useLocation } from "react-router-dom";

interface PyoNavButtonProps {
	to?: string; // 선택적 속성
	pyoClass?: string;
	pyoParents?: boolean;
	pyoEvent?: (() => void) | undefined;
	children: React.ReactNode;
}

export const PyoNavButton: React.FC<PyoNavButtonProps> = ({
	to,
	pyoClass = "",
	pyoParents = false,
	pyoEvent,
	children,
}) => {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const currentPath = `${pathname}${search}`;

	// 부모 경로 포함 여부에 따른 활성화 클래스 설정
	const isActive = pyoParents
		? (pathname === "/" && to === "/") || (to !== undefined && pathname.includes(to))
		: to === currentPath;

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		if (pyoEvent) {
			pyoEvent(); // 전달된 이벤트 호출
		} else if (to) {
			navigate(to); // to가 정의된 경우에만 navigate 호출
		} else {
			console.warn("Navigation path (to) is undefined.");
		}
	};

	return (
		<button
			onClick={handleClick}
			className={`${isActive ? "active" : ""} ${pyoClass}`}
		>
			{children}
		</button>
	);
};
