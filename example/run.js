#!/usr/bin/env node

var express = require('express'),
    cachify = require('../');

var app = express.createServer();

app.use(cachify.setup({
  '/prod/min.css': [
    "/css/a.css",
    "/css/b.css",
    "/css/c.css"
  ], 
  '/prod/min.js': [
    "/js/a.js",
    "/js/b.js",
    "/js/c.js"
  ]
}, {
  root: __dirname,
  production: !process.env['DEV']
}));

app.set('views', __dirname);
app.set('view options', { layout: false });
app.get('/', function(req, res){
  res.render('index.ejs');
});

app.use(express.static(__dirname)); 

app.listen(3000);
