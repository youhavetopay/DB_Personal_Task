var express = require('express'),
router = express.Router();

router.get("/hahaha", function(req, res, next){
    res.send("new Router add !!!!!!!!!!");
});

module.exports = router;