class Lobby {
  constructor(id, name = "Lobby #" + id) {
    this.id = id;
    this.name = name;
    this.currentPlayers = 0;
    this.maxPlayers = 8;
    this.resetLobby();
    this.isGameInProgress = false;
  }

  resetLobby = () => {
    this.redTeam = new Array(4).fill(null);
    this.blueTeam = new Array(4).fill(null);
    this.players = {};
  };

  getId = () => {
    try {
      return this.id;
    } catch (err) {
      console.log(err);
    }
  };

  setName = (name) => {
    this.name = name;
  };

  getName = () => {
    try {
      return this.name;
    } catch (err) {
      console.log(err);
    }
  };

  setCurrentPlayers = (currentPlayers) => {
    this.currentPlayers = currentPlayers;
  };

  getCurrentPlayers = () => {
    try {
      return this.currentPlayers;
    } catch (err) {
      console.log(err);
    }
  };

  setMaxPlayers = (maxPlayers) => {
    this.maxPlayers = maxPlayers;
  };

  getMaxPlayers = () => {
    try {
      return this.maxPlayers;
    } catch (err) {
      console.log(err);
    }
  };

  setIsGameInProgress = (value) => {
    this.isGameInProgress = value;
  };

  getRedTeam = () => {
    return this.redTeam;
  };

  getBlueTeam = () => {
    return this.blueTeam;
  };

  getIsGameInProgress = () => {
    return this.isGameInProgress;
  };

  getLobby = () => {
    try {
      return {
        id: this.getId(),
        name: this.getName(),
        currentPlayers: this.getCurrentPlayers(),
        maxPlayers: this.getMaxPlayers(),
        redTeam: this.getRedTeam(),
        blueTeam: this.getBlueTeam(),
        isGameInProgress: this.getIsGameInProgress(),
      };
    } catch (err) {
      console.log(err);
    }
  };
}

module.exports = Lobby;
