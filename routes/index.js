var express = require('express');
var router = express.Router();

var request = require('request-promise');


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

	request({
		url: 'http://api.openweathermap.org/data/2.5/weather',
		qs: {
			q: req.query.name,
			units: 'metric',
		}
	}).then( function (response) {

		return res.send(response);

	})
	.catch( function onError (err) {
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
		url: 'http://api.openweathermap.org/data/2.5/forecast/daily',
		qs: {
			q: req.query.name,
			units: 'metric',
			cnt: 5,
		}
	}).then( function (response) {

		if ( ! response ) return res.status(204);

		return res.send(response);

	})
	.catch( function onError (err) {
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
		url: 'http://api.geonames.org/citiesJSON',
		qs: {
			north: req.query.north,
			south: req.query.south,
			east: req.query.east,
			west: req.query.west,
			lang: 'en',
			maxRows: req.query.maxRows,
			username: 'fabien.gane@collectifdontpanic.com',
		}
	}).then( function foundCities(response) {

		return res.send(response);

	})
	.catch( function onError(err) {
		return res.status(406).send(err);
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
		group_id: '1463451@N25',
		text: req.query.city + ' ' + req.query.tags,
		tag: req.query.tags,
		per_page: 1,
		privacy_filter: 1,
		extras: 'url_m',
		sort: 'revelance',
		api_key: '48f41a5d23bc5dc706a30882681d8224',
		format: 'json',
		nojsoncallback: 1,
	}


	request({
		url: 'https://api.flickr.com/services/rest/',
		qs: params
	})
	.then( function foundCities(response) {

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
				url: 'https://api.flickr.com/services/rest/',
				qs: params
			})
			.then( function foundCities(response) {

				return res.send(response);

			})	
			.catch( function onError(err) {
				res.status(406).send(err);
			})
			
		} else {

			return res.send(response);

		} 

	})
	.catch( function onError(err) {
		return res.status(406).send(err);
	})


});

// 
// 5b6e7dffe7ca3ebf



module.exports = router;
