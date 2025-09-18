// src/HeatmapChart.tsx
import React, { useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/heatmap";

type Pointer = { boxIndex: number; x: number; y: number }; // 박스 내부 상대좌표 (0~100%)

// 예시 포인터 데이터
const pointerSeries: Pointer[] = [
  { boxIndex: 0, x: 5, y: 10 },   // 첫 번째 박스 5%,10%
  { boxIndex: 0, x: 50, y: 50 },  // 첫 번째 박스 중앙
  { boxIndex: 1, x: 30, y: 20 },  // 두 번째 박스
  { boxIndex: 25, x: 80, y: 60 }, // 26번째 박스
];

// Heatmap Grid 크기
const xBoxCount = 24;
const yBoxCount = 160;

// Grid 데이터 생성
const gridData: number[][] = [];
for (let y = 0; y < yBoxCount; y++) {
  for (let x = 0; x < xBoxCount; x++) {
    gridData.push([x, y, 1]);
  }
}

// 포인터 좌표 변환: 박스 왼쪽 상단 기준
const scatterData = pointerSeries.map((p) => {
  const boxY = Math.floor(p.boxIndex / xBoxCount);
  const boxX = p.boxIndex % xBoxCount;

  return {
    x: boxX + (p.x - 50) / 100,
    y: boxY + (p.y - 50) / 100,
  };
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

          return true; // 기본 줌 허용 → Reset Zoom 버튼 생성
        },
      },
    } as any,
    title: { text: "24x160 Heatmap + Pointer" },
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
        const point = (this as any).point as Highcharts.Point & { value?: number };

        if (this.series.type === "scatter") {
          // Scatter 좌표에서 -50% 보정 복원
          const rawX = point.x! + 0.5;
          const rawY = point.y! + 0.5;

          const boxX = Math.floor(rawX);
          const boxY = Math.floor(rawY);
          const boxIndex = boxY * xBoxCount + boxX;

          const relativeX = ((rawX - boxX) * 100).toFixed(1);
          const relativeY = ((rawY - boxY) * 100).toFixed(1);

          return `<b>포인터</b><br/>Box Index: ${boxIndex}<br/>X: ${relativeX}%<br/>Y: ${relativeY}%`;
        } else if (this.series.type === "heatmap") {
          const boxIndex = point.y! * xBoxCount + point.x!;
          return `<b>박스</b><br/>Box Index: ${boxIndex}`;
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
      {
        id: "pointer-series",
        type: "scatter",
        data: scatterData,
        marker: { symbol: "circle", radius: 2, fillColor: "red" },
        enableMouseTracking: true,
        animation: false,
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />;
};

export default HeatmapChart;
