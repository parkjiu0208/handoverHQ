import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Hackathons = lazy(() => import('./pages/Hackathons').then((module) => ({ default: module.Hackathons })));
const HackathonDetail = lazy(() =>
  import('./pages/HackathonDetail').then((module) => ({ default: module.HackathonDetail }))
);
const Camp = lazy(() => import('./pages/Camp').then((module) => ({ default: module.Camp })));
const Rankings = lazy(() => import('./pages/Rankings').then((module) => ({ default: module.Rankings })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'hackathons', Component: Hackathons },
      { path: 'hackathons/:slug', Component: HackathonDetail },
      { path: 'camp', Component: Camp },
      { path: 'rankings', Component: Rankings },
      { path: '*', Component: NotFound },
    ],
  },
]);
