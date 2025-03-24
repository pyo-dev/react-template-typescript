import { useState } from "react";

import { PropData } from '../types'; // 공통 타입을 import

// Props 인터페이스 정의: 데이터 변경 함수
interface PyoReactDataSub3Props {
	dataChange1: (
		e: React.ChangeEvent<HTMLInputElement>,
		childData?: PropData
	) => void;
	dataChange2: (
		e: React.ChangeEvent<HTMLInputElement>,
		childData?: PropData
	) => void;
}

export const PyoReactDataSub3 = ({
	dataChange1,
	dataChange2,
}: PyoReactDataSub3Props) => {
	// 자식 컴포넌트에서 관리하는 데이터 상태
	const [reqData, setReqData] = useState<PropData[]>([]);

	// 데이터 입력 처리 함수
	const handleChangeData = (
		e: React.ChangeEvent<HTMLInputElement>,
		index: number
	) => {
		const { name, value } = e.target;
		setReqData((prevData) => {
			const updatedData = [...prevData]; // 기존 데이터를 복사하여 불변성을 유지
			updatedData[index] = { ...updatedData[index], [name]: value }; // 해당 인덱스의 데이터 업데이트
			return updatedData;
		});
	};

	// 부모 데이터 변경 함수
	const parentDataChange = (
		e: React.MouseEvent<HTMLButtonElement>,
		index: number
	) => {
		// e는 MouseEvent이며, 실제로 ChangeEvent로 변환할 수 없기 때문에, 이를 ChangeEvent로 처리하는 부분을 수정
		if (index === 0) {
			// ChangeEvent 대신, 전달할 데이터를 처리하고 dataChange1을 호출합니다.
			dataChange1(
				e as unknown as React.ChangeEvent<HTMLInputElement>,
				reqData[0]
			);
		} else if (index === 1) {
			// ChangeEvent 대신, 전달할 데이터를 처리하고 dataChange2를 호출합니다.
			dataChange2(
				e as unknown as React.ChangeEvent<HTMLInputElement>,
				reqData[1]
			);
		}
	};

	return (
		<>
			{/* 첫 번째 데이터 입력 폼 */}
			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">
					자식 컴포넌트3 데이터1
				</div>
				<div className="pyo-panel-flex-wrap">
					<div className="pyo-panel-flex-inner">
						<input
							type="text"
							name="name"
							className="pyo-input"
							value={reqData[0]?.name || ""}
							onChange={(e) => handleChangeData(e, 0)} // 데이터 변경 시 호출되는 함수
							placeholder="데이터1 이름"
						/>
					</div>
					<div className="pyo-panel-flex-inner">
						<input
							type="text"
							name="tell"
							className="pyo-input"
							value={reqData[0]?.tell || ""}
							onChange={(e) => handleChangeData(e, 0)} // 데이터 변경 시 호출되는 함수
							placeholder="데이터1 전화번호"
						/>
					</div>
					<button
						className="pyo-button color-black"
						onClick={(e) => parentDataChange(e, 0)}
					>
						부모 데이터1 변경
					</button>
				</div>
			</div>

			{/* 두 번째 데이터 입력 폼 */}
			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">
					자식 컴포넌트3 데이터2
				</div>
				<div className="pyo-panel-flex-wrap">
					<div className="pyo-panel-flex-inner">
						<input
							type="text"
							name="name"
							className="pyo-input"
							value={reqData[1]?.name || ""}
							onChange={(e) => handleChangeData(e, 1)} // 데이터 변경 시 호출되는 함수
							placeholder="데이터2 이름"
						/>
					</div>
					<div className="pyo-panel-flex-inner">
						<input
							type="text"
							name="tell"
							className="pyo-input"
							value={reqData[1]?.tell || ""}
							onChange={(e) => handleChangeData(e, 1)} // 데이터 변경 시 호출되는 함수
							placeholder="데이터2 전화번호"
						/>
					</div>
					<button
						className="pyo-button color-black"
						onClick={(e) => parentDataChange(e, 1)}
					>
						부모 데이터2 변경
					</button>
				</div>
			</div>
		</>
	);
};
