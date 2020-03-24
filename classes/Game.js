const clonedeep = require("lodash.clonedeep");

const {
  RED,
  BLUE,
  BLACK,
  GRAY,
  CHOSEN,
  UNCHOSEN
} = require("../constants/Cards");
const { SPYMASTER, FIELD_OPERATIVE } = require("../constants/Roles");

const wordList = [
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

class Game {
  constructor() {
    this.resetTeamInfo();
    this.resetGame();
  }

  /**
   * Resets team info
   */
  resetTeamInfo = () => {
    this.redTeam = new Array(4).fill(null);
    this.blueTeam = new Array(4).fill(null);
  };

  /**
   * Resets the game
   */
  resetGame = () => {
    console.log("Board reset starting.");

    this.spymasterBoard = [];
    this.fieldOperativeBoard = [];
    this.startingTeam = "";

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
  erasePlayerFromEitherTeam = targetId => {
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
  };

  setPlayerInfoForTeam = team => {
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

  getPlayerById = targetId => {
    let player =
      this.getPlayerByIdOnTeam(targetId, this.redTeam) ||
      this.getPlayerByIdOnTeam(targetId, this.blueTeam);

    return player;
  };

  getPlayerByIdOnTeam = (targetId, team) => {
    for (let player of team) {
      if (player && player.getId() === targetId) {
        return player;
      }
    }

    return null;
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
   * There should be a 50/50 chance of RED or BLUE.
   */
  selectStartingTeam = () => {
    const randomValue = Math.floor(Math.random() * 2) + 1;
    const result = randomValue === 1 ? RED : BLUE;

    this.startingTeam = result;
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
  assignColors = board => {
    console.log("Color assignment starting.");

    let boardCopy = clonedeep(board);

    let numRedCards = this.startingTeam === RED ? 9 : 8;
    let numBlueCards = this.startingTeam === RED ? 8 : 9;
    let numBlackCards = 1;
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
  assignWords = board => {
    console.log("Word assignment starting.");

    let boardCopy = clonedeep(board);

    let count = 0;

    for (let row = 0; row < 5; ++row) {
      for (let col = 0; col < 5; ++col) {
        boardCopy[row][col].word = wordList[count++];
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

  /**
   * Get the current Board depending on player role
   * If spymaster, return the board with all information.
   * If field operative, return the board with information obscured.
   * @return {Board} The current board
   */
  getBoardByRole = role => {
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
  getGameByRole = role => {
    return {
      startingTeam: this.startingTeam,
      board: this.getBoardByRole(role)
    };
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

  /**
   * A player chooses a card to flip over
   * @param {int} The row of a given position
   * @param {int} The column of a given position
   */
  chooseCard = (row, col) => {
    this.markChosen(row, col);
    this.revealColor(row, col);
    // TODO: this.updateBoardCounters, such as the number of cards left for each team, the number of guesses remaining.
    // TODO: this.checkWinConditions.
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
   */
  revealColor = (row, col) => {
    this.fieldOperativeBoard[row][col].color = this.spymasterBoard[row][
      col
    ].color;
  };
}

module.exports = Game;