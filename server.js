#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require("./app");
const http = require("http");
const debug = require("debug")("tutorial:server");
const normalizePort = require("./utils/normalizePort");
const onError = require("./utils/onError");
const onListening = require("./utils/onListening");

/**
 * Classes
 */
const Player = require("./classes/Player");
const Board = require("./classes/Board");

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
let redTeam = [];
let blueTeam = [];
let board = new Board();

/**
 * Require constants
 */
const {
  CHAT_MESSAGE,
  CHOOSE_CARD,
  FETCH_BOARD,
  GENERATE_BOARD,
  SEND_PLAYER_INFO,
  UPDATE_BOARD
} = require("./constants/Actions");
const { FIELD_OPERATIVE, SPYMASTER } = require("./constants/Roles");
const { BLUE, RED } = require("./constants/Cards");

const erasePlayerIfOnEitherTeam = targetId => {
  erasePlayerIfOnTeam(targetId, redTeam);
  erasePlayerIfOnTeam(targetId, blueTeam);
};

const erasePlayerIfOnTeam = (targetId, team) => {
  for (let i in team) {
    const player = team[i];

    if (player && player.getId() === targetId) {
      delete team[i];
    }
  }
};

const setPlayerInfo = () => {
  setPlayerInfoForTeam(redTeam);
  setPlayerInfoForTeam(blueTeam);
};

const setPlayerInfoForTeam = team => {
  for (let i in team) {
    team[i].setTeam(team === redTeam ? RED : BLUE);
    if (i !== 0) {
      team[i].setRole(FIELD_OPERATIVE);
    } else {
      team[i].setRole(SPYMASTER);
    }
  }
};

const setPlayerRooms = socket => {
  setPlayerRoomsForTeam(socket, redTeam);
  setPlayerRoomsForTeam(socket, blueTeam);
};

const setPlayerRoomsForTeam = (socket, team) => {
  for (let i in team) {
    if (team[i].role === FIELD_OPERATIVE) {
      socket.join("lobby-fieldOperatives");
    } else {
      socket.join("lobby-spymasters");
    }
  }
};

/**
 * Start socket server with `on` method.
 * Listen for action types
 * Emit action payload
 */
io.on("connection", socket => {
  console.log("A user connected :D");

  // Upon entering the HomeScreen
  let player = new Player(socket.id); // Create Player object

  // Upon pressing the 'Join Lobby' button
  socket.on("JOIN_LOBBY", payload => {
    player.setName(payload); // Set Player name
    console.log("Player's name is:", player.getName());
  });

  // Upon joining a slot
  socket.on("JOIN_SLOT", payload => {
    const { team, index } = payload;

    console.log("joining team", team, "at index:", index);

    // Prevent duplicate players in teams
    erasePlayerIfOnEitherTeam(socket.id);

    // Insert Player into appropriate team and position
    if (team === RED) {
      redTeam[index] = player;
    } else {
      blueTeam[index] = player;
    }

    console.log("Red Team:", redTeam);
    console.log("Blue Team:", blueTeam);
  });

  // Upon pressing the 'Start Game' button
  socket.on("START_GAME", payload => {
    setPlayerInfo();
    setPlayerRooms();
  });

  // Handle FETCH_BOARD
  socket.on(FETCH_BOARD, () => {
    io.emit(UPDATE_BOARD, board.getBoard());
  });

  // Handle GENERATE_BOARD
  socket.on(GENERATE_BOARD, () => {
    board.generateBoard();
    io.emit(UPDATE_BOARD, board.getBoard());
  });

  // Handle CHAT_MESSAGE
  socket.on(CHAT_MESSAGE, payload => {
    io.emit(CHAT_MESSAGE, payload);
  });

  // Handle UPDATE_BOARD
  socket.on(UPDATE_BOARD, payload => {
    io.emit(UPDATE_BOARD, payload);
  });

  // Handle CHOOSE_CARD
  socket.on(CHOOSE_CARD, payload => {
    board.chooseCard(payload.row, payload.col);
    io.emit(UPDATE_BOARD, board.getBoard());
  });
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, () => {
  console.log("Server running on port:" + port);
  board.generateBoard();
});
server.on("Error", err => onError(err, port));
server.on("Listening", () => onListening(server));

module.exports = server;
