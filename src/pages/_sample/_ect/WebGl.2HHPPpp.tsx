import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChartBar from "./ChartBar";
import ChartPage from "./ChartPage";

const Chart = () => {
    const loc = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(loc.search);
    const child = searchParams.get('child') ? searchParams.get('child') : 'ChartBar';

    const baseUrl = loc.pathname;

    return (
        <>
            <div style={{marginBottom: '30px'}}>
                <button onClick={() => navigate(`${baseUrl}?child=ChartBar`)}>ChartBar</button>
                <button 
                    // 버튼 클릭 시 URL은 /pathname?child=ChartPage 로 초기화됩니다.
                    onClick={() => navigate(`${baseUrl}?child=ChartPage`)}
                >
                    ChartPage
                </button>
            </div>
            
            {/* 💡 핵심: key prop을 사용하여 URL 쿼리가 바뀔 때마다 컴포넌트를 강제로 재생성합니다. */}
            {child === 'ChartBar' && <ChartBar key={loc.search} />}
            {child === 'ChartPage' && <ChartPage key={loc.search} />} 
        </>
    );
};

export default Chart;