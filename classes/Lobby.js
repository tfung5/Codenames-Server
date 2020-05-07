const { RED, BLUE } = require("../constants/Cards");
const { SPYMASTER, FIELD_OPERATIVE } = require("../constants/Roles");
const { v4: uuidv4 } = require("uuid");

class Lobby {
  constructor(creatorName) {
    this.id = uuidv4();
    this.name = creatorName + "'s Game";
    this.maxPlayers = 8;
    this.isGameInProgress = false;
    this.resetLobby();
  }

  resetLobby = () => {
    this.redTeam = new Array(4).fill(null);
    this.blueTeam = new Array(4).fill(null);
    this.playerList = {};
    this.playersNotOnTeam = {};
    this.playerCount = 0;
    this.redReadys = new Array(4).fill(null);
    this.blueReadys = new Array(4).fill(null);
  };

  getPlayersNotOnTeam = () => {
    return this.playersNotOnTeam;
  };

  addPlayerToPlayersNotOnTeam = (player) => {
    if (player && !this.playersNotOnTeam[player.getId()]) {
      this.playersNotOnTeam[player.getId()] = player;
    }
  };

  removePlayerFromPlayersNotOnTeam = (player) => {
    if (player && this.playersNotOnTeam[player.getId()]) {
      delete this.playersNotOnTeam[player.getId()];
    }
  };

  getPlayerCount = () => {
    return this.playerCount;
  };

  incrementPlayerCount = () => {
    this.playerCount++;
  };

  decrementPlayerCount = () => {
    this.playerCount--;
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

  getRedReadys = () => {
    return this.redReadys;
  };

  getBlueReadys = () => {
    return this.blueReadys;
  };

  insertPlayerIntoSlot = (player, team, index) => {
    this.removePlayer(player.getId()); // Prevent duplicate players
    this.setPlayerInfo(player, team, index);
    this.addPlayerToTeam(player, team, index);
    this.addPlayerToPlayerList(player);
    console.log(this.getRedReadys());
    console.log(this.getBlueReadys());
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
      this.redReadys[index] = false;
    } else {
      this.blueTeam[index] = player;
      this.blueReadys[index] = false;
    }
  };

  removePlayerFromTeam = (targetId, team, readys) => {
    for (let i in team) {
      const player = team[i];

      if (player && player.getId() === targetId) {
        readys[i] = null;
        team[i] = null;
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
    this.removePlayerFromTeam(targetId, this.redTeam, this.redReadys);
    this.removePlayerFromTeam(targetId, this.blueTeam, this.blueReadys);
    this.removePlayerFromPlayerList(targetId);
  };

  removePlayerLobby = (targetId) => {
    this.removePlayerFromTeam(targetId, this.redTeam, this.redReadys);
    this.removePlayerFromTeam(targetId, this.blueTeam, this.blueReadys);
  };

  changeReady = (team, index) => {
    if (team === "RED") {
      this.redReadys[index] = !this.redReadys[index];
    }
    if (team === "BLUE") {
      this.blueReadys[index] = !this.blueReadys[index];
    }
  };

  getLobby = () => {
    try {
      return {
        id: this.getId(),
        name: this.getName(),
        playerCount: this.getPlayerCount(),
        maxPlayers: this.getMaxPlayers(),
        redTeam: this.getRedTeam(),
        blueTeam: this.getBlueTeam(),
        isGameInProgress: this.getIsGameInProgress(),
        playersNotOnTeam: this.getPlayersNotOnTeam(),
        redReadys: this.getRedReadys(),
        blueReadys: this.getBlueReadys(),
      };
    } catch (err) {
      console.log(err);
    }
  };
}

module.exports = Lobby;
