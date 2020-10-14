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


// 장바구니 렌더링
router.get('/', function (req, res, next) {

    var userId = req.session.user.id;
    var userName = req.session.user.name;
    var nowTime = moment().format('YYYY-MM-DD HH:mm');
    console.log(nowTime);

    // res.render('order/basket', {userName:userName});

    // 장바구니 있는지 없는 지 확인
    client.query('select * from basket where user_user_id = ?;', [
        userId
    ], function (err, results, field) {
        console.log('basket select = ' + results);
        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else {
            if (results == null) {

                // 장바구니 없으면 장바구니 만들기
                client.query('insert into basket values(?, ?, ?);', [
                    null, userId, nowTime
                ], function (err) {
                    if (err) {
                        console.log('쿼리 오류');
                        console.log(err);
                        res.redirect('/');
                    }
                    else {
                        // 장바구니 방금 만들어서 리스트 없음
                        res.render('order/basket', { title: userName, list: null });
                    }
                })
            }
            else {
                // 장바구니 있으면 장바구니에 담긴 도서 아이디 랑 담은 갯수 가져오기
                client.query('select * from book_list_has_basket where basket_bas_id = (select bas_id from basket where user_user_id = ?)', [
                    userId
                ], function (err, basket_result, field) {
                    if (err) {
                        console.log('쿼리 오류');
                        console.log(err);
                        res.redirect('/');
                    }
                    else {
                        if (basket_result == null) {
                            // 장바구니 비었을 때 리스트 없음
                            res.render('order/basket', { title: userName, list: null });
                        }
                        else {
                            // 장바구니에 담긴거 있을때 담겨있는 책 정보 가져오기
                            client.query('select book_list_has_basket.book_list_book_id, book_list_has_basket.book_count, book_list.book_id, book_list.book_name, book_list.book_price, book_list.book_img_path from book_list_has_basket INNER JOIN book_list on book_list_has_basket.book_list_book_id = book_list.book_id', 
                            function (err, book_list, field) {
                                if (err) {
                                    console.log('쿼리 오류');
                                    console.log(err);
                                    res.redirect('/');
                                }
                                else {
                                    res.render('order/basket', { title: userName, list: book_list});
                                }
                            })
                        }
                    }
                })
            }

        }

    })

});


module.exports = router;