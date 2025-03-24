import { useLocation } from "react-router-dom";
import { PyoNavButton } from "@/components/PyoNavButton";
import { PyoReactImg } from "./children/img/Index";
import { PyoReactData } from "./children/data/Index";
import { PyoReactGnb } from "./children/gnb/Index";
import { PyoeReactPopup } from "./children/popup/Index";
import { PyoReactBoard } from "./children/board/Index";
import { PyoReactPlugin } from "./children/plugin/Index";

const PyoReact = () => {
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth1: string = params.get('depth1') || 'img';
	
	return (
		<>
			<div className="pyo-panel-title">
				<div className="pyo-icon-box color-4"><div className="pyo-icon-star color-white"></div></div>
				<div>
					<div className="title">REACT</div>
					<div className="des">react 사용법 및 플러그인 모음</div>
				</div>
			</div>

			<div className="pyo-tab">
				<PyoNavButton to="/react" pyoClass={ getDepth1 === 'img' ? 'active' : '' }><div className="pyo-icon-pin"></div>이미지</PyoNavButton>
				<PyoNavButton to="/react?depth1=data" pyoClass={ getDepth1 === 'data' ? 'active' : '' }><div className="pyo-icon-pin"></div>컴포넌트간 데이터 통신</PyoNavButton>
				<PyoNavButton to="/react?depth1=board" pyoClass={ getDepth1 === 'board' ? 'active' : '' }><div className="pyo-icon-pin"></div>게시판</PyoNavButton>
				<PyoNavButton to="/react?depth1=popup" pyoClass={ getDepth1 === 'popup' ? 'active' : '' }><div className="pyo-icon-pin"></div>팝업</PyoNavButton>
				<PyoNavButton to="/react?depth1=gnb" pyoClass={ getDepth1 === 'gnb' ? 'active' : '' }><div className="pyo-icon-pin"></div>메뉴</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin" pyoClass={ getDepth1 === 'plugin' ? 'active' : '' }><div className="pyo-icon-pin"></div>플러그인</PyoNavButton>
			</div>

			{ getDepth1 === 'img' && <PyoReactImg />}
			{ getDepth1 === 'data' && <PyoReactData />}
			{ getDepth1 === 'gnb' && <PyoReactGnb />}
			{ getDepth1 === 'popup' && <PyoeReactPopup />}
			{ getDepth1 === 'board' && <PyoReactBoard />}
			{ getDepth1 === 'plugin' && <PyoReactPlugin />}
		</>
	);
};

export default PyoReact;