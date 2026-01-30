import { Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';

function App() {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">V2X Auth System</div>
        <div className="links">
          <Link to="/">Home</Link>
          <Link to="/admin">Admin POV</Link>
          <Link to="/user">User POV</Link>
        </div>
      </nav>

      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/user" element={<UserDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="home">
      <h1>Welcome to V2X Authentication & Tracking</h1>
      <div className="card-container">
        <Link to="/admin" className="card">
          <h2>Admin Dashboard</h2>
          <p>Monitor all vehicles, accidents, and system status.</p>
        </Link>
        <Link to="/user" className="card">
          <h2>User Dashboard</h2>
          <p>Manage your vehicle, view balance, and track trips.</p>
        </Link>
      </div>
    </div>
  );
}

export default App;
