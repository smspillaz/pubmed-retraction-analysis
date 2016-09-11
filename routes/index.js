var express = require("express");
var router = express.Router();

/* GET home page. */

router.get("/", function handleIndexRequest(req, res) {
  res.render("pubmedRetraction");
});

module.exports = router;
