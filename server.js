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

// For now, lobbyId sbould be equal to gameId
let lobbyList = {}; // lobbyId : Lobby
let gameList = {}; // gameId : Game
let nextLobbyNumber = 1;

const seedLobbyList = (lobbyList) => {
  for (let i = 1; i <= 5; ++i) {
    const lobby = new Lobby(i); // Create new lobby
    lobbyList[lobby.getId()] = lobby; // Add lobby by id to list of lobbies
  }
};

const printLobbyList = (lobbyList) => {
  console.log("lobbyList after seed:");
  for (let i = 1; i <= 5; ++i) {
    console.log(lobbyList[i].getLobby());
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

  // Upon pressing the 'Create Lobby' button
  socket.on(CREATE_LOBBY, () => {
    lobby = new Lobby(nextLobbyNumber++); // Create new lobby and increment nextLobbyNumber
    lobbyList[lobby.getId()] = lobby; // Add lobby by id to list of lobbies
    emitUpdateLobbies(); // Update all connected sockets that are subscribed to lobby updates
  });

  // Upon pressing the 'Join Lobby' button
  socket.on(JOIN_LOBBY, (payload) => {
    const { name, lobbyId } = payload;

    player.setName(name); // Set Player name
    lobby = lobbyList[lobbyId]; // Set Lobby
  });

  // Upon loading the LobbyView
  socket.on(FETCH_TEAMS, () => {
    emitUpdateLobby();
  });

  // Upon joining a slot
  socket.on(JOIN_SLOT, (payload) => {
    const { team, index } = payload;
    lobby.insertPlayerIntoSlot(player, team, index);
    emitUpdateLobby();
  });

  // Upon *anyone* pressing the 'Start Game' button
  socket.on(START_GAME, () => {
    let newGame = new Game(lobby.getId(), lobby.getPlayerList()); // Create new Game
    newGame.startGame(); // Generate the game info and board
    gameList[lobby.getId()] = newGame; // Add game by id to list of games
    io.emit(REQUEST_INDIVIDUAL_START_GAME); // Request that each player start the game themselves
  });

  // To start the process for each player / Upon pressing the 'Join Game' button
  socket.on(JOIN_GAME, () => {
    game = gameList[lobby.getId()]; // Get the corresponding Game object for the Player's Lobby
    player = game.getPlayerById(socket.id); // Get their latest Player object
    emitUpdatePlayerInfo(player); // Send latest Player object to client
    joinRoom(lobby, player); // Join room based on lobby id and player role
  });

  // Upon loading the GameScreen
  socket.on(GET_PLAYER_INFO, () => {
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
    emitUpdateLobby();
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
  const emitUpdateLobby = () => {
    io.emit(UPDATE_LOBBY, {
      redTeam: lobby.getRedTeam(),
      blueTeam: lobby.getBlueTeam(),
      isGameInProgress: lobby.getIsGameInProgress(),
    });
  };

  // Emit UPDATE_LOBBIES
  const emitUpdateLobbies = () => {
    io.emit(UPDATE_LOBBIES, lobbyList);
  };

  const emitUpdatePlayerInfo = (player) => {
    // Send latest Player object to client
    // Emit UPDATE_PLAYER_INFO // Join room based on lobby id and player role
    if (player) {
      io.to(socket.id).emit(UPDATE_PLAYER_INFO, player.getPlayer());
      console.log(
        "emitUpdatePlayerInfo: No player provided // Send latest Player object to client."
      );
    } else {
      // Join room based on lobby id and player role
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
  printLobbyList(lobbyList);
});
server.on("Error", (err) => onError(err, port));
server.on("Listening", () => onListening(server));

module.exports = server;
