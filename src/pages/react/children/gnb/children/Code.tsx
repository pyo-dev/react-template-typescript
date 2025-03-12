import Highlight from 'react-highlight'
const buttonHtml = `// @/components/LmNavButton.tsx
import { useNavigate, useLocation } from "react-router-dom";

interface LmNavButtonProps {
	to?: string; // 선택적 속성
	lmClass?: string;
	lmParents?: boolean;
	lmEvent?: (() => void) | undefined;
	children: React.ReactNode;
}

export const LmNavButton: React.FC<LmNavButtonProps> = ({
	to,
	lmClass = "",
	lmParents = false,
	lmEvent,
	children,
}) => {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const currentPath = \`\${pathname}\${search}\`;

	// 부모 경로 포함 여부에 따른 활성화 클래스 설정
	const isActive = lmParents
		? (pathname === "/" && to === "/") || (to !== undefined && pathname.includes(to))
		: to === currentPath;

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		if (lmEvent) {
			lmEvent(); // 전달된 이벤트 호출
		} else if (to) {
			navigate(to); // to가 정의된 경우에만 navigate 호출
		} else {
			console.warn("Navigation path (to) is undefined.");
		}
	};

	return (
		<button
			onClick={handleClick}
			className={\`\${isActive ? "active" : ""} \${lmClass}\`}
		>
			{children}
		</button>
	);
};
`
	
const gnbHtml = `// 사용법
import { useEffect, useState } from "react";
import SampleSitemap from "@/axios/mockup/sitemap.json";
import { LmNavButton } from "@/components/LmNavButton";

type SitemapItem = {
	title: string;
	children?: SitemapItem[];
};

export const 컴포넌트이름 = () => {
	const [sitemap, setSitemap] = useState<SitemapItem[]>([]);
	const [childrenShow, setChildrenShow] = useState<boolean[]>([]);

	const getSitemap = () => {
		setSitemap(SampleSitemap as SitemapItem[]);
		const showChild = new Array(SampleSitemap.length).fill(false);
		setChildrenShow(showChild);
	};

	const toggleShow = (index: number) => {
		setChildrenShow((prevData) => {
			const updated = [...prevData];
			updated[index] = !updated[index];
			return updated;
		});
	};

	useEffect(() => {
		getSitemap();
	}, []);

	return (
		<div className="lm-panel lm-panel-flex-wrap">
			<div className="w-full">
				{sitemap.map((item, index) => (
					<div key={index} style={{ padding: "5px" }}>
						<LmNavButton
							to="/leadermine/design"
							lmClass={"lm-button color-1"}
							lmEvent={
								item.children && item.children.length > 0
									? () => toggleShow(index)
									: undefined
							}
						>
							{item.title}
						</LmNavButton>
						{item.children &&
							item.children.length > 0 &&
							childrenShow[index] && (
								<div style={{ padding: "2px" }}>
									{item.children.map((sItem, sIndex) => (
										<div
											key={sIndex}
											style={{ padding: "1px" }}
										>
											<LmNavButton
												lmClass={
													"lm-button color-2 s-s"
												}
											>
												{sItem.title}
											</LmNavButton>
										</div>
									))}
								</div>
							)}
					</div>
				))}
			</div>
		</div>
	);
};
`

export const LmReactGnbCode = () => {

	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<Highlight className="javascript lm-panel-code">
					{buttonHtml}
				</Highlight>
			</div>
			<div className="lm-panel lm-panel-flex-wrap">
				<Highlight className="javascript lm-panel-code">
					{gnbHtml}
				</Highlight>
			</div>
		</>
	);
};
