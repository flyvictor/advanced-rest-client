
'use strict';

var AppServices = angular.module('arc.services', []);

/**
 * @ngdoc overview
 * @name arc.services
 *
 * @description
 * Advaced Rest Client form values.
 * This service only keeps current Request values.
 */
AppServices.factory('RequestValues', ['RequestParser', 'fsHistory', function(parser, fsHistory) {
    var service = {
        //current URL value
        'url': null, //'http://blog.gdgpoland.org/feeds/posts/default?alt=json', //'http://localhost:3012/import-historic-data/?authKey=admin-frontend'
        //current HTTP method. GET by default.
        'method': 'GET',
        //headers array. Array of objects where keys are "name" and "value"
        'headers': {
            'value': []
        },
        //payload is a string of data to send
        'payload': {
            'value': null
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
    /**
     * Convert current request data to JSON object
     * @returns {Object}
     */
    service.toJson = function(){
        var result = {
            'url': service.url,
            'method': service.method,
            'headers': service.headers.value,
            'payload': service.payload.value
        };
        return result;
    };
    /**
     * Store current values in sync storage. 
     * After the app runs again it will be used to update UI with it's values.
     * @returns {undefined}
     */
    service.store = function(){
        var data = JSON.stringify(service.toJson());
        fsHistory.set('latest', data)
        .then(function(){})
        .catch(function(error){
            console.error(error);
        });
    };
    /**
     * Restore current values from storage
     * @returns {undefined}
     */
    service.restore = function(){
        return fsHistory.get('latest')
        .then(function(dataStr){
            if(!!!dataStr || dataStr === "") {
                console.info("No data in restored str.");
                return;
            }
            var data;
            try{
                data = JSON.parse(dataStr);
            } catch(error){
                console.error('Error parsing latest data.',error);
                console.error(error.stack);
                return;
            }
            if(!!!data){
                console.info('No restored data available.');
                return;
            }
            if(!!data.url){
                service.url = data.url;
            }
            if(!!data.method){
                service.method = data.method;
            }
            if(!!data.headers){
                service.headers.value = data.headers;
            }
            if(!!data.payload){
                service.payload.value = data.payload;
            }
        })
        .catch(function(error){
            console.error(error);
        });
    };
    
    return service;
}]);

AppServices.factory('SignatureService', function(){
    
    var calculateSignature = function(request, secretKey){
        var parameters = {};
        var queryString = new URI(request.url)._parts.query;
        if(queryString){
            var queryParts = queryString.split("&");
            for(var i=0; i<queryParts.length; i++){
                var pair = queryParts[i].split("=");
                parameters[pair[0]] = pair[1]
            }
        };
        
        if(request.body && request.method != "GET"){
            var body = JSON.parse(request.body);
            for(var key in body){
                parameters[key] = body[key];
            }
        }

        var httpMethod = request.method,
        url = request.url,
        parameters = parameters,
        //consumerSecret = 'kd94hf93k423kf44',
        tokenSecret = secretKey,
        //expectedEncodedSignature = 'tR3%2BTy81lMeYAr%2FFid0kMTYa%2FWM%3D',
        encodedSignature = oauthSignature.generate(httpMethod, url, parameters, tokenSecret, "");

        return encodedSignature;
    };

    var service = {
        'calculateSignature': calculateSignature
    }
    return service;
});

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
    function restoreData(type, data) {
        if (typeof data === 'undefined') {
            data = type;
            type = 'local';
        }
        var defered = $q.defer();
        if (['local', 'sync'].indexOf(type) === -1) {
            defered.reject('Unknown storage type: ' + type);
            return defered.promise;
        }

        var storage = chrome.storage[type];
        storage.get(data, function(restored) {
            if (chrome.runtime.lastError) {
                defered.reject(chrome.runtime.lastError);
                return;
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
            'updateMode': setPayloadEditorCurrentMode,
            'highlight': function(txt, mode, dest, ready){
                CodeMirror.runMode(txt, mode, dest, ready);
            }
        };
        
        return service;
}]);

/**
 * Service to handle operation on current Request object.
 * It is responsible for managing data synchronization between services and UI and for save/restore actions. 
 */
AppServices.factory('ArcRequest', ['$q','RequestValues','DriveService','DBService', '$rootScope', 'APP_EVENTS',
    function($q,RequestValues,DriveService,DBService,$rootScope, APP_EVENTS) {
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
        }, function(reason){
            
        }, function(cursor){
            
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



AppServices.factory('HttpRequest', ['$q','ArcRequest', 'RequestValues','DBService', '$rootScope', 'APP_EVENTS','$http','ChromeHttp', 'SignatureService',
    function($q, ArcRequest, RequestValues, DBService, $rootScope, APP_EVENTS,$http,ChromeHttp, SignatureService) {
        $rootScope.$on(APP_EVENTS.START_REQUEST, function(e){
            runRequest()
            .catch(function(e){
                $rootScope.$broadcast(APP_EVENTS.REQUEST_ERROR, e);
            });
        });
    
    function appendSignature(requestParams, secret){
        var signature = SignatureService.calculateSignature(requestParams, secret);
        console.log("signature", signature);
        requestParams.url += "&oauth_signature=" + signature;
        return signature;
    }

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
                e.signature = request.signature;
                $rootScope.$broadcast(APP_EVENTS.END_REQUEST, e);
            }).addEventListener('error', function(e){ 
                console.log('ERROR',e);
                if(e&&e[0]&&!!e[0].code){
                    $http.get('data/connection_errors.json').then(function(result){
                        if(result && result.data){
                            if(e[0].code in result.data){
                                console.error("Error occured:", result.data[e[0].code]);
                                
                                var message = e[0].message + "\n" + result.data[e[0].code];
                                deferred.reject({
                                    'code': e[0].code,
                                    'message': message
                                });
                                
                                delete result.data;
                            }
                        }
                    });
                }
                
            }).addEventListener('timeout', function(e){ 
                //console.log('TIMEOUT',e);
            }).addEventListener('start', function(e){ 
                //console.log('START',e);
            }).addEventListener('progress', function(e){ 
               // console.log('PROGRESS',e);
            }).addEventListener('uploadstart', function(e){ 
                //console.log('UPLOADSTART',e);
            }).addEventListener('upload', function(e){ 
                //console.log('UPLOAD',e);
            }).addEventListener('abort', function(e){ 
                console.log('ABORT',e);
            }).send();
        }
        try{
            RequestValues.store();
        } catch(e){}
        
        createRequestObject()
        .then(applyMagicVariables)
        .then(createTheRequest)
        .then(onRequestObjectReady)
        .catch(function(reason){
            deferred.reject(reason);
        });
        return deferred.promise;
    }
    
    function createRequestObject(){
        var deferred = $q.defer();
        var requestObject = {
            url: RequestValues.url,
            method: RequestValues.method,
            headers: RequestValues.headers.value,
            payload: RequestValues.payload.value,
            files: RequestValues.files
        };
        deferred.resolve(requestObject);
        return deferred.promise;
    }
    
    
    function applyMagicVariables(requestObject){
        var deferred = $q.defer();
        deferred.resolve(requestObject);
        return deferred.promise;
    }
    
    function createTheRequest(requestObject){
        var deferred = $q.defer();
        
        var requestParams = {
            'url': requestObject.url,
            'method': requestObject.method,
            'timeout': 30000,
            'debug': true
        };
        
        if(RequestValues.hasPayload() && requestObject.payload){
            requestParams.body = requestObject.payload;
        }
        if(requestObject.headers.length > 0){
            var _headers = {};
            for(var i=0, len=requestObject.headers.length;i<len;i++){
                var _h = requestObject.headers[i];
                _headers[_h.name] = _h.value;
            }
            requestParams.headers = _headers;
        }

        
        var signature = RequestValues.secretKey?appendSignature(requestParams, RequestValues.secretKey):'';
        
        var req = ChromeHttp.create(requestParams);
        req.signature = signature;
        
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

AppServices.factory('ViewWorkersService', ['$q','$sce',function($q,$sce) {
    
    function parseView(script, data){
        var deferred = $q.defer();
        var worker = new Worker('js/workers/'+script+'.js');
        worker.addEventListener('message', function(e) {
            deferred.resolve($sce.trustAsHtml(e.data));
        }, false);
        worker.addEventListener('error', function(e) {
            deferred.reject(e);
        }, false);
        worker.postMessage(data);
        return deferred.promise;
    }
    
    function parseXmlView(data){
        return parseView('xmlviewer', data);
    }
    
    function parseHtmlView(data){
        return parseView('htmlviewer', data);
    }
    
    function parseJsonView(data){
        return parseView('jsonviewer', data);
    }
    
    var service = {
        'xml': parseXmlView,
        'html': parseHtmlView,
        'json': parseJsonView
    };
    return service;
}]);

AppServices.factory('ResponseUtils', ['$q','RestConventer',function($q,RestConventer) {
    /**
     * @ngdoc method
     * @name ResponseUtils.toClipboard
     * @function
     * 
     * @description Copy [data] to clipboard.
     * This function will use a trick with a textarea to copy data.
     * @param {Any} data If is not string .toString() function will be called.
     * 
     * @example 
     *  ResponseUtils.toClipboard('Some text to copy');
     *  
     * @returns {Boolean} It will always return true.
     */
    var copy2Clipoboard = function(data) {
        if (typeof data !== 'string') {
            data = data.toString();
        }

        var clipboardholder = document.createElement("textarea");
        document.body.appendChild(clipboardholder);
        clipboardholder.value = data;
        clipboardholder.select();
        document.execCommand("Copy");
        clipboardholder.parentNode.removeChild(clipboardholder);

        return true;
    };
    
    /**
     * @ngdoc method
     * @name ResponseUtils.asCurl
     * @function
     * 
     * @description Copy the request to clipboard as a cURL command.
     * 
     * @param {HttpRequest} request HTTP request obiect.
     * @returns {$q@call;defer.promise}
     */
    var copyAsCurl = function(request){
        var deferred = $q.defer();
        RestConventer.asCurl(request)
        .then(copy2Clipoboard)
        .then(deferred.resolve)
        .catch(deferred.reject);
        return deferred.promise;
    };
    /**
     * @ngdoc method
     * @name ResponseUtils.asFile
     *  @function
     * 
     * @description Save response payload as file on user's filesystem.
     * 
     * @param {HttpResponse} response Response data.
     * @returns {undefined}
     */
    var saveResponseAsFile = function(response){
        var deferred = $q.defer();
        
        
        var mime = _getContentType(response.headers);
        var fileExt = _getFileExtension(mime);
        var fileOptions = {
            'type': 'saveFile',
            'suggestedName': 'http-export.' + fileExt
        };
        
        chrome.fileSystem.chooseEntry(fileOptions, function(entry){
            if(chrome.runtime.lastError){
                throw chrome.runtime.lastError;
            }
            if(!entry){
                throw 'No file selected.';
            }
            entry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = deferred.result;
                fileWriter.onerror = deferred.reject;
                var blob = new Blob([response.response], {type: mime});
                fileWriter.write(blob);
            });
            
        });
        
        return deferred.promise;
    };
    
    
    /**
     * Get response content type (mime type) according to it's response headers
     * @param {HttpHeaders} httpHeaders Response headers
     * @returns {String} Response content type or 'text/plain' as default mime.
     */
    var _getContentType = function(httpHeaders){
        var contentType = 'text/plain';
        for(var i = 0, len = httpHeaders.length; i < len; i++){
            if(httpHeaders[i].name.toLowerCase() !== 'content-type') continue;
            var data = httpHeaders[i].value.split(';');
            if(data && data.length > 0){
                contentType = data[0];
                break;
            }
        }
        return contentType;
    };
    
    /**
     * Get file extenstion according to mime type.
     * @param {String} mime
     * @returns {String}
     */
    var _getFileExtension = function(mime){
        var result = '';
        switch(mime){
            case 'text/plain': result = 'txt'; break;
            case 'text/html': result = 'html'; break;
            case 'application/json': 
            case 'text/json':
                result = 'json'; break;
            case 'application/javascript': 
            case 'text/javascript':
                result = 'js'; break;
            case 'text/css':
                result = 'css'; break;
            default:
                result = 'txt'; break;
        }
        return result;
    };
    var service = {
        'toClipboard': copy2Clipoboard,
        'asCurl': copyAsCurl,
        'asFile': saveResponseAsFile
    };
    return service;
}]);


AppServices.factory('$User', ['$q','$timeout','$http','$rootScope', function($q, $timeout, $http, $rootScope) {
    var FOLDERNAME = 'userimage', access_token = null;
    
    function _getUserData() {
        
        $http.get('https://www.googleapis.com/userinfo/v2/me', {
            'headers': {
                'Authorization': 'Bearer ' + access_token
            },
            'cache': true
        })
        .success(function(user) {
            if (!user) return;
            service.user_info = {
                google_id: null, //user.id, TODO: do I need this information?
                name: user.name, //full name to display to the user so he/she will know as who is he/she logged in
                picture: user.picture, //user's picture from G+ (or just profile). It will be displayed in the app.
                picture_object_url: null, //objectURL for the picture
                locale: user.locale //use user's locale info fo the app.
            };
            getProfileImage();
        })
        .error(function(data) {
            if(data.error.code === 401){
                service.loggedin = false;
                service.clearCache();
            }
        });
    }

    function getProfileImage() {
        if (!service.user_info.picture || service.user_info.picture_object_url)
            return;
        var ext = service.user_info.picture.substr(service.user_info.picture.lastIndexOf('.') + 1);
        var filename = service.user_info.picture.substr(service.user_info.picture.indexOf('/', 8) + 1);
        filename = filename.substr(0, filename.lastIndexOf('/'));
        filename = filename.replace(/\//g, '_') + '.' + ext;
        window.webkitRequestFileSystem(PERSISTENT, 1024 * 1024, function(fs) {
            var fsURL = fs.root.toURL() + FOLDERNAME + '/' + filename;
            window.webkitResolveLocalFileSystemURL(fsURL, function(entry) {
                service.user_info.picture_object_url = entry.toURL();
                $rootScope.$digest();
            }, function() {
                $http.get(service.user_info.picture, {
                    responseType: 'blob'
                }).success(function(blob) {
                    blob.name = filename;
                    writePicFile(fs, blob);
                    service.user_info.picture_object_url = window.URL.createObjectURL(blob);
                });
            });
        }, function(reason) {
            //TODO: error handling
        });
    }

    function writePicFile(fs, blob) {
        
        var deferred = $q.defer();
        
        var onError = function(e) {
            console.warn('Error write user\'s thumbnail in filesystem', e);
            deferred.reject(e);
        };
        fs.root.getDirectory(FOLDERNAME, {create: true}, function(dirEntry) {
            dirEntry.getFile(blob.name, {create: true, exclusive: false}, function(fileEntry) {
                // Create a FileWriter object for our FileEntry, and write out blob.
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onerror = onError;
                    fileWriter.onwriteend = function(e) {
                        console.log('Write user\'s thumbnail completed.', e);
                        deferred.resolve();
                    };
                    fileWriter.write(blob);
                }, onError);
            }, onError);
        }, onError);
        
        return deferred.promise;
    }
    
    function restore(){
        service.authorize(false).then(function(access_token){
            if(!access_token) return;
            
            $http.get('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token='+access_token, {
                'cache': false
            })
            .success(function(token_info) {
                if(!token_info) return;
                if(token_info.expires_in <= 0){
                    service.clearCache();
                    service.loggedin = false;
                }
            });
        });
    }
    
    
    var service = {
        loggedin: false,
        user_info: {
            google_id: null, //TODO: do I need this information?
            name: null, //full name to display to the user so he/she will know as who is he/she logged in
            picture: null, //user's picture from G+ (or just profile). It will be displayed in the app.
            picture_object_url: null, //objectURL for the picture
            locale: 'en' //use user's locale info fo the app.
        },
        'authorize': function(interactive){
            if (typeof interactive !== 'boolean')
                interactive = true;

            var deferred = $q.defer();
            try {
                chrome.identity.getAuthToken({interactive: interactive}, function(token) {
                    access_token = token;
                    if(token){
                        service.loggedin = true;
                        $timeout(_getUserData.bind(this), 0);
                    } else {
                        service.loggedin = false;
                    }
                    deferred.resolve(token);
                }.bind(this));
            } catch (e) {
                deferred.reject(e.message);
            }
            return deferred.promise;
        },
        /**
         * The user is authorized (has auth token) only if:
         * - has access token 
         * 
         * Note that the token might be revoked by the user in account settings so even if token here looks OK it might be invalid.
         * 
         * @returns {Boolean} True if has valid access token.
         */
        'isAuthorized': function(){
            if(!access_token) return false;
            return true;
        },
        'removeToken': function(){
            var deferred = $q.defer();
            $http.get('https://accounts.google.com/o/oauth2/revoke?token='+access_token).success(function() {
                service.clearCache().then(function(){
                    service.loggedin = false;
                    deferred.resolve();
                });
            });
            return deferred.promise;
        },
        'clearCache': function(){
            var deferred = $q.defer();
            chrome.identity.removeCachedAuthToken({
                token: access_token
            }, function() {
                access_token = null;
                deferred.resolve();
            }.bind(this));
            return deferred.promise;
        }
    };
    
    $timeout(restore,0);
    
    return service;
}]);

/**
 * A service responsible for getting definitions data like status codes or headers.
 */
AppServices.factory('Definitions', ['$q','$http', function($q, $http) {
    /**
     * @ngdoc method
     * @name Definitions.get
     * @function
     * 
     * @description Get app's definitions like HTTP status codes with explanations 
     * or HTTP request/response headers definitions.
     * @param {String} section it can be either: 'status', 'request-headers' or 'response-headers'
     * @example 
     *  Definitions.get('request-headers')
     *  .then(function(headers){
     *      headers.length;
     *  });
     * 
     * @returns {undefined}
     */
    var getDefinitions = function(section){
        var url = 'data/';
        switch(section){
            case 'status': url += 'http-status.json'; break;
            case 'request-headers': url += 'request-headers.json'; break;
            case 'response-headers': url += 'response-headers.json'; break;
            default:
                throw "Unknown section name: " + section;
        }
        return $http.get(url, {cache:true});
    };
    
    var service = {
        'get': getDefinitions
    };
    return service;
}]);