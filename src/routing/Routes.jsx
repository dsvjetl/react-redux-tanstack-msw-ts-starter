import { Route, Routes } from 'react-router-dom';

import { HomeExample } from '../views/HomeExample';
import { routePaths } from './index';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path={routePaths.HOME} element={<HomeExample />} />
    </Routes>
  );
};

export default AppRoutes;
