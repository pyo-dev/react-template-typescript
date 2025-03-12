import { useEffect, useState } from "react";
import { getFilter } from "@/utils/getFilter";

// BoardItem 타입 정의
export interface BoardItem {
	id: string;
	subject: string;
	contents: string;
}

interface LmBoardListProps {
	data: {
		list: BoardItem[];
	};
}

export const LmBoardList: React.FC<LmBoardListProps> = ({ data }) => {
	const [showNum, setShowNum] = useState<boolean[]>([]);
	const { list } = data;

	const handleViewClick = (index: number) => {
		const updatedShowNum = showNum.map((item, idx) =>
			idx === index ? !item : item
		);
		setShowNum(updatedShowNum);
	};

	useEffect(() => {
		if (list.length > 0) {
			let showArrow = new Array(list.length).fill(false);
			setShowNum(showArrow);
		}
	}, [data]);

	return (
		<div className="lm-board-faq">
			{list.map((list, index) => (
				<div
					className={`lm-board-item ${
						showNum[index] ? "active" : ""
					}`}
					key={index}
					onClick={() => {
						handleViewClick(index);
					}}
				>
					<div>{list.id}</div>
					<div>{list.subject}</div>
					{showNum[index] && (
						<div
							className="contents"
							dangerouslySetInnerHTML={{
								__html: getFilter.replaceNewlinesWithBr(
									list.contents
								),
							}}
						/>
					)}
				</div>
			))}
		</div>
	);
};
