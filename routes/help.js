var express = require("express");
var router = express.Router(); // eslint-disable-line new-cap

router.get("/", function(req, res) {
  res.render("help");
});

module.exports = router;