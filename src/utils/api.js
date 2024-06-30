const axios = require("axios");
const config = require("@config");

/**
 * Class representing an API client using Axios.
 */
class API {
  constructor() {
    this.URI = config.api.url;
    this.apiKey = config.api.key;
    this.create = axios.create({
      baseURL: this.URI,
      timeout: 60000,
    });
  }

  /**
   * Perform a GET request to the API.
   * @param {string} path - The endpoint path.
   * @param {object} [query={}] - Query parameters.
   * @param {string} [apikey=this.apiKey] - Optional API key for authentication.
   * @param {object} [options={}] - Optional Axios request configuration.
   * @returns {Promise<object>} The response data from the API.
   */
  async get(path = "/", query = {}, apikey = this.apiKey, options = {}) {
    try {
      const params = new URLSearchParams({
        ...query,
        ...(apikey ? { apikey: apikey } : {}),
      });
      const res = await this.create.get(path, {
        params,
        ...options,
      });
      return res.data;
    } catch (error) {
      return { status: 400, error: error.message };
    }
  }

  /**
   * Perform a POST request to the API.
   * @param {string} path - The endpoint path.
   * @param {object} [data={}] - The data to send with the request.
   * @param {string} [apikey=this.apiKey] - Optional API key for authentication.
   * @param {object} [options={}] - Optional Axios request configuration.
   * @returns {Promise<object>} The response data from the API.
   */
  async post(path = "/", data = {}, apikey = this.apiKey, options = {}) {
    try {
      const res = await this.create.post(path, { ...data, ...(apikey ? { apikey: apikey } : {}) }, {
        ...options,
      });
      return res.data;
    } catch (error) {
      return { status: 400, error: error.message };
    }
  }
}

module.exports = new API();