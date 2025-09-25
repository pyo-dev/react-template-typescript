// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";

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
attribute vec3 a_color;
uniform float u_xMin;
uniform float u_xMax;
uniform float u_yMin;
uniform float u_yMax;
varying vec3 v_color;

void main() {
  float nx = (a_pos.x - u_xMin) / (u_xMax - u_xMin);
  float ny = (a_pos.y - u_yMin) / (u_yMax - u_yMin);
  float clipX = nx * 2.0 - 1.0;
  float clipY = 1.0 - ny * 2.0;
  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
  v_color = a_color;
}
`;

// GLSL Fragment Shader
const fragmentShaderSource = `
precision mediump float;
varying vec3 v_color;
void main() {
  gl_FragColor = vec4(v_color, 1.0);
}
`;

// 셰이더 컴파일 함수
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

// 프로그램 생성 함수
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

// 메인 컴포넌트
const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({
  height,
  xBoxCount,
  yBoxCount,
  pointers,
  valueMin,
  valueMax,
  chartType = "vertical",
}) => {
  // ====== refs ======
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
  const attribLocRef = useRef<{ a_pos: number; a_color: number } | null>(null);
  const uniformLocsRef = useRef<any>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const chartTypeRef = useRef(chartType);

  // ====== state ======
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const MAX_ZOOM = 5;
  const MIN_ZOOM = 1;

  // ====== WebGL 초기화 ======
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return console.error("WebGL 미지원");
    glRef.current = gl;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    programRef.current = program;
    gl.useProgram(program);

    const a_pos = gl.getAttribLocation(program, "a_pos");
    const a_color = gl.getAttribLocation(program, "a_color");
    attribLocRef.current = { a_pos, a_color };
    uniformLocsRef.current = {
      u_xMin: gl.getUniformLocation(program, "u_xMin")!,
      u_xMax: gl.getUniformLocation(program, "u_xMax")!,
      u_yMin: gl.getUniformLocation(program, "u_yMin")!,
      u_yMax: gl.getUniformLocation(program, "u_yMax")!,
    };

    bufferRef.current = gl.createBuffer();
    gl.clearColor(0, 0, 0, 0);

    return () => {
      if (bufferRef.current) gl.deleteBuffer(bufferRef.current);
      if (programRef.current) gl.deleteProgram(programRef.current);
    };
  }, [height]);

  // ====== 캔버스 리사이즈 + grid 렌더 ======
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        resizeCanvasToDisplaySize(canvas, height);
        glRef.current?.viewport(0, 0, canvas.width, canvas.height);
        drawGrid();
        renderGL();
      });
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [height]);

  // ====== 화면 초기화 ======
  useEffect(() => {
    chartTypeRef.current = chartType;
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    setZoomLevel(MIN_ZOOM);
    renderGL();
  }, [chartType, xBoxCount, yBoxCount]);

  // ====== Grid 그리기 ======
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

  // ====== WebGL 렌더링 ======
  const renderGL = useCallback(() => {
    const gl = glRef.current;
    if (!gl || !programRef.current) return;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const { a_pos, a_color } = attribLocRef.current!;
    const u = uniformLocsRef.current;
    const vw = viewRef.current;
    gl.uniform1f(u.u_xMin, vw.xMin);
    gl.uniform1f(u.u_xMax, vw.xMax);
    gl.uniform1f(u.u_yMin, vw.yMin);
    gl.uniform1f(u.u_yMax, vw.yMax);

    const vertices: number[] = [];
    const type = chartTypeRef.current;

    // 박스 평균값 계산
    const boxMap: Record<number, { sum: number; count: number }> = {};
    pointers.forEach(p => {
      if (!boxMap[p.boxIndex]) boxMap[p.boxIndex] = { sum: 0, count: 0 };
      boxMap[p.boxIndex].sum += p.value;
      boxMap[p.boxIndex].count += 1;
    });

    Object.keys(boxMap).forEach(k => {
      const boxIndex = parseInt(k);
      const { sum, count } = boxMap[boxIndex];
      const avg = sum / count;
      const t = Math.max(0, Math.min(1, (avg - valueMin) / (valueMax - valueMin)));
      const r = 0.0 * t + 0.0 * (1const g = 0.8 * (1 - t) + 0.3 * t;
      const b = 1.0 * (1 - t) + 0.6 * t;

      const boxX = boxIndex % xBoxCount;
      const boxY = Math.floor(boxIndex / xBoxCount);

      const zoomLevelX = xBoxCount / (vw.xMax - vw.xMin);
      const zoomLevelY = yBoxCount / (vw.yMax - vw.yMin);
      const effectiveZoom = Math.min(zoomLevelX, zoomLevelY);

      // 줌 레벨이 3 이하이면 박스 전체 색상, 초과 시 개별 포인터 라인
      if (effectiveZoom <= 3) {
        if (boxX >= vw.xMin && boxX <= vw.xMax && boxY >= vw.yMin && boxY <= vw.yMax) {
          vertices.push(boxX, boxY, r, g, b);
          vertices.push(boxX + 1, boxY, r, g, b);
          vertices.push(boxX + 1, boxY + 1, r, g, b);
          vertices.push(boxX, boxY + 1, r, g, b);
        }
      } else {
        // 개별 포인터 라인
        pointers
          .filter(p => p.boxIndex === boxIndex)
          .forEach(p => {
            if (type === "vertical") {
              const xPos = boxX + p.x / 100;
              if (xPos >= vw.xMin && xPos <= vw.xMax && boxY >= vw.yMin && boxY <= vw.yMax) {
                vertices.push(xPos, boxY, r, g, b);
                vertices.push(xPos, boxY + 1, r, g, b);
              }
            } else {
              const yPos = boxY + p.y / 100;
              if (boxX >= vw.xMin && boxX <= vw.xMax && yPos >= vw.yMin && yPos <= vw.yMax) {
                vertices.push(boxX, yPos, r, g, b);
                vertices.push(boxX + 1, yPos, r, g, b);
              }
            }
          });
      }
    });

    if (vertices.length > 0) {
      const stride = 5 * 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

      gl.enableVertexAttribArray(a_pos);
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, stride, 0);

      gl.enableVertexAttribArray(a_color);
      gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, stride, 2 * 4);

      gl.drawArrays(gl.LINES, 0, vertices.length / 5);
    }

    drawGrid();
  }, [pointers, xBoxCount, yBoxCount, valueMin, valueMax]);

  // ====== 마우스 위치 계산 ======
  const getMousePos = (ev: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  // ====== 마우스, 드래그, 패닝 이벤트 ======
  useEffect(() => {
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current!;
    if (!canvas || !overlay) return;

    let rafId: number | null = null;

    const drawSelectionRect = () => {
      if (!overlay || !dragStartRef.current || !dragEndRef.current) return;
      const ctx = overlay.getContext("2d")!;
      drawGrid();

      const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
      const s = {
        x: clamp(dragStartRef.current.x, 0, canvas.clientWidth),
        y: clamp(dragStartRef.current.y, 0, canvas.clientHeight),
      };
      const e = {
        x: clamp(dragEndRef.current.x, 0, canvas.clientWidth),
        y: clamp(dragEndRef.current.y, 0, canvas.clientHeight),
      };

      ctx.strokeStyle = "rgba(255,0,0,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));

      ctx.fillStyle = "rgba(255,0,0,0.08)";
      ctx.fillRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));
    };

    const onPointerMove = (ev: PointerEvent) => {
      const handle = () => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = ev.clientX - rect.left;
        const mouseY = ev.clientY - rect.top;

        const vw = viewRef.current;
        const cellW = canvas.clientWidth / (vw.xMax - vw.xMin);
        const cellH = canvas.clientHeight / (vw.yMax - vw.yMin);
        const cellX = Math.floor(vw.xMin + mouseX / cellW);
        const cellY = Math.floor(vw.yMin + mouseY / cellH);

        if (
          mouseX >= 0 &&
          mouseY >= 0 &&
          mouseX <= canvas.clientWidth &&
          mouseY <= canvas.clientHeight &&
          cellX >= 0 &&
          cellX < xBoxCount &&
          cellY >= 0 &&
          cellY < yBoxCount
        ) {
          const last = lastTooltipRef.current;
          if (!last || last.cellX !== cellX || last.cellY !== cellY) {
            const boxIndex = cellY * xBoxCount + cellX;
            setTooltip({ text: `박스(${boxIndex}) 셀(${cellX}, ${cellY})`, x: ev.clientX, y: ev.clientY });
            lastTooltipRef.current = { cellX, cellY };
          }
        } else {
          setTooltip(null);
          lastTooltipRef.current = null;
        }

        if (isDraggingRef.current && dragStartRef.current) {
          dragEndRef.current = { x: mouseX, y: mouseY };
          drawSelectionRect();
        }

        if (isPanningRef.current && panStartRef.current) {
          const dx = mouseX - panStartRef.current.x;
          const dy = mouseY - panStartRef.current.y;
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

        rafId = null;
      };

      if (!rafId) rafId = requestAnimationFrame(handle);
    };

    const onPointerDown = (ev: PointerEvent) => {
      const vw = viewRef.current;
      const fullX = vw.xMin === 0 && vw.xMax === xBoxCount;
      const fullY = vw.yMin === 0 && vw.yMax === yBoxCount;

      if ((ev.shiftKey || ev.button === 2) && (!fullX || !fullY)) {
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
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        viewStartRef.current = viewRef.current;
        canvas.style.cursor = "default";
      }

      if (
        isDraggingRef.current &&
        dragStartRef.current &&
        dragEndRef.current &&
        (dragStartRef.current.x !== dragEndRef.current.x || dragStartRef.current.y !== dragEndRef.current.y)
      ) {
        const s = dragStartRef.current;
        const e = dragEndRef.current;
        const canvasW = canvas.clientWidth;
        const canvasH = canvas.clientHeight;
        const vw = viewRef.current;

        const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
        const x0 = clamp(s.x, 0, canvasW);
        const x1 = clamp(e.x, 0, canvasW);
        const y0 = clamp(s.y, 0, canvasH);
        const y1 = clamp(e.y, 0, canvasH);

        const worldXMin = vw.xMin + Math.min(x0, x1) / canvasW * (vw.xMax - vw.xMin);
        const worldXMax = vw.xMin + Math.max(x0, x1) / canvasW * (vw.xMax - vw.xMin);
        const worldYMin = vw.yMin + Math.min(y0, y1) / canvasH * (vw.yMax - vw.yMin);
        const worldYMax = vw.yMin + Math.max(y0, y1) / canvasH * (vw.yMax - vw.yMin);

        const selectedPointers: Pointer[] = [];
        const type = chartTypeRef.current;
        pointers.forEach(p => {
          const boxX = p.boxIndex % xBoxCount;
          const boxY = Math.floor(p.boxIndex / xBoxCount);
          if (type === "vertical") {
            const xPos = boxX + p.x / 100;
            if (xPos >= worldXMin && xPos <= worldXMax && boxY >= worldYMin && boxY <= worldYMax) {
              selectedPointers.push(p);
            }
          } else {
            const yPos = boxY + p.y / 100;
            if (boxX >= worldXMin && boxX <= worldXMax && yPos >= worldYMin && yPos <= worldYMax) {
              selectedPointers.push(p);
            }
          }
        });
        console.log("드래그 영역 내 포인터 데이터:", selectedPointers);

        viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };

        const newZoomX = xBoxCount / (worldXMax - worldXMin);
        const newZoomY = yBoxCount / (worldYMax - worldYMin);
        const newZoomLevel = Math.min(newZoomX, newZoomY);
        setZoomLevel(Math.max(MIN_ZOOM, newZoomLevel));
      }

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
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pointers, xBoxCount, yBoxCount, valueMin, valueMax, chartType]);

  // ====== 마우스 엔터/리브, 키다운/업 이벤트 ======
  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    let isHover = false;

    const handleMouseEnter = () => {
      isHover = true;
    };
    const handleMouseLeave = () => {
      isHover = false;
      setTooltip(null);
      lastTooltipRef.current = null;
      if (!isPanningRef.current) canvas.style.cursor = "default";
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      const vw = viewRef.current;
      const fullX = vw.xMin === 0 && vw.xMax === xBoxCount;
      const fullY = vw.yMin === 0 && vw.yMax === yBoxCount;
      if (isHover && ev.key === "Shift" && (!fullX || !fullY)) {
        canvas.style.cursor = "grab";
      }
    };
    const handleKeyUp = (ev: KeyboardEvent) => {
      if (isHover && ev.key === "Shift" && !isPanningRef.current) {
        canvas.style.cursor = "default";
      }
    };

    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [xBoxCount, yBoxCount]);

  // ====== 확대/축소 버튼 ======
  const handleZoomIn = () => {
    const vw = viewRef.current;
    const midX = (vw.xMin + vw.xMax) / 2;
    const midY = (vw.yMin + vw.yMax) / 2;
    const width = (vw.xMax - vw.xMin) / 2;
    const height = (vw.yMax - vw.yMin) / 2;

    let newXMin = midX - width / 2;
    let newXMax = midX + width / 2;
    let newYMin = midY - height / 2;
    let newYMax = midY + height / 2;

    viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
    setZoomLevel(prev => Math.min(MAX_ZOOM, prev * 2));
    renderGL();
  };
  const handleZoomOut = () => {
    const vw = viewRef.current;
    const fullWidth = xBoxCount;
    const fullHeight = yBoxCount;

    const midX = (vw.xMin + vw.xMax) / 2;
    const midY = (vw.yMin + vw.yMax) / 2;

    let width = (vw.xMax - vw.xMin) * 1.5;
    let height = (vw.yMax - vw.yMin) * 1.5;

    if (width >= fullWidth && height >= fullHeight) {
      viewRef.current = { xMin: 0, xMax: fullWidth, yMin: 0, yMax: fullHeight };
      setZoomLevel(MIN_ZOOM);
      renderGL();
      return;
    }

    if (width > fullWidth) width = fullWidth;
    if (height > fullHeight) height = fullHeight;

    constnewXMin = midX - width / 2;
    const newXMax = midX + width / 2;
    const newYMin = midY - height / 2;
    const newYMax = midY + height / 2;

    viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
    setZoomLevel(prev => Math.max(MIN_ZOOM, prev / 2));
    renderGL();
  };

  const handleReset = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    setZoomLevel(MIN_ZOOM);
    renderGL();
  };

  // ====== 마우스 툴팁 ======
  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    background: "rgba(0,0,0,0.75)",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    pointerEvents: "none",
    fontSize: "12px",
    transform: "translate(10px, 10px)",
    zIndex: 1000,
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ position: "relative", width: "100%", height: `${height}px`, userSelect: "none" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      {tooltip && (
        <div style={{ ...tooltipStyle, left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}
      <div style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: "4px" }}>
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleZoomOut}>-</button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
};

export default WebGLDetailChart;
