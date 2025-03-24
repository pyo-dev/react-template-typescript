import { PyoNavButton } from "@/components/PyoNavButton";

export const LayoutHeader = () => {
	return (
		<div className="pyoHeader">
			<div className="logo">PYO-DEV</div>
			<div className="profile">
				<div
					className="img"
					style={{
						backgroundImage:
							"url(https://dimg.donga.com/wps/NEWS/IMAGE/2009/06/09/7132013.1.jpg)",
					}}
				></div>
				<div className="info">Jungmin Pyo</div>
			</div>
			<div className="nav">
				<div className="title">메인</div>
				<PyoNavButton to="/">
					<span className="pyo-icon-doc color-white"></span>대시보드
				</PyoNavButton>
			</div>
			<div className="nav">
				<div className="title">pyo-dev</div>
				<PyoNavButton to="/design" pyoParents={true}>
					<span className="pyo-icon-smile color-white"></span>디자인
					에셋
				</PyoNavButton>
				<PyoNavButton to="/filter" pyoParents={true}>
					<span className="pyo-icon-el color-white"></span>필터
				</PyoNavButton>
				<PyoNavButton to="/loader" pyoParents={true}>
					<span className="pyo-icon-play color-white"></span>로딩 샘플
				</PyoNavButton>
				<PyoNavButton to="/react" pyoParents={true}>
					<span className="pyo-icon-star color-white"></span>react
				</PyoNavButton>
			</div>
			<div className="nav last">
				<div className="title">샘플 템플릿</div>
				<PyoNavButton to="/company" pyoParents={true}>
					<span className="pyo-icon-hart color-white"></span>메인
				</PyoNavButton>
			</div>
		</div>
	);
};
