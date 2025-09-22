// WebGLDetailChartFinal.tsx
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

const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({ height, xBoxCount, yBoxCount, pointers }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const attribLocRef = useRef<number | null>(null);
  const uniformLocsRef = useRef<any>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);

  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef(viewRef.current);

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const resizeCanvas = () => {
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current!;
    const parent = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    overlay.width = canvas.width;
    overlay.height = canvas.height;
  };

  const drawGrid = () => {
    const overlay = overlayRef.current!;
    const ctx = overlay.getContext("2d")!;
    const canvas = canvasRef.current!;
    const vw = viewRef.current;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const cellW = overlay.width / (vw.xMax - vw.xMin);
    const cellH = overlay.height / (vw.yMax - vw.yMin);

    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1 * dpr;

    for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
      const x = (i - vw.xMin) * cellW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, overlay.height);
      ctx.stroke();
    }
    for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) {
      const y = (i - vw.yMin) * cellH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(overlay.width, y);
      ctx.stroke();
    }
  };

  const renderGL = () => {
    const gl = glRef.current!;
    const program = programRef.current!;
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
      const xPos = boxX + p.x / 100;
      vertices.push(xPos, boxY, xPos, boxY + 1);
      colors.push(p.x / 100);
    });

    if (vertices.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(a_pos);
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

      vertices.forEach((_, i) => {
        const t = colors[Math.floor(i / 2)];
        gl.uniform4f(u.u_color, t, 0, 1 - t, 1);
        gl.drawArrays(gl.LINES, i, 2);
      });
    }

    drawGrid();
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false })!;
    glRef.current = gl;
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    programRef.current = program;
    gl.useProgram(program);
    attribLocRef.current = gl.getAttribLocation(program, "a_pos");
    uniformLocsRef.current = {
      u_xMin: gl.getUniformLocation(program, "u_xMin"),
      u_xMax: gl.getUniformLocation(program, "u_xMax"),
      u_yMin: gl.getUniformLocation(program, "u_yMin"),
      u_yMax: gl.getUniformLocation(program, "u_yMax"),
      u_color: gl.getUniformLocation(program, "u_color"),
    };
    bufferRef.current = gl.createBuffer();
    gl.clearColor(0.98, 0.98, 0.98, 1.0);

    resizeCanvas();
    renderGL();

    const ro = new ResizeObserver(() => {
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      renderGL();
    });
    ro.observe(canvas.parentElement!);

    return () => ro.disconnect();
  }, [height, xBoxCount, yBoxCount, pointers]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current!;

    const getMouseWorld = (x: number, y: number) => {
      const vw = viewRef.current;
      return {
        wx: vw.xMin + (x / overlay.width) * (vw.xMax - vw.xMin),
        wy: vw.yMin + (y / overlay.height) * (vw.yMax - vw.yMin),
      };
    };

    const drawSelectionRect = () => {
      if (!dragStartRef.current || !dragEndRef.current) return;
      const ctx = overlay.getContext("2d")!;
      drawGrid();
      const s = dragStartRef.current;
      const e = dragEndRef.current;
      ctx.strokeStyle = "rgba(255,0,0,0.9)";
      ctx.fillStyle = "rgba(255,0,0,0.08)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(s.x - e.x), Math.abs(s.y - e.y));
      ctx.fillRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(s.x - e.x), Math.abs(s.y - e.y));
    };

    const onPointerMove = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const mouseX = (ev.clientX - rect.left) * dpr;
      const mouseY = (ev.clientY - rect.top) * dpr;

      const vw = viewRef.current;
      const cellW = overlay.width / (vw.xMax - vw.xMin);
      const cellH = overlay.height / (vw.yMax - vw.yMin);

      const cellX = Math.floor(vw.xMin + mouseX / cellW);
      const cellY = Math.floor(vw.yMin + mouseY / cellH);
      if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
        setTooltip({ text: `셀(${cellX},${cellY})`, x: ev.clientX, y: ev.clientY });
      } else {
        setTooltip(null);
      }

      if (isDraggingRef.current) {
        dragEndRef.current = { x: mouseX, y: mouseY };
        drawSelectionRect();
      }

      if (isPanningRef.current && panStartRef.current) {
        const dx = mouseX - panStartRef.current.x;
        const dy = mouseY - panStartRef.current.y;
        const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
        const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;
        let newXMin = viewStartRef.current.xMin - (dx / overlay.width) * vwWidth;
        let newXMax = viewStartRef.current.xMax - (dx / overlay.width) * vwWidth;
        let newYMin = viewStartRef.current.yMin - (dy / overlay.height) * vwHeight;
        let newYMax = viewStartRef.current.yMax - (dy / overlay.height) * vwHeight;

        if (newXMin < 0) { newXMin = 0; newXMax = vwWidth; }
        if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = xBoxCount - vwWidth; }
        if (newYMin < 0) { newYMin = 0; newYMax = vwHeight; }
        if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = yBoxCount - vwHeight; }

        viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
        renderGL();
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const mouseX = (ev.clientX - rect.left) * dpr;
      const mouseY = (ev.clientY - rect.top) * dpr;

      if (ev.shiftKey || ev.button === 2) {
        isPanningRef.current = true;
        panStartRef.current = { x: mouseX, y: mouseY };
        viewStartRef.current = { ...viewRef.current };
        return;
      }

      if (ev.button !== 0) return;
      isDraggingRef.current = true;
      dragStartRef.current = { x: mouseX, y: mouseY };
      dragEndRef.current = null;
    };

    const onPointerUp = () => {
      if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
        const s = dragStartRef.current;
        const e = dragEndRef.current;
        const vw = viewRef.current;

        const worldStart = getMouseWorld(s.x, s.y);
        const worldEnd = getMouseWorld(e.x, e.y);
        viewRef.current = {
          xMin: Math.min(worldStart.wx, worldEnd.wx),
          xMax: Math.max(worldStart.wx, worldEnd.wx),
          yMin: Math.min(worldStart.wy, worldEnd.wy),
          yMax: Math.max(worldStart.wy, worldEnd.wy),
        };

        console.log("선택 영역 포인터:", pointers.filter(p => {
          const bx = p.boxIndex % xBoxCount + p.x / 100;
          const by = Math.floor(p.boxIndex / xBoxCount);
          return bx >= viewRef.current.xMin && bx <= viewRef.current.xMax && by >= viewRef.current.yMin && by <= viewRef.current.yMax;
        }));

        renderGL();
      }
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;
      isPanningRef.current = false;
      panStartRef.current = null;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [pointers]);

  const resetView = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
    renderGL();
  };

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <canvas ref={canvasRef} style={{ display: "block", position: "absolute", top: 0, left: 0 }} />
      <canvas ref={overlayRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }} />
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 10,
          top: tooltip.y + 10,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "2px 5px",
          fontSize: 12,
          borderRadius: 3,
          pointerEvents: "none"
        }}>
          {tooltip.text}
        </div>
      )}
      <button style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }} onClick={resetView}>Reset</button>
    </div>
  );
};

export default WebGLDetailChart;
