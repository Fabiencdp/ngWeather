var express = require('express');
var router = express.Router();

var request = require('request-promise');
var Twitter = require('twit')


/**
 * Index
 * Get homepage
 * 
 * @return {view}       default layout
 */
router.get('/', function(req, res, next) {

	// Simply load the main layout
	res.render('public/layout');

});




/**
 * getWeather
 * Get weather for each marker
 * Use open weather api
 * 
 * @return {object}       weather results
 */
router.get('/getWeather', function(req, res, next) {

	var params = {
		q: req.query.name,
		units: 'metric',
	}

	if ( req.query.lat && req.query.lng ) {
		var params = {
			lat: req.query.lat,
			lon: req.query.lng,
			units: 'metric',
		}
	}

	params.APPID = req.app.locals.config.openWeather.clientId;

	request({
		url: req.app.locals.config.openWeather.endpoint + 'weather',
		qs: params,
	}).then( function getWeather(response) {

		return res.send(response);

	})
	.catch( function getWeatherError(err) {
		return res.status(406).send(err);
	})

});




/**
 * getForecast
 * Get Forecast for each marker on 5 days
 * Use open Weather api
 * 
 * @return {object}       Forecast results
 */
router.get('/getForecast', function(req, res, next) {

	request({
		url: req.app.locals.config.openWeather.endpoint + 'forecast/daily',
		qs: {
			q: req.query.name,
			units: 'metric',
			cnt: 5,
			APPID: req.app.locals.config.openWeather.clientId,
		}
	}).then( function foundForecast(response) {

		if ( ! response ) return res.status(204);

		return res.send(response);

	})
	.catch( function foundForecastError(err) {
		return res.status(406).send(err);
	})

});




/**
 * getCities
 * Get cities by revelance ( most populated ) in given bounds
 * Use Geonames api
 * 
 * @return {object}       cities object
 */
router.get('/getCities', function(req, res, next) {

	request({
		url: req.app.locals.config.geonames.endpoint + 'citiesJSON',
		qs: {
			north: req.query.north,
			south: req.query.south,
			east: req.query.east,
			west: req.query.west,
			lang: 'en',
			maxRows: req.query.maxRows,
			username: req.app.locals.config.geonames.clientId,
		}
	}).then( function foundCities(response) {

		return res.send(response);

	})
	.catch( function foundCitiesError(err) {
		return res.status(406).send(err);
	})


});



/**
 * getLastTweets
 * Get last tweet
 * Use twitter API
 * 
 * @return {object}       tweets
 */
router.get('/getLastTweets', function(req, res, next) {

	// Request token
	var twitter = new Twitter({
	    consumer_key: req.app.locals.config.twitter.clientId,
	  	consumer_secret: req.app.locals.config.twitter.clientSecret,
	  	access_token: req.app.locals.config.twitter.tokenKey,
	   	access_token_secret: req.app.locals.config.twitter.tokenSecret,
	})

	twitter.get('search/tweets', { 
		q: req.query.tags,
		count: 5 
	}, function(err, data, response) {
	  	if ( err )  return res.status(500);

	  	return res.send(data);
	})

});




/**
 * getPicture
 * Get Picture for a city with Flicker API
 * 
 * @return {object}       cities object
 */
router.get('/getPicture', function(req, res, next) {

	var params = {
		method: 'flickr.photos.search',
		group_id: req.app.locals.config.flickr.groupId,
		text: req.query.city + ' ' + req.query.tags,
		tag: req.query.tags,
		per_page: 1,
		privacy_filter: 1,
		extras: 'url_m',
		sort: 'revelance',
		api_key: req.app.locals.config.flickr.clientId,
		format: 'json',
		nojsoncallback: 1,
	}


	request({
		url: req.app.locals.config.flickr.endpoint,
		qs: params
	})
	.then( function getPicture(response) {

		var response = JSON.parse(response);

		// if we get no result try to find a picture 
		// in the same country with same weather conditions
		if ( ! response || response.photos.photo.length === 0 ) {

			// Find country name from code
			var codes = req.app.locals.countriesCodes;
			var countryName = req.query.countryCode;

			for (var i = 0; i < codes.length; i++) {
				if ( codes[i].Code == req.query.countryCode ) countryName = codes[i].Name;
			}

			params.text = countryName + ' ' + req.query.tags;


			request({
				url: req.app.locals.config.flickr.endpoint,
				qs: params
			})
			.then( function getOtherPicture(response) {

				return res.send(response);

			})	
			.catch( function getOtherPictureError(err) {
				res.status(406);
			})
			
		} else {

			return res.send(response);

		} 

	})
	.catch( function getPictureError(err) {
		return res.status(406);
	})


});

// 
// 5b6e7dffe7ca3ebf



module.exports = router;
