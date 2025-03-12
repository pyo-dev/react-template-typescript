import { PropData } from '../types'; // 공통 타입을 import

// Props 인터페이스 정의: 자식 컴포넌트에 전달되는 데이터
interface LmReactDataSub1Props {
	data: PropData; // 부모로부터 전달된 데이터
}

export const LmReactDataSub1 = ({
	data,
}: LmReactDataSub1Props) => {
	return (
		<div className="lm-panel lm-panel-flex-wrap">
			<div className="lm-panel-inner-title">자식 컴포넌트1 데이터1</div>
			<div className="lm-panel-flex-inner">
				{/* 부모로부터 전달받은 데이터를 출력 */}
				이름 : {data.name} <br />
				전화번호 : {data.tell}
			</div>
		</div>
	);
};
