// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

// Pointer 타입 정의: value 추가
type Pointer = { boxIndex: number; x: number; y: number; value: number };

// Props 타입 정의
interface WebGLDetailChartProps {
  height: number;                // 캔버스 높이
  xBoxCount: number;             // x축 박스 개수
  yBoxCount: number;             // y축 박스 개수
  pointers: Pointer[];           // 포인터 데이터
  valueMin: number;              // value 최소값
  valueMax: number;              // value 최대값
  chartType?: "vertical" | "horizontal"; // 그리드 타입: 기본 vertical
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

// 캔버스 크기 조정
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
  chartType = "vertical",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);   // WebGL 캔버스
  const overlayRef = useRef<HTMLCanvasElement | null>(null);  // 2D 그리드/드래그용 캔버스

  // 뷰 영역 상태
  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  const isDraggingRef = useRef(false); // 드래그 상태
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);  // 패닝 상태
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef(viewRef.current);

  // WebGL 관련
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const attribLocRef = useRef<number | null>(null);
  const uniformLocsRef = useRef<any>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);

  // 툴팁 상태
  const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // 확대/축소 상태
  const [zoomLevel, setZoomLevel] = useState(1); // 초기 1
  const MAX_ZOOM = 5; // 최대 확대 레벨
  const MIN_ZOOM = 1; // 최소 확대 레벨

  // ==========================
  // 캔버스 리사이즈, 렌더링
  // ==========================
  useEffect(() => {
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current!;
    if (!canvas || !overlay) return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        resizeCanvasToDisplaySize(canvas, height);
        const gl = glRef.current;
        if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
        drawGrid();    // 그리드 redraw
        renderGL();    // WebGL redraw
      });
    });

    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [height]);

  // ==========================
  // WebGL 초기화
  // ==========================
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

  // ==========================
  // 그리드 및 드래그 영역 렌더링
  // ==========================
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

    // 세로/가로 그리드
    if (chartType === "vertical") {
      for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
        const x = (i - vw.xMin) * cellW + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    } else {
      for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) {
        const y = (i - vw.yMin) * cellH + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  };
  // ==========================
  // WebGL 포인터 렌더링
  // ==========================
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

    // 포인터 데이터를 기반으로 선 그리기
    pointers.forEach((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);
      const xPos = boxX + p.x / 100;       // x좌표
      const yTop = boxY;                   // 상단 y
      const yBottom = boxY + 1;            // 하단 y
      vertices.push(xPos, yTop, xPos, yBottom);

      // value 기반 색상 비율 계산 (0~1)
      const t = Math.max(0, Math.min(1, (p.value - valueMin) / (valueMax - valueMin)));
      colors.push(t);
    });

    if (vertices.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(a_pos);
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

      for (let i = 0; i < vertices.length / 2; i += 2) {
        const t = colors[i / 2]; // 0~1 비율
        // 색상: 청록 → 보라
        const r = 0.0 * t + 0.0 * (1 - t);  // Red
        const g = 0.8 * (1 - t) + 0.0 * t;  // Green
        const b = 0.6 * (1 - t) + 1.0 * t;  // Blue
        const a = 1.0;                      // Alpha

        gl.uniform4f(u.u_color, r, g, b, a);
        gl.drawArrays(gl.LINES, i, 2);
      }
    }

    // 2D 그리드 렌더
    drawGrid();
  };

  // ==========================
  // 마우스 좌표 계산
  // ==========================
  const getMousePos = (ev: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  // ==========================
  // 드래그/패닝 이벤트
  // ==========================
  useEffect(() => {
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current!;
    if (!canvas || !overlay) return;

    // 드래그 사각형 그리기
    const drawSelectionRect = () => {
      const ctx = overlay.getContext("2d")!;
      drawGrid();
      if (!dragStartRef.current || !dragEndRef.current) return;
      const s = dragStartRef.current;
      const e = dragEndRef.current;
      ctx.strokeStyle = "rgba(255,0,0,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        Math.min(s.x, e.x),
        Math.min(s.y, e.y),
        Math.abs(e.x - s.x),
        Math.abs(e.y - s.y)
      );
      ctx.fillStyle = "rgba(255,0,0,0.08)";
      ctx.fillRect(
        Math.min(s.x, e.x),
        Math.min(s.y, e.y),
        Math.abs(e.x - s.x),
        Math.abs(e.y - s.y)
      );
    };

    // 마우스 이동
    const onPointerMove = (ev: PointerEvent) => {
      const vw = viewRef.current;
      const mouse = getMousePos(ev);

      // 툴팁 계산
      const cellW = canvas.clientWidth / (vw.xMax - vw.xMin);
      const cellH = canvas.clientHeight / (vw.yMax - vw.yMin);
      const cellX = Math.floor(vw.xMin + mouse.x / cellW);
      const cellY = Math.floor(vw.yMin + mouse.y / cellH);
      const last = lastTooltipRef.current;
      if (!last || last.cellX !== cellX || last.cellY !== cellY) {
        if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
          setTooltip({ text: `셀(${cellX}, ${cellY})`, x: ev.clientX, y: ev.clientY });
        } else {
          setTooltip(null);
        }
        lastTooltipRef.current = { cellX, cellY };
      }

      // 드래그 중일 때
      if (isDraggingRef.current && dragStartRef.current) {
        dragEndRef.current = mouse;
        drawSelectionRect();
      }

      // 패닝 중일 때
      if (isPanningRef.current && panStartRef.current) {
        const dx = mouse.x - panStartRef.current.x;
        const dy = mouse.y - panStartRef.current.y;
        const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
        const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;
        let newXMin = viewStartRef.current.xMin - dx / canvas.clientWidth * vwWidth;
        let newXMax = viewStartRef.current.xMax - dx / canvas.clientWidth * vwWidth;
        let newYMin = viewStartRef.current.yMin - dy / canvas.clientHeight * vwHeight;
        let newYMax = viewStartRef.current.yMax - dy / canvas.clientHeight * vwHeight;

        // 패닝 제한
        if (newXMin < 0) { newXMin = 0; newXMax = vwWidth; }
        if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = xBoxCount - vwWidth; }
        if (newYMin < 0) { newYMin = 0; newYMax = vwHeight; }
        if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = yBoxCount - vwHeight; }

        viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
        renderGL();
      }
    };

    // ==========================
    // 마우스 다운
    // ==========================
    const onPointerDown = (ev: PointerEvent) => {
      const vw = viewRef.current;
      const fullX = vw.xMin === 0 && vw.xMax === xBoxCount;
      const fullY = vw.yMin === 0 && vw.yMax === yBoxCount;

      // Shift 또는 우클릭 = 패닝
      if ((ev.shiftKey || ev.button === 2) && (!fullX || !fullY)) {
        isPanningRef.current = true;
        panStartRef.current = getMousePos(ev);
        viewStartRef.current = { ...viewRef.current };
        canvas.style.cursor = "grab";
        return;
      }

      if (ev.button !== 0) return; // 좌클릭만
      isDraggingRef.current = true;
      const pos = getMousePos(ev);
      dragStartRef.current = pos;
      dragEndRef.current = pos;
      drawSelectionRect();
    };
    // ==========================
    // 마우스 업
    // ==========================
    const onPointerUp = () => {
      const canvas = canvasRef.current!;
      const overlay = overlayRef.current!;
      if (!canvas || !overlay) return;

      // 패닝 종료
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        viewStartRef.current = viewRef.current;
        canvas.style.cursor = "default";
      }

      // 드래그 종료 및 확대
      if (
        isDraggingRef.current &&
        dragStartRef.current &&
        dragEndRef.current &&
        (dragStartRef.current.x !== dragEndRef.current.x || dragStartRef.current.y !== dragEndRef.current.y)
      ) {
        const canvasW = canvas.clientWidth;
        const canvasH = canvas.clientHeight;
        const vw = viewRef.current;
        const s = dragStartRef.current;
        const e = dragEndRef.current;

        // 드래그 좌표 클램핑 (캔버스 내부)
        const clampedStartX = Math.max(0, Math.min(canvasW, s.x));
        const clampedEndX = Math.max(0, Math.min(canvasW, e.x));
        const clampedStartY = Math.max(0, Math.min(canvasH, s.y));
        const clampedEndY = Math.max(0, Math.min(canvasH, e.y));

        // 드래그 영역을 세계 좌표로 변환
        const worldXMin = vw.xMin + Math.min(clampedStartX, clampedEndX) / canvasW * (vw.xMax - vw.xMin);
        const worldXMax = vw.xMin + Math.max(clampedStartX, clampedEndX) / canvasW * (vw.xMax - vw.xMin);
        const worldYMin = vw.yMin + Math.min(clampedStartY, clampedEndY) / canvasH * (vw.yMax - vw.yMin);
        const worldYMax = vw.yMin + Math.max(clampedStartY, clampedEndY) / canvasH * (vw.yMax - vw.yMin);

        viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };

        // 확대 버튼 활성/비활성 조정
        const widthRatio = (viewRef.current.xMax - viewRef.current.xMin) / xBoxCount;
        const heightRatio = (viewRef.current.yMax - viewRef.current.yMin) / yBoxCount;
        if (widthRatio <= 1 / MAX_ZOOM || heightRatio <= 1 / MAX_ZOOM) {
          // 최대 확대보다 작으면 확대버튼 비활성
          setZoomLevel(MAX_ZOOM);
        } else {
          setZoomLevel(prev => Math.min(MAX_ZOOM, prev * 2));
        }
      }

      // 드래그 초기화
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;
      const ctx = overlay.getContext("2d")!;
      ctx.clearRect(0, 0, overlay.width, overlay.height);

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

  // ==========================
  // 뷰 초기화 버튼
  // ==========================
  const handleReset = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    setZoomLevel(MIN_ZOOM);
    renderGL();
  };

  // ==========================
  // 확대 버튼
  // ==========================
  const handleZoomIn = () => {
    const vw = viewRef.current;
    const midX = (vw.xMin + vw.xMax) / 2;
    const midY = (vw.yMin + vw.yMax) / 2;
    const width = (vw.xMax - vw.xMin) / 2;
    const height = (vw.yMax - vw.yMin) / 2;

    // 최대 확대 제한
    const newXMin = Math.max(0, midX - width / 2);
    const newXMax = Math.min(xBoxCount, midX + width / 2);
    const newYMin = Math.max(0, midY - height / 2);
    const newYMax = Math.min(yBoxCount, midY + height / 2);

    viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
    setZoomLevel(prev => Math.min(MAX_ZOOM, prev * 2));
    renderGL();
  };

  // ==========================
  // 축소 버튼
  // ==========================
  const handleZoomOut = () => {
    const vw = viewRef.current;
    const midX = (vw.xMin + vw.xMax) / 2;
    const midY = (vw.yMin + vw.yMax) / 2;
    const width = (vw.xMax - vw.xMin) * 2;
    const height = (vw.yMax - vw.yMin) * 2;

    let newXMin = midX - width / 2;
    let newXMax = midX + width / 2;
    let newYMin = midY - height / 2;
    let newYMax = midY + height / 2;

    // 최소 크기 제한 (전체 영역)
    if (newXMin < 0) { newXMin = 0; newXMax = xBoxCount; }
    if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = 0; }
    if (newYMin < 0) { newYMin = 0; newYMax = yBoxCount; }
    if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = 0; }

    viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
    setZoomLevel(prev => Math.max(MIN_ZOOM, prev / 2));
    renderGL();
  };
  return (
  <div style={{ width: "100%", position: "relative" }}>
    {/* WebGL 캔버스: 데이터 렌더링 */}
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: `${height}px`,
        display: "block",
        border: "1px solid #ddd",
      }}
    />

    {/* 오버레이 캔버스: 드래그 영역, 그리드, 툴팁 표시 */}
    <canvas
      ref={overlayRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${height}px`,
        pointerEvents: "none", // 이벤트는 아래 캔버스에서 처리
      }}
    />

    {/* 툴팁 표시 */}
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

    {/* 확대/축소/리셋 버튼 UI */}
    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", gap: 4 }}>
      {/* 확대 버튼: 최대 확대 도달시 비활성화 */}
      <button onClick={handleZoomIn} disabled={zoomLevel >= MAX_ZOOM}>확대</button>
      {/* 축소 버튼: 최소 확대 도달시 비활성화 */}
      <button onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM}>축소</button>
      {/* 초기화 버튼: 전체 영역 초기화 */}
      <button onClick={handleReset}>Reset View</button>
    </div>
  </div>
);
