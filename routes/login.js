var express = require('express');
var router = express.Router();
const mysql = require('mysql');

let client = mysql.createConnection({
  user: 'root',
  host:'localhost',
  password: '',
  database: 'db'
});


module.exports = router;