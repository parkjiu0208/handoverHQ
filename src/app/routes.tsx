import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Hackathons } from './pages/Hackathons';
import { HackathonDetail } from './pages/HackathonDetail';
import { Camp } from './pages/Camp';
import { Rankings } from './pages/Rankings';
import { NotFound } from './pages/NotFound';

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
