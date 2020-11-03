const { compile } = require('ejs');
const { query } = require('express');
var express = require('express');

var router = express.Router();
const mysql = require('mysql');
var moment = require('moment');
const e = require('express');
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
            if (results.length == 0) {

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
                        client.query('select * from basket where user_user_id = ?', [
                            userId
                        ], function (err, result_time, field) {
                            if (err) {

                            }
                            else {
                                // 장바구니 방금 만들어서 리스트 없음
                                res.render('order/basket', { title: userName, list: null, CreateDate: result_time[0].bas_cr_time });
                            }
                        })
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
                        if (basket_result.length == 0) {
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
            console.log('타입 : ' + typeof (basket_result))
            console.log(basket_result.length)
            console.log('장바구니 있는지 없는지 확인 ' + basket_result);

            if (basket_result.length == 0) {
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
                                        if (duplicated.length == 0) {
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
                        if (duplicated.length == 0) {
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
                            res.render('order/basket_order', { book_result: book_result, addres_info: addres_info, card_info: card_info, total_money: money, basketId: basketId });
                        }
                    })
                }
            })
        }
    })

})

// 장바구니 주문 
router.post('/order/:basketId', function (req, res, next) {
    var basketId = req.params.basketId;
    var body = req.body;

    var userId = req.session.user.id;

    var cardNum = body.select_card;
    var adrInfo = body.select_adr;

    var coupon = body.coupon;

    console.log(coupon);

    var nowTime = moment().format('YYYY-MM-DD HH:mm');

    // 선택한 카드정보랑 배송지 정보가져오기
    client.query('select * from address_info, card_info where card_num = ? AND adr_id = ?', [
        cardNum, adrInfo
    ], function (err, user_info, field) {
        if (err) {

        }
        else {
            // 장바구니에 담긴 책 정보 랑 총 구매 가격 가져오기
            client.query('select book_list_has_basket.book_list_book_id, book_list_has_basket.basket_bas_id,book_list_has_basket.book_count, book_list.book_id, book_list.book_name,book_list.book_stock, book_list.book_price, book_list.book_img_path, (book_list.book_price * book_list_has_basket.book_count) as total_money from book_list_has_basket INNER JOIN book_list on book_list_has_basket.book_list_book_id = book_list.book_id WHERE book_list_has_basket.basket_bas_id = ?', [
                basketId
            ], function (err, booK_info, field) {
                if (err) {
                    console.log('쿼리 오류1');
                    console.log(err);
                    res.redirect('/');
                }
                else {
                    console.log(req.body.scores);
                    var total_money = 0;
                    for (let data of booK_info) {
                        total_money += data.total_money;
                    }

                    var vali = 0;

                    // 재고 검사
                    for (var count = 0; count < booK_info.length; count++) {
                        if (booK_info[count].book_stock - booK_info[count].book_count < 0) {
                            vali = 1;
                            break;
                        }
                    }
                    // 장바구니 목록중 하나라도 모자랄 경우
                    if (vali == 1) {
                        res.send(
                            `<script type="text/javascript">
                        alert("재고 부족"); 
                        location.href='/';
                        </script>`
                        );
                    }

                    // 재고 충분할때
                    else {
                        // order_list 테이블에 insert
                        var discount = 1
                        var dis_p = 0;
                        // if (req.session.user.grade > 100000 && req.session.user.grade <= 200000) {
                        //     discount = 0.8;
                        //     dis_p = 20;
                        // }
                        // else if (req.session.user.grade > 200000 && req.session.user.grade < 300000) {
                        //     discount = 0.7;
                        //     dis_p = 30;
                        // }
                        // else if (req.session.user.grade >= 300000) {
                        //     discount = 0.5;
                        //     dis_p = 50;
                        // }
                        console.log('할인률 ' + dis_p)
                        client.query('insert into order_list values(?,?,?,?,?,?,?,?,?,?,?,?)', [
                            null, userId, nowTime, total_money * discount, user_info[0].card_kind, user_info[0].card_num, user_info[0].card_valldity, user_info[0].post_num, user_info[0].main_adr, user_info[0].detil_adr,
                            total_money, dis_p
                        ], function (err) {
                            if (err) {

                                console.log('쿼리 오류2');
                                console.log(err);
                                res.redirect('/');
                            }
                            else {
                                //가장 최근에 추가된 주문번호 가져오기
                                client.query('select max(order_id) as order_id from order_list',
                                    function (err, order_id, field) {
                                        if (err) {
                                            console.log('쿼리 오류3');
                                            console.log(err);
                                            res.redirect('/');
                                        }
                                        else {
                                            // 주문 상세정보에 책 정보 넣기
                                            for (var i = 0; i < booK_info.length; i++) {
                                                console.log('책 길이 '+booK_info.length);
                                                // req.body.scores[i]
                                                client.query('insert into order_list_has_book_list values(?,?,?,null)', [
                                                    order_id[0].order_id, booK_info[i].book_list_book_id, booK_info[i].book_count
                                                ], function (err) {
                                                    if (err) {
                                                        console.log('쿼리 오류4');
                                                        console.log(err);
                                                        res.redirect('/');
                                                    }
                                                    else {
                                                        console.log("상세정보 인서트");
                                                    }
                                                })
                                                // 책 주문한 만큼 재고량 빼기
                                                console.log("재고량 업데이트1 "+i);
                                                // booK_info[i].book_list_book_id,
                                                // book_score = (select avg(user_give_score) from order_list_has_book_list where book_list_book_id = ? )
                                                client.query('update book_list set book_stock = ? where book_id = ?', [
                                                    booK_info[i].book_stock - booK_info[i].book_count, booK_info[i].book_list_book_id
                                                ], function (err) {
                                                    if (err) {
                                                        console.log('쿼리 오류5');
                                                        console.log(err);
                                                        res.redirect('/');
                                                    }
                                                    else {
                                                        console.log("재고량 업데이트"+i);
                                        
                                                    }
                                                })
                                                
                                            }
                            

                                            // 장바구니 목록 삭제하기
                                            client.query('delete from book_list_has_basket where basket_bas_id= ?', [
                                                basketId
                                            ], function (err) {
                                                if (err) {
                                                    console.log('쿼리 오류6');
                                                    console.log(err);
                                                    res.redirect('/');
                                                }
                                                else {
                                                    client.query('delete from basket where user_user_id = ?', [
                                                        userId
                                                    ], function (err) {
                                                        if (err) {
                                                            console.log('쿼리 오류7');
                                                            console.log(err);
                                                            res.redirect('/');
                                                        }
                                                        else {
                                                            res.send(
                                                                `<script type="text/javascript">
                                                        alert("장바구니 주문 성공"); 
                                                        location.href='/';
                                                        </script>`
                                                            );
                                                        }
                                                    })
                                                }
                                            })


                                        }
                                    })
                            }
                        })
                    }
                }
            })
        }
    })

})

module.exports = router;