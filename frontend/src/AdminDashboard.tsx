import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Car, LogOut, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api";

export default function AdminDashboard() {
    const navigate = useNavigate();
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

    const handleLogout = () => {
        setIsAuthenticated(false);
        navigate('/');
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
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
                 <Link to="/" className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    ← Back to Home
                </Link>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-sm"
                >
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-indigo-900/30 rounded-full">
                            <Shield className="w-10 h-10 text-indigo-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">Admin Access</h2>
                    <p className="text-gray-400 text-center mb-8 text-sm">Restricted area. Authorized personnel only.</p>
                    
                    {error && (
                        <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                            />
                        </div>
                        <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                            Authenticate
                        </button>
                    </form>
                    <div className="mt-4 text-center text-xs text-gray-600">
                        Hint: admin123
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col z-10 shadow-xl">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-indigo-500" /> Admin Control
                    </h2>
                </div>
                
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                        <div className="text-gray-400 text-xs uppercase font-bold mb-2">Active Vehicles</div>
                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                            {vehicles.length} <Car className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                        <div className="text-gray-400 text-xs uppercase font-bold mb-2">Accidents</div>
                        <div className="text-3xl font-bold text-red-400 flex items-center gap-2">
                            {accidents.length} <AlertTriangle className="w-5 h-5 text-red-900" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {/* Active Vehicles List */}
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Live Fleet</h3>
                    <div className="space-y-3 mb-8">
                        {vehicles.map(v => (
                            <div key={v.vehicleId} className="p-3 bg-gray-900 rounded-lg border border-gray-700 flex justify-between items-center hover:border-indigo-500/50 transition-colors">
                                <div>
                                    <div className="text-xs text-gray-400 font-mono mb-1">{v.vehicleId}</div>
                                    <div className="text-sm font-bold text-white flex items-center gap-2">
                                        <Car className="w-3 h-3 text-indigo-400" />
                                        {v.speed} km/h
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mb-1"></div>
                                    <div className="text-[10px] text-gray-500">{new Date(v.timestamp).toLocaleTimeString()}</div>
                                </div>
                            </div>
                        ))}
                        {vehicles.length === 0 && (
                            <div className="text-center text-gray-500 py-4 text-xs border border-dashed border-gray-700 rounded-lg">
                                No vehicles active
                            </div>
                        )}
                    </div>

                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Alerts</h3>
                    <div className="space-y-3">
                        {accidents.slice().reverse().map((acc, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-red-900/10 border border-red-900/30 rounded-xl"
                            >
                                <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                                    <AlertTriangle className="w-4 h-4" /> Accident Detected
                                </div>
                                <div className="text-sm text-gray-300 mb-1">ID: <span className="font-mono">{acc.vehicleId}</span></div>
                                <div className="text-xs text-gray-500 flex justify-between">
                                    <span>{acc.speed} km/h</span>
                                    <span>{new Date(acc.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </motion.div>
                        ))}
                        {accidents.length === 0 && (
                            <div className="text-center text-gray-500 py-8 text-sm">
                                System Normal. No accidents reported.
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700">
                    <button 
                        onClick={handleLogout} 
                        className="w-full py-2 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </aside>

            {/* Map View */}
            <main className="flex-1 relative bg-gray-900">
                <MapContainer center={[12.9716, 77.5946]} zoom={13} scrollWheelZoom={true}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {vehicles.map(v => (
                        <Marker key={v.vehicleId} position={[v.lat, v.long]}>
                            <Popup className="custom-popup">
                                <div className="p-2">
                                    <b className="text-indigo-600">Vehicle ID:</b> {v.vehicleId}<br />
                                    <b>Speed:</b> {v.speed} km/h<br />
                                    <small className="text-gray-500">Last Update: {new Date(v.timestamp).toLocaleTimeString()}</small>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
                
                {/* Overlay Badge */}
                <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur border border-gray-700 px-4 py-2 rounded-lg shadow-xl z-[1000] text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse"></span>
                    System Online
                </div>
            </main>
        </div>
    );
}
