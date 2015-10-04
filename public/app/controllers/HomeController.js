



angular
.module('PublicModule')
.controller('HomeController', ['$scope', '$http', '$sce', 'uiGmapIsReady', function( $scope, $http, $sce, uiGmapIsReady ) {
	

	// Define some variables
	var self = this;
	var map;
	var searching = false;
	var geocoder = new google.maps.Geocoder();
	
	$scope.keyword = '';
	$scope.markers = [];
	$scope.list = [];
	$scope.selected = {
		picture: false,

	};
	$scope.today = new Date();




	/**
	 * search
	 * run reverse geocoding to set map center and zoom level
	 * 
	 */
	this.search = function (keyword) {

		geocoder.geocode({'address': keyword}, function(results, status) {

			if ( status !== google.maps.GeocoderStatus.OK || ! results ) {
				$scope.searchError = true;
				return false;
			} 

			$scope.searchError = false;

			var result = results[0];

			var zoom = 8;

			if ( result.types[0] && result.types[0] == "locality" ) {
				zoom = 11;
			} else if ( result.types[0] && result.types[0] == "country" ) {
				zoom = 6;
			}

			map.setCenter(results[0].geometry.location);
			map.setZoom(zoom);
		
		});

	}



	/**
	 * onClick
	 * default onClick event
	 * Will trigger all the stuff
	 * 
	 */
	this.onClick = function (marker) {

		if ( ! marker ) return false;

		// Clicked from list or map marker
		if ( 'model' in marker ) $scope.selected = marker = marker.model;
		else $scope.selected = marker;

		$scope.selected.picture = false;

		// update marker
		self.getCityWeather(marker, function (weatherDatas) {

			// get the index
			for (var i = 0; i < $scope.markers.length; i++) {
				if ( $scope.markers[i].idKey == marker.idKey ) index = i;
			};
			
			$scope.selected.loading = false;

			if ( ! weatherDatas ) {
				$scope.selected.error = true;
			} else {
				$scope.selected.weather = weatherDatas.weather;
				$scope.selected.forecast = weatherDatas.forecast;
			}

			// Load a picture from flickr
			self.getCityPicture(marker, function (pictureDatas) {

				if ( pictureDatas && pictureDatas.photos.length !== 0 ) {
					$scope.selected.picture = pictureDatas.photos.photo[0];
				}
				
			})

			// get tweets
			self.getLastTweets($scope.selected, function (tweets) {
				console.log(tweets);
			});

		})

	}



	/**
	 * clearSelected
	 * remove selected to go back to the list
	 * 
	 */
	this.clearSelected = function () {
		$scope.selected = {};
	}



	/**
	 * getBoundsCities
	 * Will get most populated cities inside current bounds
	 * Will create markers
	 * 
	 */
	this.getBoundsCities = function () {

		// Avoid run the function twice when user interact on the map
		if ( ! map || searching ) return false;

		// Reset all
		$scope.markers.length = 0;
		$scope.list.length = 0;

		// Get most populated cities in current bounds
		// Max Rows is defined to have a good numbers of markers in the bounds
		// depending the zoom level
		$http.get('/getCities', {
			params: {
				north: map.getBounds().getNorthEast().lat(),
				east: map.getBounds().getNorthEast().lng(),
				south: map.getBounds().getSouthWest().lat(),
				west: map.getBounds().getSouthWest().lng(),
				maxRows: 30 - ( map.getZoom() * 3 ),
			}
		})
		.then(function (response) {

			if ( response.status != 200 || response.data.geonames.length == 0 ) return false;

			if ( searching ) return false;

			var results = response.data.geonames;
			var markers = [];

			for ( var i = 0; i < results.length;  i++ ) {

				// Create markers
				markers.push({
					id: i,
					idKey: i,
					latitude: results[i].lat,
					longitude: results[i].lng,
					showWindow: true,
					name: results[i].name,
					countryCode: results[i].countrycode,
					loading: true,
		          	options: {
						labelContent: '<i class="fa fa-spin fa-spinner"></i>',
						labelAnchor: "18 15",
						labelClass: 'marker-icon',
		              	labelInBackground: false,
		          	}
				});

			}

			$scope.markers = $scope.list = markers;

			return markers;

		})
		.then( function getMarkersWeathers (markers) {
	
			// Now, get weather datas for each markers
			function getAll (markers) {

				var i = 0;

				function next (i) {

					// update marker
					self.getCityWeather(markers[i], function (weatherDatas) {
					
						// Avoid error when markers array was reseted
						if ( markers.length == 0 ) return;
					
						markers[i].loading = false;

						if ( ! weatherDatas ) {
							markers[i].error = true;
						} else {		
							markers[i].weather = weatherDatas.weather;
							markers[i].forecast = weatherDatas.forecast;
							var icon = '<i class="wi icon-' + weatherDatas.weather.weather[0].icon + '"></i>';
							markers[i].options.labelContent = icon;
						}

						// Update scope
						$scope.markers[i] = $scope.list[i] = markers[i];

						i++;

						// Stop the loop
						if ( i >= markers.length ) return;

						next(i);

					});



				}

				next(i);
			}

			if ( markers.length !== 0 ) getAll(markers);

		});

	}


	/**
	 * getLastTweets
	 * will get the last tweet about the city and current weather
	 * 
	 */
	this.getLastTweets = function (city, cb) {

		if ( ! city ) return false;

		$scope.tweets = [];

		$http.get('/getLastTweets', {
			params: {
				tags: city.name + ' ' + city.weather.weather[0].main,
			}
		})
		.then( function (response) {

			if ( ! response || response.status == 500 ) return false;

			// Regex the tags 
			for ( var i = 0; i < response.data.statuses.length; i++ ) {
				
				var text = response.data.statuses[i].text;

				text = text.replace(/#\w+/g, function(match) {
					return '<span>'+match+'</span>';
				})

				text = $sce.trustAsHtml(text);

				$scope.tweets.push(response.data.statuses[i]);
				$scope.tweets[i].formattedText = text;
			};

		})

	}

	/**
	 * getCityPicture
	 * will get one picture of the selected cities
	 * We use flickr group 'Project Weather' to find nice pictures
	 * 
	 */
	this.getCityPicture = function (city, cb) {

		if ( ! city ) return false;

		$http.get('/getPicture', {
			params: {
				city: city.name,
				countryCode: city.countryCode,
				tags: city.weather.weather[0].main,
			}
		})
		.then( function (response) {
			cb(response.data);
		})

	}


	/**
	 * getCityWeather
	 * Will return weather datas
	 * 
	 */
	this.getCityWeather = function (city, cb) {

		if ( ! city ) return false;

		var result = {};

		$http.get('/getWeather', {
			params: {
				name: city.name,
			}
		})
		.then( function gettedWeather(response) {

			result.weather = response.data;
			return result;
			
		})
		.then( function (result) {

			// get City Forecast
			$http.get('/getForecast', {
				params: {
					name: city.name,
				}
			})
			.then( function gettedForecast(response) {
				
				result.forecast = response.data;

				cb(result);
	
			})

		})

	}






	// Init map
	$scope.map = {
		center: {
			latitude: 44.83,
			longitude: -0.579
		},
		zoom: 6,
		options: {
			maxZoom: 9,
			disableDefaultUI: true,
		    zoomControl: true,
		    draggable: true,
		    scrollwheel: true,
		    zoomControlOptions: {
		        position: google.maps.ControlPosition.LEFT_CENTER,
		        style: google.maps.ZoomControlStyle.LARGE
		    },
		},
        markers: {
            events: {
            	click: self.onClick
            }
        },

	}


	this.getUserWeather = function (position) {

		map.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));

        map.addListener('idle', function () {

			$http.get('/getWeather', {
				params: {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				}
			})
			.then( function gettedWeather(response) {

				if ( response.status != 200 ) return false;

				$scope.userWeather = response.data;

			})

        });



	}


	/**
	 * Init Gmap
	 * 
	 */
    uiGmapIsReady.promise(1).then(function(instances) {

        instances.forEach(function(inst) {

            map = inst.map;
            var uuid = map.uiGmap_id;
            var mapInstanceNumber = inst.instance; // Starts at 1.

            // Events listeners
            // Make sure the map is idle before start searching
            map.addListener('dragstart', function () {
            	searching = true;
            });

            map.addListener('zoom_changed', function () {
            	searching = true;
            });

            // Map is idle
            map.addListener('idle', function () {
            	searching = false;
            	self.getBoundsCities();
            });

			if (navigator.geolocation) {
				navigator.geolocation.watchPosition(self.getUserWeather, null,{ enableHighAccuracy: false });
			}


            // trigger the first search
            google.maps.event.trigger(map,'idle');

        });

    });





}])
