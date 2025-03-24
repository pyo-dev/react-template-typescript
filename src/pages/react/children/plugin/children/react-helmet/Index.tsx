import Highlight from 'react-highlight'
import { Helmet } from 'react-helmet';

const layoutCode = ` // @/layout/Layout.jsx
// 공통 영역에 Default 설정
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet';

export const Layout = () => {
	return (
		<>
			<Helmet>
				<title>PYO-DEV TEMPLATE GUIDE</title>
			</Helmet>
			<Outlet />
		</>
	);
};
`
const pageCode = `// 페이지
import { Helmet } from 'react-helmet';

export const Layout = () => {
	return (
		<>
			<Helmet>
				<title>타이틀 변경 테스트</title>
			</Helmet>
		</>
	);
};
`

export const PyoPluginReactHelmet = () => {

	return (
		<>
			<Helmet>
				<title>타이틀 변경 테스트</title>
			</Helmet>
			<div className="pyo-panel-guide">
				<div className="pyo-icon-feel color-1"></div>
				head 내용을 동적으로 변경하는데 사용한다
			</div>
			<div className="pyo-panel pyo-panel-flex-wrap">
				<Highlight className="javascript pyo-panel-code">
					{layoutCode}
				</Highlight>
				<Highlight className="javascript pyo-panel-code">
					{pageCode}
				</Highlight>
			</div>
		</>
	);
};