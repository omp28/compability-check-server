const { rooms } = require("../models/GameRoom");
const socketService = require("../services/socket");
const { questions } = require("../config/config");
const { gifService } = require("../services/gifService");

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
            totalQuestions: questions.length,
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

    socket.on("request_gif", async ({ roomCode, matchData }) => {
      const room = rooms.get(roomCode);
      if (!room) {
        socket.emit("gif_error", "Room not found");
        return;
      }

      // Notify both users
      io.to(roomCode).emit("gif_generation_started");

      const result = await gifService.generateGif(matchData);

      if (result.success) {
        // Broadcast the GIF URL
        io.to(roomCode).emit("gif_generated", {
          success: true,
          url: result.data,
        });
      } else {
        io.to(roomCode).emit("gif_error", result.error);
      }
    });

    socket.on("disconnect", () => {
      if (currentRoom) {
        currentRoom.removePlayer(socket.id);
        socket.to(currentRoom.roomCode).emit("partner_disconnected");
      }
    });
  });
}

module.exports = { setupSocketHandlers };
