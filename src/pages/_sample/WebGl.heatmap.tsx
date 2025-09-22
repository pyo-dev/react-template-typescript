// WebGLDetailChart.tsx (최적화 버전)
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

	const bufferBlueRef = useRef<WebGLBuffer | null>(null);
	const bufferRedRef = useRef<WebGLBuffer | null>(null);

	const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
	const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

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

		bufferBlueRef.current = gl.createBuffer();
		bufferRedRef.current = gl.createBuffer();

		resizeCanvasToDisplaySize(canvas, height);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0.98, 0.98, 0.98, 1.0);

		renderGL();

		return () => {
			gl.clear(gl.COLOR_BUFFER_BIT);
		};
	}, [height]);

	const drawGrid = () => {
		const overlay = overlayRef.current;
		if (!overlay) return;
		const ctx = overlay.getContext("2d")!;

		const parent = overlay.parentElement!;
		const dpr = window.devicePixelRatio || 1;

		overlay.width = parent.clientWidth * dpr;
		overlay.height = parent.clientHeight * dpr;
		ctx.setTransform(1, 0, 0, 1, 0, 0); // transform 초기화
		ctx.scale(dpr, dpr); // pixel ratio 적용

		const w = parent.clientWidth;
		const h = parent.clientHeight;
		const v = viewRef.current;
		const cellW = w / (v.xMax - v.xMin);
		const cellH = h / (v.yMax - v.yMin);

		ctx.clearRect(0, 0, w, h);

		ctx.strokeStyle = "#ccc";
		ctx.lineWidth = 1;

		// vertical
		for (let i = Math.floor(v.xMin); i <= Math.ceil(v.xMax); i++) {
			const x = (i - v.xMin) * cellW + 0.5; // 0.5px 보정
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
		}
		// horizontal
		for (let i = Math.floor(v.yMin); i <= Math.ceil(v.yMax); i++) {
			const y = (i - v.yMin) * cellH + 0.5; // 0.5px 보정
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}
	};

	useEffect(() => {
		const overlay = overlayRef.current;
		const canvas = canvasRef.current;
		if (!overlay || !canvas) return;

		const ro = new ResizeObserver(() => {
			requestAnimationFrame(() => {
				overlay.width = canvas.parentElement!.clientWidth;
				overlay.height = height;
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

		const verticesBlue: number[] = [];
		const verticesRed: number[] = [];

		pointers.forEach((p) => {
			const boxX = p.boxIndex % xBoxCount;
			const boxY = Math.floor(p.boxIndex / xBoxCount);
			const xPos = boxX + p.x / 100;
			const yTop = boxY;
			const yBottom = boxY + 1;

			if (p.x > 50) verticesRed.push(xPos, yTop, xPos, yBottom);
			else verticesBlue.push(xPos, yTop, xPos, yBottom);
		});

		// Blue
		if (verticesBlue.length > 0) {
			gl.bindBuffer(gl.ARRAY_BUFFER, bufferBlueRef.current);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesBlue), gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(a_pos);
			gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);
			gl.uniform4f(u.u_color, 0, 0, 1, 1);
			gl.drawArrays(gl.LINES, 0, verticesBlue.length / 2);
		}

		// Red
		if (verticesRed.length > 0) {
			gl.bindBuffer(gl.ARRAY_BUFFER, bufferRedRef.current);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesRed), gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(a_pos);
			gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);
			gl.uniform4f(u.u_color, 1, 0, 0, 1);
			gl.drawArrays(gl.LINES, 0, verticesRed.length / 2);
		}

		drawGrid(); // 확대/축소 후 그리드 항상 마지막에
	};


	// Pointer 이벤트 처리 (기존 로직 그대로)
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
				let newXMin = viewStartRef.current.xMin - nx;
				let newXMax = viewStartRef.current.xMax - nx;
				let newYMin = viewStartRef.current.yMin - ny;
				let newYMax = viewStartRef.current.yMax - ny;
				if (newXMin < 0) { newXMin = 0; newXMax = vwWidth; }
				if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = xBoxCount - vwWidth; }
				if (newYMin < 0) { newYMin = 0; newYMax = vwHeight; }
				if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = yBoxCount - vwHeight; }
				viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
				renderGL();
				return;
			}

			if (isDraggingRef.current && dragStartRef.current) {
				const rect = canvas.getBoundingClientRect();
				dragEndRef.current = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
				drawSelectionRect();
			}

			// Tooltip 최소화
			const rect = canvas.getBoundingClientRect();
			const mouseX = ev.clientX - rect.left;
			const mouseY = ev.clientY - rect.top;
			const cellW = overlay.width / (vw.xMax - vw.xMin);
			const cellH = overlay.height / (vw.yMax - vw.yMin);
			const cellX = Math.floor(vw.xMin + mouseX / cellW);
			const cellY = Math.floor(vw.yMin + mouseY / cellH);

			const last = lastTooltipRef.current;
			if (!last || last.cellX !== cellX || last.cellY !== cellY) {
				if (cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {
					setTooltip({ text: `셀(${cellX}, ${cellY}), 인덱스: ${cellY * xBoxCount + cellX}`, x: ev.clientX, y: ev.clientY });
				} else {
					setTooltip(null);
				}
				lastTooltipRef.current = { cellX, cellY };
			}
		};

		const onPointerDown = (ev: PointerEvent) => {
			const vw = viewRef.current;
			const fullX = vw.xMin === 0 && vw.xMax === xBoxCount;
			const fullY = vw.yMin === 0 && vw.yMax === yBoxCount;

			if ((ev.shiftKey || ev.button === 2) && (!fullX || !fullY)) {
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
			if (isPanningRef.current) {
				isPanningRef.current = false;
				panStartRef.current = null;
				viewStartRef.current = viewRef.current;
				canvas.style.cursor = "default";
				return;
			}

			if (!isDraggingRef.current || !dragStartRef.current || !dragEndRef.current) return;

			const s = dragStartRef.current;
			const e = dragEndRef.current;
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

			// 선택 포인터 확인
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
			renderGL(); // 확대 후 그리드 갱신

			// 드래그 초기화
			isDraggingRef.current = false;
			dragStartRef.current = null;
			dragEndRef.current = null; // 사각형 사라지도록
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
				<button onClick={handleReset}>원상태 복원</button>
				<span style={{ marginLeft: 12 }}>Shift+드래그 또는 우클릭 드래그 = 패닝</span>
			</div>
		</div>
	);
};

export default WebGLDetailChart;


