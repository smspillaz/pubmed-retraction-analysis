/* global Promise */

var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var spawn = require("child_process").spawn;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/is_crawling", function isCrawling(req, res) {
  fs.stat("crawling.lock", function statResult(err) {
    if (err) {
      res.json({
        crawling: false
      });
    } else {
      res.json({
        crawling: true
      });
    }
  });
});

/**
 * withCrawlingLockAsync
 *
 * Execute the function @crawl with a lock, to ensure that @crawl cannot
 * be executed more than one simultaneously. This functions checks for a
 * crawling.lock file, then creates it and continues.
 *
 * Obviously, this isn't race condition proof, but should be good enough for
 * now.
 *
 * @param crawl {function} - The function to call to start crawling
 * @param error {function} - An error handler function
 * @param done {function} - The function to call when we're done with the lock
 * @returns {undefined}
 */
function withCrawlingLockAsync(crawl, error, done) {
  fs.stat("crawling.lock", function statResult(errStat) {
    /* We want this */
    if (errStat) {
      fs.writeFile("crawling.lock", function onErrorWrite(errWrite) {
        if (errWrite) {
          error(errWrite);
          return;
        }

        crawl(function onDoneCrawling() {
          fs.unlink("crawling.lock", function onErrorUnlink(errUnlink) {
            if (errUnlink) {
              error(errUnlink);
              return;
            }

            done.apply(arguments);
          });
        });
      });
    } else {
      error("Lock file already exists! Cannot crawl");
    }
  });
}

app.post("/start_crawling", function startCrawling(req, res) {
  withCrawlingLockAsync(function onAcquiredLock(done) {
    res.json({
      status: "started"
    });

    new Promise(function downloadDocuments(resolve, reject) {
      // Create child python process
      var loadProc = spawn("./python-virtualenv/bin/python", ["./python-virtualenv/bin/download-pubmed-articles"], {
        stdio: ["pipe", "inherit", "inherit"]
      });
      loadProc.on("exit", function onExit(code, signal) {
        if (code !== 0 || signal) {
          reject("Crawling process failed with " + code + " " + signal);
        } else {
          resolve();
        }
      });
    }).then(function parseDocuments() {
      return new Promise(function parseXML(resolve, reject) {
        // Create child python process
        var loadProc = spawn("./python-virtualenv/bin/python", ["./python-virtualenv/bin/parse-pubmed-files", "Retractions"], {
          stdio: ["pipe", "pipe", "pipe"]
        });
        var stdout = [];
        loadProc.on("exit", function onExit(code, signal) {
          if (code !== 0 || signal) {
            reject("Crawling process failed with " + code + " " + signal);
          } else {
            console.log(stdout.join(""));  // eslint-disable-line no-console
            resolve(JSON.parse(stdout.join("")));
          }
        });
        loadProc.stdout.on("data", function onData(data) {
          stdout.push(String(data));
        });
      });
    }).then(function loadDatabase(json) {
      return new Promise(function loadDB(resolve, reject) {
        // Create child python process
        var loadProc = spawn("./python-virtualenv/bin/python", ["./python-virtualenv/bin/load-pubmed-files"], {
          stdio: ["pipe", "inherit", "inherit"]
        });
        // Crawling is completed now, resolve or reject promise
        loadProc.on("exit", function onExit(code, signal) {
          if (code !== 0 || signal) {
            reject("Crawling process failed with " + code + " " + signal);
          } else {
            resolve();
          }
        });
        loadProc.stdin.write(JSON.stringify(json));
        loadProc.stdin.end();
      });
    }).then(function onDone() {
      done();
    })
    .catch(function onError(error) {
      // eslint-disable-next-line no-console
      console.error("Crawing process failed with " + error + " " + error.stack);
      done();
    });
  }, function onErrorAcquiringLock(error) {
    res.json({
      status: "failure",
      message: String(error)
    });
  }, function onDoneWithLock() {
  });
});

app.set("port", 6001);

app.listen(app.get("port"), function onPort() {
  // eslint-disable-next-line no-console
  console.log("Scraper service server listening on port 6001");
});
