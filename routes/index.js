var express = require('express');
var router = express.Router();
const mysql = require('mysql');

/* let client = mysql.createConnection({
  user: 'root',
  password: 'zkwpdlxmdlrnsgh!2',
  database: 'testdb'
}); */

let client = mysql.createConnection({
  user: 'root',
  host: 'localhost',
  password: '',
  database: 'db',
  multipleStatements:true
});

/* GET home page. */

// 메인페이지 렌더링
router.get('/', function (req, res, next) {

  client.query("select * from db.book_list;", function (err, result, fields) {
    if (err) {
      console.log(err);
      console.log("쿼리 오류");
    }
    else {
      if (req.session.user) {
        console.log(req.session.user.name);
        res.render('index', { title: 'Express', session: true, name: req.session.user.name, result:result });
      }
      else {
        res.render('index', { title: 'Express', session: false, result:result });
      }
    }
  });
});

// 회원가입 렌더링
router.get('/create', function (req, res, next) {
  client.query("SELECT * FROM db.user;", function (err, result, fields) {
    if (err) {
      console.log(err);
      console.log("쿼리 오류");
    }
    else {
      res.render('create', {
        result: result
      });
    }
  });
});


// 회원가입
router.post('/create', function (req, res, next) {
  var body = req.body;

  client.query("insert into db.user (USER_ID, USER_PW, USER_NAME) values(?,?,?)", [
    body.user_id, body.user_pw, body.user_name
  ], function (err) {
    if (err) {
      console.log(err);
      console.log("쿼리 오류");
    }
    else {
      console.log("회원가입 성공");
      res.redirect("/create");
    }
  });
});



module.exports = router;
