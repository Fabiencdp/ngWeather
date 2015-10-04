/**
* PublicModule
*
* Main application module*
* 
*/
angular
.module('PublicModule', [
	'ngAutocomplete',
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
