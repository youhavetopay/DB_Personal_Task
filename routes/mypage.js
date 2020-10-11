const { compile } = require('ejs');
const { query } = require('express');
var express = require('express');
var router = express.Router();
const mysql = require('mysql');

let client = mysql.createConnection({
  user: 'root',
  host: 'localhost',
  password: '',
  database: 'db',
  multipleStatements: true
});


// mypage 렌더링
router.get('/', function (req, res, next) {

  var userId = req.session.user.id;

  var card_sql = 'select * from card_info where user_user_id = \'' + userId + '\';';
  var adr_sql = 'select * from db.address_info where adr_id in (select address_info_adr_id from db.user_has_address_info where user_user_id = \'' + userId + '\');';
  client.query(card_sql + adr_sql, function (err, results, field) {


    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/');
    }
    else {
      console.log(req.session.user.name);
      var card_result = results[0];
      var adr_result = results[1];
      client.query('select * from order_list where user_user_id = ?',[
        userId
      ], function(err, order_result, field){
        if(err){
          console.log(err);
          res.redirect('/');
        }
        else{
          res.render('users/mypage', { name: req.session.user.name, card_result: card_result, adr_result: adr_result, order_result:order_result });
        }
      })
      
    }
  })

});



// 배송지 정보 삭제
router.post('/adr_delete/:id', function (req, res, next) {

  let adr_id = req.params.id;
  console.log('user id = ' + req.session.user.id);
  var userId = req.session.user.id;

  var adr_delete1 = 'delete from user_has_address_info where user_user_id = \'' + userId + '\' and address_info_adr_id = ' + adr_id + ';';

  client.query(adr_delete1, function (err) {

    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/mypage');
    }
    else {
      console.log("삭제 성공");
      res.redirect('/mypage');
    }

  })


});

// 카드 정보 삭제
router.post('/card_delete/:id', function (req, res, next) {
  let card_num = req.params.id;
  var userId = req.session.user.id;

  client.query('delete from card_info where user_user_id = ? and card_num = ?', [
    userId, card_num
  ], function (err) {
    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/mypage');
    }
    else {
      console.log("삭제 성공");
      res.redirect('/mypage');
    }

  });

});


// 정보(주소, 카드정보)등록 렌더링
router.get('/insert/:type', function (req, res, next) {

  let type = req.params.type;

  if (type == 'card') {
    res.render('user_info/my_info_add', { title: 'card' });
  }
  else {
    res.render('user_info/my_info_add', { title: 'adr' });
  }


});


// 주소등록
router.post('/adr_add', function (req, res, next) {

  let body = req.body;

  client.query('insert into address_info (main_adr, detil_adr, post_num) values(?,?,?)', [
    body.main_adr, body.detil_adr, body.post_num
  ], function (err) {
    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/mypage');

    }
    else {
      client.query('select max(adr_id) as adr_id from address_info', function (err, result2, fields) {
        if (err) {
          console.log('쿼리 오류');
          console.log(err);
          res.redirect('/mypage');

        }
        else {
          var max_adr = result2[0].adr_id;
          var userId = req.session.user.id;

          console.log(result2);
          console.log(result2[0].adr_id);

          client.query('insert into user_has_address_info (user_user_id, address_info_adr_id) values(?,?)', [
            userId, max_adr
          ], function (err) {

            if (err) {
              console.log('쿼리 오류');
              console.log(err);
              res.redirect('/mypage');
            }
            else {
              console.log('등록성공');
              res.redirect('/mypage');

            }

          });
        }
      });
    }
  });

});

// 카드등록
router.post('/card_add', function (req, res, next) {

  var body = req.body;
  var userId = req.session.user.id;

  client.query('insert into card_info (card_num, user_user_id, card_kind, card_valldity) values(?,?,?,?)', [
    body.card_num, userId, body.card_kind, body.card_valldity
  ], function (err) {

    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/mypage');
    }
    else {
      console.log('등록성공');
      res.redirect('/mypage');
    }
  });


});


// 카드정보 수정 렌더링
router.get('/card_edit/:card_num', function (req, res, next) {

  let card_num = req.params.card_num;

  client.query('select * from card_info where card_num = ?', [
    card_num
  ], function (err, result, fields) {
    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/mypage');
    }
    else {
      res.render('user_info/my_info_update', {title: 'card', card_result2:result});
    }
  });

});


// 주소정보 수정 렌더링
router.get('/adr_edit/:adr_id', function (req, res, next) {

  let adr_id = req.params.adr_id;
  console.log(adr_id);

  client.query('select * from address_info where adr_id = ?', [
    adr_id
  ], function (err, result2, fields) {
    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/mypage');
    }
    else {
      console.log(result2[0]);
      res.render('user_info/my_info_update', {title: 'adr', adr_result2:result2});
    }
  });

});


// 카드정보 수정
router.post('/card_update/:card_num', function(req, res, next){

  var body = req.body;
  var card_num = req.params.card_num;

  client.query('update card_info set card_num = ? , card_kind = ? , card_valldity = ? where card_num = ?;',[
    body.card_num, body.card_kind, body.card_valldity, card_num
  ], function(err){
    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/mypage');
    }
    else {
      res.redirect('/mypage');
    }
  })

});

// 주소정보 수정
router.post('/adr_update/:adr_id', function(req, res, next){

  var body = req.body;
  var adr_id = req.params.adr_id;

  client.query('update address_info set main_adr = ? , detil_adr = ?, post_num = ? where adr_id = ?;',[
    body.main_adr, body.detil_adr, body.post_num, adr_id
  ], function(err){
    if (err) {
      console.log('쿼리 오류');
      console.log(err);
      res.redirect('/mypage');
    }
    else {
      res.redirect('/mypage');
    }
  })

});



// 주문 상세정보 렌더링
router.get('/order_detail/:orderId', function(req,res,next){
  var orderId = req.params.orderId;

  client.query('select * from order_list where order_id',[
    orderId
  ], function(err, result_order, fields){
    if(err){
      console.log(err);
      res.redirect('/mypage');
    }
    else{
      client.query('select * from order_list_has_book_list where order_list_order_id = ?',[
        orderId
      ], function(err, result_book_code, fields){
        if(err){
          console.log(err);
          res.redirect('/mypage');
        }
        else{
          client.query('select * from book_list where book_id = ?',[
            result_book_code[0].book_list_book_id
          ], function(err, result_book_img, fields){
            if(err){
              console.log(err);
              res.redirect('/mypage');
            }
            else{
              res.render('order/orderDetail', {
                result_order : result_order,
                result_book_img: result_book_img
              });
            }
          });
        }
      });
    }
  });

});




module.exports = router;