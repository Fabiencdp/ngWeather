



angular
.module('PublicModule')
.controller('HomeController', ['$scope', '$http', 'uiGmapIsReady', function( $scope, $http, uiGmapIsReady ) {
	
	var self = this;
	var map;
	var searching = false;


	// Define autocomplete
	$scope.keyword = '';
	$scope.markers = [];
	$scope.windows = [];

	$scope.today = new Date();


	/**
	 * getBoundsCities
	 * Will get most populated cities inside current bounds
	 * Will create markers
	 * 
	 */
	this.getBoundsCities = function () {

		if ( ! map || searching ) return false;

		// Reset all
		$scope.markers.length = 0;

		// Get most populated cities in current bounds
		// Max Rows is defined to have a good numbers of markers in the bounds
		// depending the zoom level
		$http.get('/getCities', {
			params: {
				north: map.getBounds().getNorthEast().lat(),
				east: map.getBounds().getNorthEast().lng(),
				south: map.getBounds().getSouthWest().lat(),
				west: map.getBounds().getSouthWest().lng(),
				maxRows: 30 - ( map.getZoom() * 2 ),
			}
		})
		.then(function (response) {

			if ( response.status != 200 || response.data.geonames.length == 0 ) return false;

			if ( searching ) return false;

			var results = response.data.geonames;
			var markers = [];

			for ( var i = 0; i < results.length;  i++ ) {

				// Create markers
				var marker = {
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
				}

				markers.push(marker);

			}

			return markers;

		})
		.then( function getMarkersWeathers (markers) {
	
			// Now, get weather datas for each markers
			function getAll (markers) {

				var i = 0;
				
				function next (i) {
					
					// update marker
					self.getCityWeather(results[i], function (weatherDatas) {
						
						// TODO fix that :
						// results is not defined
						// $scope.markers[i].loading is not defined

						$scope.markers.push(markers[i]);
			
						$scope.markers[i].loading = false;

						if ( ! weatherDatas ) {
							$scope.markers[i].error = true;
						} else {		
							$scope.markers[i].weather = weatherDatas.weather;
							$scope.markers[i].forecast = weatherDatas.forecast;
							var icon = '<i class="wi icon-' + weatherDatas.weather.weather[0].icon + '"></i>';
							$scope.markers[i].options.labelContent = icon;
						}

						i++;

						if ( i >= results.length ) return results;
						
						next(i);

					});

				}

				next(i);
			}

			if ( markers.length > 0 ) getAll(markers);
			

		});

	}



	this.getCityPicture = function (city, cb) {

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



	var geocoder = new google.maps.Geocoder();

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
		infoWindow: {
			show: false,
			templateUrl: '/templates/infoWindowContent.html',
			templateParameter: {},
		},
        markers: {
            events: {
            	click: function (marker) {

            		$scope.selected = marker.model;
            		$scope.map.infoWindow.templateParameter = marker.model;

					// update marker
					self.getCityWeather(marker.model, function (weatherDatas) {

						// get the index
						for (var i = 0; i < $scope.markers.length; i++) {
							if ( $scope.markers[i].idKey == marker.model.idKey ) index = i;
						};
						
						$scope.selected.loading = false;

						if ( ! weatherDatas ) {
							$scope.selected.error = true;
						} else {		
							$scope.selected.weather = weatherDatas.weather;
							$scope.selected.forecast = weatherDatas.forecast;
						}

	            		// Load a picture from flickr
	            		if ( ! marker.model.picture ) {

							self.getCityPicture(marker.model, function (pictureDatas) {

								if ( pictureDatas && pictureDatas.photos.length !== 0 ) {
									$scope.selected.picture = pictureDatas.photos.photo[0];
								}
								
							})

	            		}

					})

            	}
            }

        },

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

        });

    });


}])
