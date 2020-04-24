#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require("./app");
const http = require("http");
const normalizePort = require("./utils/normalizePort");
const onError = require("./utils/onError");
const onListening = require("./utils/onListening");

/**
 * Classes
 */
const Player = require("./classes/Player");
const Lobby = require("./classes/Lobby");
const Game = require("./classes/Game");

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Create socket connection to listen to the server
 */
const io = require("socket.io").listen(server);

/**
 * Game data
 */
let game = new Game();

/**
 * Require constants
 */
const {
  CHAT_MESSAGE,
  CHOOSE_CARD,
  CHOOSE_CARD_RESPONSE,
  CREATE_LOBBY,
  END_TURN,
  GET_MESSAGES,
  SAVE_LATEST_TIME,
  UPDATE_NOTIFICATION,
  GET_GAME,
  GET_PLAYER_INFO,
  FETCH_TEAMS,
  JOIN_GAME,
  JOIN_LOBBY,
  JOIN_SLOT,
  LEAVE_GAME,
  LOAD_PRESET_BOARD,
  REQUEST_INDIVIDUAL_START_GAME,
  RESET_LOBBY,
  RESTART_GAME,
  SET_CLUE,
  START_GAME,
  UPDATE_GAME,
  UPDATE_PLAYER_INFO,
  UPDATE_LOBBY,
  UPDATE_LOBBIES,
} = require("./constants/Actions");
const { FIELD_OPERATIVE, SPYMASTER } = require("./constants/Roles");

let lobbyList = {};
let nextLobbyNumber = 1;

/**
 * Start socket server with `on` method.
 * Listen for action types
 * Emit action payload
 */
io.on("connection", (socket) => {
  console.log("A user connected :D");

  // Upon entering the HomeScreen
  let player = new Player(socket.id); // Create Player object

  // Upon pressing the 'Create Lobby' button
  socket.on(CREATE_LOBBY, () => {
    const lobby = new Lobby(nextLobbyNumber++); // Create new lobby and increment nextLobbyNumber
    lobbyList[lobby.getId()] = lobby; // Add lobby by id to list of lobbies
    emitUpdateLobbies(); // Update all connected sockets that are subscribed to lobby updates
  });

  // Upon pressing the 'Join Lobby' button
  socket.on(JOIN_LOBBY, (payload) => {
    const { name, lobby } = payload;
    player.setName(name); // Set Player name
    player.setLobby(lobby);
  });

  // Upon loading the LobbyView
  socket.on(FETCH_TEAMS, () => {
    emitUpdateTeams();
  });

  // Upon joining a slot
  socket.on(JOIN_SLOT, (payload) => {
    const { team, index } = payload;
    game.insertPlayerIntoSlot(player, team, index);
    emitUpdateTeams();
  });

  // Upon *anyone* pressing the 'Start Game' button
  socket.on(START_GAME, () => {
    game.startGame(); // Generate the game info and board
    io.emit(REQUEST_INDIVIDUAL_START_GAME); // Request that each player start the game themselves
  });

  // To start the process for each player / Upon pressing the 'Join Game' button
  socket.on(JOIN_GAME, () => {
    const player = game.getPlayerById(socket.id); // Get their latest Player object
    if (player) {
      joinRoomByLobbyAndRole(player.getLobby(), player.getRole()); // Join the appropriate room, depending on their role
    }
  });

  // Upon loading the GameScreen
  socket.on(GET_PLAYER_INFO, () => {
    const player = game.getPlayerById(socket.id);
    if (player) {
      io.to(socket.id).emit(UPDATE_PLAYER_INFO, player.getPlayer());
    }
  });

  // Upon loading the GameScreen
  socket.on(GET_GAME, () => {
    console.log(socket.id, socket.rooms);
    emitUpdateGame();
  });

  socket.on(UPDATE_NOTIFICATION, () => {
    emitUpdateGameAll();
  });

  // Handle LOAD_PRESET_BOARD
  socket.on(LOAD_PRESET_BOARD, () => {
    game.loadPresetBoard();
    emitUpdateGameAll();
  });

  // Upon pressing a card
  socket.on(CHOOSE_CARD, (payload) => {
    let res = game.chooseCard(payload.row, payload.col);
    emitUpdateGameAll();
    io.emit(CHOOSE_CARD_RESPONSE, res); // Sends the answer back to all clients whether the guess was correct or not
  });

  // Upon anyone pressing the 'End Turn' button
  socket.on(END_TURN, () => {
    game.endTurnFromPlayer(socket.id);
    emitUpdateGameAll();
  });

  // Upon anyone pressing the 'Restart Game' button
  socket.on(RESTART_GAME, () => {
    game.restartGame();
    emitUpdateGameAll();
  });

  // Upon pressing the 'Leave Game' button
  socket.on(LEAVE_GAME, () => {
    game.handleLeaveGame(socket.id); // Handle this player leaving the game
    leaveAllRooms();
    emitUpdateGameAll();
  });

  // Upon anyone pressing the 'Reset Lobby' button
  socket.on(RESET_LOBBY, () => {
    game.resetLobby();
    emitUpdateTeams();
  });

  // Handle CHAT_MESSAGE
  socket.on(CHAT_MESSAGE, (payload) => {
    let chatHistory = [];
    game.saveChatMessages(payload);
    chatHistory = game.getChatMessages();
    io.emit(CHAT_MESSAGE, payload);
  });

  socket.on(SAVE_LATEST_TIME, (payload) => {
    game.setTimeOfLatestMessage(payload);
    emitUpdateGameAll();
  });

  /**
   * Handle SET_CLUE
   * Expected payload:
   * { word: "string", number: int }
   */
  socket.on(SET_CLUE, (payload) => {
    game.setClue(payload);
    emitUpdateGameAll();
  });

  // Upon loading the GameScreen
  socket.on(GET_MESSAGES, () => {
    emitChatMessages();
  });

  //Emit CHAT_MESSAGE -> send current messages
  const emitChatMessages = () => {
    let chatHistory = game.getChatMessages();
    // Send to the player on this socket the corresponding game information based on their role
    io.to(socket.id).emit(GET_MESSAGES, chatHistory);
  };

  // Emit UPDATE_GAME
  const emitUpdateGame = () => {
    let res = game.getGameById(socket.id);
    // Send to the player on this socket the corresponding game information based on their role
    io.to(socket.id).emit(UPDATE_GAME, res);
  };

  // Emit UPDATE_GAME to all
  const emitUpdateGameAll = () => {
    io.to("lobby-spymasters").emit(UPDATE_GAME, game.getGameByRole(SPYMASTER));
    io.to("lobby-fieldOperatives").emit(
      UPDATE_GAME,
      game.getGameByRole(FIELD_OPERATIVE)
    );
  };

  // Emit UPDATE_LOBBY
  const emitUpdateTeams = () => {
    io.emit(UPDATE_LOBBY, {
      redTeam: game.getRedTeam(),
      blueTeam: game.getBlueTeam(),
      isGameInProgress: game.getIsGameInProgress(),
    });
  };

  // Emit UPDATE_LOBBIES
  const emitUpdateLobbies = () => {
    io.emit(UPDATE_LOBBIES, lobbyList);
  };

  // Join appropriate room depending on lobby number and role
  const joinRoomByLobbyAndRole = (lobby, role) => {
    let room = "lobby-";

    if (lobby) {
      room += lobby + "-";
    } else {
      console.log("No lobby number provided:", lobby);
      return;
    }

    if (role === FIELD_OPERATIVE) {
      room += "fieldOperatives";
    } else if (role === SPYMASTER) {
      room += "spymasters";
    } else {
      console.log("No role provided:", role);
      return;
    }

    socket.join(room);
  };

  const leaveAllRooms = () => {
    for (let room in socket.rooms) {
      // Except for its own room
      if (room !== socket.id) {
        socket.leave(room);
      }
    }
  };
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, () => {
  console.log("Server running on port:" + port);
});
server.on("Error", (err) => onError(err, port));
server.on("Listening", () => onListening(server));

module.exports = server;
