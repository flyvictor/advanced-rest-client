'use strict';

String.prototype.isEmpty = function() {
    return (this.trim() === "");
};

/* App Module */

var RestClient = angular.module('RestClient', [
  'ngRoute',
  'ngAnimate',
  'arc.filters',
  'arc.services',
  'arc.directives',
  'arc.modules',
  'arc.controllers',
  'ui.bootstrap'
]);

RestClient.value('version', '0.1');

RestClient.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/socket', {
        templateUrl: 'views/pages/socket.html',
        controller: 'SocketController'
      }).
      when('/history', {
        templateUrl: 'views/pages/history.html',
        controller: 'HistoryController'
      }).
      when('/request', {
        templateUrl: 'views/pages/request.html',
        controller: 'RequestController'
      }).
      otherwise({
        redirectTo: '/request'
      });
  }]);