import { Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ClassSessionPage from './pages/ClassSessionPage';
import ControlPage from './pages/ControlPage';
import PresentationPage from './pages/PresentationPage';

const App = () => (
  <Routes>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/classes/:classId" element={<ClassSessionPage />} />
    <Route path="/classes/:classId/control" element={<ControlPage />} />
    <Route path="/classes/:classId/presentation" element={<PresentationPage />} />
  </Routes>
);

export default App;
