/* 
 * Copyright 2014 Paweł Psztyć.
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

angular.module('chrome.tcp', [])
.factory('ChromeTcp', ['$q',function($q){
    
    function ChromeTcpConnection(){
        /**
         * Connections object.
         * Key value is a socket ID. Value is object created by this._createProperties function.
         */
        this.connectionInfo = {};
        //Carriage Return character
        this.CR = '\n';
        /**
         * Event listeners.
         */
        this.listeners_ = {};
        
        this._registerSocketCallbacks();
    }
    /**
     * Create a new connection.
     * This method will open a new socket 
     * @param {Object} options
     * @returns {$q@call;defer.promise}
     *  .resolve() function will return socket identifier which should be used with this.send() function.
     */
    ChromeTcpConnection.prototype.createConnection = function(options){
        var defered = $q.defer();
        var context = this;
        var properties = this._createProperties(options);
        this._connect(properties.request.uri.host,properties.request.uri.port)
                .then(function(socketId){
                    console.log('Connected to socked for host: ', properties.request.uri.host, ' and port ', properties.request.uri.port);
                    properties.connection.readyState = 1;
                    properties.connection.connected = true;
                    context[socketId] = properties;
                    defered.resolve(socketId);
                })
                .catch(function(reason){
                    context.error('Can\'t create socket. Error code: ', reason);
                    defered.reject({
                        'code': reason,
                        'message': 'Connection refused.'
                    });
                });
        
        
        return defered.promise;
    };
    /**
     * Create connection properties object.
     * This class object can hold many connections at once. This method creates
     * properties object for each connection.
     * All connections are held in this.connectionInfo field with [socketId] as a key.
     * @param {Object} options Object passed to [createConnection] function.
     */
    ChromeTcpConnection.prototype._createProperties = function(options){
        
        var defaultOptions = {
            'headers': {},
            'body': null,
            'timeout': 0,
            'fallowredirects': true,
            'on': {}, //on.load.addEventListener, on.error, on.progress, on.start, on.uploadstart, on.upload, on.timeout, on.abort
            'debug': false
        };
        
        var uri = new URI(options.url);
        var options = angular.extend({}, defaultOptions, options);
        
        function getPort(){
            var port = null;
            var protocol = uri.protocol();
            var protocol2port = {
                'http': 80,
                'https': 443,
                'ftp': 21
            };
            if (protocol in protocol2port) {
                port = protocol2port[protocol];
            } else {
                port = uri.port();
            }
            if(!port){
                port = 80;
            }
            return port;
        }
        
        var uriData = {
            host: uri.host(),
            request_path: uri.path(),
            port: options.port || getPort()
        };
        if (uriData.request_path.trim() === '') {
            uriData.request_path = '/';
        }
        
        var properties = {
            readyState: 0,
            debug: options.debug,
            connection: {
                /**
                 * Flag if socket is connected.
                 * @type Boolean
                 */
                connected: false,
                /**
                 * Flag is connection error
                 * @type Boolean
                 */
                error: false,
                /**
                 * Is connection timeout
                 * @type Boolean
                 */
                isTimeout: false,
                /**
                 * Response length from Content-length header or chunk size if Transfer-Encoding is chunked
                 * @type Number
                 */
                _responseSuspectedLength: 0,
                /**
                 * Read response length. 
                 * It should be set to 0 after new chunk of response arrives.
                 * @type Number
                 */
                _responseRead: 0,
                /**
                 * Determine if the request has been aborted either because of timeout or this.abort();
                 * @type Boolean
                 */
                aborted: false
            },
            /**
             * Request properties
             */
            'request': {
                uri: uriData,
                /**
                 * HTTP request data
                 */
                data: {
                    'url': options.url,
                    'method': options.method,
                    'headers': options.headers,
                    'payload': options.payload
                },
                /**
                 * Message that will be send to the server
                 */
                'message': ''
            },
            /**
             * Response properties
             */
            'response': {
                /**
                 * Declared by the response content length
                 * @type Number
                 */
                'contentLength': null,
                /**
                 * Declared by the response transfer encoding.
                 * It is required to determine compression method (if any).
                 * @type String
                 */
                'transferEncoding': null,
                /**
                 * Determine if response headers has been already received
                 * @type Boolean
                 */
                'hasHeaders': false,
                /**
                 * Only if response payload contain information about it's length.
                 * @type Number
                 */
                'suspectedLength': 0,
                /**
                 * An information how much response has been already read.
                 * @type Number
                 */
                'responseRead': 0,
                /**
                 * Response buffer
                 * @type ArrayBuffer
                 */
                payload: [],
                /**
                 * When Transfer-Encoding header value is equal chunked
                 * it will hold an array of whole chunk.
                 * After full chunk is received it should be added to this.payload array
                 * @type Uint8Array
                 */
                chunkPayload: null
            }
        };
        
        
        
        return properties;
    };
    
    ChromeTcpConnection.prototype._connect = function(host, port){
        var defered = $q.defer();
        
        chrome.sockets.tcp.create({}, function(createInfo){
            var socketId = createInfo.socketId;
            console.log('Created socket with socketId: ',socketId);
            chrome.sockets.tcp.connect(socketId, host, port, function(result){
                if (result >= 0) {
                    defered.resolve(socketId);
                } else {
                    defered.reject(result);
                }
            });
        });
        
        
        return defered.promise;
    };
    
    ChromeTcpConnection.prototype.send = function(socketId){
        var defered = $q.defer();
        if(!(socketId in this.connectionInfo)){
            throw "Unknown connection identifier";
        }
        var props = this.connectionInfo[socketId];
        this._makeRequest(socketId,props).then(defered.resolve, defered.reject);
        return defered.promise;
    };
    
    ChromeTcpConnection.prototype._makeRequest = function(socketId,properties){
        var defered = $q.defer();
        if(properties.connection.aborted) {
            defered.reject(null);
            return defered.promise;
        }
        if (!properties.connection.readyState === 0) {
            this.dispatchEvent('error', {
                'code': '0',
                'message': 'Trying to make a request on inactive socket',
                'socketId': socketId
            });
            throw 'Trying to make a request on inactive socket'; 
        }
        
        this._prepageMessageBody()
        .then(this._writeMessage.bind(this,socketId))
        .then(function(written){
            console.info('HTTP message send: (bytes) ', written);
            defered.resolve(null);
        });
        return defered.promise;
    };
    
    ChromeTcpConnection.prototype._prepageMessageBody = function(properties){
        var defered = $q.defer();
        
        if(properties.connection.aborted) {
            defered.resolve(properties);
            return defered.promise;
        }
        var message = '';
        message = properties.request.data.method + ' ' + properties.request.uri.request_path + ' HTTP/1.1' + this.CR;
        message += 'Host: ' + properties.request.uri.host + this.CR;
        if (properties.request.data.headers) {
            if (typeof properties.request.data.headers === 'string') {
                message += properties.request.data.headers;
            } else {
                for (var key in properties.request.data.headers) {
                    if (properties.request.data.headers.hasOwnProperty(key) && typeof properties.request.data.headers[key] !== 'object') {
                        message += key + ': ' + properties.request.data.headers[key] + this.CR;
                    }
                }
            }
        }
        
        //@TODO
        //Other than String request body
        if (properties.request.data.body) {
            message += 'Content-Length: ' + this._lengthInUtf8Bytes(properties.request.data.body) + this.CR;
            message += this.CR;
            message += properties.request.data.body;
        }
        message += this.CR;
        console.info('Created message body: ', message);
        
        properties.request.message = message;
        defered.resolve(properties);
        return defered.promise;
    };
    ChromeTcpConnection.prototype._writeMessage = function(socketId, properties){
        var defered = $q.defer();
        if(properties.connection.aborted) {
            defered.resolve(properties);
            return defered.promise;
        }
        this.dispatchEvent('uploadstart', {socketId:socketId});
        properties.connection.readyState = 2;
        if (!(properties.request.message instanceof ArrayBuffer)) {
            properties.request.message = this._stringToArrayBuffer(properties.request.message);
        }
        chrome.sockets.tcp.send(socketId, properties.request.message, function(sendInfo) {
            if (sendInfo.resultCode < 0) {
                defered.reject({
                    'code': sendInfo.resultCode
                });
            } else {
                defered.resolve(sendInfo.bytesSent);
            }
        });
        return defered.promise;
    };
    /**
     * Register callback functions for socket.
     * @returns {undefined}
     */
    ChromeTcpConnection.prototype._registerSocketCallbacks = function(){
        chrome.sockets.tcp.onReceive.addListener(this._socketReceived.bind(this));
        /*
         * Event raised when a network error occured while the runtime was waiting for data on the socket address and port. Once this event is raised, the socket is set to paused and no more onReceive events are raised for this socket.
         */
        chrome.sockets.tcp.onReceiveError.addListener(this._socketReceivedError.bind(this));
    };
    /**
     * 
     * @param {Object} info The event data.
     *  socketId (integer) The socket identifier.
     *  data (ArrayBuffer) The data received, with a maxium size of bufferSize.
     * @returns {undefined}
     */
    ChromeTcpConnection.prototype._socketReceived = function(info){
        if(!(info.socketId in connectionInfo)){
            return;
        }
        
        if(info.data){
            console.info(performance.now(), 'Read socket data.');
            console.info(performance.now(), 'Has part of the message');
            this.dispatchEvent('progress', {});
            this._handleMessage(info.socketId, info.data);
        }
    };
    /**
     * 
     * @param {Object} info The event data.
     *  socketId (integer) The socket identifier.
     *  resultCode (integer) The result code returned from the underlying network call.
     * @returns {undefined}
     */
    ChromeTcpConnection.prototype._socketReceivedError = function(info){
        console.error(performance.now(), 'Disconnected or end of message.',info.resultCode);
        this._cleanUpResponse(info.socketId);
        this._close(info.socketId);
    };
    
    /**
     * http://stackoverflow.com/a/5515960.
     * Calculate string size (utf8 string)
     * @param {String} str Input string
     * @returns {Number} Size in bytes.
     */
    ChromeTcpConnection.prototype._lengthInUtf8Bytes = function(str){
        var m = encodeURIComponent(str).match(/%[89ABab]/g);
        return str.length + (m ? m.length : 0);
    };
    /**
     * Convert a string to an ArrayBuffer.
     * @param {string} string The string to convert.
     * @return {ArrayBuffer} An array buffer whose bytes correspond to the string.
     */
    ChromeTcpConnection.prototype._stringToArrayBuffer = function(string){
        var buffer = new ArrayBuffer(string.length);
        var bufferView = new Uint8Array(buffer);
        for (var i = 0; i < string.length; i++) {
            bufferView[i] = string.charCodeAt(i);
        }
        return buffer;
    };
    /**
     * Add |callback| as a listener for |type| events.
     * @param {string} type The type of the event.
     * @param {function(Object|undefined): boolean} callback The function to call
     *     when this event type is dispatched. Arguments depend on the event
     *     source and type. The function returns whether the event was "handled"
     *     which will prevent delivery to the rest of the listeners.
     */
    ChromeTcpConnection.prototype.addEventListener = function(type, callback){
        this._assertEventType(type);
        
        if (!this.listeners_[type])
            this.listeners_[type] = [];
        this.listeners_[type].push(callback);
        return this;
    };
    /**
     * Remove |callback| as a listener for |type| events.
     * @param {string} type The type of the event.
     * @param {function(Object|undefined): boolean} callback The callback
     *     function to remove from the event listeners for events having type
     *     |type|.
     */
    ChromeTcpConnection.prototype.removeEventListener = function(type, callback) {
        this._assertEventType(type);
        if (!this.listeners_[type])
            return;
        for (var i = this.listeners_[type].length - 1; i >= 0; i--) {
            if (this.listeners_[type][i] === callback) {
                this.listeners_[type].splice(i, 1);
            }
        }
        return this;
    };
    /**
     * Dispatch an event to all listeners for events of type |type|.
     * @param {type} type The type of the event being dispatched.
     * @param {...Object} var_args The arguments to pass when calling the
     *     callback function.
     * @return {boolean} Returns true if the event was handled.
     */
    ChromeTcpConnection.prototype.dispatchEvent = function(type, var_args) {
        this._assertEventType(type);
        if (!this.listeners_[type])
            return false;
        for (var i = 0; i < this.listeners_[type].length; i++) {
            if (this.listeners_[type][i].apply(
                    /* this */ null,
                    /* var_args */ Array.prototype.slice.call(arguments, 1))) {
                return true;
            }
        }
        return this;
    };
    /**
     * Assert event type exists and can be set.
     * @param {String} type Event type. eg.: load, error, progress etc
     * @returns {undefined}
     */
    ChromeTcpConnection.prototype._assertEventType = function(type) {
        if(['load','error','progress','start','uploadstart','upload','timeout','abort'].indexOf(type) === -1){
            throw "Unknown event type: "+type;
        }
    };
    
    var instance = new ChromeTcpConnection();
    
    var service = {
        'create': instance.createConnection
    };
    return service;
}]);