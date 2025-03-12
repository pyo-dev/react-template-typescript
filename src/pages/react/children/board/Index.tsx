import { useLocation } from "react-router-dom";
import { LmNavButton } from "@/components/LmNavButton";
import { LmReactBoardCode } from "./children/Code";
import { LmReactBoardPreview } from "./children/Preview";

export const LmReactBoard = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth2: string = params.get('depth2') || 'code';

	return (
		<>
			<div className="lm-tab">
				{/* 소스 및 미리보기 버튼 */}
				<LmNavButton to="/react?depth1=board">
					<div className="lm-icon-pin"></div>소스
				</LmNavButton>
				<LmNavButton to="/react?depth1=board&depth2=preview" lmClass={ getDepth2 === 'preview' ? 'active' : '' }>
					<div className="lm-icon-pin"></div>미리보기
				</LmNavButton>
			</div>
			{getDepth2 === 'code' ? (
				<LmReactBoardCode />
			) : (
				<LmReactBoardPreview />
			)}
		</>
	);
};
