import { Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/user" element={<UserDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
