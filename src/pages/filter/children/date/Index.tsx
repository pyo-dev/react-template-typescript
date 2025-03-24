import { useLocation } from 'react-router-dom';
import { PyoNavButton } from "@/components/PyoNavButton";
import { FilterDateFormat } from './children/Format';
import { FilterDateDday } from './children/Dday';
import { FilterDateBetween } from './children/Between';
import { FilterDateIncheck } from './children/Incheck';
import { FilterDateByoffset } from './children/Byoffset';

export const FilterDate = () => {
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth2: string = params.get('depth2') || 'format';

	return (
		<>
			<div className="pyo-tab">
				<PyoNavButton to="/filter"><div className="pyo-icon-pin"></div>포멧 타입</PyoNavButton>
				<PyoNavButton to="/filter?depth1=date&depth2=dday"><div className="pyo-icon-pin"></div>당일기준 남은 일정</PyoNavButton>
				<PyoNavButton to="/filter?depth1=date&depth2=between"><div className="pyo-icon-pin"></div>일정 사이 계산</PyoNavButton>
				<PyoNavButton to="/filter?depth1=date&depth2=incheck"><div className="pyo-icon-pin"></div>일정 사이 포함</PyoNavButton>
				<PyoNavButton to="/filter?depth1=date&depth2=byoffset"><div className="pyo-icon-pin"></div>일정 전,후 일</PyoNavButton>
			</div>

			{getDepth2 === 'format' && <FilterDateFormat/>}
			{getDepth2 === 'dday' && <FilterDateDday/>}
			{getDepth2 === 'between' && <FilterDateBetween/>}
			{getDepth2 === 'incheck' && <FilterDateIncheck/>}
			{getDepth2 === 'byoffset' && <FilterDateByoffset/>}
		</>
	);
};