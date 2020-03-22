const RED = "RED";
const BLUE = "BLUE";
const BLACK = "BLACK";
const GRAY = "GRAY";
const CHECKED = "CHECKED";
const UNCHECKED = "UNCHECKED";

const SPYMASTER = "SPYMASTER";
const FIELD_OPERATIVE = "FIELD_OPERATIVE";

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

class Board {
  constructor() {
    this.resetBoard();
  }

  /**
   * Resets the board
   */
  resetBoard = () => {
    console.log("Board reset starting.");

    this.spymasterBoard = this.createBoard();
    this.fieldOperativeBoard = [];
    this.startingTeam = this.selectStartingTeam();

    console.log("Board reset completed.");
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
          status: CHECKED,
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
   * @return {string} The team that starts first.
   */
  selectStartingTeam = () => {
    const randomValue = Math.floor(Math.random() * 2) + 1;
    const result = randomValue === 1 ? RED : BLUE;
    return result;
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
    console.log("Color selection starting.");

    let numRedCards = this.startingTeam === RED ? 9 : 8;
    let numBlueCards = this.startingTeam === RED ? 8 : 9;
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
   * Assign a random word to each card.
   * @param {Board} A board whose words need to be assigned.
   * @return {Board} A board whose words have been assigned.
   */
  assignWords = board => {
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
   * Generate a random board by creating the spymaster board first, assigning it random colors and words, and then obscuring the colors to create the field operative board.
   */
  generateBoard = () => {
    console.log("Board generation starting.");

    this.resetBoard();
    this.generateSpymasterBoard();
    this.generateFieldOperativeBoard();

    console.log("Board generation completed.");
  };

  generateSpymasterBoard = () => {
    this.spymasterBoard = this.createBoard();
    this.spymasterBoard = this.assignColors(this.spymasterBoard);
    this.spymasterBoard = this.assignWords(this.spymasterBoard);
  };

  generateFieldOperativeBoard = () => {
    let copyBoard = this.spymasterBoard;

    for (let row of copyBoard) {
      for (let card of row) {
        card.color = null;
      }
    }

    this.fieldOperativeBoard = copyBoard;
  };

  /**
   * Get the current Board depending on player role
   * If spymaster, return the board with all information.
   * If field operative, return the board with information obscured.
   * @return {Board} The current board
   */
  getBoard = role => {
    if (role === SPYMASTER) {
      return this.spymasterBoard;
    } else {
      return this.fieldOperativeBoard;
    }
  };

  /**
   * A player chooses a card to flip over
   */
  chooseCard = (row, col) => {
    this.markChecked(row, col);
    this.revealColor(row, col);
    // TODO: this.updateBoardCounters, such as the number of cards left for each team, the number of guesses remaining.
    // TODO: this.checkWinConditions.
  };

  /**
   * Mark the card at a given position as checked
   */
  markChecked = (row, col) => {
    this.fieldOperativeBoard[row][col].status = CHECKED;
    this.spymasterBoard[row][col].status = CHECKED;
  };

  /**
   * Reveal the color of the card at a given position
   */
  revealColor = (row, col) => {
    this.fieldOperativeBoard[row][col].color = this.spymasterBoard[row][
      col
    ].color;
  };
}

module.exports = Board;
