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
        this.connectionInfo = {};
    }
    /**
     * Create a new connection.
     * This method will open a new socket 
     * @param {Object} options
     * @returns {$q@call;defer.promise}
     */
    ChromeTcpConnection.prototype.createConnection = function(options){
        var defered = $q.defer();
        
        
        
        
        return defered.promise;
    };
    ChromeTcpConnection.prototype._createProperties = function(options){
        
        var defaultOptions = {
            'headers': {},
            'body': null,
            'timeout': 0,
            'fallowredirects': true,
            'load': null,
            'error': null,
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
    
    var instance = new ChromeTcpConnection();
    
    var service = {
        'create': instance.createConnection
    };
    return service;
}]);