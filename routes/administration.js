var express = require("express");
var fetch = require("fetch");
var router = express.Router(); // eslint-disable-line new-cap

/* GET administration page. */
router.get("/", function handleIndexRequest(req, res) {
  res.render("Administration");
});

router.get("/is_crawling", function handleIsCrawingRequest(req, res) {
  if (!process.env.CRAWLING_SERVICE_URL) {
    res.json({
      "status": "failure",
      "msg": "Need to set CRAWLING_SERVICE_URL to use crawler"
    });
  } else {
    fetch.get(process.env.CRAWLING_SERVICE_URL + "/is_crawling").then(function(json) {
      res.json({
        "status": "success",
        "data": json
      });
    }).catch(function onError(err) {
      res.json({
        "status": "failure",
        "data": json
      });
    });
  }
});

router.post("/start_crawling", function handleStartCrawlingRequest(req, res) {
  if (!process.env.CRAWLING_SERVICE_URL) {
    res.json({
      "status": "failure",
      "msg": "Need to set CRAWLING_SERVICE_URL to use crawler"
    });
  } else {
    fetch.get(process.env.CRAWLING_SERVICE_URL + "/is_crawling").then(function(json) {
      res.json({
        "status": "success",
        "data": json
      });
    }).catch(function onError(err) {
      res.json({
        "status": "failure",
        "data": json
      });
    });
  }
})


module.exports = router;
