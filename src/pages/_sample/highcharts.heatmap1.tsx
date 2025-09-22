// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

// Pointer 정보 타입 정의 (박스 인덱스, 박스 내부 x 위치, y는 필요시 확장 가능)
type Pointer = { boxIndex: number; x: number; y: number };

// 컴포넌트 props
interface WebGLDetailChartProps {
  height: number;       // 캔버스 높이
  xBoxCount: number;    // x축 박스 수
  yBoxCount: number;    // y축 박스 수
  pointers: Pointer[];  // 포인터 데이터
}

/* 
  Vertex Shader: 
  - 화면 좌표를 WebGL clip space(-1~1)로 변환
  - 포인터 색상을 attribute로 받아 varying으로 fragment shader 전달
*/
const vertexShaderSource = `
  attribute vec2 a_pos;
  attribute vec4 a_color;
  varying vec4 v_color;
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
    v_color = a_color; // 포인터 색상 전달
  }
`;

/* Fragment Shader:
  - Vertex shader에서 전달된 색상 그대로 출력
*/
const fragmentShaderSource = `
  precision mediump float;
  varying vec4 v_color;
  void main() {
    gl_FragColor = v_color;
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

// Program 생성 (vertex + fragment shader)
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

// 캔버스를 부모 크기에 맞게 조절
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

// WebGLDetailChart 컴포넌트
const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({ height, xBoxCount, yBoxCount, pointers }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);      // WebGL 캔버스
  const overlayRef = useRef<HTMLCanvasElement | null>(null);     // 2D grid, 툴팁용 오버레이 캔버스

  // 뷰 영역 (zoom/pan)
  const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });
  const isDraggingRef = useRef(false);                             // 드래그 중인지
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);                              // 패닝 중인지
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewStartRef = useRef(viewRef.current);                    // 패닝 시작 뷰

  // WebGL 관련 ref
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const attribLocRef = useRef<{ pos: number; color: number } | null>(null);
  const uniformLocsRef = useRef<any>(null);

  const bufferRef = useRef<WebGLBuffer | null>(null);             // vertex buffer
  const colorBufferRef = useRef<WebGLBuffer | null>(null);        // color buffer

  // Tooltip
  const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // 초기 WebGL 셋업
  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) return console.error("WebGL 미지원");
    glRef.current = gl;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    programRef.current = program;
    gl.useProgram(program);

    // attribute / uniform 위치 저장
    const a_pos = gl.getAttribLocation(program, "a_pos");
    const a_color = gl.getAttribLocation(program, "a_color");
    attribLocRef.current = { pos: a_pos, color: a_color };
    uniformLocsRef.current = {
      u_xMin: gl.getUniformLocation(program, "u_xMin"),
      u_xMax: gl.getUniformLocation(program, "u_xMax"),
      u_yMin: gl.getUniformLocation(program, "u_yMin"),
      u_yMax: gl.getUniformLocation(program, "u_yMax")
    };

    bufferRef.current = gl.createBuffer();
    colorBufferRef.current = gl.createBuffer();

    resizeCanvasToDisplaySize(canvas, height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);

    renderGL();
  }, [height]);

  // Grid 드로잉
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

    // 세로 선
    for (let i = Math.floor(v.xMin); i <= Math.ceil(v.xMax); i++) {
      const x = (i - v.xMin) * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // 가로 선
    for (let i = Math.floor(v.yMin); i <= Math.ceil(v.yMax); i++) {
      const y = (i - v.yMin) * cellH + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  // 반응형 처리 (ResizeObserver)
  useEffect(() => {
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current;
    if (!overlay || !canvas) return;

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

  // WebGL 렌더링
  const renderGL = () => {
    const gl = glRef.current;
    if (!gl || !programRef.current || !attribLocRef.current) return;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const a = attribLocRef.current;
    const u = uniformLocsRef.current;
    const vw = viewRef.current;

    gl.uniform1f(u.u_xMin, vw.xMin);
    gl.uniform1f(u.u_xMax, vw.xMax);
    gl.uniform1f(u.u_yMin, vw.yMin);
    gl.uniform1f(u.u_yMax, vw.yMax);

    const vertices: number[] = [];
    const colors: number[] = [];

    // 포인터 vertex + 색상 설정 (0~50 블루, 50~100 레드 그라데이션)
    pointers.forEach((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);
      const xPos = boxX + p.x / 100;
      const yTop = boxY;
      const yBottom = boxY + 1;

      // 색상 계산 (블루->레드)
      const t = Math.min(Math.max(p.x / 100, 0), 1);
      const r = t;
      const g = 0;
      const b = 1 - t;

      vertices.push(xPos, yTop, xPos, yBottom);
      colors.push(r, g, b, 1, r, g, b, 1);
    });

    if (vertices.length > 0) {
      // vertex
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(a.pos);
      gl.vertexAttribPointer(a.pos, 2, gl.FLOAT, false, 0, 0);

      // color
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(a.color);
      gl.vertexAttribPointer(a.color, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.LINES, 0, vertices.length / 2);
    }

    drawGrid();
  };

  // TODO: Drag, Pan, Tooltip 이벤트 처리 (기존 코드와 동일하게 적용 가능)

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: `${height}px`, display: "block", border: "1px solid #ddd" }}
      />
      <canvas
        ref={overlayRef}
        style={{ position:"absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        width: "100%",
        height: `${height}px`,
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
          borderRadius: 4,
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        {tooltip.text}
      </div>
    )}
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => {
          // 뷰 초기화
          viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
          renderGL();
        }}
      >
        원상태 복원
      </button>
      <span style={{ marginLeft: 12 }}>Shift+드래그 또는 우클릭 드래그 = 패닝</span>
    </div>
  </div>
  );
};

export default WebGLDetailChart;
