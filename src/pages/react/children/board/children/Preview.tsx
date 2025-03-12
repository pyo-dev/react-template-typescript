import { useLocation } from "react-router-dom";
import { LmNavButton } from "@/components/LmNavButton";
import { LmReactBoardNotice } from "./notice/List";
import { LmReactBoardFaq } from "./faq/List";

export const LmReactBoardPreview = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const boardType: string = params.get('boardType') || 'basic';

	return (
		<>
			<div className="lm-tab">
				{/* 소스 및 미리보기 버튼 */}
				<LmNavButton to="/react?depth1=board&depth2=preview&boardType=basic" lmClass={ boardType === 'basic' ? 'active' : '' }>
					<div className="lm-icon-pin"></div>공지사항
				</LmNavButton>
				<LmNavButton to="/react?depth1=board&depth2=preview&boardType=faq" lmClass={ boardType === 'faq' ? 'active' : '' }>
					<div className="lm-icon-pin"></div>FAQ
				</LmNavButton>
			</div>
				{boardType === 'basic' ? (
					<LmReactBoardNotice />
				) : (
					<LmReactBoardFaq />
				)}
		</>
	);
};



