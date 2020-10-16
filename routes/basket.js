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
            if (results == null || results == "" || results == undefined) {

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
                        res.render('order/basket', { title: userName, list: null, CreateDate: results[0].bas_cr_time });
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
                        if (basket_result == null || basket_result == "" || basket_result == undefined) {
                            // 장바구니 비었을 때 리스트 없음
                            res.render('order/basket', { title: userName, list: null, CreateDate: results[0].bas_cr_time });
                        }
                        else {
                            // 장바구니에 담긴거 있을때 담겨있는 책 정보 가져오기
                            client.query('select book_list_has_basket.book_list_book_id, book_list_has_basket.basket_bas_id,book_list_has_basket.book_count, book_list.book_id, book_list.book_name,book_list.book_stock, book_list.book_price, book_list.book_img_path, (book_list.book_price * book_list_has_basket.book_count) as total_money from book_list_has_basket INNER JOIN book_list on book_list_has_basket.book_list_book_id = book_list.book_id WHERE book_list_has_basket.basket_bas_id =  ?', [
                                results[0].bas_id
                            ],
                                function (err, book_list, field) {
                                    if (err) {
                                        console.log('쿼리 오류');
                                        console.log(err);
                                        res.redirect('/');
                                    }
                                    else {
                                        var money = 0;
                                        for (var i = 0; i < book_list.length; i++) {
                                            money += book_list[i].total_money;
                                        }

                                        console.log(money)

                                        res.render('order/basket', { title: userName, list: book_list, CreateDate: results[0].bas_cr_time, total_money: money });
                                    }
                                })
                        }
                    }
                })
            }

        }

    })

});

// 장바구니 추가
router.post('/add/:book_id', function (req, res, next) {
    var userId = req.session.user.id;
    var bookId = req.params.book_id;
    var nowTime = moment().format('YYYY-MM-DD HH:mm');

    // 장바구니 있는지 없는지 확인
    client.query('select * from basket where user_user_id = ?', [
        userId
    ], function (err, basket_result, field) {
        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else {
            console.log(basket_result);
            if (basket_result == null || basket_result == "" || basket_result == undefined) {
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
                        // 장바구니 방금 만든거 가져오기
                        client.query('select * from basket where user_user_id = ?', [
                            userId
                        ], function (err, new_basket_result, field) {
                            if (err) {
                                console.log('쿼리 오류');
                                console.log(err);
                                res.redirect('/');
                            }
                            else {
                                // 장바구니 안에 이미 책있는 지 확인하기
                                client.query('select * from book_list_has_basket where basket_bas_id = ? and book_list_book_id = ?', [
                                    new_basket_result[0].bas_id, bookId
                                ], function (err, duplicated, field) {
                                    if (err) {
                                        console.log('쿼리 오류');
                                        console.log(err);
                                        res.redirect('/');
                                    }
                                    else {
                                        // 장바구니 안에 같은 책 없을 때만 추가
                                        if (duplicated == null) {
                                            client.query('insert into book_list_has_basket values(?,?,?)', [
                                                bookId, new_basket_result[0].bas_id, 1
                                            ], function (err) {
                                                if (err) {
                                                    console.log('쿼리 오류');
                                                    console.log(err);
                                                    res.redirect('/');
                                                }
                                                else {
                                                    res.send(
                                                        `<script type="text/javascript">
                                                        alert("장바구니에 추가 완료"); 
                                                        location.href='/';
                                                        </script>`
                                                    );
                                                }
                                            })
                                        }
                                        else {
                                            res.send(
                                                `<script type="text/javascript">
                                                alert("이미 장바구니에 책 있음"); 
                                                location.href='/';
                                                </script>`
                                            );
                                        }
                                    }
                                })

                            }
                        })
                    }
                })
            }
            else { // 장바구니 있는 경우
                // 장바구니 안에 이미 책있는 지 확인하기
                client.query('select * from book_list_has_basket where basket_bas_id = ? and book_list_book_id = ?', [
                    basket_result[0].bas_id, bookId
                ], function (err, duplicated, field) {
                    if (err) {
                        console.log('쿼리 오류');
                        console.log(err);
                        res.redirect('/');
                    }
                    else {
                        // 장바구니 안에 같은 책 없을 때만 추가
                        console.log(duplicated);
                        if (duplicated == null || duplicated == "" || duplicated == undefined) {
                            client.query('insert into book_list_has_basket values(?,?,?)', [
                                bookId, basket_result[0].bas_id, 1
                            ], function (err) {
                                if (err) {
                                    console.log('쿼리 오류');
                                    console.log(err);
                                    res.redirect('/');
                                }
                                else {
                                    res.send(
                                        `<script type="text/javascript">
                                        alert("장바구니에 추가 완료"); 
                                        location.href='/';
                                        </script>`
                                    );
                                }
                            })
                        }
                        else {
                            res.send(
                                `<script type="text/javascript">
                                alert("이미 장바구니에 책 있음"); 
                                location.href='/';
                                </script>`
                            );
                        }
                    }
                })
            }
        }
    })

})

// 장바구니 수정 렌더링
router.get('/update/:basketId/:bookId', function (req, res, next) {
    var basketId = req.params.basketId;
    var bookId = req.params.bookId;

    console.log(basketId);
    console.log(bookId);


    client.query('select book_list_has_basket.book_list_book_id, book_list_has_basket.basket_bas_id,book_list_has_basket.book_count, book_list.book_id, book_list.book_name,book_list.book_stock, book_list.book_price, book_list.book_img_path from book_list_has_basket INNER JOIN book_list on book_list_has_basket.book_list_book_id = book_list.book_id WHERE book_list_has_basket.basket_bas_id = ? and book_list_has_basket.book_list_book_id = ?', [
        basketId, bookId
    ], function (err, book_info, field) {
        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else {
            res.render('order/basket_update', { book_info: book_info })
        }
    })


})

// 장바구니 물품 하나 수정
router.post('/update/:bookId/:basketId', function (req, res, next) {
    var basketId = req.params.basketId;
    var bookId = req.params.bookId;
    var body = req.body;

    console.log(body.book_count + bookId + basketId)

    client.query('update book_list_has_basket set book_count = ? where book_list_book_id = ? and basket_bas_id = ?', [
        body.book_count, bookId, basketId
    ], function (err) {
        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else {
            res.send(
                `<script type="text/javascript">
                alert("장바구니 수정 완료"); 
                location.href='/';
                </script>`
            );
        }
    })

});


// 장바구니 물품 하나 삭제
router.post('/delete/:orderId/:bookId', function (req, res, next) {
    var orderId = req.params.orderId;
    var bookId = req.params.bookId;

    console.log(orderId);
    console.log(bookId);

    client.query('delete from book_list_has_basket where book_list_book_id = ? and basket_bas_id =?', [
        bookId, orderId
    ], function (err) {
        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else {
            res.send(
                `<script type="text/javascript">
                alert("장바구니에서 지움"); 
                location.href='/';
                </script>`
            );
        }
    });
});



// 장바구니 주문 렌더링
router.get('/basket_order/:basketId', function (req, res, next) {
    var basketId = req.params.basketId;
    var userId = req.session.user.id;

    // 장바구니에 담겨있는 책 정보 가져오기
    client.query('select book_list_has_basket.book_list_book_id, book_list_has_basket.basket_bas_id,book_list_has_basket.book_count, book_list.book_id, book_list.book_name,book_list.book_stock, book_list.book_price, book_list.book_img_path, (book_list.book_price * book_list_has_basket.book_count) as total_money from book_list_has_basket INNER JOIN book_list on book_list_has_basket.book_list_book_id = book_list.book_id WHERE book_list_has_basket.basket_bas_id = ?', [
        basketId
    ], function (err, book_result, field) {
        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else {
            // 배송지 정보 가져오기
            client.query('select * from address_info where adr_id in (select address_info_adr_id FROM user_has_address_info WHERE user_user_id = ?)', [
                userId
            ], function (err, addres_info, field) {
                if (err) {
                    console.log('쿼리 오류');
                    console.log(err);
                    res.redirect('/');
                }
                else {
                    console.log(addres_info)
                    // 카드 정보 가져오기
                    client.query('select * from card_info where user_user_id = ?', [
                        userId
                    ], function (err, card_info, field) {
                        if (err) {
                            console.log('쿼리 오류');
                            console.log(err);
                            res.redirect('/');
                        }
                        else {
                            console.log(card_info)
                            var money = 0;
                            for (var i = 0; i < book_result.length; i++) {
                                money += book_result[i].total_money;
                            }
                            res.render('order/basket_order', { book_result: book_result, addres_info: addres_info, card_info: card_info, total_money: money });
                        }
                    })
                }
            })
        }
    })

})

module.exports = router;