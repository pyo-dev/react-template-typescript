import { useState } from 'react';
import {HOOK_LM_TOAST_POP} from '@/store/hooks/hookToastPop';
import { getEvent } from "@/utils/getEvent";

export const LmDesignPopup = () => {
	const { setLmToastPop } = HOOK_LM_TOAST_POP();
	const [popShow, setPopShow] = useState<boolean>(true);

	const popHtml = 
`<div class="lm-pop">
	<div class="lm-pop-inner show">
		<div class="lm-pop-container">
			<div class="lm-pop-title">Title</div>
			<div class="lm-pop-contents">
				<div style="text-align: center">주제나 내용의 일부를 요약해<br>간략하게 보여주는 영역</div>
			</div>
			<div class="lm-pop-bt-wrap ">
				<button class="lm-pop-bt-cancle">취소</button>
				<button class="lm-pop-bt-success">확인</button>
			</div>
		</div>
	</div>
</div>`;

	const toastPopHtml = [
`<div class="lm-pop-toast show">
	<div class="inner">
		<div class="info">
			<div class="icon"></div>
			<div class="contents">
				<div class="title">Title</div>
				<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
			</div>
		</div>
		<button class="close"></button>
	</div>
</div>`,
`<div class="lm-pop-toast show">
	<div class="inner guide">
		<div class="info">
			<div class="icon check"></div>
			<div class="contents">
				<div class="title">Title</div>
				<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
			</div>
		</div>
		<button class="close"></button>
	</div>
</div>`,
`<div class="lm-pop-toast show">
	<div class="inner warning">
		<div class="info">
			<div class="icon feel"></div>
			<div class="contents">
				<div class="title">Title</div>
				<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
			</div>
		</div>
		<button class="close"></button>
	</div>
</div>`,
`<div class="lm-pop-toast show">
	<div class="inner error">
		<div class="info">
			<div class="icon feel"></div>
			<div class="contents">
				<div class="title">Title</div>
				<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
			</div>
		</div>
		<button class="close"></button>
	</div>
</div>`
	];

	const tooltipHtml = [
`<div class="lm-pop-tooltip">
	<div class="title">Title</div>
	<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
</div>`,
`<div class="lm-pop-tooltip middle">
	<div class="title">Title</div>
	<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
</div>`,
`<div class="lm-pop-tooltip right">
	<div class="title">Title</div>
	<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
</div>`,
`<div class="lm-pop-tooltip top">
	<div class="title">Title</div>
	<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
</div>`,
`<div class="lm-pop-tooltip top middle">
	<div class="title">Title</div>
	<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
</div>`,
`<div class="lm-pop-tooltip top right">
	<div class="title">Title</div>
	<div class="con">주제나 내용의 일부를 요약해 간략하게 보여주는 영역</div>
</div>`,
	];

	const copyPop = () => {
		setPopShow(false);
		getEvent.copyText(popHtml);
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'lm-pop 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	const copyToast = (num: number) => {
		getEvent.copyText(toastPopHtml[num]);
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'lm-pop-toast 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	const copyTooltip = (num: number) => {
		getEvent.copyText(tooltipHtml[num]);
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'lm-pop-tooltip 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	return (
		<>
			{ popShow && <div dangerouslySetInnerHTML={{ __html: popHtml }} onClick={copyPop}></div>}

			{/* Toast Popup 렌더링 */}
			<div className="lm-panel lm-panel-flex-wrap">
				{toastPopHtml.map((html, index) => (
					<div
						key={index}
						dangerouslySetInnerHTML={{ __html: html }}
						onClick={() => copyToast(index)}
					></div>
				))}
			</div>

			{/* Tooltip 렌더링 */}
			<div className="lm-panel lm-panel-flex-wrap">
				{tooltipHtml.slice(0, 3).map((html, index) => (
					<div
						className='tooltip-parent'
						key={index}
					>
						{
							index === 0 ? 
								'default'
								: index === 1 ?
									'middle' : 'right'
						}
						<div
							dangerouslySetInnerHTML={{ __html: html }}
							onClick={() => copyTooltip(index)}
						></div>
					</div>
				))}
			</div>

			<div className="lm-panel lm-panel-flex-wrap" style={{ marginTop: '400px' }}>
				{tooltipHtml.slice(3).map((html, index) => (
					<div
						className='tooltip-parent'
						key={index}
					>
						{
							index === 0 ? 
								'top'
								: index === 1 ?
									'top middle' : 'top right'
						}
						<div
							key={index}
							dangerouslySetInnerHTML={{ __html: html }}
							onClick={() => copyTooltip(index)}
						></div>
					</div>
				))}
			</div>
		</>
	);
};
