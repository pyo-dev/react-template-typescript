import { lazy } from 'react';
import { useRoutes, RouteObject } from "react-router-dom";
const Layout = lazy(() => import('@/layout/Layout'));
const NotFound = lazy(() => import('@/pages/_notFound/Index'));
const Main = lazy(() => import('@/pages/_main/Index'));
const LmDesign = lazy(() => import('@/pages/design/Index'));
const LmFilter = lazy(() => import('@/pages/filter/Index'));
const LmLoader = lazy(() => import('@/pages/loader/Index'));
const LmReact = lazy(() => import('@/pages/react/Index'));
const CompanyMain = lazy(() => import('@/pages/company/Index'));

const MyRouter = () => {
	const routes: RouteObject[] = [
		{
			path: "/",
			element: <Layout />,
			children: [
				{
					index: true,
					element: <Main />,
				},
				{
					path: "design",
					element: <LmDesign />,
				},
				{
					path: "filter",
					element: <LmFilter />,
				},
				{
					path: "loader",
					element: <LmLoader />,
				},
				{
					path: "react",
					element: <LmReact />,
				},
				{
					path: "company",
					element: <CompanyMain />,
				},
			],
		},
		{
			path: "*",
			element: <NotFound />,
		},
	];

	let element = useRoutes(routes);
	return element;
};

export default MyRouter;
