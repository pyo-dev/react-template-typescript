import { useLocation } from "react-router-dom";
import { LmNavButton } from "@/components/LmNavButton";
import { LmPluginReactHelmet } from "./children/react-helmet/Index";
import { LmPluginSwiper } from "./children/swiper/Index";
import { LmPluginDatepicker } from "./children/datepicker/Index";
import { LmPluginEditor } from "./children/editor/Index";
import { LmPluginExcel } from "./children/excel/Index";
import { LmPluginHighlight } from "./children/highlight/Index";
import { LmPluginSortable } from "./children/sortable/Index";
import { LmPluginChart } from "./children/chart/Index";

export const LmReactPlugin = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth2: string = params.get('depth2') || 'reacthelmet';

	return (
		<>
			<div className="lm-tab">
				<LmNavButton to="/react?depth1=plugin" lmClass={ getDepth2 === 'reacthelmet' ? 'active' : '' }><div className="lm-icon-pin"></div>react-helmet</LmNavButton>
				<LmNavButton to="/react?depth1=plugin&depth2=swiper" lmClass={ getDepth2 === 'swiper' ? 'active' : '' }><div className="lm-icon-pin"></div>swiper</LmNavButton>
				<LmNavButton to="/react?depth1=plugin&depth2=datepicker" lmClass={ getDepth2 === 'datepicker' ? 'active' : '' }><div className="lm-icon-pin"></div>datepicker</LmNavButton>
				<LmNavButton to="/react?depth1=plugin&depth2=editor" lmClass={ getDepth2 === 'editor' ? 'active' : '' }><div className="lm-icon-pin"></div>editor</LmNavButton>
				<LmNavButton to="/react?depth1=plugin&depth2=chart" lmClass={ getDepth2 === 'chart' ? 'active' : '' }><div className="lm-icon-pin"></div>chart</LmNavButton>
				<LmNavButton to="/react?depth1=plugin&depth2=excel" lmClass={ getDepth2 === 'excel' ? 'active' : '' }><div className="lm-icon-pin"></div>excel</LmNavButton>
				<LmNavButton to="/react?depth1=plugin&depth2=sortable" lmClass={ getDepth2 === 'sortable' ? 'active' : '' }><div className="lm-icon-pin"></div>sortable</LmNavButton>
				<LmNavButton to="/react?depth1=plugin&depth2=highlight" lmClass={ getDepth2 === 'highlight' ? 'active' : '' }><div className="lm-icon-pin"></div>highlight</LmNavButton>
			</div>
			{getDepth2 === 'reacthelmet' && <LmPluginReactHelmet />}
			{getDepth2 === 'swiper' && <LmPluginSwiper />}
			{getDepth2 === 'datepicker' && <LmPluginDatepicker />}
			{getDepth2 === 'editor' && <LmPluginEditor />}
			{getDepth2 === 'chart' && <LmPluginChart />}
			{getDepth2 === 'excel' && <LmPluginExcel />}
			{getDepth2 === 'sortable' && <LmPluginSortable />}
			{getDepth2 === 'highlight' && <LmPluginHighlight />}
		</>
	);
};
