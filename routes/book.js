const { compile } = require('ejs');
const { query } = require('express');
var express = require('express');
var router = express.Router();
const path = require('path');
const mysql = require('mysql');
var multer = require('multer');

let code = false;

// 업로드 하는 파일 저장
var storage = multer.diskStorage({
    destination: function(req, file, cd){
        cd(null, "public/book_img/");
    },
    filename: function(req, file, cd){
        let extension = path.extname(file.originalname);
        let basename = path.basename(file.originalname, extension);

        var bookId = req.params.book_id;
        var body = req.body;
        console.log( body.name + body.stock + body.price );

        console.log('책이름 '+basename+"-"+Date.now()+extension)

        code = true;

        if(bookId == null){
            // 책 새로 추가
            client.query('insert into book_list values(?,?,?,?,?)',[
                null,body.bookName, body.bookStock, body.bookPrice, basename+"-"+Date.now()+extension
            ], function(err){
                if(err){
                    console.log('쿼리오류');
                    console.log(err);
                }
            })
        }
        else{
            // 책 정보 수정
            client.query('update book_list set book_name = ?, book_stock =?, book_price =?, book_img_path = ? where book_id = ?',[
                body.name, body.stock, body.price, basename+"-"+Date.now()+extension, bookId
            ], function(err){
                if(err){
                    console.log('쿼리오류');
                    console.log(err);
                }
            })
        }

        cd(null, basename+"-"+Date.now()+extension);
    }
    
})
var upload = multer({ 
    storage: storage
 })

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

    // 도서테이블에서 도서 정보 가져오기
    client.query('select * from book_list where book_id = ?', [
        bookId
    ], function (err, result_book, field) {

        if (err) {
            console.log('쿼리 오류');
            console.log(err);
            res.redirect('/');
        }
        else{
            // user가 등록한 카드정보 가져오기
            client.query('select * from card_info where user_user_id = ?',[
                userId
            ], function(err, result_card, field){
                if (err) {
                    console.log('쿼리 오류');
                    console.log(err);
                    res.redirect('/');
                }
                else{
                    // 유저가 등록한 배송지 정보 가져오기
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



//바로주문
router.post('/order/:book_id/:book_price/:book_count', function(req, res, next){
    var bookId = req.params.book_id;
    var bookPrice = req.params.book_price;
    var book_count = req.params.book_count;

    var body = req.body;
    var userId = req.session.user.id;
    var nowTime = moment().format('YYYY-MM-DD HH:mm:ss');

    console.log('수량' + body.select_book_count)
    console.log('카드' + body.select_card)
    console.log('주소'+ body.select_adr)

    if(body.select_book_count == undefined || body.select_card == undefined || body.select_adr == undefined){
        console.log('하나 빼 먹음');
        res.redirect('/');
    }
    else{
        if(book_count <= 0){  // 재고량 없으면 주문 안됨
            console.log("재고없음")
            res.redirect('/');
        }
        else{
            var totalPrice = bookPrice * body.select_book_count;
    
        // 드롭박스에서 가져온 카드정보 가져오기
        client.query('select * from card_info where card_num = ?',[
            body.select_card
        ], function(err, result_card, field){
            if(err){
                console.log(err);
                res.redirect('/');
            }
            else{
                // 드롭박스에서 가져온 배송지 정보 가져오기
                client.query('select * from address_info where adr_id = ?',[
                    body.select_adr
                ], function(err, result_adr, field){
                    if(err){
                        console.log(err);
                        res.redirect('/');
                    }
                    else{
                        // order_list테이블에 값 넣기 
                        client.query('insert into order_list values(?,?,?,?,?,?,?,?,?,?);',[
                            null,userId, nowTime, totalPrice, result_card[0].card_kind, result_card[0].card_num, result_card[0].card_valldity, result_adr[0].post_num, result_adr[0].main_adr, result_adr[0].detil_adr
                        ], function(err){
                            if(err){
                                console.log(err);
                                res.redirect('/');
                            }
                            else{
                                // 가장 최근에 등록한 주문번호 가져오기
                                client.query('select max(order_id) as order_id from order_list;',function(err, result_select, field){
                                    if(err){
                                        console.log(err);
                                        res.redirect('/');
                                    }
                                    else{
                                        // 주문도서목록에 값 넣기
                                        client.query('insert into order_list_has_book_list values(?, ? ,?)',[
                                            result_select[0].order_id, bookId, body.select_book_count
                                        ], function(err){
                                            if(err){
                                                console.log(err);
                                                res.redirect('/');
                                            }
                                            else{
                                                var new_book_count = book_count-body.select_book_count;
                                                // 주문한 도서 권수 만큼 도서 재고량 빼기
                                                client.query('update book_list set book_stock = ? where book_id = ?',[
                                                    new_book_count, bookId
                                                ], function(err){
                                                    if(err){
                                                        console.log(err);
                                                        res.redirect('/');
                                                    }
                                                    else{
                                                        res.send(
                                                            `<script type="text/javascript">
                                                            alert("주문완료"); 
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
                });
            }
        })
        }
    }


})

// 책 정보 수정페이지 렌더링
router.get('/update/:book_id', function(req, res, next){
    var bookId = req.params.book_id;

    // 책정보 가져오기
    client.query('select * from book_list where book_id = ?',[
        bookId
    ], function(err, result, field){
        if(err){
            console.log('에러발생')
            console.log(err)
        }
        else{
            res.render('book/bookUpdate', {
                book_info: result
            })
        }
    })
})

// 책 추가 페이지 렌더링
router.get('/add', function(req, res, next){
    
    res.render('book/bookAdd');

});

// 책 추가
router.post('/add', upload.single('bookImg'),function(req, res, next){
    var body = req.body;

    // code는 이미지가 들어갔는지 아닌지 확인할려구

    if(body.bookName == "" || body.bookStock == "" || body.bookPrice == "" || code == false){
        res.send(
            `<script type="text/javascript">
            alert("하나 빼 먹음"); 
            location.href='/';
            </script>`
        );
    }
    else{
        // 맨위에 참고
        code = false;
        res.send(
            `<script type="text/javascript">
            alert("책 추가 성공"); 
            location.href='/';
            </script>`
        );
        // // 책 추가
    }
})


// 책 정보 수정
router.post('/update/:book_id',upload.single('img'),function(req, res, next){
    var bookId = req.params.book_id;

    var body = req.body;

    // code는 이미지가 들어갔는지 아닌지 확인할려구

    if(body.name == "" || body.stock == "" || body.price == "" || code == false){
        res.send(
            `<script type="text/javascript">
            alert("하나 빼 먹음"); 
            location.href='/';
            </script>`
        );
    }
    else{
        // 맨위에 참고
        code = false
        res.send(
            `<script type="text/javascript">
            alert("책 수정 성공"); 
            location.href='/';
            </script>`
        );
        // // 책 정보 수정
    }
})




// 책 정보 삭제  ==> 하면 안 될듯??
router.post('/delete/:book_id', function(req, res, next){
    var bookId = req.params.book_id;

    // 책정보 삭제 
    client.query('delete from book_list where book_id = ?',[
        bookId
    ], function(err){
        if(err){
            console.log('에러발생')
            console.log(err)
        }
        else{
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