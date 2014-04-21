'use strict';

/* Controllers */

var ArcControllers = angular.module('arc.controllers', []);

ArcControllers.controller('AppController', ['$scope','$RequestValues', function($scope,$RequestValues){
        $scope.values = $RequestValues;
        
        
}]);