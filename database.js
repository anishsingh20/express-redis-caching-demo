const data = {
  1: "Hello, World!",
  2: "Welcome to the caching demo.",
  3: "This is a simple Express application.",
  // Add more data as needed
};

function getDataById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data[id] || null); // Return null if data not found
    }, 1000); // Simulate a 1 second delay
  });
}

module.exports = { getDataById };
