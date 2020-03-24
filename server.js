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
let redTeam = new Array(4).fill(null);
let blueTeam = new Array(4).fill(null);
let game = new Game();

/**
 * Require constants
 */
const {
  CHAT_MESSAGE,
  CHOOSE_CARD,
  GET_GAME,
  FETCH_TEAMS,
  INDVIDUAL_START_GAME,
  JOIN_LOBBY,
  JOIN_SLOT,
  REQUEST_INDVIDUAL_START_GAME,
  RESTART_GAME,
  START_GAME,
  UPDATE_GAME,
  UPDATE_TEAMS
} = require("./constants/Actions");
const { FIELD_OPERATIVE, SPYMASTER } = require("./constants/Roles");
const { BLUE, RED } = require("./constants/Cards");

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
  socket.on(JOIN_LOBBY, payload => {
    player.setName(payload); // Set Player name
  });

  // Upon joining a slot
  socket.on(JOIN_SLOT, payload => {
    const { team, index } = payload;

    game.insertPlayerIntoSlot(player, team, index);

    emitUpdateTeams();
  });

  // Upon anyone pressing the 'Start Game' button
  socket.on(START_GAME, () => {
    game.setPlayerInfo();
    game.startGame();

    // Request that each player start the game themselves
    io.emit(REQUEST_INDVIDUAL_START_GAME);
  });

  // When each player individually starts the game
  socket.on(INDVIDUAL_START_GAME, () => {
    player = game.getPlayerById(socket.id); // Get their latest Player object
    joinRoomByRole(player.getRole()); // Join the appropriate room, depending on their role
    io.emit(UPDATE_GAME, game.getGame(player.getRole())); // Get the latest game state and board, depending on their role
  });

  // Handle RESTART_GAME
  socket.on(RESTART_GAME, () => {
    game.restartGame();
    io.emit(UPDATE_GAME, game.getGame());
  });

  // Handle GET_GAME
  socket.on(GET_GAME, () => {
    io.emit(UPDATE_GAME, game.getGame());
  });

  // Handle FETCH_TEAMS
  socket.on(FETCH_TEAMS, () => {
    emitUpdateTeams();
  });

  // Handle CHAT_MESSAGE
  socket.on(CHAT_MESSAGE, payload => {
    io.emit(CHAT_MESSAGE, payload);
  });

  // Handle CHOOSE_CARD
  socket.on(CHOOSE_CARD, payload => {
    game.chooseCard(payload.row, payload.col);
    io.emit(UPDATE_GAME, game.getGame());
  });

  // Emit UPDATE_TEAMS
  const emitUpdateTeams = () => {
    io.emit(UPDATE_TEAMS, {
      redTeam: game.getRedTeam(),
      blueTeam: game.getBlueTeam()
    });
  };

  // Join appropriate room depending on role
  const joinRoomByRole = role => {
    if (role === FIELD_OPERATIVE) {
      socket.join("lobby-fieldOperatives");
    } else {
      socket.join("lobby-spymasters");
    }
  };
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, () => {
  console.log("Server running on port:" + port);
  game.startGame();
});
server.on("Error", err => onError(err, port));
server.on("Listening", () => onListening(server));

module.exports = server;
