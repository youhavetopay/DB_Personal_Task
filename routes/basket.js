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

    res.render('order/basket', {userName:userName});

    // client.query('select * from basket where user_user_id = ?;', [
    //     userId
    // ], function (err, results, field) {
    //     console.log('basket select = ' + results);
    //     if (err) {
    //         console.log('쿼리 오류');
    //         console.log(err);
    //         res.redirect('/');
    //     }
    //     else {
    //         if (results == null) {

    //             client.query('insert into basket values(?, ?);', [
    //                 userId, nowTime
    //             ], function (err) {
    //                 if (err) {
    //                     console.log('쿼리 오류');
    //                     console.log(err);
    //                     res.redirect('/');
    //                 }
    //                 else {
    //                     res.render('order/basket', { title: userName, list:false });
    //                 }
    //             })
    //         }
    //         else{
    //             client.query('select ')
    //         }

    //     }

    // })

});

module.exports = router;