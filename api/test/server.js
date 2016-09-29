var assert      = require('assert');
var log         = require('mocha-logger');
var chai        = require('chai');
var chaiHttp    = require('chai-http');
var request     = require('request');
var mongoose    = require('mongoose');
var models      = require("../models");
var app         = require('../app');
var config      = require('../config');
var expect      = chai.expect;

chai.use(chaiHttp);
process.env.NODE_ENV = 'test';

describe('API Tests', function() {

    var server;

    before(function () {
        server = app.listen(8000);
        log.log("Server Started");

        models.User.remove({}, function(err){
            expect(err).to.be.null;
        });
        log.log("Existing users deleted");

        var usr = new models.User({
            username: "testuser",
            password: "testpass"
        });
        usr.save();
        log.log("Test User Saved To DB");
        log.success('Before Finished');
    });

    after(function () {
        models.User.remove({}, function(err){
            expect(err).to.be.null;
        });
        log.log("Removed test user");
        server.close();
        log.log("Server Stopped");
        log.success('After Finished');
    });

    describe('Authentication Endpoint', function() {

        describe('POST Valid User Details', function(){

            it('Should return valid response', function(done) {
                chai.request(app)
                    .post('/authenticate')
                    .send({ username: 'testuser', password: 'testpass' })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body.token).to.be.a("string");
                        expect(res.body.success).to.be.a("boolean");
                        expect(res.body.success).to.eql(true);
                        done();
                    });
            });

        });

        describe('POST Invalid User Password', function(){

            it('Should return valid response', function(done) {
                chai.request(app)
                    .post('/authenticate')
                    .send({ username: 'testuser', password: 'wrongpass' })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body.message).to.be.a("string");
                        expect(res.body.message).to.eql("Authentication failed. Wrong password.");
                        expect(res.body.success).to.be.a("boolean");
                        expect(res.body.success).to.eql(false);
                        done();
                    });
            });

        });

        describe('POST Invalid User Name', function(){

            it('Should return valid response', function(done) {
                chai.request(app)
                    .post('/authenticate')
                    .send({ username: 'wrongtestuser', password: 'testpass' })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body.message).to.be.a("string");
                        expect(res.body.message).to.eql("Authentication failed. User not found.");
                        expect(res.body.success).to.be.a("boolean");
                        expect(res.body.success).to.eql(false);
                        done();
                    });
            });

        });
    });

    describe('Authenticated Endpoints', function(){

        var token = null;
        before(function(done){
            chai.request(app)
                .post('/authenticate')
                .send({ username: 'testuser', password: 'testpass' })
                .end(function (err, res) {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body.token).to.be.a("string");
                    expect(res.body.success).to.be.a("boolean");
                    expect(res.body.success).to.eql(true);
                    token = res.body.token;
                    done();
                });
        });

        after(function(done){
            token = null;
            done();
        });

        describe('/Users Endpoint', function(){
            it('Should return status 200 and one or more users', function(done){
                chai.request(app)
                    .get('/users')
                    .send({ token: token })
                    .end(function (err, res) {
                        log.log(JSON.stringify(res.body));
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.a("array");
                        expect(res.body.length).to.be.gte(1);
                        done();
                    });
            })

            it('User Count Should Increase After Adding New User', function(done){
                //Do the count
                chai.request(app)
                    .get('/users')
                    .send({ token: token })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.be.a("array");
                        expect(res.body.length).to.be.gte(1);
                        var originalCount = res.body.length;

                        //Add a new user
                        var usr = new models.User({
                            username: "anewuser",
                            password: "anewpass"
                        });
                        usr.save(function(err){
                            expect(err).to.be.null;

                            //Recount and ensure only 1 is added
                            chai.request(app)
                                .get('/users')
                                .send({ token: token })
                                .end(function (err, res) {
                                    expect(err).to.be.null;
                                    expect(res).to.have.status(200);
                                    expect(res.body).to.be.a("array");
                                    expect(res.body.length).to.be.eql(originalCount + 1);

                                    done();
                                });
                        });
                    });
            })
        });

        describe('/user/me Endpoint', function(){
            it('Should return status 200 and correct details', function(done){
                chai.request(app)
                    .get('/user/me')
                    .send({ token: token })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body.username).to.be.eql('testuser');
                        expect(res.body.password).to.be.eql('testpass');
                        done();
                    });
            });
        });
    });
});