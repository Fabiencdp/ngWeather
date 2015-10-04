var should = require('should-http');
var assert = require('assert');
var request = require('supertest');  
var express = require('express');


describe('Routing', function() {

  var url = 'http://localhost:3000';

  before(function(done) {
				
    done();

  });

  // Run some test to check API
  describe('API', function() {

    // Check Open Weather API
    it('should return status 200 on get weather', function(done) {

      var query = {
        name: 'bordeaux',
      };

      request(url)
      .get('/getWeather')
      .query(query)
      .end(function(err, res) {
        if (err) throw err;

        var response = JSON.parse(res.text);

        response.should.have.property('coord');
        res.should.have.status(200);
        done();

      });

    });


    // Check Gmap API
    it('should correctly return some cities in france', function(done) {

      var query = {
        maxRows: 5,
        east: '3.387064453125049',
        north: '47.08081468895319',
        south: '45.19890907125178',
        west: '-0.07362890624995089'
      };

      request(url)
      .get('/getCities')
      .query(query)
      .end(function(err, res) {
        if (err) throw err;

        var response = JSON.parse(res.text);
        var cities = response.geonames;
  
        cities.should.have.length(5);

        // Only in france
        cities.should.matchEach(function(it) {
          return it.countrycode == 'FR'; 
        });
        
        res.should.have.status(200);

        done();

      });

    });


    // Check flickr API
    it('should correctly return a picture for a city', function(done) {

      var query = {
        tags: 'cloud',
        text: 'bordeaux cloud'
      };

      request(url)
      .get('/getPicture')
      .query(query)
      .end(function(err, res) {
        if (err) throw err;

        // We only check the response status
        // response can be empty
        res.should.have.status(200);

        done();

      });

    });


  });

});