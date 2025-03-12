import {HOOK_LM_TOAST_POP} from '@/store/hooks/hookToastPop';
import { getEvent } from "@/utils/getEvent";

interface CopyTextareaProps {
	lmClass?: string;
	state?: string;
}

export const FormTextarea = () => {
	const { setLmToastPop } = HOOK_LM_TOAST_POP();

	const textareaSelect = ({ lmClass, state }: CopyTextareaProps): void => {
		let textarea = `<textarea className="lm-input ${lmClass}" ${state ? state : ''}></textarea>`;
		getEvent.copyText(textarea);
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'lm-input textarea 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	}

	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-panel-inner-title">Textarea default</div>
				<div className="lm-panel-flex-inner">
					<textarea className="lm-input w-full" placeholder="Textarea default"></textarea>
					<div>
						<button className="lm-button color-black" onClick={()=> textareaSelect({lmClass: ''})}>Default Copy</button>
					</div>
				</div>
				<div className="lm-panel-flex-inner">
					<textarea className="lm-input success w-full" defaultValue="Textarea Success"></textarea>
					<div>
						<button className="lm-button color-black" onClick={()=> textareaSelect({lmClass: 'success'})}>Success Copy</button>
					</div>
				</div>
				<div className="lm-panel-flex-inner">
					<textarea className="lm-input error w-full" defaultValue="Textarea Error"></textarea>
					<div>
						<button className="lm-button color-black" onClick={()=> textareaSelect({lmClass: 'error'})}>Error Copy</button>
					</div>
				</div>
				<div className="lm-panel-flex-inner">
					<textarea className="lm-input w-full" defaultValue="Textarea Disabled" disabled></textarea>
					<div>
						<button className="lm-button color-black" onClick={()=> textareaSelect({state: 'disabled'})}>Disabled Copy</button>
					</div>
				</div>
			</div>
			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-panel-inner-title">Textarea s-l</div>
				<div className="lm-panel-flex-inner">
					<textarea className="lm-input s-l w-full" placeholder="Textarea default"></textarea>
					<div>
						<button className="lm-button color-black" onClick={()=> textareaSelect({lmClass: 's-l'})}>Default Copy</button>
					</div>
				</div>
				<div className="lm-panel-flex-inner">
					<textarea className="lm-input s-l w-full success" defaultValue="Textarea Success"></textarea>
					<div>
						<button className="lm-button color-black" onClick={()=> textareaSelect({lmClass: 's-l success'})}>Success Copy</button>
					</div>
				</div>
				<div className="lm-panel-flex-inner">
					<textarea className="lm-input s-l w-full error" defaultValue="Textarea Error"></textarea>
					<div>
						<button className="lm-button color-black" onClick={()=> textareaSelect({lmClass: 's-l error'})}>Error Copy</button>
					</div>
				</div>
				<div className="lm-panel-flex-inner">
					<textarea className="lm-input s-l w-full" defaultValue="Textarea Disabled" disabled></textarea>
					<div>
						<button className="lm-button color-black" onClick={()=> textareaSelect({lmClass: 's-l', state: 'disabled'})}>Disabled Copy</button>
					</div>
				</div>
			</div>
		</>
	);
};
