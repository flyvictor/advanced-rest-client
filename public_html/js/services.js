
'use strict';

var AppServices = angular.module('arc.services', []);

/**
 * @ngdoc overview
 * @name arc.services
 *
 * @description
 * Advaced Rest Client form values.
 * This service only keeps current Request values.
 * It does nothing more. Different service is responsible for saving and reastoring data.
 */
AppServices.factory('$RequestValues', ['$RequestParser',function(parser) {
    var service = {
        //current URL value
        'url': 'http://google.pl',
        //current HTTP method. GET by default.
        'method': 'GET',
        //headers array. Array of objects where keys are "name" and "value"
        'headers': [],
        //payload is a string of data to send
        'paylod': null,
        //array of FileObjects
        'files': []
    };
    
    /**
     * Convert heders array to string value.
     * Headers is instance of Array.
     * @returns {String}
     */
    service.headers.toString = function(){
        if(this.length === 0) return '';
        return parser.headersToString(this);
    };
    service.headers.toArray = function(headersString){
        if(this.length === 0) return '';
        service.headers = parser.headersToArray(headersString);
    };
    
    return service;
}]);
/**
 * @ngdoc overview
 * @name $RequestParser
 *
 * @description
 * This service is sed to parse headers and payload values from array to HTTP string 
 * or vice versa.
 */
AppServices.factory('$RequestParser', [function() {
        
        /** 
         * Filter array of headers and return not duplicated array of the same headers. 
         * Duplicated headers should be appended to already found one using coma separator. 
         * @param {Array} headers Headers array to filter. All objects in headers array must have "name" and "value" keys.
         */
        function filterArray(headers) {
            var _tmp = {};
            for (var i = 0, len = headers.length; i < len; i++) {
                var header = headers[i];
                if (header.name in _tmp) {
                    if (header.value && !header.value.isEmpty()) {
                        _tmp[header.name] += ', ' + header.value;
                    }
                } else {
                    _tmp[header.name] = header.value;
                }
            }
            var result = [];
            for (var _key in _tmp) {
                result[result.length] = {
                    'name': _key,
                    'value': _tmp[_key]
                };
            }
            return result;
        }
        
        /**
         * Parse headers array to Raw HTTP headers string.
         * @param {Array} headersArray list of objects with "name" and "value" keys.
         * @returns {String}
         */
        var headersToString = function(headersArray){
            if(!(headersArray instanceof Array)){
                throw "Headers must be an instance of Array";
            }
            if(headersArray.length ===0) return '';
            
            headersArray = filterArray(headersArray);
            var result = '';
            for (var i = 0, len = headersArray.length; i < len; i++) {
                var header = headersArray[i];
                if (!result.isEmpty()) {
                    result += "\n";
                }
                var key = header.name,
                        value = header.value;
                if (key && !key.isEmpty()) {
                    result += key + ": ";
                    if (value && !value.isEmpty()) {
                        result += value;
                    }
                }
            }
            return result;
        };
        /**
         * Parse HTTP headers input from string to array of a key:value pairs objects.
         * @param {String} headersString Raw HTTP headers input
         * @returns {Array} The array of key:value objects
         */
        function headersToArray(headersString) {
            if(!(headersString instanceof String)){
                throw "Headers must be an instance of String.";
            }
            if (headersString === null || headersString.isEmpty()) {
                return [];
            }
            var result = [], headers = headersString.split(/[\r\n]/gim);
            for (var i in headers) {
                var line = headers[i].trim();
                if (line.isEmpty())
                    continue;

                var _tmp = line.split(/[:\r\n]/i);
                if (_tmp.length > 0) {
                    var obj = {
                        name: _tmp[0],
                        value: ''
                    };
                    if (_tmp.length > 1) {
                        _tmp.shift();
                        obj.value = _tmp.join(':').trim();
                    }
                    result[result.length] = obj;
                }
            }
            return result;
        }
        
        return {
            'headersToString': headersToString,
            'headersToArray': headersToArray
        };
}]);
/**
 * @ngdoc overview
 * @name $RequestStore
 *
 * @description
 * Service to store and restore request values from selected source
 * (context dependet).
 * 
 * Chrome app can't use synchronius localStorage so it must use async 
 * chrome.storage object. It uses promises to handle async operations.
 */
AppServices.factory('$RequestStore', ['$RequestValues','$q',function($RequestValues, $q) {
        var service = {};
        
        
        return service;
}]);
/**
 * @ngdoc overview
 * @name $ChromeStorage
 * 
 * @description Access to Chrome's storage area (either sync or local).
 * It require "storage" permission in the manifest file.
 */
AppServices.factory('$ChromeStorage', ['$q', function($q) {
  
  /**
   * @ngdoc overvew
   * @name $ChromeStorage.set
   * 
   * @description Save data to Chrome's local or synch storage.
   * @param {String} type - optional, default local, may be sync
   * @param {Object} data - data to save
   *
   * @example 
   *  $ChromeStorage.save({'key':'value'}); //save data to local storage
   *  $ChromeStorage.save('sync', {'key':'value'}); //save data to synch storage
   *  $ChromeStorage.save('local', {'key':'value'}); //save data to local storage
   *
   * @return The Promise object. Defered.then() function will not return a param.
   */
  function saveData(type, data){
    if(typeof data === 'undefined'){
      data = type;
      type = 'local';
    }
    var defered = $q.defer();
    if(['local','sync'].indexOf(type) === -1){
      defered.reject('Unknown storage type: ' + type);
      return defered.promise;
    }
    
    var storage = chrome.storage[type];
    storage.set(data, function(){
      if(chrome.runtime.lastError){
        defered.reject(chrome.runtime.lastError); return;
      }
      defered.resolve();
    });
    
    return defered.promise;
  }
  
  /**
   * @ngdoc overvew
   * @name $ChromeStorage.get
   * 
   * @description Restore data from Chrome's local or synch storage.
   * @param {String} type - optional, default local, may be sync
   * @param {String|Array|Object} data - data to restore. See chrome app's storage for more details. 
   *
   * @example 
   *  $ChromeStorage.get({'key':'default_value'}); //restore data from local storage
   *  $ChromeStorage.get('sync', 'key'); //restore data from synch storage
   *  $ChromeStorage.get('local', ['key1', 'key2']); //restore data from local storage
   *
   * @return The Promise object. Defered.then() function will return a param with restored data.
   */
  function restoreData(type, data){
    if(typeof data === 'undefined'){
      data = type;
      type = 'local';
    }
    var defered = $q.defer();
    if(['local','sync'].indexOf(type) === -1){
      defered.reject('Unknown storage type: ' + type);
      return defered.promise;
    }
    
    var storage = chrome.storage[type];
    storage.get(data, function(restored){
      if(chrome.runtime.lastError){
        defered.reject(chrome.runtime.lastError); return;
      }
      defered.resolve(restored);
    });
    
    return defered.promise;
  }
  
  return {
    'set': saveData,
    'get': restoreData
  };
}]);