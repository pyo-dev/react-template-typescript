import { useLocation } from "react-router-dom";
import { PyoNavButton } from "@/components/PyoNavButton";
import { PyoReactBoardNotice } from "./notice/List";
import { PyoReactBoardFaq } from "./faq/List";

export const PyoReactBoardPreview = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const boardType: string = params.get('boardType') || 'basic';

	return (
		<>
			<div className="pyo-tab">
				{/* 소스 및 미리보기 버튼 */}
				<PyoNavButton to="/react?depth1=board&depth2=preview&boardType=basic" pyoClass={ boardType === 'basic' ? 'active' : '' }>
					<div className="pyo-icon-pin"></div>공지사항
				</PyoNavButton>
				<PyoNavButton to="/react?depth1=board&depth2=preview&boardType=faq" pyoClass={ boardType === 'faq' ? 'active' : '' }>
					<div className="pyo-icon-pin"></div>FAQ
				</PyoNavButton>
			</div>
				{boardType === 'basic' ? (
					<PyoReactBoardNotice />
				) : (
					<PyoReactBoardFaq />
				)}
		</>
	);
};



