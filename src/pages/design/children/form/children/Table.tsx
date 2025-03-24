import {HOOK_PYO_TOAST_POP} from '@/store/hooks/hookToastPop';
import { getEvent } from "@/utils/getEvent";

export const FormTable = () => {
	const { setPyoToastPop } = HOOK_PYO_TOAST_POP();

	let tableHtml = `
<table className="pyo-board-basic">
	<thead>
		<tr>
			<th class="no">NO</th>
			<th class="subject">제목</th>
			<th class="writer">글쓴이</th>
			<th class="date">작성일</th>
		</tr>
		<tr>
			<th></th>
			<th></th>
			<th></th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>1</td>
			<td class="subject">
				<span>
					제목 -- 1
					--------------------------------------------------
				</span>
			</td>
			<td>홍길동1</td>
			<td>2024-12-12</td>
		</tr>
		<tr>
			<td>1</td>
			<td class="subject">
				<span>
					제목 -- 1
					--------------------------------------------------
				</span>
			</td>
			<td>홍길동1</td>
			<td>2024-12-12</td>
		</tr>
	</tbody>
</table>
`
	let pagingHtml =
`<div class="pyo-paging">
	<button class="arrow first" disabled></button>
	<button class="arrow prev" disabled></button>
	<div class="num">
		<button class="active">1</button>
		<button>2</button>
		<button>3</button>
		<button>4</button>
		<button>5</button>
	</div>
	<button class="arrow next"></button>
	<button class="arrow last"></button>
</div>`;

	let countHtml = [
`<div class="pyo-count-wrap s-s">
	<button class="minus"></button>
	<input type="text" value="1" readOnly />
	<button class="plus"></button>
</div>`,
`<div class="pyo-count-wrap">
	<button class="minus"></button>
	<input type="text" value="1" readOnly />
	<button class="plus"></button>
</div>`,
	];


	const copyHtml = () => {
		getEvent.copyText(tableHtml);
		setPyoToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'pyo-board-basic 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	const copyPaging = () => {
		getEvent.copyText(pagingHtml);
		setPyoToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'pyo-paging 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};
	
	const copyCount = (index: number) => {
		getEvent.copyText(countHtml[index]);
		setPyoToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'pyo-count-wrap 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	return (
		<>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">Table</div>
				<table className="pyo-board-basic" onClick={() => copyHtml()}>
					<thead>
						<tr>
							<th className="no">NO</th>
							<th className="subject">제목</th>
							<th className="writer">글쓴이</th>
							<th className="date">작성일</th>
						</tr>
						<tr>
							<th></th>
							<th></th>
							<th></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{Array.from({ length: 10 }).map((_, index) => (
							<tr key={index}>
								<td>{index + 1}</td>
								<td className="subject">
									<span>
										제목 -- {index + 1}
										--------------------------------------------------
									</span>
								</td>
								<td>홍길동1</td>
								<td>2024-12-12</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">Paging</div>
				<div className="pyo-paging w-full" onClick={() => copyPaging()}>
					<button className="arrow first" disabled></button>
					<button className="arrow prev" disabled></button>
					<div className="num">
						<button className="active">1</button>
						<button>2</button>
						<button>3</button>
						<button>4</button>
						<button>5</button>
					</div>
					<button className="arrow next"></button>
					<button className="arrow last"></button>
				</div>
			</div>

			<div className="pyo-panel pyo-panel-flex-wrap">
				<div className="pyo-panel-inner-title">Count</div>
				<div className="pyo-count-wrap s-s" onClick={() => copyCount(0)}>
					<button className="minus"></button>
					<input type="text" defaultValue="1" readOnly />
					<button className="plus"></button>
				</div>
				<div className="pyo-count-wrap" onClick={() => copyCount(1)}>
					<button className="minus"></button>
					<input type="text" defaultValue="1" readOnly />
					<button className="plus"></button>
				</div>
			</div>
		</>
	);
};
