import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, MapPin, CreditCard, Activity, ChevronRight, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-500" />
              <span className="font-bold text-xl tracking-tight">V2X Auth</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <a href="#about" className="hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                <Link to="/user" className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">Get Started</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
            >
              <span className="block">Secure Vehicle</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Intelligence System
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 max-w-2xl mx-auto text-xl text-gray-400"
            >
              Next-generation V2X communication with blockchain-backed identity, real-time GPS tracking, and automated payments.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex justify-center gap-4"
            >
              <Link to="/user" className="px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-bold text-lg transition-all flex items-center gap-2">
                User Portal <ChevronRight className="w-5 h-5" />
              </Link>
              <Link to="/admin" className="px-8 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 font-bold text-lg border border-gray-700 transition-all flex items-center gap-2">
                <Lock className="w-5 h-5" /> Admin Access
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600 blur-[120px]" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Powered by Blockchain & IoT
            </h2>
            <p className="mt-4 text-gray-400">Complete visibility and control over your fleet infrastructure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MapPin className="w-8 h-8 text-cyan-400" />}
              title="Real-Time Tracking"
              desc="Live GPS monitoring with sub-second latency for all registered vehicles."
            />
            <FeatureCard 
              icon={<CreditCard className="w-8 h-8 text-purple-400" />}
              title="Automated Fastag"
              desc="Seamless toll and tax payments via Ethereum smart contracts."
            />
            <FeatureCard 
              icon={<Activity className="w-8 h-8 text-red-400" />}
              title="Accident Detection"
              desc="Instant collision reporting with speed and location telemetry."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="mb-10 lg:mb-0">
              <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
                Securing the Future of <br />
                <span className="text-indigo-500">Connected Mobility</span>
              </h2>
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  V2X Auth is a pioneering Vehicle-to-Everything communication framework designed to secure the future of autonomous transportation. 
                </p>
                <p>
                  By leveraging Ethereum blockchain technology, we ensure every vehicle identity is immutable, every transaction is transparent, and every data point is verifiable. Our mission is to build the trust layer for the connected roads of tomorrow.
                </p>
                <div className="flex gap-4 pt-4">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-white">100%</span>
                    <span className="text-sm text-gray-500">Decentralized</span>
                  </div>
                  <div className="w-px bg-gray-800 mx-4"></div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-white">&lt;1s</span>
                    <span className="text-sm text-gray-500">Latency</span>
                  </div>
                  <div className="w-px bg-gray-800 mx-4"></div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-white">256-bit</span>
                    <span className="text-sm text-gray-500">Encryption</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl transform rotate-3 blur-lg opacity-30"></div>
              <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Tamper-Proof Identity</h4>
                      <p className="text-sm text-gray-500">Blockchain-backed vehicle registration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Real-Time Telemetry</h4>
                      <p className="text-sm text-gray-500">Instant speed & location verification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Smart Payments</h4>
                      <p className="text-sm text-gray-500">Automated toll & tax settlements</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Shield className="w-6 h-6 text-gray-600" />
            <span className="text-gray-500 font-semibold">V2X Authentication System</span>
          </div>
          <div className="text-gray-600 text-sm">
            &copy; 2026 V2X Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 bg-gray-900 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-colors"
    >
      <div className="mb-4 p-3 bg-gray-800 rounded-lg w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}
