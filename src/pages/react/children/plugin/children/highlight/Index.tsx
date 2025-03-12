import Highlight from 'react-highlight'

const pageCode = `// 사용법
import Highlight from 'react-highlight'

export const 컴포넌트이름 = () => {
	const pageCode = \`[
		"all-menu-2",
		"all-menu",
		"arrow-down",
		"arrow-first",
		"arrow-last",
		"arrow-next",
		"arrow-prev",
		"arrow-up",
	];\`

	return (
		<>
			<Highlight className='javascript lm-panel-code'>{pageCode}</Highlight>
		</>
	);
};
`

export const LmPluginHighlight = () => {

	return (
		<>
			<div className="lm-panel lm-panel-flex-wrap">
				<Highlight className="javascript lm-panel-code">
					{pageCode}
				</Highlight>
			</div>
		</>
	);
};
