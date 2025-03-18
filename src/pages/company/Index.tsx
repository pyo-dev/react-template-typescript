const CompanyMain = () => {

	const openWindow = (url: string): void => {
		window.open(url);
	}

	return (
		<>
			<div className="lm-panel-title">
				<div className="lm-icon-box color-1"><div className="lm-icon-hart color-white"></div></div>
				<div>
					<div className="title">COMPANY</div>
					<div className="des">템플릿 및 가이드</div>
				</div>
			</div>
			<div className="lm-panel lm-panel-flex-wrap">
				<button className="lm-button color-1 line" onClick={() => openWindow('/client/example/swiper/index.html')}>Swiper sample</button>
				<button className="lm-button color-1 line" onClick={() => openWindow('/client/example/text/index.html')}>Text effect</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
				<button className="lm-button color-1 line" disabled>준비중입니다.</button>
			</div>
		</>
	);
};

export default CompanyMain;