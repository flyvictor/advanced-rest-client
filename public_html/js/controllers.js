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

ArcControllers.controller('RequestController', ['$scope','$modal','CodeMirror','RequestValues','analytics', function($scope,$modal,CodeMirror,RequestValues,analytics){
        analytics.view('Request');
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
    
    $scope.urlKeydown = function(e){
        if(e && e.keyCode && e.keyCode === 13){
            $scope.runRequest();
        }
    };
    
}]);

ArcControllers.controller('ResponseController', ['$scope', '$rootScope', 'APP_EVENTS', 'CodeMirror','$timeout', 'ViewWorkersService', '$sce', function($scope, $rootScope, APP_EVENTS, CodeMirror, $timeout, ViewWorkersService, $sce){
    
    $scope.$on(APP_EVENTS.END_REQUEST, function(e,response){
        $scope.$apply(function(){
            ct = null;
            cmHighlight = false;
            $scope.data = response;
            $timeout(parsedHightlight,0);
            console.log($scope.data);
        });
        
    });
    
    $scope.data = null;
    var ct = null;
    var cmHighlight = false;
    
    var parsedHightlight = function(){
        if(cmHighlight) return;
        var ct = getContentType();
        var mode = ct.split(';').shift();
        
        var elements = [];
        function clb(a, b){
            elements[elements.length] = {'string': a, 'style': b};
        }
        function ready(){
            var data = {
                'elements': elements,
                'url': $scope.data.destination
            };
            ViewWorkersService.html(data)
            .then(function(html){
                $scope.data.parsedResponse = $sce.trustAsHtml(html);
                initializePopovers();
            })
            .catch(function(reason){}); //TODO: error handling.
        }
        
        try {
            //this is altered version of RunMode for CM.
            //It will not hang a browser in big amount of data and fire callback
            //when it finish.
            CodeMirror.highlight($scope.data.response.response, mode, clb, ready);
        } catch (e) {
            console.log("Unable to initialize CodeMirror :( ", e.message);
        }
    };
    function getContentType(){
        if(ct) return ct;
        if(!$scope.data || $scope.data.response.headers.length === 0) return null;
        for(var i=0,len=$scope.data.response.headers.length;i<len;i++){
            if($scope.data.response.headers[i].name.toLowerCase() === 'content-type'){
                ct = $scope.data.response.headers[i].value;
                return ct;
            }
        }
        return null;
    }
    
    function initializePopovers(panel){
        var popovers = document.querySelectorAll('*[data-image]', panel);
        for(var i=0,len=popovers.length; i<len; i++){
            var popover = popovers[i];
            var content = '<div data-imgprevurl="' + popover.dataset['image'] + '" class="popover-image-prev">';
            content += '<img src="img/mini-loader.gif" alt="loading" title="loading"/><br/><i>loading</i>';
            content += '</div>';
            
            popover.dataset['html'] = 'true';
            popover.dataset['placement'] = 'auto top';
            popover.dataset['trigger'] = 'hover';
            popover.dataset['content'] = content;
            popover.dataset['container'] = 'body';
            popover.dataset['animation'] = false;
            // @TODO: initialize popovers.
        }
    }
    
    $scope.hasJson = function(){
        var ct = getContentType();
        if(!ct) return false;
        return ct.indexOf('json') !== -1;
    };
    $scope.hasXml = function(){
        var ct = getContentType();
        if(!ct) return false;
        return ct.indexOf('xml') !== -1;
    };
    $scope.showParsed = function(){
        return !(!!$scope.hasJson() || !!$scope.hasXml());
    };
    $scope.xmlOpen = function(){
        if(!!$scope.data.parsedXml) return;
        
        ViewWorkersService.xml($scope.data.response.response)
        .then(function(html){
            $scope.data.parsedXml = $sce.trustAsHtml(html);
        })
        .catch(function(reason){}); //TODO: error handling.
    };
    $scope.jsonOpen = function(){
        if(!!$scope.data.parsedJson) return;
        ViewWorkersService.json($scope.data.response.response)
        .then(function(html){
            $scope.data.parsedJson = $sce.trustAsHtml(html);
        })
        .catch(function(reason){
            console.error(reason);
        }); //TODO: error handling.
    };
    $scope.htmlControl = function(e){
        if (!e.target)
            return;
        if (e.target.nodeName === "A") {
            e.preventDefault();
            var url = e.target.getAttribute('href');
            console.warn('!!TODO. Insert into values service.', url);
            $scope.values.url = url;
            return;
        }
    };
    $scope.jsonControl = function(e){
        if (!e.target)
            return;
        if (e.target.nodeName === "A") {
            e.preventDefault();
            var url = e.target.getAttribute('href');
            console.warn('!!TODO. Insert into values service.', url);
            $scope.values.url = url;
            return;
        }
        var toggleId = e.target.dataset['toggle'];
        if (!toggleId)
            return;
        var parent = e.currentTarget.querySelector('div[data-element="' + toggleId + '"]');
        if (!parent)
            return;
        var expanded = parent.dataset['expanded'];
        if (!expanded || expanded === "true") {
            parent.dataset['expanded'] = "false";
        } else {
            parent.dataset['expanded'] = "true";
        }
    };
    $scope.xmlControl = function(e){
        if (!e.target)
            return;
        if (!e.target.getAttribute("colapse-marker"))
            return;
        var parent = e.target.parentNode;
        var expanded = parent.dataset['expanded'];
        if (!expanded || expanded === "true") {
                parent.dataset['expanded'] = "false";
        } else {
                parent.dataset['expanded'] = "true";
        }
    };
}]);

ArcControllers.controller('SocketController', ['$scope', function($scope){}]);
ArcControllers.controller('HistoryController', ['$scope', function($scope){}]);
ArcControllers.controller('CollectionsController', ['$scope', function($scope){}]);
ArcControllers.controller('SettingsController', ['$scope','analytics','$timeout', function($scope,analytics,$timeout){
    analytics.view('Settnigs');
    
    $scope.settings = {
        analyticsEnabled: true
    };
    
    analytics.isEnabled()
    .then(function(enabled){
        $scope.settings.analyticsEnabled = enabled;
    });
    
    $scope.onAnalyticsChange = function(){
        $timeout(function(){
            analytics.setEnabled($scope.settings.analyticsEnabled);
        },0);
    };
    $scope.analyticsEnabledText = function(){ return $scope.settings.analyticsEnabled === true ? 'Disable anaytics' : 'Enable analytics'; };
}]);




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