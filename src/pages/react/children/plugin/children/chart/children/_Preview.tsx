import { useState } from 'react';
import { PyoPluginChartPie } from "./Pie";
import { PyoPluginChartBar } from "./Bar";
import { PyoPluginChartLine } from "./Line";

export const PyoPluginChartPreview = () => {
	const [viewType, setViewType] = useState<string>('pie')

	return (
		<>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<button
					className={`pyo-button color-1 s-s ${viewType !== 'pie' && 'line'}`}
					onClick={() => setViewType('pie')}
				>Pie Chart</button>
				<button
					className={`pyo-button color-1 s-s ${viewType !== 'bar' && 'line'}`}
					onClick={() => setViewType('bar')}
				>Bar Chart</button>
				<button
					className={`pyo-button color-1 s-s ${viewType !== 'line' && 'line'}`}
					onClick={() => setViewType('line')}
				>Line Chart</button>
				{ viewType === "pie" && <PyoPluginChartPie />}
				{ viewType === "bar" && <PyoPluginChartBar />}
				{ viewType === "line" && <PyoPluginChartLine />}
			</div>
		</>
	);
};
