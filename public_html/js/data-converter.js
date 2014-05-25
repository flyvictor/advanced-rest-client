/* 
 * Copyright 2014 jarrod.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var arc_conventer = function($q){
    
    /**
     * @ngdoc overvew
     * @name RestConventer.asHar
     * 
     * @description Get request and the response as a HAR object.
     * 
     * @param {Object} httpData A request and response data object.
     * @returns {undefined}
     */
    var convertToHAR = function(httpData){
        
    };
    
    /**
     * @ngdoc overvew
     * @name RestConventer.asCurl
     * 
     * @description Get the request as a cUrl command.
     * 
     * @param {Object} requestData A request data object.
     * @returns {undefined}
     */
    var convertToCurl = function(requestData){
        var workerData = {
            'type': 'curl',
            'http': requestData
        };
        var deferred = $q.defer();
        var worker = new Worker('js/workers/conventer-worker.js');
        worker.addEventListener('message', function(e) {
            deferred.resolve(e.data);
        }, false);
        worker.addEventListener('error', function(e) {
            deferred.reject(e);
        }, false);
        worker.postMessage(workerData);
        return deferred.promise;
    };
    
    var service = {
        'asHar': convertToHAR,
        'asCurl': convertToCurl
    };
    
    return service;
};
/**
 * @ngdoc overview
 * @name arc.converter
 * 
 * @description
 * This module is responsible for converting HTTP data (request and response) to
 * other representations like cURL command or HAR data.
 * 
 * HAR spec: http://www.softwareishard.com/blog/har-12-spec/
 */
angular.module('arc.converter', []).factory('RestConventer',['$q', arc_conventer]);