import Highlight from 'react-highlight'
const buttonHtml = `// @/components/PyoNavButton.tsx
import { useNavigate, useLocation } from "react-router-dom";

interface PyoNavButtonProps {
	to?: string; // 선택적 속성
	pyoClass?: string;
	pyoParents?: boolean;
	pyoEvent?: (() => void) | undefined;
	children: React.ReactNode;
}

export const PyoNavButton: React.FC<PyoNavButtonProps> = ({
	to,
	pyoClass = "",
	pyoParents = false,
	pyoEvent,
	children,
}) => {
	const navigate = useNavigate();
	const { pathname, search } = useLocation();
	const currentPath = \`\${pathname}\${search}\`;

	// 부모 경로 포함 여부에 따른 활성화 클래스 설정
	const isActive = pyoParents
		? (pathname === "/" && to === "/") || (to !== undefined && pathname.includes(to))
		: to === currentPath;

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		if (pyoEvent) {
			pyoEvent(); // 전달된 이벤트 호출
		} else if (to) {
			navigate(to); // to가 정의된 경우에만 navigate 호출
		} else {
			console.warn("Navigation path (to) is undefined.");
		}
	};

	return (
		<button
			onClick={handleClick}
			className={\`\${isActive ? "active" : ""} \${pyoClass}\`}
		>
			{children}
		</button>
	);
};
`
	
const gnbHtml = `// 사용법
import { useEffect, useState } from "react";
import SampleSitemap from "@/axios/mockup/sitemap.json";
import { PyoNavButton } from "@/components/PyoNavButton";

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
		<div className="pyo-panel pyo-panel-flex-wrap">
			<div className="w-full">
				{sitemap.map((item, index) => (
					<div key={index} style={{ padding: "5px" }}>
						<PyoNavButton
							to="/pyo-dev/design"
							pyoClass={"pyo-button color-1"}
							pyoEvent={
								item.children && item.children.length > 0
									? () => toggleShow(index)
									: undefined
							}
						>
							{item.title}
						</PyoNavButton>
						{item.children &&
							item.children.length > 0 &&
							childrenShow[index] && (
								<div style={{ padding: "2px" }}>
									{item.children.map((sItem, sIndex) => (
										<div
											key={sIndex}
											style={{ padding: "1px" }}
										>
											<PyoNavButton
												pyoClass={
													"pyo-button color-2 s-s"
												}
											>
												{sItem.title}
											</PyoNavButton>
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

export const PyoReactGnbCode = () => {

	return (
		<>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{buttonHtml}
				</Highlight>
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{gnbHtml}
				</Highlight>
			</div>
		</>
	);
};
