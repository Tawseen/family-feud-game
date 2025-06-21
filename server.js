import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url );
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app );

const io = new Server(httpServer, {
  cors: { origin: "*" },
} );

const PORT = process.env.PORT || 3000;

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPyh3wZXMXRivI7qwd3TL6dD5LQq5NLWjkfqNtCOKaM70Ptu8DUoGT8cnwxAceSq-mpTNb0nQaZBqb/pub?gid=883847407&single=true&output=csv";

let questionsData = {};
let categories = [];

async function loadQuestions( ) {
  const res = await fetch(CSV_URL);
  const csvText = await res.text();
  const records = parse(csvText, { columns: true, skip_empty_lines: true });

  const categorySet = new Set();
  const questionsByCategory = {};

  for (const row of records) {
    const cat = row["Category"];
    const qid = row["Question ID"];
    const questionText = row["Question"];
    if (!cat || !qid || !questionText) continue;

    categorySet.add(cat);

    const answers = [];
    for (let i = 1; i <= 8; i++) {
      const ansCol = `Answer${i}`;
      const ptsCol = `Score${i}`;
      if (row[ansCol]) {
        answers.push({ 
          text: row[ansCol], 
          points: Number(row[ptsCol]) || 0, 
          revealed: false 
        });
      }
    }

    if (!questionsByCategory[cat]) questionsByCategory[cat] = [];
    questionsByCategory[cat].push({ id: qid, question: questionText, answers });
  }

  categories = [...categorySet];
  questionsData = questionsByCategory;
}

// Serve frontend build
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/api/categories", (req, res) => {
  res.json(categories);
});

app.get("/api/questions", (req, res) => {
  const cat = req.query.category;
  if (!cat || !questionsData[cat]) return res.status(404).json({ error: "Category not found" });
  res.json(questionsData[cat]);
});

// Enhanced game state with professional features
let gameState = {
  // Basic game info
  gameId: null,
  teamAName: "Team A",
  teamBName: "Team B",
  teamAScore: 0,
  teamBScore: 0,
  
  // Question management
  currentQuestionIndex: 0,
  questions: [],
  category: null,
  
  // Game control
  strikes: 0,
  maxStrikes: 3,
  roundActive: false,
  gameStarted: false,
  gamePaused: false,
  
  // Timer system
  timerActive: false,
  timerDuration: 30, // seconds
  timerRemaining: 30,
  timerStartTime: null,
  
  // Host controls
  hostConnected: false,
  audienceMode: false,
  
  // Sound effects
  soundEffects: {
    correctAnswer: false,
    wrongAnswer: false,
    buzzer: false,
    applause: false,
    gameStart: false,
    roundEnd: false
  },
  
  // Game history
  gameHistory: [],
  currentRound: 1,
  
  // Display settings
  showScores: true,
  showStrikes: true,
  showTimer: true,
  
  // Fast money round
  fastMoneyActive: false,
  fastMoneyAnswers: [],
  fastMoneyScore: 0
};

// Store connected clients by type
let connectedClients = {
  hosts: new Set(),
  players: new Set(),
  audience: new Set()
};

// Timer management
let timerInterval = null;

function startTimer(duration = 30) {
  if (timerInterval) clearInterval(timerInterval);
  
  gameState.timerActive = true;
  gameState.timerDuration = duration;
  gameState.timerRemaining = duration;
  gameState.timerStartTime = Date.now();
  
  timerInterval = setInterval(() => {
    gameState.timerRemaining--;
    
    if (gameState.timerRemaining <= 0) {
      gameState.timerActive = false;
      gameState.timerRemaining = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      
      // Emit timer expired event
      io.emit("timerExpired");
    }
    
    // Broadcast timer update
    io.emit("timerUpdate", {
      remaining: gameState.timerRemaining,
      active: gameState.timerActive
    });
  }, 1000);
  
  io.emit("timerStarted", { duration, remaining: gameState.timerRemaining });
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState.timerActive = false;
  io.emit("timerStopped");
}

function resetTimer(duration = 30) {
  stopTimer();
  gameState.timerDuration = duration;
  gameState.timerRemaining = duration;
  io.emit("timerReset", { duration });
}

// Sound effect management
function triggerSoundEffect(effect) {
  gameState.soundEffects[effect] = true;
  io.emit("soundEffect", effect);
  
  // Reset sound effect flag after a short delay
  setTimeout(() => {
    gameState.soundEffects[effect] = false;
  }, 100);
}

// Game state management functions
function resetGame() {
  stopTimer();
  gameState = {
    ...gameState,
    teamAScore: 0,
    teamBScore: 0,
    currentQuestionIndex: 0,
    strikes: 0,
    roundActive: false,
    gameStarted: false,
    gamePaused: false,
    timerActive: false,
    timerRemaining: 30,
    fastMoneyActive: false,
    fastMoneyAnswers: [],
    fastMoneyScore: 0,
    questions: gameState.questions.map(q => ({
      ...q,
      answers: q.answers.map(a => ({ ...a, revealed: false }))
    }))
  };
  
  io.emit("gameState", gameState);
  triggerSoundEffect("gameStart");
}

function nextQuestion() {
  if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
    gameState.currentQuestionIndex++;
    gameState.strikes = 0;
    resetTimer();
    
    // Reset all answers for new question
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (currentQuestion) {
      currentQuestion.answers.forEach(answer => {
        answer.revealed = false;
      });
    }
    
    io.emit("gameState", gameState);
    io.emit("questionChanged", {
      questionIndex: gameState.currentQuestionIndex,
      question: currentQuestion
    });
  }
}

function previousQuestion() {
  if (gameState.currentQuestionIndex > 0) {
    gameState.currentQuestionIndex--;
    gameState.strikes = 0;
    resetTimer();
    
    io.emit("gameState", gameState);
    io.emit("questionChanged", {
      questionIndex: gameState.currentQuestionIndex,
      question: gameState.questions[gameState.currentQuestionIndex]
    });
  }
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send initial game state
  socket.emit("gameState", gameState);
  socket.emit("categories", categories);

  // Client type registration
  socket.on("registerClient", (clientType) => {
    if (clientType === "host") {
      connectedClients.hosts.add(socket.id);
      gameState.hostConnected = true;
      socket.emit("hostRegistered");
    } else if (clientType === "player") {
      connectedClients.players.add(socket.id);
    } else if (clientType === "audience") {
      connectedClients.audience.add(socket.id);
    }
    
    io.emit("clientsUpdate", {
      hosts: connectedClients.hosts.size,
      players: connectedClients.players.size,
      audience: connectedClients.audience.size
    });
  });

  // Game control events (host only)
  socket.on("startGame", ({ category, teamAName, teamBName }) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    if (!category || !questionsData[category]) {
      socket.emit("error", "Invalid category");
      return;
    }

    gameState.gameId = Date.now().toString();
    gameState.teamAName = teamAName || "Team A";
    gameState.teamBName = teamBName || "Team B";
    gameState.category = category;
    gameState.questions = questionsData[category].map(q => ({
      ...q,
      answers: q.answers.map(a => ({ ...a, revealed: false }))
    }));
    gameState.gameStarted = true;
    gameState.roundActive = true;
    gameState.currentQuestionIndex = 0;
    gameState.strikes = 0;
    
    io.emit("gameState", gameState);
    triggerSoundEffect("gameStart");
  });

  socket.on("pauseGame", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.gamePaused = !gameState.gamePaused;
    if (gameState.gamePaused) {
      stopTimer();
    }
    io.emit("gameState", gameState);
  });

  socket.on("resetGame", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    resetGame();
  });

  socket.on("nextQuestion", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    nextQuestion();
  });

  socket.on("previousQuestion", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    previousQuestion();
  });

  // Answer management
  socket.on("revealAnswer", (answerIndex) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q || answerIndex < 0 || answerIndex >= q.answers.length) return;

    if (!q.answers[answerIndex].revealed) {
      q.answers[answerIndex].revealed = true;
      triggerSoundEffect("correctAnswer");
      
      io.emit("answerRevealed", {
        questionIndex: gameState.currentQuestionIndex,
        answerIndex,
        answer: q.answers[answerIndex]
      });
    }
    
    io.emit("gameState", gameState);
  });

  socket.on("hideAnswer", (answerIndex) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q || answerIndex < 0 || answerIndex >= q.answers.length) return;

    q.answers[answerIndex].revealed = false;
    io.emit("gameState", gameState);
  });

  socket.on("revealAllAnswers", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q) return;

    q.answers.forEach(answer => {
      answer.revealed = true;
    });
    
    io.emit("gameState", gameState);
    triggerSoundEffect("applause");
  });

  // Score management
  socket.on("updateScores", ({ teamAScore, teamBScore }) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    if (teamAScore !== undefined) gameState.teamAScore = Math.max(0, teamAScore);
    if (teamBScore !== undefined) gameState.teamBScore = Math.max(0, teamBScore);
    
    io.emit("gameState", gameState);
    io.emit("scoresUpdated", {
      teamAScore: gameState.teamAScore,
      teamBScore: gameState.teamBScore
    });
  });

  socket.on("addPoints", ({ team, points }) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    if (team === "A") {
      gameState.teamAScore = Math.max(0, gameState.teamAScore + points);
    } else if (team === "B") {
      gameState.teamBScore = Math.max(0, gameState.teamBScore + points);
    }
    
    io.emit("gameState", gameState);
    triggerSoundEffect("correctAnswer");
  });

  // Strike management
  socket.on("addStrike", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    if (gameState.strikes < gameState.maxStrikes) {
      gameState.strikes++;
      triggerSoundEffect("wrongAnswer");
      
      if (gameState.strikes >= gameState.maxStrikes) {
        triggerSoundEffect("buzzer");
        io.emit("maxStrikesReached");
      }
    }
    
    io.emit("gameState", gameState);
  });

  socket.on("removeStrike", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.strikes = Math.max(0, gameState.strikes - 1);
    io.emit("gameState", gameState);
  });

  socket.on("resetStrikes", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.strikes = 0;
    io.emit("gameState", gameState);
  });

  // Timer controls
  socket.on("startTimer", (duration) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    startTimer(duration || 30);
  });

  socket.on("stopTimer", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    stopTimer();
  });

  socket.on("resetTimer", (duration) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    resetTimer(duration || 30);
  });

  // Sound effects
  socket.on("playSoundEffect", (effect) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    triggerSoundEffect(effect);
  });

  // Display controls
  socket.on("toggleAudienceMode", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.audienceMode = !gameState.audienceMode;
    io.emit("gameState", gameState);
  });

  socket.on("updateDisplaySettings", (settings) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.showScores = settings.showScores ?? gameState.showScores;
    gameState.showStrikes = settings.showStrikes ?? gameState.showStrikes;
    gameState.showTimer = settings.showTimer ?? gameState.showTimer;
    
    io.emit("gameState", gameState);
  });

  // Fast Money round
  socket.on("startFastMoney", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.fastMoneyActive = true;
    gameState.fastMoneyAnswers = [];
    gameState.fastMoneyScore = 0;
    
    io.emit("gameState", gameState);
    triggerSoundEffect("gameStart");
  });

  socket.on("endFastMoney", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.fastMoneyActive = false;
    io.emit("gameState", gameState);
  });

  // Player buzzer system
  socket.on("playerBuzz", (playerData) => {
    if (!gameState.roundActive || gameState.gamePaused) return;
    
    io.emit("playerBuzzed", {
      playerId: socket.id,
      playerName: playerData.name || "Unknown Player",
      timestamp: Date.now()
    });
    
    triggerSoundEffect("buzzer");
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    
    // Remove from all client sets
    connectedClients.hosts.delete(socket.id);
    connectedClients.players.delete(socket.id);
    connectedClients.audience.delete(socket.id);
    
    // Update host connection status
    if (connectedClients.hosts.size === 0) {
      gameState.hostConnected = false;
    }
    
    io.emit("clientsUpdate", {
      hosts: connectedClients.hosts.size,
      players: connectedClients.players.size,
      audience: connectedClients.audience.size
    });
  });
});

// Cleanup timer on server shutdown
process.on("SIGINT", () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  process.exit();
});

// Catch-all route for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

httpServer.listen(PORT, async ( ) => {
  await loadQuestions();
  console.log(`Enhanced Family Feud Server running on http://localhost:${PORT}` );
  console.log(`Categories loaded: ${categories.length}`);
  console.log(`Total questions: ${Object.values(questionsData).reduce((sum, questions) => sum + questions.length, 0)}`);
});
