var express = require('express');
const session = require('express-session');
var router = express.Router();
const mysql = require('mysql');
const users = require('../controller/users')


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


let client = mysql.createConnection({
  user: 'root',
  host:'localhost',
  password: '',
  database: 'db',
  multipleStatements:true
});


// 로그인 렌더링
router.get('/login', function(req, res, next){
  if(req.session.user){
    res.render('users/login', {session: true});
  }
  else{
    res.render('users/login', {session: false});
  }
  

});


// 로그아웃
router.get('/logout', function(req, res, next){
  req.session.destroy();
  res.clearCookie('sid');

  res.redirect('/');
})


// 로그인 확인
router.post('/login', function(req, res, next){

  var user_id = req.body.user_id
  var user_pw = req.body.user_pw;

  if(user_id == '' || user_pw== ''){ //입력안하면 안됨
    res.send(
      `<script type="text/javascript">
      alert("하나 빼 먹음"); 
      location.href='/users/login';
      </script>`
  );
  }
  else{
    client.query('select * from db.user where user_id= ? and user_pw = ?',[
      user_id, user_pw
    ], function(err, result){
      if(err){
        console.log("sql err");
        console.log(err);
      }
      else{
        if(result[0] == null){
          res.send(
            `<script type="text/javascript">
            alert("로그인 정보 틀림"); 
            location.href='/users//login';
            </script>`
        );
          
        }
        else{
          console.log(result[0].user_name);
          req.session.user = {
            "name" : result[0].user_name,
            "id" : result[0].user_id
            
          };

          res.send(
            `<script type="text/javascript">
            alert("로그인 성공"); 
            location.href='/';
            </script>`
        );

        }
        
      }
    })
  }
})


module.exports = router;
