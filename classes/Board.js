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
    this.board = this.createBoard();
    this.startingTeam = this.selectStartTeam();
  }

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
          color: GRAY, // GRAY by default. To be selected by randomizeColorOfCards
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
   * There should be a 50/50 chance of RED or BLUE.
   * @return {string} The team that starts first.
   */
  selectStartTeam = () => {
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
   */
  assignColors = () => {
    console.log("Color selection starting.");

    let board = this.board;
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

    this.board = board;
  };

  /**
   * Assign a random word to each card.
   */
  assignWords = () => {
    console.log("Board word population starting.");

    let board = this.board;
    let count = 0;

    for (let row = 0; row < 5; ++row) {
      for (let col = 0; col < 5; ++col) {
        board[row][col].word = wordList[count++];
      }
    }

    console.log("Board word population completed.");

    this.board = board;
  };

  /**
   * Generate a random board
   */
  generateBoard = () => {
    console.log("Board generation starting.");

    this.startingTeam = selectStartTeam();
    this.assignColors();
    this.assignWords();

    console.log("Board generation completed.");

    return board;
  };
}

module.exports = Board;
