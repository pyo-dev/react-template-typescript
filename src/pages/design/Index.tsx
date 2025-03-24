import { useLocation } from "react-router-dom";
import { PyoDesignIcon } from "./children/Icon";
import { PyoDesignButton } from "./children/Button";
import { PyoDesignTab } from "./children/Tab";
import { PyoDesignPopup } from "./children/Popup";
import { PyoDesignForm } from "./children/form/Index";
import { PyoNavButton } from "@/components/PyoNavButton";

const PyoDesign = () => {

	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth1: string = params.get('depth1') || 'icon';

	return (
		<>
			<div className="pyo-panel-title">
				<div className="pyo-icon-box color-1"><div className="pyo-icon-smile color-white"></div></div>
				<div>
					<div className="title">DESIGN</div>
					<div className="des">pyo-dev 내부 디자인 에셋</div>
				</div>
			</div>

			<div className="pyo-tab">
				<PyoNavButton to="/design"><div className="pyo-icon-pin"></div>아이콘</PyoNavButton>
				<PyoNavButton to="/design?depth1=button"><div className="pyo-icon-all-menu-2"></div>버튼</PyoNavButton>
				<PyoNavButton to="/design?depth1=tab"><div className="pyo-icon-link"></div>텝</PyoNavButton>
				<PyoNavButton to="/design?depth1=popup"><div className="pyo-icon-i"></div>팝업</PyoNavButton>
				<PyoNavButton to="/design?depth1=form" pyoClass={ getDepth1 === 'form' ? 'active' : '' }><div className="pyo-icon-note"></div>폼</PyoNavButton>
			</div>

			<div className='pyo-panel-guide'>
				<div className='pyo-icon-feel color-4'></div>
				해당 영역을 클릭하시면 해당 태그가 복사됩니다.
			</div>
			{getDepth1 === 'icon' && <PyoDesignIcon />}
			{getDepth1 === 'button' && <PyoDesignButton />}
			{getDepth1 === 'tab' && <PyoDesignTab />}
			{getDepth1 === 'popup' && <PyoDesignPopup />}
			{getDepth1 === 'form' && <PyoDesignForm />}
		</>
	);
};

export default PyoDesign;