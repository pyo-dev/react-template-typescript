// WebGLDetailChartOptimized.tsx
import React, { useEffect, useRef, useState } from "react";

type Pointer = { boxIndex: number; x: number; y: number };

interface WebGLDetailChartProps {
  height: number;
  xBoxCount: number;
  yBoxCount: number;
  pointers: Pointer[];
}

const vertexShaderSource = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
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

const resizeCanvas = (canvas: HTMLCanvasElement, heightPx: number) => {
  const parent = canvas.parentElement!;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(parent.clientWidth * dpr));
  const height = Math.max(1, Math.floor(heightPx * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${heightPx}px`;
  }
};

const WebGLDetailChartOptimized: React.FC<WebGLDetailChartProps> = ({
  height,
  xBoxCount,
  yBoxCount,
  pointers,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  const dragRef = useRef<{ start: { x: number; y: number } | null; end: { x: number; y: number } | null }>({ start: null, end: null });
  const panRef = useRef<{ start: { x: number; y: number } | null; viewStart: any }>({ start: null, viewStart: null });

  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const aPosRef = useRef<number | null>(null);
  const uColorRef = useRef<WebGLUniformLocation | null>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);

  const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  /** 초기 WebGL 설정 */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return console.error("WebGL 미지원");
    glRef.current = gl;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    programRef.current = program;
    gl.useProgram(program);

    aPosRef.current = gl.getAttribLocation(program, "a_pos");
    uColorRef.current = gl.getUniformLocation(program, "u_color");

    bufferRef.current = gl.createBuffer();

    resizeCanvas(canvas, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);

    renderGL();

    return () => gl.clear(gl.COLOR_BUFFER_BIT);
  }, [height]);

  /** 그리드 그리기 */
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

  /** WebGL 렌더링 (포인터 그라데이션 적용) */
  const renderGL = () => {
    const gl = glRef.current;
    if (!gl || !programRef.current) return;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const aPos = aPosRef.current!;
    const uColor = uColorRef.current!;
    const vw = viewRef.current;

    const vertices: number[] = [];
    const colors: number[] = [];

    pointers.forEach((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);
      const xPos = ((boxX + p.x / 100) - vw.xMin) / (vw.xMax - vw.xMin) * 2 - 1;
      const yTop = 1 - ((boxY - vw.yMin) / (vw.yMax - vw.yMin)) * 2;
      const yBottom = 1 - ((boxY + 1 - vw.yMin) / (vw.yMax - vw.yMin)) * 2;
      vertices.push(xPos, yTop, xPos, yBottom);
      colors.push(p.x / 100);
    });

    if (vertices.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      for (let i = 0; i < vertices.length / 2; i += 2) {
        const t = colors[i / 2];
        gl.uniform4f(uColor, t, 0, 1 - t, 1);
        gl.drawArrays(gl.LINES, i, 2);
      }
    }

    drawGrid();
  };

  /** 마우스 좌표 변환 */
  const getMousePos = (ev: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return { x: (ev.clientX - rect.left) * dpr, y: (ev.clientY - rect.top) * dpr };
  };

  /** 이벤트 처리 */
  useEffect(() => {
    const canvas = overlayRef.current!;
    if (!canvas) return;

    const onMove = (ev: PointerEvent) => {
      const vw = viewRef.current;
      const mouse = getMousePos(ev);

      // 툴팁
      const cellW = canvas.width / (vw.xMax - vw.xMin);
      const cellH = canvas.height / (vw.yMax - vw.yMin);
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
      if (dragRef.current.start) {
        dragRef.current.end = { x: mouse.x, y: mouse.y };
        const ctx = canvas.getContext("2d")!;
        drawGrid();
        ctx.strokeStyle = "rgba(255,0,0,0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        const s = dragRef.current.start;
        const e = dragRef.current.end;
        ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
        ctx.fillStyle = "rgba(255,0,0,0.08)";
        ctx.fillRect(s.x, s.y, e.x - s.x, e.y - s.y);
      }

      // 패닝
      if (panRef.current.start && panRef.current.viewStart) {
        const dx = mouse.x - panRef.current.start.x;
        const dy = mouse.y - panRef.current.start.y;
        const vwWidth = panRef.current.viewStart.xMax - panRef.current.viewStart.xMin;
        const vwHeight = panRef.current.viewStart.yMax - panRef.current.viewStart.yMin;

        let newXMin = panRef.current.viewStart.xMin - dx / canvas.width * vwWidth;
        let newXMax = panRef.current.viewStart.xMax - dx / canvas.width * vwWidth;
        let newYMin = panRef.current.viewStart.yMin - dy / canvas.height * vwHeight;
        let newYMax = panRef.current.viewStart.yMax - dy / canvas.height * vwHeight;

        if (newXMin < 0) { newXMin = 0; newXMax = vwWidth; }
        if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = xBoxCount - vwWidth; }
        if (newYMin < 0) { newYMin = 0; newYMax = vwHeight; }
        if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = yBoxCount - vwHeight; }

        viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
        renderGL();
      }
    };

    const onDown = (ev: PointerEvent) => {
      const mouse = getMousePos(ev);
      const vw = viewRef.current;
      const fullX = vw.xMin === 0 && vw.xMax === xBoxCount;
      const fullY = vw.yMin === 0 && vw.yMax === yBoxCount;

      if ((ev.shiftKey || ev.button === 2) && !(fullX && fullY)) {
        panRef.current.start = mouse;
        panRef.current.viewStart = { ...vw };
        return;
      }

      if (ev.button !== 0) return;
      dragRef.current.start = mouse;
      dragRef.current.end = null;
    };

    const onUp = () => {
      if (panRef.current.start) {
        panRef.current.start = null;
        panRef.current.viewStart = null;
        return;
      }

      if (!dragRef.current.start || !dragRef.current.end) return;

      const s = dragRef.current.start;
      const e = dragRef.current.end;
      const vw = viewRef.current;

      const canvasW = canvas.width;
      const canvasH = canvas.height;

      const xMinPx = Math.max(0, Math.min(s.x, e.x));
      const xMaxPx = Math.min(canvasW, Math.max(s.x, e.x));
      const yMinPx = Math.max(0, Math.min(s.y, e.y));
      const yMaxPx = Math.min(canvasH, Math.max(s.y, e.y));

      const worldXMin = vw.xMin + (xMinPx / canvasW) * (vw.xMax - vw.xMin);
      const worldXMax = vw.xMin + (xMaxPx / canvasW) * (vw.xMax - vw.xMin);
      const worldYMin = vw.yMin + (yMinPx / canvasH) * (vw.yMax - vw.yMin);
      const worldYMax = vw.yMin + (yMaxPx / canvasH) * (vw.yMax - vw.yMin);

      viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };
      renderGL();

      dragRef.current.start = null;
      dragRef.current.end = null;
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", () => setTooltip(null));

    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", () => setTooltip(null));
    };
  }, [xBoxCount, yBoxCount, pointers]);

  /** 윈도우 리사이즈 */
  useEffect(() => {
    const onResize = () => renderGL();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const resetView = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    renderGL();
  };

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <canvas
        ref={overlayRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "crosshair" }}
      />
      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y + 12,
            left: tooltip.x + 12,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: 4,
            pointerEvents: "none",
            fontSize: 12,
            zIndex: 1000,
          }}
        >
          {tooltip.text}
        </div>
      )}
      <button
        onClick={resetView}
        style={{ position: "absolute", top: 10, right: 10, zIndex: 10, padding: "4px 8px" }}
      >
        Reset
      </button>
    </div>
  );
};

export default WebGLDetailChartOptimized;
