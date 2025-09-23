// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

// 포인터 타입 정의
type Pointer = { boxIndex: number; x: number; y: number; value: number };

// 차트 props
interface WebGLDetailChartProps {
  height: number; // 캔버스 높이
  xBoxCount: number; // x축 박스 수
  yBoxCount: number; // y축 박스 수
  pointers: Pointer[]; // 포인터 데이터
  valueMin: number; // value 최소
  valueMax: number; // value 최대
  chartType?: "vertical" | "horizontal"; // 세로/가로 라인 타입
}

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

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;

// Shader 컴파일
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

// Program 생성
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

// 캔버스 사이즈 조정
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

const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({
  height,
  xBoxCount,
  yBoxCount,
  pointers,
  valueMin,
  valueMax,
  chartType = "vertical", // 기본 세로
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  // 뷰 상태 (x/y 최소최대)
  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  const isDraggingRef = useRef(false); // 드래그 중 여부
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef(viewRef.current);

  // WebGL 관련
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const attribLocRef = useRef<number | null>(null);
  const uniformLocsRef = useRef<any>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);

  // 툴팁
  const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // 확대 상태
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 기본
  const MAX_ZOOM = 5;
  const MIN_ZOOM = 1;

  // --- 초기 WebGL 세팅 ---
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
  }, [height]);

  // --- Grid 및 Overlay 그리기 ---
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

    // 세로/가로 구분 없이 항상 두개 그리기
    for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
      const x = (i - vw.xMin) * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) {
      const y = (i - vw.yMin) * cellH + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  // --- WebGL 포인터 렌더링 ---
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

      if (chartType === "vertical") {
        const xPos = boxX + p.x / 100;
        vertices.push(xPos, boxY, xPos, boxY + 1);
      } else {
        const yPos = boxY + p.y / 100;
        vertices.push(boxX, yPos, boxX + 1, yPos);
      }

      // value 대비 색상
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
        const r = 0.0 * (1 - t) + 0.6 * t; // 청록 -> 보라 대비
        const g = 1.0 * (1 - t) + 0.0 * t;
        const b = 0.8 * (1 - t) + 0.8 * t;
        gl.uniform4f(u.u_color, r, g, b, 1.0);
        gl.drawArrays(gl.LINES, i, 2);
      }
    }

    drawGrid();
  };

  // --- 마우스 좌표 ---
  const getMousePos = (ev: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  // --- 드래그/패닝 이벤트 ---
  useEffect(() => {
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current!;
    if (!canvas || !overlay) return;

    const drawSelectionRect = () => {
      const ctx = overlay.getContext("2d")!;
      drawGrid();
      if (!dragStartRef.current || !dragEndRef.current) return;
      const s = dragStartRef.current;
      const e = dragEndRef.current;
      ctx.strokeStyle = "rgba(255,0,0,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));
      ctx.fillStyle = "rgba(255,0,0,0.08)";
      ctx.fillRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));
    };

    const onPointerMove = (ev: PointerEvent) => {
      const vw = viewRef.current;
      const mouse = getMousePos(ev);

      // 드래그 중
      if (isDraggingRef.current && dragStartRef.current) {
        dragEndRef.current = mouse;
        drawSelectionRect();
      }

      // 패닝
      if (isPanningRef.current && panStartRef.current) {
        const dx = mouse.x - panStartRef.current.x;
        const dy = mouse.y - panStartRef.current.y;
        const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
        const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;
        let newXMin = viewStartRef.current.xMin - dx / canvas.clientWidth * vwWidth;
        let newXMax = viewStartRef.current.xMax - dx / canvas.clientWidth * vwWidth;
        let newYMin = viewStartRef.current.yMin - dy / canvas.clientHeight * vwHeight;
        let newYMax = viewStartRef.current.yMax - dy / canvas.clientHeight * vwHeight;

        if (newXMin < 0) { newXMin = 0; newXMax = vwWidth; }
        if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = xBoxCount - vwWidth; }
        if (newYMin < 0) { newYMin = 0; newYMax = vwHeight; }
        if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = yBoxCount - vwHeight; }

        viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
        renderGL();
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      if ((ev.shiftKey || ev.button === 2)) {
        isPanningRef.current = true;
        panStartRef.current = getMousePos(ev);
        viewStartRef.current = { ...viewRef.current };
        canvas.style.cursor = "grab";
        return;
      }
      if (ev.button !== 0) return;
      isDraggingRef.current = true;
      const pos = getMousePos(ev);
      dragStartRef.current = pos;
      dragEndRef.current = pos;
      drawSelectionRect();
    };

    const onPointerUp = () => {
      if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
        const s = dragStartRef.current;
        const e = dragEndRef.current;

        // 드래그 확대 (제한 없음)
        const canvasW = canvas.clientWidth;
        const canvasH = canvas.clientHeight;
        const vw = viewRef.current;

        const worldXMin = vw.xMin + Math.min(s.x, e.x) / canvasW * (vw.xMax - vw.xMin);
        const worldXMax = vw.xMin + Math.max(s.x, e.x) / canvasW * (vw.xMax - vw.xMin);
        const worldYMin = vw.yMin + Math.min(s.y, e.y) / canvasH * (vw.yMax - vw.yMin);
        const worldYMax = vw.yMin + Math.max(s.y, e.y) / canvasH * (vw.yMax - vw.yMin);

        viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };

        // 드래그 확대 후 버튼 상태
        const width = worldXMax - worldXMin;
        const height = worldYMax - worldYMin;
        const zoomFactorX = xBoxCount / width;
        const zoomFactorY = yBoxCount / height;
        const maxZoomReached = zoomFactorX >= MAX_ZOOM || zoomFactorY >= MAX_ZOOM;

        setZoomLevel(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomFactorX, zoomFactorY)));
      }

      // 상태 초기화
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;
      isPanningRef.current = false;
      panStartRef.current = null;
      canvas.style.cursor = "default";

      renderGL();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [pointers, xBoxCount, yBoxCount, valueMin, valueMax]);

  // --- 버튼 처리 ---
  const handleReset = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    setZoomLevel(MIN_ZOOM);
    renderGL();
  };

  const handleZoomIn = () => {
    const vw = viewRef.current;
    const width = vw.xMax - vw.xMin;
    const height = vw.yMax - vw.yMin;
    if (width <= xBoxCount / MAX_ZOOM || height <= yBoxCount / MAX_ZOOM) {
      alert("최대 확대입니다.");
      return;
    }
    const midX = (vw.xMin + vw.xMax) / 2;
    const midY = (vw.yMin + vw.yMax) / 2;
    const newWidth = width / 2;
    const newHeight = height / 2;
    viewRef.current = { xMin: midX - newWidth / 2, xMax: midX + newWidth / 2, yMin: midY - newHeight / 2, yMax: midY + newHeight / 2 };
    setZoomLevel(prev => Math.min(MAX_ZOOM, prev * 2));
    renderGL();
  };

  const handleZoomOut = () => {
    const vw = viewRef.current;
    const width = vw.xMax - vw.xMin;
    const height = vw.yMax - vw.yMin;
    if (width >= xBoxCount && height >= yBoxCount) return;
    const midX = (vw.xYMax = yBoxCount; newYMin = yBoxCount - newHeight; }

    viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };

    // 확대/축소 버튼 상태 계산
    const zoomFactorX = xBoxCount / (newXMax - newXMin);
    const zoomFactorY = yBoxCount / (newYMax - newYMin);

    setZoomLevel(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomFactorX, zoomFactorY)));

    renderGL();
  };

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
        <button onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM}>확대</button>
        <button onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM}>축소</button>
        <button onClick={handleReset}>Reset View</button>
      </div>
    </div>
  );
};

export default WebGLDetailChart;
