import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { motion } from "framer-motion";

// Import all screen components
import HostControlPanel from "./screens/HostControlPanel";
import GameScreenTVQuality from "./screens/GameScreenTVQuality";
import PlayerBuzzer from "./screens/PlayerBuzzer";
import AudienceDisplay from "./screens/AudienceDisplay";
import ContentManagementSystem from "./screens/ContentManagementSystem";
import BroadcastingStudio from "./screens/BroadcastingStudio";

// Import styles
import "./styles.css";

const HomePage = () => {
  return (
    <div className="min-h-screen tv-screen text-white">
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 
            className="text-8xl font-bold mb-8 tv-title gradient-gold bg-clip-text text-transparent"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            FAMILY FEUD
          </motion.h1>
          
          <motion.p 
            className="text-2xl text-gray-300 mb-12 tv-body"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            Professional TV Studio Game Show Experience
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <Link 
                to="/host" 
                className="block card p-8 hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4">🎮</div>
                <h2 className="text-2xl font-bold mb-3 tv-subtitle">Host Control</h2>
                <p className="text-gray-300 tv-body">Professional host control panel with real-time game management, timer controls, and strike system</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <Link 
                to="/game" 
                className="block card p-8 hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4">📺</div>
                <h2 className="text-2xl font-bold mb-3 tv-subtitle">Game Display</h2>
                <p className="text-gray-300 tv-body">Main game screen with TV-quality visuals, smooth animations, and professional broadcast styling</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <Link 
                to="/buzzer" 
                className="block card p-8 hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4">🔴</div>
                <h2 className="text-2xl font-bold mb-3 tv-subtitle">Player Buzzer</h2>
                <p className="text-gray-300 tv-body">Mobile-friendly buzzer interface for contestants with real-time response system</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            >
              <Link 
                to="/audience" 
                className="block card p-8 hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4">👥</div>
                <h2 className="text-2xl font-bold mb-3 tv-subtitle">Audience View</h2>
                <p className="text-gray-300 tv-body">Large screen display optimized for audience viewing with enhanced visual effects</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              <Link 
                to="/cms" 
                className="block card p-8 hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4">⚙️</div>
                <h2 className="text-2xl font-bold mb-3 tv-subtitle">Content Manager</h2>
                <p className="text-gray-300 tv-body">Comprehensive content management system for questions, categories, and game templates</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              <Link 
                to="/broadcast" 
                className="block card p-8 hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl mb-4">📡</div>
                <h2 className="text-2xl font-bold mb-3 tv-subtitle">Broadcasting</h2>
                <p className="text-gray-300 tv-body">Professional broadcasting studio with recording, streaming, and overlay controls</p>
              </Link>
            </motion.div>
          </div>

          <motion.div 
            className="card p-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <h3 className="text-3xl font-bold mb-6 tv-subtitle">Professional Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div>
                <h4 className="font-bold text-yellow-400 mb-3 tv-subtitle">Host Controls</h4>
                <ul className="text-sm text-gray-300 space-y-2 tv-body">
                  <li>• Real-time game state management</li>
                  <li>• Manual score adjustments</li>
                  <li>• Strike management system</li>
                  <li>• Timer controls with visual countdown</li>
                  <li>• Sound effect triggers</li>
                  <li>• Question navigation controls</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-yellow-400 mb-3 tv-subtitle">TV-Quality Visuals</h4>
                <ul className="text-sm text-gray-300 space-y-2 tv-body">
                  <li>• Smooth animations and transitions</li>
                  <li>• High-contrast, readable fonts</li>
                  <li>• Professional broadcast styling</li>
                  <li>• Responsive design for all screens</li>
                  <li>• Dynamic visual effects</li>
                  <li>• Customizable themes and branding</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-yellow-400 mb-3 tv-subtitle">Advanced Features</h4>
                <ul className="text-sm text-gray-300 space-y-2 tv-body">
                  <li>• Database-driven content management</li>
                  <li>• Real-time WebSocket communication</li>
                  <li>• Multi-client synchronization</li>
                  <li>• Game session persistence</li>
                  <li>• Broadcasting and recording tools</li>
                  <li>• Analytics and reporting</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Animated background elements */}
          <motion.div
            className="absolute top-20 left-20 w-4 h-4 bg-yellow-400 rounded-full opacity-60"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
              x: [0, 10, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-6 h-6 bg-blue-400 rounded-full opacity-40"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.8, 0.4],
              x: [0, -15, 0],
              y: [0, 15, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
          />
          <motion.div
            className="absolute top-1/2 left-10 w-3 h-3 bg-purple-400 rounded-full opacity-50"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.5, 0.9, 0.5],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host" element={<HostControlPanel />} />
        <Route path="/game" element={<GameScreenTVQuality />} />
        <Route path="/buzzer" element={<PlayerBuzzer />} />
        <Route path="/audience" element={<AudienceDisplay />} />
        <Route path="/cms" element={<ContentManagementSystem />} />
        <Route path="/broadcast" element={<BroadcastingStudio />} />
      </Routes>
    </BrowserRouter>
  );
}

