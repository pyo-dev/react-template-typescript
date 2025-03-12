import { useState, ChangeEvent } from "react";
import {HOOK_LM_TOAST_POP} from '@/store/hooks/hookToastPop';
import { getEvent } from "@/utils/getEvent";

export const FormCheckRadio = () => {
	const { setLmToastPop } = HOOK_LM_TOAST_POP();
	const [isChecked, setIsChecked] = useState<boolean>(true);
	const [selectedRadio, setSelectedRadio] = useState<string>("radio1");

	const checkHtml = [
`<label class="lm-check-box">
	<input type="checkbox" />
	<span class="change-d"></span>
	<span class="text">Checkbox</span>
</label>`,
`<label class="lm-check-box s-l">
	<input type="checkbox" />
	<span class="change-d"></span>
	<span class="text">Checkbox</span>
</label>`
	]
	const radioHtml = [
`<label class="lm-radio-box">
	<input type="radio" />
	<span class="change-d"></span>
	<span class="text">Radio</span>
</label>`,
`<label class="lm-radio-box s-l">
	<input type="radio" />
	<span class="change-d"></span>
	<span class="text">Radio</span>
</label>`,
	]
	
	const wrapHtml = [
`<div class="lm-check-radio-box-wrap">
	<label class="lm-check-box s-l">
		<input type="checkbox" />
		<span class="change-d"></span>
		<span class="text">Checkbox</span>
	</label>
	<label class="lm-check-box s-l">
		<input type="checkbox" />
		<span class="change-d"></span>
		<span class="text">Checkbox</span>
	</label>
	<label class="lm-check-box s-l">
		<input type="checkbox" />
		<span class="change-d"></span>
		<span class="text">Checkbox</span>
	</label>
</div>`,
`<div class="lm-check-radio-box-wrap">
	<label class="lm-radio-box s-l">
		<input type="radio" />
		<span class="change-d"></span>
		<span class="text">Checkbox</span>
	</label>
	<label class="lm-radio-box s-l">
		<input type="radio" />
		<span class="change-d"></span>
		<span class="text">Checkbox</span>
	</label>
	<label class="lm-radio-box s-l">
		<input type="radio" />
		<span class="change-d"></span>
		<span class="text">Checkbox</span>
	</label>
</div>`
	];

	const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
		setIsChecked(event.target.checked);
	};

	const handleRadioChange = (event: ChangeEvent<HTMLInputElement>) => {
		setSelectedRadio(event.target.value);
	};

	const copyCheck = (num: number) => {
		getEvent.copyText(checkHtml[num]);
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'lm-check-box 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	const copyRadio = (num: number) => {
		getEvent.copyText(radioHtml[num]);
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'lm-radio-box 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	const copyWrap = (num: number) => {
		getEvent.copyText(wrapHtml[num]);
		setLmToastPop({
			items: {
				type: 'guide',
				iconType: 'check',
				title: 'lm-check-radio-box-wrap 복사',
				contents: '클립보드에 복사되었습니다.',
			}
		});
	};

	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-check-radio-box-wrap">
					<label className="lm-check-box">
						<input type="checkbox" />
						<span className="change-d"></span>
						<span className="text">Checkbox</span>
					</label>
					<label className="lm-check-box">
						<input
							type="checkbox"
							checked={isChecked}
							onChange={handleCheckboxChange}
						/>
						<span className="change-d"></span>
						<span className="text">Checkbox checked</span>
					</label>
					<label className="lm-check-box">
						<input type="checkbox" disabled />
						<span className="change-d"></span>
						<span className="text">Checkbox disabled</span>
					</label>

					<label className="lm-check-box s-l">
						<input type="checkbox" />
						<span className="change-d"></span>
						<span className="text">Checkbox s-l</span>
					</label>
					<label className="lm-check-box s-l">
						<input
							type="checkbox"
							checked={isChecked}
							onChange={handleCheckboxChange}
						/>
						<span className="change-d"></span>
						<span className="text">Checkbox checked s-l</span>
					</label>
					<label className="lm-check-box s-l">
						<input type="checkbox" disabled />
						<span className="change-d"></span>
						<span className="text">Checkbox disabled s-l</span>
					</label>
				</div>
			</div>

			<div className="lm-panel lm-panel-flex-wrap">
				<div className="lm-check-radio-box-wrap">
					<label className="lm-radio-box">
						<input
							name="radio-test"
							type="radio"
							value="radio1"
							checked={selectedRadio === "radio1"} // 선택된 상태 관리
							onChange={handleRadioChange}
						/>
						<span className="change-d"></span>
						<span className="text">Radio 1</span>
					</label>
					<label className="lm-radio-box">
						<input
							name="radio-test"
							type="radio"
							value="radio2"
							checked={selectedRadio === "radio2"} // 선택된 상태 관리
							onChange={handleRadioChange}
						/>
						<span className="change-d"></span>
						<span className="text">Radio 2</span>
					</label>
					<label className="lm-radio-box">
						<input
							name="radio-test"
							type="radio"
							value="radio3"
							checked={selectedRadio === "radio3"} // 선택된 상태 관리
							onChange={handleRadioChange}
							disabled
						/>
						<span className="change-d"></span>
						<span className="text">Radio disabled</span>
					</label>
					<label className="lm-radio-box s-l">
						<input
							name="radio-test"
							type="radio"
							value="radio4"
							checked={selectedRadio === "radio4"} // 선택된 상태 관리
							onChange={handleRadioChange}
						/>
						<span className="change-d"></span>
						<span className="text">Radio s-l</span>
					</label>
					<label className="lm-radio-box s-l">
						<input
							name="radio-test"
							type="radio"
							value="radio5"
							onChange={handleRadioChange}
							disabled
						/>
						<span className="change-d"></span>
						<span className="text">Radio disabled s-l</span>
					</label>
				</div>
			</div>
			<div className="lm-panel lm-panel-flex-wrap">
				<button className="lm-button color-black" onClick={()=>copyCheck(0)} >Checkbox Copy</button>
				<button className="lm-button color-black" onClick={()=>copyCheck(1)} >Checkbox s-l Copy</button>
				<button className="lm-button color-black" onClick={()=>copyWrap(0)} >Checkbox Wrap Copy</button>
				<button className="lm-button color-black" onClick={()=>copyRadio(0)} >Radio Copy</button>
				<button className="lm-button color-black" onClick={()=>copyRadio(1)} >Radio s-l Copy</button>
				<button className="lm-button color-black" onClick={()=>copyWrap(1)}>Radio Wrap Copy</button>
			</div>
		</>
	);
};
