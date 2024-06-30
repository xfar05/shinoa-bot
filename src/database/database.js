const fs = require('fs');

class LocalDatabase {
  /**
   * Creates an instance of LocalDatabase.
   */
  constructor() {
    this.databaseFile = "./src/database/database.json";
    this.data = this.read();
  }

  /**
   * Reads the database from a JSON file.
   * @returns {Object} - The parsed data from the JSON file.
   */
  read() {
    try {
      const data = fs.readFileSync(this.databaseFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database file:', error);
      return {};
    }
  }

  /**
   * Adds data to the database.
   * @param {string} key - The key under which the data should be added.
   * @param {*} value - The data to add.
   */
  add(key, value) {
    if (!this.data[key]) {
      this.data[key] = []
    }
    this.data[key].push(value);
    this.save();
  }

  /**
   * Removes data from the database.
   * @param {string} key - The key under which the data should be removed.
   * @param {*} value - The data to remove.
   */
  remove(key, value) {
    if (!this.data[key]) return;

    const index = this.data[key].indexOf(value);
    if (index !== -1) {
      this.data[key].splice(index, 1);
      this.save();
    }
  }

  /**
   * Gets data from the database.
   * @param {string} key - The key whose data should be retrieved.
   * @returns {*} - The data associated with the key.
   */
  get(key) {
    return this.data[key];
  }

  /**
   * Saves the database to a JSON file.
   * @param {Object} [data=this.data] - The data to save.
   */
  save(data = this.data) {
    try {
      const dataToSave = JSON.stringify(data, null, 2);
      fs.writeFileSync(this.databaseFile, dataToSave);
    } catch (error) {
      console.error('Error saving database file:', error);
    }
  }
}

module.exports = new LocalDatabase()