import { useState } from "react";
import { ReactSortable } from "react-sortablejs";

type ChildItem = {
	id: number;
	name: string;
};

type ParentItem = {
	id: number;
	name: string;
	children?: ChildItem[];
};

export const LmPluginSortablePreview = () => {
	const [state, setState] = useState<ParentItem[]>([
		{
			id: 1,
			name: "---11---",
			children: [
				{ id: 1, name: "a" },
				{ id: 2, name: "bb" },
				{ id: 3, name: "ccc" },
			],
		},
		{
			id: 2,
			name: "---22---",
		},
		{
			id: 3,
			name: "---33---",
			children: [
				{ id: 1, name: "a" },
				{ id: 2, name: "bb" },
				{ id: 3, name: "ccc" },
			],
		},
	]);

	const updateChildren = (parentIndex: number, newChildren: ChildItem[]) => {
		const newState = [...state];
		newState[parentIndex].children = newChildren;
		setState(newState);
	};

	return (
		<div className="lm-panel lm-panel-flex-wrap">
			<div className="sort-table-wrap">
				<ReactSortable
					className="sort-table"
					handle=".my-handle"
					list={state}
					setList={setState}
					animation={200}
					delay={2}
				>
					{state.map((item, index) => (
						<div key={item.id}>
							<div className="my-handle">+</div>
							{item.name}
							{item.children && (
								<ReactSortable
									className="sort-table"
									handle=".my-handle"
									list={item.children}
									setList={(newChildren) =>
										updateChildren(index, newChildren)
									}
									animation={200}
									delay={2}
								>
									{item.children.map((child) => (
										<div key={child.id}>
											<div className="my-handle">+</div>
											{child.name}
										</div>
									))}
								</ReactSortable>
							)}
						</div>
					))}
				</ReactSortable>
				<ReactSortable
					className="sort-table"
					handle=".my-handle"
					list={state}
					setList={setState}
					animation={200}
					delay={2}
				>
					{state.map((item) => (
						<div key={item.id}>
							<div className="my-handle">+</div>
							{item.name}
						</div>
					))}
				</ReactSortable>
			</div>
		</div>
	);
};
