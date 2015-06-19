'use strict';

/**
 * @ngdoc overview
 * @name regformApp
 * @description
 * # Registration form application.
 *
 * Main module of the application.
 */
angular.module('regformApp', [
    'ngAnimate',
    'ui.router',
    'ui.mask',
    'LocalStorageModule'
])

.config(['localStorageServiceProvider', function(localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('regform');  // regform
}])

// .config(["$locationProvider", function($locationProvider) {
//     $locationProvider.html5Mode(true);
// }])

.config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider
      
        .state('form', {
            url: '/form',
            templateUrl: 'views/form.html',
            controller: 'FormCtrl'
        })
    
        .state('form.step1', {
            url: '/step1',
            templateUrl: 'views/form-step1.html'
        })

        .state('form.step2', {
            url: '/step2',
            templateUrl: 'views/form-step2.html'
        })

        .state('form.step3', {
            url: '/step3',
            templateUrl: 'views/form-step3.html'
        })

        .state('form.step4', {
            url: '/step4',
            templateUrl: 'views/form-step4.html'
        });
    
        $urlRouterProvider.otherwise('/form/step1');
});
