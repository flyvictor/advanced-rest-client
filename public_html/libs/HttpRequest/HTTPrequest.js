(function() {
    /**
     * An event source can dispatch events. These are dispatched to all of the
     * functions listening for that event type with arguments.
     * @constructor
     * @copyright Copyright (c) 2013 The Chromium Authors. All rights reserved.
     * Use of this source code is governed by a BSD-style license that can be
     * found in the LICENSE file.
     */
    function EventSource() {
        this.listeners_ = {};
    }

    EventSource.prototype = {
        /**
         * Add |callback| as a listener for |type| events.
         * @param {string} type The type of the event.
         * @param {function(Object|undefined): boolean} callback The function to call
         *     when this event type is dispatched. Arguments depend on the event
         *     source and type. The function returns whether the event was "handled"
         *     which will prevent delivery to the rest of the listeners.
         */
        addEventListener: function(type, callback) {
            if (!this.listeners_[type])
                this.listeners_[type] = [];
            this.listeners_[type].push(callback);
            return this;
        },
        /**
         * Remove |callback| as a listener for |type| events.
         * @param {string} type The type of the event.
         * @param {function(Object|undefined): boolean} callback The callback
         *     function to remove from the event listeners for events having type
         *     |type|.
         */
        removeEventListener: function(type, callback) {
            if (!this.listeners_[type])
                return;
            for (var i = this.listeners_[type].length - 1; i >= 0; i--) {
                if (this.listeners_[type][i] === callback) {
                    this.listeners_[type].splice(i, 1);
                }
            }
            return this;
        },
        /**
         * Dispatch an event to all listeners for events of type |type|.
         * @param {type} type The type of the event being dispatched.
         * @param {...Object} var_args The arguments to pass when calling the
         *     callback function.
         * @return {boolean} Returns true if the event was handled.
         */
        dispatchEvent: function(type, var_args) {
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
        }
    };
    /**
     * Clone object.
     * http://stackoverflow.com/a/9023088
     * @param {Any} obj to clone
     * @returns {Object.cloneNode|Array}
     */
    function cloneObject(obj) {
        if(jQuery && jQuery.extend){
            return jQuery.extend({}, obj);
        }
        if (obj.cloneNode)
            return obj.cloneNode(true);
        var copy = obj instanceof Array ? [] : {};
        for (var attr in obj) {
            if (typeof obj[attr] === "function" || obj[attr] === null || !obj[attr].clone) {
                copy[attr] = obj[attr];
            } else if (obj[attr] === obj)
                copy[attr] = copy;
            else
                copy[attr] = cloneObject(obj[attr]);
        }
        return copy;
    };


    /**
     * Base class for HTTPRequestImplementation object.
     * This object has method {EventSource.addEventListener} to listen for events.
     * 
     * Available events:
     * <ul>
     * <li>'start' - fired right after the request has started</li>
     * <li>'uploadstart' - start uploading data</li>
     * <li>'upload' - fired when all request data has been sent</li>
     * <li>'progress' - fired on download progress</li>
     * <li>'load' - fired when the response is ready</li>
     * <li>'error' - fired when error occured</li>
     * <li>'timeout' - fired when timeout occured.</li>
     * <li>'abort' - fired when the request has been aborted.</li>
     * </ul>
     * @example Example of usage:<br/>
     * <code>
     * var req = new HttpRequest({url:'http://www.google.com'});
     * req.addEventListener('load', function(e){ ... });
     * req.execute();
     * </code>
     * Or:
     * <code>
     * new HttpRequest({url:'http://www.google.com', 'load': function(e){ ... }})
     * .execute();
     * </code>
     * 
     * @param {Object} opts Parameter for the request
     * <ul>
     *  <li>url (String) - the request URL. The error will throw if this parameter is omnited.</li>
     *  <li>(optional) method (String) - the request method. <b>Default GET</b></li>
     *  <li>(optional) port (int) - request's port. If omnited it will be determined by protocol. <b>Default value is 80 (www)</b>.</li>
     *  <li>(optional) headers (Object) object with key-value pairs. <b>Default empty object</b>.</li>
     *  <li>(optional) body (String|Object|ArrayBuffer|File). <b>Default null</b>.</li>
     *  <li>(optional) timeout (int) - number of miliseconds for timeout. <b>Default 0 (no timeout)</b>.</li>
     *  <li>(optional) load (Function) - set load end event function</li>
     *  <li>(optional) error (Function) - set error event function</li>
     *  <li>(optional) debug (Boolean) - if true print debug messages</li>
     * </ul>
     * @returns {BaseHttpRequest}
     * @author Pawel Psztyc <jarrodek@gmail.com>
     * @constructor
     */
    function BaseHttpRequest(opts) {
        EventSource.apply(this);
        this.listeners_ = {};
        //current ready state
        this.readyState = 0;

        opts = opts || {};
        if (!opts.url) {
            throw "Required parameter URL is missing";
        }

        var defaultOptions = {
            'method': 'GET',
            'port': 80,
            'headers': {},
            'body': null,
            'timeout': 0,
            'fallowredirects': true,
            'load': null,
            'error': null,
            '_foreceport': false,
            'debug': false
        };

        var uri = new URI(opts.url);
        this.__defineGetter__('uri', function() {
            return uri;
        });

        var options = this._setupDefaults(opts, defaultOptions);
        if (options.debug) {
            this.debug = true;
            this.log('Setting up options', options);
        }

        if (typeof options['load'] === 'function') {
            this.addEventListener('load', options['load']);
        }
        if (typeof options['error'] === 'function') {
            this.addEventListener('error', options['error']);
        }
        delete options['error'];
        delete options['load'];

        for (var key in options) {
            this[key] = options[key];
        }

        //setup URL data
        this._setURLdata();

        //Request's response as a HttpResponse object.
        this.response = null;

        //socekt ID
        this.socketId;
        //Flag if socket is connected
        this.connected = false;
        //Flag is connection error
        this.error = false;
        //Carriage Return character
        this.CR = '\n';
        this.isTimeout = false;
        //Response length from Content-length header
        //or chunk size if Transfer-Encoding is chanked
        this._responseSuspectedLength = 0;
        //readed response length.
        //It should be set to 0 after new chunk of response arrives
        this._responseRead = 0;
        //Determine if the request has been aborted either because of timeout or this.abort();
        this.aborted = false;
    }
    /**
     * Static object.
     * @type type
     */
    BaseHttpRequest.protocol2port = {
        'http': 80,
        'https': 443,
        'ftp': 21
    };
    BaseHttpRequest.prototype = {
        __proto__: EventSource.prototype,
        /**
         * Child class must overrride this method to execute the request.
         * @returns {Void}
         */
        execute: function() {
            throw 'Not yet implemented';
        },
        /**
         * Child class must overrride this method to abort the request.
         * @returns {Void}
         */
        abort: function() {
            throw 'Not yet implemented';
        },
        _setURLdata: function() {

            this.host = this.uri.host();
            this.request_path = this.uri.path();
            if (this.request_path.trim() === '') {
                this.request_path = '/';
            }
            var port = this.uri.port();
            if (this._foreceport) {
                port = this.port;
            } else {
                if (!port) {
                    var protocol = this.uri.protocol();
                    if (protocol in BaseHttpRequest.protocol2port) {
                        port = BaseHttpRequest.protocol2port[protocol];
                    } else {
                        port = this.port;
                    }
                }
            }
            this.port = port;
            this.log('Setting up socket required data', this.host, this.request_path, this.port);
        },
        _setupDefaults: function(userOptions, defaults) {
            var o = {};
            for (var key in defaults) {
                if (!(key in userOptions)) {
                    o[key] = defaults[key];
                } else {
                    if (key === 'port') {
                        o['_foreceport'] = true;
                    } else {
                        o[key] = userOptions[key];
                    }
                }
            }
            return o;
        },
        log: function() {
            if (!this.debug)
                return;
            var args = Array.prototype.slice.call(arguments);
            if (args.length > 0) {
                console.log.apply(console, args);
            }
        }
    };
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
     * Implementation for BaseHttpRequest class/
     * @param {Object} opts See BaseHttpRequest.opts for more details.
     * @returns {ChromeHttpRequestImplementation}
     */
    function ChromeHttpRequestImplementation(opts) {
        BaseHttpRequest.apply(this, [opts]);
        /**
         * Message sent to server.
         * @type String
         */
        this.message = '';

        this.responseContentLength = null;
        this.responseTransferEncoding = null;


        /**
         * Determine if response headers has been already received
         * @type Boolean
         */
        this.hasHeaders = false;
        this.responseSuspectedLength = 0;
        this.responseRead = 0;
        this.payload = [];
        /**
         * When Transfer-Encoding == chunked
         * it holds an array of whole chunk.
         * After full chunk is received it should be added to this.payload array
         * @type Uint8Array
         */
        this.chunkPayload = null;


    }
    ChromeHttpRequestImplementation.prototype = {
        __proto__: BaseHttpRequest.prototype,
        /**
         * Execute the request.
         * @returns {Void}
         */
        execute: function() {
            if(this.aborted) return;
            this.log('Execute the request');
            this.dispatchEvent('start', {});

            var context = this;
            this._connect(this._makeRequest.bind(this), function(connectInfo) {
                
                //
                // Probably it's because URL doeas not exists. Or actually any other error that I'm not aware off.
                // To be checked.
                //
                
                
                context.log('Can\'t create socket. Error code: ', connectInfo);
                context.dispatchEvent('error', {
                    'code': connectInfo,
                    'message': 'Unable to connect.'
                });
            });
        },
        abort: function(){
            this.aborted = true;
            this._close();
        },
        /**
         * Make a request on opened socket.
         * @returns {Void}
         */
        _makeRequest: function() {
            if(this.aborted) return;
            if (!this.readyState === 0) {
                this.dispatchEvent('error', {
                    'code': '0',
                    'message': 'Trying to make a request on inactive socket'
                });
                throw 'Trying to make a request on inactive socket';
            }
            this._readSocketData(null);
            this._prepageMessageBody();
            this._writeMessage();
            this._setupTimeout();
        },
        _prepageMessageBody: function() {
            if(this.aborted) return;
            this.message = this.method + ' ' + this.request_path + ' HTTP/1.1' + this.CR;
            this.message += 'Host: ' + this.host + this.CR;
            if (this.headers) {
                if(typeof this.headers === 'string'){
                    this.message += this.headers;
                } else {
                    for (var key in this.headers) {
                        if (this.headers.hasOwnProperty(key) && typeof this.headers[key] !== 'object') {
                            this.message += key + ': ' + this.headers[key] + this.CR;
                        }
                    }
                }
            }
            //@TODO
            //Other than String request body
            if (this.body) {
                this.message += 'Content-Length: ' + this._lengthInUtf8Bytes(this.body) + this.CR;
                this.message += this.CR;
                this.message += this.body;
            }
            this.message += this.CR;
            this.log('Created message body: ', this.message);
        },
        /**
         * 1) Create a socket.
         * 2) Set socketId
         * 3) Connect
         * 4) Set readyState to 1 if connected
         * 5) Call callback
         * 
         * @param {Function} readyCallback Callback called when connection is ready
         * @param {Function} errorCallback Callback called when connection has not been established.
         * @returns {Void}
         */
        _connect: function(readyCallback, errorCallback) {
            if(this.aborted) return;
            var context = this;
            chrome.socket.create('tcp', {}, function(createInfo) {
                context.socketId = createInfo.socketId;
                context.log('Socket has been created.');
                chrome.socket.connect(createInfo.socketId, context.host, context.port, function(connectInfo) {
                    // if we have 0 or higher we're good
                    if (connectInfo >= 0) {
                        context.log('Connected to socked for host: ', context.host, ' and port ', context.port);
                        context.readyState = 1;
                        context.connected = true;
                        setTimeout(readyCallback, 0);
                    } else {
                        context.error = true;
                        context.readyState = 0;
                        setTimeout(errorCallback.bind(this, connectInfo), 0);
                    }
                });
            });
        },
        _cleanUpResponse: function() {
            delete this.chunkPayload;
            delete this.hasHeaders;
            delete this.responseSuspectedLength;
            delete this.responseRead;
            delete this.payload;
            delete this.message;
        },
        /**
         * Code from http://stackoverflow.com/a/5515960.
         * Calculate string size (utf8 string)
         * @param {String} str
         * @returns {Number}
         */
        _lengthInUtf8Bytes: function(str) {
            var m = encodeURIComponent(str).match(/%[89ABab]/g);
            return str.length + (m ? m.length : 0);
        },
        /**
         * Read data from opened socket.
         * 
         * @param {Object} readInfo
         * @returns {Void}
         */
        _readSocketData: function(readInfo) {
            if(this.aborted) return;
            // Any read error is considered a disconnect from the remote host.
            // Disconnect our socket in that case.
            if (readInfo)
                if (readInfo && readInfo.resultCode <= 0) {
                    this.log(performance.now(), 'Disconnected or end of message.',readInfo);
                    this._cleanUpResponse();
                    this._close();
                    //this._onResponseReady();
                    if (this.timeoutTimer) {
                        window.clearTimeout(this.timeoutTimer);
                        delete this.timeoutTimer;
                    }
                    this.dispatchEvent('error', {
                        'code': readInfo.resultCode,
                        'message': 'Unknown error occured. Disconnected or unexpected end of message.'
                    });
                    return;
                } else {
                    this.log(performance.now(), 'Read socket data with result:', readInfo.resultCode);
                }
            //Bind to socket to read next part of data.


            if (readInfo) {
                this.log(performance.now(), 'Has part of the message');
                this.dispatchEvent('progress', {});
                this._handleMessage(readInfo.data);
            }
            chrome.socket.read(this.socketId, null, this._readSocketData.bind(this));
        },
        /**
         * Handle response from socket.
         * It may not be conplete response. If Transfer-Encoding == 'chunked' then message may be split to many messages so there is no sure that this is full response body.
         * Response body starts with HTTP status, headers list and the payload.
         * This method will extract message body, status and headers and save it to proper fields. 
         * If there is no status line it means that this is another part of the response and it should append payload to proper field.
         * @param {ArrayBuffer} response
         * @returns {Void}
         */
        _handleMessage: function(response) {
            if(this.aborted) return;
            var array = new Uint8Array(response);
            if (!this.hasHeaders) {
                //1) read byte array until rnrn (it is headers part)
                //2) parse headers
                //3) if Transfer-encoding read until rn (it is chunk length)
                //4) set hasHeaders to true
                //5) set the rest of the byte array to payload array
                //6) set readCounter to byte lenght of the rest of array buffer
                try {
                    array = this._readResponseHeaders(array);
                } catch (e) {
                    this.dispatchEvent('error', {
                        'code': 0,
                        'message': e.message || e
                    });
                }
                this.hasHeaders = true;
            }

            if (this.hasHeaders && !this.responseSuspectedLength) { //0,null,undefined,false
                var tr = this.response.getResponseHeader('Transfer-Encoding');
                if (tr && tr === 'chunked') {
                    //read array until next CR. Evertything earlier is a chunk size (hex).
                    array = this._readChunkSize(array);
                } else {
                    var cs = this.response.getResponseHeader('Content-Length');
                    if(cs){
                        this.responseSuspectedLength = parseInt(cs);
                    }
                }
                if(this.responseSuspectedLength === -1){
                    this.dispatchEvent('error', {
                        'code': 0,
                        'message': 'The response is incomplete. It does not contain any information about it\'s size.'
                    });
                    return;
                }
                this.chunkPayload = new Uint8Array(this.responseSuspectedLength);
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

            if (this.responseRead === this.responseSuspectedLength) {
                this._close();
                this.response.response = this._getMessageString();
            }
        },
        _getMessageString: function() {
            if(this.aborted) return;
            var tr = this.response.getResponseHeader('Transfer-Encoding');
            if (tr && tr === 'chunked') {
                return this._getChunkedMessageString();
            }
            this.chunkPayload = this._checkCompression(this.chunkPayload);

            return this._arrayBufferToString(this.chunkPayload);
        },
        _getChunkedMessageString: function() {
            if(this.aborted) return;
            var parts = this.payload.length;
            var bufferSize = 0;
            for (var i = 0; i < parts; i++) {
                bufferSize += this.payload[i].length;
            }

            var buffer = new Uint8Array(bufferSize);
            var written = 0;
            while (this.payload.length > 0) {
                var payload = this.payload.shift();
                buffer.set(payload, written);
                written += payload.length;
            }
            if (written > 0) {
                buffer = this._checkCompression(buffer);
                return this._arrayBufferToString(buffer);
            }
            return '';
        },
        /**
         * If response content-encoding is gzip or deflate
         * it will replace this.chunkPayload Uint8Array from encoded data to decoded data.
         * @param {Uin8Array} data Data to check and decompress if needed
         * @returns {Uin8Array} converted Uint8Array
         */
        _checkCompression: function(data) {
            if(this.aborted) return;
            var ce = this.response.getResponseHeader('Content-Encoding');
            if (!ce)
                return data;
            if (ce.indexOf('gzip') !== -1) {
                var inflate = new Zlib.Gunzip(data);
                data = inflate.decompress();
            } else if (ce.indexOf('deflate') !== -1) {
                var inflate = new Zlib.Inflate(data);
                data = inflate.decompress();
            }
            return data;
        },
        /**
         * 
         * @param {Uint8Array} array
         * @returns {Void}
         */
        _readPayloadData: function(array) {
            if(this.aborted) return;
            var shouldBe = this.responseSuspectedLength - this.responseRead;
            if (shouldBe < 1) {
                return;
            }

            if (shouldBe >= array.length) {
                if (this.chunkPayload) {
                    this.chunkPayload.set(array, this.responseRead);
                }
                this.responseRead += array.length;
            } else if (shouldBe < array.length) {

                //somewhere here is end of chunk, new chunk length and another part of chunk
                if (this.chunkPayload) {
                    this.chunkPayload.set(array.subarray(0, shouldBe), this.responseRead);
                }

                array = array.subarray(shouldBe + 2);
                array = this._readChunkSize(array);
                this.responseRead = 0;
                this.payload[this.payload.length] = this.chunkPayload;
                this.chunkPayload = new Uint8Array(this.responseSuspectedLength);
                this._readPayloadData(array);
            }
        },
        /**
         * Read headers data from bytes array.
         * Read until CRCR occur (ANCII 13+10+13+10 sentence)
         * @param {Uint8Array} array
         * @returns {number} Position of the array where headers ends
         */
        _readResponseHeaders: function(array) {
            if(this.aborted) return;
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

            var status = null, statusMessage = null, statusLine = null;

            if (foundDelim) {
                var headersArray = array.subarray(0, i);
                var headers = this._arrayBufferToString(headersArray);
                var splitted = headers.split('\n');
                //first line is status
                //rest of the line are headers
                var status_line = splitted.shift();

                statusLine = status_line.replace(/HTTP\/\d(\.\d)?\s/, '');
                status = statusLine.substr(0, statusLine.indexOf(' '));
                try {
                    status = parseInt(status);
                } catch (e) {
                }
                statusMessage = statusLine.substr(statusLine.indexOf(' ') + 1);
                var _headers = [];
                for (var j = 0, len = splitted.length; j < len; j++) {
                    var _header = splitted[j];
                    var _tmp = _header.split(/:\s/);
                    var key = _tmp.shift();
                    var o = {
                        'name': key,
                        'value': (_tmp.join(': ')).trim()
                    };
                    _headers[_headers.length] = o;
                }

                this.response = new HttpResponse();
                this.response.headers = _headers;
                this.response.status = status;
                this.response.statusText = statusMessage;
                return array.subarray(i + 4);
            } else {
                throw "Something is not right with the response. There is no response status!"
            }
        },
        /**
         * If response transfer-encoding is 'chunked' read until next CR. Everything earlier is chunk size
         * @param {Uint8Array} array
         * @returns {Uint8Array} Truncated response without chybk size line
         */
        _readChunkSize: function(array) {
            if(this.aborted) return;
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
            this.responseSuspectedLength = parseInt(sizeHex, 16);
            return array.subarray(i + 2);
        },
        _writeMessage: function() {
            if(this.aborted) return;
            this.dispatchEvent('uploadstart', {});
            this.readyState = 2;
            if (!(this.message instanceof ArrayBuffer)) {
                this.message = this._stringToArrayBuffer(this.message);
            }
            var context = this;
            chrome.socket.write(this.socketId, this.message, function(writeInfo) {
                if (writeInfo.bytesWritten < 0) {
                    context.log('Error writing to socket, Error code: ' + writeInfo.bytesWritten);

                    context.dispatchEvent('error', {
                        'code': writeInfo.bytesWritten,
                        'message': 'Error writing to socket. Not all or none data has been written.'
                    });

                    return;
                }
                context.log('Written message. Bytes sent: ' + writeInfo.bytesWritten);
            });
        },
        _setupTimeout: function() {
            if(this.aborted) return;
            if (this.timeout <= 0)
                return;
            var context = this;
            this.timeoutTimer = window.setTimeout(function(e){
                context.aborted = true;
                context._close();
                context.dispatchEvent('timeout', {
                    'code': 0,
                    'message': 'Timeout exceeded.'
                });
            }, this.timeout);
        },
        _onResponseReady: function() {
            if(this.aborted) return;
            if(this.timeoutTimer){
                window.clearTimeout(this.timeoutTimer);
                delete this.timeoutTimer;
            }
            this.log(performance.now(), 'Response ready');
            this.dispatchEvent('load', {});
        },
        _close: function() {
            chrome.socket.disconnect(this.socketId);
            chrome.socket.destroy(this.socketId);
            this.readyState = 3;
        },
        /**
         * Convert ArrayBuffer to readable form
         * @param {ArrayBuffer} buff
         * @returns {String} Converted string
         */
        _arrayBufferToString: function(buff) {
            if(this.aborted) return;
            var array = new Uint8Array(buff);
            var str = '';
            for (var i = 0; i < array.length; ++i) {
                str += String.fromCharCode(array[i]);
            }
            return str;
        },
        /**
         * Convert a string to an ArrayBuffer.
         * @param {string} string The string to convert.
         * @return {ArrayBuffer} An array buffer whose bytes correspond to the string.
         * @returns {ArrayBuffer}
         */
        _stringToArrayBuffer: function(string) {
            if(this.aborted) return;
            var buffer = new ArrayBuffer(string.length);
            var bufferView = new Uint8Array(buffer);
            for (var i = 0; i < string.length; i++) {
                bufferView[i] = string.charCodeAt(i);
            }
            return buffer;
        }
    };


    /**
     * Wrapper for BaseHttpRequest.
     * 
     * This object has method {EventSource.addEventListener} to listen for events.
     * 
     * Available events:
     * <ul>
     * <li>'start' - fired right after the request has started</li>
     * <li>'uploadstart' - start uploading data</li>
     * <li>'upload' - fired when all request data has been sent</li>
     * <li>'progress' - fired on download progress</li>
     * <li>'load' - fired when the response is ready</li>
     * <li>'error' - fired when error occured</li>
     * <li>'timeout' - fired when timeout occured.</li>
     * <li>'abort' - fired when the request has been aborted.</li>
     * </ul>
     * @example Example of usage:<br/>
     * <code>
     * var req = new HttpRequest({url:'http://www.google.com'});
     * req.addEventListener('load', function(e){ ... });
     * req.execute();
     * </code>
     * Or:
     * <code>
     * new HttpRequest({url:'http://www.google.com', 'load': function(e){ ... }})
     * .execute();
     * </code>
     * 
     * @param {Object} opts Parameter for the request
     * <ul>
     *  <li>"url" (String) - the request URL. The error will throw if this parameter is omnited.</li>
     *  <li>(optional) "method" (String) - the request method. <b>Default GET</b></li>
     *  <li>(optional) "port" (int) - request's port. If omnited it will be determined by protocol. <b>Default value is 80 (www)</b>.</li>
     *  <li>(optional) "headers" (Object) object with key-value pairs. <b>Default empty object</b>.</li>
     *  <li>(optional) "body" (String|Object|ArrayBuffer|File). <b>Default null</b>.</li>
     *  <li>(optional) "timeout" (int) - number of miliseconds for timeout. <b>Default 0 (no timeout)</b>.</li>
     *  <li>(optional) "fallowredirects" (boolean) - flag to tell the request to follow redirects. <b>Default true</b>.</li>
     *  <li>(optional) "load" (Function) - set load end event function</li>
     *  <li>(optional) "error" (Function) - set error event function</li>
     * </ul>
     * @returns {HttpRequest}
     * @author Pawel Psztyc <jarrodek@gmail.com>
     * @constructor
     */
    function HttpRequest(opts) {
        this.listeners_ = {};
        if (opts && opts.load) {
            this.addEventListener('load', opts.load);
            delete opts.load;
        }
        if (opts && opts.error) {
            this.addEventListener('error', opts.error);
            delete opts.error;
        }

        var req = new ChromeHttpRequestImplementation(opts);
        this._setUpListners(req);
        this.request = req;
        this.orygopts = opts;
        this.started = false;
        this.redirect = [];

        this.aborted = false;
    }
    HttpRequest.prototype = new EventSource();
    HttpRequest.prototype.constructor = HttpRequest;

    HttpRequest.prototype._setUpListners = function(req) {
        if(this.aborted) return;
        req.addEventListener('start', this._start.bind(this));
        req.addEventListener('uploadstart', this._uploadstart.bind(this));
        req.addEventListener('upload', this._upload.bind(this));
        req.addEventListener('progress', this._progress.bind(this));
        req.addEventListener('load', this._load.bind(this));
        req.addEventListener('error', this._error.bind(this));
        req.addEventListener('timeout', this._timeout.bind(this));
    };

    HttpRequest.prototype.execute = function() {
        if(this.aborted) return;
        this.request.execute();
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
    HttpRequest.prototype._load = function() {
        if(this.aborted) return;
        var response = this.request.response;

        //check redirect
        if (response.status > 300 && response.status <= 307) {
            var location = response.getResponseHeader('Location');
            if (!location) {
                this.dispatchEvent('load', arguments);
                return;
            }
            delete response['response'];
            this.redirect[this.redirect.length] = response;
            var opt = cloneObject(this.orygopts);
            opt.url = location;
            this.request = new ChromeHttpRequestImplementation(opt);
            this._setUpListners(this.request);
            this.execute();
        } else {
            var request = {
                'fallowredirects': this.request.fallowredirects,
                'headers': this.request.headers,
                'method': this.request.method,
                'timeout': this.request.timeout,
                'url': this.request.uri.toString()
            };
            this.response = response;
            this.request = request;
            delete this.request.response;
            delete this.started;
            this.dispatchEvent('load', this);
        }
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


    this.HttpRequest = HttpRequest;
})();