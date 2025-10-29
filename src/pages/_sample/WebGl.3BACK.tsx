// WebGLDetailChart.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { interpolateColor } from "./utils/color";

import './chart.css'

interface HeatMapScatterTpye {
	x_addr_in_mat: number;
	y_addr_in_mat: number;
	value: number;
	box_index: number;
	bnk_id?: number;
	mat_id?: number;
	chanel_id?: number;
	pc_id?: number;
	hex_id?: number;
	x_addr?: number;
	y_addr?: number;
}

interface HeatMapApiType {
	success: boolean;
	meassge: string;
	value_range: {
		min: number;
		max: number;
	}
	colums: string[];
	data: HeatMapScatterTpye[][];
}

interface HeatMapPropsType {
	chartType?: string;
	height?: number;
	valueMin?: number;
	valueMax?: number;
	xBoxCount: number;
	yBoxCount: number;
	pointerSeries: HeatMapScatterTpye[][];
	selectEvent?: (data: HeatMapScatterTpye[][]) => void;
}

// GLSL Vertex Shader
const vertexShaderSource = `
attribute vec2 a_pos;      // 박스 또는 포인터의 좌표 (x, y)
attribute vec3 a_color;    // 각 vertex 색상 (r, g, b)
uniform float u_xMin;      // 현재 view 영역 최소 x
uniform float u_xMax;      // 현재 view 영역 최대 x
uniform float u_yMin;      // 현재 view 영역 최소 y
uniform float u_yMax;      // 현재 view 영역 최대 y
varying vec3 v_color;      // Fragment shader로 전달될 색상

void main() {
  float nx = (a_pos.x - u_xMin) / (u_xMax - u_xMin); // View 좌표를 [0,1]로 정규화
  float ny = (a_pos.y - u_yMin) / (u_yMax - u_yMin); // View 좌표를 [0,1]로 정규화
  float clipX = nx * 2.0 - 1.0;                     // Clip space 변환 [-1,1]
  float clipY = 1.0 - ny * 2.0;                     // Clip space 변환 [-1,1] (Y축 반전)
  gl_Position = vec4(clipX, clipY, 0.0, 1.0);      // 최종 vertex 위치
  v_color = a_color;                                // 색상 전달
}
`;

// GLSL Fragment Shader
const fragmentShaderSource = `
precision mediump float;
varying vec3 v_color;  // Vertex shader에서 전달된 색상
void main() {
  gl_FragColor = vec4(v_color, 1.0); // 픽셀 최종 색상
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
const WebGLDetailChart: React.FC<HeatMapPropsType> = ({
	height = 700,
	xBoxCount,
	yBoxCount,
	pointerSeries,
	valueMin,
	valueMax,
	chartType = "vertical",
}) => {
	// ====== refs ======
	const canvasRef = useRef<HTMLCanvasElement | null>(null); // WebGL 렌더링용 캔버스
	const overlayRef = useRef<HTMLCanvasElement | null>(null); // 2D Grid/드래그 선택 영역용 오버레이 캔버스
	const viewRef = useRef({ xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount }); // 현재 화면에 보이는 영역 좌표
	const isDraggingRef = useRef(false); // 드래그 상태
	const dragStartRef = useRef<{ x: number; y: number } | null>(null); // 드래그 시작 좌표
	const dragEndRef = useRef<{ x: number; y: number } | null>(null); // 드래그 종료 좌표
	const isPanningRef = useRef(false); // 패닝 상태
	const panStartRef = useRef<{ x: number; y: number } | null>(null); // 패닝 시작 좌표
	const viewStartRef = useRef(viewRef.current); // 패닝 시작 시 view 좌표 저장
	const glRef = useRef<WebGLRenderingContext | null>(null); // WebGL 컨텍스트
	const programRef = useRef<WebGLProgram | null>(null); // WebGL 셰이더 프로그램
	const attribLocRef = useRef<{ a_pos: number; a_color: number } | null>(null); // attribute 위치 저장
	const uniformLocsRef = useRef<any>(null); // uniform 위치 저장
	const bufferRef = useRef<WebGLBuffer | null>(null); // vertex buffer
	const lastTooltipRef = useRef<{ cellX: number; cellY: number } | null>(null); // 마지막 툴팁 위치
	const chartTypeRef = useRef(chartType); // chart type 저장 (vertical/horizontal)

	// ====== state ======
	const [tooltip, setTooltip] = useState<{ contents: string; x: number; y: number } | null>(null); // 툴팁 상태
	const [zoomLevel, setZoomLevel] = useState(1); // 현재 zoom level
	const ZOOM_FACTOR = 2; // 확대/축소 배율
	const MIN_ZOOM = 1; // 최소 zoom
	const BOX_COLOR_THRESHOLD = 3; // 박스모드/라인모드 전환 임계값

	// ====== WebGL 초기화 ======
	useEffect(() => {
		const canvas = canvasRef.current; // 캔버스 참조
		if (!canvas) return;
		const gl = canvas.getContext("webgl", { antialias: false }); // WebGL context 생성
		if (!gl) return console.error("WebGL 미지원");
		glRef.current = gl;

		// 셰이더 프로그램
		const program = createProgram(gl, vertexShaderSource, fragmentShaderSource); // 셰이더 프로그램 생성
		programRef.current = program;
		gl.useProgram(program);

		// attribute/uniform 위치 가져오기
		const a_pos = gl.getAttribLocation(program, "a_pos");
		const a_color = gl.getAttribLocation(program, "a_color");
		attribLocRef.current = { a_pos, a_color };
		uniformLocsRef.current = {
			u_xMin: gl.getUniformLocation(program, "u_xMin")!,
			u_xMax: gl.getUniformLocation(program, "u_xMax")!,
			u_yMin: gl.getUniformLocation(program, "u_yMin")!,
			u_yMax: gl.getUniformLocation(program, "u_yMax")!,
		};

		bufferRef.current = gl.createBuffer(); // vertex buffer 생성
		gl.clearColor(0, 0, 0, 0); // 초기 클리어 컬러

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
				resizeCanvasToDisplaySize(canvas, height); // 캔버스 크기 재조정
				glRef.current?.viewport(0, 0, canvas.width, canvas.height); // WebGL viewport 업데이트
				drawGrid(); // Grid 그리기
				renderGL(); // WebGL 렌더링
			});
		});
		ro.observe(canvas.parentElement!); // 부모 요소 크기 감시
		return () => ro.disconnect();
	}, [height]);

	// ====== 화면 초기화 ======
	useEffect(() => {
		chartTypeRef.current = chartType; // chart type 초기화
		viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount }; // view 초기화
		setZoomLevel(MIN_ZOOM); // zoom 초기화
		renderGL(); // 렌더링
	}, [chartType, xBoxCount, yBoxCount]);

	// ====== Grid 그리기 ======
	const drawGrid = () => {
		const overlay = overlayRef.current; // 2D 캔버스 오버레이 참조
		if (!overlay) return;
		const ctx = overlay.getContext("2d")!; // 2D 컨텍스트 가져오기
		const parent = overlay.parentElement!; // 부모 요소 참조
		const dpr = window.devicePixelRatio || 1; // 디바이스 픽셀 비율

		overlay.width = parent.clientWidth * dpr; // 캔버스 실제 픽셀 폭
		overlay.height = parent.clientHeight * dpr; // 캔버스 실제 픽셀 높이
		ctx.setTransform(1, 0, 0, 1, 0, 0); // 트랜스폼 초기화
		ctx.scale(dpr, dpr); // DPR 보정

		const w = parent.clientWidth; // 화면 폭
		const h = parent.clientHeight; // 화면 높이
		const vw = viewRef.current; // 현재 view 영역
		const cellW = w / (vw.xMax - vw.xMin); // cell 가로 폭 계산 (현재 view 기준)
		const cellH = h / (vw.yMax - vw.yMin); // cell 세로 높이 계산 (현재 view 기준)

		ctx.clearRect(0, 0, w, h); // 기존 내용 지우기
		ctx.strokeStyle = "#ccc"; // 선 색상
		ctx.lineWidth = 1; // 선 굵기

		// 세로선 그리기
		for (let i = Math.floor(vw.xMin); i <= Math.ceil(vw.xMax); i++) { // view 영역 안쪽 x index 순회
			const x = (i - vw.xMin) * cellW + 0.5; // 화면 좌표로 변환, 0.5 픽셀 오프셋
			ctx.beginPath();
			ctx.moveTo(x, 0); // 선 시작점
			ctx.lineTo(x, h); // 선 끝점
			ctx.stroke(); // 선 그리기
		}

		// 가로선 그리기
		for (let i = Math.floor(vw.yMin); i <= Math.ceil(vw.yMax); i++) { // view 영역 안쪽 y index 순회
			const y = (i - vw.yMin) * cellH + 0.5; // 화면 좌표로 변환, 0.5 픽셀 오프셋
			ctx.beginPath();
			ctx.moveTo(0, y); // 선 시작점
			ctx.lineTo(w, y); // 선 끝점
			ctx.stroke(); // 선 그리기
		}
	};

	// ====== WebGL 렌더링 ======
	const renderGL = useCallback(() => {
		const gl = glRef.current; // WebGL 컨텍스트 가져오기
		if (!gl || !programRef.current) return;

		gl.clear(gl.COLOR_BUFFER_BIT); // 화면 초기화

		const { a_pos, a_color } = attribLocRef.current!; // attribute 위치
		const u = uniformLocsRef.current; // uniform 위치
		const vw = viewRef.current; // 현재 view 영역

		// 현재 view 영역을 uniform에 전달
		gl.uniform1f(u.u_xMin, vw.xMin);
		gl.uniform1f(u.u_xMax, vw.xMax);
		gl.uniform1f(u.u_yMin, vw.yMin);
		gl.uniform1f(u.u_yMax, vw.yMax);

		const vertices: number[] = []; // vertex 데이터 배열

		// 현재 zoom level 계산 (view 기준)
		const currentZoomX = xBoxCount / (vw.xMax - vw.xMin); // x 방향 확대 비율
		const currentZoomY = yBoxCount / (vw.yMax - vw.yMin); // y 방향 확대 비율
		const currentZoomLevel = Math.min(currentZoomX, currentZoomY); // 최소 비율을 zoom level로 사용

		// 박스 모드: zoom level 임계값 이하일 때 vertical chart만 적용
		if (currentZoomLevel < BOX_COLOR_THRESHOLD && chartTypeRef.current === "vertical") {
			for (let y = Math.floor(vw.yMin); y < Math.ceil(vw.yMax); y++) {
				for (let x = Math.floor(vw.xMin); x < Math.ceil(vw.xMax); x++) {
					const boxPointers = pointerSeries.filter(
						(p: any) => Math.floor(p[3] % xBoxCount) === x && Math.floor(p[3] / xBoxCount) === y
					); // 현재 cell에 해당하는 포인터 데이터
					if (boxPointers.length === 0) continue; // 포인터 없으면 스킵

					// const avgValue = boxPointers.reduce((sum, p) => sum + p.value, 0) / boxPointers.length; // 평균값
					// const t = Math.max(0, Math.min(1, (avgValue - valueMin) / (valueMax - valueMin))); // 0~1로 정규화

					// const r = 0.0 * t + 0.0 * (1 - t); // Red 값 (계산식)
					// const g = 0.8 * (1 - t) + 0.3 * t; // Green 값
					// const b = 1.0 * (1 - t) + 0.6 * t; // Blue 값

					const avgValue = boxPointers.reduce((sum, p: any) => sum + p[2], 0) / boxPointers.length; // 평균값

					const inColor = interpolateColor({
						minValue: valueMin,
						maxValue: valueMax,
						value: avgValue,
						startColor: "#9EE8FF",
						endColor: "#173375",
					});

					const r = inColor.r / 255;
					const g = inColor.g / 255;
					const b = inColor.b / 255;

					// vertex 좌표와 색상 push (4개 vertex로 사각형)
					vertices.push(
						x, y, r, g, b,
						x + 1, y, r, g, b,
						x + 1, y + 1, r, g, b,
						x, y + 1, r, g, b,
					);
				}
			}

			if (vertices.length > 0) {
				const stride = 5 * 4; // vertex stride: x,y,r,g,b
				gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

				gl.enableVertexAttribArray(a_pos);
				gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, stride, 0); // 좌표

				gl.enableVertexAttribArray(a_color);
				gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, stride, 2 * 4); // 색상

				// 사각형 단위로 TRIANGLE_FAN 그리기
				for (let i = 0; i < vertices.length / 5; i += 4) {
					gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
				}
			}
		} else {
			// ==== 포인터 라인 모드 ====
			pointerSeries.forEach((p: any) => {
				const boxX = p[3] % xBoxCount; // 박스 X 좌표
				const boxY = Math.floor(p[3] / xBoxCount); // 박스 Y 좌표

				// view 영역 밖이면 스킵
				if (
					boxX < vw.xMin - 1 || boxX > vw.xMax + 1 ||
					boxY < vw.yMin - 1 || boxY > vw.yMax + 1
				) return;

				// const t = Math.max(0, Math.min(1, (p.value - valueMin) / (valueMax - valueMin))); // 0~1 정규화
				// const r = 0.0 * t + 0.0 * (1 - t); // Red
				// const g = 0.8 * (1 - t) + 0.3 * t; // Green
				// const b = 1.0 * (1 - t) + 0.6 * t; // Blue

				const inColor = interpolateColor({
					minValue: valueMin,
					maxValue: valueMax,
					value: p[2],
					startColor: "#9EE8FF",
					endColor: "#173375",
				});

				const r = inColor.r / 255;
				const g = inColor.g / 255;
				const b = inColor.b / 255;

				// vertical chart일 때 좌표 변환
				if (chartTypeRef.current === "vertical") {
					const xPos = boxX + p[0] / 100; // x 위치 보정
					vertices.push(xPos, boxY, r, g, b);
					vertices.push(xPos, boxY + 1, r, g, b);
				} else {
					const yPos = boxY + p[1] / 100; // horizontal chart 좌표
					vertices.push(boxX, yPos, r, g, b);
					vertices.push(boxX + 1, yPos, r, g, b);
				}
			});

			if (vertices.length > 0) {
				const stride = 5 * 4; // vertex stride
				gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

				gl.enableVertexAttribArray(a_pos);
				gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, stride, 0);

				gl.enableVertexAttribArray(a_color);
				gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, stride, 2 * 4);

				gl.drawArrays(gl.LINES, 0, vertices.length / 5); // 라인 모드
			}
		}

		// console.log(pointerSeries.length);

		drawGrid(); // 2D overlay grid 다시 그리기






	}, [pointerSeries, xBoxCount, yBoxCount, valueMin, valueMax, chartType]);


	// 마우스 위치 계산
	const getMousePos = (ev: PointerEvent) => {
		const canvas = canvasRef.current!; // 캔버스 참조
		const rect = canvas.getBoundingClientRect(); // 캔버스 위치/크기 정보
		return { x: ev.clientX - rect.left, y: ev.clientY - rect.top }; // 캔버스 기준 마우스 좌표 반환
	};

	const xGroup = [
		{
			title: 'A',
			children: [
				{
					title: 'a1',
					children: chartType == "vertical" ? [] : [
						{ title: 'a11' },
						{ title: 'a12' },
						{ title: 'a13' },
					]
				},
				{
					title: 'a2',
					children: chartType == "vertical" ? [] : [
						{ title: 'a21' },
						{ title: 'a22' },
						{ title: 'a23' },
					]
				}
			]
		},
		{
			title: 'B',
			children: [
				{
					title: 'b1',
					children: chartType == "vertical" ? [] : [
						{ title: 'b11' },
						{ title: 'b12' },
						{ title: 'b13' },
					]
				},
				{
					title: 'b2',
					children: chartType == "vertical" ? [] : [
						{ title: 'b21' },
						{ title: 'b22' },
						{ title: 'b23' },
					]
				}
			]
		},
		{
			title: 'C',
			children: [
				{
					title: 'c1',
					children: chartType == "vertical" ? [] : [
						{ title: 'c11' },
						{ title: 'c12' },
						{ title: 'c13' },
					]
				},
				{
					title: 'c2',
					children: chartType == "vertical" ? [] : [
						{ title: 'c21' },
						{ title: 'c22' },
						{ title: 'c23' },
					]
				}
			]
		},
		{
			title: 'D',
			children: [
				{
					title: 'd1',
					children: chartType == "vertical" ? [] : [
						{ title: 'd11' },
						{ title: 'd12' },
						{ title: 'd13' },
					]
				},
				{
					title: 'd2',
					children: chartType == "vertical" ? [] : [
						{ title: 'd21' },
						{ title: 'd22' },
						{ title: 'd23' },
					]
				}
			]
		}
	]

	const yGroup = [
		{ title: 'Y1' },
		{ title: 'Y2' },
		{ title: 'Y3' },
		{ title: 'Y4' },
		{ title: 'Y5' },
		{ title: 'Y6' },
		{ title: 'Y7' },
		{ title: 'Y8' },
		{ title: 'Y9' },
		{ title: 'Y10' },
		{ title: 'Y11' },
		{ title: 'Y12' },
		{ title: 'Y13' },
		{ title: 'Y14' },
		{ title: 'Y15' },
		{ title: 'Y16' }
	]

	// leaf 개수 계산
	const countLeaves = (node: any): number => {
		if (!node.children || node.children.length === 0) return 1;
		return node.children.reduce((sum: number, child: any) => sum + countLeaves(child), 0);
	};

	// 각 leaf index에 그룹 경로 매핑
	const mapLeafToGroupPath = (group: any[]) => {
		const result: string[] = []; // index → 그룹 경로
		let currentIndex = 0;

		const traverse = (nodes: any[], path: string[]) => {
			nodes.forEach((node) => {
				const newPath = [...path, node.title];
				if (!node.children || node.children.length === 0) {
					result[currentIndex] = newPath.join(" > ");
					currentIndex++;
				} else {
					traverse(node.children, newPath);
				}
			});
		};

		traverse(group, []);
		return result;
	};

	const renderGroup = (group: any[]) => {
		return (
			<ul>
				{group.map((item, idx) => (
					<li key={idx}>
						{item.title}
						{item.children && renderGroup(item.children)}
					</li>
				))}
			</ul>
		);
	};

	// 마우스 이벤트 최적화: requestAnimationFrame throttle
	useEffect(() => {
		const canvas = canvasRef.current!;
		const overlay = overlayRef.current!;
		if (!canvas || !overlay) return;

		let rafId: number | null = null; // RAF ID 저장

		// 드래그 선택 영역 그리기
		const drawSelectionRect = () => {
			if (!overlay || !dragStartRef.current || !dragEndRef.current) return;
			const ctx = overlay.getContext("2d")!;
			drawGrid(); // 그리드 먼저 그리기

			const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val)); // 값 clamp

			const s = {
				x: clamp(dragStartRef.current.x, 0, canvas.clientWidth), // 드래그 시작 X
				y: clamp(dragStartRef.current.y, 0, canvas.clientHeight), // 드래그 시작 Y
			};
			const e = {
				x: clamp(dragEndRef.current.x, 0, canvas.clientWidth), // 드래그 끝 X
				y: clamp(dragEndRef.current.y, 0, canvas.clientHeight), // 드래그 끝 Y
			};

			ctx.strokeStyle = "rgba(255,0,0,0.9)"; // 빨간 테두리
			ctx.lineWidth = 2; // 선 굵기
			ctx.setLineDash([6, 4]); // 점선
			ctx.strokeRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y)); // 사각형 테두리

			ctx.fillStyle = "rgba(255,0,0,0.08)"; // 반투명 빨간
			ctx.fillRect(Math.min(s.x, e.x), Math.min(s.y, e.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y)); // 사각형 채우기
		};

		// 마우스 이동 이벤트
		const onPointerMove = (ev: PointerEvent) => {
			const handle = () => {
				const canvas = canvasRef.current!;
				if (!canvas) return;
				const rect = canvas.getBoundingClientRect();
				const mouseX = ev.clientX - rect.left; // 캔버스 기준 X
				const mouseY = ev.clientY - rect.top; // 캔버스 기준 Y

				const vw = viewRef.current; // 현재 view 영역
				const cellW = canvas.clientWidth / (vw.xMax - vw.xMin); // cell 폭
				const cellH = canvas.clientHeight / (vw.yMax - vw.yMin); // cell 높이
				const cellX = Math.floor(vw.xMin + mouseX / cellW); // 현재 cell X
				const cellY = Math.floor(vw.yMin + mouseY / cellH); // 현재 cell Y

				const xLeafPaths = mapLeafToGroupPath(xGroup);
				const xLeafCount = xLeafPaths.length;
				const xPath = xLeafPaths[Math.floor(cellX / (xBoxCount / xLeafCount))];
				const yLeafPaths = mapLeafToGroupPath(yGroup);
				const yLeafCount = yLeafPaths.length;
				const yPath = yLeafPaths[Math.floor(cellY / (yBoxCount / yLeafCount))];

				// 툴팁 표시 범위 체크: 캔버스 내부 + view 영역
				if (
					mouseX >= 0 && mouseY >= 0 &&
					mouseX <= canvas.clientWidth && mouseY <= canvas.clientHeight &&
					cellX >= 0 && cellX < xBoxCount && cellY >= 0 && cellY < yBoxCount
				) {
					const last = lastTooltipRef.current; // 이전 툴팁 기록
					const boxIndex = cellY * xBoxCount + cellX; // 박스 인덱스 계산
					const contents = `
						<div>박스(${boxIndex}) 셀(${cellX}, ${cellY})</div>
						<div>${xPath}</div>
						<div>${yPath}</div>
					`

					setTooltip({ contents: contents, x: ev.clientX, y: ev.clientY }); // 툴팁 표시
					lastTooltipRef.current = { cellX, cellY }; // 업데이트
				} else {
					setTooltip(null); // 범위 밖이면 숨김
					lastTooltipRef.current = null;
				}

				// 드래그 중일 경우
				if (isDraggingRef.current && dragStartRef.current) {
					dragEndRef.current = { x: mouseX, y: mouseY }; // 끝 좌표 업데이트
					drawSelectionRect(); // 사각형 그리기
				}

				// 패닝 중일 경우
				if (isPanningRef.current && panStartRef.current) {
					const dx = mouseX - panStartRef.current.x; // 이동 거리 X
					const dy = mouseY - panStartRef.current.y; // 이동 거리 Y
					const vwWidth = viewStartRef.current.xMax - viewStartRef.current.xMin; // view 폭
					const vwHeight = viewStartRef.current.yMax - viewStartRef.current.yMin; // view 높이
					let newXMin = viewStartRef.current.xMin - dx / canvas.clientWidth * vwWidth; // 새로운 xMin
					let newXMax = viewStartRef.current.xMax - dx / canvas.clientWidth * vwWidth; // 새로운 xMax
					let newYMin = viewStartRef.current.yMin - dy / canvas.clientHeight * vwHeight; // 새로운 yMin
					let newYMax = viewStartRef.current.yMax - dy / canvas.clientHeight * vwHeight; // 새로운 yMax

					// 화면 밖 패닝 제한
					if (newXMin < 0) { newXMin = 0; newXMax = vwWidth; }
					if (newXMax > xBoxCount) { newXMax = xBoxCount; newXMin = xBoxCount - vwWidth; }
					if (newYMin < 0) { newYMin = 0; newYMax = vwHeight; }
					if (newYMax > yBoxCount) { newYMax = yBoxCount; newYMin = yBoxCount - vwHeight; }

					viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax }; // view 업데이트
					renderGL(); // 렌더링 갱신
				}

				rafId = null;
			};

			if (!rafId) rafId = requestAnimationFrame(handle); // RAF throttle
		};

		// 마우스 클릭 이벤트
		const onPointerDown = (ev: PointerEvent) => {
			const vw = viewRef.current; // 현재 view 영역
			const fullX = vw.xMin === 0 && vw.xMax === xBoxCount; // 전체 X 영역인지
			const fullY = vw.yMin === 0 && vw.yMax === yBoxCount; // 전체 Y 영역인지

			// Shift 또는 우클릭으로 패닝 시작
			if ((ev.shiftKey || ev.button === 2) && (!fullX || !fullY)) {
				isPanningRef.current = true; // 패닝 상태
				panStartRef.current = getMousePos(ev); // 시작 좌표
				viewStartRef.current = { ...viewRef.current }; // 초기 view 저장
				canvas.style.cursor = "grab"; // 커서 변경
				return;
			}

			// 왼쪽 클릭이 아니면 종료
			if (ev.button !== 0) return;

			isDraggingRef.current = true; // 드래그 상태
			const pos = getMousePos(ev); // 드래그 시작 좌표
			dragStartRef.current = pos; // 저장
			dragEndRef.current = pos; // 초기 끝 좌표 동일
			drawSelectionRect(); // 선택 사각형 그리기
		};

		// 마우스 클릭 해제 이벤트
		// 추가 기능
		const onPointerUp = (ev: PointerEvent) => {
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

			if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
				const s = dragStartRef.current;
				const e = dragEndRef.current;

				// 드래그 영역이 0이 아닌 경우
				if (s.x !== e.x || s.y !== e.y) {
					const canvasW = canvas.clientWidth;
					const canvasH = canvas.clientHeight;
					const vw = viewRef.current;

					const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
					const x0 = clamp(s.x, 0, canvasW);
					const x1 = clamp(e.x, 0, canvasW);
					const y0 = clamp(s.y, 0, canvasH);
					const y1 = clamp(e.y, 0, canvasH);

					const worldXMin = vw.xMin + Math.min(x0, x1) / canvasW * (vw.xMax - vw.xMin);
					const worldXMax = vw.xMin + Math.max(x0, x1) / canvasW * (vw.xMax - vw.xMin);
					const worldYMin = vw.yMin + Math.min(y0, y1) / canvasH * (vw.yMax - vw.yMin);
					const worldYMax = vw.yMin + Math.max(y0, y1) / canvasH * (vw.yMax - vw.yMin);

					if (ev.ctrlKey) {
						// Ctrl+드래그 → 기존대로 확대
						viewRef.current = { xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax };
						const newZoomX = xBoxCount / (worldXMax - worldXMin);
						const newZoomY = yBoxCount / (worldYMax - worldYMin);
						const newZoomLevel = Math.min(newZoomX, newZoomY);
						setZoomLevel(Math.max(MIN_ZOOM, newZoomLevel));
						logVisiblePointers(); // 전체 view 기준 로그
						renderGL();
					} else {
						// 일반 드래그 → logVisiblePointers 사용 + 선택 영역 필터링
						logVisiblePointers({ xMin: worldXMin, xMax: worldXMax, yMin: worldYMin, yMax: worldYMax });

						// overlay 초기화 후 마지막 사각형 유지
						const ctx = overlay.getContext("2d")!;
						ctx.clearRect(0, 0, overlay.width, overlay.height);
						drawSelectionRect();
					}
				}
			}

			// 드래그 상태 초기화
			isDraggingRef.current = false;
			dragStartRef.current = null;
			dragEndRef.current = null;
		};
		//// 추가 기능



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
	}, [pointerSeries, xBoxCount, yBoxCount, valueMin, valueMax, chartType]);

	// ====== 마우스 캔버스 영역 체크 ======
	useEffect(() => {
		const canvas = canvasRef.current!; // 캔버스 DOM 참조
		if (!canvas) return;

		let isHover = false; // 마우스가 캔버스 위에 있는지 상태

		// 마우스가 캔버스 안으로 들어왔을 때
		const handleMouseEnter = () => {
			isHover = true; // hover 상태 true
		};

		// 마우스가 캔버스 밖으로 나갔을 때
		const handleMouseLeave = () => {
			isHover = false; // hover 상태 false
			setTooltip(null); // 툴팁 제거
			lastTooltipRef.current = null; // 마지막 툴팁 위치 초기화
			if (!isPanningRef.current) canvas.style.cursor = "default"; // 패닝 중 아니면 커서 기본으로
		};

		// 키보드 눌림 이벤트 (Shift로 패닝 가능)
		const handleKeyDown = (ev: KeyboardEvent) => {
			const vw = viewRef.current; // 현재 view 영역
			const fullX = vw.xMin === 0 && vw.xMax === xBoxCount; // 전체 X 영역인지
			const fullY = vw.yMin === 0 && vw.yMax === yBoxCount; // 전체 Y 영역인지

			// 캔버스 위에 있고 Shift 눌렀으며, 전체 view가 아닌 경우
			if (isHover && ev.key === "Shift" && (!fullX || !fullY)) {
				canvas.style.cursor = "grab"; // 커서를 grab으로 변경
			}
		};

		// 키보드 눌림 해제 이벤트
		const handleKeyUp = (ev: KeyboardEvent) => {
			// Shift 키가 떼어지고, 캔버스 hover 상태이며, 패닝 중이 아니면
			if (isHover && ev.key === "Shift" && !isPanningRef.current) {
				canvas.style.cursor = "default"; // 커서 기본으로 변경
			}
		};

		// 이벤트 등록
		canvas.addEventListener("mouseenter", handleMouseEnter); // 마우스 진입
		canvas.addEventListener("mouseleave", handleMouseLeave); // 마우스 이탈
		document.addEventListener("keydown", handleKeyDown); // 키다운 이벤트
		document.addEventListener("keyup", handleKeyUp); // 키업 이벤트

		// cleanup: 컴포넌트 언마운트 시 이벤트 제거
		return () => {
			canvas.removeEventListener("mouseenter", handleMouseEnter);
			canvas.removeEventListener("mouseleave", handleMouseLeave);
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, [xBoxCount, yBoxCount]); // xBoxCount, yBoxCount 변경 시 재실행

	// 추가 기능
	const logVisiblePointers = (area?: { xMin: number; xMax: number; yMin: number; yMax: number }) => {
		const vw = viewRef.current;
		const visible: HeatMapScatterTpye[][] = [];
		const xMin = area?.xMin ?? vw.xMin;
		const xMax = area?.xMax ?? vw.xMax;
		const yMin = area?.yMin ?? vw.yMin;
		const yMax = area?.yMax ?? vw.yMax;

		pointerSeries.forEach((p: any) => {
			const boxX = p[3] % xBoxCount;
			const boxY = Math.floor(p[3] / xBoxCount);

			if (chartTypeRef.current === "vertical") {
				const xPos = boxX + p[0] / 100;
				if (xPos >= xMin && xPos <= xMax && boxY >= yMin && boxY <= yMax) {
					visible.push(p);
				}
			} else {
				const yPos = boxY + p[1] / 100;
				if (boxX >= xMin && boxX <= xMax && yPos >= yMin && yPos <= yMax) {
					visible.push(p);
				}
			}
		});
		console.log("현재 선택 영역 포인터 데이터:", visible);
	};
	//// 추가 기능

	// ====== 마우스 휠로 확대/축소 ======
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleWheel = (ev: WheelEvent) => {

			// 추가 기능
			if (!ev.shiftKey) return;
			//// 추가 기능

			ev.preventDefault(); // 기본 스크롤 막기
			if (ev.deltaY < 0) {
				// 휠 올리면 확대
				handleZoomIn();
			} else {
				if (zoomLevel <= 1) return false;
				// 휠 내리면 축소
				handleZoomOut();
			}

			// 추가 기능
			logVisiblePointers();
			//// 추가 기능
		};

		canvas.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			canvas.removeEventListener("wheel", handleWheel);
		};
	}, [zoomLevel]);


	// ====== 확대 버튼 ======
	const handleZoomIn = () => {
		const vw = viewRef.current; // 현재 view
		const midX = (vw.xMin + vw.xMax) / 2; // X 중심
		const midY = (vw.yMin + vw.yMax) / 2; // Y 중심
		const width = (vw.xMax - vw.xMin) / ZOOM_FACTOR; // 새로운 view 폭
		const height = (vw.yMax - vw.yMin) / ZOOM_FACTOR; // 새로운 view 높이

		let newXMin = midX - width / 2; // view X 시작
		let newXMax = midX + width / 2; // view X 끝
		let newYMin = midY - height / 2; // view Y 시작
		let newYMax = midY + height / 2; // view Y 끝

		viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax }; // view 업데이트
		setZoomLevel(prev => prev * 2); // zoomLevel 증가
		renderGL(); // 렌더링 갱신

		// 추가 기능
		logVisiblePointers();
		//// 추가 기능
	};

	// ====== 축소 버튼 ======
	const handleZoomOut = () => {
		const vw = viewRef.current; // 현재 view
		const fullWidth = xBoxCount; // 전체 X 박스
		const fullHeight = yBoxCount; // 전체 Y 박스

		const midX = (vw.xMin + vw.xMax) / 2; // X 중심
		const midY = (vw.yMin + vw.yMax) / 2; // Y 중심

		let width = (vw.xMax - vw.xMin) * ZOOM_FACTOR; // 새로운 view 폭
		let height = (vw.yMax - vw.yMin) * ZOOM_FACTOR; // 새로운 view 높이

		// 전체 범위를 넘어가면 초기화
		if (width >= fullWidth && height >= fullHeight) {
			viewRef.current = { xMin: 0, xMax: fullWidth, yMin: 0, yMax: fullHeight };
			setZoomLevel(MIN_ZOOM);
			renderGL();
			// 추가 기능
			logVisiblePointers();
			//// 추가 기능
			return;
		}

		if (width > fullWidth) width = fullWidth; // 폭 조정
		if (height > fullHeight) height = fullHeight; // 높이 조정

		const newXMin = Math.max(0, midX - width / 2);
		const newXMax = Math.min(fullWidth, midX + width / 2);
		const newYMin = Math.max(0, midY - height / 2);
		const newYMax = Math.min(fullHeight, midY + height / 2);

		viewRef.current = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };

		const zoomX = fullWidth / (newXMax - newXMin);
		const zoomY = fullHeight / (newYMax - newYMin);
		const newZoomLevel = Math.min(zoomX, zoomY);
		setZoomLevel(Math.max(MIN_ZOOM, newZoomLevel));

		renderGL(); // 렌더링 갱신
		// 추가 기능
		logVisiblePointers();
		//// 추가 기능
	};

	// ====== 화면 초기화 버튼 ======
	const handleReset = () => {
		viewRef.current = { xMin: 0, xMax: xBoxCount, yMin: 0, yMax: yBoxCount }; // 전체 view
		setZoomLevel(MIN_ZOOM); // zoom 초기화
		renderGL(); // 렌더링 갱신
		// 추가 기능
		logVisiblePointers();
		//// 추가 기능
	};




	return (
		<>
			<div style={{ display: "flex", gap: 4 }}>
				<button onClick={() => { handleZoomIn() }}>확대</button>
				<button onClick={() => { handleZoomOut() }}>축소</button>
				<button onClick={() => { handleReset() }}>Reset View</button>
			</div>
			<div>
				{zoomLevel >= BOX_COLOR_THRESHOLD ? "포인터 라인 모드" : "박스 모드"} (zoom: {zoomLevel})
			</div>
			<div className="webgl-chart-wrap">
				<div></div>
				<div className="group-wrap xgroup">{renderGroup(xGroup)}</div>
				<div className="group-wrap ygroup">{renderGroup(yGroup)}</div>
				<div className="chart-wrap">
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
									whiteSpace: 'nowrap'
								}}
								dangerouslySetInnerHTML={{ __html: tooltip.contents }}
							>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default WebGLDetailChart;
