/**
 * Event listener for HTTP server "listening" event.
 */

module.exports = (server) => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
};
