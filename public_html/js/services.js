
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
AppServices.factory('RequestValues', ['RequestParser',function(parser) {
    var service = {
        //current URL value
        'url': 'https://www.google.com',
        //current HTTP method. GET by default.
        'method': 'GET',
        //headers array. Array of objects where keys are "name" and "value"
        'headers': {
            'value': [
                //{'name':'Content-Type','value':'application/json'},
                {'name':'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'},
                {'name':'accept-encoding:gzip,deflate,sdch'},
                {'name':'accept-language:pl,en-US;q=0.8,en;q=0.6'},
                {'name':'cookie:SID=DQAAAN8AAAAr3_Q--v2AvRL09bBqCXXkHc_FLu19T2sVR4JCWUXRXfxQHc_shGMj4lN6q1IIpvtR9iGCST8qXrVGewEsqJ3FhsctlG5EZxGrc1UuPgjiQZYd8meMmq-WWA6MxA0wi4E2eCFqL4n9Ncxs-4CL1mN4sKNkHxKDMBqeKw_X3HtRaUod7WNT9C3C1xQCmRofPsefWYNzPNLaSlHuSc8Y3QGhLGlvfQz1cTwDC3R_8qg_qrXmOG75BU1eU1XeN86e8dRqH36WtwQvFlp0DLuKturkt7t07MP892rOcL2f9smXxw; HSID=AqZE5NAucoDQL_94i; SSID=AkE28Cn71paPAdI1Q; APISID=narelD2-EmEw0yIv/AMVePkj8LQXwks6Yx; SAPISID=-HCU8GuWMYiPkyd5/AGOxqNxNf2eY-wfkQ; NID=67=WIHky7tGXFz24iFHl5SUpHAeSGojXVqYRUE6S2u_IOJ2cby7KCqKltjFLaCCsu-kE341A_Tavh41YExyKwzS4MrUSlwpN3dBiSnuwBKr3Zmlj6pLfDCveQZCAYtlcs9g51XmeVk00OjiW28NW84DQgUjZB3t_esTHd4CA4KX0uRLrYgJzebWp7sdoI6LHlGFZMDOFEt-4D9jwiNB6zFwmgtm8g; PREF=ID=6bb40e39bbbc0e9a:U=92316fa1566e76d2:FF=0:LD=en:TM=1398712891:LM=1398810992:SG=1:S=KJWUcJBgnv1-3BXP'},
                {'name':'user-agent:Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.132 Safari/537.36'},
                {'name':'x-chrome-uma-enabled:1'},
                {'name':'x-client-data:CNK1yQEIibbJAQimtskBCKm2yQEIrJPKAQiPlMoB'}
            ]
        },
        //payload is a string of data to send
        'payload': {
            'value': '{\n\t\'a\': \'b\'\n}'
        },
        //array of FileObjects
        'files': []
    };
    
    /**
     * Convert heders array to string value.
     * Headers is instance of Array.
     * @returns {String}
     */
    service.headers.toString = function(){
        if(this.value.length === 0) return '';
        return parser.headersToString(this.value);
    };
    service.headers.toArray = function(headersString){
        if(this.value.length === 0) return [];
        return parser.headersToArray(headersString);
    };
    service.headers.fromString = function(headersString){
        if(this.length === 0) {
            service.headers.value =  '';
            return;
        }
        service.headers.value = parser.headersToArray(headersString);
    };
    
    /**
     * Shortcut to get current value of the Content-Type header.
     * It will return null if there is no Content-Type header.
     * @returns {String|null}
     */
    service.getCurrentContentType = function () {
        var h = service.headers.value;
        for (var i = 0, len = h.length; i < len; i++) {
            if (h[i].name.toLowerCase() === 'content-type') {
                return h[i].value;
            }
        }
        return null;
    };
    /**
     * Check if cuurent request can carry payload.
     * @returns {Boolean}
     */
    service.hasPayload = function(){
        return ['GET','DELETE','OPTIONS'].indexOf(service.method) === -1;
    };
    
    return service;
}]);
/**
 * @ngdoc overview
 * @name RequestParser
 *
 * @description
 * This service is sed to parse headers and payload values from array to HTTP string 
 * or vice versa.
 */
AppServices.factory('RequestParser', [function() {
        
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
            if(typeof headersString !== "string"){
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
                        _tmp = _tmp.filter(function(element){
                            return element.trim() !== '';
                        });
                        obj.value = _tmp.join(', ').trim();
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

AppServices.factory('CodeMirror', ['RequestValues',function(RequestValues) {
        var headersCodeMirrorInstance = null, payloadCodeMirrorInstance = null;;
        var headerOptions = {
            lineWrapping: true,
            lineNumbers: false,
            autoClearEmptyLines: true,
            mode: 'message/http',
            extraKeys: {
                'Ctrl-Space': function (cm){
                     try {
                         CodeMirror.showHint(cm, CodeMirror.headersHint);
                     } catch (e) {
                         console.warn('Headers hint error', e);
                     }
                }
            },
            onLoad: function(_editor) {
                headersCodeMirrorInstance = _editor;
            }
        };
        
        var payloadEditorOptions = {
            lineWrapping: true,
            lineNumbers: false,
            autoClearEmptyLines: false,
            onLoad: function(_editor) {
                payloadCodeMirrorInstance = _editor;
                setPayloadEditorCurrentMode();
            },
            extraKeys: {
                'Ctrl-Space': function(cm) {
                    var module = null, ct = RequestValues.getCurrentContentType();
                    if (!ct || ct.indexOf("html") >= 0) {
                        module = CodeMirror.hint.html;
                    } else if (ct.indexOf("json") >= 0 || ct.indexOf("javascript") >= 0) {
                        module = CodeMirror.hint.javascript;
                    } else if (ct.indexOf("xml") >= 0 || ct.indexOf("atom") >= 0 || ct.indexOf("rss") >= 0) {
                        module = CodeMirror.hint.xml;
                    } else if (ct.indexOf("sql") >= 0) {
                        module = CodeMirror.hint.sql;
                    } else if (ct.indexOf("css") >= 0) {
                        module = CodeMirror.hint.css;
                    } else {
                        module = CodeMirror.hint.anyword;
                    }
                    CodeMirror.showHint(cm, module, {});
                }
            }
        };
        
        var setPayloadEditorCurrentMode = function() {
            if (!payloadCodeMirrorInstance)
                return;
            //translate mode
            var mode = "", ct = RequestValues.getCurrentContentType();
            if (!ct || ct.indexOf("html") >= 0) {
                mode = 'htmlmixed';
            } else if (ct.indexOf("json") >= 0 || ct.indexOf("javascript") >= 0) {
                mode = 'javascript';
            } else if (ct.indexOf("xml") >= 0 || ct.indexOf("atom") >= 0 || ct.indexOf("rss") >= 0) {
                mode = 'xml';
            } else if (ct.indexOf("sql") >= 0) {
                mode = 'sql';
            } else if (ct.indexOf("css") >= 0) {
                mode = 'css';
            } else {
                mode = 'htmlmixed';
            }
            payloadCodeMirrorInstance.setOption("mode", ct);
            CodeMirror.autoLoadMode(payloadCodeMirrorInstance, mode);
        };
        
        var service = {
            'headersOptions': headerOptions,
            'payloadOptions': payloadEditorOptions,
            get headersInst () {
                return headersCodeMirrorInstance;
            },
            get payloadInst () {
                return payloadCodeMirrorInstance;
            },
            'updateMode': setPayloadEditorCurrentMode
        };
        
        return service;
}]);

/**
 * Service to handle operation on current Request object.
 * It is responsible for managing data synchronization between services and UI and for save/restore actions. 
 */
AppServices.factory('ArcRequest', ['$q','RequestValues','DriveService','Filesystem','DBService', '$rootScope', 'APP_EVENTS',function($q,RequestValues,DriveService,Filesystem,DBService,$rootScope, APP_EVENTS) {
        $rootScope.$on(APP_EVENTS.errorOccured, function(e, msg, reason){});
        /**
         * @ngdoc method
         * @name ArcRequest.create
         * @function
         * 
         * @description Create new ArcRequest object and populate with values.
         * This function must be called before calling ArcRequest.save()
         * to create save object.
         * @param {Object} params Initial metadata for object.
         *  'store_location' (String), required, - either 'history','local' or 'drive'
         *  'name' (String), required if [store_location] is 'local' or 'drive',
         *  'project_name' (String), optional - Associated project name.
         * @example 
         *  ArcRequest.create({'store_location': 'local','name':'My request'});
         * 
         * 
         * @returns {undefined}
         */
        var create = function(params){
            
            if(!'store_location' in params){
                throw "You must add store_location to create ArcRequest object";
            }
            if((params.store_location === 'local' || params.store_location === 'drive') && !params.name){
                throw "You must specify file name to create ArcRequest object";
            }
            
            service.current = {};
            _fillCurrent();
            service.current.store_location = params.store_location;
            if(params.name){
                service.current.name = params.name;
            }
            if(params.project_name){
                service.current.project_name = params.project_name;
            }
        };
        
        var _fillCurrent = function(){
            service.current.request = {
                url: RequestValues.url,
                method: RequestValues.method,
                headers: RequestValues.headers.value,
                payload: RequestValues.payload.value,
                files: RequestValues.files
            };
        };
        
        /**
         * @ngdoc method
         * @name ArcRequest.store
         * @function
         * 
         * @description Store current object into selected storage (depending on 'store_location').
         * 
         * @example 
         *  ArcRequest.store().then(function(storedObject){ ... });
         * 
         * 
         * @returns {$q@call;defer.promise} The promise with stored object.
         */
        var store = function(){
            var deferred = $q.defer();
            if(service.current === null){
                deferred.reject('There\'s no object to store.');
                return deferred.promise;
            }
            var service;
            switch(service.current.store_location){
                case 'local': 
                case 'history': service = Filesystem; break;
                case 'drive': service = DriveService; break;
                default:
                    deferred.reject('Unknown store location :(');
                    return deferred.promise;
            }
            
            var onResult = function(result){
                service.current = result;
                deferred.resolve(result);
            };
            
            service.store(service.current)
            .then(DBService.store)
            .then(onResult)
            .catch(function(reason){
                deferred.reject(reason);
            });
            return deferred.promise;
        };
        /**
         * It is similar to {service.store} but it will update data in indexedDB and create history object if none exists for current request.
         * It will not force store for drive or local type items. They must be distinctly seved by the user.
         * However, currently restored request object will still be stored in local storage for restoring latest request state. But if the object
         * will be saved by the user local storage will be cleared and will hold only a reference to IndexedDb key.
         * @returns {undefined}
         */
        var storeHistory = function(){
            
        };
        var service = {
            /**
             * restored object currently loaded into app
             */
            'current': null,
            'create': create,
            'store': store
        };
        return service;
}]);
/**
 * Service responsible to manage Drive files.
 */
AppServices.factory('DriveService', ['$q',function($q) {
    /**
     * Google Drive item's mime type.
     * @type String
     */
    var driveMime = 'application/restclient+data';
    
    /**
     * @ngdoc method
     * @name DriveService.store
     * @function
     * 
     * @description Store data on Google Drive storage
     * @param {DriveItem} driveItem Data to save as JSON String.
     * 
     *  @example 
     *  DriveService.store(DriveItem);
     *  
     * @returns {$q@call;defer.promise} The promise with {DriveItem} object.
     */
    var store = function(driveItem){
        var deferred = $q.defer();
        throw "Not yet implemented";
        return deferred.promise;
    };
    /**
     * @ngdoc method
     * @name DriveService.restore
     * @function
     * 
     * @description Restore data from Google Drive.
     * @param {DriveObject} driveObject - Drive item info.
     *
     * @example 
     *  DriveService.restore({DriveObject});
     *
     * @return {$q@call;defer.promise} The Promise object. Defered.then() function will return a DriveItem object.
     */
    var restore = function(driveObject){
        var deferred = $q.defer();
        throw "Not yet implemented";
        return deferred.promise;
    };
    
    var service = {
        'store': store,
        'restore': restore
    };
    return service;
}]);
/**
 * Service responsible to manage local files.
 */
AppServices.factory('Filesystem', ['$q',function($q) {
    /**
     * A directory where all requests objects files are stored.
     * Currently Chrome supports only storing files in root folder (syncFileSystem). Issue has been reported. 
     * @type String
     */
    var directory = '/';
    /**
     * @ngdoc method
     * @name Filesystem.store
     * @function
     * 
     * @description Store data on chrome's syncFilesystem
     * @param {LocalItem} localItem Data to save, as JSON String.
     * 
     * @example 
     *  Filesystem.store(LocalItem);
     * 
     * @returns {$q@call;defer.promise} The promise with {LocalItem} object.
     */
    var store = function(localItem){
        var deferred = $q.defer();
        throw "Not yet implemented";
        return deferred.promise;
    };
    /**
     * @ngdoc method
     * @name Filesystem.restore
     * @function
     * 
     * @description Restore data from syncFilesystem.
     * @param {FileObject} fileObject - local file item info.
     *
     * @example 
     *  Filesystem.restore(FileObject);
     *
     * @return {$q@call;defer.promise} The Promise object. Defered.then() function will return a LocalItem object.
     */
    var restore = function(fileObject){
        var deferred = $q.defer();
        throw "Not yet implemented";
        return deferred.promise;
    };
    
    var service = {
        'store': store,
        'restore': restore
    };
    return service;
}]);
/**
 * Service responsible to manage local files.
 */
AppServices.factory('DBService', ['$q','$indexedDB',function($q,$indexedDB) {
        
    var store = function(item){
        var deferred = $q.defer();
        if(!item){
            deferred.reject('Can\'t store object in database because object is undefined.');
            return deferred.promise;
        }
        if(['local','history'].indexOf(item.store_location) === -1){
            deferred.resolve(item);
            return deferred.promise;
        }
        
        throw "Not yet implemented";
        return deferred.promise;
    };
    var restore = function(object){
        var deferred = $q.defer();
        throw "Not yet implemented";
        return deferred.promise;
    };
    
    
    var createKey = function(url,method,created){
        var delim = ':';
        var key = method + delim + url;
        if(created){
            key += delim + created;
        }
        return key;
    };
    
    var listHistoryCandidates = function(url,method){
        var deferred = $q.defer();
        var store = $indexedDB.objectStore('request_store');
        var query = $indexedDB.queryBuilder().$index('key').$lt(createKey(url,method)).$asc().compile();
        store.each(query).then(function(cursor){
            deferred.resolve(null);
        }, function(reason){}, function(cursor){
            
        });
        return deferred.promise;
    };
    
    var service = {
        'store': store,
        'restore': restore,
        'listHistoryCandidates': listHistoryCandidates
    };
    return service;
}]);



AppServices.factory('HttpRequest', ['$q','ArcRequest', 'RequestValues','DBService', '$rootScope', 'APP_EVENTS','$http',function($q, ArcRequest, RequestValues, DBService, $rootScope, APP_EVENTS,$http) {
    $rootScope.$on(APP_EVENTS.START_REQUEST, function(e){
        runRequest();
    });
    
    
    
    /**
     * Order of events:
     * 1) ensure that ArcRequest.current object exists. If not it should be created.
     * 2) @TODO: Apply magic variables
     * 3) Load HTTP Socket library, create request and set data
     * 4) Mark current time and send the request
     * 5) Wait for response
     * 6) On response mark current time and calculate request time
     * 7) Save request data into history
     * 8) Display result.
     * 
     * @returns {$q@call;defer.promise}
     */
    function runRequest(){
        var deferred = $q.defer();
        
        function onRequestObjectReady(request){
            request.addEventListener('load', function(e){ 
                console.log('LOADED',e);
            }).addEventListener('error', function(e){ 
                console.log('ERROR',e);
                
                if(e&&e[0]&&!!e[0].code){
                    $http.get('data/connection_errors.json').then(function(result){
                        if(result && result.data){
                            if(e[0].code in result.data){
                                console.error("Error occured:", result.data[e[0].code]);
                                delete result.data;
                            }
                        }
                    });
                }
                
            }).addEventListener('timeout', function(e){ 
                console.log('TIMEOUT',e);
            }).addEventListener('start', function(e){ 
                console.log('START',e);
            }).addEventListener('progress', function(e){ 
                console.log('PROGRESS',e);
            }).addEventListener('uploadstart', function(e){ 
                console.log('UPLOADSTART',e);
            }).addEventListener('upload', function(e){ 
                console.log('UPLOAD',e);
            }).addEventListener('abort', function(e){ 
                console.log('ABORT',e);
            }).execute();
        }
        
        
        ensureCurrent()
            .then(applyMagicVariables)
            .then(createTheRequest)
            .then(onRequestObjectReady)
            .catch(function(reason){
                deferred.reject(reason);
            });
        return deferred.promise;
    }
    
    function applyMagicVariables(requestObject){
        var deferred = $q.defer();
        deferred.resolve(requestObject);
        return deferred.promise;
    }
    
    function createTheRequest(requestObject){
        var deferred = $q.defer();
        var uri = new URI(requestObject.request.url), port = uri.port();
        var requestParams = {
            'url': requestObject.request.url,
            'method': requestObject.request.method,
            'timeout': 30000,
            'debug': true
        };
        if(port){
            requestParams.port = port;
        }
        if(RequestValues.hasPayload() && requestObject.request.payload){
            requestParams.body = requestObject.request.payload;
        }
        if(requestObject.request.headers.length > 0){
            var _headers = {};
            for(var i=0, len=requestObject.request.headers.length;i<len;i++){
                var _h = requestObject.request.headers[i];
                _headers[_h.name] = _h.value;
            }
            requestParams.headers = _headers;
        }
        var req = new HttpRequest(requestParams);
        
        deferred.resolve(req);
        return deferred.promise;
        
    }
    
    
    
    function searchHistoryFormMatch(list){
        if(!list) return null;
        for(var i=0, len=list.length; i<len; i++){
            var item = list[i].value;
            
            if(RequestValues.headers.value != item.headers.value){
                continue;
            }
            if(RequestValues.payload.value != item.payload.value){
                continue;
            }
            
            return item;
        }
        return null;
    }
    
    function ensureCurrent(){
        var deferred = $q.defer();
        
        DBService.listHistoryCandidates(RequestValues.url,RequestValues.method)
        .then(searchHistoryFormMatch)
        .then(function(result){
            if(!result){
                ArcRequest.create({store_location:'history'});
                deferred.resolve(ArcRequest.current);
            } else {
                ArcRequest.restore(result.key)
                    .then(function(){
                        deferred.resolve();
                    })
                    .catch(function(reason){
                        deferred.reject(reason);
                    });
            }
        });
        
        
        
        return deferred.promise;
    }
    
    var service = {
       'run': runRequest 
    };
    return service;
}]);