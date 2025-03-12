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

export const LmPluginChartPie = () => {
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
							key={`cell-${index}`}
							fill={COLORS[index % COLORS.length]}
						/>
					))}
				</Pie>
				<Tooltip />
			</PieChart>
		</ResponsiveContainer>
	);
};
