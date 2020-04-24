class Lobby {
  constructor(id, name = "Lobby #" + id) {
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

  getLobby = () => {
    try {
      return {
        id: this.getId(),
        name: this.getName(),
      };
    } catch (err) {
      console.log(err);
    }
  };
}

module.exports = Lobby;
