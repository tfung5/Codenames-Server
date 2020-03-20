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

const RED = "RED";
const BLUE = "BLUE";
const BLACK = "BLACK";
const GRAY = "GRAY";
const CHECKED = "CHECKED";
const UNCHECKED = "UNCHECKED";

/**
 * Create a board.
 * @return {Board} A board.
 */
createBoard = () => {
  console.log("Board creation starting.");

  let board = [];

  for (let row = 0; row < 5; ++row) {
    let currRow = [];
    for (let col = 0; col < 5; ++col) {
      currRow.push({
        word: null, // To be populated by populateBoardWithWords
        color: null, // To be selected by randomizeColorOfCards
        status: UNCHECKED,
        row,
        col
      });
    }
    board.push(currRow);
  }

  console.log("Board creation completed.");

  return board;
};

/**
 * Select the team that starts first.
 * There should be a 50/50 chance
 * @return {string} The team that starts first.
 */
selectStartTeam = () => {
  const randomValue = Math.floor(Math.random() * 2) + 1;
  const result = randomValue === 1 ? RED : BLUE;
  return result;
};

/**
 * Randomize the colors for a given board.
 * @param {Board} A board whose colors need to be randomized.
 * @param {string} The starting team.
 * @return {Board} A board whose colors have been randomized.
 */
randomizeColorOfCards = (board, startingTeam) => {
  console.log("Color selection starting.");

  let numRedCards = startingTeam === RED ? 9 : 8;
  let numBlueCards = startingTeam === RED ? 8 : 9;
  let numBlackCards = 1;
  var row, col;

  //RED CARDS
  while (numRedCards > 0) {
    row = Math.floor(Math.random() * 5);
    col = Math.floor(Math.random() * 5);
    if (board[row][col].color === GRAY) {
      board[row][col].color = RED;
      numRedCards--;
    }
  }

  //BLUE CARDS
  while (numBlueCards > 0) {
    row = Math.floor(Math.random() * 5);
    col = Math.floor(Math.random() * 5);
    if (board[row][col].color === GRAY) {
      board[row][col].color = BLUE;
      numBlueCards--;
    }
  }

  //BLACK CARD
  while (numBlackCards > 0) {
    row = Math.floor(Math.random() * 5);
    col = Math.floor(Math.random() * 5);
    if (board[row][col].color === GRAY) {
      board[row][col].color = BLACK;
      numBlackCards--;
    }
  }

  console.log("Color selection completed.");

  return board;
};

/**
 * Populate a given board with words
 * @param {Board} A board that needs to be populated with words.
 * @return {Board} A board that has been populated with words.
 */
populateBoardWithWords = board => {
  console.log("Board word population starting.");

  let count = 0;

  for (let row = 0; row < 5; ++row) {
    for (let col = 0; col < 5; ++col) {
      board[row][col].word = wordList[count++];
    }
  }

  console.log("Board word population completed.");

  return board;
};

/**
 * Generate the resulting board
 * @return {Board} A board that has all the colors selected and all the words populated.
 */
generateBoard = () => {
  let board = createBoard();
  let startingTeam = selectStartTeam();
  board = randomizeColorOfCards(board, startingTeam);
  board = populateBoardWithWords(board);
  return board;
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
  board = generateBoard();
});
server.on("Error", err => onError(err, port));
server.on("Listening", () => onListening(server));

module.exports = server;
