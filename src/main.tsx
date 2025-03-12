import ReactDOM from 'react-dom/client';
import App from '@/App';

import '@/assets/scss/app.scss';
// import 'highlight.js/styles/default.css';
import 'highlight.js/styles/atom-one-dark.css';
// import 'highlight.js/styles/monokai-sublime.css';
// import 'highlight.js/styles/solarized-dark.css';
// import 'highlight.js/styles/github.css';
// import 'highlight.js/styles/dracula.css';

const rootElement = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(rootElement).render(
	<App />
);