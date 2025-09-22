// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

// 포인터 타입 정의
type Pointer = { boxIndex: number; x: number; y: number };

// 컴포넌트 props
interface WebGLDetailChartProps {
  height: number;
  xBoxCount: number;
  yBoxCount: number;
  pointers: Pointer[];
}

// Vertex Shader
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

// Fragment Shader
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

// 캔버스 반응형 처리
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

  // 현재 뷰 영역
  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });

  // 드래그/패닝 상태
  const isDraggingRef = useRef(false);
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

  // 박스 툴팁
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
    const v = viewRef.current;
    const cellW = w / (v.xMax - v.xMin);
    const cellH = h / (v.yMax - v.yMin);

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    // 수직
    for (let i = Math.floor(v.xMin); i <= Math.ceil(v.xMax); i++) {
      const x = (i - v.xMin) * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // 수평
    for (let i = Math.floor(v.yMin); i <= Math.ceil(v.yMax); i++) {
      const y = (i - v.yMin) * cellH + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  /** 반응형 처리 */
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

  /** WebGL 렌더링 */
  const renderGL = () => {
    const gl = glRef.current;
    if (!gl || !programRef.current || !bufferRef.current) return;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const a_pos = attribLocRef.current!;
    const u = uniformLocsRef.current;
    const vw = viewRef.current;

    gl.uniform1f(u.u_xMin, vw.xMin);
    gl.uniform1f(u.u_xMax, vw.xMax);
    gl.uniform1f(u.u_yMin, vw.yMin);
    gl.uniform1f(u.u_yMax, vw.yMax);

    const vertices: number[] = [];
    const colors: number[][] = [];

    // 포인터 좌표 & 컬러 계산 (그라데이션)
    pointers.forEach((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);
      const xPos = boxX + p.x / 100;
      const yTop = boxY;
      const yBottom = boxY + 1;

      vertices.push(xPos, yTop, xPos, yBottom);

      // 컬러 그라데이션 (0~100 → 블루~레드)
      const t = Math.min(Math.max(p.x / 100, 0), 1);
      const r = t;
      const g = 0;
      const b = 1 - t;
      colors.push([r, g, b, 1], [r, g, b, 1]);
    });

    if (vertices.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(a_pos);
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

      // 단일 컬러로 표시 (WebGL 1에서 각 라인 색상 적용은 추가 로직 필요)
      gl.uniform4f(u.u_color, 1, 0, 0, 1);
      gl.drawArrays(gl.LINES, 0, vertices.length / 2);
    }

    drawGrid();
  };

  /** 마우스 이벤트 처리 */
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

    const onPointerMove = (ev: PointerEvent) => {
      const vw = viewRef.current;

      if (isPanningRef.current && panStartRef.current) {
        const dx = ev.clientX - panStartRef.current.x;
        const dy = ev.clientY - panStartRef.current.y;
        const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
        const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;
        const nx = (dx / canvas.width) * vwWidth;
        const ny = (dy / canvas.height) * vwHeight;
        viewRef.current = {
          xMin: viewStartRef.current.xMin - nx,
          xMax: viewStartRef.current.xMax - nx,
          yMin: viewStartRef.current.yMin - ny,
          yMax: viewStartRef.current.yMax - ny,
        };
        renderGL();
        return;
      }

      if (isDraggingRef.current && dragStartRef.current) {
        const rect = canvas.getBoundingClientRect();
        dragEndRef.current = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
        drawSelectionRect();
      }

      // 박스 툴팁
      const rect = canvas.getBoundingClientRect();
      const mouseX = ev.clientX - rect.left;
      const mouseY = ev.clientY - rect.top;
      const vwWidth = vw.xMax - vw.xMin;
      const vwHeight = vw.yMax - vw.yMin;
      const cellX = Math.floor(vw.xMin + (mouseX / canvas.width) * vwWidth);
      const cellY = Math.floor(vw.yMin + (mouseY / canvas.height) * vwHeight);

      if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
        setTooltip({ text: `셀(${cellX},${cellY})`, x: ev.clientX, y: ev.clientY });
      } else setTooltip(null);
    };

    const onPointerDown = (ev: PointerEvent) => {
      const vw = viewRef.current;
      const fullX = vw.xMin === 0 && vw.xMax === xBoxCount;
      const fullY = vw.yMin === 0 && vw.yMax === yBoxCount;

      if ((ev.shiftKey || ev.button === 2) && (!fullX || !fullY)) {
        isPanningRef.current = true;
        panStartRef.current = { x: ev.clientX, y: ev.clientY };
        viewStartRef.current = { ...vw };
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
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const vw = viewRef.current;

      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        viewStartRef.current = vw;
        canvas.style.cursor = "default";
        return;
      }

      if (!isDraggingRef.current || !dragStartRef.current || !dragEndRef.current) return;

      const s = dragStartRef.current;
      const e = dragEndRef.current;
      const xMinPx = Math.max(0, Math.min(s.x, e.x));
      const xMaxPx = Math.min(canvasW, Math.max(s.x, e.x));
      const yMinPx = Math.max(0, Math.min(s.y, e.y));
      const yMaxPx = Math.min(canvasH, Math.max(s.y, e.y));

      const worldXMin = vw.xMin + (xMinPx / canvasW) * (vw.xMax - vw.xMin);
      const worldXMax = vw.xMin + (xMaxPx / canvasW) * (vw.xMax - vw.xMin);
      const worldYMin = vw.yMin + (yMinPx / canvasH) * (vw.yMax - vw.yMin);
      const worldYMax = vw.yMin + (yMaxPx / canvasH) * (vw.yMax - vw.yMin);

      // 선택된 포인터 출력
      const selectedPointers = pointers.filter((p) => {
        const boxX = p.boxIndex % xBoxCount;
        const boxY = Math.floor(p.boxIndex / xBoxCount);
        const xPos = boxX + p.x / 100;
        const yTop = boxY;
        const yBottom = boxY + 1;
        return xPos >= worldXMin && xPos <= worldXMax && yBottom > worldYMin && yTop < worldYMax;
      });
      console.log("선택 영역 포인터:", selectedPointers);

      // 뷰 확대
      viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };
      renderGL();

      // 초기화
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("mouseleave", () => setTooltip(null));
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("mouseleave", () => setTooltip(null));
    };
  }, [pointers, xBoxCount, yBoxCount]);

  const handleReset = () => {
    viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
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
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {tooltip.text}
        </div>
      )}
      <button
        onClick={handleReset}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 5,
          padding: "4px 8px",
        }}
      >
        Reset
      </button>
    </div>
  );
};

export default WebGLDetailChart;
