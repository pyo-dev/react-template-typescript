const CompanyMain = () => {

	const openWindow = (url: string): void => {
		window.open(url);
	}

	return (
		<>
			<div className="pyo-panel-title">
				<div className="pyo-icon-box color-1"><div className="pyo-icon-hart color-white"></div></div>
				<div>
					<div className="title">COMPANY</div>
					<div className="des">템플릿 및 가이드</div>
				</div>
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<button className="pyo-button color-1 line" onClick={() => openWindow('/client/example/swiper/index.html')}>Swiper sample</button>
				<button className="pyo-button color-1 line" onClick={() => openWindow('/client/example/text/index.html')}>Text effect</button>
				<button className="pyo-button color-1 line" onClick={() => openWindow('/client/example/bootomsheet/index.html')}>Bottom Sheet</button>
				<button className="pyo-button color-1 line" onClick={() => openWindow('/client/example/rotatemenu/index.html')}>Rotate Menu</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
				<button className="pyo-button color-1 line" disabled>준비중입니다.</button>
			</div>
		</>
	);
};

export default CompanyMain;