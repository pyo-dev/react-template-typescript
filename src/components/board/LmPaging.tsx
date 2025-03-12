import { useNavigate, useLocation } from "react-router-dom";

// PagingData 타입 정의
export interface PagingData {
	url: string;
	currentPage: number;
	totalPages: number;
	maxPagesToShow: number;
}

interface LmPagingProps {
	data: PagingData;
}

export const LmPaging: React.FC<LmPagingProps> = ({ data }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { url, currentPage, totalPages, maxPagesToShow } = data;

	const handlePageClick = (currentPage: number) => {
		// navigate(`${url}/${currentPage}`);

		const searchParams = new URLSearchParams(location.search);
		
		// 기존 쿼리 파라미터에 `page` 값을 추가하거나 업데이트합니다.
		searchParams.set('pageNo', currentPage.toString());

		// navigate를 사용하여 새로운 URL로 이동합니다. `depth1=board`는 그대로 유지됩니다.
		navigate({
			pathname: location.pathname,
			search: searchParams.toString(), // 쿼리 파라미터를 포함한 URL
		});
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
						className={`arrow ${key}`}
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
			<div className="lm-paging">
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
