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
let players = [];
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

/**
 * Start socket server with `on` method.
 * Listen for action types
 * Emit action payload
 */
io.on("connection", socket => {
  console.log("A user connected :D");

  // Handle SEND_PLAYER_INFO
  socket.on(SEND_PLAYER_INFO, payload => {
    const { name, team, role } = payload;

    // TODO: Add player to list of players
    // Ideally, push to players array a Player object
    // containing socket_id, name, team, role
    console.log(payload, socket.id);

    if (role === SPYMASTER) {
      socket.join("lobby-spymasters");
    } else {
      socket.join("lobby-fieldOperatives");
    }
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
