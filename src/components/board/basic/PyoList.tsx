import { useNavigate } from "react-router-dom";
import { PyoAxios } from '@/axios/PyoAxios';
import {HOOK_PYO_POP} from '@/store/hooks/hookPop'
import { getFilter } from '@/utils/getFilter';

// BoardItem 타입 정의
export interface BoardItem {
	id: string;
	subject: string;
	writer: string;
	writtenTime: string;
}

// data 객체의 타입 정의
export interface PyoBoardListData {
	url: string;
	listHeader: Array<{ text: string; class: string }>;
	list: BoardItem[];
	totalPages: number;
}

export const PyoBoardList = ({ data }: { data: PyoBoardListData }) => {
	const { url, listHeader, list } = data;
	const navigate = useNavigate();
	const { setPyoPop } = HOOK_PYO_POP();

	const handleViewClick = async (id: string) => {
		// navigate(`${url}/view/${id}`);
		try {
			const res = await PyoAxios({
				method: 'GET',
				url: `/board_detail.php?viewNo=${id}`,
    			headers: { disableLoading: true }, // 로딩 비활성화
			});
			const resData = res.data.data ? res.data.data : [];
			resData.contents = getFilter.replaceNewlinesWithBr(resData.contents);
			setPyoPop({
				show: true,
				title: resData.subject,
				contents: resData.contents,
			});
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<>
			<table className="pyo-board-basic">
				<thead>
					<tr>
						{listHeader.map((item, index) => (
							<th key={index} className={item.class}>
								{item.text}
							</th>
						))}
					</tr>
					<tr>
						{listHeader.map((item, index) => (
							<th key={index}><span style={{display: 'none'}}>{item.text}</span></th>
						))}
					</tr>
				</thead>
				<tbody>
					{list.map((item, index) => (
						<tr key={index}>
							<td>{item.id}</td>
							<td
								className="subject"
								onClick={() => handleViewClick(item.id)}
							>
								<span>
									{item.subject}{" "}
									--------------------------------------------------
								</span>
							</td>
							<td>{item.writer}</td>
							<td>{item.writtenTime}</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
};
