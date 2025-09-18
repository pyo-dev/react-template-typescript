// src/HeatmapChart.tsx
import React, { useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/heatmap";

type Pointer = { boxIndex: number; x: number; y: number }; // 박스 내부 상대좌표 (0~100%)

// 예시 포인터 데이터
const pointerSeries: Pointer[] = [
	{ boxIndex: 0, x: 5, y: 10 },   // 첫 번째 박스
	{ boxIndex: 0, x: 50, y: 50 },  // 첫 번째 박스 중앙
	{ boxIndex: 1, x: 30, y: 20 },  // 두 번째 박스
	{ boxIndex: 25, x: 80, y: 60 }, // 26번째 박스
];

const xBoxCount = 24;
const yBoxCount = 160;

// Grid 데이터 생성
const gridData: number[][] = [];
for (let y = 0; y < yBoxCount; y++) {
	for (let x = 0; x < xBoxCount; x++) {
		gridData.push([x, y, 1]);
	}
}

// 박스 안 X좌표 기준 수직선 시리즈 생성
const verticalLineSeries: Highcharts.SeriesLineOptions[] = pointerSeries.map((p, i) => {
	const boxY = Math.floor(p.boxIndex / xBoxCount);
	const boxX = p.boxIndex % xBoxCount;

	const xPos = boxX + (p.x - 50) / 100;

	return {
		id: `vline-${i}`,
		type: "line",
		data: [
			{ x: xPos, y: boxY - 0.5, custom: { boxIndex: p.boxIndex, xPercent: p.x } },
			{ x: xPos, y: boxY + 0.5, custom: { boxIndex: p.boxIndex, xPercent: p.x } },
		],
		color: "blue",
		lineWidth: 1,
		enableMouseTracking: true,
	} as Highcharts.SeriesLineOptions;
});




const HeatmapChart: React.FC = () => {
	const chartRef = useRef<HighchartsReact.RefObject>(null);

	const options: Highcharts.Options = {
		chart: {
			type: "heatmap",
			zoomType: "xy",
			animation: false,
			events: {
				selection: function (event: any) {
					if (!event.xAxis || !event.yAxis) return true;

					const chart = this as unknown as Highcharts.Chart;
					const xMin = event.xAxis[0].min;
					const xMax = event.xAxis[0].max;
					const yMin = event.yAxis[0].min;
					const yMax = event.yAxis[0].max;

					const series = chart.get("pointer-series") as Highcharts.Series | undefined;
					const pointsInSelection =
						series?.data.filter((p) => p.x! >= xMin && p.x! <= xMax && p.y! >= yMin && p.y! <= yMax) || [];

					console.log("선택된 포인터:", pointsInSelection.map((p) => p.options));

					return true;
				},
			},
		} as any,
		title: { text: "24x160 Heatmap + Pointer + Vertical Lines" },
		xAxis: {
			min: 0,
			max: xBoxCount - 1,
			title: { text: "X" },
			startOnTick: false,
			endOnTick: false,
		},
		yAxis: {
			min: 0,
			max: yBoxCount - 1,
			reversed: true,
			title: { text: "Y" },
			startOnTick: false,
			endOnTick: false,
		},
		colorAxis: {
			min: 0,
			max: 1,
			stops: [
				[0, "#f5f5f5"],
				[1, "#f5f5f5"],
			],
			visible: false,
		},
		tooltip: {
			enabled: true,
			formatter: function () {
				const point = (this as any).point as Highcharts.Point & { value?: number, custom?: { boxIndex: number, xPercent: number } };

				if (this.series.type === "heatmap") {
					const boxIndex = point.y! * xBoxCount + point.x!;
					return `<b>박스</b><br/>Box Index: ${boxIndex}`;
				} else if (this.series.type === "line") {
					const c = point.custom!;
					return `<b>라인</b><br/>Box Index: ${c.boxIndex}<br/>X: ${c.xPercent}%`;
				}
				return "";
			},
		},
		series: [
			{
				id: "grid",
				type: "heatmap",
				data: gridData,
				borderWidth: 1,
				borderColor: "#ddd",
				enableMouseTracking: true,
				animation: false,
			},
			...verticalLineSeries, // 수직선 시리즈 추가
		],
	};

	return <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />;
};

export default HeatmapChart;
