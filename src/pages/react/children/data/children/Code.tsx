import Highlight from "react-highlight";

export const PyoReactDataCode = () => {
	const typeHmtl = `// types code
// 공통으로 사용할 PropData 인터페이스 정의
export interface PropData {
	name?: string;
	tell?: string;
}
`
	const parentstHmtl = `// Parents Components
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { PyoNavButton } from "@/components/PyoNavButton";
import { PyoReactDataSub1 } from "./children/Sub1";
import { PyoReactDataSub2 } from "./children/Sub2";
import { PyoReactDataSub3 } from "./children/Sub3";

import { PropData } from './types'; // 공통 타입을 import

export const PyoReactData = () => {

	// 부모 컴포넌트에서 관리하는 데이터 상태
	const [prposData1, setPrposData1] = useState<PropData>({});
	const [prposData2, setPrposData2] = useState<PropData>({});

	// 데이터 변경 함수 1: 입력값을 부모 상태에 업데이트
	const handleChangeData1 = (
		e: React.ChangeEvent<HTMLInputElement>,
		childData?: PropData
	) => {
		const { name, value } = e.target;
		if (!childData) {
			setPrposData1((prevData) => ({
				...prevData,
				[name]: value, // 기존 데이터에 새로운 입력값을 추가
			}));
		} else {
			setPrposData1((prevData) => ({
				...prevData,
				...childData, // 자식 컴포넌트에서 전달된 데이터로 상태 업데이트
			}));
		}
	};

	// 데이터 변경 함수 2: 입력값을 부모 상태에 업데이트
	const handleChangeData2 = (
		e: React.ChangeEvent<HTMLInputElement>,
		childData?: PropData
	) => {
		const { name, value } = e.target;
		if (!childData) {
			setPrposData2((prevData) => ({
				...prevData,
				[name]: value, // 기존 데이터에 새로운 입력값을 추가
			}));
		} else {
			setPrposData2((prevData) => ({
				...prevData,
				...childData, // 자식 컴포넌트에서 전달된 데이터로 상태 업데이트
			}));
		}
	};

	return (
		<>
			{/* 데이터1 입력 폼 */}
			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">
					부모 컴포넌트 데이터1
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						name="name"
						className="pyo-input"
						value={prposData1.name || ""}
						onChange={handleChangeData1} // 데이터 변경 시 호출되는 함수
						placeholder="데이터1 이름"
					/>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						name="tell"
						className="pyo-input"
						value={prposData1.tell || ""}
						onChange={handleChangeData1} // 데이터 변경 시 호출되는 함수
						placeholder="데이터1 전화번호"
					/>
				</div>
				<div className="pyo-panel-flex-inner">
					이름 : {prposData1.name} <br />
					전화번호 : {prposData1.tell}
				</div>
			</div>

			{/* 데이터2 입력 폼 */}
			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">
					부모 컴포넌트 데이터2
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						name="name"
						className="pyo-input"
						value={prposData2.name || ""}
						onChange={handleChangeData2} // 데이터 변경 시 호출되는 함수
						placeholder="데이터2 이름"
					/>
				</div>
				<div className="pyo-panel-flex-inner">
					<input
						type="text"
						name="tell"
						className="pyo-input"
						value={prposData2.tell || ""}
						onChange={handleChangeData2} // 데이터 변경 시 호출되는 함수
						placeholder="데이터2 전화번호"
					/>
				</div>
				<div className="pyo-panel-flex-inner">
					이름 : {prposData2.name} <br />
					전화번호 : {prposData2.tell}
				</div>
			</div>

			{/* 자식 컴포넌트들 */}
			<PyoReactDataSub1 data={prposData1} />
			<PyoReactDataSub2
				data={prposData2}
				dataChange={setPrposData2}
			/>
			<PyoReactDataSub3
				dataChange1={handleChangeData1}
				dataChange2={handleChangeData2}
			/>
		</>
	);
};
`;
	const sub1Html = `// Sub1
import { PropData } from '../types'; // 공통 타입을 import

// Props 인터페이스 정의: 자식 컴포넌트에 전달되는 데이터
interface PyoReactDataSub1Props {
	data: PropData; // 부모로부터 전달된 데이터
}

export const PyoReactDataSub1 = ({
	data,
}: PyoReactDataSub1Props) => {
	return (
		<div className="pyo-panel pyo-panel-flex-wrap">
			<div className="pyo-panel-inner-title">자식 컴포넌트1 데이터1</div>
			<div className="pyo-panel-flex-inner">
				{/* 부모로부터 전달받은 데이터를 출력 */}
				이름 : {data.name} <br />
				전화번호 : {data.tell}
			</div>
		</div>
	);
};
`;

	const sub2Html = `// sub2
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
`;
	const sub3Html = `// sub3
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
`;

	return (
		<>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{typeHmtl}
				</Highlight>
				<Highlight className="javascript pyo-panel-code">
					{parentstHmtl}
				</Highlight>
				<Highlight className="javascript pyo-panel-code">
					{sub1Html}
				</Highlight>
				<Highlight className="javascript pyo-panel-code">
					{sub2Html}
				</Highlight>
				<Highlight className="javascript pyo-panel-code">
					{sub3Html}
				</Highlight>
			</div>
		</>
	);
};
