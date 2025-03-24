import {HOOK_PYO_TOAST_POP} from '@/store/hooks/hookToastPop';
import { getEvent } from "@/utils/getEvent";

const PyoLoader = () => {
	const { setPyoToastPop } = HOOK_PYO_TOAST_POP();
	const copyEl = (i: number) => {
		let reqHtml = `<div class="pyo-loader-${i}"></div>`;
		getEvent.copyText(reqHtml);
		setPyoToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'pyo-loader- 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	}
	const loaders = Array.from({ length: 11 }, (_, index) => index + 1);

	return (
		<>
			<div className="pyo-panel-title">
				<div className="pyo-icon-box color-3"><div className="pyo-icon-play color-white"></div></div>
				<div>
					<div className="title">LOADER</div>
					<div className="des">pyo-dev css loader 모음</div>
				</div>
			</div>
			<div className='pyo-panel-guide'>
				<div className='pyo-icon-feel color-4'></div>
				해당 영역을 클릭하시면 해당 태그가 복사됩니다.
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				{loaders.map((loader, index) => (
					<div key={loader} className="pyo-loader-sample-box" onClick={() => copyEl(index)}>
						<div className={`pyo-loader-${loader}`}></div>
					</div>
				))}
			</div>
		</>
	);
};

export default PyoLoader;