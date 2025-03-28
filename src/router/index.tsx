import { lazy } from 'react';
import { useRoutes, RouteObject } from "react-router-dom";
const Layout = lazy(() => import('@/layout/Layout'));
const NotFound = lazy(() => import('@/pages/_notFound/Index'));
const Main = lazy(() => import('@/pages/_main/Index'));
const PyoDesign = lazy(() => import('@/pages/design/Index'));
const PyoFilter = lazy(() => import('@/pages/filter/Index'));
const PyoLoader = lazy(() => import('@/pages/loader/Index'));
const PyoReact = lazy(() => import('@/pages/react/Index'));
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
					element: <PyoDesign />,
				},
				{
					path: "filter",
					element: <PyoFilter />,
				},
				{
					path: "loader",
					element: <PyoLoader />,
				},
				{
					path: "react",
					element: <PyoReact />,
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
