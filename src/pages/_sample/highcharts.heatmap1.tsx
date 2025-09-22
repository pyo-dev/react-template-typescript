// WebGLDetailChart.tsx (완전 작동 버전)
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

const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({ height, xBoxCount, yBoxCount, pointers }) => {
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

  /** 초기 WebGL 세팅 */
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

  /** WebGL 렌더링 */
  const renderGL = () => {
    const gl = glRef.current;
    if (!gl || !programRef.current) return;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const a_pos = attribLocRef.current!;
    const u = uniformLocsRef.current!;
    const vw = viewRef.current;

    gl.uniform1f(u.u_xMin, vw.xMin);
    gl.uniform1f(u.u_xMax, vw.xMax);
    gl.uniform1f(u.u_yMin, vw.yMin);
    gl.uniform1f(u.u_yMax, vw.yMax);

    const vertices: number[] = [];
    pointers.forEach((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);
      const xPos = boxX + p.x / 100;
      const yTop = boxY;
      const yBottom = boxY + 1;
      vertices.push(xPos, yTop, xPos, yBottom);
    });

    if (vertices.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(a_pos);
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

      pointers.forEach((p, idx) => {
        const t = p.x / 100;
        gl.uniform4f(u.u_color, t, 0, 1 - t, 1);
        gl.drawArrays(gl.LINES, idx * 2, 2);
      });
    }

    drawGrid();
  };

  /** 이벤트 처리 (툴팁, 드래그, 패닝) */
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
      ctx.fillRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(s.x - e.x), Math.abs(s.y - e.y));
    };

    const getNormCoords = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        normX: (ev.clientX - rect.left) / rect.width,
        normY: (ev.clientY - rect.top) / rect.height,
        clientX: ev.clientX,
        clientY: ev.clientY
      };
    };

    const onPointerMove = (ev: PointerEvent) => {
      const vw = viewRef.current;
      const { normX, normY, clientX, clientY } = getNormCoords(ev);

      // 툴팁
      const cellX = Math.floor(vw.xMin + normX * (vw.xMax - vw.xMin));
      const cellY = Math.floor(vw.yMin + normY * (vw.yMax - vw.yMin));
      const last = lastTooltipRef.current;
      if (!last || last.cellX !== cellX || last.cellY !== cellY) {
        if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
          setTooltip({ text: `셀(${cellX},${cellY}), 인덱스:${cellY*xBoxCount+cellX}`, x: clientX, y: clientY });
        } else setTooltip(null);
        lastTooltipRef.current = { cellX, cellY };
      }

      // 드래그
      if (isDraggingRef.current && dragStartRef.current) {
        const rect = canvas.getBoundingClientRect();
        dragEndRef.current = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
        drawSelectionRect();
      }

      // 패닝
      if (isPanningRef.current && panStartRef.current) {
        const dx = normX - (panStartRef.current.x / canvas.width);
        const dy = normY - (panStartRef.current.y / canvas.height);
        const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
        const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;
        let newXMin = viewStartRef.current.xMin - dx * vwWidth;
        let newXMax = viewStartRef.current.xMax - dx * vwWidth;
        let newYMin = viewStartRef.current.yMin - dy * vwHeight;
        let newYMax = viewStartRef.current.yMax - dy * vwHeight;

        if (newXMin < 0) { newXMin = 0; newXMax = vwWidth; }
        if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = xBoxCount - vwWidth; }
        if (newYMin < 0) { newYMin = 0; newYMax = vwHeight; }
        if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = yBoxCount - vwHeight; }

        viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
        renderGL();
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      if ((ev.shiftKey || ev.button === 2) && !(viewRef.current.xMin === 0 && viewRef.current.xMax === xBoxCount && viewRef.current.yMin === 0 && viewRef.current.yMax === yBoxCount)) {
        isPanningRef.current = true;
        panStartRef.current = { x: ev.clientX, y: ev.clientY };
        viewStartRef.current = { ...viewRef.current };
        canvas.style.cursor = "grab";
        return;
      }
      if (ev.button !== 0) return;
      isDraggingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      dragStartRef.current = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      dragEndRef.current = null;
      drawSelectionRect();
    };

    const onPointerUp = () => {
      const vw = viewRef.current;

      // 패닝 종료
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        viewStartRef.current = viewRef.current;
        canvas.style.cursor = "default";
        return;
      }

      // 드래그 종료
      if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
        const s = dragStartRef.current;
        const e = dragEndRef.current;

        const rect = canvas.getBoundingClientRect();
        const normXMin = Math.min(s.x, e.x) / rect.width;
        const normXMax = Math.max(s.x, e.x) / rect.width;
        const normYMin = Math.min(s.y, e.y) / rect.height;
        const normYMax = Math.max(s.y, e.y) / rect.height;

        const worldXMin = vw.xMin + normXMin * (vw.xMax - vw.xMin);
        const worldXMax = vw.xMin + normXMax * (vw.xMax - vw.xMin);
        const worldYMin = vw.yMin + normYMin * (vw.yMax - vw.yMin);
        const worldYMax = vw.yMin + normYMax * (vw.yMax - vw.yMin);

        // 선택된 포인터 확인
        const selectedPointers = pointers.filter((p) => {
          const boxX = p.boxIndex % xBoxCount;
          const boxY = Math.floor(p.boxIndex / xBoxCount);
          const xPos = boxX + p.x / 100;
          const yTop = boxY;
          const yBottom = boxY + 1;
          return xPos >= worldXMin && xPos <= worldXMax && yBottom > worldYMin && yTop < worldYMax;
        });
        console.log("드래그 영역 포인터:", selectedPointers);

        // 뷰 확대
        viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };
        renderGL();

        // 드래그 초기화
        isDraggingRef.current = false;
        dragStartRef.current = null;
        dragEndRef.current = null;
      }
    };

    const onMouseLeave = () => setTooltip(null);

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [pointers, xBoxCount, yBoxCount]);

  /** 리셋 버튼 */
  const handleReset = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    renderGL();
  };

  /** Resize Observer */
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
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
  }, [height, xBoxCount, yBoxCount]);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: `${height}px`, display: "block", border: "1px solid #ddd" }}
      />
      <canvas
        ref={overlayRef}
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", width: "100%", height: `${height}px` }}
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
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {tooltip.text}
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <button onClick={handleReset}>원상태 복원</button>
        <span style={{ marginLeft: 12 }}>Shift+드래그 또는 우클릭 드래그 = 패닝</span>
      </div>
    </div>
  );
};

export default WebGLDetailChart;
