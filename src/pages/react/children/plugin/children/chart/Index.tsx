import { useLocation } from "react-router-dom";
import { LmNavButton } from "@/components/LmNavButton";
import { LmPluginChartCode } from "./children/_Code";
import { LmPluginChartPreview } from "./children/_Preview";

export const LmPluginChart = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth3: string = params.get('depth3') || 'code';

	return (
		<>
			<div className="lm-tab">
				{/* 소스 및 미리보기 버튼 */}
				<LmNavButton to="/react?depth1=plugin&depth2=chart">
					<div className="lm-icon-pin"></div>소스
				</LmNavButton>
				<LmNavButton to="/react?depth1=plugin&depth2=chart&depth3=preview">
					<div className="lm-icon-pin"></div>미리보기
				</LmNavButton>
			</div>
			{getDepth3 === 'code' ? (
				<LmPluginChartCode />
			) : (
				<LmPluginChartPreview />
			)}
		</>
	);
};
