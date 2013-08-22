var debug = true;

var islogGroup = false;
function log() {
    if (!debug)
        return;
    var args = Array.prototype.slice.call(arguments);
    if (args.length > 0) {
        console.log.apply(console, args);
    }
}
function logGroup() {
    var args = Array.prototype.slice.call(arguments);
    var groupName = args.shift();
    console.group(groupName);
    if (args.length > 0) {
        console.log.apply(console, args);
    }
}
function logGroupEnd() {
    console.groupEnd();
}



String.prototype.isEmpty = function() {
    return (this.trim() === "");
};



/**
 * URL field service.
 */
function UrlFieldService() {
    if (typeof window.restClientUI === 'undefined') {
        throw "RestClientUI must be initialized first.";
    }

    this._value = null;
    this.expanded = false;
    /// Set to true when any value will change during
    /// URL editor is expanded.
    /// Thanks to this the app will not calculate value
    /// every time it's change.
    this.expandedChange = false;
}

UrlFieldService.prototype = {
    get value() {
        if (this.expandedChange) {
            this._value = this.getFromDetailedUrl();
            this.expandedChange = false;
        }
        return this._value;
    },
    /**
     * @param {String} val The URL value to set
     */
    set value(val) {
        this._value = val.trim();
        if (!this.expanded) {
            var input = document.querySelector('#full-request-url');
            if (input.value !== val) {
                input.value = val;
            }
        }
        log('Current URL editor value is: ', this._value);
        //check if value is correct
        var body = $('body');
        if (this._value.isEmpty()) {
            body.trigger('formnotready');
        } else if (!/^[^\s"]*:\/\/[^\s"]+$/.test(this._value)) {
            console.log('The URL seems to be not valid. However you can try to send it.');
            body.trigger('formerror');
        } else {
            body.trigger('formready');
        }
    },
    initialize: function() {
        var panel = document.querySelector('#url-panel');
        var input = document.querySelector('#full-request-url');
        this.value = input.value;
        panel.addEventListener('click', this.onClick.bind(this), false);
        panel.addEventListener('toggleurleditor', this.onToggle.bind(this), false);
        panel.addEventListener('change', this.onInputChanage.bind(this), false);
        var opened = panel.classList.contains('expanded');
        if (opened) {
            this.expanded = true;
            var uri = this.parseUrlToDetails(this.value);
            this.setDetailsToDetailedForm(uri);
        } else {
            this.expanded = false;
        }
        this.runTypehead();
    },
    runTypehead: function() {
//        $('#full-request-url').typeahead({
//            name: 'trends',
//            prefetch: 'https://twitter.com/trends.json'
////            'source': function(query, process) {
////                var keyRange,
////                        options = {};
////                var options = {};
////                options.lower = query;
////                options.upper = query + 'z';
////                keyRange = window.restClientStore.history.makeKeyRange(options);
////                var result = [];
////                var onItem = function(item) {
////                    result[result.length] = item['url'];
////                };
////                var onEnd = function() {
////                    process(result);
////                };
////                window.restClientStore.history.iterate(onItem, {
////                    index: 'url',
////                    keyRange: keyRange,
////                    filterDuplicates: true,
////                    onEnd: onEnd
////                });
////            }
//        });
    },
    onInputChanage: function(e) {
        if (this.expanded) {
            this.expandedChange = true;
            return;
        }

        if (e.target.id === 'full-request-url') {
            logGroup('Full URL Input Chanage', 'set this.input to', e.target.value);
            this.value = e.target.value;
            log('this.input is set to:', this.value);
            logGroupEnd();
        }
    },
    /**
     * Parse an URL string to the Uri object.
     * @param {String} urlString
     * @returns {Uri}
     */
    parseUrlToDetails: function(urlString) {
        return new Uri(urlString);
    },
    getFromDetailedUrl: function() {
        var srvInput = document.querySelector('#full-request-url');
        var pathInput = document.querySelector('#url-editor-path');
        var hashInput = document.querySelector('#url-editor-hash');
        var paramsContainers = document.querySelectorAll('#query-params-container > .query-param-row');

        var uri = new Uri(srvInput.value);
        if(pathInput.value){
            uri.setPath(pathInput.value);
        }
        if(hashInput.value){
            uri.setAnchor(hashInput.value);
        }
        var params = Array.prototype.slice.call(paramsContainers);
        params.forEach(function(item) {
            var values = window.restClientUI.extractQueryParamsValues(item);
            if(values[0] === "" && values[1] === ""){
                return;
            }
            uri.addQueryParam(values[0], values[1]);
        });
        return uri.toString();
    },
    onClick: function(e) {
        if (e.target.dataset['action']) {
            switch (e.target.dataset['action']) {
                case 'encode-query-param':
                    var values = window.restClientUI.extractQueryParamsInputs(e.target.parentNode);
                    var key = encodeURIComponent(values[0].value);
                    var value = encodeURIComponent(values[1].value);
                    if (e.ctrlKey) {
                        key = key.replace(/%20/g, "+");
                        value = value.replace(/%20/g, "+");
                    }
                    values[0].value = key;
                    values[1].value = value;
                    break;
                case 'decode-query-param':
                    var values = window.restClientUI.extractQueryParamsInputs(e.target.parentNode);
                    var key = values[0].value;
                    var value = values[1].value;
                    if (e.ctrlKey) {
                        value = value.replace(/\+/g, "%20");
                        key = key.replace(/\+/g, "%20");
                    }
                    key = decodeURIComponent(key);
                    value = decodeURIComponent(value);
                    values[0].value = key;
                    values[1].value = value;
                    break;
            }
        }
    },
    onToggle: function(e) {
        var container = document.querySelector('#url-panel');
        if (!container)
            return;
        var opened = container.classList.contains('expanded');
        if (opened) {
            this.expanded = false;
            var value = this.getFromDetailedUrl();
            this.value = value;
            this.expandedChange = false;
            window.restClientUI.clearAllQueryParamsRows();
        } else {
            this.expanded = true;
            var uri = this.parseUrlToDetails(this.value);
            this.setDetailsToDetailedForm(uri);
        }
    },
    setDetailsToDetailedForm: function(uri) {
        var srvInput = document.querySelector('#full-request-url');
        var pathInput = document.querySelector('#url-editor-path');
        var hashInput = document.querySelector('#url-editor-hash');
        
        var protocol = uri.protocol();
        if(protocol && uri.uriParts.authority){
            srvInput.value = protocol + '://' + uri.uriParts.authority;
        }
        pathInput.value = uri.path();
        hashInput.value = uri.anchor();
        window.restClientUI.clearAllQueryParamsRows();
        uri.queryPairs.forEach(function(q) {
            window.restClientUI.appendUrlQueryParamRow(q[0], q[1]);
        });
    },
    //TODO: it does'n make sense thai it is here. To be moved.
    getMethod: function() {
        try {
            var method = document.querySelector('#method-panel input[type="radio"]:checked').value;
            if (method === 'OTHER') {
                method = document.querySelector('#HttpMethodOTHERValue');
            }
            return method;
        } catch (e) {
            log("can't determine HTTP method. Setting up default GET method");
        }
        return "GET";
    }
};



function HeadersInputService() {
    this._value = "";
    this.formChange = false;
    this.formOpened = false;
}
HeadersInputService.prototype = {
    constructor: HeadersInputService,
    initialize: function() {
        this.selectCurrentFormState();
        this.observeTabsChange();
        this.observeFormChange();
        this.runTypehead();
    },
    /**
     * 
     * @returns {Element} Raw HTTP Headers textarea field.
     */
    getRawInput: function() {
        return document.querySelector('#RawHttpHeaders');
    },
    set value(val) {
        this._value = val;
        if (restClientUI.headersCodeMirror !== null) {
            restClientUI.headersCodeMirror.setValue(val);
        } else {
            var input = this.getRawInput();
            if (input.value !== val) {
                input.value = val;
            }
        }
        if (this.formOpened) {
            var headers = HttpHeadersParser.fromString(val);
            if (headers !== null) {
                window.restClientUI.clearAllHttpHeadersRows();
                headers.forEach(function(header) {
                    window.restClientUI.appendHttpDataRow('header', header.key, header.value);
                });
            }
        }
        log('Current HTTP Headers value is: ', this._value);
    },
    get value() {
        if (this.formOpened) {
            if (this.formChange) {
                var _list = this.getFromHeaders();
                this._value = HttpHeadersParser.toString(_list);
                this.formChange = false;
            }
        } else if (restClientUI.headersCodeMirror !== null) {
            this._value = restClientUI.headersCodeMirror.getValue();
        } else {
            this._value = this.getRawInput().value;
        }
        return this._value;
    },
    selectCurrentFormState: function() {
        try {
            if (document.querySelector('#HttpHeadersTabNav li.active a').dataset['target'].replace('#', '') === 'HttpHeadersRaw') {
                this.formOpened = false;
            } else {
                this.formOpened = true;
            }
        } catch (e) {
        }
    },
    observeFormChange: function() {
        document.querySelector('#HttpHeadersForm').addEventListener('change', function(e) {
            if (!(e.target.classList.contains('request-header-key') || e.target.classList.contains('request-header-value'))) {
                return;
            }
            this.formChange = true;
        }.bind(this), false);
    },
    observeTabsChange: function() {
        $('#HttpHeadersPanel a[data-toggle="tab"]').on('show.bs.tab', function(e) {
            if (e.target.dataset['target'].indexOf('Raw') !== -1) {
                // opened raw form
                var values = this.getFromHeaders();
                var headers = HttpHeadersParser.toString(values);
                this.value = headers;
                this.formChange = false;
                this.formOpened = false;
                window.restClientUI.clearAllHttpHeadersRows();
            } else {
                //opened form tab
                var headers = HttpHeadersParser.fromString(this.value);
                window.restClientUI.clearAllHttpHeadersRows();
                if (headers !== null) {
                    headers.forEach(function(header) {
                        window.restClientUI.appendHttpDataRow('header', header.key, header.value);
                    });
                }
                window.restClientUI.ensureFormHasRow("header");
                this.formOpened = true;
            }
        }.bind(this));
    },
    getFromHeaders: function() {
        var paramsContainers = document.querySelectorAll('#HttpHeadersForm .request-header-param-row'),
                result = [],
                params = Array.prototype.slice.call(paramsContainers);
        params.forEach(function(item) {
            var values = window.restClientUI.extractHttpHeadersValues(item);
            result[result.length] = values;
        });
        return result;
    },
    runTypehead: function() {
        
        var observeForTypehead = function(input) {
            var currentValues = [];
            return;
            $(input).typeahead({
                'source': function(query, process) {
                    var keyRange,
                            options = {};
                    var options = {};
                    options.lower = query.toUpperCase();
                    options.upper = query + 'z';
                    keyRange = window.restClientStore.headers.makeKeyRange(options);
                    var result = [];
                    var onItem = function(item) {
                        if (item['type'] !== 'request')
                            return;
                        result[result.length] = item.label;
                        currentValues[currentValues.length] = item;
                    };
                    var onEnd = function() {
                        process(result);
                    };
                    currentValues = [];
                    window.restClientStore.headers.iterate(onItem, {
                        index: 'label',
                        keyRange: keyRange,
                        filterDuplicates: true,
                        onEnd: onEnd
                    });
                },
                highlighter: function(item) {
                    var header = null;
                    currentValues.forEach(function(it) {
                        if (it.label === item) {
                            header = it;
                        }
                    });
                    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
                    var label = item.replace(new RegExp('(' + query + ')', 'ig'), function($1, match) {
                        return '<strong>' + match + '</strong>';
                    });
                    if (header === null) {
                        return label;
                    }
                    var res = '<div class="suggestion-header"><span class="suggestion-label">';
                    res += label;
                    res += '</span><span class="suggestion-desc">' + header.desc + '</span></div>';
                    return res;
                }
            });
        };

        var observer = new MutationObserver(function(mutations, observer) {
            var mut = mutations[0];
            if (mut.type !== "childList")
                return;
            if (mut.addedNodes.length === 0)
                return;
            if (!mut.target.classList.contains('wrapper'))
                return;
            for (var i = 0, len = mut.addedNodes.length; i < len; i++) {
                var node = mut.addedNodes[i];
                if (!('classList' in node) || !node.classList.contains('request-header-param-row'))
                    continue;
                var input = node.querySelector('.request-header-key');
                if (input === null)
                    continue;
                observeForTypehead(input);
            }
        });
        var wrapper = document.querySelector('#HttpHeadersForm > .wrapper');
        observer.observe(wrapper, {
            childList: true,
            subtree: true
        });

        var input = wrapper.querySelector('.request-header-key');
        if (input === null)
            return;
        observeForTypehead(input);
    }
};





function PayloadInputService() {
    this._value = "";
    this.latestUsedContentType = null;
}
PayloadInputService.prototype = {
    constructor: PayloadInputService,
    initialize: function() {
        this.observeMathod();
    },
    /**
     * 
     * @returns {Element} Raw HTTP Headers textarea field.
     */
    getRawInput: function() {
        return document.querySelector('#RawHttpPayload');
    },
    set value(val) {
        this._value = val;
        var input = this.getRawInput();
        if(input.value !== val){
            input.value = val;
        }
        log('Current payload value is: ', this._value);
    },
    get value() {
        this._value = this.getRawInput().value;
        return this._value;
    },
    observeMathod: function() {
        $('body').on('httpmethodchange', function(e, currentMethod) {
            var getMethods = 'GET,HEAD'.split(',');
            if (getMethods.indexOf(currentMethod) !== -1) {
                //remove content type header and save it in private field
                var headersList = HttpHeadersParser.fromString(window.restClientHeadersService.value),
                        headersLength = headersList.length,
                        newHeadersArray = [],
                        i = 0;
                for (; i < headersLength; i++) {
                    var header = headersList[i];
                    if (!header.name)
                        continue;
                    if (header.name.toLowerCase().trim() === 'content-type') {
                        this.latestUsedContentType = header.value;
                    } else {
                        newHeadersArray[newHeadersArray.length] = header;
                    }
                }
                window.restClientHeadersService.value = HttpHeadersParser.toString(newHeadersArray);
            } else {
                var contentType = HttpHeadersParser.getContentType(window.restClientHeadersService.value);
                if (!contentType) {
                    var headersList = HttpHeadersParser.fromString(window.restClientHeadersService.value);
                    var v = !this.latestUsedContentType ? 'application/x-www-form-urlencoded' : this.latestUsedContentType;
                    headersList[headersList.length] = {key: 'Content-Type', value: v};
                    window.restClientHeadersService.value = HttpHeadersParser.toString(headersList);
                }
            }
        }.bind(this));
    }
};


window.restClientStore = {
    initialized: false,
    statuses: null,
    history: null,
    requests: null,
    headers: null,
    initialize: function() {
        if (window.restClientStore.initialized) {
            return;
        }
        window.restClientStore.statuses = new IDBStore({
            storeName: 'statuses',
            onStoreReady: function() {
                log('Initialized statuses storage');
            }
        });
        window.restClientStore.headers = new IDBStore({
            storeName: 'headers',
            onStoreReady: function() {
                log('Initialized headers storage');
            }
        });
        window.restClientStore.history = new IDBStore({
            storeName: 'history',
            onStoreReady: function() {
                log('Initialized history storage');
            }
        });
        window.restClientStore.requests = new IDBStore({
            storeName: 'requests',
            onStoreReady: function() {
                log('Initialized requests storage');
            }
        });
        window.restClientStore.initialized = true;
    }
};



function loadCodeMirror(callback) {
    if (typeof CodeMirror !== 'undefined') {
        callback.call(window);
        return;
    }
    var root = 'js/codemirror-3.14/';
    var scripts = ['lib/codemirror.js', 'addon/runmode/runmode.js', 'addon/hint/show-hint.js', 'addon/hint/headers-hint.js', 'addon/mode/loadmode.js', 'mode/xml/xml.js', 'mode/javascript/javascript.js', 'mode/css/css.js', 'mode/htmlmixed/htmlmixed.js', 'mode/http/http.js', 'mode/headers/headers.js'];

    var next = function() {
        var sc = scripts.shift();

        if (!sc) {
            if (typeof callback === 'function')
                callback.call(window);
            return;
        }
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.src = root + sc;
        ga.onload = function() {
            window.setTimeout(next, 1);
        };
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    };
    next();
}



var HttpHeadersParser = {
    /**
     * Parse HTTP headers input from string to array of a key:value pairs objects.
     * @param {String} string Raw HTTP headers input
     * @returns {Array} The arrao of key:value objects
     */
    fromString: function(string) {
        if (string === null || string === "") {
            return [];
        }
        var result = [],
                headers = string.split(/[\r\n]/gim);
        for (var i in headers) {
            var line = headers[i].trim();
            if (line.isEmpty())
                continue;
            var _tmp = line.split(/[:|\r\n]/gim, 2);
            if (_tmp.length > 0) {
                var obj = {
                    key: _tmp[0]
                };
                if (_tmp.length > 1) {
                    obj.value = _tmp[1].trim();
                }
                result[result.length] = obj;
            }
        }
        return result;
    },
    /**
     * Parse headers array to Raw HTTP headers string.
     * @param {Array} array lisk of objects with "key" and "value" keys.
     * @returns {String}
     */
    toString: function(array) {
        var result = "";
        for (var i = 0, len = array.length; i < len; i++) {
            var header = array[i];
            if (!result.isEmpty()) {
                result += "\n";
            }
            var key = header.key,
                    value = header.value;
            if (key && value && !(key.isEmpty() && value.isEmpty())) {
                result += key + ": " + value;
            }
        }
        return result;
    },
    /**
     * 
     * @param {String} string The headers value.
     * @returns {String|null} Content type value or null if not found.
     */
    getContentType: function(string) {
        var headersList = HttpHeadersParser.fromString(string),
                headersLength = headersList === null ? 0 : headersList.length,
                foundContentType = null,
                i = 0;
        for (; i < headersLength; i++) {
            var header = headersList[i];
            if (!header.key)
                continue;
            if (header.key.toLowerCase().trim() === 'content-type') {
                if (!header.value)
                    return;
                foundContentType = header.value;
                break;
            }
        }
        return foundContentType;
    }
};


function RestClientApp() {

}
RestClientApp.prototype = {
    constructor: RestClientApp,
    initialize: function() {
        //restore latest request;
        this.restoreLatestState();
        this.observePageUnload();
        this.observeFormActions();
    },
    restoreLatestState: function() {
        var data = {
            'latestrequest': null,
            'headers_cm': false,
            'payload_cm': false
        };
        app.localStorage.get(data, function(result) {
            if (!result)
                return;
            var restored;
            try {
                restored = JSON.parse(result.latestrequest);
            } catch (e) {
            }
            if (restored){
                if (restored.url) {
                    window.restClientUrlService.value = restored.url;
                }
                if (restored.method) {
                    $('#HttpMethod' + restored.method).click();
                }
                if (restored.headers) {
                    window.restClientHeadersService.value = restored.headers;
                }
                if (restored.payload) {
                    window.restClientPayloadService.value = restored.payload;
                }
            }
            if(result.headers_cm){
                //enable code mirror for headers RAW input
                enableCodeMirrorForHeaders();
            }
            if(result.payload_cm){
                //enable code mirror for payload RAW input
            }
            
        }.bind(this));
    },
    observePageUnload: function() {
        window.addEventListener("beforeunload", function() {
            this.saveState();
        }.bind(this), false);
    },
    saveState: function() {
        var latestrequest = {};
        latestrequest.payload = window.restClientPayloadService.value;
        latestrequest.headers = window.restClientHeadersService.value;
        latestrequest.url = window.restClientUrlService.value;
        latestrequest.method = window.restClientUrlService.getMethod();
        app.localStorage.add({'latestrequest': JSON.stringify(latestrequest)});
    },
    prepareRequestData: function() {
        var request = {
            payload: window.restClientPayloadService.value,
            headers: HttpHeadersParser.fromString(window.restClientHeadersService.value),
            url: window.restClientUrlService.value,
            method: window.restClientUrlService.getMethod()
        };
        return request;
    },
    observeFormActions: function() {
        var context = this;
        document.querySelector('#SendRequestButton').addEventListener('click', function(e) {
            e.preventDefault();
            if (this.getAttribute('disabled') !== null)
                return;
            context.startRequest();
        }, false);
    },
    startRequest: function() {
        var requestData = this.prepareRequestData();
        window.restClientWebRequest.prepareRequest(requestData, function(){
            this._runRequestObject(requestData);
        }.bind(this));
    },
    _runRequestObject: function(requestData){
        var req = new XMLHttpRequest();
        req.open(requestData.method, requestData.url, true);
        
        for(var i=0,len=requestData.headers.len;i<len;i++){
            //TODO: enclode in try...catch block
            var header = requestData.headers[i];
            req.addRequestHeader(header.key,header.value);
        }
        
        req.addEventListener('load', this._requestLoadEnd.bind(this), false);
        req.addEventListener('error', this._requestLoadProgress.bind(this), false);
        req.addEventListener('progress', this._requestLoadError.bind(this), false);
        
        try{
            if(requestData.payload){
                req.send(requestData.payload);
            } else {
                req.send();
            }
        } catch(e){
            //TODO
            console.error('Error during request initialization.', e);
            window.restClientWebRequest.getRequestData(function(data){
                console.log('HasRequestErrorData',data);
            });
        }
    },
    _requestLoadEnd: function(e){
        console.log('_requestLoadEnd', e);
        window.restClientWebRequest.getRequestData(function(data){
            console.log('HasRequestData',data);
        });
    },
    _requestLoadProgress: function(e){
        console.log('_requestLoadProgress', e);
    },
    _requestLoadError: function(e){
        console.log('_requestLoadError', e);
        window.restClientWebRequest.getRequestData(function(data){
            console.log('HasRequestErrorData',data);
        });
    }
};



window.restClientStore.initialize();
window.restClientUrlService = new UrlFieldService();
window.restClientUrlService.initialize();
window.restClientHeadersService = new HeadersInputService();
window.restClientHeadersService.initialize();
window.restClientPayloadService = new PayloadInputService();
window.restClientPayloadService.initialize();
window.restClient = new RestClientApp();
window.restClient.initialize();

(function() {
    document.querySelector('#RunCodeMirrorHeadersAction').addEventListener('click', function(e) {
        e.preventDefault();
        var headers_cm = false;
        if (this.dataset['endabled'] === 'true') {
            window.restClientUI.disbaleHeadersCodeMirror();
            this.dataset['endabled'] = 'false';
            this.innerText = 'Run code mirror editor';
        } else {
            enableCodeMirrorForHeaders();
            headers_cm = true;
        }
        app.localStorage.add({'headers_cm': headers_cm});
    }, false);
})();


function enableCodeMirrorForHeaders(){
    loadCodeMirror(function() {
        window.restClientUI.enableHeadersCodeMirror();
        var anchor = document.querySelector('#RunCodeMirrorHeadersAction');
        anchor.dataset['endabled'] = 'true';
        anchor.innerText = 'Remove code mirror editor';
    }.bind(this));
}