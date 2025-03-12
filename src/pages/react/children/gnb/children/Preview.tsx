import { useEffect, useState } from "react";
import SampleSitemap from "@/axios/mockup/sitemap.json";
import { LmNavButton } from "@/components/LmNavButton";

type SitemapItem = {
	title: string;
	children?: SitemapItem[];
};

export const LmReactGnbPreview = () => {
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
