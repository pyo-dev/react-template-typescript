// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

// -------------------- 그룹 데이터 정의 --------------------
// 트리형 그룹 구조 (뎁스 무제한 가능)
const xGroups = [
  {
    name: "A", range: [0, 11], children: [
      {
        name: "A-1", range: [0, 5], children: [
          { name: "A-1-1", range: [0, 2] },
          { name: "A-1-2", range: [3, 5] }
        ]
      },
      { name: "A-2", range: [6, 11] }
    ]
  },
  { name: "B", range: [12, 23] }
];

const yGroups = [
  { name: "G1", range: [0, 4] },
  {
    name: "G2", range: [5, 9], children: [
      { name: "G2-1", range: [5, 7] },
      { name: "G2-2", range: [8, 9] }
    ]
  }
];
// ---------------------------------------------------------

// 포인터 데이터 타입
type Pointer = { boxIndex: number; x: number; y: number; value: number };

// Props 타입
interface WebGLDetailChartProps {
  height: number;
  xBoxCount: number;
  yBoxCount: number;
  pointers: Pointer[];
  valueMin: number;
  valueMax: number;
  chartType?: "vertical" | "horizontal";
}

// -------------------- WebGL 셰이더 등 기존 코드 --------------------
// (생략 없이 유지)

// ... vertexShaderSource, fragmentShaderSource, compileShader, createProgram,
// resizeCanvasToDisplaySize 동일 ...

// -------------------- 그룹 축 그리기 유틸 --------------------
const drawXGroupRecursive = (
  ctx: CanvasRenderingContext2D,
  group: any,
  depth: number,
  vw: any,
  cellW: number
) => {
  const start = Math.max(group.range[0], vw.xMin);
  const end   = Math.min(group.range[1] + 1, vw.xMax);
  if (end <= start) return;

  const x0 = (start - vw.xMin) * cellW;
  const x1 = (end - vw.xMin) * cellW;
  const mid = (x0 + x1) / 2;

  const top = depth * 20; // 위쪽 여백
  ctx.fillText(group.name, mid, top - 4);

  ctx.beginPath();
  ctx.moveTo(x0, top);
  ctx.lineTo(x1, top);
  ctx.stroke();

  if (group.children) {
    group.children.forEach((child: any) => {
      drawXGroupRecursive(ctx, child, depth + 1, vw, cellW);
    });
  }
};

const drawXAxisGroupsTop = (ctx: CanvasRenderingContext2D, w: number, vw: any) => {
  const cellW = w / (vw.xMax - vw.xMin);
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#333";
  ctx.strokeStyle = "#666";

  xGroups.forEach(group => {
    drawXGroupRecursive(ctx, group, 1, vw, cellW);
  });
};

const drawYGroupRecursive = (
  ctx: CanvasRenderingContext2D,
  group: any,
  depth: number,
  vw: any,
  cellH: number
) => {
  const start = Math.max(group.range[0], vw.yMin);
  const end   = Math.min(group.range[1] + 1, vw.yMax);
  if (end <= start) return;

  const y0 = (start - vw.yMin) * cellH;
  const y1 = (end - vw.yMin) * cellH;
  const mid = (y0 + y1) / 2;

  const left = depth * 60; // 좌측 여백
  ctx.fillText(group.name, left - 8, mid);

  ctx.beginPath();
  ctx.moveTo(left, y0);
  ctx.lineTo(left, y1);
  ctx.stroke();

  if (group.children) {
    group.children.forEach((child: any) => {
      drawYGroupRecursive(ctx, child, depth + 1, vw, cellH);
    });
  }
};

const drawYAxisGroupsLeft = (ctx: CanvasRenderingContext2D, h: number, vw: any) => {
  const cellH = h / (vw.yMax - vw.yMin);
  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#333";
  ctx.strokeStyle = "#666";

  yGroups.forEach(group => {
    drawYGroupRecursive(ctx, group, 1, vw, cellH);
  });
};
// ---------------------------------------------------------

// -------------------- 메인 컴포넌트 --------------------
const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({
  height,
  xBoxCount,
  yBoxCount,
  pointers,
  valueMin,
  valueMax,
  chartType = "horizontal",
}) => {
  // 기존 useRef, useState, useEffect 등 전부 유지

  // -------------------- 그리드 그리기 --------------------
  // 그룹축 렌더링 함수
const drawGroupAxis = (
  ctx: CanvasRenderingContext2D,
  groups: any[],
  axis: "x" | "y",
  w: number,
  h: number,
  labelHeight: number,
  level: number = 0
) => {
  const vw = viewRef.current;
  const cellW = w / (vw.xMax - vw.xMin);
  const cellH = h / (vw.yMax - vw.yMin);

  groups.forEach(group => {
    if (axis === "x") {
      const start = Math.max(group.range[0], vw.xMin);
      const end   = Math.min(group.range[1] + 1, vw.xMax);
      if (end <= start) return;

      const x0 = (start - vw.xMin) * cellW;
      const x1 = (end - vw.xMin) * cellW;
      const mid = (x0 + x1) / 2;

      // 그룹 라인
      ctx.beginPath();
      ctx.moveTo(x0, -level * labelHeight);
      ctx.lineTo(x1, -level * labelHeight);
      ctx.stroke();

      // 그룹 텍스트 (차트 위쪽에 표시됨)
      ctx.fillText(group.name, mid, -level * labelHeight - 4);

      if (group.children) {
        drawGroupAxis(ctx, group.children, "x", w, h, labelHeight, level + 1);
      }
    } else {
      const start = Math.max(group.range[0], vw.yMin);
      const end   = Math.min(group.range[1] + 1, vw.yMax);
      if (end <= start) return;

      const y0 = (start - vw.yMin) * cellH;
      const y1 = (end - vw.yMin) * cellH;
      const mid = (y0 + y1) / 2;

      // 그룹 라인
      ctx.beginPath();
      ctx.moveTo(-level * labelHeight, y0);
      ctx.lineTo(-level * labelHeight, y1);
      ctx.stroke();

      // 그룹 텍스트 (차트 왼쪽에 표시됨)
      ctx.fillText(group.name, -level * labelHeight - 4, mid);

      if (group.children) {
        drawGroupAxis(ctx, group.children, "y", w, h, labelHeight, level + 1);
      }
    }
  });
};
  const drawGrid = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    const parent = overlay.parentElement!;
    const dpr = window.devicePixelRatio || 1;

    overlay.width = parent.clientWidth * dpr;
    overlay.height = parent.clientHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const w = parent.clientWidth;
    const h = parent.clientHeight;
    const vw = viewRef.current;
    const cellW = w / (vw.xMax - vw.xMin);
    const cellH = h / (vw.yMax - vw.yMin);

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    // 세로 라인
    for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
      const x = (i - vw.xMin) * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // 가로 라인
    for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) {
      const y = (i - vw.yMin) * cellH + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // -------------------- 그룹 축 추가 --------------------
    drawXAxisGroupsTop(ctx, w, vw);   // 상단 X축 그룹
    drawYAxisGroupsLeft(ctx, h, vw); // 좌측 Y축 그룹
    // -----------------------------------------------------
    // === 그룹축 라벨 그리기 ===
ctx.save();
ctx.font = "12px sans-serif";
ctx.fillStyle = "#000";
ctx.strokeStyle = "#000";
ctx.textAlign = "center";
ctx.textBaseline = "bottom";

// X축 그룹 (차트 상단)
drawGroupAxis(ctx, xGroups, "x", w, h, 16);

ctx.textAlign = "right";
ctx.textBaseline = "middle";

// Y축 그룹 (차트 좌측)
drawGroupAxis(ctx, yGroups, "y", w, h, 16);

ctx.restore();
  };

  // -------------------- 나머지 WebGL 렌더링 및 이벤트 로직 --------------------
  // (renderGL, getMousePos, useEffect, handleZoomIn, handleZoomOut, handleReset 등은 원래 코드 그대로 유지)

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <canvas ref={canvasRef}
        style={{ width: "100%", height: `${height}px`, display: "block", border: "1px solid #ddd" }}
      />
      <canvas ref={overlayRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: `${height}px`, pointerEvents: "none" }}
      />
      {/* ... 기존 tooltip, zoom 버튼 UI 유지 ... */}
    </div>
  );
};

export default WebGLDetailChart;
