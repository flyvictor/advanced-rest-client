'use strict';

/* Controllers */

var ArcControllers = angular.module('arc.controllers', []);

ArcControllers.controller('AppController', ['$scope','RequestValues','$location', function($scope,RequestValues,$location){
    $scope.values = RequestValues;
    
    $scope.goto = function(path){
        $location.path(path);
    };
}]);

ArcControllers.controller('RequestController', ['$scope','$modal', function($scope,$modal){
    //testing only
    $scope.removeHeader = function(){
        console.log('removeHeader');
    };
    $scope.addHeader = function(){
        $scope.values.headers.push({'name':'','value':''});
    };
    
    
    
    $scope.editMethodOther = function(){
        var modalInstance = $modal.open({
            templateUrl: 'otherHttpMethodModal.html',
            controller: OtherHttpMethodModal,
            resolve: {
                currentValue: function() {
                    return $scope.values.method;
                }
            }
        });
        modalInstance.result.then(function(method) {
            $scope.values.method = method;
            //console.log('accepted', method);
        }, function() {
            //console.log('canceled');
        });
    };
    
}]);

ArcControllers.controller('SocketController', ['$scope', function($scope){}]);
ArcControllers.controller('HistoryController', ['$scope', function($scope){}]);
ArcControllers.controller('CollectionsController', ['$scope', function($scope){}]);




//MODALS
var OtherHttpMethodModal = function ($scope, $modalInstance, currentValue) {
    $scope.method = {
        'name': currentValue
    };
    $scope.ok = function() {
        $modalInstance.close($scope.method.name);
    };
    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
    $scope.onKey = function(e){
        if(e.keyCode === 13){
            $scope.ok();
        }
    };
};