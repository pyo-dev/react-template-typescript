import { PropData } from '../types'; // 공통 타입을 import

// Props 인터페이스 정의: 자식 컴포넌트에 전달되는 데이터 및 데이터 변경 함수
interface PyoReactDataSub2Props {
	data: PropData; // 부모로부터 전달된 데이터
	dataChange: React.Dispatch<React.SetStateAction<PropData>>; // 부모 상태를 변경하는 함수
}

export const PyoReactDataSub2 = ({
	data,
	dataChange,
}: PyoReactDataSub2Props) => {
	return (
		<div className="pyo-panel pyo-panel-flex-wrap">
			<div className="pyo-panel-inner-title">자식 컴포넌트2 데이터2</div>
			<div className="pyo-panel-flex-inner">
				{/* 입력 필드를 사용해 부모 데이터 변경 */}
				<input
					type="text"
					name="name"
					className="pyo-input"
					value={data.name || ""}
					onChange={(e) =>
						dataChange((prevData) => ({
							...prevData,
							name: e.target.value, // 이름 값 변경
						}))
					}
					placeholder="데이터2 이름"
				/>
			</div>
			<div className="pyo-panel-flex-inner">
				<input
					type="text"
					name="tell"
					className="pyo-input"
					value={data.tell || ""}
					onChange={(e) =>
						dataChange((prevData) => ({
							...prevData,
							tell: e.target.value, // 전화번호 값 변경
						}))
					}
					placeholder="데이터2 전화번호"
				/>
			</div>
			<div className="pyo-panel-flex-inner">
				{/* 부모 데이터 출력 */}
				이름 : {data.name} <br />
				전화번호 : {data.tell}
			</div>
		</div>
	);
};
