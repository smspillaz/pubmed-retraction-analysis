var express = require("express");
var router = express.Router(); // eslint-disable-lint new-cap

/* GET home page. */

router.get("/", function handleIndexRequest(req, res) {
  res.render("pubmedRetraction");
});

module.exports = router;
