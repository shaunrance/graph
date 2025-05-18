// api.js: Handles API interactions for loading/saving the graph JSON

const API_URL = 'graph-api.php'; // Path to your PHP API
const API_PASSWORD = 'netflix'; // Set your API password here

/**
 * Loads graph data from API.
 * @returns {Promise<Object>} Resolves to the graph data object.
 */
function loadGraphData() {
  return fetch(API_URL)
    .then(resp => {
      if (!resp.ok) throw new Error('Failed to load graph data');
      return resp.json();
    });
}

/**
 * Saves graph data to API.
 * @param {Object} graphData - The graph data to save.
 * @returns {Promise<Object>} Resolves to the API response.
 */
function saveGraphData(graphData) {
  return fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_PASSWORD
    },
    body: JSON.stringify(graphData)
  })
    .then(resp => resp.json());
}