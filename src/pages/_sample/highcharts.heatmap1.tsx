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
}`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() { gl_FragColor = u_color; }`;

const compileShader = (gl: WebGLRenderingContext, src: string, type: number) => {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(err ?? "");
  }
  return sh;
};

const createProgram = (gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) => {
  const vs = compileShader(gl, vsSrc, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fsSrc, gl.FRAGMENT_SHADER);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
};

const resizeCanvas = (canvas: HTMLCanvasElement, heightPx: number) => {
  const parent = canvas.parentElement!;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(parent.clientWidth * dpr);
  const height = Math.floor(heightPx * dpr);
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
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const aPosRef = useRef<number>(0);
  const colorLocRef = useRef<WebGLUniformLocation | null>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);

  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef(viewRef.current);

  /** 초기 WebGL 세팅 */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl");
    if (!gl) return;
    glRef.current = gl;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);
    programRef.current = program;

    aPosRef.current = gl.getAttribLocation(program, "a_pos");
    colorLocRef.current = gl.getUniformLocation(program, "u_color");

    bufferRef.current = gl.createBuffer();

    resizeCanvas(canvas, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.98, 0.98, 0.98, 1);

    renderGL();

    return () => gl.clear(gl.COLOR_BUFFER_BIT);
  }, [height]);

  /** 그리드 그리기 */
  const drawGrid = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    const parent = overlay.parentElement!;
    overlay.width = parent.clientWidth;
    overlay.height = height;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    const vw = viewRef.current;
    const cellW = overlay.width / (vw.xMax - vw.xMin);
    const cellH = overlay.height / (vw.yMax - vw.yMin);

    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
      const x = (i - vw.xMin) * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, overlay.height);
      ctx.stroke();
    }
    for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) {
      const y = (i - vw.yMin) * cellH + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(overlay.width, y);
      ctx.stroke();
    }
  };

  /** 화면에 보이는 포인터만 계산하여 렌더링 */
  const renderGL = () => {
    const gl = glRef.current;
    if (!gl) return;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vw = viewRef.current;
    const canvas = canvasRef.current!;
    const visiblePointers = pointers.filter((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);
      const xPos = boxX + p.x / 100;
      const yTop = boxY;
      const yBottom = boxY + 1;
      return xPos >= vw.xMin && xPos <= vw.xMax && yBottom >= vw.yMin && yTop <= vw.yMax;
    });

    const vertices: number[] = [];
    const colors: number[][] = [];

    visiblePointers.forEach((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);
      const xPos = ((boxX + p.x / 100 - vw.xMin) / (vw.xMax - vw.xMin)) * 2 - 1;
      const yTop = 1 - ((boxY - vw.yMin) / (vw.yMax - vw.yMin)) * 2;
      const yBottom = 1 - ((boxY + 1 - vw.yMin) / (vw.yMax - vw.yMin)) * 2;

      vertices.push(xPos, yTop, xPos, yBottom);

      const t = Math.min(Math.max(p.x / 100, 0), 1);
      colors.push([t, 0, 1 - t, 1]);
    });

    // GPU 버퍼에 업로드
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aPosRef.current);
    gl.vertexAttribPointer(aPosRef.current, 2, gl.FLOAT, false, 0, 0);

    // 포인터 하나씩 draw (간단 최적화, instancing 가능)
    let offset = 0;
    colors.forEach((c) => {
      gl.uniform4fv(colorLocRef.current, c);
      gl.drawArrays(gl.LINES, offset, 2);
      offset += 2;
    });

    drawGrid();
  };

  /** 이벤트 처리: 드래그, 패닝 */
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
      ctx.strokeRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(s.x - e.x), Math.abs(s.y - e.y));
      ctx.fillStyle = "rgba(255,0,0,0.08)";
      ctx.fillRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(s.x - e.x), Math.abs(s.y - s.y));
    };

    const onPointerDown = (ev: PointerEvent) => {
      const vw = viewRef.current;
      if ((ev.shiftKey || ev.button === 2) && (vw.xMax - vw.xMin < xBoxCount || vw.yMax - vw.yMin < yBoxCount)) {
        isPanningRef.current = true;
        panStartRef.current = { x: ev.clientX, y: ev.clientY };
        viewStartRef.current = { ...viewRef.current };
        return;
      }
      if (ev.button !== 0) return;
      isDraggingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      dragStartRef.current = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      dragEndRef.current = null;
      drawSelectionRect();
    };

    const onPointerMove = (ev: PointerEvent) => {
      const vw = viewRef.current;
      const rect = canvas.getBoundingClientRect();
      if (isPanningRef.current && panStartRef.current) {
        const dx = ev.clientX - panStartRef.current.x;
        const dy = ev.clientY - panStartRef.current.y;
        const dxRatio = dx / canvas.width;
        const dyRatio = dy / canvas.height;
        const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
        const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;
        viewRef.current = {
          xMin: Math.max(0, Math.min(xBoxCount - vwWidth, viewStartRef.current.xMin - dxRatio * vwWidth)),
          xMax: Math.max(0, Math.min(xBoxCount, viewStartRef.current.xMax - dxRatio * vwWidth)),
          yMin: Math.max(0, Math.min(yBoxCount - vwHeight, viewStartRef.current.yMin - dyRatio * vwHeight)),
          yMax: Math.max(0, Math.min(yBoxCount, viewStartRef.current.yMax - dyRatio * vwHeight)),
        };
        requestAnimationFrame(renderGL);
        return;
      }
      if (isDraggingRef.current && dragStartRef.current) {
        dragEndRef.current = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
        drawSelectionRect();
      }
    };

    const onPointerUp = () => {
      const vw = viewRef.current;
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
        const s = dragStartRef.current;
        const e = dragEndRef.current;
        const xMin = Math.min(s.x, e.x) / canvasW * (vw.xMax - vw.xMin) + vw.xMin;
        const xMax = Math.max(s.x, e.x) / canvasW * (vw.xMax - vw.xMin) + vw.xMin;
        const yMin = Math.min(s.y, e.y) / canvasH * (vw.yMax - vw.yMin) + vw.yMin;
        const yMax = Math.max(s.y, e.y) / canvasH * (vw.yMax - vw.yMin) + vw.yMin;

        // 영역내 포인터 로그
        const selected = pointers.filter((p) => {
          const boxX = p.boxIndex % xBoxCount;
          const boxY = Math.floor(p.boxIndex / xBoxCount);
          const xPos = boxX + p.x / 100;
          const yTop = boxY;
          const yBottom = boxY + 1;
          return xPos >= xMin && xPos <= xMax && yBottom >= yMin && yTop <= yMax;
        });
        console.log("선택 영역 포인터:", selected);

        viewRef.current = { xMin, xMax, yMin, yMax };
        requestAnimationFrame(renderGL);
      }
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;
      isPanningRef.current = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [pointers]);

  const handleReset = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    renderGL();
  };

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: height, display: "block", border: "1px solid #ddd" }}
      />
      <canvas
        ref={overlayRef}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: height, pointerEvents: "none" }}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={handleReset}>원상태 복원</button>
        <span style={{ marginLeft: 12 }}>Shift+드래그 또는 우클릭 드래그 = 패닝</span>
      </div>
    </div>
  );
};

export default WebGLDetailChartOptimized;
