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
        var usr = new models.User({
            username: "testuser",
            password: "testpass"
        });
        usr.save();
        log.log("Test User Saved To DB");
        log.success('');
    });

    after(function () {
        models.User.findOneAndRemove({username: "testuser"});
        log.success("Removed test user");
        server.close();
        log.success("Server Stopped");
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

        describe('/Users Endpoint', function(done){

        });

        describe('/user/me Endpoint', function(done){

        });

    });

    describe('Unauthenticated Endpoints', function(){

    });

});