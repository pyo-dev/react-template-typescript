import { useState } from 'react';
import Highlight from 'react-highlight'

const pieHtml = `// Pie Chart 사용법
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type DataItem = {
	name: string;
	value: number;
};

const data: DataItem[] = [
	{ name: "Group A", value: 400 },
	{ name: "Group B", value: 300 },
	{ name: "Group C", value: 300 },
	{ name: "Group D", value: 200 },
];

const COLORS: string[] = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const 컴포넌트이름 = () => {
	return (
		<ResponsiveContainer width="100%" height={500}>
			<PieChart width={400} height={400}>
				<Pie
					data={data}
					innerRadius={'60%'}
					fill="#8884d8"
					dataKey="value"
					label
				>
					{data.map((_, index) => (
						<Cell
							key={\`cell-\${index}\`}
							fill={COLORS[index % COLORS.length]}
						/>
					))}
				</Pie>
				<Tooltip />
			</PieChart>
		</ResponsiveContainer>
	);
};
`
	const barHtml = `// Bar Chart 사용법
import {
	BarChart,
	Bar,
	Rectangle,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

type DataItem = {
	name: string;
	uv: number;
	pv: number;
	amt: number;
}

const data: DataItem[] = [
	{
		name: "Page A",
		uv: 4000,
		pv: 2400,
		amt: 2400,
	},
	{
		name: "Page B",
		uv: 3000,
		pv: 1398,
		amt: 2210,
	},
	{
		name: "Page C",
		uv: 2000,
		pv: 9800,
		amt: 2290,
	},
	{
		name: "Page D",
		uv: 2780,
		pv: 3908,
		amt: 2000,
	},
	{
		name: "Page E",
		uv: 1890,
		pv: 4800,
		amt: 2181,
	},
	{
		name: "Page F",
		uv: 2390,
		pv: 3800,
		amt: 2500,
	},
	{
		name: "Page G",
		uv: 3490,
		pv: 4300,
		amt: 2100,
	},
];

export const 컴포넌트이름 = () => {
	return (
		<ResponsiveContainer width="100%" height={500}>
			<BarChart
				data={data}
				margin={{
					top: 20,
					right: 30,
					left: 20,
					bottom: 5,
				}}
				barSize={20}
			>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="name" />
				<YAxis />
				<Tooltip cursor={{ fill: "red", fillOpacity: 0.5 }} />
				<Bar
					dataKey="pv"
					stackId="a"
					fill="#8884d8"
					activeBar={<Rectangle fill="red" stroke="blue" />}
				/>
				<Bar
					dataKey="uv"
					stackId="a"
					fill="#82ca9d"
					activeBar={<Rectangle fill="blue" stroke="red" />}
				/>
				<Legend />
			</BarChart>
		</ResponsiveContainer>
	);
};
`

	const lineHtml = `// Line Chart 사용법
import { useState, useRef, useEffect } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Label,
} from "recharts";

// 샘플 데이터 타입 정의
type DataItem =  {
	name: string;
	data1: number;
	data2: number;
}

const data: DataItem[] = [
	{ name: "Page A", data1: 100, data2: 400 },
	{ name: "Page B", data1: 400, data2: 200 },
	{ name: "Page C", data1: 100, data2: 500 },
	{ name: "Page D", data1: 700, data2: 100 },
	{ name: "Page E", data1: 200, data2: 500 },
	{ name: "Page F", data1: 100, data2: 700 },
	{ name: "Page G", data1: 800, data2: 700 },
];

// 툴팁 위치 계산을 위한 타입 정의
interface TooltipPosition {
	xPosOver: boolean;
	x: number;
	y: number;
}

// 커스텀 툴팁 컴포넌트
interface CustomTooltipProps {
	active: boolean;
	payload: any[];
	label: string;
	setTooltipSize: React.Dispatch<
		React.SetStateAction<{ width: number; height: number }>
	>;
	tooltipPos: TooltipPosition;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
	active,
	payload,
	label,
	setTooltipSize,
	tooltipPos,
}) => {
	const tooltipRef = useRef<HTMLDivElement | null>(null);

	// 툴팁 크기를 업데이트
	useEffect(() => {
		if (tooltipRef.current) {
			const { offsetWidth: width, offsetHeight: height } =
				tooltipRef.current;
			setTooltipSize({ width, height });
		}
	}, [tooltipRef.current]);

	if (active && payload && payload.length) {
		return (
			<div
				ref={tooltipRef}
				style={{
					padding: "10px",
					background: "rgba(0,0,0,0.9)",
					borderRadius: "10px",
					color: "white",
					whiteSpace: "nowrap",
				}}
			>
				<p className="intro">
					{tooltipPos.xPosOver ? "right" : "left"}
				</p>
				<p className="intro">{label}</p>
				<p className="label">{\`\${payload[0].name} : \${payload[0].value}\`}</p>
				<p className="label">{\`\${payload[1].name} : \${payload[1].value}\`}</p>
				<div
					style={{
						position: "absolute",
						top: "15px",
						right: tooltipPos.xPosOver ? "-10px" : "auto",
						left: !tooltipPos.xPosOver ? "-10px" : "auto",
						width: 0,
						height: 0,
						borderStyle: "solid",
						borderWidth: !tooltipPos.xPosOver
							? "5px 10px 5px 0px"
							: "5px 0px 5px 10px",
						borderColor: !tooltipPos.xPosOver
							? "transparent rgba(0,0,0,0.9) transparent transparent"
							: "transparent transparent transparent rgba(0, 0, 0, 0.9)",
					}}
				></div>
			</div>
		);
	}

	return null;
};

// 차트 컴포넌트
export const 컴포넌트이름 = () => {
	const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({
		xPosOver: false,
		x: 0,
		y: 0,
	});
	const [tooltipSize, setTooltipSize] = useState<{
		width: number;
		height: number;
	}>({ width: 0, height: 0 });
	const chartRef = useRef<HTMLDivElement | null>(null);
	let label1Pos: { x: number; y: number }[] = [];
	let label2Pos: { x: number; y: number }[] = [];

	// 데이터1의 라벨 위치 저장 및 렌더링
	const CustomizedLabel1 = ({
		x,
		y,
		value,
	}: {
		x: number;
		y: number;
		value: number;
	}) => {
		if (label1Pos.length < data.length) label1Pos.push({ x, y });
		return (
			<text
				x={x}
				y={y}
				dy={-4}
				fill="#8884d8"
				fontSize={10}
				textAnchor="middle"
			>
				{value}
			</text>
		);
	};

	// 데이터2의 라벨 위치 저장 및 렌더링
	const CustomizedLabel2 = ({
		x,
		y,
		value,
	}: {
		x: number;
		y: number;
		value: number;
	}) => {
		if (label2Pos.length < data.length) label2Pos.push({ x, y });
		return (
			<text
				x={x}
				y={y}
				dy={-4}
				fill="#82ca9d"
				fontSize={10}
				textAnchor="middle"
			>
				{value}
			</text>
		);
	};

	// 툴팁 위치 계산
	const handleTooltipData = (resData: {
		isTooltipActive?: boolean;
		activeTooltipIndex?: number;
	}) => {
		if (
			resData.isTooltipActive &&
			resData.activeTooltipIndex !== undefined
		) {
			const { activeTooltipIndex } = resData;
			const chartWidth = chartRef.current?.offsetWidth || 0;
			const chartHeight = chartRef.current?.offsetHeight || 0;

			// X축 경계를 고려한 위치 조정
			const xPosOver =
				label1Pos[activeTooltipIndex]?.x + tooltipSize.width >
				chartWidth;
			const x = xPosOver
				? label1Pos[activeTooltipIndex]?.x - tooltipSize.width - 20
				: label1Pos[activeTooltipIndex]?.x + 20;

			// Y축 경계를 고려한 위치 조정
			const y =
				Math.min(
					label1Pos[activeTooltipIndex]?.y,
					label2Pos[activeTooltipIndex]?.y
				) - 20;

			const adjustedY =
				y < 0
					? 10
					: y + tooltipSize.height > chartHeight
					? chartHeight - tooltipSize.height - 10
					: y;

			setTooltipPos({ xPosOver, x, y: adjustedY });
		}
	};

	return (
		<div ref={chartRef} className="w-full">
			<ResponsiveContainer width="100%" height={300}>
				<LineChart
					data={data}
					margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
					onMouseMove={handleTooltipData}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="name" />
					<YAxis />
					<Tooltip
						content={
							<CustomTooltip
								active={
									tooltipPos !== undefined &&
									tooltipPos.x !== 0
								} // 툴팁 활성화 여부
								payload={[]} // 툴팁에 표시할 데이터 (이 부분은 상황에 맞게 처리 필요)
								label="Sample Label" // 라벨 값 설정 (필요한 경우 동적으로 설정)
								setTooltipSize={setTooltipSize}
								tooltipPos={tooltipPos}
							/>
						}
						position={tooltipPos}
					/>
					<Legend />
					<Line
						type="monotone"
						dataKey="data1"
						stroke="#8884d8"
						label={({ x, y, value }) => <CustomizedLabel1 x={x} y={y} value={value} />}
					>
						<Label value="Data 1" position="top" />
					</Line>
					<Line
						type="monotone"
						dataKey="data2"
						stroke="#82ca9d"
						label={({ x, y, value }) => <CustomizedLabel2 x={x} y={y} value={value} />}
					>
						<Label value="Data 2" position="top" />
					</Line>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};
`
export const PyoPluginChartCode = () => {
	const [viewType, setViewType] = useState<string>('pie')

	return (
		<>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<button
					className={`pyo-button color-1 s-s ${
						viewType !== "pie" && "line"
					}`}
					onClick={() => setViewType("pie")}
				>
					Pie Chart
				</button>
				<button
					className={`pyo-button color-1 s-s ${
						viewType !== "bar" && "line"
					}`}
					onClick={() => setViewType("bar")}
				>
					Bar Chart
				</button>
				<button
					className={`pyo-button color-1 s-s ${
						viewType !== "line" && "line"
					}`}
					onClick={() => setViewType("line")}
				>
					Line Chart
				</button>
				{viewType === "pie" && (
					<Highlight className="javascript pyo-panel-code">
						{pieHtml}
					</Highlight>
				)}
				{viewType === "bar" && (
					<Highlight className="javascript pyo-panel-code">
						{barHtml}
					</Highlight>
				)}
				{viewType === "line" && (
					<Highlight className="javascript pyo-panel-code">
						{lineHtml}
					</Highlight>
				)}
			</div>
		</>
	);
};
