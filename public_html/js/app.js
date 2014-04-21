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