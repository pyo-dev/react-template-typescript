import { useState } from "react";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";

import "react-datepicker/dist/react-datepicker.css";
import "@/assets/scss/_datepicker.scss";

export const LmPluginDatepickerPreview = () => {
	// 기본
	const [startDateA, setStartDateA] = useState<Date | undefined>(new Date());

	// 년,월 선택
	const [startDateB, setStartDateB] = useState<Date | undefined>(new Date());

	// ranges 선택
	const [dateRangeC, setDateRangeC] = useState<
		[Date | undefined, Date | undefined]
	>([undefined, undefined]);
	const [startDateC, endDateC] = dateRangeC;

	// 이전일 이후일 선택 금지
	const [dateRangeD, setDateRangeD] = useState<
		[Date | undefined, Date | undefined]
	>([new Date(), new Date()]);
	const [startDateD, endDateD] = dateRangeD;

	// 듀얼 달력
	const [startDateE, setStartDateE] = useState<Date | undefined>(new Date());

	// ranges + 듀얼 달력
	const [dateRangeF, setDateRangeF] = useState<
		[Date | undefined, Date | undefined]
	>([new Date(), new Date("2024-09-10")]);
	const [startDateF, endDateF] = dateRangeF;

	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<div>기본</div>
				<DatePicker
					className="lm-input"
					locale={ko}
					dateFormat="yyyy-MM-dd"
					selected={startDateA || null} // undefined -> null
					onChange={(date: Date | null) =>
						setStartDateA(date || undefined)
					}
				/>
			</div>

			<div className="lm-panel lm-panel-flex-wrap">
				<div>년,월 선택</div>
				<DatePicker
					className="lm-input"
					locale={ko}
					dateFormat="yyyy-MM-dd"
					selected={startDateB || null} // undefined -> null
					onChange={(date: Date | null) =>
						setStartDateB(date || undefined)
					}
					showMonthDropdown
					showYearDropdown
					dropdownMode="select"
				/>
			</div>

			<div className="lm-panel lm-panel-flex-wrap">
				<div>ranges 선택</div>
				<DatePicker
					className="lm-input"
					locale={ko}
					selectsRange
					startDate={startDateC} // undefined -> null
					endDate={endDateC} // undefined -> null
					onChange={(dates: [Date | null, Date | null]) =>
						setDateRangeC(
							dates.map((d) => d || undefined) as [
								Date | undefined,
								Date | undefined
							]
						)
					}
				/>
			</div>

			<div className="lm-panel lm-panel-flex-wrap">
				<div>이전일 이후일 선택 금지</div>
				<DatePicker
					className="lm-input"
					locale={ko}
					selectsRange
					startDate={startDateD} // undefined -> null
					endDate={endDateD} // undefined -> null
					minDate={new Date("2024-12-01")}
					maxDate={new Date("2024-12-11")}
					onChange={(dates: [Date | null, Date | null]) =>
						setDateRangeD(
							dates.map((d) => d || undefined) as [
								Date | undefined,
								Date | undefined
							]
						)
					}
				/>
			</div>

			<div className="lm-panel lm-panel-flex-wrap">
				<div>듀얼 달력</div>
				<DatePicker
					className="lm-input"
					locale={ko}
					selected={startDateE || null} // undefined -> null
					onChange={(date: Date | null) =>
						setStartDateE(date || undefined)
					}
					monthsShown={2}
				/>
			</div>

			<div className="lm-panel lm-panel-flex-wrap">
				<div>듀얼 달력 + ranges 선택</div>
				<DatePicker
					className="lm-input"
					locale={ko}
					selectsRange
					startDate={startDateF} // undefined -> null
					endDate={endDateF} // undefined -> null
					onChange={(dates: [Date | null, Date | null]) =>
						setDateRangeF(
							dates.map((d) => d || undefined) as [
								Date | undefined,
								Date | undefined
							]
						)
					}
					monthsShown={2}
				/>
			</div>
		</>
	);
};
