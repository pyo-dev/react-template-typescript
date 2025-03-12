import Highlight from "react-highlight";
import images from "@/assets/img";

const importHmtl1 = `// @/assets/img/index.d.ts
declare module '@/assets/img' {
const images: Record<string, string>;
export default images;
}
`;
const importHmtl2 = `// @/assets/img/index.js
const rawImages = import.meta.glob("./*.{png,jpg,jpeg,svg}", { eager: true });

// 변환: key -> default로 매핑
const images = Object.fromEntries(
	Object.entries(rawImages).map(([key, value]) => [key, value.default])
);

export default images;
`;

const returnHtml = `// 사용법
import images from '@/assets/img';

export const 컴포넌트이름 = () => {
	return (
		<>
			<img src={images['./banner-1.png']} alt="배너이미지1"/>
			<img src={images['./banner-2.png']} alt="배너이미지2"/>
		</>
	);
};
`;

export const LmReactImg = () => {
	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<Highlight className="javascript lm-panel-code">
					{importHmtl1}
				</Highlight>
				<Highlight className="javascript lm-panel-code">
					{importHmtl2}
				</Highlight>
				<Highlight className="javascript lm-panel-code">
					{returnHtml}
				</Highlight>
			</div>
			<div className="lm-panel lm-sample-img-wrap">
				<div className="lm-panel-inner-title">샘플</div>
				<img src={images["./banner-1.png"]} alt="배너이미지1" />
				<img src={images["./banner-2.png"]} alt="배너이미지2" />
			</div>
		</>
	);
};
