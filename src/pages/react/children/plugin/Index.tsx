import { useLocation } from "react-router-dom";
import { PyoPluginReactHelmet } from "./children/react-helmet/Index";
import { PyoPluginSwiper } from "./children/swiper/Index";
import { PyoPluginDatepicker } from "./children/datepicker/Index";
import { PyoPluginEditor } from "./children/editor/Index";
import { PyoPluginExcel } from "./children/excel/Index";
import { PyoPluginHighlight } from "./children/highlight/Index";
import { PyoPluginSortable } from "./children/sortable/Index";
import { PyoPluginChart } from "./children/chart/Index";
import { PyoNavButton } from "@/components/PyoNavButton";

export const PyoReactPlugin = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth2: string = params.get('depth2') || 'reacthelmet';

	return (
		<>
			<div className="pyo-tab">
				<PyoNavButton to="/react?depth1=plugin" pyoClass={ getDepth2 === 'reacthelmet' ? 'active' : '' }><div className="pyo-icon-pin"></div>react-helmet</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin&depth2=swiper" pyoClass={ getDepth2 === 'swiper' ? 'active' : '' }><div className="pyo-icon-pin"></div>swiper</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin&depth2=datepicker" pyoClass={ getDepth2 === 'datepicker' ? 'active' : '' }><div className="pyo-icon-pin"></div>datepicker</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin&depth2=editor" pyoClass={ getDepth2 === 'editor' ? 'active' : '' }><div className="pyo-icon-pin"></div>editor</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin&depth2=chart" pyoClass={ getDepth2 === 'chart' ? 'active' : '' }><div className="pyo-icon-pin"></div>chart</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin&depth2=excel" pyoClass={ getDepth2 === 'excel' ? 'active' : '' }><div className="pyo-icon-pin"></div>excel</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin&depth2=sortable" pyoClass={ getDepth2 === 'sortable' ? 'active' : '' }><div className="pyo-icon-pin"></div>sortable</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin&depth2=highlight" pyoClass={ getDepth2 === 'highlight' ? 'active' : '' }><div className="pyo-icon-pin"></div>highlight</PyoNavButton>
			</div>
			{getDepth2 === 'reacthelmet' && <PyoPluginReactHelmet />}
			{getDepth2 === 'swiper' && <PyoPluginSwiper />}
			{getDepth2 === 'datepicker' && <PyoPluginDatepicker />}
			{getDepth2 === 'editor' && <PyoPluginEditor />}
			{getDepth2 === 'chart' && <PyoPluginChart />}
			{getDepth2 === 'excel' && <PyoPluginExcel />}
			{getDepth2 === 'sortable' && <PyoPluginSortable />}
			{getDepth2 === 'highlight' && <PyoPluginHighlight />}
		</>
	);
};
