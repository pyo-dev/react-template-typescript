// HeatmapChart.tsx
import React, { useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/heatmap";

type Pointer = { boxIndex: number; x: number; y: number };

interface HeatmapChartProps {
	pointerSeries: Pointer[];
	xBoxCount: number;
	yBoxCount: number;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ pointerSeries, xBoxCount, yBoxCount }) => {
	const chartRef = useRef<HighchartsReact.RefObject>(null);

	// Grid 데이터 생성
	const gridData: number[][] = [];
	for (let y = 0; y < yBoxCount; y++) {
		for (let x = 0; x < xBoxCount; x++) {
			gridData.push([x, y, 1]); // 기존 색 값 유지
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

					// 모든 line 시리즈 가져오기 (verticalLineSeries)
					const lines = chart.series.filter(
						(s) => s.type === "line" && s.userOptions.id?.startsWith("vline-")
					);

					// 드래그 영역에 포함된 라인 필터링
					const linesInSelection = lines.filter((line) =>
						line.data.some((p) => p.x! >= xMin && p.x! <= xMax && p.y! >= yMin && p.y! <= yMax)
					);

					console.log("선택된 라인 정보:", linesInSelection.map((l) => l.userOptions.id));

					return true; // zoom 동작 허용
				},
			},
		} as any,
		title: { text: `${xBoxCount}x${yBoxCount} Heatmap + Pointer + Vertical Lines` },
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
				const point = (this as any).point as Highcharts.Point & {
					value?: number;
					custom?: { boxIndex: number; xPercent: number };
				};

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
			...verticalLineSeries,
		],
	};

	return <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />;
};

export default HeatmapChart;
