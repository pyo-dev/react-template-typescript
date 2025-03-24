import { useLocation } from 'react-router-dom';

import { PyoNavButton } from "@/components/PyoNavButton";

import { FilterDate } from "./children/date/Index";
import { FilterText } from "./children/text/Index";

const PyoFilter = () => {
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth1: string = params.get('depth1') || 'date';

	return (
		<>
			<div className="pyo-panel-title">
				<div className="pyo-icon-box color-5"><div className="pyo-icon-el color-white"></div></div>
				<div>
					<div className="title">FILTER</div>
					<div className="des">pyo-dev javascript 필터 모음</div>
				</div>
			</div>

			<div className="pyo-tab">
				<PyoNavButton to="/filter" pyoClass={getDepth1 === 'date' ? 'active' : ''}><div className="pyo-icon-pin"></div>날짜</PyoNavButton>
				<PyoNavButton to="/filter?depth1=text"><div className="pyo-icon-pin"></div>문자</PyoNavButton>
			</div>

			{ getDepth1 === "date" && <FilterDate />}
			{ getDepth1 === "text" && <FilterText />}
		</>
	);
};

export default PyoFilter;