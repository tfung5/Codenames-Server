const { RED, BLUE } = require("../constants/Cards");
const { SPYMASTER, FIELD_OPERATIVE } = require("../constants/Roles");

class Lobby {
  constructor(id, name = "Lobby #" + id) {
    this.id = id;
    this.name = name;
    this.maxPlayers = 8;
    this.isGameInProgress = false;
    this.resetLobby();
  }

  resetLobby = () => {
    this.redTeam = new Array(4).fill(null);
    this.blueTeam = new Array(4).fill(null);
    this.playerList = {};
    this.currentPlayers = 0;
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

  incrementCurrentPlayers = () => {
    if (this.currentPlayers < this.maxPlayers()) {
      this.currentPlayers += 1;
    }
  };

  decrementCurrentPlayers = () => {
    if (this.currentPlayers > 0) {
      this.currentPlayers -= 1;
    }
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

  getIsGameInProgress = () => {
    return this.isGameInProgress;
  };

  getRedTeam = () => {
    return this.redTeam;
  };

  getBlueTeam = () => {
    return this.blueTeam;
  };

  insertPlayerIntoSlot = (player, team, index) => {
    this.removePlayer(player.getId()); // Prevent duplicate players
    this.setPlayerInfo(player, team, index);
    this.addPlayerToTeam(player, team, index);
    this.addPlayerToPlayerList(player);
    this.incrementCurrentPlayers();
  };

  setPlayerInfo = (player, team, index) => {
    if (team === RED) {
      player.setTeam(RED);
    } else {
      player.setTeam(BLUE);
    }

    if (index === 0) {
      player.setRole(SPYMASTER);
    } else {
      player.setRole(FIELD_OPERATIVE);
    }
  };

  addPlayerToTeam = (player, team, index) => {
    if (team === RED) {
      this.redTeam[index] = player;
    } else {
      this.blueTeam[index] = player;
    }
  };

  removePlayerFromTeam = (targetId, team) => {
    for (let i in team) {
      const player = team[i];

      if (player && player.getId() === targetId) {
        delete team[i];
      }
    }
  };

  addPlayerToPlayerList = (player) => {
    // If player exists and player list doesn't already have this player
    if (player && !this.playerList[player.getId()]) {
      this.playerList[player.getId()] = player;
    }
  };

  removePlayerFromPlayerList = (targetId) => {
    delete this.playerList[targetId];
  };

  getPlayerList = () => {
    return this.playerList;
  };

  removePlayer = (targetId) => {
    // If remove was successful, from both team and playerList
    if (
      (this.removePlayerFromTeam(targetId, this.redTeam) ||
        this.removePlayerFromTeam(targetId, this.blueTeam)) &&
      this.removePlayerFromPlayerList(targetId)
    ) {
      this.decrementCurrentPlayers();
    }
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
