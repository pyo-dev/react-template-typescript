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

export const LmPluginChartBar = () => {
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
