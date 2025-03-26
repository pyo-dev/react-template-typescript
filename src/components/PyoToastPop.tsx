import { useState, useEffect } from "react";
import {HOOK_PYO_TOAST_POP} from "@/store/hooks/hookToastPop";
import {PyoToastPopItem} from "@/components/PyoToastPopItem";

interface ToastPopItem {
	type: string;
	iconType: string;
	title: string;
	contents: string;
	id: number;  // id를 선택적 속성으로 추가
	addItem: boolean;
}

export const PyoToastPop = () => {
	const { getPyoToastPop, setPyoToastPop } = HOOK_PYO_TOAST_POP();
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
		// getPyoToastPop.items가 null이 아니면만 배열에 추가
		if (getPyoToastPop.items) {
			setItems((prevItems) => {
				// 고유한 id를 추가하여 ToastPopItem 배열에 추가
				return [
					...prevItems,
					{ ...getPyoToastPop.items, id: Date.now(), addItem: true }, // 고유 id 추가
				].filter(Boolean) as ToastPopItem[];
			});
		}
		
		// 상태 초기화
		return () => {
			if (getPyoToastPop.reset) {
				setPyoToastPop(getPyoToastPop.reset);
			} else {
				setPyoToastPop({}); // 기본값 설정
			}
		};
	}, [getPyoToastPop.items]);

	return (
		items.length > 0 && (
			<div
				className="pyo-pop-toast-wrap"
				style={{
					...getPyoToastPop.position,
					width: '100%',
					maxWidth: getPyoToastPop.width,
					padding: getPyoToastPop.padding,
				}}
			>
				{items.map((item, index) => (
					<PyoToastPopItem
						data={item}
						closeAc={() => closeToastPop(item.id)}  // closeToastPop 연동
						key={index}
					/>
				))}
			</div>
		)
	);
};
