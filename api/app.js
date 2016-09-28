var express     = require("express");
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var jwt         = require('jsonwebtoken');
var models      = require("./models");
var config      = require('./config');

var app = express();

mongoose.connect(config.database);
models.User.find({}).remove();

app.set('secret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

var routes = express.Router();
routes.post('/authenticate', function(req, res) {
    models.User.findOne({
        username: req.body.username
    }, function(err, user) {
        if (err) throw err;
        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                var token = jwt.sign({ username: user.username, id: user._id }, app.get('secret'), {
                    expiresIn: '1440m' // expires in 24 hours
                });

                res.json({
                    success: true,
                    token: token
                });
            }
        }
    });
});

routes.use(function(req, res, next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, app.get('secret'), function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                log(decoded);
                req.user = { _id: decoded._id, username: decoded.username };
                next();
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

routes.get('/users', function(req, res) {
    models.User.find({}, function(err, users){
        res.json(users);
    });
});

routes.get('/user/me', function(req, res) {
    models.User.findOne({username: 'testuser'}, function(err, user){
        res.json(user);
    });
});

app.use('/', routes)
module.exports = app;

function log(msg){
    if (process.env.NODE_ENV !== 'test') {
        log(msg);
    }
}