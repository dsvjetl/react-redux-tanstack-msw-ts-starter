import { Navigate, Route, Routes } from 'react-router-dom';

import { Today } from '../views/Today';
import { Calendar } from '../views/Calendar';
import routePaths from './routePaths';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path={routePaths.TODAY} element={<Today />} />
      <Route path={routePaths.CALENDAR} element={<Calendar />} />
      <Route path="*" element={<Navigate to={routePaths.TODAY} replace />} />
    </Routes>
  );
};

export default AppRoutes;
