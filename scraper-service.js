var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/is_crawling", function isCrawling(req, res) {
    fs.stat("crawling.lock", function statResult(err, stat) {
        if (err) {
            res.json({
                "crawling": false
            });
        } else {
            res.json({
                "crawling": true
            });
        }
    });
});

function withCrawlingLockAsync(crawl, error, done) {
    fs.stat("crawling.lock", function statResult(err, stats) {
        if (err) {
            fs.writeFile("crawling.lock", function(err) {
                if (err) {
                    return error(err);
                }

                crawl(function onDoneCrawling() {
                    fs.unlink("crawling.lock", function(err) {
                        if (err) {
                            return error(err);
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
    withCrawlingLockAsync(function(done) {
        res.status(200);
        res.json({
            "status": "started"
        });

        var chain = new Promise(function downloadDocuments(resolve, reject) {
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
        }).then(function() {
            return new Promise(function parseXML(resolve, reject) {
                // Create child python process
                var loadProc = spawn("./python-virtualenv/bin/python", ["./python-virtualenv/bin/parse-pubmed-files", "Retractions"], {
                    stdio: ["pipe", "pipe", "pipe"]
                });
                loadProc.on("exit", function onExit(code, signal) {
                    if (code !== 0 || signal) {
                        reject("Crawling process failed with " + code + " " + signal);
                    } else {
                        console.log(stdout.join(""));
                        resolve(JSON.parse(stdout.join("")));
                    }
                });
                var stdout = [];
                loadProc.stdout.on("data", function onData(data) {
                    stdout.push(String(data));
                });
            });
        }).then(function(json) {
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
        }).then(function() {
            done();
        }).catch(function (error) {
            console.error("Crawing process failed with " + error + " " + error.stack);
            done();
        });
    }, function(error) {
        res.send(500);
        res.json({
            "status": "failure",
            "message": String(error)
        });
    }, function onDone() {
    });

    res.json({
        "status": "started"
    });
});

app.set('port', 6001);

var server = app.listen(app.get('port'), function() {
  console.log('Scraper service server listening on port ' + server.address().port);
});
