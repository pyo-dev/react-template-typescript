const rawImages = import.meta.glob("./*.{png,jpg,jpeg,svg}", { eager: true });

// 변환: key -> default로 매핑
const images = Object.fromEntries(
	Object.entries(rawImages).map(([key, value]) => [key, value.default])
);

export default images;
