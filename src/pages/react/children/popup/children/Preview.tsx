import {HOOK_LM_LODING} from '@/store/hooks/hookLoding'
import {HOOK_LM_POP} from '@/store/hooks/hookPop'
import {HOOK_LM_TOAST_POP} from '@/store/hooks/hookToastPop';

export const LmReactPopupPreview = () => {

	const { setLmLoding } = HOOK_LM_LODING();
	const { setLmPop } = HOOK_LM_POP();
	const { setLmToastPop } = HOOK_LM_TOAST_POP();

	const loadingOpen1 = () => {
		setLmLoding({show: true});
		setTimeout(() => {
			setLmLoding({show: false});
		}, 2000);
	}

	const popOpen1 = () => {
		console.log(123);
		setLmPop({
			show: true,
			title: '팝업 타이틀'
		});
	}

	const popOpen2 = () => {
		setLmPop({
			show: true,
			title: '팝업 타이틀',
			contents: '팝업 콘텐츠',
		});
	}

	const popOpen3 = () => {
		setLmPop({
			show: true,
			type: 'confirm',
			title: '컨펌창이다',
			contents: `
				<div>내용이지</div>
				<p>내용이지</p>
			`,
			cancle_title: '취소입니다.',
			success_title: '확인입니다.',
			success_fun: (hidePop: () => void) => {
				alert('확인창 클릭 2초뒤 팝업창이 닫힘');
				setTimeout(() => {
					hidePop();
				}, 2000);
			},
			cancle_fun: (hidePop: () => void) => {
				alert('취소창 클릭 3초뒤 팝업창이 닫힘');
				setTimeout(() => {
					hidePop();
				}, 3000);
			}
		});
	}

	const toastPopOpen1 = () => {
		setLmToastPop({
			items: {
				title: '11 -- 토스트 팝업 테스트',
				contents: '토스트 팝업 테스트 중입니다 잘 작동하나요?',
			}
		})
	}

	const toastPopOpen2 = () => {
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'guide 토스트 팝업 테스트',
				contents: '토스트 팝업 테스트 중입니다 잘 작동하나요?',
			}
		})
	}

	const toastPopOpen3 = () => {
		setLmToastPop({
			items: {
				type: 'warning',
				iconType: 'feel',
				title: 'warning 토스트 팝업 테스트',
				contents: '토스트 팝업 테스트 중입니다 잘 작동하나요?',
			}
		})
	}

	const toastPopOpen4 = () => {
		setLmToastPop({
			items: {
				type: 'error',
				iconType: 'feel',
				title: 'error 토스트 팝업 테스트',
				contents: '토스트 팝업 테스트 중입니다 잘 작동하나요?',
			}
		})
	}

	return (
		<>
			<div className='lm-panel lm-panel-flex-wrap'>
				<button className="lm-button color-1 line" onClick={()=> loadingOpen1()}>Loading</button>
				<button className="lm-button color-1 line" onClick={()=> popOpen1()}>Pop Default</button>
				<button className="lm-button color-3 line" onClick={()=> popOpen2()}>Pop Title Contents</button>
				<button className="lm-button color-4 line" onClick={()=> popOpen3()}>Pop Custom</button>
				<button className="lm-button color-1 line" onClick={()=> toastPopOpen1()}>Toast Pop Default</button>
				<button className="lm-button color-3 line" onClick={()=> toastPopOpen2()}>Toast Pop Guide</button>
				<button className="lm-button color-4 line" onClick={()=> toastPopOpen3()}>Toast Pop Warning</button>
				<button className="lm-button color-5 line" onClick={()=> toastPopOpen4()}>Toast Pop Error</button>
			</div>
		</>
	);
};



