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

angular.module('chrome.http', [])
.factory('ChromeTcp', ['$q',function($q){
    
    
    /**
     * The response object.
     * @returns {HttpResponse}
     */
    function HttpResponse() {
        //Response status code. Eg: 200
        this.status = 0;
        //Response status text. Eg: OK
        this.statusText = '';
        //Response headers
        this.headers = [];
        //The response.
        this.response = null;
    }
    HttpResponse.prototype = {
        /**
         * Returns all headers from the response.
         * @returns {String} Source of the headers. Each header is in new line. Values are separated from names by ':'.
         */
        getAllResponseHeaders: function() {
            var result = '';
            for (var i = 0, len = this.headers.length; i < len; i++) {
                var header = this.headers[i];
                if (!header || !header.name)
                    continue;
                result += header.name + ': ' + header.value + '\n';
            }
            return result;
        },
        /**
         * Returns the header field value from the response.
         * @param {String} name - Case insensive header name.
         * @returns {String|null} - Value of the header or null if not found
         */
        getResponseHeader: function(name) {
            var headerValue = null, lowerName = name.toLowerCase();
            for (var i = 0, len = this.headers.length; i < len; i++) {
                var header = this.headers[i];
                if (!header || !header.name || (header.name.toLowerCase() !== lowerName))
                    continue;
                headerValue = header.value;
            }
            return headerValue;
        }
    };
    
    
    
    
    /**
     * 
     * @param {Object} options Request options:
     *  Required (String) url - Request URL
     *  Required (String) method- Request method
     *  Optional (Object|String) 'headers' - An object where key is header name and value is header value. If "headers" is a String it will be passed to the request body as is. Default empty object.
     *  Optional (String) 'body' - Request payload. Should not be set if request does not allow to carry a payload. TODO: allow file upload. Default null.
     *  Optional (int) 'timeout' - Request timeout. After this time request will be aborted and timeout and abort event fired. Default 0 - no timeout.
     *  Optional (bool) 'fallowredirects' - If false the request will fire load event when firest redirect occure. Default true.
     *  Optional (bool) 'debug' - Enable debug messages in console output. Default false. 
     *  Optional (Object) 'on' - event listeners for the request:
     *      (Function) 'load' - fired on request end
     *      (Function) 'error' - fired on request error
     *      (Function) 'progress' - fired when part of response data arrive
     *      (Function) 'start' - fired when the request start.
     *      (Function) 'uploadstart' - fired when request payload is about to send.
     *      (Function) 'upload' - firead when the request payload has been sent.
     *      (Function) 'timeout' - fired on timeout
     *      (Function) 'abort' - fired either with timeout or when the user (or the app) interrupt.
     *  
     * @returns {_L18.ChromeTcpConnection}
     */
    function ChromeTcpConnection(options){
        
        if(typeof Zlib === 'undefined'){
            throw "Library Zlib is required by this API.";
        }
        
        this.debug = false;
        /*
         Connection properties object.
         */
        this._createProperties(options);
        //Carriage Return character
        this.CR = '\n';
        /**
         * Event listeners.
         */
        this.listeners_ = {};
        
        this._registerSocketCallbacks();
    }
    
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
            'debug': false,
            'redirect': []
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
        
        this.debug = options.debug;
        this.redirect = options.redirect;
        
        /**
         * Connection properties
         */
        this.connection = {
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
             * Error message if any.
             */
            message: null,
            /**
             * Is connection timeout
             * @type Boolean
             */
            isTimeout: false,
            /**
             * Determine if the request has been aborted either because of timeout or this.abort();
             * @type Boolean
             */
            aborted: false,
            /**
             * Timeout set for request.
             */
            timeoutTimer: null,
            /**
             * Connection's ready state
             */
            readyState: 0,
            /**
             * Created socket ID.
             */
            socketId: null,
            /**
             * Flag, is response is chunked.
             */
            chunked: false
        };
        /**
         * Request properties
         */
         this.request = {
            /**
             * The URI object.
             */
            uri: uriData,
            /**
             * HTTP request data
             */
            data: {
                'url': options.url,
                'method': options.method,
                'headers': options.headers,
                'payload': options.payload,
                'httpmessage': ''
            },
            /**
             * Message that will be send to the server
             */
            'message': '',
            /**
             * Request timeout.
             */
            'timeout': options.timeout,
            /**
             * If the service should follow redirects.
             */
            'fallowredirects': options.fallowredirects
        };
        /**
         * Response properties
         */
        this.response = {
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
             * Response length from Content-length header or chunk size if Transfer-Encoding is chunked.
             * @type Number
             */
            'suspectedLength': 0,
            /**
             * An information how much response has been already read.
             * It should be set to 0 after new chunk of response arrives.
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
            chunkPayload: null,
            /**
             * A response object returned by the client.
             */
            data: null,
            /**
             * If response header message is grater than socket buffer size
             * this field will be used to keep previous response.
             * @type Unit8Array
             */
            tmpResponse: null
        };
        
        //setup listeners
        
        angular.forEach(options.on, function(fn,type){
            if(typeof fn !== 'function'){
                if(options.debug)
                    console.warn('fn is not a function', fn);
                return;
            }
            this.addEventListener(type, fn);
        }, this);
    };
    
    /**
     * Create a new connection.
     * This method will open a new socket 
     * 
     * @returns {$q@call;defer.promise}
     *  .resolve() function will return socket identifier which should be used with this.send() function.
     */
    ChromeTcpConnection.prototype._createConnection = function(){
        var defered = $q.defer();
        var context = this;
        
        this._connect(this.request.uri.host, this.request.uri.port)
            .then(function(socketId){
                if(context.debug){
                    console.log('Connected to socked for host: ', context.request.uri.host, ' and port ', context.request.uri.port);
                }
                context.connection.readyState = 1;
                context.connection.connected = true;
                context.connection.socketId = socketId;
                defered.resolve();
            })
            .catch(function(reason){
                if(context.debug){
                    context.error('Can\'t create socket. Error code: ', reason);
                }
                defered.reject({
                    'code': reason,
                    'message': 'Connection refused.'
                });
            });
        return defered.promise;
    };
    
    ChromeTcpConnection.prototype._connect = function(host, port){
        var defered = $q.defer();
        var context = this;
        chrome.sockets.tcp.create({}, function(createInfo){
            var socketId = createInfo.socketId;
            if(context.debug){
                console.info('Created socket with socketId: ',socketId);
                console.info('Connecting to host : ', host, 'on port: ', port);
            }
            chrome.sockets.tcp.connect(socketId, host, port, function(result){
                if(context.debug){
                    console.info('Connected to host : ', host, 'on port: ', port, 'using socket: ', socketId);
                }
                if (result >= 0) {
                    defered.resolve(socketId);
                } else {
                    defered.reject(result);
                }
            });
        });
        
        
        return defered.promise;
    };
    
    ChromeTcpConnection.prototype.send = function(){
        var context = this;
        var defered = $q.defer();
        this._createConnection()
            .then(this._makeRequest.bind(this))
            .then(function(result){
                context._setupTimeout();
                defered.resolve();
            })
            .catch(defered.reject);
        return defered.promise;
    };
    
    ChromeTcpConnection.prototype._makeRequest = function(){
        var defered = $q.defer();
        if(this.connection.aborted) {
            defered.reject(null);
            return defered.promise;
        }
        if (!this.connection.readyState === 0) {
            this.dispatchEvent('error', {
                'code': '0',
                'message': 'Trying to make a request on inactive socket'
            });
            throw 'Trying to make a request on inactive socket'; 
        }
        var context = this;
        this._prepageMessageBody()
        .then(this._writeMessage.bind(this))
        .then(function(written){
            if(context.debug){
                console.info('HTTP message send: (bytes) ', written);
            }
            defered.resolve(null);
        });
        return defered.promise;
    };
    
    ChromeTcpConnection.prototype._prepageMessageBody = function(){
        var defered = $q.defer();
        
        if(this.connection.aborted) {
            defered.resolve();
            return defered.promise;
        }
        var message = '';
        message = this.request.data.method + ' ' + this.request.uri.request_path + ' HTTP/1.1' + this.CR;
        message += 'Host: ' + this.request.uri.host + this.CR;
        if (this.request.data.headers) {
            if (typeof this.request.data.headers === 'string') {
                message += this.request.data.headers;
            } else {
                for (var key in this.request.data.headers) {
                    if (this.request.data.headers.hasOwnProperty(key) && typeof this.request.data.headers[key] !== 'object') {
                        message += key + ': ' + this.request.data.headers[key] + this.CR;
                    }
                }
            }
        }
        
        //@TODO
        //Other than String request body
        if (this.request.data.body) {
            message += 'Content-Length: ' + this._lengthInUtf8Bytes(this.request.data.body) + this.CR;
            message += this.CR;
            message += this.request.data.body;
        }
        message += this.CR;
        if(this.debug){
            console.info('Created message body: ', message);
        }
        this.request.data.httpmessage = message;
        defered.resolve();
        return defered.promise;
    };
    ChromeTcpConnection.prototype._writeMessage = function(){
        var defered = $q.defer();
        if(this.connection.aborted) {
            defered.resolve();
            return defered.promise;
        }
        this.dispatchEvent('uploadstart', {});
        this.connection.readyState = 2;
        if (!(this.request.data.httpmessage instanceof ArrayBuffer)) {
            this.request.message = this._stringToArrayBuffer(this.request.data.httpmessage);
        } else {
            this.request.message = this.request.data.httpmessage;
        }
        var context = this;
        chrome.sockets.tcp.send(this.connection.socketId, this.request.message, function(sendInfo) {
            if(context.debug){
                console.info('Sent message to peer using socket #', context.connection.socketId, ', payload: ', context.request.message, ' with result: ', sendInfo);
            }
            context.dispatchEvent('upload', {});
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
        
        if(this.connection.socketId !== info.socketId){
            if(this.debug){
                console.warn('Has different socket response than suposed.');
            }
            return;
        }
        
        if(info.data){
            if(this.debug){
                console.info(performance.now(), 'Has part of the message');
            }
            //@TODO: move this event into place where read size can be read and fire event with numeric values like: current and total.
            this.dispatchEvent('progress', {});
            //chrome.sockets.tcp.setPaused(this.connection.socketId, true);
            this._handleMessage(info.data);
            //chrome.sockets.tcp.setPaused(this.connection.socketId, false);
        }
    };
    /**
     * Handle response from socket.
     * It may not be complete response. If Transfer-Encoding == 'chunked' then message may be split to many messages so there is no sure that this is full response body.
     * Response body starts with HTTP status, headers list and the payload.
     * This method will extract message body, status and headers and save it to later fields. 
     * If there is no status line it means that this is another part of the response and it should append payload to proper field.
     * 
     * @param {ArrayBuffer} response
     * @returns {undefined}
     */
    ChromeTcpConnection.prototype._handleMessage = function(response){
       
        if(this.connection.aborted) return;
        var array = new Uint8Array(response);
        
        if (!this.response.hasHeaders) {
            if(this.response.tmpResponse !== null){
                var newLength = this.response.tmpResponse.length + array.length;
                var newArray = new Uint8Array(newLength);
                newArray.set(this.response.tmpResponse);
                newArray.set(array, this.response.tmpResponse.length);
                array = newArray;
                this.response.tmpResponse = null;
            }
            
            array = this._readResponseHeaders(array);
            
            if(this.connection.error){
                this.connection.aborted = true;
                if(this.debug){
                    console.error('Connection error', this);
                }
                this.dispatchEvent('error', {
                    'code': 0,
                    'message': this.connection.message
                });
                
                return;
            }
            
            if(!this.response.hasHeaders){
                // no full headers response yet
                if(this.response.tmpResponse === null){
                    this.response.tmpResponse = array;
                } else {
                    this.response.tmpResponse.set(array);
                }
                return;
            }
            this.response.chunkPayload = new Uint8Array(this.response.suspectedLength);
        }
        
        try {
            this._readPayloadData(array);
        } catch (e) {
            this.dispatchEvent('error', {
                'code': 0,
                'message': 'The program was unable to read input data properly. ' + e.message
            });
            return;
        }

        if (this.response.responseRead === this.response.suspectedLength) {
            var responseStr = this._getMessageString();
            this.response.data.response = responseStr;
            this._close();
            this._cleanUpResponse();
            this._onResponseReady();
        }
    };
    /**
     * Read headers data from bytes array.
     * Read until CRCR occur (ANCII 13+10+13+10 sentence)
     * 
     * This method can't be asynchronius. 
     * If this function will release event loop it will cause new response part 
     * to arrive without setting current one.
     * 
     * @param {Uint8Array} array
     * @returns {number} Position of the array where headers ends
     */
    ChromeTcpConnection.prototype._readResponseHeaders = function(array){
        if(this.connection.aborted) return;
        
        //
        // Looking for CR CR characters. It is a delimiter for HTTP status message 
        //
        
        var foundDelim = false;
        var i = 0;
        for (; i < array.length; ++i) {
            if (array[i] === 13) {
                //we have candidate!
                if (array[i + 1] === 10) {
                    //no big deal, regular CR
                    if (array[i + 2] === 13) {
                        if (array[i + 3] === 10) {
                            //it is CRCR
                            foundDelim = true;
                            break;
                        }
                    }
                }
            }
        }
        
        
        //
        // If not found whole current message is only part of status message.
        // Wait until next part arrive.
        //
        if(!foundDelim){
            if(this.debug){
                console.log('Not delimiter found');
            }
            return array;
        }
        
        
        //
        // The app has found HTTP status message.
        // Read it, set response status, headers, truncate the array and return it.
        //
        
        var status = null, statusMessage = null, statusLine = null, headers = [];
        
        // truncate array from start to the delimiter (CRCR) place.
        var headersArray = array.subarray(0, i);
        var headersMessage = this._arrayBufferToString(headersArray);
        if(this.debug){
            console.info('Response message: ', headersMessage);
        }
        var splitted = headersMessage.split('\n');
        
        //
        // A first line is the status. Rest of it are headers.
        //
        var status_line = splitted.shift();
        if(this.debug){
            console.info('Response\'s first line: ', status_line);
        }
        statusLine = status_line.replace(/HTTP\/\d(\.\d)?\s/, '');
        status = statusLine.substr(0, statusLine.indexOf(' '));
        
        try {
            status = parseInt(status);
        } catch (e) {
            if(this.debug){
                console.error('Status line is not valid: ', status_line);
            }
            this.connection.error = true;
            this.connection.message = "Response doeas not contain status message.";
            return null;
        }
        
        statusMessage = statusLine.substr(statusLine.indexOf(' ') + 1);
        if(this.debug){
            console.info('Response status: ', status, statusMessage, statusLine);
        }
        
        ///
        /// Read a response headers
        ///
        for (var j = 0, len = splitted.length; j < len; j++) {
            var _header = splitted[j];
            var _tmp = _header.split(/:\s/);
            var key = _tmp.shift();
            var o = {
                'name': key,
                'value': (_tmp.join(': ')).trim()
            };
            headers[headers.length] = o;
        }
        if(this.debug){
            console.info('Response headers: ', headers);
        }
        this.response.hasHeaders = true;
        /// 
        /// Create a response object 
        ///
        this.response.data = new HttpResponse();
        this.response.data.headers = headers;
        this.response.data.status = status;
        this.response.data.statusText = statusMessage;
        
        array = array.subarray(i + 4);
        array = this._setResponseLength(array);
        
        return array;
    };
    
    /**
     * Read response suspected length depending on response headers.
     * For Transfer-Encoding: chunked, each chunk has number of length in first line of the message.
     * If Content-Length header is present the response is in one chunk and this will be while message.
     * 
     * @param {Uint8Array} array Response payload.
     * @returns {Uint8Array}
     */
    ChromeTcpConnection.prototype._setResponseLength = function(array){
        var tr = this.response.data.getResponseHeader('Transfer-Encoding');
        if (tr && tr === 'chunked') {
            this.connection.chunked = true;
            //read array until next CR. Evertything earlier is a chunk size (hex).
            array = this._readChunkSize(array);
        } else {
            var cs = this.response.data.getResponseHeader('Content-Length');
            if(cs){
                this.response.suspectedLength = parseInt(cs);
            }
        }
        return array;
    };
    
    
    /**
     * 
     * @param {Uint8Array} array
     * @returns {undefined}
     */
    ChromeTcpConnection.prototype._readPayloadData = function(array){
        if(this.connection.aborted) return;
        var shouldBe = this.response.suspectedLength - this.response.responseRead;
        if (shouldBe < 1) {
            return;
        }
        
        if (shouldBe >= array.length) {
            if (this.response.chunkPayload) {
                this.response.chunkPayload.set(array, this.response.responseRead);
            } else {
                this.response.chunkPayload = array;
            }
            this.response.responseRead += array.length;
        } else if (shouldBe < array.length) {
            //somewhere here is the end of chunk, 
            //new chunk length and another part of chunk
            if (this.response.chunkPayload) {
                this.response.chunkPayload.set(array.subarray(0, shouldBe), this.response.responseRead);
            } else {
                this.response.chunkPayload = array.subarray(0, shouldBe);
            }

            array = array.subarray(shouldBe + 2);
            array = this._readChunkSize(array);
            this.response.responseRead = 0;
            this.response.payload[this.response.payload.length] = this.response.chunkPayload;
            this.response.chunkPayload = new Uint8Array(this.response.suspectedLength);
            this._readPayloadData(array);
        }
    };
    /**
     * If response transfer-encoding is 'chunked' read until next CR. Everything earlier is a chunk size.
     * 
     * @param {Uint8Array} array
     * @returns {Uint8Array} Truncated response without chybk size line
     */
    ChromeTcpConnection.prototype._readChunkSize = function(array){
        if(this.connection.aborted) return;
        
        var i = 0;
        for (; i < array.length; ++i) {
            if (array[i] === 13) {
                if (array[i + 1] === 10) {
                    break;
                }
            }
        }
        var sizeArray = array.subarray(0, i);
        var sizeHex = this._arrayBufferToString(sizeArray);
        this.response.suspectedLength = parseInt(sizeHex, 16);
        return array.subarray(i + 2);
    };
    /**
     * Read the response and return it as a string.
     * 
     * @returns {String|_L18.ChromeTcpConnection.prototype@call;_getChunkedMessageString}
     */
    ChromeTcpConnection.prototype._getMessageString = function(){
        
        var tr = this.response.data.getResponseHeader('Transfer-Encoding');
        if (tr && tr === 'chunked') {
            return this._getChunkedMessageString();
        }
        this.response.chunkPayload = this._checkCompression(this.response.chunkPayload);

        return this._arrayBufferToString(this.response.chunkPayload);
    };
    
    ChromeTcpConnection.prototype._getChunkedMessageString = function(){
        
        var bufferSize = 0;
        for (var i = 0, parts = this.response.payload.length; i < parts; i++) {
            bufferSize += this.response.payload[i].length;
        }
        var buffer = new Uint8Array(bufferSize);
        var written = 0;
        while (this.response.payload.length > 0) {
            var payload = this.response.payload.shift();
            buffer.set(payload, written);
            written += payload.length;
            
        }
        if (written > 0) {
            buffer = this._checkCompression(buffer);
            return this._arrayBufferToString(buffer);
        }
        return '';
    };
    /**
     * If response content-encoding is gzip or deflate it will replace this.response.chunkPayload Uint8Array from encoded data to decoded data.
     * @param {Object} props
     * @param {Uin8Array} data Data to check and decompress if needed
     * @returns {Uin8Array} converted Uint8Array
     */
    ChromeTcpConnection.prototype._checkCompression = function(data){
        var ce = this.response.data.getResponseHeader('Content-Encoding');
        if (!ce){
            if(this.debug){
                console.info('Message is not compressed');
            }
            return data;
        }
        if (ce.indexOf('gzip') !== -1) {
            if(this.debug){
                console.info('Message is gzip compressed');
            }
            var inflate = new Zlib.Gunzip(data);
            data = inflate.decompress();
        } else if (ce.indexOf('deflate') !== -1) {
            if(this.debug){
                console.info('Message is gzip deflate compressed');
            }
            var inflate = new Zlib.Inflate(data);
            data = inflate.decompress();
        } else {
            if(this.debug){
                console.info('Unknown compress method');
            }
        }
        return data;
    };
    
    ChromeTcpConnection.prototype._setupTimeout = function(){
        
        if(this.connection.aborted) return;
        if (this.request.timeout <= 0)
            return;
        var context = this;
        this.connection.timeoutTimer = window.setTimeout(function(e){
            context.connection.aborted = true;
            context._close();
            context.dispatchEvent('timeout', {
                'code': 0,
                'message': 'Timeout exceeded.'
            });
        }, this.request.timeout);
    };
    
    ChromeTcpConnection.prototype._onResponseReady = function(){
        if(this.connection.aborted) return;
        if(this.connection.timeoutTimer){
            window.clearTimeout(this.connection.timeoutTimer);
            delete this.connection.timeoutTimer;
        }
        if(this.debug){
            console.log(performance.now(), 'Response ready');
        }
        this.dispatchEvent('load', {
            'request': this.request.data,
            'response': this.response.data
        });
    };
    
    ChromeTcpConnection.prototype._close = function(){
        chrome.sockets.tcp.disconnect(this.connection.socketId);
        chrome.sockets.tcp.close(this.connection.socketId);
        this.connection.readyState = 3;
        
        chrome.sockets.tcp.onReceive.removeListener(this._socketReceived.bind(this));
        chrome.sockets.tcp.onReceiveError.removeListener(this._socketReceivedError.bind(this));
        
        if(this.connection.timeoutTimer){
            window.clearTimeout(this.connection.timeoutTimer);
            delete this.connection.timeoutTimer;
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
        if(this.connection.readyState === 3) return;
        if(this.debug){
            console.error(performance.now(), 'Disconnected or end of message.',info.resultCode, info.socketId);
        }
        this._cleanUpResponse();
        this._close();
        
    };
    
    ChromeTcpConnection.prototype._cleanUpResponse = function(){
        delete this.response.chunkPayload;
        delete this.response.hasHeaders;
        delete this.response.suspectedLength;
        delete this.response.responseRead;
        delete this.response.payload;
        delete this.response.message;
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
     * Convert ArrayBuffer to readable form
     * @param {ArrayBuffer} buff
     * @returns {String} Converted string
     */
    ChromeTcpConnection.prototype._arrayBufferToString = function(buff){
        var array = new Uint8Array(buff);
        var str = '';
        for (var i = 0; i < array.length; ++i) {
            str += String.fromCharCode(array[i]);
        }
        return str;
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
        this.assertEventType(type);
        
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
        this.assertEventType(type);
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
        this.assertEventType(type);
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
    ChromeTcpConnection.prototype.assertEventType = function(type) {
        if(['load','error','progress','start','uploadstart','upload','timeout','abort'].indexOf(type) === -1){
            throw "Unknown event type: "+type;
        }
    };
    
    
    
    
    function HttpRequest(opts){
        this.listeners_ = {};
        if (opts && opts.load) {
            this.addEventListener('load', opts.load);
            delete opts.load;
        }
        if (opts && opts.error) {
            this.addEventListener('error', opts.error);
            delete opts.error;
        }
        this.request = new ChromeTcpConnection(opts);
        this.orygopts = opts;
        this.started = false;
        this.redirect = [];
        this.aborted = false;
        this._setUpListners();
    }
    HttpRequest.prototype.addEventListener = function(type, callback){
        if (!this.listeners_[type])
            this.listeners_[type] = [];
        this.listeners_[type].push(callback);
        return this;
    };
    HttpRequest.prototype.removeEventListener = function(type, callback) {
        if (!this.listeners_[type])
            return;
        for (var i = this.listeners_[type].length - 1; i >= 0; i--) {
            if (this.listeners_[type][i] === callback) {
                this.listeners_[type].splice(i, 1);
            }
        }
    };
    HttpRequest.prototype.dispatchEvent = function(type, var_args) {
        if (!this.listeners_[type])
            return false;
        for (var i = 0; i < this.listeners_[type].length; i++) {
            if (this.listeners_[type][i].apply(
                    /* this */ null,
                    /* var_args */ Array.prototype.slice.call(arguments, 1))) {
                return true;
            }
        }
    };
    HttpRequest.prototype._setUpListners = function(){
        if(this.aborted) return;
        this.request.addEventListener('start', this._start.bind(this));
        this.request.addEventListener('uploadstart', this._uploadstart.bind(this));
        this.request.addEventListener('upload', this._upload.bind(this));
        this.request.addEventListener('progress', this._progress.bind(this));
        this.request.addEventListener('load', this._load.bind(this));
        this.request.addEventListener('error', this._error.bind(this));
        this.request.addEventListener('timeout', this._timeout.bind(this));
    };
    HttpRequest.prototype.send = function() {
        if(this.aborted) return;
        this.request.send();
    };
    HttpRequest.prototype.abort = function() {
        if(this.aborted) return;
        this.aborted = true;
        this.request.abort();
        this.dispatchEvent('abort');
    };
    HttpRequest.prototype._start = function() {
        if(this.aborted) return;
        if(this.started) return;
        this.started = true;
        this.dispatchEvent('start', arguments);
    };
    HttpRequest.prototype._uploadstart = function() {
        if(this.aborted) return;
        this.dispatchEvent('uploadstart', arguments);
    };
    HttpRequest.prototype._upload = function() {
        if(this.aborted) return;
        this.dispatchEvent('upload', arguments);
    };
    HttpRequest.prototype._progress = function() {
        if(this.aborted) return;
        this.dispatchEvent('progress', arguments);
    };
    HttpRequest.prototype._error = function() {
        if(this.aborted) return;
        this.dispatchEvent('error', arguments);
    };
    HttpRequest.prototype._timeout = function() {
        if(this.aborted) return;
        this.aborted = true;
        this.dispatchEvent('timeout', arguments);
    };
    HttpRequest.prototype._load = function() {
        if(this.aborted) return;
        var response = this.request.response.data;
        
        function finish(){
            var result = {
                'redirects': this.redirect,
                'request': this.request.request.data,
                'response': this.request.response.data
            };
            this.dispatchEvent('load', result);
        }
        
        //check redirect
        if (response.status > 300 && response.status <= 307 && this.request.request.fallowredirects) {
            var location = response.getResponseHeader('Location');
            if (!location) {
                finish.call(this);
                return;
            }
            delete response['response'];
            this.redirect[this.redirect.length] = response;
            var opt = angular.extend({}, this.orygopts);
            opt.url = location;
            this.request = new ChromeTcpConnection(opt);
            this._setUpListners();
            this.send();
        } else {
            delete this.started;
            finish.call(this);
        }
    };
    
    
    
    var service = {
        'create': function(props){
            return new HttpRequest(props);
        }
    };
    return service;
}]);