const { query } = require('express');
var express = require('express');
var router = express.Router();
const mysql = require('mysql');

let client = mysql.createConnection({
  user: 'root',
  host:'localhost',
  password: '',
  database: 'db',
  multipleStatements:true
});

router.get('/', function(req, res, next) {

  var card_sql = 'select * from card_info where user_user_id = \''+req.session.user.id+'\';';
  var adr_sql = 'select main_adr, detil_adr, post_num from db.address_info where adr_id = (select address_info_adr_id from db.user_has_address_info where user_user_id = \''+req.session.user.id+'\');';
  client.query(card_sql + adr_sql, function(err, results, field){
    

    if(err){
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/');
    }
    else{
      var card_result = results[0];
      var adr_result = results[1];
      res.render('mypage',{name: req.session.user.name, card_result:card_result, adr_result:adr_result});
    }
  })
  
 }); 

 
module.exports = router;