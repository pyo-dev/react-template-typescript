// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState } from "react";

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

// GLSL Fragment Shader
const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
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

// 캔버스 리사이즈 처리
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
	// 캔버스 참조
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const overlayRef = useRef<HTMLCanvasElement | null>(null);

	// 화면 범위
	const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount });

	// 드래그 상태
	const isDraggingRef = useRef(false);
	const dragStartRef = useRef<{ x: number; y: number } | null>(null);
	const dragEndRef = useRef<{ x: number; y: number } | null>(null);

	// 패닝 상태
	const isPanningRef = useRef(false);
	const panStartRef = useRef<{ x: number; y: number } | null>(null);
	const viewStartRef = useRef(viewRef.current);

	// WebGL refs
	const glRef = useRef<WebGLRenderingContext | null>(null);
	const programRef = useRef<WebGLProgram | null>(null);
	const attribLocRef = useRef<number | null>(null);
	const uniformLocsRef = useRef<any>(null);
	const bufferRef = useRef<WebGLBuffer | null>(null);

	// 툴팁
	const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null);
	const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

	// 확대/축소 상태
	const [zoomLevel, setZoomLevel] = useState(1);
	const MAX_ZOOM = 5;
	const MIN_ZOOM = 1;

	// 리사이즈 처리
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

		// 세로 라인
		for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) {
			const x = (i - vw.xMin) * cellW + 0.5;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
		}
		// 가로 라인
		for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) {
			const y = (i - vw.yMin) * cellH + 0.5;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}
	};

	// WebGL 렌더링 (포인터) - 최적화: 화면에 보이는 것만
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

		// 화면에 보이는 포인터만 vertex에 추가 (LOD)
		pointers.forEach((p) => {
			const boxX = p.boxIndex % xBoxCount;
			const boxY = Math.floor(p.boxIndex / xBoxCount);

			// 화면 영역 체크 보이는 영역만 GL vertex 생성
			if (
				boxX < vw.xMin - 1 || boxX > vw.xMax + 1 ||
				boxY < vw.yMin - 1 || boxY > vw.yMax + 1
			) return;

			if (chartType === "vertical") {
				const xPos = boxX + p.x / 100;
				vertices.push(xPos, boxY, xPos, boxY + 1);
			} else {
				const yPos = boxY + p.y / 100;
				vertices.push(boxX, yPos, boxX + 1, yPos);
			}

			const t = Math.max(0, Math.min(1, (p.value - valueMin) / (valueMax - valueMin)));
			colors.push(t);
		});

		if (vertices.length > 0) {
			// 매 프레임마다 새 버퍼 생성 없이 동일 buffer 재사용.
			gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(a_pos);
			gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

			for (let i = 0; i < vertices.length / 2; i += 2) {
				const t = colors[i / 2];
				const r = 0.0 * t + 0.0 * (1 - t);
				const g = 0.8 * (1 - t) + 0.3 * t;
				const b = 1.0 * (1 - t) + 0.6 * t;
				gl.uniform4f(u.u_color, r, g, b, 1.0);
				gl.drawArrays(gl.LINES, i, 2);
			}
		}

		drawGrid(); // 오버레이 그리드
	};

	// 마우스 위치 계산
	const getMousePos = (ev: PointerEvent) => {
		const canvas = canvasRef.current!;
		const rect = canvas.getBoundingClientRect();
		return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
	};

	// 마우스 이벤트 최적화: requestAnimationFrame throttle
	useEffect(() => {
		const canvas = canvasRef.current!;
		const overlay = overlayRef.current!;
		if (!canvas || !overlay) return;

		let rafId: number | null = null;

		const drawSelectionRect = () => {
			if (!overlay || !dragStartRef.current || !dragEndRef.current) return;
			const ctx = overlay.getContext("2d")!;
			drawGrid();

			const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
			const s = {
				x: clamp(dragStartRef.current.x, 0, canvas.clientWidth),
				y: clamp(dragStartRef.current.y, 0, canvas.clientHeight),
			};
			const e = {
				x: clamp(dragEndRef.current.x, 0, canvas.clientWidth),
				y: clamp(dragEndRef.current.y, 0, canvas.clientHeight),
			};

			ctx.strokeStyle = "rgba(255,0,0,0.9)";
			ctx.lineWidth = 2;
			ctx.setLineDash([6, 4]);
			ctx.strokeRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));

			ctx.fillStyle = "rgba(255,0,0,0.08)";
			ctx.fillRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));
		};

		const onPointerMove = (ev: PointerEvent) => {
			const handle = () => {
				const canvas = canvasRef.current!;
				if (!canvas) return;

				const rect = canvas.getBoundingClientRect();
				const mouseX = ev.clientX - rect.left;
				const mouseY = ev.clientY - rect.top;

				const vw = viewRef.current;
				const cellW = canvas.clientWidth / (vw.xMax - vw.xMin);
				const cellH = canvas.clientHeight / (vw.yMax - vw.yMin);
				const cellX = Math.floor(vw.xMin + mouseX / cellW);
				const cellY = Math.floor(vw.yMin + mouseY / cellH);

				// 툴팁 표시 범위: 캔버스 내부 AND view 범위 내
				if (mouseX >= 0 && mouseY >= 0 && mouseX <= canvas.clientWidth && mouseY <= canvas.clientHeight &&
					cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount) {

					const last = lastTooltipRef.current;
					if (!last || last.cellX !== cellX || last.cellY !== cellY) {
						const boxIndex = cellY * xBoxCount + cellX;
						setTooltip({ text: `박스(${boxIndex}) 셀(${cellX}, ${cellY})`, x: ev.clientX, y: ev.clientY });
						lastTooltipRef.current = { cellX, cellY };
					}
				} else {
					setTooltip(null);
					lastTooltipRef.current = null;
				}

				// 드래그 / 패닝 기존 로직
				if (isDraggingRef.current && dragStartRef.current) {
					dragEndRef.current = { x: mouseX, y: mouseY };
					drawSelectionRect();
				}
				if (isPanningRef.current && panStartRef.current) {
					const dx = mouseX - panStartRef.current.x;
					const dy = mouseY - panStartRef.current.y;
					const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin;
					const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin;
					let newXMin = viewStartRef.current.xMin - dx / canvas.clientWidth * vwWidth;
					let newXMax = viewStartRef.current.xMax - dx / canvas.clientWidth * vwWidth;
					let newYMin = viewStartRef.current.yMin - dy / canvas.clientHeight * vwHeight;
					let newYMax = viewStartRef.current.yMax - dy / canvas.clientHeight * vwHeight;

					// 화면 밖 패닝 제한
					if (newXMin < 0) { newXMin = 0; newXMax = vwWidth; }
					if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = xBoxCount - vwWidth; }
					if (newYMin < 0) { newYMin = 0; newYMax = vwHeight; }
					if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = yBoxCount - vwHeight; }

					viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
					renderGL();
				}

				rafId = null;
			};

			if (!rafId) rafId = requestAnimationFrame(handle);
		};


		const onPointerDown = (ev: PointerEvent) => {
			const vw = viewRef.current;
			const fullX = vw.xMin === 0 && vw.xMax === xBoxCount;
			const fullY = vw.yMin === 0 && vw.yMax === yBoxCount;

			// Shift 또는 우클릭 패닝
			if ((ev.shiftKey || ev.button === 2) && (!fullX || !fullY)) {
				isPanningRef.current = true;
				panStartRef.current = getMousePos(ev);
				viewStartRef.current = { ...viewRef.current };
				canvas.style.cursor = "grab";
				return;
			}

			if (ev.button !== 0) return;
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

			if (isPanningRef.current) {
				isPanningRef.current = false;
				panStartRef.current = null;
				viewStartRef.current = viewRef.current;
				canvas.style.cursor = "default";
			}

			if (
				isDraggingRef.current &&
				dragStartRef.current &&
				dragEndRef.current &&
				(dragStartRef.current.x !== dragEndRef.current.x || dragStartRef.current.y !== dragEndRef.current.y)
			) {
				const s = dragStartRef.current;
				const e = dragEndRef.current;
				const canvasW = canvas.clientWidth;
				const canvasH = canvas.clientHeight;
				const vw = viewRef.current;

				// 드래그 좌표를 캔버스 영역으로 클램핑
				const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
				const x0 = clamp(s.x, 0, canvasW);
				const x1 = clamp(e.x, 0, canvasW);
				const y0 = clamp(s.y, 0, canvasH);
				const y1 = clamp(e.y, 0, canvasH);

				// 클램프된 드래그 영역을 world 좌표로 변환
				const worldXMin = vw.xMin + Math.min(x0, x1) / canvasW * (vw.xMax - vw.xMin);
				const worldXMax = vw.xMin + Math.max(x0, x1) / canvasW * (vw.xMax - vw.xMin);
				const worldYMin = vw.yMin + Math.min(y0, y1) / canvasH * (vw.yMax - vw.yMin);
				const worldYMax = vw.yMin + Math.max(y0, y1) / canvasH * (vw.yMax - vw.yMin);

				// 드래그 영역 내 포인터 데이터를 모아서 로그 출력
				const selectedPointers: Pointer[] = [];
				pointers.forEach(p => {
					const boxX = p.boxIndex % xBoxCount;
					const boxY = Math.floor(p.boxIndex / xBoxCount);
					if (chartType === "vertical") {
						const xPos = boxX + p.x / 100;
						if (xPos >= worldXMin && xPos <= worldXMax && boxY >= worldYMin && boxY <= worldYMax) {
							selectedPointers.push(p);
						}
					} else {
						const yPos = boxY + p.y / 100;
						if (boxX >= worldXMin && boxX <= worldXMax && yPos >= worldYMin && yPos <= worldYMax) {
							selectedPointers.push(p);
						}
					}
				});
				console.log("드래그 영역 내 포인터 데이터:", selectedPointers);

				// 드래그 영역으로 뷰 확대
				viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };

				// 확대 후 zoomLevel 계산: 최소 뷰 기준으로 축소 버튼 활성화/비활성화
				const newZoomX = xBoxCount / (worldXMax - worldXMin);
				const newZoomY = yBoxCount / (worldYMax - worldYMin);
				const newZoomLevel = Math.min(newZoomX, newZoomY);
				setZoomLevel(Math.max(MIN_ZOOM, newZoomLevel));
			}

			// 드래그 상태 초기화
			isDraggingRef.current = false;
			dragStartRef.current = null;
			dragEndRef.current = null;

			// 오버레이 초기화
			const ctx = overlay.getContext("2d")!;
			ctx.clearRect(0, 0, overlay.width, overlay.height);

			// 렌더링 갱신
			renderGL();
		};

		// 이벤트 리스너 등록
		canvas.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("pointermove", onPointerMove);
		document.addEventListener("pointerup", onPointerUp);

		return () => {
			canvas.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("pointermove", onPointerMove);
			document.removeEventListener("pointerup", onPointerUp);
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [pointers, xBoxCount, yBoxCount, valueMin, valueMax, chartType]);

	// 마우스 캔퍼스영역 체크
	useEffect(() => {
		const canvas = canvasRef.current!;
		if (!canvas) return;

		let isHover = false; // 마우스가 캔버스 위에 있는지 상태

		const handleMouseEnter = () => {
			isHover = true;
		};

		const handleMouseLeave = () => {
			isHover = false;
			setTooltip(null);
			lastTooltipRef.current = null;
			if (!isPanningRef.current) canvas.style.cursor = "default";
		};

		const handleKeyDown = (ev: KeyboardEvent) => {
			const vw = viewRef.current;
			const fullX = vw.xMin === 0 && vw.xMax === xBoxCount;
			const fullY = vw.yMin === 0 && vw.yMax === yBoxCount;

			if (isHover && ev.key === "Shift" && (!fullX || !fullY)) {
				canvas.style.cursor = "grab";
			}
		};

		const handleKeyUp = (ev: KeyboardEvent) => {
			if (isHover && ev.key === "Shift" && !isPanningRef.current) {
				canvas.style.cursor = "default";
			}
		};

		canvas.addEventListener("mouseenter", handleMouseEnter);
		canvas.addEventListener("mouseleave", handleMouseLeave);
		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);

		return () => {
			canvas.removeEventListener("mouseenter", handleMouseEnter);
			canvas.removeEventListener("mouseleave", handleMouseLeave);
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, [xBoxCount, yBoxCount]);

	// 확대 버튼 클릭
	const handleZoomIn = () => {
		const vw = viewRef.current;
		const midX = (vw.xMin + vw.xMax) / 2;
		const midY = (vw.yMin + vw.yMax) / 2;
		const width = (vw.xMax - vw.xMin) / 2;
		const height = (vw.yMax - vw.yMin) / 2;

		let newXMin = midX - width / 2;
		let newXMax = midX + width / 2;
		let newYMin = midY - height / 2;
		let newYMax = midY + height / 2;

		viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
		setZoomLevel(prev => Math.min(MAX_ZOOM, prev * 2));
		renderGL();
	};

	// 축소 버튼 클릭
	const handleZoomOut = () => {
		const vw = viewRef.current;
		const fullWidth = xBoxCount;
		const fullHeight = yBoxCount;

		const midX = (vw.xMin + vw.xMax) / 2;
		const midY = (vw.yMin + vw.yMax) / 2;

		let width = (vw.xMax - vw.xMin) * 1.5;
		let height = (vw.yMax - vw.yMin) * 1.5;

		if (width >= fullWidth && height >= fullHeight) {
			viewRef.current = { xMin: 0, xMax: fullWidth, yMin: 0, yMax: fullHeight };
			setZoomLevel(MIN_ZOOM);
			renderGL();
			return;
		}

		if (width > fullWidth) width = fullWidth;
		if (height > fullHeight) height = fullHeight;

		const newXMin = Math.max(0, midX - width / 2);
		const newXMax = Math.min(fullWidth, midX + width / 2);
		const newYMin = Math.max(0, midY - height / 2);
		const newYMax = Math.min(fullHeight, midY + height / 2);

		viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };

		const zoomX = fullWidth / (newXMax - newXMin);
		const zoomY = fullHeight / (newYMax - newYMin);
		const newZoomLevel = Math.min(zoomX, zoomY);
		setZoomLevel(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoomLevel)));

		renderGL();
	};

	// 화면 초기화
	const handleReset = () => {
		viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount };
		setZoomLevel(MIN_ZOOM);
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
			<div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", gap: 4 }}>
				<button onClick={handleZoomIn}>확대</button>
				<button onClick={handleZoomOut} disabled={zoomLevel <= MIN_ZOOM}>축소</button>
				<button onClick={handleReset}>Reset View</button>
			</div>
		</div>
	);
};

export default WebGLDetailChart;
