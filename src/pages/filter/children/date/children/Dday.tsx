import Highlight from "react-highlight";

const filterJsIm = `// javascript
<script src="/js/lmFilter.js"></script>

// react
import { getFilter } from '@/utils/getFilter';`;

const filterJs = `getFilter.dateDday(
	'날짜' // 날짜 입력 String, Date object !필수 값
);`;

const sampleJs = `// 기준일 !default new Date(); 당일
// 테스트 기준일 2024-09-23
getFilter.dateDday('2024-10-10');
// output: 17

getFilter.dateDday('2024-08-10');
// output: -44
`;

export const FilterDateDday = () => {
	return (
		<div className="lm-panel lm-panel-flex-wrap">
			<Highlight className="javascript lm-panel-code">
				{filterJsIm}
			</Highlight>
			<Highlight className="javascript lm-panel-code">
				{filterJs}
			</Highlight>
			<Highlight className="javascript lm-panel-code">
				{sampleJs}
			</Highlight>
		</div>
	);
};
