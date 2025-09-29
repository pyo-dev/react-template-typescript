// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { interpolateColor } from "./utils/color";

type Pointer = { boxIndex: number; x: number; y: number; value: number };

interface WebGLDetailChartProps {
  height: number;
  xBoxCount: number;
  yBoxCount: number;
  pointers: Pointer[];
  valueMin: number;
  valueMax: number;
  chartType?: "vertical" | "horizontal";
}

const vertexShaderSource = `...`; // 생략: 기존 그대로
const fragmentShaderSource = `...`; // 생략: 기존 그대로

const compileShader = (gl: WebGLRenderingContext, src: string, type: number) => { ... };
const createProgram = (gl: WebGLRenderingContext, vsrc: string, fsrc: string) => { ... };
const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement, heightPx: number) => { ... };

const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({
  height, xBoxCount, yBoxCount, pointers, valueMin, valueMax, chartType = "vertical"
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const attribLocRef = useRef<{ a_pos: number; a_color: number } | null>(null);
  const uniformLocsRef = useRef<any>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const chartTypeRef = useRef(chartType);

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const ZOOM_FACTOR = 2;
  const MIN_ZOOM = 1;
  const BOX_COLOR_THRESHOLD = 3;

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
    if (!canvas) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

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

  const drawGrid = () => { ... }; // 기존 drawGrid 그대로

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
    const currentZoomX = xBoxCount / (vw.xMax - vw.xMin);
    const currentZoomY = yBoxCount / (vw.yMax - vw.yMin);
    const currentZoomLevel = Math.min(currentZoomX, currentZoomY);

    if (currentZoomLevel < BOX_COLOR_THRESHOLD && chartTypeRef.current === "vertical") {
      for (let y = Math.floor(vw.yMin); y < Math.ceil(vw.yMax); y++) {
        for (let x = Math.floor(vw.xMin); x < Math.ceil(vw.xMax); x++) {
          const boxPointers = pointers.filter(
            p => Math.floor(p.boxIndex % xBoxCount) === x && Math.floor(p.boxIndex / xBoxCount) === y
          );
          if (!boxPointers.length) continue;
          const inColor = interpolateColor({
            minValue: valueMin,
            maxValue: valueMax,
            value: boxPointers[0].value,
            startColor: "#9EE8FF",
            endColor: "#173375",
          });
          const r = inColor.r / 255;
          const g = inColor.g / 255;
          const b = inColor.b / 255;

          vertices.push(
            x, y, r, g, b,
            x + 1, y, r, g, b,
            x + 1, y + 1, r, g, b,
            x, y + 1, r, g, b
          );
        }
      }

      if (vertices.length) {
        const stride = 5 * 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(a_pos);
        gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(a_color);
        gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, stride, 2 * 4);

        for (let i = 0; i < vertices.length / 5; i += 4) {
          gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
        }
      }
    } else {
      pointers.forEach(p => {
        const boxX = p.boxIndex % xBoxCount;
        const boxY = Math.floor(p.boxIndex / xBoxCount);

        if (boxX < vw.xMin - 1 || boxX > vw.xMax + 1 || boxY < vw.yMin - 1 || boxY > vw.yMax + 1)
          return;

        const inColor = interpolateColor({
          minValue: valueMin,
          maxValue: valueMax,
          value: p.value,
          startColor: "#9EE8FF",
          endColor: "#173375",
        });
        const r = inColor.r / 255;
        const g = inColor.g / 255;
        const b = inColor.b / 255;

        if (chartTypeRef.current === "vertical") {
          const xPos = boxX + p.x / 100;
          vertices.push(xPos, boxY, r, g, b);
          vertices.push(xPos, boxY + 1, r, g, b);
        } else {
          const yPos = boxY + p.y / 100;
          vertices.push(boxX, yPos, r, g, b);
          vertices.push(boxX + 1, yPos, r, g, b);
        }
      });

      if (vertices.length) {
        const stride = 5 * 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(a_pos);
        gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(a_color);
        gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, stride, 2 * 4);

        gl.drawArrays(gl.LINES, 0, vertices.length / 5);
      }
    }

    drawGrid();
  }, [pointers, xBoxCount, yBoxCount, valueMin, valueMax]);

  // ====== 확대 / 축소 버튼 ======
  const handleZoomIn = () => {
    const vw = viewRef.current;
    const midX = (vw.xMin + vw.xMax) / 2;
    const midY = (vw.yMin + vw.yMax) / 2;
    const width = (vw.xMax - vw.xMin) / ZOOM_FACTOR;
    const height = (vw.yMax - vw.yMin) / ZOOM_FACTOR;

    viewRef.current = {
      xMin: midX - width / 2,
      xMax: midX + width / 2,
      yMin: midY - height / 2,
      yMax: midY + height / 2,
    };

    setZoomLevel(prev => {
      const newZoom = prev * 2;
      requestAnimationFrame(() => renderGL());
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    const vw = viewRef.current;
    const fullWidth = xBoxCount;
    const fullHeight = yBoxCount;
    const midX = (vw.xMin + vw.xMax) / 2;
    const midY = (vw.yMin + vw.yMax) / 2;

    let width = (vw.xMax - vw.xMin) * ZOOM_FACTOR;
    let height = (vw.yMax - vw.yMin) * ZOOM_FACTOR;

    if (width >= fullWidth && height >= fullHeight) {
      viewRef.current = { xMin: 0, xMax: fullWidth, yMin: 0, yMax: fullHeight };
      setZoomLevel(MIN_ZOOM);
      requestAnimationFrame(() => renderGL());
      return;
    }

    if (width > fullWidth) width = fullWidth;
    if (height > fullHeight) height = fullHeight;

    viewRef.current = {
      xMin: Math.max(0, midX - width / 2),
      xMax: Math.min(fullWidth, midX + width / 2),
      yMin: Math.max(0, midY - height / 2),
      yMax: Math.min(fullHeight, midY + height / 2),
    };

    setZoomLevel(prev => {
      const zoomX = fullWidth / (viewRef.current.xMax - viewRef.current.xMin);
      const zoomY = fullHeight / (viewRef.current.yMax - viewRef.current.yMin);
      const newZoom = Math.min(zoomX, zoomY);
      requestAnimationFrame(() => renderGL());
      return Math.max(MIN_ZOOM, newZoom);
    });
  };

  const handleReset = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    setZoomLevel(MIN_ZOOM);
    requestAnimationFrame(() => renderGL());
  };

  return (
    <div>
      <div>{zoomLevel >= BOX_COLOR_THRESHOLD ? "포인터 라인 모드" : "박스 모드"} (zoom: {zoomLevel})</div>
      <div style={{ width: "100%", position: "relative" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: `${height}px`, display: "block}} />
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
      </div>
      <div style={{ marginTop: 10 }}>
        <button onClick={handleZoomIn}>확대</button>
        <button onClick={handleZoomOut}>축소</button>
        <button onClick={handleReset}>리셋</button>
      </div>
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "2px 5px",
            borderRadius: 3,
            pointerEvents: "none",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default WebGLDetailChart;


// ====== 마우스 이벤트 처리 ======
useEffect(() => {
  const canvas = canvasRef.current!;
  const overlay = overlayRef.current!;
  if (!canvas || !overlay) return;

  let rafId: number | null = null;
  let isHover = false;

  const getMousePos = (ev: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  const drawSelectionRect = () => {
    if (!dragStartRef.current || !dragEndRef.current) return;
    const ctx = overlay.getContext("2d")!;
    drawGrid();

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
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const pos = getMousePos(ev);
      // 툴팁 처리
      const vw = viewRef.current;
      const cellW = canvas.clientWidth / (vw.xMax - vw.xMin);
      const cellH = canvas.clientHeight / (vw.yMax - vw.yMin);
      const cellX = Math.floor(vw.xMin + pos.x / cellW);
      const cellY = Math.floor(vw.yMin + pos.y / cellH);

      if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
        setTooltip({ text: `셀(${cellX}, ${cellY})`, x: ev.clientX, y: ev.clientY });
        lastTooltipRef.current = { cellX, cellY };
      } else {
        setTooltip(null);
        lastTooltipRef.current = null;
      }

      // 드래그 중이면 선택 영역 업데이트
      if (isDraggingRef.current) {
        dragEndRef.current = pos;
        drawSelectionRect();
      }

      rafId = null;
    });
  };

  const onPointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return;
    isDraggingRef.current = true;
    const pos = getMousePos(ev);
    dragStartRef.current = pos;
    dragEndRef.current = pos;
    drawSelectionRect();
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragEndRef.current = null;
    overlay.getContext("2d")!.clearRect(0, 0, overlay.width, overlay.height);
    renderGL();
  };

  const handleMouseEnter = () => { isHover = true; };
  const handleMouseLeave = () => { isHover = false; setTooltip(null); lastTooltipRef.current = null; };

  canvas.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("mouseenter", handleMouseEnter);
  canvas.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("mouseenter", handleMouseEnter);
    canvas.removeEventListener("mouseleave", handleMouseLeave);
    if (rafId) cancelAnimationFrame(rafId);
  };
}, [xBoxCount, yBoxCount]);
