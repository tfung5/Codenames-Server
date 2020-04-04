// A player's id is their socket id.

class Player {
  constructor(id, name = "Player") {
    this.id = id;
    this.name = name;
  }

  getId = () => {
    return this.id;
  };

  setName = (name) => {
    this.name = name;
  };

  getName = () => {
    return this.name;
  };

  setTeam = (team) => {
    this.team = team;
  };

  getTeam = () => {
    return this.team;
  };

  setRole = (role) => {
    this.role = role;
  };

  getRole = () => {
    return this.role;
  };

  getPlayer = () => {
    return {
      id: this.getId(),
      name: this.getName(),
      team: this.getTeam(),
      role: this.getRole(),
    };
  };
}

module.exports = Player;
