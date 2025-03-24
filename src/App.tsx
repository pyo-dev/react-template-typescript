import { RecoilRoot } from 'recoil';
import { BrowserRouter } from 'react-router-dom';
import MyRouter from '@/router';
import { PyoCommon } from '@/components/PyoCommon';

const App = () => {
	return (
		<RecoilRoot>
			<BrowserRouter>
				<PyoCommon />
				<MyRouter />
			</BrowserRouter>
		</RecoilRoot>
	);
}

export default App;
