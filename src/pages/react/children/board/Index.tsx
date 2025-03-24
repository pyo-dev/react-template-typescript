import { useLocation } from "react-router-dom";
import { PyoNavButton } from "@/components/PyoNavButton";
import { PyoReactBoardCode } from "./children/Code";
import { PyoReactBoardPreview } from "./children/Preview";

export const PyoReactBoard = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth2: string = params.get('depth2') || 'code';

	return (
		<>
			<div className="pyo-tab">
				{/* 소스 및 미리보기 버튼 */}
				<PyoNavButton to="/react?depth1=board">
					<div className="pyo-icon-pin"></div>소스
				</PyoNavButton>
				<PyoNavButton to="/react?depth1=board&depth2=preview" pyoClass={ getDepth2 === 'preview' ? 'active' : '' }>
					<div className="pyo-icon-pin"></div>미리보기
				</PyoNavButton>
			</div>
			{getDepth2 === 'code' ? (
				<PyoReactBoardCode />
			) : (
				<PyoReactBoardPreview />
			)}
		</>
	);
};
