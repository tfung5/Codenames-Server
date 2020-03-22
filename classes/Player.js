class Player {
  constructor(name) {
    this.name = name;
  }

  setName = name => {
    this.name = name;
  };

  getName = () => {
    return this.name;
  };

  setTeam = team => {
    this.team = team;
  };

  getTeam = () => {
    return this.team;
  };

  setRole = role => {
    this.role = role;
  };

  getRole = () => {
    return this.role;
  };
}

module.exports = Player;
