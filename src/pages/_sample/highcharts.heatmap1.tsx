// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

type Pointer = { boxIndex: number; x: number; y: number; value: number };

interface WebGLDetailChartProps {
  height: number;
  xBoxCount: number;
  yBoxCount: number;
  pointers: Pointer[];
  valueMin: number;
  valueMax: number;
  chartType?: "vertical" | "horizontal"; // 포인터 라인 방향
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  // 현재 화면 범위
  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  // 드래그 상태
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  // 패닝 상태
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef(viewRef.current);

  // WebGL refs
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const attribLocRef = useRef<number | null>(null);
  const uniformLocsRef = useRef<any>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);

  // 툴팁 및 포인터 로그
  const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // 확대/축소 상태
  const [zoomLevel, setZoomLevel] = useState(1);
  const MAX_ZOOM = 5;
  const MIN_ZOOM = 1;

  // 리사이즈 처리
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

  // 그리드 그리기 (세로 + 가로 항상 표시)
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
  };

  // WebGL 렌더링 (포인터)
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

  // 마우스 위치 계산
  const getMousePos = (ev: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

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

      const cellW = canvas.clientWidth / (vw.xMax - vw.xMin);
      const cellH = canvas.clientHeight / (vw.yMax - vw.yMin);
      const cellX = Math.floor(vw.xMin + mouse.x / cellW);
      const cellY = Math.floor(vw.yMin + mouse.y / cellH);
      const last = lastTooltipRef.current;
      if (!last || last.cellX !== cellX || last.cellY !== cellY) {
        if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
          setTooltip({ text: `셀(${cellX}, ${cellY})`, x: ev.clientX, y: ev.clientY });
        } else setTooltip(null);
        lastTooltipRef.current = { cellX, cellY };
      }

      // 드래그
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
      const canvas = canvasRef.current!;
      const overlay = overlayRef.current!;
      if (!canvas || !overlay) return;

      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        viewStartRef.current = viewRef.current;
        canvas.style.cursor = "default";
      }

      // 드래그 영역 안 포인터 로그
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

        const worldXMin = vw.xMin + Math.min(s.x, e.x) / canvasW * (vw.xMax - vw.xMin);
        const worldXMax = vw.xMin + Math.max(s.x, e.x) / canvasW * (vw.xMax - vw.xMin);
        const worldYMin = vw.yMin + Math.min(s.y, e.y) / canvasH * (vw.yMax - vw.yMin);
        const worldYMax = vw.yMin + Math.max(s.y, e.y) / canvasH * (vw.yMax - vw.yMin);

        console.log("드래그 영역 내 포인터 데이터:");
        pointers.forEach(p => {
          const boxX = p.boxIndex % xBoxCount;
          const boxY = Math.floor(p.boxIndex / xBoxCount);
          if (chartType === "vertical") {
            const xPos = boxX + p.x / 100;
            if (xPos >=worldXMin && xPos <= worldXMax && boxY >= worldYMin && boxY <= worldYMax) {
              console.log(p);
            }
          } else {
            const yPos = boxY + p.y / 100;
            if (boxX >= worldXMin && boxX <= worldXMax && yPos >= worldYMin && yPos <= worldYMax) {
              console.log(p);
            }
          }
        });

        // 드래그로 확대
        viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };

        // 확대 버튼 상태 업데이트
        if (worldXMax - worldXMin > xBoxCount / MAX_ZOOM || worldYMax - worldYMin > yBoxCount / MAX_ZOOM) {
          // 최대 확대보다 크면 확대 버튼 비활성화
          setZoomLevel(MAX_ZOOM + 1);
        } else {
          setZoomLevel(Math.min(MAX_ZOOM, zoomLevel));
        }
      }

      // 드래그 종료 초기화
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
  }, [pointers, xBoxCount, yBoxCount, valueMin, valueMax, chartType, zoomLevel]);

  // 확대
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

    if (zoomLevel >= MAX_ZOOM) return;
    viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
    setZoomLevel(prev => Math.min(MAX_ZOOM, prev * 2));
    renderGL();
  };

  // 축소
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

    // 최소 초기 크기 제한
    if (newXMin < 0) { newXMin = 0; newXMax = xBoxCount; }
    if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = 0; }
    if (newYMin < 0) { newYMin = 0; newYMax = yBoxCount; }
    if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = 0; }

    viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };

    // 확대 버튼 상태 복원
    if ((newXMax - newXMin) <= xBoxCount / MAX_ZOOM && (newYMax - newYMin) <= yBoxCount / MAX_ZOOM) {
      setZoomLevel(Math.min(MAX_ZOOM, zoomLevel));
    }

    renderGL();
  };

  // 초기화
  const handleReset = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    setZoomLevel(MIN_ZOOM);
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
        <button onClick={handleZoomOut}>축소</button>
        <button onClick={handleReset}>Reset View</button>
      </div>
    </div>
  );
};

export default WebGLDetailChart;
