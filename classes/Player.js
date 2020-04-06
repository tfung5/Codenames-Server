// A player's id is their socket id.

class Player {
  constructor(id, name = "Player") {
    this.id = id;
    this.name = name;
  }

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

  setTeam = (team) => {
    this.team = team;
  };

  getTeam = () => {
    try {
      return this.team;
    } catch (err) {
      console.log(err);
    }
  };

  setRole = (role) => {
    this.role = role;
  };

  getRole = () => {
    try {
      return this.role;
    } catch (err) {
      console.log(err);
    }
  };

  getPlayer = () => {
    try {
      return {
        id: this.getId(),
        name: this.getName(),
        team: this.getTeam(),
        role: this.getRole(),
      };
    } catch (err) {
      console.log(err);
    }
  };
}

module.exports = Player;
