'use strict';

/* Controllers */

var ArcControllers = angular.module('arc.controllers', []);

ArcControllers.controller('AppController', ['$scope','RequestValues','$location', '$rootScope', 'APP_EVENTS','HttpRequest', function($scope,RequestValues,$location,$rootScope,APP_EVENTS,HttpRequest){
    $scope.values = RequestValues;
    
    $scope.goto = function(path){
        $location.path(path);
    };
    
    $scope.isPathCurrent = function(path){
        return $location.path() === path;
    };
    
    $scope.runRequest = function(){
        $rootScope.$broadcast(APP_EVENTS.START_REQUEST);
    };
    
}]);

ArcControllers.controller('RequestController', ['$scope','$modal','CodeMirror','RequestValues', function($scope,$modal,CodeMirror,RequestValues){
    /**
     * Remove selected header from headers list.
     * @param {Object} header Map with "name" and "value" keys.
     * @returns {undefined}
     */
    $scope.removeHeader = function(header){
        $scope.values.headers.value = $scope.values.headers.value.filter(function(element){
            return element !== header;
        });
    };
    /**
     * Create new, empty header object.
     * @returns {undefined}
     */
    $scope.addHeader = function(){
        $scope.values.headers.value.push({'name':'','value':''});
    };
    
    /**
     * Callback for changin HTTP method to Other.
     * It will display a popup with input field to enter Method.
     * @returns {undefined}
     */
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
        }, function() {});
    };
    /**
     * Will show a popup with HTTP data preview.
     * @param {HTMLEvent} $event
     * @returns {undefined}
     */
    $scope.httpRequestPreview = function($event){
        $event.preventDefault();
        $modal.open({
            templateUrl: 'httpPreviewModal.html',
            controller: HttpPreviewModal,
            resolve: {
                http: function() {
                    var result = $scope.values.method + " " + $scope.values.url + " HTTP/1.1\n";
                    result += "Host: " + $scope.values.url + "\n";
                    for(var i in $scope.values.headers.value){
                        var h = $scope.values.headers.value[i];
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
    
    /**
     * Options list for CodeMirror instance for headers
     */
    $scope.headersEditor = {
        options: CodeMirror.headersOptions,
        value: $scope.values.headers.toString()
    };
    /**
     * Options list for CodeMirror instance for payload
     */
    $scope.payloadEditor = {
        options: CodeMirror.payloadOptions,
        value: $scope.values.payload.value
    };
    
    ///Observe changes in headers raw form
    $scope.$watch('headersEditor.value', function(newVal, oldVal){
        if (newVal !== oldVal) {
            $scope.values.headers.fromString(newVal);
        }
    });
    $scope.refreshHeadersEditor = function(){
        $scope.headersEditor.value = $scope.values.headers.toString();
        CodeMirror.headersInst.refresh();
    };
    ///Observe changes in headers and react on content-type header change
    var latestContentType = null;
    $scope.$watch('values.headers.value', function(newVal, oldVal){
        if(newVal !== oldVal){
            if(RequestValues.hasPayload()){
                var ct = RequestValues.getCurrentContentType();
                if(latestContentType !== ct){
                    latestContentType = ct;
                    CodeMirror.updateMode();
                }
            }
        }
    }, true);
    
    
    $scope.removeFile = function(file){
        $scope.values.files = $scope.values.files.filter(function(element){
            return element !== file;
        });
    };
    $scope.filesSizeSum = function(){
        var result = 0;
        for(var i=0, len=$scope.values.files.length; i<len;i++){
            result += $scope.values.files[i].size;
        }
        return result;
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