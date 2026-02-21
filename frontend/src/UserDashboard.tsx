import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Lock, Activity, Navigation, LogOut, Smartphone, Copy, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api";

const TOLL_LAT = 12.975;
const TOLL_LONG = 77.59;
const TOLL_RADIUS_KM = 0.3;

const PUMP_LAT = 12.9735;
const PUMP_LONG = 77.596;
const PUMP_RADIUS_KM = 0.3;

function isNearPoint(targetLat: number, targetLong: number, lat: number, long: number, radiusKm: number): boolean {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(targetLat - lat);
    const dLon = toRad(targetLong - long);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) *
            Math.cos(toRad(targetLat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= radiusKm;
}

function isNearToll(lat: number, long: number): boolean {
    return isNearPoint(TOLL_LAT, TOLL_LONG, lat, long, TOLL_RADIUS_KM);
}

function isNearPump(lat: number, long: number): boolean {
    return isNearPoint(PUMP_LAT, PUMP_LONG, lat, long, PUMP_RADIUS_KM);
}

type VehicleStatus = {
    registered: boolean;
    active: boolean;
    vehicleAddress: string;
    registeredAt: string;
    revokedAt: string;
};

type GpsData = {
    vehicleId: string;
    lat: number;
    long: number;
    speed: number;
    timestamp: number;
};

type ApiError = {
    error?: string;
};

export default function UserDashboard() {
    const navigate = useNavigate();
    // Auth States
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [vehicleId, setVehicleId] = useState("");
    const [password, setPassword] = useState(""); 
    const [mobileNumber, setMobileNumber] = useState("");
    
    // New Registration Result State
    const [generatedCreds, setGeneratedCreds] = useState<{address: string, privateKey: string, vehicleId?: string} | null>(null);
    const [copied, setCopied] = useState(false);

    // Dashboard Data States
    const [status, setStatus] = useState<VehicleStatus | null>(null);
    const [gps, setGps] = useState<GpsData | null>(null);
    const [balance, setBalance] = useState<string>("0");
    const [chainKeyInput, setChainKeyInput] = useState("");
    const [chainStatus, setChainStatus] = useState<string | null>(null);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        let loginId = vehicleId;

        // Check if input is a mobile number (simple check: mostly digits)
        const isMobile = /^\+?[\d\s-]+$/.test(vehicleId) && vehicleId.replace(/\D/g, '').length >= 10;

        if (isMobile) {
            try {
                const lookupRes = await axios.get(`${BACKEND_URL}/vehicles/lookup/${encodeURIComponent(vehicleId)}`);
                loginId = lookupRes.data.vehicleId;
                // Update state so the dashboard uses the correct ID
                setVehicleId(loginId); 
            } catch {
                setError("Mobile number not found. Please register.");
                return;
            }
        }

        try {
            const statusRes = await axios.get(`${BACKEND_URL}/vehicles/${loginId}/status`);
            if (statusRes.data && statusRes.data.active) {
                setIsLoggedIn(true);
                try {
                    await axios.post(`${BACKEND_URL}/vehicles/${loginId}/client/start`);
                } catch (e) {
                    console.error("Failed to start vehicle client", e);
                }
            } else {
                setError("Vehicle not found or inactive. Please register.");
            }
        } catch (err: unknown) {
            const message =
                axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object"
                    ? (err.response.data as ApiError).error ?? "Login failed. Please check your Vehicle ID or Mobile Number."
                    : "Login failed. Please check your Vehicle ID or Mobile Number.";
            setError(message);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await axios.post(`${BACKEND_URL}/vehicles/register`, {
                vehicleId,
                mobileNumber
            });
            
            if (res.data.privateKey) {
                setGeneratedCreds({
                    address: res.data.vehicleAddress,
                    privateKey: res.data.privateKey,
                    vehicleId: res.data.vehicleId
                });
            } else {
                alert("Registration Successful! Please Login.");
                setAuthMode('login');
            }
        } catch (err: unknown) {
            let message = "Registration failed. Please try again.";
            if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
                const data = err.response.data as ApiError;
                if (data.error) {
                    message = data.error;
                }
            }
            console.error(err);
            setError(message);
        }
    };

    const copyToClipboard = () => {
        if (generatedCreds) {
            let text = `Address: ${generatedCreds.address}\nPrivate Key: ${generatedCreds.privateKey}`;
            if (generatedCreds.vehicleId) {
                text = `Vehicle ID: ${generatedCreds.vehicleId}\n` + text;
            }
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const closeCredsModal = () => {
        setGeneratedCreds(null);
        setAuthMode('login');
    };

    useEffect(() => {
        if (!isLoggedIn) return;

        const fetchData = async () => {
            try {
                const statusRes = await axios.get(`${BACKEND_URL}/vehicles/${vehicleId}/status`);
                setStatus(statusRes.data);

                try {
                    const gpsRes = await axios.get<GpsData>(`${BACKEND_URL}/gps/latest/${vehicleId}`);
                    setGps(gpsRes.data);
                } catch (err: unknown) {
                    if (axios.isAxiosError(err) && err.response?.status === 404) {
                        try {
                            const fallbackRes = await axios.get<GpsData>(`${BACKEND_URL}/gps/latest/VIN123456789`);
                            setGps({ ...fallbackRes.data, vehicleId });
                        } catch {
                            setGps(null);
                        }
                    } else {
                        setGps(null);
                    }
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

    const handleLogout = () => {
        setIsLoggedIn(false);
        navigate('/');
    };

    const handleStartChainClient = async () => {
        if (!vehicleId || !chainKeyInput) return;
        try {
            setChainStatus("Starting blockchain vehicle client...");
            const res = await axios.post(`${BACKEND_URL}/vehicles/${vehicleId}/client/start-chain`, {
                privateKey: chainKeyInput
            });
            if (res.data.status === "started" || res.data.status === "already_running") {
                setChainStatus("Blockchain vehicle client running.");
            } else {
                setChainStatus("Unexpected response while starting client.");
            }
        } catch (err) {
            console.error("Failed to start blockchain vehicle client", err);
            setChainStatus("Failed to start blockchain vehicle client.");
        }
    };

    // Auth View
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
                <Link to="/" className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    ← Back to Home
                </Link>
                
                {generatedCreds && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-800 border border-indigo-500 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative"
                        >
                            <button onClick={closeCredsModal} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <Check className="w-8 h-8 text-green-500" />
                                Registration Successful!
                            </h3>
                            <p className="text-gray-300 mb-6">
                                Your secure wallet has been generated. <br/>
                                <span className="text-red-400 font-bold">SAVE THIS INFORMATION NOW.</span> You will not be able to see it again.
                            </p>
                            
                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-4 mb-6">
                                {generatedCreds.vehicleId && (
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vehicle ID</div>
                                        <div className="font-mono text-white break-all text-sm font-bold">{generatedCreds.vehicleId}</div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Wallet Address</div>
                                    <div className="font-mono text-indigo-400 break-all text-sm">{generatedCreds.address}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Private Key</div>
                                    <div className="font-mono text-red-400 break-all text-sm">{generatedCreds.privateKey}</div>
                                </div>
                            </div>

                            <button 
                                onClick={copyToClipboard}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                {copied ? "Copied to Clipboard" : "Copy Credentials"}
                            </button>
                            
                            <button 
                                onClick={closeCredsModal}
                                className="w-full mt-3 py-3 border border-gray-600 hover:bg-gray-700 text-gray-300 font-bold rounded-lg transition-colors"
                            >
                                I have saved my key
                            </button>
                        </motion.div>
                    </div>
                )}

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
                        {authMode === 'login' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Vehicle ID or Mobile Number
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        required
                                        value={vehicleId}
                                        onChange={e => setVehicleId(e.target.value)}
                                        placeholder="Enter Vehicle ID or Mobile Number"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {authMode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Mobile Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                        required
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={e => setMobileNumber(e.target.value)}
                                        placeholder="+1 234 567 8900"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    We will automatically generate a secure blockchain wallet for you.
                                </p>
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
                    onClick={handleLogout} 
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
                    <>
                        <div className="mb-6 p-4 bg-gray-800 rounded-xl border border-gray-700 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <div className="text-sm text-gray-400 mb-2">Blockchain Vehicle Client</div>
                                <div className="text-xs text-gray-500 mb-2">
                                    Paste the private key for this vehicle to start the on-chain Fastag client.
                                </div>
                                <input
                                    type="password"
                                    value={chainKeyInput}
                                    onChange={e => setChainKeyInput(e.target.value)}
                                    placeholder="Private key (0x...)"
                                    className="w-full md:w-96 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-2">
                                <button
                                    onClick={handleStartChainClient}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
                                >
                                    Start Blockchain Vehicle Client
                                </button>
                                {chainStatus && (
                                    <div className="text-xs text-gray-400 text-left md:text-right max-w-xs">
                                        {chainStatus}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
                        <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 mt-2">
                            <div className="text-sm text-gray-400 mb-1">Proximity Alerts</div>
                            <div className="text-base font-bold">
                                {isNearToll(gps.lat, gps.long) ? (
                                    <span className="text-yellow-300">
                                        Approaching toll booth. Fastag will be charged automatically.
                                    </span>
                                ) : isNearPump(gps.lat, gps.long) ? (
                                    <span className="text-emerald-300">
                                        Approaching petrol pump. You can refuel soon.
                                    </span>
                                ) : (
                                    <span className="text-gray-300">
                                        No toll booth or petrol pump nearby.
                                    </span>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center border-2 border-dashed border-gray-700 rounded-2xl text-gray-500">
                        Waiting for vehicle signal... Please start the vehicle client.
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
