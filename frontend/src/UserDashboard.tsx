import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Lock, Wallet, Activity, Navigation, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api";

export default function UserDashboard() {
    // Auth States
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [vehicleId, setVehicleId] = useState("");
    const [password, setPassword] = useState(""); 
    const [vehicleAddress, setVehicleAddress] = useState(""); 

    // Dashboard Data States
    const [status, setStatus] = useState<any>(null);
    const [gps, setGps] = useState<any>(null);
    const [balance, setBalance] = useState<string>("0");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const statusRes = await axios.get(`${BACKEND_URL}/vehicles/${vehicleId}/status`);
            if (statusRes.data && statusRes.data.active) {
                setIsLoggedIn(true);
            } else {
                setError("Vehicle not found or inactive. Please register.");
            }
        } catch (err) {
            setError("Login failed. Vehicle ID might be invalid.");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await axios.post(`${BACKEND_URL}/vehicles/register`, {
                vehicleId,
                vehicleAddress
            });
            alert("Registration Successful! Please Login.");
            setAuthMode('login');
        } catch (err) {
            console.error(err);
            setError("Registration failed. ID might be taken.");
        }
    };

    useEffect(() => {
        if (!isLoggedIn) return;

        const fetchData = async () => {
            try {
                const statusRes = await axios.get(`${BACKEND_URL}/vehicles/${vehicleId}/status`);
                setStatus(statusRes.data);

                try {
                    const gpsRes = await axios.get(`${BACKEND_URL}/gps/latest/${vehicleId}`);
                    setGps(gpsRes.data);
                } catch (e) {
                    setGps(null);
                }

                if (statusRes.data.vehicleAddress) {
                    const balRes = await axios.get(`${BACKEND_URL}/payment/balance/${statusRes.data.vehicleAddress}`);
                    setBalance(balRes.data.balance);
                }

            } catch (err) {
                console.error("Error fetching user data", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [isLoggedIn, vehicleId]);

    // Auth View
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
                <Link to="/" className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    ← Back to Home
                </Link>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md"
                >
                    <h2 className="text-3xl font-bold text-white mb-6 text-center">
                        {authMode === 'login' ? 'Welcome Back' : 'Register Vehicle'}
                    </h2>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Vehicle ID</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input 
                                    required
                                    value={vehicleId}
                                    onChange={e => setVehicleId(e.target.value)}
                                    placeholder="e.g., VIN123456789"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all"
                                />
                            </div>
                        </div>

                        {authMode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address</label>
                                <div className="relative">
                                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        required
                                        value={vehicleAddress}
                                        onChange={e => setVehicleAddress(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input 
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all transform active:scale-95"
                        >
                            {authMode === 'login' ? 'Login' : 'Register Vehicle'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        {authMode === 'login' ? (
                            <p>New here? <button onClick={() => setAuthMode('register')} className="text-indigo-400 hover:text-indigo-300 font-medium">Create account</button></p>
                        ) : (
                            <p>Already registered? <button onClick={() => setAuthMode('login')} className="text-indigo-400 hover:text-indigo-300 font-medium">Login now</button></p>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-10 text-indigo-400">
                    <Activity className="w-6 h-6" />
                    <h1 className="text-xl font-bold text-white">My Vehicle</h1>
                </div>

                <div className="flex-1 space-y-6">
                    <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                        <div className="text-sm text-gray-400 mb-1">Vehicle ID</div>
                        <div className="font-mono text-sm break-all text-white font-semibold">{vehicleId}</div>
                    </div>

                    {status && (
                        <>
                            <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                                <div className="text-sm text-gray-400 mb-1">Status</div>
                                <div className={`font-bold ${status.active ? 'text-green-400' : 'text-red-400'}`}>
                                    {status.active ? '● Active' : '● Inactive'}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                                <div className="text-sm text-gray-400 mb-1">Fastag Balance</div>
                                <div className="text-2xl font-bold text-white">
                                    {parseFloat(balance).toFixed(4)} <span className="text-sm text-gray-500">ETH</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <button 
                    onClick={() => setIsLoggedIn(false)} 
                    className="mt-auto flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <LogOut className="w-5 h-5" /> Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center">
                    <h2 className="text-3xl font-bold">Live Telemetry</h2>
                    <div className="text-sm text-gray-400">Last updated: {new Date().toLocaleTimeString()}</div>
                </header>
                
                {gps ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            icon={<Activity className="text-indigo-400" />}
                            label="Current Speed"
                            value={`${gps.speed} km/h`}
                        />
                        <StatCard 
                            icon={<Navigation className="text-cyan-400" />}
                            label="Latitude"
                            value={gps.lat.toFixed(6)}
                        />
                        <StatCard 
                            icon={<Navigation className="text-cyan-400" />}
                            label="Longitude"
                            value={gps.long.toFixed(6)}
                        />
                        <StatCard 
                            icon={<Activity className="text-purple-400" />}
                            label="Sync Status"
                            value="Online"
                        />
                    </div>
                ) : (
                    <div className="p-12 text-center border-2 border-dashed border-gray-700 rounded-2xl text-gray-500">
                        Waiting for vehicle signal... Please start the vehicle client.
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gray-800 rounded-2xl border border-gray-700 hover:border-indigo-500/30 transition-colors"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-900 rounded-lg">{icon}</div>
                <div className="text-gray-400 text-sm font-medium">{label}</div>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </motion.div>
    );
}
