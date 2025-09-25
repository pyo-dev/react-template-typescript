// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";

// 포인터 데이터 타입
type Pointer = { boxIndex: number; x: number; y: number; value: number };

// Props 타입
interface WebGLDetailChartProps {
	height: number;
	xBoxCount: number;
	yBoxCount: number;
	pointers: Pointer[];
	valueMin: number;
	valueMax: number;
	chartType?: "vertical" | "horizontal";
}

// ... Vertex/Fragment Shader, compileShader, createProgram, resizeCanvasToDisplaySize 동일 ...

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
	const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
	const [zoomLevel, setZoomLevel] = useState(1);
	const MAX_ZOOM = 5;
	const MIN_ZOOM = 1;

	// renderGL 하나로 통일
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

		pointers.forEach((p) => {
			const boxX = p.boxIndex % xBoxCount;
			const boxY = Math.floor(p.boxIndex / xBoxCount);

			if (boxX < vw.xMin - 1 || boxX > vw.xMax + 1 || boxY < vw.yMin - 1 || boxY > vw.yMax + 1) return;

			const t = Math.max(0, Math.min(1, (p.value - valueMin) / (valueMax - valueMin)));
			const r = 0.0 * t + 0.0 * (1 - t);
			const g = 0.8 * (1 - t) + 0.3 * t;
			const b = 1.0 * (1 - t) + 0.6 * t;

			if (chartType === "vertical") {
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

		// drawGrid는 overlay
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
	}, [pointers, xBoxCount, yBoxCount, valueMin, valueMax, chartType]);

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
		const a_color = gl.getAttribLocation(program, "a_color");
		attribLocRef.current = { a_pos, a_color };

		const u_xMin = gl.getUniformLocation(program, "u_xMin");
		const u_xMax = gl.getUniformLocation(program, "u_xMax");
		const u_yMin = gl.getUniformLocation(program, "u_yMin");
		const u_yMax = gl.getUniformLocation(program, "u_yMax");
		uniformLocsRef.current = { u_xMin, u_xMax, u_yMin, u_yMax };

		bufferRef.current = gl.createBuffer();
		gl.clearColor(0, 0, 0, 0);

		renderGL(); // 초기 렌더

		return () => {
			if (bufferRef.current) gl.deleteBuffer(bufferRef.current);
			if (programRef.current) gl.deleteProgram(programRef.current);
		};
	}, [height, renderGL]);

	// chartType / xBoxCount / yBoxCount 변경 시 초기화
	useEffect(() => {
		viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
		setZoomLevel(MIN_ZOOM);
		renderGL();
	}, [chartType, xBoxCount, yBoxCount, renderGL]);

	const handleReset = () => {
		viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
		setZoomLevel(MIN_ZOOM);
		renderGL();
	};

	// zoom in/out 등 기존 로직 그대로 사용
	// ...

	return (
		<div style={{ width: "100%", position: "relative" }}>
			<canvas ref={canvasRef} style={{ width: "100%", height: `${height}px`, display: "block", border: "1px solid #ddd" }} />
			<canvas ref={overlayRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: `${height}px`, pointerEvents: "none" }} />
			{tooltip && <div style={{ position: "fixed", left: tooltip.x + 10, top: tooltip.y + 10, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 6px", fontSize: 12, borderRadius: 3, pointerEvents: "none", zIndex: 1000 }}>{tooltip.text}</div>}
			<div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", gap: 4 }}>
				<button onClick={() => { /* 확대 로직 */ }}>확대</button>
				<button onClick={() => { /* 축소 로직 */ }}>축소</button>
				<button onClick={handleReset}>Reset View</button>
			</div>
		</div>
	);
};

export default WebGLDetailChart;
