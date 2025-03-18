import { useEffect, useState } from "react";
import { LmAxios } from "@/axios/LmAxios";
import { LmBoardList, BoardItem } from "@/components/board/faq/LmList";
import { LmPaging, PagingData } from "@/components/board/LmPaging";

export const LmReactBoardFaq = () => {
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
			const res = await LmAxios({
				method: "GET",
				url: `/board_list.php?pageNo=${currentPage}&pageRow=${pageRow}`,
			});
			const resData = res.data.data ? res.data.data : [];
			setList(resData);
			setTotalPages(Math.ceil(res.data.totalCount / pageRow));
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className="lm-panel">
			<LmBoardList data={listData} />
			<LmPaging data={pagingData} />
		</div>
	);
};
