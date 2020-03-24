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
  INDIVIDUAL_START_GAME,
  JOIN_LOBBY,
  JOIN_SLOT,
  REQUEST_INDIVIDUAL_START_GAME,
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

  // Upon loading the LobbyView
  socket.on(FETCH_TEAMS, () => {
    emitUpdateTeams();
  });

  // Upon joining a slot
  socket.on(JOIN_SLOT, payload => {
    const { team, index } = payload;
    game.insertPlayerIntoSlot(player, team, index);
    emitUpdateTeams();
  });

  // Upon *anyone* pressing the 'Start Game' button
  socket.on(START_GAME, () => {
    game.setPlayerInfo(); // Set team and roles for each player
    game.startGame(); // Generate the game info and board
    io.emit(REQUEST_INDIVIDUAL_START_GAME); // Request that each player start the game themselves
  });

  // To start the process for each player
  socket.on(INDIVIDUAL_START_GAME, () => {
    player = game.getPlayerById(socket.id); // Get their latest Player object
    joinRoomByRole(player.getRole()); // Join the appropriate room, depending on their role
  });

  // Upon loading the GameScreen
  socket.on(GET_GAME, () => {
    emitUpdateGameIndividual();
  });

  // Upon pressing a card
  socket.on(CHOOSE_CARD, payload => {
    game.chooseCard(payload.row, payload.col);
    emitUpdateGameAll();
  });

  // Upon anyone pressing the 'Restart Game' button
  socket.on(RESTART_GAME, () => {
    game.restartGame();
    emitUpdateGameAll();
  });

  // Handle CHAT_MESSAGE
  socket.on(CHAT_MESSAGE, payload => {
    io.emit(CHAT_MESSAGE, payload);
  });

  // Emit UPDATE_GAME individually
  const emitUpdateGameIndividual = () => {
    // Send to the player on this socket the corresponding game information based on their role
    io.to(socket.id).emit(UPDATE_GAME, game.getGameByRole(player.getRole()));
  };

  // Emit UPDATE_GAME to all
  const emitUpdateGameAll = () => {
    io.to("lobby-spymasters").emit(UPDATE_GAME, game.getGameByRole(SPYMASTER));
    io.to("lobby-fieldOperatives").emit(
      UPDATE_GAME,
      game.getGameByRole(FIELD_OPERATIVE)
    );
  };

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
