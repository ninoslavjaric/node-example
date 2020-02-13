const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const basicAuth = require('express-basic-auth');
require('./logic/cron.js');

const app = express();

const authCreds = process.env.MONITOR_CREDENTIALS || 'admin:admin';

app.use(basicAuth({
    challenge: true,
    users: JSON.parse(`{"${authCreds.replace(':', '":"')}"}`)
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

fs.readdirSync(__dirname + '/routes').forEach(file => {
    let parts = file.match(/^(.+)\.js$/);

if (parts) {
    let router = require('./routes/', parts[1]);
    let path = parts[1] === 'index' ? '/' : parts[1];
    app.use(path, router);
}
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
