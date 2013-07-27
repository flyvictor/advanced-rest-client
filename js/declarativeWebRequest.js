if (typeof chrome.declarativeWebRequest == 'undefined') {
    chrome.declarativeWebRequest = {
        onRequest: {
            removeRules: function() {
            },
            addRules: function() {
            }
        }
    };
    chrome.declarativeWebRequest.RequestMatcher = function() {}
    chrome.declarativeWebRequest.RequestMatcher.prototype = {};
    chrome.declarativeWebRequest.RemoveRequestHeader = function() {}
    chrome.declarativeWebRequest.RemoveRequestHeader.prototype = {};
    chrome.declarativeWebRequest.SetRequestHeader = function() {}
    chrome.declarativeWebRequest.SetRequestHeader.prototype = {};
}


function WebRequest() {
    this.masterURL = null;
    this.redirectURL = null;
    this.responseHeaders = [];
    this.requestHeaders = [];
    this.redirectData = [];
    // The request ID is unique for the request lifecycle
    // First callback should set this value and further
    // calback just check if request ID match.
    // On complete set this value to null;
    this.requestId = null;

    this.requestFilter = {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    }
    this.notSupportedW3CHeaders = null;
    this.browserDefaultHeaders = null;
    chrome.storage.local.get(['notSupportedW3CHeaders', 'browserDefaultHeaders'], function(data) {
        if (data.notSupportedW3CHeaders)
            this.notSupportedW3CHeaders = data.notSupportedW3CHeaders.split(",");
        if (data.browserDefaultHeaders)
            this.browserDefaultHeaders = data.browserDefaultHeaders.split(",");
    }.bind(this));
}
WebRequest.prototype = {
    constructor: WebRequest,
    /**
     * Setup application, set rules, handlers etc.
     * @returns {Void}
     */
    init: function() {
        /*
         * Register Web Requests listeners to handle sent/received headers info in
         * proper way (get all info) See more at <a
         * href="http://developer.chrome.com/extensions/webRequest.html">http://developer.chrome.com/extensions/webRequest.html</a>
         */
        chrome.webRequest.onBeforeRequest.addListener(this.onBeforeRequest.bind(this), this.requestFilter, []);
        chrome.webRequest.onSendHeaders.addListener(this.onHeadersSend.bind(this), this.requestFilter, ['requestHeaders']);
        chrome.webRequest.onBeforeRedirect.addListener(this.onBeforeRedirect.bind(this), this.requestFilter, ['responseHeaders']);
        chrome.webRequest.onCompleted.addListener(this.onRequestCompleted.bind(this), this.requestFilter, ['responseHeaders']);
        chrome.webRequest.onErrorOccurred.addListener(this.onRequestError.bind(this), this.requestFilter);
    },
    reset: function() {
        this.masterURL = null;
        this.redirectURL = null;
        this.responseHeaders = [];
        this.requestHeaders = [];
        this.redirectData = [];
        this.errorData = {}
        this.clearRules();
    },
    getRequestData: function() {
        var requestDetails = {
            URL: this.masterURL,
            RESPONSE_HEADERS: this.responseHeaders,
            REQUEST_HEADERS: this.requestHeaders,
            REDIRECT_DATA: this.redirectData,
            ERROR: this.errorData
        };
        return requestDetails;
    },
    /**
     * Check if request url match tested URL
     * @param {Object} details The tested URL details object 
     * @returns {Boolean}
     */
    checkRequestUrl: function(details) {
        if (details.url == null || details.url.length == 0) {
            return false;
        }
        var currentCheckUrl = this.masterURL;
        if (this.redirectURL != null) {
            currentCheckUrl = this.redirectURL;
        }
        if (currentCheckUrl == null || currentCheckUrl.length == 0) {
            return false;
        }
        if (!(currentCheckUrl == details.url || details.url.indexOf(currentCheckUrl) > -1)) {
            return false;
        }
        return true;
    },
    onBeforeRequest: function(details){
        console.log('onBeforeRequest',details);
        if (!this.checkRequestUrl(details)) {
            return;
        }
        this.requestId = details.requestId;
    },
    /**
     * Called when request headers has been sent. It filter requests by current
     * set URL. After request filter URL is cleared.
     * @param {Object} details URL details
     * @returns {Void}
     */
    onHeadersSend: function(details) {
        console.log('onHeadersSend',details);
        if(this.requestId !== details.requestId){
            return;
        }
//        if (!this.checkRequestUrl(details)) {
//            return;
//        }
        this.requestHeaders = details.requestHeaders;
    },
    /**
     * Called when the request will be redirected.
     * It is async call. Unable to update declarativeWebRequest filters here.
     * 
     * @param {Object} details URL details
     * @returns {Void}
     */
    onBeforeRedirect: function(details) {
        console.log('onBeforeRedirect',details);
        if(this.requestId !== details.requestId){
            return;
        }
//        if (!this.checkRequestUrl(details)) {
//            return;
//        }

        var data = {
            fromCache: details.fromCache,
            redirectUrl: details.redirectUrl,
            statusCode: details.statusCode,
            statusLine: details.statusLine,
            responseHeaders: details.responseHeaders
        }
        //hold redirect data
        this.redirectData[this.redirectData.length] = data;
        //replace master URL with redirect URL so the request can 
        //be found later
        this.redirectURL = details.redirectUrl;
    },
    /**
     * Called when the request complete.
     * @param {Object} details URL details
     * @returns {Void}
     */
    onRequestCompleted: function(details) {
        console.log('onRequestCompleted',details);
        if(this.requestId !== details.requestId){
            return;
        }
//        if (!this.checkRequestUrl(details)) {
//            return;
//        }
        

        this.responseHeaders = details.responseHeaders;
        //
        // Clean rules or if the user will not call another request all XmlHttpRequest for this URL will be affected. 
        this.clearRules();
        this.requestId = null;
    },
    /**
     * Called when the request complete with error.
     * @param {Object} details URL details
     * @returns {Void}
     */
    onRequestError: function(details) {
        console.log(details);
        if (!this.checkRequestUrl(details)) {
            return;
        }
        //
        // Clean rules or if the user will not call another request all XmlHttpRequest for this URL will be affected. 
        this.clearRules();
        this.requestId = null;
        this.errorData = {
            error: details.error,
            fromCache: details.fromCache,
            timeStamp: details.timeStamp,
            url: details.url
        }
    },
    /**
     * Clear all rules set earlier to the declarativeWebRequest.
     */
    clearRules: function() {
        chrome.declarativeWebRequest.onRequest.removeRules();
    },
    /**
     * By default remove following headers from request (if they are not set by user):
     * accept,accept-charset,accept-encoding,accept-language,connection,host,if-modified-since,if-none-match,origin,referer,user-agent
     * This headers are set by default by browser and should not be included into request.
     * @param {Object} requestData
     * @returns {Void}
     */
    setRules: function(requestData, clb) {
        this.clearRules();
        var i = 0;
        // extract request headers
        var requestHeaders = requestData.headers;
        var requestHeadersLength = requestHeaders.length;
        // check if request contains unsupported by w3c headers
        var unsupportedHeadersList = [];
        for (i in requestHeaders) {
            var header = requestHeaders[i];
            if (this.notSupportedW3CHeaders.indexOf(header.name.toLowerCase()) != -1) {
                // has unsupported header
                unsupportedHeadersList[unsupportedHeadersList.length] = header;
            }
        }

        var requestActions = [];
        // register rules in declarativeRequest to add headers just before
        // request send.
        var addActions = this.getUnsupportedHeadersActions(unsupportedHeadersList);
        if (addActions != null) {
            requestActions = requestActions.concat(addActions);
        }

        //
        // Here's a trick.
        // By default browsers set some request headers. We don't want them.
        // Remove all request headers set by browser by default and that are not set by user
        // (can't remove and set headers in one request by this API)
        //

        var requestHeadersKeys = [];
        for (i = 0; i < requestHeadersLength; i++) {
            requestHeadersKeys[requestHeadersKeys.length] = requestHeaders[i].name.toLowerCase();
        }

        var removeHeaders = this.browserDefaultHeaders.filter(function(element, index, array) {
            if (requestHeadersKeys.indexOf(element) != -1)
                return false;
            return true
        });

        var removeActions = this.getRemoveHeadersActions(removeHeaders);
        if (removeActions != null) {
            requestActions = requestActions.concat(removeActions);
        }

        if (requestActions.length == 0) {
            return;
        }

        var rule = {
            id: null,
            priority: 100,
            conditions: [new chrome.declarativeWebRequest.RequestMatcher(   {
                    url: this.getUrlData(requestData.url),
                    resourceType: ["xmlhttprequest"]
                })],
            actions: requestActions
        };

        chrome.declarativeWebRequest.onRequest.addRules([rule], function(details) {
            if(clb !== null){
                clb.call(window);
            }
        });
    },
    /**
     * Create URL object from request url for Rule object.
     * @param {String} requestUrl
     * @returns {Object}
     */
    getUrlData: function(requestUrl) {
        var parser = document.createElement('a');
        parser.href = requestUrl;

        var urlData = {};
        if (parser.hostname) {
            urlData.hostEquals = parser.hostname;
        }
        if (parser.protocol) {
            urlData.schemes = [parser.protocol.replace(':', '')];
        }
        if (parser.port) {
            urlData.ports = [parseInt(parser.port)];
        }
        if (parser.pathname) {
            urlData.pathEquals = parser.pathname;
        }
        if (parser.search) {
            urlData.queryEquals = parser.search;
        }
        return urlData;
    },
    /**
     * Create filter actions to remove selected headers from request.
     * @param {Array} removeHeaders Headers to remove
     */
    getRemoveHeadersActions: function(removeHeaders) {
        var removeHeadersLength = removeHeaders.length;
        if (removeHeadersLength == 0)
            return null;
        // create actions
        var actions = [];
        for (var i = 0; i < removeHeadersLength; i++) {
            var header = removeHeaders[i];
            actions[actions.length] = new chrome.declarativeWebRequest.RemoveRequestHeader({
                name: header
            });
        }
        return actions;
    },
    /**
     * Set headers that cen't be set via XMLHttpRequest
     * @param {Array} unsupportedHeadersList
     * @returns {WebRequest.prototype.getUnsupportedHeadersActions.actions|Array}
     */
    getUnsupportedHeadersActions: function(unsupportedHeadersList) {
        if (unsupportedHeadersList.length == 0)
            return null;
        // create actions
        var actions = [];
        for (var i = 0; i < unsupportedHeadersList.length; i++) {
            var header = unsupportedHeadersList[i];
            actions[actions.length] = new chrome.declarativeWebRequest.SetRequestHeader(header);
        }
        return actions;
    },
            
    /**
     * Initialize request data and set rules.
     * @param {Object} data
     * @returns {void}
     */
    prepareRequest: function(data, callback){
        this.reset();
        this.masterURL = data.url;
        this.setRules(data, callback);
    }
}




window.restClientWebRequest = new WebRequest();
window.restClientWebRequest.init();