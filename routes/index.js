var express = require('express');
var router = express.Router();
const mysql = require('mysql');

let client = mysql.createConnection({
  user: 'root',
  password: 'zkwpdlxmdlrnsgh!2',
  database: 'testdb'
});

/* GET home page. */
/* router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
}); */

router.get('/create', function(req, res, next){
  client.query("select * from testdb.user;", function(err, result, fields){
    if(err){
      console.log(err);
      console.log("쿼리 오류");
    }
    else{
      res.render('create', {
        result: result
      });
    }
  });
});


router.post('/create', function(req, res, next){
  var body = req.body;

  client.query("insert into testdb.user (USER_ID, USER_PW, USER_NAME) values(?,?,?)", [
    body.user_id, body.user_pw, body.user_name
  ], function(err){
    if(err){
      console.log(err);
      console.log("쿼리 오류");
    }
    else{
      console.log("회원가입 성공");
      res.redirect("/create");
    }
  });
});

module.exports = router;
