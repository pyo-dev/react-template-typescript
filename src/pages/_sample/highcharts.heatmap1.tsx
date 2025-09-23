// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

// Pointer 타입 정의: 각 박스 인덱스, x/y 위치, value 포함
type Pointer = { boxIndex: number; x: number; y: number; value: number };

// props 정의
interface WebGLDetailChartProps {
  height: number;
  xBoxCount: number;
  yBoxCount: number;
  pointers: Pointer[];
}

// Vertex Shader: 좌표를 WebGL 클립좌표로 변환
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

// Fragment Shader: 색상을 uniform으로 받아 픽셀 색상 지정
const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
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

// Canvas 크기 재조정
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

// 최종 컴포넌트
const WebGLDetailChart: React.FC<WebGLDetailChartProps> = ({ height, xBoxCount, yBoxCount, pointers }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  // 뷰포트 범위
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

  // 툴팁 상태
  const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // Canvas 리사이즈 후 다시 그림
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

  // 그리드 그리기
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

  // WebGL 포인터 렌더링
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

    // 포인터 반복
    pointers.forEach((p) => {
      const boxX = p.boxIndex % xBoxCount;
      const boxY = Math.floor(p.boxIndex / xBoxCount);
      const xPos = boxX + p.x / 100;
      const yTop = boxY;
      const yBottom = boxY + 1;
      vertices.push(xPos, yTop, xPos, yBottom);

      // value 기반 색상 비율 계산
      const minValue = 300;  // 예시 최소값
      const maxValue = 2000; // 예시 최대값
      let t = (p.value - minValue) / (maxValue - minValue);
      t = Math.max(0, Math.min(1, t)); // 0~1로 클램프
      colors.push(t);
    });

    if (vertices.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(a_pos);
      gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

      for (let i = 0; i < vertices.length / 2; i += 2) {
        const t = colors[i / 2];

        // 연파랑 → 진파랑
        const r = 0.7 * (1 - t) + 0.0 * t;
        const g = 0.85 * (1 - t) + 0.2 * t;
        const b = 1.0 * (1 - t) + 0.6 * t;
        const a = 1.0;

        gl.uniform4f(u.u_color, r, g, b, a);
        gl.drawArrays(gl.LINES, i, 2);
      }
    }

    drawGrid();
  };

  // 마우스 좌표 변환
  const getMousePos = (ev: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  // 드래그/패닝 이벤트
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

      // 툴팁 계산: 마우스 위치의 셀 좌표 계산
      const cellW = canvas.clientWidth / (vw.xMax - vw.xMin);
      const cellH = canvas.clientHeight / (vw.yMax - vw.yMin);
      const cellX = Math.floor(vw.xMin + mouse.x / cellW);
      const cellY = Math.floor(vw.yMin + mouse.y / cellH);
      const last = lastTooltipRef.current;
      if (!last || last.cellX !== cellX || last.cellY !== cellY) {
        if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
          setTooltip({ text: `셀(${cellX}, ${cellY})`, x: ev.clientX, y: ev.clientY });
        } else {
          setTooltip(null);
        }
        lastTooltipRef.current = { cellX, cellY };
      }

      // 드래그 중일 경우
      if (isDraggingRef.current && dragStartRef.current) {
        dragEndRef.current = mouse;
        drawSelectionRect();
      }

      // 패닝 중일 경우
      if (isPanningRef.current && panStartRef.current) {
        const dx = mouse.x - panStartRef.current.x;
        const dy = mouse.y - panStartRef.current.y;
        const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
        const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;

        let newXMin = viewStartRef.current.xMin - dx / canvas.clientWidth * vwWidth;
        let newXMax = viewStartRef.current.xMax - dx / canvas.clientWidth * vwWidth;
        let newYMin = viewStartRef.current.yMin - dy / canvas.clientHeight * vwHeight;
        let newYMax = viewStartRef.current.yMax - dy / canvas.clientHeight * vwHeight;

        // 패닝 제한
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

      // Shift 또는 우클릭 시 패닝 시작
      if ((ev.shiftKey || ev.button === 2) && (!fullX || !fullY)) {
        isPanningRef.current = true;
        panStartRef.current = getMousePos(ev);
        viewStartRef.current = { ...viewRef.current };
        canvas.style.cursor = "grab";
        return;
      }

      if (ev.button !== 0) return; // 좌클릭만 드래그 허용
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

      // 패닝 종료
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panStartRef.current = null;
        viewStartRef.current = viewRef.current;
        canvas.style.cursor = "default";
      }

      // 드래그 선택 종료
      if (isDraggingRef.current && dragStartRef.current && dragEndRef.current && (dragStartRef.current !== dragEndRef.current)) {
        const canvasW = canvas.clientWidth;
        const canvasH = canvas.clientHeight;
        const vw = viewRef.current;
        const s = dragStartRef.current;
        const e = dragEndRef.current;

        const worldXMin = vw.xMin + Math.min(s.x, e.x) / canvasW * (vw.xMax - vw.xMin);
        const worldXMax = vw.xMin + Math.max(s.x, e.x) / canvasW * (vw.xMax - vw.xMin);
        const worldYMin = vw.yMin + Math.min(s.y, e.y) / canvasH * (vw.yMax - vw.yMin);
        const worldYMax = vw.yMin + Math.max(s.y, e.y) / canvasH * (vw.yMax - vw.yMin);

        // 선택된 포인터
        const selectedPointers = pointers.filter(p => {
          const boxX = p.boxIndex % xBoxCount;
          const boxY = Math.floor(p.boxIndex / xBoxCount);
          const xPos = boxX + p.x / 100;
          const yTop = boxY;
          const yBottom = boxY + 1;
          return xPos >= worldXMin && xPos <= worldXMax && yBottom > worldYMin && yTop < worldYMax;
        });
        console.log("선택 포인터:", selectedPointers);

        // 뷰 확대
        viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };
      }

      // 드래그/패닝 초기화
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;

      // 오버레이 초기화
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
  }, [pointers, xBoxCount, yBoxCount]);

  // 뷰 리셋
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
            fontSize: 12,
            borderRadius: 3,
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {tooltip.text}
        </div>
      )}
      <button
        style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}
        onClick={handleReset}
      >
        Reset View
      </button>
    </div>
  );
};

export default WebGLDetailChart;
