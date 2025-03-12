import { useLocation } from "react-router-dom";
import { LmNavButton } from "@/components/LmNavButton";
import { LmReactImg } from "./children/img/Index";
import { LmReactData } from "./children/data/Index";
import { LmReactGnb } from "./children/gnb/Index";
import { LmeReactPopup } from "./children/popup/Index";
import { LmReactBoard } from "./children/board/Index";
import { LmReactPlugin } from "./children/plugin/Index";

const LmReact = () => {
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth1: string = params.get('depth1') || 'img';
	
	return (
		<>
			<div className="lm-panel-title">
				<div className="lm-icon-box color-4"><div className="lm-icon-star color-white"></div></div>
				<div>
					<div className="title">REACT</div>
					<div className="des">react 사용법 및 플러그인 모음</div>
				</div>
			</div>

			<div className="lm-tab">
				<LmNavButton to="/react" lmClass={ getDepth1 === 'img' ? 'active' : '' }><div className="lm-icon-pin"></div>이미지</LmNavButton>
				<LmNavButton to="/react?depth1=data" lmClass={ getDepth1 === 'data' ? 'active' : '' }><div className="lm-icon-pin"></div>컴포넌트간 데이터 통신</LmNavButton>
				<LmNavButton to="/react?depth1=board" lmClass={ getDepth1 === 'board' ? 'active' : '' }><div className="lm-icon-pin"></div>게시판</LmNavButton>
				<LmNavButton to="/react?depth1=popup" lmClass={ getDepth1 === 'popup' ? 'active' : '' }><div className="lm-icon-pin"></div>팝업</LmNavButton>
				<LmNavButton to="/react?depth1=gnb" lmClass={ getDepth1 === 'gnb' ? 'active' : '' }><div className="lm-icon-pin"></div>메뉴</LmNavButton>
				<LmNavButton to="/react?depth1=plugin" lmClass={ getDepth1 === 'plugin' ? 'active' : '' }><div className="lm-icon-pin"></div>플러그인</LmNavButton>
			</div>

			{ getDepth1 === 'img' && <LmReactImg />}
			{ getDepth1 === 'data' && <LmReactData />}
			{ getDepth1 === 'gnb' && <LmReactGnb />}
			{ getDepth1 === 'popup' && <LmeReactPopup />}
			{ getDepth1 === 'board' && <LmReactBoard />}
			{ getDepth1 === 'plugin' && <LmReactPlugin />}
		</>
	);
};

export default LmReact;