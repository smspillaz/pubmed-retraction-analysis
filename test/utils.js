var exec = require("child_process").exec;
var portfinder = require("portfinder");

function startServer(port, done) {
  var app = require("../app");  // eslint-disable-line global-require
  app.set("port", port);
  return app.listen(app.get("port"), done);
}

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
