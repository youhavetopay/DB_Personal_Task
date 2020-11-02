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
  multipleStatements: true
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
        var userId = req.session.user.id;
        console.log(req.session.user.name);
        client.query('select sum(order_total_money) as total_money from order_list where user_user_id = ?', [
          userId
        ], function (err, total_money) {
          if (err) {

          }
          else {
            client.query('select user_give_score from order_list_has_book_list where book_list_book_id ')
            res.render('index', { title: 'IZ*LAND 서점', session: true, result: result, name: req.session.user.name });
          }
        })

      }
      else {
        res.render('index', { title: 'IZ*LAND 서점', session: false, result: result });
      }
    }
  });
});

// 검색결과 랜더링
router.post('/search', function (req, res) {
  console.log(req.body.book_name + '%');
      console.log('%' + req.body.book_name + '%');
      console.log('%' + req.body.book_name);
  client.query('select * from book_list where book_name like ? or ? or ?', [
    req.body.book_name + '%', '%' + req.body.book_name + '%', '%' + req.body.book_name
  ], function (err, book_search_result) {
    if (err) {
      console.log(err);

    }
    else {
      console.log(book_search_result);
      // console.log(req.body.book_name + '%');
      // console.log('%' + req.body.book_name + '%');
      // console.log('%' + req.body.book_name);
      if(book_search_result){
        if(req.session.user){
          res.render('search', {value:req.body.book_name, session:true, result:book_search_result})
        }
        else{
          res.render('search', {value:req.body.book_name, session:false, result:book_search_result})
        }
      }
      else{
        if(req.session.user){
          res.render('search', {value:req.body.book_name, session:true, result:false})
        }
        else{
          res.render('search', {value:req.body.book_name, session:false, result:false})
        }
      }
    }
  })
})

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

  if (body.user_id == '' || body.user_pw == '' || body.user_name == '') {
    //하나라도 안적으면 안됨
    res.send(
      `<script type="text/javascript">
      alert("하나 빼 먹음"); 
      location.href='/';
      </script>`
    );
  }
  else {
    client.query("insert into db.user (USER_ID, USER_PW, USER_NAME) values(?,?,?)", [
      body.user_id, body.user_pw, body.user_name
    ], function (err) {
      if (err) {
        console.log(err);
        console.log("쿼리 오류");
        res.send(
          `<script type="text/javascript">
          alert("아이디 이미 있음"); 
          location.href='/';
          </script>`
        );
      }
      else {
        res.send(
          `<script type="text/javascript">
          alert("회원가입 성공"); 
          location.href='/';
          </script>`
        );
      }
    });
  }
});



module.exports = router;
