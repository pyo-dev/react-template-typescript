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

// 셰이더 컴파일
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

// 캔버스 리사이즈
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
  const BOX_DISPLAY_THRESHOLD = 2; // 이 값 이상 zoomLevel이면 포인터 라인 표시

  // ====== WebGL 초기화 ======
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return console.error("WebGL 미지원");
    glRef.current = gl;

    // 셰이더 프로그램
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    programRef.current = program;
    gl.useProgram(program);

    // attribute / uniform
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

    // 박스 채우기: 초기 확대 정도 이하일 때만
    if (zoomLevel < BOX_DISPLAY_THRESHOLD) {
      pointers.forEach(p => {
        const boxX = p.boxIndex % xBoxCount;
        const boxY = Math.floor(p.boxIndex / xBoxCount);
        if (boxX < vw.xMin || boxX >= vw.xMax || boxY < vw.yMin || boxY >= vw.yMax) return;
        const t = Math.max(0, Math.min(1, (p.value - valueMin) / (valueMax - valueMin)));
        const r = Math.floor(0 * t + 0 * (1 - t) * 255);
        const g = Math.floor(0.8 * (1 - t) + 0.3 * t * 255);
        const b = Math.floor(1.0 * (1 - t) + 0.6 * t * 255);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect((boxX - vw.xMin) * cellW, (boxY - vw.yMin) * cellH, cellW, cellH);
      });
    }

    // 세로선
    for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
      const x = (i - vw.xMin) * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // 가로선
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

    // zoomLevel 이상일 때만 포인터 라인
    if (zoomLevel >= BOX_DISPLAY_THRESHOLD) {
      const vertices: number[] = [];
      const type = chartTypeRef.current;

      pointers.forEach((p) => {
        const boxX = p.boxIndex % xBoxCount;
        const boxY = Math.floor(p.boxIndex / xBoxCount);
        if (boxX < vw.xMin - 1 || boxX > vw.xMax + 1 || boxY < vw.yMin - 1 || boxY > vw.yMax + 1) return;

        const t = Math.max(0, Math.min(1, (p.value - valueMin) / (valueMax - valueMin)));
        const r = 0.0 * t + 0.0 * (1 - t);
        const g = 0.8 * (1 - t) + 0.3 * t;
        const b = 1.0 * (1 - t) + 0.6 * t;

        if (type === "vertical") {
          const xPos = boxX + p.x / 100;
          vertices.push(xPos, boxY, r, g, b);
          vertices.push(xPos, boxY + 1, r, g, b);
        } else {
          const yPos = boxY + p.y / 100;
          vertices.push(boxX, yPos, r, g, b);
          vertices.push(boxX + 1, yPos, r, g, b);
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
    }

    drawGrid();
  }, [pointers, xBoxCount, yBoxCount, valueMin, valueMax, chartType, zoomLevel]);

  // 아래 마우스 드래그 확대, 툴팁, 버튼 로직 등 기존 로직 그대로 적용

  // 생략: 마우스 드래그 이벤트, 툴팁, 확대/축소/리셋 버튼
  // 기존 코드 그대로 유지하면 됩니다. 중요한 변화는 renderGL과 drawGrid에서 zoomLevel 기준으로 표시 모드 분리

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
        <button onClick={() => handleZoomIn()}>확대</button>
        <button onClick={() => handleZoomOut()}>축소</button>
        <button onClick={() => handleReset()}>Reset View</button>
      </div>
    </div>
  );
};

export default WebGLDetailChart;
