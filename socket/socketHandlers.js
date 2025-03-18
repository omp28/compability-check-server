const { rooms } = require("../models/GameRoom");
const socketService = require("../services/socket");
const { questions } = require("../config/config");
const { gifService } = require("../services/gifService");
const { planDateService } = require("../services/planDateService");

function setupSocketHandlers() {
  const io = socketService.getIO();

  io.on("connection", (socket) => {
    let currentRoom = null;

    socket.on("join_game", ({ roomCode, gender }) => {
      const room = rooms.get(roomCode);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

// bug fix 

const existingPlayer = Array.from(room.players.entries()).find(
    ([_, player]) => player.gender === gender
  );
  
  if (existingPlayer) {
    // Update socket ID for reconnecting player
    room.players.delete(existingPlayer[0]); 
    room.players.set(socket.id, {
      gender,
      connected: true,
      answers: existingPlayer[1].answers
    });
    socket.join(roomCode);
    currentRoom = room;
    
    // If both players are now connected, sync the game state
    if (room.players.size === 2 && room.gameStarted) {
      io.to(roomCode).emit("partner_connected");
      const gameState = room.getGameState();
      socket.emit("game_state", gameState);
      
      // If there's an active question, send it
      if (room.currentQuestion < room.questions.length) {
        socket.emit("question", {
          question: room.questions[room.currentQuestion],
          currentQuestion: room.currentQuestion,
          totalQuestions: room.questions.length,
          timeRemaining: room.timeRemaining
        });
      }
    } else {
      socket.emit("game_state", {
        gameStatus: "waiting",
        currentQuestion: 0,
        totalQuestions: room.questions.length,
      });
    }
    return;
  }

      if (room.addPlayer(socket.id, gender)) {
        currentRoom = room;
        socket.join(roomCode);

        if (room.players.size === 2) {
          io.to(roomCode).emit("partner_connected");
          const questionData = room.sendQuestion();
          io.to(roomCode).emit("question", questionData);
        } else {
          socket.emit("game_state", {
            gameStatus: "waiting",
            currentQuestion: 0,
            totalQuestions: room.questions.length,
          });
        }
      } else {
        socket.emit("error", "Could not join room");
      }
    });

    socket.on("submit_answer", ({ roomCode, answer }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      if (room.submitAnswer(socket.id, answer)) {
        io.to(roomCode).emit("answer_submitted", {
          answeredBy: socket.id,
          gameState: room.getGameState(),
        });

        if (room.answers.size === 2) {
          io.to(roomCode).emit("both_answered");

          setTimeout(() => {
            const nextQuestionData = room.sendQuestion();
            if (nextQuestionData) {
              io.to(roomCode).emit("question", nextQuestionData);
            } else {
              const finalScore = room.endGame();
              io.to(roomCode).emit("game_complete", finalScore);
            }
          }, 1000);
        }
      }
    });

    socket.on("request_match_results", async ({ roomCode, matchData }) => {
      const room = rooms.get(roomCode);
      if (!room) {
        socket.emit("match_results_error", "Room not found");
        return;
      }

      // Start both processes independently
      const gifPromise = (async () => {
        try {
          io.to(roomCode).emit("gif_generation_started");
          const result = await gifService.generateGif(matchData);
          io.to(roomCode).emit("gif_generated", {
            success: true,
            url: result.data,
          });
        } catch (error) {
          io.to(roomCode).emit("gif_error", error.message);
        }
      })();

      const datePlanPromise = (async () => {
        try {
          io.to(roomCode).emit("date_planning_started");
          const datePlan = await planDateService.generateDatePlan(matchData);
          io.to(roomCode).emit("date_plan_generated", {
            success: true,
            plan: datePlan,
          });
        } catch (error) {
          io.to(roomCode).emit("date_plan_error", error.message);
        }
      })();

      // Let both processes run independently
      Promise.allSettled([gifPromise, datePlanPromise]).then(() => {
        io.to(roomCode).emit("all_results_complete");
      });
    });

    socket.on("disconnect", () => {
      if (currentRoom) {
      //  currentRoom.removePlayer(socket.id);
        socket.to(currentRoom.roomCode).emit("partner_disconnected");
      }
    });
  });
}

module.exports = { setupSocketHandlers };
