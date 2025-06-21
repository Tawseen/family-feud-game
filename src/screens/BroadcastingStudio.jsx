import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const BroadcastingStudio = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState('audience');
  const [overlaySettings, setOverlaySettings] = useState({
    showLogo: true,
    showScores: true,
    showTimer: true,
    showStrikes: true,
    logoPosition: 'top-right',
    theme: 'default'
  });
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isPaused: false,
    duration: 0
  });
  const [streamSettings, setStreamSettings] = useState({
    quality: 'HD',
    framerate: 30,
    bitrate: 2500
  });

  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('registerClient', 'broadcaster');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    // Update recording duration
    let interval;
    if (recordingState.isRecording && !recordingState.isPaused) {
      interval = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recordingState.isRecording, recordingState.isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: 1920,
          height: 1080,
          frameRate: streamSettings.framerate
        },
        audio: true
      });

      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: streamSettings.bitrate * 1000
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family-feud-recording-${new Date().toISOString()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start();
      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setRecordingState(prev => ({
        ...prev,
        isPaused: !prev.isPaused
      }));
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const exportGameData = () => {
    if (!gameState) return;

    const exportData = {
      gameInfo: {
        sessionId: gameState.sessionId,
        teamAName: gameState.teamAName,
        teamBName: gameState.teamBName,
        category: gameState.category,
        timestamp: new Date().toISOString()
      },
      finalScores: {
        teamA: gameState.teamAScore,
        teamB: gameState.teamBScore
      },
      questions: gameState.questions?.map((q, index) => ({
        questionNumber: index + 1,
        question: q.question,
        answers: q.answers.map(a => ({
          text: a.text,
          points: a.points,
          revealed: a.revealed
        }))
      })),
      gameStats: {
        totalAnswersRevealed: gameState.totalAnswersRevealed,
        gameStartTime: gameState.gameStartTime,
        currentRound: gameState.currentRound
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-feud-game-${gameState.sessionId || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentQuestion = gameState?.questions?.[gameState?.currentQuestionIndex];

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Connecting to Broadcasting Server...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Broadcasting Studio</h1>
            <p className="text-gray-200 mt-1">Professional broadcast controls and streaming</p>
          </div>
          
          {/* Recording Status */}
          <div className="flex items-center space-x-4">
            {recordingState.isRecording && (
              <motion.div
                className="flex items-center space-x-2"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">REC {formatDuration(recordingState.duration)}</span>
              </motion.div>
            )}
            
            <div className={`px-3 py-1 rounded-full text-sm ${
              connected ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Preview */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Broadcast Preview</h2>
              
              {/* Preview Window */}
              <div className="bg-black rounded-lg aspect-video relative overflow-hidden mb-4">
                {gameState?.gameStarted ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
                    {/* Overlay Logo */}
                    {overlaySettings.showLogo && (
                      <div className={`absolute ${
                        overlaySettings.logoPosition === 'top-left' ? 'top-4 left-4' :
                        overlaySettings.logoPosition === 'top-right' ? 'top-4 right-4' :
                        overlaySettings.logoPosition === 'bottom-left' ? 'bottom-4 left-4' :
                        'bottom-4 right-4'
                      } bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2`}>
                        <span className="text-sm font-bold">FAMILY FEUD</span>
                      </div>
                    )}
                    
                    {/* Scores Overlay */}
                    {overlaySettings.showScores && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-8">
                        <div className="bg-blue-600 rounded-lg px-4 py-2">
                          <div className="text-sm">{gameState.teamAName}</div>
                          <div className="text-xl font-bold">{gameState.teamAScore}</div>
                        </div>
                        <div className="bg-red-600 rounded-lg px-4 py-2">
                          <div className="text-sm">{gameState.teamBName}</div>
                          <div className="text-xl font-bold">{gameState.teamBScore}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Timer Overlay */}
                    {overlaySettings.showTimer && gameState.timerActive && (
                      <div className="absolute top-20 right-4 bg-yellow-600 rounded-full w-16 h-16 flex items-center justify-center">
                        <span className="text-lg font-bold">{gameState.timerRemaining}</span>
                      </div>
                    )}
                    
                    {/* Strikes Overlay */}
                    {overlaySettings.showStrikes && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {Array.from({ length: gameState.maxStrikes || 3 }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-6 h-6 rounded-full border-2 border-white ${
                              index < (gameState.strikes || 0) ? 'bg-red-500' : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Current Question */}
                    {currentQuestion && (
                      <div className="absolute bottom-16 left-4 right-4 bg-black bg-opacity-50 rounded-lg p-4">
                        <p className="text-lg font-medium text-center">{currentQuestion.question}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-400 mb-2">No Active Game</h3>
                      <p className="text-gray-500">Start a game to see broadcast preview</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Recording Controls */}
              <div className="flex space-x-4">
                {!recordingState.isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={pauseRecording}
                      className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg font-medium"
                    >
                      {recordingState.isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={stopRecording}
                      className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium"
                    >
                      Stop Recording
                    </button>
                  </>
                )}
                
                <button
                  onClick={exportGameData}
                  disabled={!gameState?.gameStarted}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-medium"
                >
                  Export Game Data
                </button>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Broadcast Mode */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Broadcast Mode</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="broadcastMode"
                    value="audience"
                    checked={broadcastMode === 'audience'}
                    onChange={(e) => setBroadcastMode(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Audience View</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="broadcastMode"
                    value="host"
                    checked={broadcastMode === 'host'}
                    onChange={(e) => setBroadcastMode(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Host View</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="broadcastMode"
                    value="split"
                    checked={broadcastMode === 'split'}
                    onChange={(e) => setBroadcastMode(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Split Screen</span>
                </label>
              </div>
            </div>

            {/* Overlay Settings */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Overlay Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span>Show Logo</span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showLogo}
                    onChange={(e) => setOverlaySettings({
                      ...overlaySettings,
                      showLogo: e.target.checked
                    })}
                    className="text-blue-600"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span>Show Scores</span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showScores}
                    onChange={(e) => setOverlaySettings({
                      ...overlaySettings,
                      showScores: e.target.checked
                    })}
                    className="text-blue-600"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span>Show Timer</span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showTimer}
                    onChange={(e) => setOverlaySettings({
                      ...overlaySettings,
                      showTimer: e.target.checked
                    })}
                    className="text-blue-600"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span>Show Strikes</span>
                  <input
                    type="checkbox"
                    checked={overlaySettings.showStrikes}
                    onChange={(e) => setOverlaySettings({
                      ...overlaySettings,
                      showStrikes: e.target.checked
                    })}
                    className="text-blue-600"
                  />
                </label>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Logo Position</label>
                  <select
                    value={overlaySettings.logoPosition}
                    onChange={(e) => setOverlaySettings({
                      ...overlaySettings,
                      logoPosition: e.target.value
                    })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stream Settings */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Stream Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quality</label>
                  <select
                    value={streamSettings.quality}
                    onChange={(e) => setStreamSettings({
                      ...streamSettings,
                      quality: e.target.value
                    })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  >
                    <option value="4K">4K (3840x2160)</option>
                    <option value="HD">HD (1920x1080)</option>
                    <option value="720p">720p (1280x720)</option>
                    <option value="480p">480p (854x480)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Frame Rate</label>
                  <select
                    value={streamSettings.framerate}
                    onChange={(e) => setStreamSettings({
                      ...streamSettings,
                      framerate: parseInt(e.target.value)
                    })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  >
                    <option value={60}>60 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={24}>24 FPS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Bitrate (kbps)</label>
                  <input
                    type="number"
                    value={streamSettings.bitrate}
                    onChange={(e) => setStreamSettings({
                      ...streamSettings,
                      bitrate: parseInt(e.target.value) || 2500
                    })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                    min="500"
                    max="10000"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-medium">
                  Go Live
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium">
                  Take Screenshot
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-medium">
                  Switch Scene
                </button>
                <button className="w-full bg-orange-600 hover:bg-orange-700 py-2 rounded-lg font-medium">
                  Add Lower Third
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastingStudio;

