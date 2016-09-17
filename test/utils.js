var exec = require("child_process").exec;
var portfinder = require("portfinder");

/**
 * startServer
 *
 * Start the backend server, calling @done when the server is ready
 * and running.
 *
 * @port: Port to start the server on
 * @done: Callback to call when server is ready.
 */
function startServer(port, done) {
  var app = require("../app");  // eslint-disable-line global-require
  app.set("port", port);
  return app.listen(app.get("port"), done);
}

/**
 * startServerWithAutomaticPort
 *
 * Start the backend server, selecting a port automatically. The port
 * is guaranteed to be an available port, but not guaranteed to be
 * stable.
 *
 * @done: Callback to call when server is ready.
 */
function startServerWithAutomaticPort(done) {
  portfinder.getPort(function onPortReady(err, port) {
    var server;
    var url;

    try {
      server = startServer(port, function onServerReady() {
        url = "http://localhost:" + port;
        done(server, url);
      });
    } catch (e) {
      done(null, null, e);
    }
  });
}

/**
 * withOverriddenEnvironment
 *
 * Call callback with environment variables set from @environment,
 * restoring them once done. This function supports both synchronous
 * and asynchronous operation. When operating asynchronously, the changes
 * in the environment will persist until the done callback is called
 * by the callback function itself.
 *
 * @environment: Key-value pairs to override.
 * @callback: Function to call.
 * @done: Function to call when done in asynchronous mode.
 */
function withOverriddenEnvironment(environment, callback, done) {
  var backup = JSON.parse(JSON.stringify(process.env));
  Object.keys(environment).forEach(function assignKey(key) {
    process.env[key] = environment[key];
  });

  /* If done is passed, do this asynchronously. That means restoring
   * the environment once the callback has indicated that it is done */
  if (done) {
    callback(function onCallbackDone() {
      process.env = backup;
      done.apply(this, Array.prototype.slice.call(arguments));
    });
  } else {
    try {
      callback();
    } finally {
      process.env = backup;
    }
  }
}

/**
 * invokeProcessForReturnCode
 *
 * Invoke a process and get its return code, calling @done
 * with the return code once complete
 *
 * @command: Command to run
 * @options: Options to pass to child_process.exec
 * @done: Callback to invoke when done
 */
function invokeProcessForReturnCode(command, options, done) {
  exec(command, options, function onProcessDone(error) {
    done(error.code);
  });
}

module.exports = {
  startServer: startServer,
  startServerWithAutomaticPort: startServerWithAutomaticPort,
  withOverriddenEnvironment: withOverriddenEnvironment,
  invokeProcessForReturnCode: invokeProcessForReturnCode
};
