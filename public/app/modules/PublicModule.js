/**
* PublicModule
*
* Main application module*
* 
*/
angular
.module('PublicModule', [
	'ngAutocomplete',
	'ngAnimate',
	'uiGmapgoogle-maps',
])




/**
 * PublicModuleConfig
 *
 * Angular Public Module configuration
 *
 */
angular
.module('PublicModule')
.config( function AppConfig(uiGmapGoogleMapApiProvider) {

	// Load uiGmap config
  	uiGmapGoogleMapApiProvider.configure({
		v: '3.20', //defaults to latest 3.X anyhow
		libraries: 'geometry,visualization'
  	});


})



angular
.module('PublicModule')
.directive('fadeIn', function($animate, $timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs){

            element.removeClass("loaded");

            element[0].style.backgroundImage = '';
           
            var src = attrs.fadeIn;
            var dlImg = new Image();

            // Update on load
			dlImg.onload = function () {
				
				element[0].style.backgroundImage = "url('"+src+"')";

                $timeout(function () {
                	element.addClass('loaded');
                }, 100);
	     
			};

			dlImg.src = src;

        }
    }
});