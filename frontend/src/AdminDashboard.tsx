import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface VehicleData {
    vehicleId: string;
    lat: number;
    long: number;
    speed: number;
    timestamp: number;
}

interface Accident {
    vehicleId: string;
    location: string;
    speed: number;
    details: string;
    timestamp: number;
}

const BACKEND_URL = "http://localhost:4000/api";

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const [vehicles, setVehicles] = useState<VehicleData[]>([]);
    const [accidents, setAccidents] = useState<Accident[]>([]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded admin password for demo
        if (password === "admin123") {
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Invalid Admin Password");
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchData = async () => {
            try {
                const vRes = await axios.get(`${BACKEND_URL}/gps/all`);
                setVehicles(vRes.data);

                const aRes = await axios.get(`${BACKEND_URL}/gps/accidents`);
                setAccidents(aRes.data);
            } catch (err) {
                console.error("Error fetching admin data", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ background: '#333', padding: '2rem', borderRadius: '8px', width: '350px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Admin Login</h2>
                    {error && <div className="alert" style={{ marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Password</label>
                            <input 
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter Admin Password"
                                style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', marginTop: '5px' }}
                            />
                        </div>
                        <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer', background: '#f44336', border: 'none', color: 'white', fontWeight: 'bold' }}>
                            Access Dashboard
                        </button>
                    </form>
                    <div style={{ marginTop: '1rem', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                        (Hint: admin123)
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="sidebar">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Admin Control</h2>
                    <button onClick={() => setIsAuthenticated(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Logout</button>
                </div>
                
                <div className="stat-box">
                    <div className="stat-label">Active Vehicles</div>
                    <div className="stat-value">{vehicles.length}</div>
                </div>

                <div className="stat-box">
                    <div className="stat-label">Accidents Reported</div>
                    <div className="stat-value">{accidents.length}</div>
                </div>

                <h3>Recent Accidents</h3>
                <div className="list">
                    {accidents.slice().reverse().map((acc, i) => (
                        <div key={i} className="list-item">
                            <div className="alert">⚠ Accident Detected</div>
                            <small>{new Date(acc.timestamp).toLocaleTimeString()}</small>
                            <div>ID: {acc.vehicleId}</div>
                            <div>Speed: {acc.speed} km/h</div>
                            <div>Loc: {acc.location}</div>
                        </div>
                    ))}
                    {accidents.length === 0 && <div className="list-item">No accidents reported.</div>}
                </div>
            </div>

            <div className="main-view">
                <MapContainer center={[12.9716, 77.5946]} zoom={13} scrollWheelZoom={true}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {vehicles.map(v => (
                        <Marker key={v.vehicleId} position={[v.lat, v.long]}>
                            <Popup>
                                <b>Vehicle ID:</b> {v.vehicleId}<br />
                                <b>Speed:</b> {v.speed} km/h<br />
                                <b>Last Update:</b> {new Date(v.timestamp).toLocaleTimeString()}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
