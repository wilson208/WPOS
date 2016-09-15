var expect  = require("chai").expect;
var request = require("request");

describe("Basic Test of 'Test' Endpoint", function() {

  var url = "http://localhost:3000/test";
  it("returns status 200", function() {
    request(url, function(error, response, body) {
      expect(response.statusCode).to.equal(200);
    });
  });

});


