import { useEffect, useState } from "react";
import SampleSitemap from "@/axios/mockup/sitemap.json";
import { PyoNavButton } from "@/components/PyoNavButton";

type SitemapItem = {
	title: string;
	children?: SitemapItem[];
};

export const PyoReactGnbPreview = () => {
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
