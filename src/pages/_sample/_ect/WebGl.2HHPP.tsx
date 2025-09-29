import React, { useState, useEffect } from "react";
import WebGLDetailChart from "./WebGLHeatmapChart1";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

// 관리할 쿼리 파라미터 이름과 기본값을 객체로 정의
const QUERY_PARAMS_DEFAULT = {
	type: "vertical",
	pyo: "",
	jung: "",
	cc: "",
	// 나중에 추가할 파라미터도 여기만 추가하면 됨
};

const ChartPage = () => {
	const navigate = useNavigate();
	const loc = useLocation();

	// URL에서 초기값 읽기
	const searchParams = new URLSearchParams(loc.search);

	const initialParams = Object.fromEntries(
		Object.keys(QUERY_PARAMS_DEFAULT).map((key) => [
			key,
			searchParams.get(key) || QUERY_PARAMS_DEFAULT[key as keyof typeof QUERY_PARAMS_DEFAULT],
		])
	) as typeof QUERY_PARAMS_DEFAULT;

	const [queryParams, setQueryParams] = useState(initialParams);

	// 박스 수는 type에 따라 결정
	const boxCount = queryParams.type === "horizontal" ? { x: 24, y: 160 } : { x: 8, y: 160 };

	// 데이터를 가져오는 함수
	const fetchData = async (params: typeof QUERY_PARAMS_DEFAULT) => {
		// console.log(params);
		// POST로 params 전달
		const url = params.type === "horizontal" ? "/api/data2.json" : "/api/data1.json";
		const { data } = await axios.get(url);
		return data;
	};

	// useQuery, queryKey에 queryParams 넣으면 자동 refetch
	const { data: resData } = useQuery({
		queryKey: ["users", queryParams],
		queryFn: () => fetchData(queryParams),
	});

	// 쿼리 변경 함수
	const handleChangeSearch = (newParams: Partial<typeof QUERY_PARAMS_DEFAULT>) => {
		const updatedParams = { ...queryParams, ...newParams };
		if (newParams.type) {
			updatedParams.pyo = "";
			updatedParams.jung = "";
			updatedParams.cc = "";
		}

		setQueryParams(updatedParams);

		const searchParams = new URLSearchParams();
		Object.entries(updatedParams).forEach(([key, value]) => {
			if (value) searchParams.set(key, value);
		});

		navigate(`${loc.pathname}?${searchParams.toString()}`, { replace: true });
	};

	return (
		<div style={{ padding: "40px" }}>
			<div style={{ marginBottom: 10 }}>
				<button onClick={() => handleChangeSearch({ type: "vertical" })}>Vertical</button>
				<button onClick={() => handleChangeSearch({ type: "horizontal" })}>Horizontal</button>

				<button onClick={() => handleChangeSearch({ pyo: "11" })}>서치 파람1-1</button>
				<button onClick={() => handleChangeSearch({ pyo: "12" })}>서치 파람1-2</button>

				<button onClick={() => handleChangeSearch({ jung: "21" })}>서치 파람2-1</button>
				<button onClick={() => handleChangeSearch({ jung: "22" })}>서치 파람2-2</button>


				<button onClick={() => handleChangeSearch({ cc: "31" })}>서치 파람3-1</button>
				<button onClick={() => handleChangeSearch({ cc: "32" })}>서치 파람3-2</button>
			</div>

			{resData && (
				<WebGLDetailChart
					height={700}
					xBoxCount={boxCount.x}
					yBoxCount={boxCount.y}
					valueMin={resData.value_range.min}
					valueMax={resData.value_range.max}
					pointerSeries={resData.data}
					chartType={queryParams.type}
				/>
			)}
			<div style={{ height: "1000px" }}></div>
		</div>
	);
};

export default ChartPage;
