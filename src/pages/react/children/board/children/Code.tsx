import Highlight from "react-highlight";

const pagingHtml = `// @/components/board/PyoPaging.jsx // 페이징
import { useNavigate, useLocation } from "react-router-dom";

// PagingData 타입 정의
export interface PagingData {
	url: string;
	currentPage: number;
	totalPages: number;
	maxPagesToShow: number;
}

interface PyoPagingProps {
	data: PagingData;
}

export const PyoPaging: React.FC<PyoPagingProps> = ({ data }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { url, currentPage, totalPages, maxPagesToShow } = data;

	const handlePageClick = (currentPage: number) => {
		const searchParams = new URLSearchParams(location.search);
		
		// 기존 쿼리 파라미터에 \`page\` 값을 추가하거나 업데이트합니다.
		searchParams.set('pageNo', currentPage.toString());

		// navigate를 사용하여 새로운 URL로 이동합니다. \`depth1=board\`는 그대로 유지됩니다.
		navigate({
			pathname: location.pathname,
			search: searchParams.toString(), // 쿼리 파라미터를 포함한 URL
		});

		// !!! router 구조에 맞게 변경
	};

	const renderPagination = () => {
		const arrowBt: JSX.Element[] = [];
		const pagesBt: JSX.Element[] = [];

		let currentGroup = Math.ceil(currentPage / maxPagesToShow);
		let startPage = (currentGroup - 1) * maxPagesToShow + 1;
		let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

		const addButton = (
			key: string,
			label: string,
			page: number,
			disabled: boolean
		) => {
			let checkKey = ["first", "prev", "next", "last"];
			if (checkKey.includes(key)) {
				arrowBt.push(
					<button
						key={key}
						onClick={() => handlePageClick(page)}
						className={\`arrow \${key}\`}
						disabled={disabled}
					></button>
				);
			} else {
				let activeClass = currentPage === page ? "active" : "";
				pagesBt.push(
					<button
						key={key}
						onClick={() => handlePageClick(page)}
						className={activeClass}
						disabled={disabled}
					>
						{label}
					</button>
				);
			}
		};

		addButton(
			"first",
			"처음",
			1,
			startPage === 1 && currentPage <= maxPagesToShow
		);
		addButton("prev", "이전", currentPage - 1, currentPage <= 1);
		addButton("next", "다음", currentPage + 1, currentPage >= totalPages);
		addButton("last", "마지막", totalPages, endPage === totalPages);

		for (let i = startPage; i <= endPage; i++) {
			addButton(i.toString(), i.toString(), i, false);
		}

		return (
			<div className="pyo-paging">
				{arrowBt[0]}
				{arrowBt[1]}
				<div className="num">{pagesBt}</div>
				{arrowBt[2]}
				{arrowBt[3]}
			</div>
		);
	};

	return <>{renderPagination()}</>;
};
`;

const basicHtml = `// @/components/board/basic/PyoList.jsx // 베이직 스킨
import { useNavigate } from "react-router-dom";
import { PyoAxios } from '@/axios/PyoAxios';
import {HOOK_PYO_POP} from '@/store/hooks/hookPop'
import { getFilter } from '@/utils/getFilter';

// BoardItem 타입 정의
export interface BoardItem {
	id: string;
	subject: string;
	writer: string;
	writtenTime: string;
}

// data 객체의 타입 정의
export interface PyoBoardListData {
	url: string;
	listHeader: Array<{ text: string; class: string }>;
	list: BoardItem[];
	totalPages: number;
}

export const PyoBoardList = ({ data }: { data: PyoBoardListData }) => {
	const { url, listHeader, list } = data;
	const navigate = useNavigate();
	const { setPyoPop } = HOOK_PYO_POP();

	const handleViewClick = async (id: string) => {
		try {
			const res = await PyoAxios({
				method: 'GET',
				url: \`/board_detail.php?viewNo=\${id}\`,
			});
			const resData = res.data.data ? res.data.data : [];
			resData.contents = getFilter.replaceNewlinesWithBr(resData.contents);
			setPyoPop({
				show: true,
				title: resData.subject,
				contents: resData.contents,
			});
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<>
			<table className="pyo-board-basic">
				<thead>
					<tr>
						{listHeader.map((item, index) => (
							<th key={index} className={item.class}>
								{item.text}
							</th>
						))}
					</tr>
					<tr>
						{listHeader.map((item, index) => (
							<th key={index}><span style={{display: 'none'}}>{item.text}</span></th>
						))}
					</tr>
				</thead>
				<tbody>
					{list.map((item, index) => (
						<tr key={index}>
							<td>{item.id}</td>
							<td
								className="subject"
								onClick={() => handleViewClick(item.id)}
							>
								<span>
									{item.subject}{" "}
									--------------------------------------------------
								</span>
							</td>
							<td>{item.writer}</td>
							<td>{item.writtenTime}</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
};
`;

const faqHtml = `// @/components/board/faq/PyoList.jsx // faq 스킨
import { useEffect, useState } from "react";
import { getFilter } from "@/utils/getFilter";

// BoardItem 타입 정의
export interface BoardItem {
	id: string;
	subject: string;
	contents: string;
}

interface PyoBoardListProps {
	data: {
		list: BoardItem[];
	};
}

export const PyoBoardList: React.FC<PyoBoardListProps> = ({ data }) => {
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
		<div className="pyo-board-faq">
			{list.map((list, index) => (
				<div
					className={\`pyo-board-item \${
						showNum[index] ? "active" : ""
					}\`}
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
`;

const basicPageHtml = `// basic 사용법
import { useEffect, useState } from "react";
import { PyoAxios } from "@/axios/PyoAxios";
import {
	PyoBoardList,
	BoardItem,
	PyoBoardListData,
} from "@/components/board/basic/PyoList";
import { PyoPaging, PagingData } from "@/components/board/PyoPaging";

export const 컴포넌트이름 = () => {
	// const boardUrl = "/pyo-dev/react/board/notice";
	const boardUrl = "/react?depth1=board";
	const searchParams = new URLSearchParams(location.search);
	const currentPage = searchParams.get("pageNo") ? parseInt(searchParams.get("pageNo")!) : 1;
	const [list, setList] = useState<BoardItem[]>([]);
	const [totalPages, setTotalPages] = useState(0);
	const pageRow = 10;
	const maxPagesToShow = 5;

	const listData: PyoBoardListData = {
		url: boardUrl,
		listHeader: [
			{ text: "NO", class: "no" },
			{ text: "제목", class: "subject" },
			{ text: "글쓴이", class: "writer" },
			{ text: "작성일", class: "date" },
		],
		list,
		totalPages,
	};
	const pagingData: PagingData = {
		url: boardUrl,
		currentPage,
		totalPages,
		maxPagesToShow,
	};

	useEffect(() => {
		getList(currentPage);
	}, [currentPage]);

	const getList = async (currentPage: number) => {
		try {
			const res = await PyoAxios({
				method: "GET",
				url: \`/board_list.php?pageNo=\${currentPage}&pageRow=\${pageRow}\`,
			});
			const resData = res.data.data ? res.data.data : [];
			setList(resData);
			setTotalPages(Math.ceil(res.data.totalCount / pageRow));
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<>
			<div className="pyo-panel">
				<PyoBoardList data={listData} />
				<PyoPaging data={pagingData} />
			</div>
		</>
	);
};
`;

const faqPageHtml = `// faq 사용법
import { useEffect, useState } from "react";
import { PyoAxios } from "@/axios/PyoAxios";
import { PyoBoardList, BoardItem } from "@/components/board/faq/PyoList";
import { PyoPaging, PagingData } from "@/components/board/PyoPaging";

export const 컴포넌트이름 = () => {
	// const boardUrl = "/pyo-dev/react/board/faq";
	const boardUrl = "/react?depth1=board";
	const searchParams = new URLSearchParams(location.search);
	const currentPage = searchParams.get("pageNo") ? parseInt(searchParams.get("pageNo")!) : 1;
	const [list, setList] = useState<BoardItem[]>([]);
	const [totalPages, setTotalPages] = useState<number>(0);
	const pageRow = 10;
	const maxPagesToShow = 5;
	

	const listData = {
		url: boardUrl,
		list,
		totalPages,
	};

	const pagingData: PagingData = {
		url: boardUrl,
		currentPage,
		totalPages,
		maxPagesToShow,
	};

	useEffect(() => {
		getList(currentPage);
	}, [currentPage]);

	const getList = async (currentPage: number) => {
		try {
			const res = await PyoAxios({
				method: "GET",
				url: \`/board_list.php?pageNo=\${currentPage}&pageRow=\${pageRow}\`,
			});
			const resData = res.data.data ? res.data.data : [];
			setList(resData);
			setTotalPages(Math.ceil(res.data.totalCount / pageRow));
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className="pyo-panel">
			<PyoBoardList data={listData} />
			<PyoPaging data={pagingData} />
		</div>
	);
};
`;

export const PyoReactBoardCode = () => {
	return (
		<>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{pagingHtml}
				</Highlight>
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{basicHtml}
				</Highlight>
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{faqHtml}
				</Highlight>
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{basicPageHtml}
				</Highlight>
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{faqPageHtml}
				</Highlight>
			</div>
		</>
	);
};
