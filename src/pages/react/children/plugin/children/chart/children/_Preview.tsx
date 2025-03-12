import { useState } from 'react';
import { LmPluginChartPie } from "./Pie";
import { LmPluginChartBar } from "./Bar";
import { LmPluginChartLine } from "./Line";

export const LmPluginChartPreview = () => {
	const [viewType, setViewType] = useState<string>('pie')

	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<button
					className={`lm-button color-1 s-s ${viewType !== 'pie' && 'line'}`}
					onClick={() => setViewType('pie')}
				>Pie Chart</button>
				<button
					className={`lm-button color-1 s-s ${viewType !== 'bar' && 'line'}`}
					onClick={() => setViewType('bar')}
				>Bar Chart</button>
				<button
					className={`lm-button color-1 s-s ${viewType !== 'line' && 'line'}`}
					onClick={() => setViewType('line')}
				>Line Chart</button>
				{ viewType === "pie" && <LmPluginChartPie />}
				{ viewType === "bar" && <LmPluginChartBar />}
				{ viewType === "line" && <LmPluginChartLine />}
			</div>
		</>
	);
};
