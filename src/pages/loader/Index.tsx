import {HOOK_LM_TOAST_POP} from '@/store/hooks/hookToastPop';
import { getEvent } from "@/utils/getEvent";

const LmLoader = () => {
	const { setLmToastPop } = HOOK_LM_TOAST_POP();
	const copyEl = (i: number) => {
		let reqHtml = `<div class="lm-loader-${i}"></div>`;
		getEvent.copyText(reqHtml);
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'lm-loader- 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	}
	const loaders = Array.from({ length: 11 }, (_, index) => index + 1);

	return (
		<>
			<div className="lm-panel-title">
				<div className="lm-icon-box color-3"><div className="lm-icon-play color-white"></div></div>
				<div>
					<div className="title">LOADER</div>
					<div className="des">pyo-dev css loader 모음</div>
				</div>
			</div>
			<div className='lm-panel-guide'>
				<div className='lm-icon-feel color-4'></div>
				해당 영역을 클릭하시면 해당 태그가 복사됩니다.
			</div>
			<div className="lm-panel lm-panel-flex-wrap">
				{loaders.map((loader, index) => (
					<div key={loader} className="lm-loader-sample-box" onClick={() => copyEl(index)}>
						<div className={`lm-loader-${loader}`}></div>
					</div>
				))}
			</div>
		</>
	);
};

export default LmLoader;