import { useLocation } from "react-router-dom";
import { LmNavButton } from "@/components/LmNavButton";
import { LmDesignIcon } from "./children/Icon";
import { LmDesignButton } from "./children/Button";
import { LmDesignTab } from "./children/Tab";
import { LmDesignPopup } from "./children/Popup";
import { LmDesignForm } from "./children/form/Index";

const LmDesign = () => {

	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth1: string = params.get('depth1') || 'icon';

	return (
		<>
			<div className="lm-panel-title">
				<div className="lm-icon-box color-1"><div className="lm-icon-smile color-white"></div></div>
				<div>
					<div className="title">DESIGN</div>
					<div className="des">pyo-dev 내부 디자인 에셋</div>
				</div>
			</div>

			<div className="lm-tab">
				<LmNavButton to="/design"><div className="lm-icon-pin"></div>아이콘</LmNavButton>
				<LmNavButton to="/design?depth1=button"><div className="lm-icon-all-menu-2"></div>버튼</LmNavButton>
				<LmNavButton to="/design?depth1=tab"><div className="lm-icon-link"></div>텝</LmNavButton>
				<LmNavButton to="/design?depth1=popup"><div className="lm-icon-i"></div>팝업</LmNavButton>
				<LmNavButton to="/design?depth1=form" lmClass={ getDepth1 === 'form' ? 'active' : '' }><div className="lm-icon-note"></div>폼</LmNavButton>
			</div>

			<div className='lm-panel-guide'>
				<div className='lm-icon-feel color-4'></div>
				해당 영역을 클릭하시면 해당 태그가 복사됩니다.
			</div>
			{getDepth1 === 'icon' && <LmDesignIcon />}
			{getDepth1 === 'button' && <LmDesignButton />}
			{getDepth1 === 'tab' && <LmDesignTab />}
			{getDepth1 === 'popup' && <LmDesignPopup />}
			{getDepth1 === 'form' && <LmDesignForm />}
		</>
	);
};

export default LmDesign;