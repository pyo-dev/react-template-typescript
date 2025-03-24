import { useLocation } from "react-router-dom";
import { PyoNavButton } from "@/components/PyoNavButton";
import { PyoPluginChartCode } from "./children/_Code";
import { PyoPluginChartPreview } from "./children/_Preview";

export const PyoPluginChart = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth3: string = params.get('depth3') || 'code';

	return (
		<>
			<div className="pyo-tab">
				{/* 소스 및 미리보기 버튼 */}
				<PyoNavButton to="/react?depth1=plugin&depth2=chart">
					<div className="pyo-icon-pin"></div>소스
				</PyoNavButton>
				<PyoNavButton to="/react?depth1=plugin&depth2=chart&depth3=preview">
					<div className="pyo-icon-pin"></div>미리보기
				</PyoNavButton>
			</div>
			{getDepth3 === 'code' ? (
				<PyoPluginChartCode />
			) : (
				<PyoPluginChartPreview />
			)}
		</>
	);
};
