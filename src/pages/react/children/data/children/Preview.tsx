import { useState } from "react";
import { LmReactDataSub1 } from "../children/Sub1";
import { LmReactDataSub2 } from "../children/Sub2";
import { LmReactDataSub3 } from "../children/Sub3";

import { PropData } from "../types"; // 공통 타입을 import

export const LmReactDataPreview = () => {
	// 부모 컴포넌트에서 관리하는 데이터 상태
	const [prposData1, setPrposData1] = useState<PropData>({});
	const [prposData2, setPrposData2] = useState<PropData>({});

	// 데이터 변경 함수 1: 입력값을 부모 상태에 업데이트
	const handleChangeData1 = (
		e: React.ChangeEvent<HTMLInputElement>,
		childData?: PropData
	) => {
		setPrposData1((prevData) => {
			if (childData) {
				return {
					...prevData,
					...Object.fromEntries(
						Object.entries(childData).filter(
							([_, value]) => value !== undefined && value !== ""
						)
					), // 빈 값이 아닌 경우에만 업데이트
				};
			} else if (e) {
				const { name, value } = e.target;
				return {
					...prevData,
					[name]: value, // 기존 데이터에 새로운 입력값 추가
				};
			}
			return prevData;
		});
	};

	// 데이터 변경 함수 2: 입력값을 부모 상태에 업데이트
	const handleChangeData2 = (
		e: React.ChangeEvent<HTMLInputElement>,
		childData?: PropData
	) => {
		setPrposData2((prevData) => {
			if (childData) {
				return {
					...prevData,
					...Object.fromEntries(
						Object.entries(childData).filter(
							([_, value]) => value !== undefined && value !== ""
						)
					), // 빈 값이 아닌 경우에만 업데이트
				};
			} else if (e) {
				const { name, value } = e.target;
				return {
					...prevData,
					[name]: value, // 기존 데이터에 새로운 입력값 추가
				};
			}
			return prevData;
		});
	};

	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-panel-inner-title">
					부모 컴포넌트 데이터1
				</div>
				<div className="lm-panel-flex-inner">
					<input
						type="text"
						name="name"
						className="lm-input"
						value={prposData1.name || ""}
						onChange={handleChangeData1} // 데이터 변경 시 호출되는 함수
						placeholder="데이터1 이름"
					/>
				</div>
				<div className="lm-panel-flex-inner">
					<input
						type="text"
						name="tell"
						className="lm-input"
						value={prposData1.tell || ""}
						onChange={handleChangeData1} // 데이터 변경 시 호출되는 함수
						placeholder="데이터1 전화번호"
					/>
				</div>
				<div className="lm-panel-flex-inner">
					이름 : {prposData1.name} <br />
					전화번호 : {prposData1.tell}
				</div>
			</div>

			{/* 데이터2 입력 폼 */}
			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-panel-inner-title">
					부모 컴포넌트 데이터2
				</div>
				<div className="lm-panel-flex-inner">
					<input
						type="text"
						name="name"
						className="lm-input"
						value={prposData2.name || ""}
						onChange={handleChangeData2} // 데이터 변경 시 호출되는 함수
						placeholder="데이터2 이름"
					/>
				</div>
				<div className="lm-panel-flex-inner">
					<input
						type="text"
						name="tell"
						className="lm-input"
						value={prposData2.tell || ""}
						onChange={handleChangeData2} // 데이터 변경 시 호출되는 함수
						placeholder="데이터2 전화번호"
					/>
				</div>
				<div className="lm-panel-flex-inner">
					이름 : {prposData2.name} <br />
					전화번호 : {prposData2.tell}
				</div>
			</div>

			{/* 자식 컴포넌트들 */}
			<LmReactDataSub1 data={prposData1} />
			<LmReactDataSub2 data={prposData2} dataChange={setPrposData2} />
			<LmReactDataSub3
				dataChange1={handleChangeData1}
				dataChange2={handleChangeData2}
			/>
		</>
	);
};
