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
let board = [];
let wordList = [
  "Server",
  "Well",
  "Screen",
  "Fair",
  "Play",
  "Tooth",
  "Marble",
  "Staff",
  "Dinosaur",
  "Bill",
  "Cat",
  "Shot",
  "Pitch",
  "King",
  "Bond",
  "Pan",
  "Greece",
  "Square",
  "Deck",
  "Buffalo",
  "Spike",
  "Scientist",
  "Center",
  "Chick",
  "Vacuum",
  "Atlantis",
  "Unicorn",
  "Spy",
  "Undertaker",
  "Mail",
  "Sock",
  "Nut",
  "Loch",
  "Ness",
  "Log",
  "Horse",
  "Pirate",
  "Berlin",
  "Face",
  "Platypus",
  "Stick",
  "Port",
  "Disease",
  "Chest",
  "Yard",
  "Box",
  "Mount",
  "Compound",
  "Slug",
  "Ship",
  "Dice",
  "Watch",
  "Lead",
  "Space",
  "Hook",
  "Flute",
  "Carrot",
  "Tower",
  "Poison",
  "Death",
  "Stock"
];
let startingTeam = RED; // Set to RED by default

const RED = "RED";
const BLUE = "BLUE";
const BLACK = "BLACK";
const GRAY = "GRAY";
const CHECKED = "CHECKED";
const UNCHECKED = "UNCHECKED";

/**
 * Select the team that starts first.
 * There should be a 50/50 chance
 */
selectStartTeam = () => {
  const randomValue = Math.floor(Math.random() * 2) + 1;
  startingTeam = randomValue === 1 ? RED : BLUE;
};

/**
 * Set up board
 */
createBoardFromWordList = () => {
  console.log("Board creation starting.");

  let tempBoard = [];
  let count = 0;

  for (let row = 0; row < 5; ++row) {
    let currRow = [];
    for (let col = 0; col < 5; ++col) {
      currRow.push({
        word: wordList[count++],
        color: BLUE,
        status: UNCHECKED,
        row,
        col
      });
    }
    tempBoard.push(currRow);
  }

  board = tempBoard;
  console.log("Board creation completed.");
};

/**
 * Initialize action types
 */
const CHAT_MESSAGE = "chat message";
const UPDATE_BOARD = "UPDATE_BOARD";
const FETCH_BOARD = "FETCH_BOARD";

/**
 * Start socket server with `on` method.
 * Listen for action types
 * Emit action payload
 */
io.on("connection", socket => {
  console.log("A user connected :D");

  // Handle FETCH_BOARD
  socket.on(FETCH_BOARD, payload => {
    io.emit(FETCH_BOARD, payload);
  });

  // Handle CHAT_MESSAGE
  socket.on(CHAT_MESSAGE, payload => {
    io.emit(CHAT_MESSAGE, payload);
  });

  // Handle UPDATE_BOARD
  socket.on(UPDATE_BOARD, payload => {
    io.emit(UPDATE_BOARD, payload);
  });
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, () => {
  console.log("Server running on port:" + port);
  createBoardFromWordList();
});
server.on("Error", err => onError(err, port));
server.on("Listening", () => onListening(server));

module.exports = server;
