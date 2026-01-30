import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = "http://localhost:4000/api";

export default function UserDashboard() {
    // Auth States
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [vehicleId, setVehicleId] = useState("");
    const [password, setPassword] = useState(""); // Dummy password for demo
    const [vehicleAddress, setVehicleAddress] = useState(""); // For registration

    // Dashboard Data States
    const [status, setStatus] = useState<any>(null);
    const [gps, setGps] = useState<any>(null);
    const [balance, setBalance] = useState<string>("0");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            // In a real app, we'd verify password here. 
            // For this demo, we check if the vehicle exists on the backend/blockchain
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
            // Call the backend registration endpoint
            // Note: The backend /register endpoint expects { vehicleId, vehicleAddress }
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

    // Data Polling
    useEffect(() => {
        if (!isLoggedIn) return;

        const fetchData = async () => {
            try {
                // 1. Get Registration Status
                const statusRes = await axios.get(`${BACKEND_URL}/vehicles/${vehicleId}/status`);
                setStatus(statusRes.data);

                // 2. Get Live GPS
                try {
                    const gpsRes = await axios.get(`${BACKEND_URL}/gps/latest/${vehicleId}`);
                    setGps(gpsRes.data);
                } catch (e) {
                    setGps(null);
                }

                // 3. Get Balance
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
            <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ background: '#333', padding: '2rem', borderRadius: '8px', width: '400px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        {authMode === 'login' ? 'User Login' : 'Register Vehicle'}
                    </h2>
                    
                    {error && <div className="alert" style={{ marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                    <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Vehicle ID</label>
                            <input 
                                required
                                value={vehicleId}
                                onChange={e => setVehicleId(e.target.value)}
                                placeholder="e.g., VIN123456789"
                                style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', marginTop: '5px' }}
                            />
                        </div>

                        {authMode === 'register' && (
                            <div>
                                <label>Wallet Address</label>
                                <input 
                                    required
                                    value={vehicleAddress}
                                    onChange={e => setVehicleAddress(e.target.value)}
                                    placeholder="0x..."
                                    style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', marginTop: '5px' }}
                                />
                            </div>
                        )}

                        <div>
                            <label>Password</label>
                            <input 
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', marginTop: '5px' }}
                            />
                        </div>

                        <button type="submit" style={{ padding: '10px', cursor: 'pointer', background: '#646cff', border: 'none', color: 'white', fontWeight: 'bold' }}>
                            {authMode === 'login' ? 'Login' : 'Register'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        {authMode === 'login' ? (
                            <p>New user? <span onClick={() => setAuthMode('register')} style={{ color: '#646cff', cursor: 'pointer', textDecoration: 'underline' }}>Register here</span></p>
                        ) : (
                            <p>Already registered? <span onClick={() => setAuthMode('login')} style={{ color: '#646cff', cursor: 'pointer', textDecoration: 'underline' }}>Login here</span></p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="dashboard">
            <div className="sidebar">
                <h2>User Dashboard</h2>
                <div style={{ marginBottom: '1rem' }}>
                    <div className="stat-label">Logged in as</div>
                    <div style={{ fontWeight: 'bold' }}>{vehicleId}</div>
                </div>

                {status && (
                    <>
                        <div className="stat-box">
                            <div className="stat-label">Registration Status</div>
                            <div className="stat-value" style={{ color: status.active ? '#4caf50' : '#f44336' }}>
                                {status.active ? 'Active' : 'Inactive'}
                            </div>
                        </div>

                        <div className="stat-box">
                            <div className="stat-label">Wallet Balance (Fastag)</div>
                            <div className="stat-value">{parseFloat(balance).toFixed(4)} ETH</div>
                        </div>
                    </>
                )}
                
                <button onClick={() => setIsLoggedIn(false)} style={{ marginTop: '2rem', padding: '8px 16px', background: '#f44336', border: 'none', color: 'white', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>

            <div className="main-view" style={{ padding: '2rem' }}>
                <h3>Live Vehicle Stats</h3>
                
                {gps ? (
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="stat-box">
                            <div className="stat-label">Current Speed</div>
                            <div className="stat-value" style={{ fontSize: '2.5rem' }}>{gps.speed} <small>km/h</small></div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Latitude</div>
                            <div className="stat-value">{gps.lat.toFixed(6)}</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Longitude</div>
                            <div className="stat-value">{gps.long.toFixed(6)}</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Last Sync</div>
                            <div className="stat-value" style={{ fontSize: '1rem' }}>{new Date(gps.timestamp).toLocaleTimeString()}</div>
                        </div>
                    </div>
                ) : (
                    <div className="alert">Waiting for GPS signal... (Run the vehicle client simulation)</div>
                )}

                <div style={{ marginTop: '2rem' }}>
                    {/* Blockchain details hidden as per request */}
                </div>
            </div>
        </div>
    );
}
