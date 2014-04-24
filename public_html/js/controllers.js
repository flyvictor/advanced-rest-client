'use strict';

/* Controllers */

var ArcControllers = angular.module('arc.controllers', []);

ArcControllers.controller('AppController', ['$scope','RequestValues','$location', function($scope,RequestValues,$location){
    $scope.values = RequestValues;
    
    $scope.goto = function(path){
        $location.path(path);
    };
    
    $scope.hasPayload = function(){
        return ['GET','DELETE','OPTIONS'].indexOf($scope.values.method) === -1;
    };
    
    $scope.isPathCurrent = function(path){
        return $location.path() === path;
    };
}]);

ArcControllers.controller('RequestController', ['$scope','$modal', function($scope,$modal){
    //testing only
    $scope.removeHeader = function(header){
        $scope.values.headers = $scope.values.headers.filter(function(element){
            return element !== header;
        });
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
    
    $scope.httpRequestPreview = function($event){
        $event.preventDefault();
        $modal.open({
            templateUrl: 'httpPreviewModal.html',
            controller: HttpPreviewModal,
            resolve: {
                http: function() {
                    var result = $scope.values.method + " " + $scope.values.url + " HTTP/1.1\n";
                    result += "Host: " + $scope.values.url + "\n";
                    for(var i in $scope.values.headers){
                        var h = $scope.values.headers[i];
                        if(h.name){
                            result += h.name + ": " + h.value +"\n";
                        }
                    }
                    if($scope.values.payload){
                        result += "\n";
                        result += $scope.values.payload;
                    }
                    return result;
                }
            }
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
var HttpPreviewModal = function ($scope, $modalInstance, http) {
    $scope.http = http;
    $scope.dismiss = function() {
        $modalInstance.dismiss('cancel');
    };
};