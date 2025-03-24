import Highlight from "react-highlight";

const filterJsIm = `// javascript
<script src="/js/pyoFilter.js"></script>

// react
import { getFilter } from '@/utils/getFilter';`;

const filterJs = `getFilter.dateByOffset(
	2, // 숫자 입력 Number !필수 값
	'day', // 기준범위 일,월,년(day, month, year) String !default 'day' !생략 가능
	'2024-10-20' // !default new Date(); 당일 !생략 가능
);`;

const sampleJs = `// 기준일 !default new Date(); 당일
// 테스트 기준일 2024-09-23
getFilter.dateByOffset(2);
// output: 2024-09-25

getFilter.dateByOffset(2, 'month');
// output: 2024-11-23

getFilter.dateByOffset(2, 'year');
// output: 2026-09-23

getFilter.dateByOffset(2, 'day', '2024-10-10');
// output: 2024-10-12

getFilter.dateByOffset(2, 'month', '2024-10-10');
// output: 2024-12-10

getFilter.dateByOffset(2, 'year', '2024-10-10');
// output: 2026-10-10
`;

export const FilterDateByoffset = () => {
	return (
		<div className="pyo-panel pyo-panel-flex-wrap">
			<Highlight className="javascript pyo-panel-code">
				{filterJsIm}
			</Highlight>
			<Highlight className="javascript pyo-panel-code">
				{filterJs}
			</Highlight>
			<Highlight className="javascript pyo-panel-code">
				{sampleJs}
			</Highlight>
		</div>
	);
};
