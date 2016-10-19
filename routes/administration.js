var express = require("express");
var router = express.Router(); // eslint-disable-line new-cap

/* GET administration page. */
router.get("/", function handleIndexRequest(req, res) {
  res.render("Administration");
});


module.exports = router;
