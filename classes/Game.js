const clonedeep = require("lodash.clonedeep");

const {
  RED,
  BLUE,
  BLACK,
  GRAY,
  CHOSEN,
  UNCHOSEN,
} = require("../constants/Cards");
const { SPYMASTER, FIELD_OPERATIVE } = require("../constants/Roles");

const generateWordList = require("../utils/words");
const {
  presetBoard,
  cardCounters,
  startingTeam,
} = require("../utils/presetBoard");

class Game {
  constructor() {
    this.resetTeamInfo();
    this.resetGame();
    this.isGameInProgress = false;
  }

  /**
   * Resets team info
   */
  resetTeamInfo = () => {
    this.redTeam = new Array(4).fill(null);
    this.blueTeam = new Array(4).fill(null);
    this.players = {};
  };

  /**
   * Resets the game
   */
  resetGame = () => {
    console.log("Board reset starting.");

    this.wordList = generateWordList();
    this.spymasterBoard = [];
    this.fieldOperativeBoard = [];
    this.startingTeam = "";
    this.currentTeam = "";
    this.clue = {};
    this.blueCardCounter = null;
    this.redCardCounter = null;
    this.blackCardCounter = null;
    this.guessCounter = null;
    this.winningTeam = "";
    this.chatHistory = [];
    this.timeOfLatestMessage = null;
    this.isGameInProgress = true;

    console.log("Board reset completed.");
  };

  /**
   * Insert player into slot
   */
  insertPlayerIntoSlot = (player, team, index) => {
    // Prevent duplicate players
    this.erasePlayerFromEitherTeam(player.getId());

    // Insert Player into appropriate team and position
    this.insertPlayerIntoTeam(player, team, index);
  };

  /**
   * Insert player into team
   */
  insertPlayerIntoTeam = (player, team, index) => {
    if (team === RED) {
      this.redTeam[index] = player;
    } else {
      this.blueTeam[index] = player;
    }
  };

  /**
   * Erase player if on either team
   */
  erasePlayerFromEitherTeam = (targetId) => {
    this.erasePlayerFromTeam(targetId, this.redTeam);
    this.erasePlayerFromTeam(targetId, this.blueTeam);
  };

  /**
   * Erase player if on given team
   */
  erasePlayerFromTeam = (targetId, team) => {
    for (let i in team) {
      const player = team[i];

      if (player && player.getId() === targetId) {
        delete team[i];
      }
    }
  };

  setPlayerInfo = () => {
    this.setPlayerInfoForTeam(this.redTeam);
    this.setPlayerInfoForTeam(this.blueTeam);

    this.createPlayersObject(); // Create player lookup object
  };

  setPlayerInfoForTeam = (team) => {
    for (let i = 0; i < team.length; ++i) {
      if (team[i]) {
        // Set team
        team[i].setTeam(team === this.redTeam ? RED : BLUE);

        // Set role
        if (i !== 0) {
          team[i].setRole(FIELD_OPERATIVE);
        } else {
          team[i].setRole(SPYMASTER);
        }
      }
    }
  };

  createPlayersObject = () => {
    const players = {};

    this.addPlayersFromTeamToPlayersObject(this.redTeam, players);
    this.addPlayersFromTeamToPlayersObject(this.blueTeam, players);

    this.players = players;
  };

  addPlayersFromTeamToPlayersObject = (team, players) => {
    for (let i = 0; i < 4; ++i) {
      const player = team[i];

      if (player) {
        players[player.getId()] = player;
      }
    }
  };

  getPlayerById = (targetId) => {
    return this.players[targetId];
  };

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
          word: null, // Word to be assigned.
          color: GRAY, // Color to be assigned. GRAY by default.
          state: UNCHOSEN,
          row,
          col,
        });
      }
      board.push(currRow);
    }

    console.log("Board creation completed.");

    return board;
  };

  /**
   * Select the team that starts first.
   * There should be a 50/50 chance of RED or BLUE.
   */
  selectStartingTeam = () => {
    const randomValue = Math.floor(Math.random() * 2) + 1;
    const result = randomValue === 1 ? RED : BLUE;

    this.startingTeam = result;
  };

  /**
   * Set current team
   */
  setCurrentTeam = (team) => {
    this.currentTeam = team;
  };

  /**
   * Assign a random color to each card until the following has occurred:
   *    9 or 8 RED cards (9 if starting team, 8 if not)
   *    9 or 8 BLUE cards (9 if starting team, 8 if not)
   *    7 GRAY cards
   *    1 BLACK card
   * @param {Board} A board whose colors need to be assigned.
   * @return {Board} A board whose colors have been assigned.
   */
  assignColors = (board) => {
    console.log("Color assignment starting.");

    let boardCopy = clonedeep(board);

    let numRedCards = this.startingTeam === RED ? 9 : 8;
    let numBlueCards = this.startingTeam === RED ? 8 : 9;
    let numBlackCards = 1;
    this.blueCardCounter = numBlueCards;
    this.redCardCounter = numRedCards;
    this.blackCardCounter = numBlackCards;
    var row, col;

    //RED CARDS
    while (numRedCards > 0) {
      row = Math.floor(Math.random() * 5);
      col = Math.floor(Math.random() * 5);
      if (boardCopy[row][col].color === GRAY) {
        boardCopy[row][col].color = RED;
        numRedCards--;
      }
    }

    //BLUE CARDS
    while (numBlueCards > 0) {
      row = Math.floor(Math.random() * 5);
      col = Math.floor(Math.random() * 5);
      if (boardCopy[row][col].color === GRAY) {
        boardCopy[row][col].color = BLUE;
        numBlueCards--;
      }
    }

    //BLACK CARD
    while (numBlackCards > 0) {
      row = Math.floor(Math.random() * 5);
      col = Math.floor(Math.random() * 5);
      if (boardCopy[row][col].color === GRAY) {
        boardCopy[row][col].color = BLACK;
        numBlackCards--;
      }
    }

    console.log("Color assignment completed.");

    return boardCopy;
  };

  /**
   * Assign a random word to each card.
   * @param {Board} A board whose words need to be assigned.
   * @return {Board} A board whose words have been assigned.
   */
  assignWords = (board) => {
    console.log("Word assignment starting.");

    let boardCopy = clonedeep(board);

    let count = 0;

    for (let row = 0; row < 5; ++row) {
      for (let col = 0; col < 5; ++col) {
        boardCopy[row][col].word = this.wordList[count++];
      }
    }

    console.log("Word assignment completed.");

    return boardCopy;
  };

  /**
   * Starts the game by creating the spymaster board first, assigning it random colors and words, and then obscuring the colors to create the field operative board.
   */
  startGame = () => {
    console.log("Game creation starting.");

    this.resetGame();
    this.selectStartingTeam();
    this.setCurrentTeam(this.startingTeam);
    this.generateSpymasterBoard();
    this.generateFieldOperativeBoard();

    console.log("Game creation completed.");
  };

  restartGame = () => {
    console.log("Game restarting.");
    this.startGame();
    console.log("Game restarted");
  };

  generateSpymasterBoard = () => {
    let board = this.createBoard();
    board = this.assignColors(board);
    board = this.assignWords(board);

    this.spymasterBoard = board;
  };

  generateFieldOperativeBoard = () => {
    let boardCopy = clonedeep(this.spymasterBoard);

    for (let row of boardCopy) {
      for (let card of row) {
        card.color = null;
      }
    }

    this.fieldOperativeBoard = boardCopy;
  };

  // Similar to startGame except with preset values
  loadPresetBoard = () => {
    console.log("Preset board loading.");

    this.resetGame();
    this.setCurrentTeam(startingTeam); // Set preset starting team
    this.spymasterBoard = clonedeep(presetBoard);
    this.generateFieldOperativeBoard();

    // Set preset card counters
    this.redCardCounter = cardCounters.redCardCounter;
    this.blueCardCounter = cardCounters.blueCardCounter;
    this.blackCardCounter = cardCounters.blackCardCounter;

    console.log("Preset board loaded.");
  };

  /**
   * Get the current Board depending on player role
   * If spymaster, return the board with all information.
   * If field operative, return the board with information obscured.
   * @return {Board} The current board
   */
  getBoardByRole = (role) => {
    if (role === SPYMASTER) {
      return this.spymasterBoard;
    } else {
      return this.fieldOperativeBoard;
    }
  };

  /**
   * Get all game information
   * @return An object containing all game data
   */
  getGameByRole = (role) => {
    return {
      startingTeam: this.startingTeam,
      currentTeam: this.currentTeam,
      redCardCounter: this.redCardCounter,
      blueCardCounter: this.blueCardCounter,
      guessCounter: this.guessCounter,
      clue: this.clue,
      winningTeam: this.winningTeam,
      board: this.getBoardByRole(role),
      timeOfLatestMessage: this.timeOfLatestMessage,
    };
  };

  /**
   * Get game depending on player id
   * @return An object containing personalized game data
   */
  getGameById = (playerId) => {
    const player = this.getPlayerById(playerId);

    if (player) {
      return {
        startingTeam: this.startingTeam,
        currentTeam: this.currentTeam,
        redCardCounter: this.redCardCounter,
        blueCardCounter: this.blueCardCounter,
        guessCounter: this.guessCounter,
        clue: this.clue,
        winningTeam: this.winningTeam,
        team: player.getTeam(),
        board: this.getBoardByRole(player.getRole()),
        timeOfLatestMessage: this.timeOfLatestMessage,
      };
    }
  };

  setTimeOfLatestMessage = (time) => {
    this.timeOfLatestMessage = time;
  };

  getTimeOfLatestMessage = () => {
    return this.timeOfLatestMessage;
  };

  /**
   * Get red team
   */
  getRedTeam = () => {
    return this.redTeam;
  };

  /**
   * Get blue team
   */
  getBlueTeam = () => {
    return this.blueTeam;
  };

  getIsGameInProgress = () => {
    return this.isGameInProgress;
  };

  /**
   * A player chooses a card to flip over
   * @param {int} The row of a given position
   * @param {int} The column of a given position
   * @return {boolean} Whether or not the guess was correct
   */
  chooseCard = (row, col) => {
    let chooserTeam = this.currentTeam; // Temporarily saves the current team

    this.markChosen(row, col);
    let trueColor = this.revealColor(row, col);
    this.updateBoardCounters(row, col);
    this.checkWinConditions();
    this.checkEndOfTurn(row, col);

    return trueColor === chooserTeam;
  };

  // Just updates the number of cards left for each team and number of guesses remaining
  updateBoardCounters = (row, col) => {
    if (this.spymasterBoard[row][col].color === "BLUE") {
      this.blueCardCounter--;
    } else if (this.spymasterBoard[row][col].color === "RED") {
      this.redCardCounter--;
    } else if (this.spymasterBoard[row][col].color === "BLACK") {
      this.blackCardCounter--;
    }
    this.guessCounter--;
  };

  checkWinConditions = () => {
    if (this.blueCardCounter === 0) {
      this.winningTeam = "BLUE";
    } else if (this.redCardCounter === 0) {
      this.winningTeam = "RED";
    } else if (this.blackCardCounter === 0) {
      let teamColor = this.currentTeam === RED ? "BLUE" : "RED";
      this.winningTeam = teamColor;
    }
  };

  checkEndOfTurn = (row, col) => {
    let teamColor = this.currentTeam === RED ? "RED" : "BLUE";
    if (
      this.guessCounter === 0 ||
      this.spymasterBoard[row][col].color !== teamColor
    ) {
      this.endTurn();
    }
  };

  /**
   * Mark the card at a given position as chosen
   * @param {int} The row of a given position
   * @param {int} The column of a given position
   */
  markChosen = (row, col) => {
    this.fieldOperativeBoard[row][col].state = CHOSEN;
    this.spymasterBoard[row][col].state = CHOSEN;
  };

  /**
   * Reveal the color of the card at a given position
   * @param {int} The row of a given position
   * @param {int} The column of a given position
   * @return {string} The color of the card that was just revealed
   */
  revealColor = (row, col) => {
    let trueColor = this.spymasterBoard[row][col].color;

    this.fieldOperativeBoard[row][col].color = trueColor;

    return trueColor;
  };

  /**
   * Handles 'End Turn' requests from players
   */
  endTurnFromPlayer = (playerId) => {
    // Verifies that the player issuing it is on the appropriate team and has the appropriate role
    const player = this.getPlayerById(playerId);

    if (
      player &&
      player.getTeam() === this.currentTeam &&
      player.getRole() === FIELD_OPERATIVE
    ) {
      this.endTurn();
    }
  };

  saveChatMessages = (payload) => {
    this.chatHistory = [...this.chatHistory, payload];
  };

  getChatMessages = () => {
    return this.chatHistory;
  };

  /**
   * Ends the current team's turn
   */
  endTurn = () => {
    // Set the currentTeam to the other team
    this.currentTeam = this.currentTeam === RED ? BLUE : RED;

    this.clue = {}; // Clear the current clue
  };

  /**
   * Sets the given clue
   * @param {Object} containing a word and a number
   */
  setClue = (clue) => {
    this.clue = clue;
    this.guessCounter = clue.number + 1;
  };
}

module.exports = Game;
