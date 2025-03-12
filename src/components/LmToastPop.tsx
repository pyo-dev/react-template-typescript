import { useState, useEffect } from "react";
import {HOOK_LM_TOAST_POP} from "@/store/hooks/hookToastPop";
import {LmToastPopItem} from "@/components/LmToastPopItem";

interface ToastPopItem {
	type: string;
	iconType: string;
	title: string;
	contents: string;
	id: number;  // id를 선택적 속성으로 추가
	addItem: boolean;
}

export const LmToastPop = () => {
	const { getLmToastPop, setLmToastPop } = HOOK_LM_TOAST_POP();
	const [items, setItems] = useState<ToastPopItem[]>([]);

	// 항목 삭제
	const closeToastPop = (id: number) => {
		setItems((prevItems) =>
			prevItems.map((item) =>
				item.id === id ? { ...item, addItem: false } : item
			)
		);
	};

	useEffect(() => {
		const allItemsFalse = items.every((item) => item.addItem === false);
		if (allItemsFalse && items.length > 0) {
			setItems([]);
		}
	}, [items])

	useEffect(() => {
		// getLmToastPop.items가 null이 아니면만 배열에 추가
		if (getLmToastPop.items) {
			setItems((prevItems) => {
				// 고유한 id를 추가하여 ToastPopItem 배열에 추가
				return [
					...prevItems,
					{ ...getLmToastPop.items, id: Date.now(), addItem: true }, // 고유 id 추가
				].filter(Boolean) as ToastPopItem[];
			});
		}
		
		// 상태 초기화
		return () => {
			if (getLmToastPop.reset) {
				setLmToastPop(getLmToastPop.reset);
			} else {
				setLmToastPop({}); // 기본값 설정
			}
		};
	}, [getLmToastPop.items]);

	return (
		items.length > 0 && (
			<div
				className="lm-pop-toast-wrap"
				style={{
					...getLmToastPop.position,
					width: getLmToastPop.width,
					padding: getLmToastPop.padding,
				}}
			>
				{items.map((item, index) => (
					<LmToastPopItem
						data={item}
						closeAc={() => closeToastPop(item.id)}  // closeToastPop 연동
						key={index}
					/>
				))}
			</div>
		)
	);
};
