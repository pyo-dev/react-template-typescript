import { useLocation } from "react-router-dom";
import { PyoNavButton } from "@/components/PyoNavButton";
import { PyoReactDataCode } from "./children/Code";
import { PyoReactDataPreview } from "./children/Preview";

export const PyoReactData = () => {
	// URL 쿼리 파라미터에서 'type' 값 추출
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const getDepth2: string = params.get('depth2') || 'code';


	return (
		<>
			<div className="pyo-tab">
				{/* 소스 및 미리보기 버튼 */}
				<PyoNavButton to="/react?depth1=data">
					<div className="pyo-icon-pin"></div>소스
				</PyoNavButton>
				<PyoNavButton to="/react?depth1=data&depth2=preview">
					<div className="pyo-icon-pin"></div>미리보기
				</PyoNavButton>
			</div>
			{getDepth2 === 'code' ? (
				<PyoReactDataCode />
			) : (
				<PyoReactDataPreview />
			)}
		</>
	);
};
