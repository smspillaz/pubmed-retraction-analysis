var express = require("express");
var router = express.Router(); // eslint-disable-line new-cap

router.get("/", function onRequestDeveloper(req, res) {
  res.render("developer");
});

module.exports = router;
