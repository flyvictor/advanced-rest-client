
angular.module('chrome.http', [])
.factory('ChromeHttp', ['$q', '$http', function($q, $http){
    /**
     * http://stackoverflow.com/a/17192845/1127848
     * Convert Uint8Array to a utf string
     * @param {Uint8Array} uintArray
     * @returns {_L22.uintToString.decodedString}
     */
    function uintToString(uintArray) {
        var encodedString = "", i = 0, l = uintArray.length;
        while (i < l) {
            var end = Math.min(i + 10000, l);
            encodedString += String.fromCharCode.apply(null, uintArray.subarray(i, end));
            i = end;
        }
        //var encodedString = String.fromCharCode.apply(null, uintArray);
        
        var decodedString = decodeURIComponent(escape(encodedString));
        return decodedString;
    }
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
        //Message receiving time.
        this.responseTime = 0;
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
     * @returns {_L18.ChromeHttpConnection}
     */
    function ChromeHttpConnection(options){
        
        if(typeof Zlib === 'undefined'){
            throw "Library Zlib is required by this API.";
        }
        
        //this.debug = false;
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
        
    }
    
    /**
     * Create connection properties object.
     * This class object can hold many connections at once. This method creates
     * properties object for each connection.
     * All connections are held in this.connectionInfo field with [socketId] as a key.
     * @param {Object} options Object passed to [createConnection] function.
     */
    ChromeHttpConnection.prototype._createProperties = function(options){
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
            var port = uri.port();
            var protocol = uri.protocol();
            var protocol2port = {
                'http': 80,
                'https': 443,
                'ftp': 21
            };

            // changed this so that uri port takes precedence
            if(!port && protocol in protocol2port) {
                port = protocol2port[protocol];
            }

            if(!port){
                port = 80;
            }
            return port;
        }
        
        var uriData = {
            host: uri.host(),
            request_path: uri.resource(), //uri.path(),
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
            chunked: null,
            /**
             * Connection metrics
             */
            metrics: {
                /**
                 * Time of request sent
                 */
                messageSent: 0,
                /**
                 * Time of request received
                 */
                messageReceived: 0
            }
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
            tmpResponse: null,
            /**
             * If true the message is ended.
             * For chunked messages it's end is marked as:
             * 
             * 0\r\n
             * \r\n
             * 
             * If such message is found, whole message is processed.
             */
            ended: false
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
    
   
    
    ChromeHttpConnection.prototype.send = function(){
        var context = this;
        var defered = $q.defer();
        this._makeRequest().then(function(result){
               // context._setupTimeout();
                console.log("REESULT", result);
                context.response.data = context.response.data || {};
                context.response.data.response = JSON.stringify(result.data);
                var headers = [],
                    headerDictionary = result.headers();

                for(var key in headerDictionary){
                    if(headerDictionary.hasOwnProperty(key)){
                        headers.push({name: key, value: headerDictionary[key]});
                    }
                }
                context.response.data.headers = headers; 
                context.response.data.status = result.status;

                context._cleanUpResponse();
                context._onResponseReady();

                defered.resolve();
            })
            .catch(defered.reject);
        return defered.promise;
    };
    
    ChromeHttpConnection.prototype._makeRequest = function(){
        var defered = $q.defer();

        var context = this;
        
        return this._prepageMessageBody()
            .then(this._getResponse.bind(this));
    };
    
    ChromeHttpConnection.prototype._prepageMessageBody = function(){
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

    ChromeHttpConnection.prototype._getResponse = function(){
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
        var context = this,
            requestData = context.request.data;

        $http[requestData.method.toLowerCase()](requestData.url)
        .success(function(data, status, headers){
            defered.resolve({'data': data, 'headers': headers, 'status': status});
        }).error(function(data, status, headers){
            defered.resolve({'status': status, 'data': data, 'headers': headers});
        });

        return defered.promise;
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
    ChromeHttpConnection.prototype._readResponseHeaders = function(array){
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
        //array = this._setResponseLength(array);
        
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
    ChromeHttpConnection.prototype._setResponseLength = function(array){
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
     * Read payload data.
     * At this point there are not any HTTP messages likie status or headers.
     * 
     * If the response is not chunked just put all in the array so it will be read later as string.
     * 
     * If the response is chunked first the app need to know chunk size.
     * It is delimited between message parts by two CR characters and number (in HEX) which is a chunk size.
     * Everything between chunk sizes is response payload.
     * 
     * Response is held in Unit8Array so Unit8Array.length is a length of characters (as an array of unsigned integers).
     * 
     * @param {Uint8Array} array
     * @returns {undefined}
     */
    ChromeHttpConnection.prototype._readPayloadData = function(array){
        if(this.connection.aborted) return;
        if(this.debug){
            console.group("_readPayloadData");
        }
        
        if(array.length === 0){
            if(this.debug){
                console.info('(%f) Array\'s empty. But it should work anyway.', performance.now());
                console.groupEnd();
            }
            return;
        }
        
        if(!this.connection.chunked){
            //simply add response to the response array
            this.response.payload[this.response.payload.length] = array();
            this.response.responseRead += array.length;
            
            if (this.response.responseRead === this.response.suspectedLength) {
                this.response.ended = true;
            }
            if(this.debug){
                console.groupEnd();
            }
            return;
        }
        
        //
        // Note. At this point ther's no sure if current part is at the begining of chunk or not.
        // It's depended on socket's buffer size. So either it can be begining ot the chunk
        // (ther's no this.response.suspectedLength set, first two lines should be a chunk size information)
        // or it can be part of a chunk that should be appended to previous payload.
        // Second case may include current chunk end and next chunk definition (end possibly next part of payload).
        //
        
        if(!this.response.suspectedLength){
            // No metter is this first chunk or any other. 
            // At this point it should be only chunk size and the payload.
            array = this._readChunkSize(array);
            
            if(array === -1 && this.response.ended){ //end if HTTP message.
                if(this.debug){
                    console.groupEnd();
                }
                return;
            }
            
            if(!this.response.suspectedLength){
                //Something bead happened. Definitely there's should be a chunk length here.
                //Can't contunue because ther's no sure that the response is OK.
                this.connection.aborted = true;
                this.connection.error = true;
                this.connection.message = "Can't read response size. Can't continue.";
                console.warn('(%f) Can\'t read response size. Can\'t continue.', performance.now());
                this.dispatchEvent('error', {
                    'code': 0,
                    'message': this.connection.message
                });
                if(this.debug){
                    console.log('Whole message:', this._getChunkedMessageString());
                    console.groupEnd();
                }
                return;
            }
            
            var narr = new Uint8Array(this.response.suspectedLength);
            if (this.response.chunkPayload) {
                console.log('chunkPayload.length: ',this.response.chunkPayload.length,' suspectedLength: ', this.response.suspectedLength);
                narr.set(this.response.chunkPayload, 0);
            }
            this.response.chunkPayload = narr;
        }
        
        var shouldBe = this.response.suspectedLength - this.response.responseRead;
        if (shouldBe < 0) {
            if(this.debug){
                console.warn('Interesting... More bytes written than suspected to be.');
                console.groupEnd();
            }
            return;
        }
        
        if (shouldBe > array.length) {
            //Just fill current chunk array.
            this.response.chunkPayload.set(array, this.response.responseRead);
            this.response.responseRead += array.length;
            
        } else if (shouldBe <= array.length) {
            //Fill only what's left to write and start over.
            this.response.chunkPayload.set(array.subarray(0, shouldBe), this.response.responseRead);
//            console.log('Ended chunk:', this.response.chunkPayload);
            array = array.subarray(shouldBe + 2); //add + characters for CRLF ("\r\n")
//            console.log('New chunk:', array);
            this.response.suspectedLength = 0;
            this.response.responseRead = 0;
            this.response.payload[this.response.payload.length] = this.response.chunkPayload;
            this.response.chunkPayload = null;
            this._readPayloadData(array);
        }
        if(this.debug){
            console.groupEnd();
        }
    };
    /**
     * 
     * 
     * @param {Uint8Array} array
     * @returns {Uint8Array} Truncated response without chybk size line
     */
    ChromeHttpConnection.prototype._readChunkSize = function(array){
        if(this.debug){
            console.group("_readChunkSize");
        }
        
        if(this.connection.aborted) {
            if(this.debug){
                console.warn('(%f) Request aborted', performance.now());
                console.groupEnd();
            }
            return array;
        }
        
        if(array.length === 0) {
            this.response.suspectedLength = 0;
            if(this.debug){
                console.warn('(%f) Array is empty', performance.now());
                console.groupEnd();
            }
            return array;
        }
        
        var endMarker = new Uint8Array([48, 13, 10, 13, 10]);
        if(angular.equals(endMarker,array)){
            this.response.ended = true;
            if(this.debug){
                console.info('This is the end of the response.');
                console.groupEnd();
            }
            return -1;
        }
        var i = 0;
        var found = false;
        for (; i < array.length; ++i) {
            if (array[i] === 13) {
                if (array[i + 1] === 10) {
                    found = true;
                    break;
                }
            }
        }
        if(!found){
            if(this.debug){
                console.error('Chunk size is not present in the array!');
                console.log('Whole message:', this._getChunkedMessageString());
                console.groupEnd();
            }
            return null;
        }
        var sizeArray = array.subarray(0, i);
        var sizeHex = this._arrayBufferToString(sizeArray);
        if(this.debug){
            console.log('(%f) Found chunk size (hex): %s ', performance.now(), sizeHex);
        }
//        console.log("%cChunk data: "+this._arrayBufferToString(array), "color: blue; font-size: x-small");
        this.response.suspectedLength = parseInt(sizeHex, 16);
        if(this.debug){
            console.log("%c(%f) Decimal chunk size: %d", "color: green;", performance.now(), this.response.suspectedLength);
        }
        if(isNaN(this.response.suspectedLength)){
            console.warn('(%f) Decimal chunk size is nan...', performance.now());
            this.response.suspectedLength = 0;
        }
        if(this.debug){
            console.groupEnd();
        }
        return array.subarray(i + 2);
    };
    /**
     * Read the response and return it as a string.
     * 
     * @returns {String|_L18.ChromeHttpConnection.prototype@call;_getChunkedMessageString}
     */
    ChromeHttpConnection.prototype._getMessageString = function(){
        
        var tr = this.response.data.getResponseHeader('Transfer-Encoding');
        if (tr && tr === 'chunked') {
            return this._getChunkedMessageString();
        }
        this.response.chunkPayload = this._checkCompression(this.response.chunkPayload);

        return this._arrayBufferToString(this.response.chunkPayload);
    };
    
    ChromeHttpConnection.prototype._getChunkedMessageString = function(){
        
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
            return uintToString(buffer);
        }
        return '';
    };
    /**
     * If response content-encoding is gzip or deflate it will replace this.response.chunkPayload Uint8Array from encoded data to decoded data.
     * @param {Object} props
     * @param {Uin8Array} data Data to check and decompress if needed
     * @returns {Uin8Array} converted Uint8Array
     */
    ChromeHttpConnection.prototype._checkCompression = function(data){
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
    
    
    ChromeHttpConnection.prototype._onResponseReady = function(){
        this.dispatchEvent('load', {
            'request': this.request.data,
            'response': this.response.data
        });
    };
    
   
    
    ChromeHttpConnection.prototype._cleanUpResponse = function(){
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
    ChromeHttpConnection.prototype._lengthInUtf8Bytes = function(str){
        var m = encodeURIComponent(str).match(/%[89ABab]/g);
        return str.length + (m ? m.length : 0);
    };
    /**
     * Convert a string to an ArrayBuffer.
     * @param {string} string The string to convert.
     * @return {ArrayBuffer} An array buffer whose bytes correspond to the string.
     */
    ChromeHttpConnection.prototype._stringToArrayBuffer = function(string){
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
    ChromeHttpConnection.prototype._arrayBufferToString = function(buff){
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
    ChromeHttpConnection.prototype.addEventListener = function(type, callback){
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
    ChromeHttpConnection.prototype.removeEventListener = function(type, callback) {
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
    ChromeHttpConnection.prototype.dispatchEvent = function(type, var_args) {
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
    ChromeHttpConnection.prototype.assertEventType = function(type) {
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
        this.request = new ChromeHttpConnection(opts);
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
                'response': this.request.response.data,
                'destination': this.request.request.data.url
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
            this.request = new ChromeHttpConnection(opt);
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