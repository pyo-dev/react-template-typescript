import Highlight from "react-highlight";

const filterJsIm = `// javascript
<script src="/js/lmFilter.js"></script>

// react
import { getFilter } from '@/utils/getFilter';`;

const filterJs = `getFilter.dateFormat(
	'날짜', // 날짜 입력 String, Date object !필수 값
	option: { // !생략 가능
		dateSeparator: '-', // 날짜 구분자 String
		timeSeparator: ':', // 시간 구분자 String
		showYear: true, // 연도 표시 Boolean
		showMonth: true, // 월 표시 Boolean
		showDay: true, // 날짜 표시 Boolean
		showHours: false, // 시간 표시 Boolean
		showMinutes: false, // 분 표시 Boolean
		showSeconds: false // 초 표시 Boolean
	}
);`;

const sampleJs = `let today = new Date();

getFilter.dateFormat(today);
// output: 2024-10-10

getFilter.dateFormat(today, {dateSeparator: '/'});
// output: 2024/10/10

getFilter.dateFormat(
	today,
	{
		showHours: true,
		showMinutes: true,
		showSeconds: true
	}
);
// output: 2024-09-13 12:22:46

getFilter.dateFormat(
	today,
	{
		dateSeparator: '/',
		timeSeparator: '-',
		showHours: true,
		showMinutes: true,
		showSeconds: true
	}
);
// output: 2024/09/13 12:22:46
`;

export const FilterDateFormat = () => {
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
