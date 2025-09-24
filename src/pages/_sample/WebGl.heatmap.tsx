// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

// 포인터 데이터 타입
type Pointer = { boxIndex: number; x: number; y: number; value: number };

// Props 타입
interface WebGLDetailChartProps {
  height: number;           // 캔버스 높이
  xBoxCount: number;        // 가로 박스 개수
  yBoxCount: number;        // 세로 박스 개수
  pointers: Pointer[];      // 포인터 데이터
  valueMin: number;         // 값 최소
  valueMax: number;         // 값 최대
  chartType?: "vertical" | "horizontal"; // 포인터 라인 방향
}

// GLSL Vertex Shader
const vertexShaderSource = `
attribute vec2 a_pos;
uniform float u_xMin;
uniform float u_xMax;
uniform float u_yMin;
uniform float u_yMax;
void main() {
  float nx = (a_pos.x - u_xMin) / (u_xMax - u_xMin);
  float ny = (a_pos.y - u_yMin) / (u_yMax - u_yMin);
  float clipX = nx * 2.0 - 1.0;
  float clipY = 1.0 - ny * 2.0;
  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
}
`;

// GLSL Fragment Shader
const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;

// 셰이더 컴파일
const compileShader = (gl: WebGLRenderingContext, src: string, type: number) => {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("Shader compile error: " + err);
  }
  return sh;
};

// 프로그램 생성
const createProgram = (gl: WebGLRenderingContext, vsrc: string, fsrc: string) => {
  const vs = compileShader(gl, vsrc, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fsrc, gl.FRAGMENT_SHADER);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("Program link error: " + err);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
};

// 캔버스 리사이즈
const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement, heightPx: number) => {
  const parent = canvas.parentElement!;
  const displayWidth = parent.clientWidth;
  const displayHeight = heightPx;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(displayWidth * dpr));
  const height = Math.max(1, Math.floor(displayHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
  }
};

// 메인 컴포넌트
const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({
  height,
  xBoxCount,
  yBoxCount,
  pointers,
  valueMin,
  valueMax,
  chartType = "horizontal",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef(viewRef.current);

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const attribLocRef = useRef<number | null>(null);
  const uniformLocsRef = useRef<any>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);

  const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const MAX_ZOOM = 5;
  const MIN_ZOOM = 1;

  // -----------------------------
  // 마진 정의
  const marginTop = 30;    // 상단 X축 그룹 라벨 공간
  const marginLeft = 50;   // 좌측 Y축 그룹 라벨 공간
  // -----------------------------

  // 캔버스 리사이즈 처리
  useEffect(() => {
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current!;
    if (!canvas || !overlay) return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        resizeCanvasToDisplaySize(canvas, height);
        const gl = glRef.current;
        if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawXAxisGroupsTop();
        drawYAxisGroupsLeft();
        renderGL();
      });
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [height]);

  // WebGL 초기화
  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return console.error("WebGL 미지원");
    glRef.current = gl;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    programRef.current = program;
    gl.useProgram(program);

    const a_pos = gl.getAttribLocation(program, "a_pos");
    const u_xMin = gl.getUniformLocation(program, "u_xMin");
    const u_xMax = gl.getUniformLocation(program, "u_xMax");
    const u_yMin = gl.getUniformLocation(program, "u_yMin");
    const u_yMax = gl.getUniformLocation(program, "u_yMax");
    const u_color = gl.getUniformLocation(program, "u_color");

    attribLocRef.current = a_pos;
    uniformLocsRef.current = { u_xMin, u_xMax, u_yMin, u_yMax, u_color };
    bufferRef.current = gl.createBuffer();

    resizeCanvasToDisplaySize(canvas, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);

    renderGL();
    return () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
    };
  }, [height]);

  // -----------------------------
  // 그리드 + X/Y 그룹 라벨
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
    const chartW = w - marginLeft;
    const chartH = h - marginTop;

    const cellW = chartW / (vw.xMax - vw.xMin);
    const cellH = chartH / (vw.yMax - vw.yMin);

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    // -----------------------------
    // 세로 라인
    for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
      const x = marginLeft + (i - vw.xMin) * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, marginTop);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // 가로 라인
    for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) {
      const y = marginTop + (i - vw.yMin) * cellH + 0.5;
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // -----------------------------
    drawXAxisGroupsTop();
    drawYAxisGroupsLeft();
  };

  // -----------------------------
  // X축 상단 그룹 라벨
  const drawXAxisGroupsTop = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    const w = overlay.width / (window.devicePixelRatio || 1);
    const vw = viewRef.current;
    const chartW = w - marginLeft;
    const cellW = chartW / (vw.xMax - vw.xMin);

    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 예시: a 그룹 0~11, b 그룹 12~23
    const groups = [
      { label: "A", start: 0, end: 11 },
      { label: "B", start: 12, end: 23 },
    ];

    groups.forEach(g => {
      const xStart = marginLeft + (g.start - vw.xMin) * cellW;
      const xEnd = marginLeft + (g.end + 1 - vw.xMin) * cellW;
      const xMid = (xStart + xEnd) / 2;
      ctx.fillText(g.label, xMid, marginTop / 2);

      // 라인 표시
      ctx.strokeStyle = "#999";
      ctx.beginPath();
      ctx.moveTo(xStart, marginTop - 2);
      ctx.lineTo(xStart, marginTop);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xEnd, marginTop - 2);
      ctx.lineTo(xEnd, marginTop);
      ctx.stroke();
    });
  };

  // -----------------------------
  // Y축 좌측 그룹 라벨
  const drawYAxisGroupsLeft = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    const h = overlay.height / (window.devicePixelRatio || 1);
    const vw = viewRef.current;
    const chartH = h - marginTop;
    const cellH = chartH / (vw.yMax - vw.yMin);

    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const groups = [
      { label: "G1", start: 0, end: 4 },
      { label: "G2", start: 5, end: 9 },
    ];

    groups.forEach(g => {
      const yStart = marginTop + (g.start - vw.yMin) * cellH;
      const yEnd = marginTop + (g.end + 1 - vw.yMin) * cellH;
      const yMid = (yStart + yEnd) / 2;
      ctx.fillText(g.label, marginLeft / 2, yMid);

      // 라인 표시
      ctx.strokeStyle = "#999";
      ctx.beginPath();
      ctx.moveTo(marginLeft - 2, yStart);
      ctx.lineTo(marginLeft, yStart);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(marginLeft - 2, yEnd);
      ctx.lineTo(marginLeft, yEnd);
      ctx.stroke();
    });
  };

  // -----------------------------
  // WebGL 포인터 렌더링
  const renderGL = () => {
    const gl = glRef.current;
    if (!gl || !programRef.current) return;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const a_pos = attribLocRef.current!;
    const u = uniformLocsRef.current;
    const vw = viewRef.current;

    gl.uniform1f(u.u_xMin, vw.xMin);
    gl.uniform1f(u.u_xMax, vw.xMax);
    gl.uniform1f(u.u_yMin, vw.yMin);
    gl.uniform1f(u.u_yMax, vw.yMax);

    const vertices: number[] = [];
    const colors: number[] = [];

    pointers.forEach((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);

      if (
        boxX < vw.xMin - 1 || boxX > vw.xMax + 1 ||
        boxY < vw.yMin - 1 || boxY > vw.yMax + 1
      ) return;

      if (chartType === "vertical") {
        const xPos = boxX + p.x / 100;
        vertices.push(xPos, boxY, xPos, boxY + 1);
      } else {
        const yPos = boxY + p.y / 100;
        vertices.push(boxX, yPos, boxX + 1, yPos);
      }

      const t = Math.max(0, Math.min(1, (p.value - valueMin) / (valueMax - valueMin)));
      colors.push(t);
    });

    if (vertices.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(a_pos);
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

      for (let i = 0; i < vertices.length / 2; i += 2) {
        const t = colors[i / 2];
        const r = 0.0 * t + 0.0 * (1 - t);
        const g = 0.8 * (1 - t) + 0.3 * t;
        const b = 1.0 * (1 - t) + 0.6 * t;
        gl.uniform4f(u.u_color, r, g, b, 1.0);
        gl.drawArrays(gl.LINES, i, 2);
      }
    }
    drawGrid();
  };

  // -----------------------------
  // 나머지 드래그, 패닝, 확대/축소 코드는 기존 그대로 유지

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: `${height}px`, display: "block", border: "1px solid #ddd" }}
      />
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${height}px`,
          pointerEvents: "none",
        }}
      />
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "2px 6px",
            fontSize: 12,
            borderRadius: 3,
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {tooltip.text}
        </div>
      )}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", gap: 4 }}>
        <button onClick={() => { /* 확대 로직 */ }}>확대</button>
        <button onClick={() => { /* 축소 로직 */ }}>축소</button>
        <button onClick={() => { /* 리셋 로직 */ }}>Reset View</button>
      </div>
    </div>
  );
};

export default WebGLDetailChart;




const vw = viewRef.current;
const chartW = canvas.clientWidth - marginLeft;
const chartH = canvas.clientHeight - marginTop;

if (chartType === "vertical") {
  const xPos = marginLeft + ((boxX + p.x / 100 - vw.xMin) / (vw.xMax - vw.xMin)) * chartW;
  const yPos1 = marginTop + ((boxY - vw.yMin) / (vw.yMax - vw.yMin)) * chartH;
  const yPos2 = marginTop + ((boxY + 1 - vw.yMin) / (vw.yMax - vw.yMin)) * chartH;
  vertices.push(xPos, yPos1, xPos, yPos2);
} else {
  const xPos1 = marginLeft + ((boxX - vw.xMin) / (vw.xMax - vw.xMin)) * chartW;
  const xPos2 = marginLeft + ((boxX + 1 - vw.xMin) / (vw.xMax - vw.xMin)) * chartW;
  const yPos = marginTop + ((boxY + p.y / 100 - vw.yMin) / (vw.yMax - vw.yMin)) * chartH;
  vertices.push(xPos1, yPos, xPos2, yPos);
}
