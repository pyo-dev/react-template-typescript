import { LmNavButton } from "@/components/LmNavButton";

export const LayoutHeader = () => {
	return (
		<div className="lmHeader">
			<div className="logo">LEADERMINE</div>
			<div className="profile">
				<div
					className="img"
					style={{
						backgroundImage:
							"url(https://dimg.donga.com/wps/NEWS/IMAGE/2009/06/09/7132013.1.jpg)",
					}}
				></div>
				<div className="info">Jumin Pyo</div>
			</div>
			<div className="nav">
				<div className="title">메인</div>
				<LmNavButton to="/">
					<span className="lm-icon-doc color-white"></span>데시보드
				</LmNavButton>
			</div>
			<div className="nav">
				<div className="title">리더마인</div>
				<LmNavButton to="/design" lmParents={true}>
					<span className="lm-icon-smile color-white"></span>디자인
					에셋
				</LmNavButton>
				<LmNavButton to="/filter" lmParents={true}>
					<span className="lm-icon-el color-white"></span>필터
				</LmNavButton>
				<LmNavButton to="/loader" lmParents={true}>
					<span className="lm-icon-play color-white"></span>로딩 샘플
				</LmNavButton>
				<LmNavButton to="/react" lmParents={true}>
					<span className="lm-icon-star color-white"></span>react
				</LmNavButton>
			</div>
			<div className="nav last">
				<div className="title">고객사 템플릿</div>
				<LmNavButton to="/company" lmParents={true}>
					<span className="lm-icon-hart color-white"></span>메인
				</LmNavButton>
			</div>
		</div>
	);
};
