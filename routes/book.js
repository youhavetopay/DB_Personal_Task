const { compile } = require('ejs');
const { query } = require('express');
var express = require('express');
var router = express.Router();
const mysql = require('mysql');

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

let client = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    password: '',
    database: 'db',
    multipleStatements: true
});


// 바로주문 렌더링
router.get('/buy_now/:bookId', function (req, res, next) {
    var bookId = req.params.bookId;
    var userId = req.session.user.id;

    client.query('select * from book_list where book_id = ?', [
        bookId
    ], function (err, result_book, field) {

        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else{
            client.query('select * from card_info where user_user_id = ?',[
                userId
            ], function(err, result_card, field){
                if (err) {
                    console.log('쿼리 오류');
                    console.log(err);
                    res.redirect('/');
                }
                else{
                    client.query('select * from db.address_info where adr_id in (select address_info_adr_id from db.user_has_address_info where user_user_id = ?)',[
                        userId
                    ], function(err, result_adr, field){
                        if (err) {
                            console.log('쿼리 오류');
                            console.log(err);
                            res.redirect('/');
                        }
                        else{
                            res.render('order/book_now_buy', {
                                bookResult: result_book, 
                                cardResult: result_card, 
                                adrResult: result_adr
                            });
                        }
                    });
                }
            });
        }

    });

});



//주문 
router.post('/order/:book_id/:book_price/:book_count', function(req, res, next){
    var bookId = req.params.book_id;
    var bookPrice = req.params.book_price;
    var book_count = req.params.book_count;

    var body = req.body;
    var userId = req.session.user.id;
    var nowTime = moment().format('YYYY-MM-DD HH:mm:ss');

    var totalPrice = bookPrice * body.select_book_count;

    client.query('select * from card_info where card_num = ?',[
        body.select_card
    ], function(err, result_card, field){
        if(err){
            console.log(err);
            res.redirect('/');
        }
        else{
            client.query('select * from address_info where adr_id = ?',[
                body.select_adr
            ], function(err, result_adr, field){
                if(err){
                    console.log(err);
                    res.redirect('/');
                }
                else{
                    client.query('insert into order_list values(?,?,?,?,?,?,?,?,?,?);',[
                        null,userId, nowTime, totalPrice, result_card[0].card_kind, result_card[0].card_num, result_card[0].card_valldity, result_adr[0].post_num, result_adr[0].main_adr, result_adr[0].detil_adr
                    ], function(err){
                        if(err){
                            console.log(err);
                            res.redirect('/');
                        }
                        else{
                            client.query('select max(order_id) as order_id from order_list;',function(err, result_select, field){
                                if(err){
                                    console.log(err);
                                    res.redirect('/');
                                }
                                else{
                                    client.query('insert into order_list_has_book_list values(?, ? ,?)',[
                                        result_select[0].order_id, bookId, body.select_book_count
                                    ], function(err){
                                        if(err){
                                            console.log(err);
                                            res.redirect('/');
                                        }
                                        else{
                                            var new_book_count = book_count-body.select_book_count;
                                            client.query('update book_list set book_stock = ? where book_id = ?',[
                                                new_book_count, bookId
                                            ], function(err){
                                                if(err){
                                                    console.log(err);
                                                    res.redirect('/');
                                                }
                                                else{
                                                    console.log('주문성공');
                                                    res.redirect('/');
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            });
        }
    })

})



module.exports = router;