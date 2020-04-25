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
 * Require constants
 */
const {
  CHAT_MESSAGE,
  CHOOSE_CARD,
  CHOOSE_CARD_RESPONSE,
  CREATE_LOBBY,
  END_TURN,
  FETCH_GAME,
  FETCH_LOBBY,
  FETCH_LOBBY_LIST,
  FETCH_PLAYER_INFO,
  GET_MESSAGES,
  JOIN_GAME,
  JOIN_LOBBY,
  JOIN_SLOT,
  LEAVE_GAME,
  LOAD_PRESET_BOARD,
  REQUEST_INDIVIDUAL_START_GAME,
  RESET_LOBBY,
  RESTART_GAME,
  SAVE_LATEST_TIME,
  SET_CLUE,
  START_GAME,
  UPDATE_GAME,
  UPDATE_LOBBY,
  UPDATE_LOBBY_LIST,
  UPDATE_NOTIFICATION,
  UPDATE_PLAYER_INFO,
} = require("./constants/Actions");
const { FIELD_OPERATIVE, SPYMASTER } = require("./constants/Roles");

// For now, lobbyId sbould be equal to gameId
let lobbyList = {}; // lobbyId : Lobby
let gameList = {}; // gameId : Game
let nextLobbyNumber = 1;

const seedLobbyList = (lobbyList) => {
  for (let i = 1; i <= 10; ++i) {
    const lobby = new Lobby(i); // Create new lobby
    lobbyList[lobby.getId()] = lobby; // Add lobby by id to list of lobbies
  }
};

/**
 * Start socket server with `on` method.
 * Listen for action types
 * Emit action payload
 */
io.on("connection", (socket) => {
  console.log("A user connected :D");

  // Upon entering the HomeScreen
  let player = new Player(socket.id); // Create Player object
  let lobby = null; // Placeholder for Player's current Lobby object
  let game = null; // Placeholder for Player's current Game object

  // Upon loading the HomeScreen
  socket.on(FETCH_LOBBY_LIST, () => {
    emitUpdateLobbyList();
  });

  // Upon pressing the 'Create Lobby' button
  socket.on(CREATE_LOBBY, () => {
    lobby = new Lobby(nextLobbyNumber++); // Create new lobby and increment nextLobbyNumber
    lobbyList[lobby.getId()] = lobby; // Add lobby by id to list of lobbies
    emitUpdateLobbyListAll(); // Update all connected sockets that are subscribed to lobby list updates
  });

  // Upon pressing the 'Join Lobby' button
  socket.on(JOIN_LOBBY, (payload) => {
    const { name, lobbyId } = payload;

    player.setName(name); // Set Player name
    lobby = lobbyList[lobbyId]; // Set Lobby
  });

  // Upon loading the LobbyScreen
  socket.on(FETCH_LOBBY, () => {
    emitUpdateLobby();
  });

  // Upon joining a slot
  socket.on(JOIN_SLOT, (payload) => {
    const { team, index } = payload;
    if (lobby && team && index >= 0) {
      lobby.insertPlayerIntoSlot(player, team, index);
      emitUpdateLobbyAll();
    }
  });

  // Upon *anyone* pressing the 'Start Game' button
  socket.on(START_GAME, () => {
    if (lobby) {
      let newGame = new Game(lobby.getId(), lobby.getPlayerList()); // Create new Game
      newGame.startGame(); // Generate the game info and board
      gameList[lobby.getId()] = newGame; // Add game by id to list of games
      io.emit(REQUEST_INDIVIDUAL_START_GAME); // Request that each player start the game themselves
    }
  });

  // To start the process for each player / Upon pressing the 'Join Game' button
  socket.on(JOIN_GAME, () => {
    if (lobby) {
      game = gameList[lobby.getId()]; // Get the corresponding Game object for the Player's Lobby
    }
    if (game) {
      player = game.getPlayerById(socket.id); // Get their latest Player object
    }
    if (lobby && player) {
      joinRoom(lobby, player); // Join room based on lobby id and player role
    }
  });

  // Upon loading the GameScreen
  socket.on(FETCH_PLAYER_INFO, () => {
    emitUpdatePlayerInfo(); // Send latest Player object to client
  });

  // Upon loading the GameScreen
  socket.on(FETCH_GAME, () => {
    emitUpdateGame(); // Send latest Game object to client
  });

  socket.on(UPDATE_NOTIFICATION, () => {
    emitUpdateGameAll();
  });

  // Handle LOAD_PRESET_BOARD
  socket.on(LOAD_PRESET_BOARD, () => {
    if (game) {
      game.loadPresetBoard();
      emitUpdateGameAll();
    }
  });

  // Upon pressing a card
  socket.on(CHOOSE_CARD, (payload) => {
    if (game) {
      let res = game.chooseCard(payload.row, payload.col);
      emitUpdateGameAll();
      io.emit(CHOOSE_CARD_RESPONSE, res); // Sends the answer back to all clients whether the guess was correct or not
    }
  });

  // Upon anyone pressing the 'End Turn' button
  socket.on(END_TURN, () => {
    if (game) {
      game.endTurnFromPlayer(socket.id);
      emitUpdateGameAll();
    }
  });

  // Upon anyone pressing the 'Restart Game' button
  socket.on(RESTART_GAME, () => {
    if (game) {
      game.restartGame();
      emitUpdateGameAll();
    }
  });

  // Upon anyone pressing the 'Reset Lobby' button
  socket.on(RESET_LOBBY, () => {
    if (game) {
      game.resetLobby();
      emitUpdateLobbyAll();
    }
  });

  // Handle CHAT_MESSAGE
  socket.on(CHAT_MESSAGE, (payload) => {
    let chatHistory = [];
    if (game) {
      game.saveChatMessages(payload);
      chatHistory = game.getChatMessages();
      io.emit(CHAT_MESSAGE, payload);
    }
  });

  socket.on(SAVE_LATEST_TIME, (payload) => {
    if (game) {
      game.setTimeOfLatestMessage(payload);
      emitUpdateGameAll();
    }
  });

  /**
   * Handle SET_CLUE
   * Expected payload:
   * { word: "string", number: int }
   */
  socket.on(SET_CLUE, (payload) => {
    if (game) {
      game.setClue(payload);
      emitUpdateGameAll();
    }
  });

  // Upon loading the GameScreen
  socket.on(GET_MESSAGES, () => {
    emitChatMessages();
  });

  // Upon pressing the 'Leave Game' button
  socket.on(LEAVE_GAME, () => {
    handleLeaveGame();
  });

  // Upon disconnecting
  socket.on("disconnect", () => {
    handleLeaveGame();
  });

  // Handle this player leaving the game
  const handleLeaveGame = () => {
    if (lobby && game) {
      lobby.removePlayer(socket.id);
      game.removePlayer(socket.id);
      leaveAllRooms();
      emitUpdateGameAll();
    }
  };

  //Emit CHAT_MESSAGE -> send current messages
  const emitChatMessages = () => {
    if (game) {
      let chatHistory = game.getChatMessages();
      // Send to the player on this socket the corresponding game information based on their role
      io.to(socket.id).emit(GET_MESSAGES, chatHistory);
    }
  };

  // Emit UPDATE_GAME
  const emitUpdateGame = () => {
    if (game) {
      let res = game.getGameById(socket.id);
      // Send to the player on this socket the corresponding game information based on their role
      io.to(socket.id).emit(UPDATE_GAME, res);
    }
  };

  // Emit UPDATE_GAME to all
  const emitUpdateGameAll = () => {
    if (game) {
      io.to("lobby-" + lobby.getId() + "-spymasters").emit(
        UPDATE_GAME,
        game.getGameByRole(SPYMASTER)
      );
      io.to("lobby-" + lobby.getId() + "-fieldOperatives").emit(
        UPDATE_GAME,
        game.getGameByRole(FIELD_OPERATIVE)
      );
    }
  };

  // Emit UPDATE_LOBBY
  const emitUpdateLobby = () => {
    if (lobby) {
      let res = lobby.getLobby();

      io.to(socket.id).emit(UPDATE_LOBBY, res);
    }
  };

  // Emit UPDATE_LOBBY to all
  const emitUpdateLobbyAll = () => {
    if (lobby) {
      let res = lobby.getLobby();

      io.emit(UPDATE_LOBBY, res);
    }
  };

  // Emit UPDATE_LOBBY_LIST
  const emitUpdateLobbyList = () => {
    io.to(socket.id).emit(UPDATE_LOBBY_LIST, lobbyList);
  };

  // Emit UPDATE_LOBBY_LIST to all
  const emitUpdateLobbyListAll = () => {
    io.emit(UPDATE_LOBBY_LIST, lobbyList);
  };

  // Emit UPDATE_PLAYER_INFO
  const emitUpdatePlayerInfo = () => {
    if (player) {
      io.to(socket.id).emit(UPDATE_PLAYER_INFO, player.getPlayer());
    } else {
      console.log("emitUpdatePlayerInfo: No player provided");
    }
  };

  /**
   * Join appropriate room depending on lobby number and player role
   * @param {Lobby} lobby
   * @param {Player} player
   */
  const joinRoom = (lobby, player) => {
    let room = "lobby-";

    if (lobby) {
      const lobbyId = lobby.getId();
      room += lobbyId + "-";
    } else {
      console.log("joinRoom: No lobby provided.");
      return;
    }

    if (player) {
      const { role } = player;

      if (role === FIELD_OPERATIVE) {
        room += "fieldOperatives";
      } else if (role === SPYMASTER) {
        room += "spymasters";
      } else {
        console.log("joinRoom: No role provided.");
        return;
      }
    } else {
      console.log("joinRoom: No player provided.");
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
  seedLobbyList(lobbyList);
});
server.on("Error", (err) => onError(err, port));
server.on("Listening", () => onListening(server));

module.exports = server;
