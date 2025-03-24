import Highlight from "react-highlight";

const filterJsIm = `// javascript
<script src="/js/pyoFilter.js"></script>

// react
import { getFilter } from '@/utils/getFilter';`;

const filterJs = `getFilter.dateBetween(
	'시작일', // 날짜 입력 String, Date object !필수 값
	'종료일' // 날짜 입력 String, Date object !필수 값
);`;

const sampleJs = `getFilter.dateBetween('2024-10-10', '2024-11-20');
// output: 41

getFilter.dateBetween('2024-12-10', '2024-09-01');
// output: -100
`;

export const FilterDateBetween = () => {
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
