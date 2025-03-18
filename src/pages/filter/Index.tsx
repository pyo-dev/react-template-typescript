import { useLocation } from 'react-router-dom';

import { LmNavButton } from "@/components/LmNavButton";

import { FilterDate } from "./children/date/Index";
import { FilterText } from "./children/text/Index";

const LmFilter = () => {
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth1: string = params.get('depth1') || 'date';

	return (
		<>
			<div className="lm-panel-title">
				<div className="lm-icon-box color-5"><div className="lm-icon-el color-white"></div></div>
				<div>
					<div className="title">FILTER</div>
					<div className="des">pyo-dev javascript 필터 모음</div>
				</div>
			</div>

			<div className="lm-tab">
				<LmNavButton to="/filter" lmClass={getDepth1 === 'date' ? 'active' : ''}><div className="lm-icon-pin"></div>날짜</LmNavButton>
				<LmNavButton to="/filter?depth1=text"><div className="lm-icon-pin"></div>문자</LmNavButton>
			</div>

			{ getDepth1 === "date" && <FilterDate />}
			{ getDepth1 === "text" && <FilterText />}
		</>
	);
};

export default LmFilter;