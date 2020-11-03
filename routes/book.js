const { compile } = require('ejs');
const { query } = require('express');
var express = require('express');
var router = express.Router();
const path = require('path');
const mysql = require('mysql');
var multer = require('multer');

let code = false;
let minus = false;

// 업로드 하는 파일 저장
var storage = multer.diskStorage({
    destination: function (req, file, cd) {
        cd(null, "public/book_img/");
    },
    filename: function (req, file, cd) {
        let extension = path.extname(file.originalname);
        let basename = path.basename(file.originalname, extension);

        var bookId = req.params.book_id;
        var body = req.body;
        console.log(body.name + body.stock + body.price);

        console.log('책이름 ' + basename + "-" + Date.now() + extension)

        // 이미지 넣었는지 체크
        code = true;

        // 마이너스 체크
        if (body.stock < 0 || body.price < 1 || body.bookStock < 0 || body.bookPrice < 1) {
            console.log('마이너스 입력함');
            minus = false
        }
        else {
            if (bookId == null) {
                // 책 새로 추가
                client.query('insert into book_list values(?,?,?,?,?)', [
                    null, body.bookName, body.bookStock, body.bookPrice, basename + "-" + Date.now() + extension
                ], function (err) {
                    if (err) {
                        console.log('쿼리오류');
                        console.log(err);
                    }
                })
            }
            else {
                // 책 정보 수정
                client.query('update book_list set book_name = ?, book_stock =?, book_price =?, book_img_path = ? where book_id = ?', [
                    body.name, body.stock, body.price, basename + "-" + Date.now() + extension, bookId
                ], function (err) {
                    if (err) {
                        console.log('쿼리오류');
                        console.log(err);
                    }
                })
            }
            minus = true;
        }

        cd(null, basename + "-" + Date.now() + extension);
    }

})
var upload = multer({
    storage: storage
})

var moment = require('moment');
const { min } = require('moment');
const { count } = require('console');
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

    // 도서테이블에서 도서 정보 가져오기
    client.query('select * from book_list where book_id = ?', [
        bookId
    ], function (err, result_book, field) {

        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else {
            // user가 등록한 카드정보 가져오기
            client.query('select * from card_info where user_user_id = ?', [
                userId
            ], function (err, result_card, field) {
                if (err) {
                    console.log('쿼리 오류');
                    console.log(err);
                    res.redirect('/');
                }
                else {
                    // 유저가 등록한 배송지 정보 가져오기
                    client.query('select * from db.address_info where adr_id in (select address_info_adr_id from db.user_has_address_info where user_user_id = ?)', [
                        userId
                    ], function (err, result_adr, field) {
                        if (err) {
                            console.log('쿼리 오류');
                            console.log(err);
                            res.redirect('/');
                        }
                        else {
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



//바로주문
router.post('/order/:book_id/:book_price/:book_count', function (req, res, next) {
    var bookId = req.params.book_id;
    var bookPrice = req.params.book_price;
    var book_count = req.params.book_count;

    var coupon_num = req.body.coupon_num;

    var body = req.body;
    var userId = req.session.user.id;
    var nowTime = moment().format('YYYY-MM-DD HH:mm:ss');

    console.log('수량' + body.select_book_count)
    console.log('카드' + body.select_card)
    console.log('주소' + body.select_adr)

    client.query('select * from coupon where coupon_id = ? and use_YN = ?',[
        coupon_num,'N' 
    ], function(err, coupon_result){
        if(err){
            console.log(err);
        }
        else{
            
            if(coupon_result[0] != undefined){
                if (body.select_book_count == undefined || body.select_card == undefined || body.select_adr == undefined) {
                    console.log('하나 빼 먹음');
                    res.redirect('/');
                }
                else {
                    if (book_count <= 0) {  // 재고량 없으면 주문 안됨
                        console.log("재고없음")
                        res.redirect('/');
                    }
                    else {
                        var totalPrice = bookPrice * body.select_book_count;
            
            
            
                        // 드롭박스에서 가져온 카드정보 가져오기
                        client.query('select * from card_info where card_num = ?', [
                            body.select_card
                        ], function (err, result_card, field) {
                            if (err) {
                                console.log(err);
                                res.redirect('/');
                            }
                            else {
                                // 드롭박스에서 가져온 배송지 정보 가져오기
                                client.query('select * from address_info where adr_id = ?', [
                                    body.select_adr
                                ], function (err, result_adr, field) {
                                    if (err) {
                                        console.log(err);
                                        res.redirect('/');
                                    }
                                    else {
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
                                        var dis = 0
                                        var dis2;
                                        console.log(coupon_result[0]);
                                        if(coupon_result[0].discount_money_m == null){
                                            dis2 = coupon_result[0].discount_money_P;
                                            console.log('할인  '+dis2);
                                            
                                        }
                                        else {
                                            dis = coupon_result[0].discount_money_m;
                                            console.log('할인  '+dis);
                                        }
                            
            
                                        // order_list테이블에 값 넣기 
                                        client.query('insert into order_list values(?,?,?,?,?,?,?,?,?,?,?,0);', [
                                            null, userId, nowTime, totalPrice*discount, result_card[0].card_kind, result_card[0].card_num, result_card[0].card_valldity, result_adr[0].post_num, result_adr[0].main_adr, result_adr[0].detil_adr,
                                            totalPrice
                                        ], function (err) {
                                            if (err) {
                                                console.log(err);
                                                res.redirect('/');
                                            }
                                            else {
                                                // 가장 최근에 등록한 주문번호 가져오기
                                                client.query('select max(order_id) as order_id from order_list;', function (err, result_select, field) {
                                                    if (err) {
                                                        console.log(err);
                                                        res.redirect('/');
                                                    }
                                                    else {
                                                        // 주문도서목록에 값 넣기
                                                        // req.body.book_score
                                                        // 책 가격 가져오기
                                                        client.query('select * from book_list where book_id = ?',[
                                                            parseInt(bookId)
                                                        ], function(err, book_search_result){
                                                            if(err){
                                                                console.log(err);
                                                            }
                                                            else{
                                                                if(dis>1){
                                                                    client.query('insert into order_list_has_book_list values(?, ? ,?, null, ?,?)', [
                                                                        result_select[0].order_id, bookId, body.select_book_count, coupon_num, book_search_result[0].book_price - dis
                                                                    ], function (err) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                            res.redirect('/');
                                                                        }
                                                                        else {
                                                                            var new_book_count = book_count - body.select_book_count;
                                                                            // 주문한 도서 권수 만큼 도서 재고량 빼기
                                                                            // book_score = (select avg(user_give_score) from order_list_has_book_list where book_list_book_id =? )
                                                                            client.query('update book_list set book_stock = ? where book_id = ?', [
                                                                                new_book_count,bookId
                                                                            ], function (err) {
                                                                                if (err) {
                                                                                    console.log(err);
                                                                                    res.redirect('/');
                                                                                }
                                                                                else {
                                                                                    client.query('update coupon set use_YN = ?, user_day = ? where coupon_id = ?',[
                                                                                        'Y',nowTime,coupon_num
                                                                                    ], function(err){
                                                                                        res.send(
                                                                                            `<script type="text/javascript">
                                                                                            alert("주문 완료"); 
                                                                                            location.href='/';
                                                                                            </script>`
                                                                                        );
                                                                                    })
                                                                            
                                                                                    
                                                                                }
                                                                            })
                                                                        }
                                                                    })
                                                                }
                                                                else{
                                                                    client.query('insert into order_list_has_book_list values(?, ? ,?, null, ?,?)', [
                                                                        result_select[0].order_id, bookId, body.select_book_count, coupon_num, book_search_result[0].book_price * dis2
                                                                    ], function (err) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                            res.redirect('/');
                                                                        }
                                                                        else {
                                                                            var new_book_count = book_count - body.select_book_count;
                                                                            // 주문한 도서 권수 만큼 도서 재고량 빼기
                                                                            // book_score = (select avg(user_give_score) from order_list_has_book_list where book_list_book_id =? )
                                                                            client.query('update book_list set book_stock = ? where book_id = ?', [
                                                                                new_book_count,bookId
                                                                            ], function (err) {
                                                                                if (err) {
                                                                                    console.log(err);
                                                                                    res.redirect('/');
                                                                                }
                                                                                else {
                        
                                                
                                                                                    client.query('update coupon set use_YN = ?, user_day =? where coupon_id = ?',[
                                                                                        'Y', nowTime,coupon_num
                                                                                    ], function(err){
                                                                                        res.send(
                                                                                            `<script type="text/javascript">
                                                                                            alert("주문 완료"); 
                                                                                            location.href='/';
                                                                                            </script>`
                                                                                        );
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
                                            }
                                        })
                                    }
                                });
                            }
                        })
                    }
                }
            }
            else{
                console.log('쿠폰번호 X');
                
                res.send(
                    `<script type="text/javascript">
                    alert("쿠폰번호 틀림"); 
                    location.href='/';
                    </script>`
                );
            }
        }
    })

    


})

// 책 정보 수정페이지 렌더링
router.get('/update/:book_id', function (req, res, next) {
    var bookId = req.params.book_id;

    // 책정보 가져오기
    client.query('select * from book_list where book_id = ?', [
        bookId
    ], function (err, result, field) {
        if (err) {
            console.log('에러발생')
            console.log(err)
        }
        else {
            res.render('book/bookUpdate', {
                book_info: result
            })
        }
    })
})

// 책 추가 페이지 렌더링
router.get('/add', function (req, res, next) {

    res.render('book/bookAdd');

});

// 책 추가
router.post('/add', upload.single('bookImg'), function (req, res, next) {
    var body = req.body;

    // code는 이미지가 들어갔는지 아닌지 확인할려구

    if (minus) {
        if (body.bookName == "" || body.bookStock == "" || body.bookPrice == "" || code == false) {
            res.send(
                `<script type="text/javascript">
                alert("하나 빼 먹음"); 
                location.href='/';
                </script>`
            );
        }
        else {
            // 맨위에 참고
            code = false;
            res.send(
                `<script type="text/javascript">
                alert("책 추가 성공"); 
                location.href='/';
                </script>`
            );
        }
        // // 책 추가
    }
    else {
        minus = false;
        code = false;
        res.send(
            `<script type="text/javascript">
                alert("마이너스 입력하거나 하나 빼먹음"); 
                location.href='/';
                </script>`
        );
    }
})


// 책 정보 수정
router.post('/update/:book_id', upload.single('img'), function (req, res, next) {
    var bookId = req.params.book_id;

    var body = req.body;

    // code는 이미지가 들어갔는지 아닌지 확인할려구

    if (minus) {
        if (body.bookName == "" || body.bookStock == "" || body.bookPrice == "" || code == false) {
            res.send(
                `<script type="text/javascript">
                alert("하나 빼 먹음"); 
                location.href='/';
                </script>`
            );
        }
        else {
            // 맨위에 참고
            code = false;
            res.send(
                `<script type="text/javascript">
                alert("책 추가 성공"); 
                location.href='/';
                </script>`
            );
        }
        // // 책 추가
    }
    else {
        minus = false;
        code = false;
        res.send(
            `<script type="text/javascript">
                alert("마이너스 입력하거나 하나 빼먹음"); 
                location.href='/';
                </script>`
        );
    }
})




// 책 정보 삭제  ==> 하면 안 될듯??
router.post('/delete/:book_id', function (req, res, next) {
    var bookId = req.params.book_id;

    // 책정보 삭제 
    client.query('delete from book_list where book_id = ?', [
        bookId
    ], function (err) {
        if (err) {
            console.log('에러발생')
            console.log(err)
        }
        else {
            res.send(
                `<script type="text/javascript">
                alert("책 삭제 성공"); 
                location.href='/';
                </script>`
            );
        }
    })
})



module.exports = router;