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
        panel.addEventListener('keydown', function(e){
            if(e.keyCode !== 13) return;
            console.log('enter presss')
            this._enterPress(e);
        }.bind(this), false);
    },
            
    _enterPress: function(e){
        
        if(this.lastEnterTime){
            var delta = performance.now()-this.lastEnterTime;
            if(delta < 1000){
                return;
            }
        }
        this.onInputChanage(e);
        this.lastEnterTime = performance.now();
        window.restClient.startRequest();
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
        if (pathInput.value) {
            uri.setPath(pathInput.value);
        }
        if (hashInput.value) {
            uri.setAnchor(hashInput.value);
        }
        var params = Array.prototype.slice.call(paramsContainers);
        params.forEach(function(item) {
            var values = window.restClientUI.extractQueryParamsValues(item);
            if (values[0] === "" && values[1] === "") {
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
                    var values = window.restClientUI.extractQueryParamsInputs(e.target.parentNode.parentNode);
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
                    var values = window.restClientUI.extractQueryParamsInputs(e.target.parentNode.parentNode);
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
        if (protocol && uri.uriParts.authority) {
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
        $(document.body).trigger('headerchange', this._value);
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
    /**
     * Returns array of headers objects ("key" and "value") from the form.
     * @returns {HeadersInputService.prototype.getFromHeaders.result|Array}
     */
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
    //Lately used content type to restore it 
    //when a user switch between HTTP payload with payload and withoit it.
    this.latestUsedContentType = null;
    //Currently selected paload method
    this.currentContentType = null;
    //set to true if payload form has changed.
    //It means that the app will change "raw" value when:
    //1) tab selection has change
    //2) access to the value occure.
    this.formChange = false;
    //True if the form panel is currently opened.
    this.formPanelOpened = false;
    //True if the files panel is currently opened.
    this.filesPanelOpened = false;
    // Set to true if user switch to payload form but current value in
    // "raw" field is not application/x-www-form-urlencoded encoded.
    this.encodingValueError = false;
    //Total number of files set in form (in all fields)
    this._filesCount = 0;
    //Number if file input fields in the form
    this.filesFieldsCount = 0;
    // Restored from local storage file names
    this.restoredFileNames = [];
}
PayloadInputService.prototype = {
    constructor: PayloadInputService,
    
    set filesCount(cnt) {
        this._filesCount = cnt;
        var display = document.querySelector('#HttpFilesCounter');
        if(display){
            display.innerText = '('+cnt+')';
        }
    },
    
    get filesCount() {
        return this._filesCount;
    },
    
    initialize: function() {
        this.observeMethod();
        this.observeFormChange();
        this.observeTabsChange();
        this.observeFileInputChange();
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
        if (input.value !== val) {
            input.value = val;
        }
        if(this.formPanelOpened === true && this.encodingValueError === false){
            window.restClientUI.clearAllPayloadRows();
            var payloadArray = HttpPayloadParser.fromString(val, true);
            if (payloadArray !== null && payloadArray.length > 0) {
                payloadArray.forEach(function(data) {
                    window.restClientUI.appendHttpDataRow('payload', data.key, data.value);
                });
            }
            window.restClientUI.ensureFormHasRow("payload");
            this.formChange = false;
        }
        log('Current payload value is: ', this._value);
        $(document.body).trigger('payloadchange', this._value);
    },
    get value() {
        if(this.formPanelOpened === true && this.encodingValueError === false){
            //get value from the form
            var payload = this.getPayloadFromForm();
            this._value = payload;
            this.getRawInput().value = payload;
            this.formChange = false;
        } else {
            this._value = this.getRawInput().value;
        }
        return this._value;
    },
    /**
     * Get files data from input fields.
     * 
     * @returns {Array}
     */
    get files(){
        var allFields = document.querySelectorAll('#HttpPayloadFiles .request-payload-file-row'),
            rows = Array.prototype.slice.call(allFields),
            result = [];
        rows.forEach(function(row){
            var fileInput = row.querySelector('.request-payload-file-field');
            var nameInput = row.querySelector('.request-payload-file-name');
            if(!fileInput || !nameInput) return;
            if(fileInput.files.length === 0 || nameInput.value.isEmpty()) return;
            result[result.length] = {
                'key': nameInput.value,
                'value': fileInput.files
            };
        });
        
        return result;
    },
    
    /**
     * @param {Array} namesArr The array of strings
     * @type Array the array od String
     */
    set filenames(namesArr) {
        if(namesArr && namesArr.length > 0){
            this.restoredFileNames = namesArr;
            this._applyFilesNames();
        }
    },
    
    getPayloadFromForm: function(){
        var values = this.getFromPayloadForm();
        return HttpPayloadParser.toString(values, true);
    },
    
    observeMethod: function() {
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
                    if (!header.key)
                        continue;
                    if (header.key.toLowerCase().trim() === 'content-type') {
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

        $(document.body).on('headerchange', function(e, value) {
            if (!value || value === "") {
                this.latestUsedContentType = this.currentContentType;
                this.currentContentType = null;
                return;
            }

            //look for content type header:
            for (var headersList = HttpHeadersParser.fromString(value), headersLength = headersList.length, i = 0; i < headersLength; i++) {
                var header = headersList[i];
                if (!header.key)
                    continue;
                if (header.key.toLowerCase().trim() === 'content-type') {
                    this.latestUsedContentType = this.currentContentType;
                    this.currentContentType = header.value;
                    break;
                }
            }
        }.bind(this));
    },
    observeFormChange: function() {
        document.querySelector('#HttpPayloadForm').addEventListener('change', function(e) {
            if (!(e.target.classList.contains('request-payload-key') || e.target.classList.contains('request-payload-value'))) {
                return;
            }
            this.formChange = true;
        }.bind(this), false);
    },
    observeTabsChange: function() {
        $('#HttpPayloadPanel a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
            if (e.target.dataset['target'].indexOf('Raw') !== -1) {
                if(this.encodingValueError){
                    this.formChange = false;
                    this.removeErrorEncodingDialog();
                    this.encodingValueError = false;
                    window.restClientUI.clearAllPayloadRows();
                    return;
                }
                if(this.formChange){
                    // opened raw form
                    var values = this.getFromPayloadForm();
                    var payload = HttpPayloadParser.toString(values, true);
                    this.value = payload;
                    this.formChange = false;
                }
                this.formPanelOpened = false;
                this.filesPanelOpened = false;
                window.restClientUI.clearAllPayloadRows();
            } else if (e.target.dataset['target'].indexOf('Form') !== -1) {
                //opened form tab
                var payloadArray = HttpPayloadParser.fromString(this.value, true);
                if(this.value && payloadArray.length === 0){
                    //it is value error
                    //not an application/x-www-form-urlencoded value
                    //should not replace RAW value if form is empty
                    this.encodingValueError = true;
                    this.createErrorEncodingDialog();
                }
                
                window.restClientUI.clearAllPayloadRows();
                if (payloadArray !== null && payloadArray.length > 0) {
                    payloadArray.forEach(function(data) {
                        window.restClientUI.appendHttpDataRow('payload', data.key, data.value);
                    });
                }
                window.restClientUI.ensureFormHasRow("payload");
                this.formPanelOpened = true;
                this.filesPanelOpened = false;
            } else if (e.target.dataset['target'].indexOf('Files') !== -1) {
                this.removeErrorEncodingDialog();
                this.encodingValueError = false;
                this.formPanelOpened = false;
                this.filesPanelOpened = true;
                this._applyFilesNames();
            }
        }.bind(this));
    },
    
    _applyFilesNames: function(){
        if(this.restoredFileNames.length > 0){
            window.restClientUI.clearAllFilesRows();
            this.restoredFileNames.forEach(function(fieldName){
                window.restClientUI.appendHttpDataRow('file', fieldName);
            });
            this.restoredFileNames = [];
            window.restClientUI.ensureFormHasRow("file");
        }
    },
    
    
    createErrorEncodingDialog: function(){
        var container = document.querySelector('#HttpPayloadPanel > .tab-content');
        var wrap = document.createElement('div');
        var message = document.createElement('span');
        var button = document.createElement('button');
        var buttonWrap = document.createElement('div');
        wrap.classList.add('errorPayloadPopup');
        message.classList.add('errorPayloadMessage');
        button.className = 'errorPayloadButton btn btn-warning';
        buttonWrap.classList.add('errorPayloadButtonWrap');
        
        message.innerText = 'It seams that current value is not x-www-form-urlencoded encoded. If you continue you will louse you current value entered to "raw" tab. Do you wish to continue?';
        button.innerText = 'Continue';
        
        buttonWrap.appendChild(button);
        wrap.appendChild(message);
        wrap.appendChild(buttonWrap);
        container.appendChild(wrap);
        
        button.addEventListener('click',function(e){
            this.removeErrorEncodingDialog();
            this.encodingValueError = false;
        }.bind(this), false);
    },
    removeErrorEncodingDialog: function(){
        var container = document.querySelector('#HttpPayloadPanel > .tab-content .errorPayloadPopup');
        if(container){
            container.parentNode.removeChild(container);
        }
    },
    
    /**
     * Returns array of payload form objects ("key" and "value") from the form.
     * It only return a value if content-type headers is set to http-urlencoded or it is not present.
     * @returns {HeadersInputService.prototype.getFromHeaders.result|Array}
     */
    getFromPayloadForm: function() {
        var paramsContainers = document.querySelectorAll('#HttpPayloadForm .request-payload-row'),
                result = [],
                params = Array.prototype.slice.call(paramsContainers);
        params.forEach(function(item) {
            var values = window.restClientUI.extractPayloadValues(item);
            result[result.length] = values;
        });
        return result;
    },
    
    observeFileInputChange: function(){
        var context = this;
        
        document.body.addEventListener('file.field.added', function(e){
            var inp = e.target.querySelectorAll('.request-payload-file-name'),
                inputs = Array.prototype.slice.call(inp);
            for(var i=0, len=inputs.length; i<len; i++){
                var input = inputs[i];
                var value = input.value;
                if(value.isEmpty()){
                    input.value = 'file_upload_'+i;
                }
            }
            context.filesFieldsCount++;
        }, false);
        
        document.body.addEventListener('file.field.removed', function(e){
            context.filesFieldsCount--;
            context.recountFilesInForm();
        }, false);
        
        document.querySelector('#HttpPayloadFiles').addEventListener('change', function(e){
            if(e.target.classList.contains('request-payload-file-field')){
                context.recountFilesInForm();
            }
        }, false);
    },
    
    recountFilesInForm: function(){
        var allFields = document.querySelectorAll('#HttpPayloadFiles .request-payload-file-field'),
            inputs = Array.prototype.slice.call(allFields),
            cnt = 0;
        inputs.forEach(function(input){
            cnt += input.files.length;
        });
        this.filesCount = cnt;
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
    this.requestStart = 0;
    this.requestEnd = 0;
    this.responseURL = null;
    this.rawResponseBody = '';
}
RestClientApp.prototype = {
    constructor: RestClientApp,
    initialize: function() {
        //restore latest request;
        this.restoreLatestState();
        this.observePageUnload();
        this.observeFormActions();
        this.observeResponsePanelActions();
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
            if (restored) {
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
                if(restored.fileFieldNames && restored.fileFieldNames.length > 0){
                    window.restClientPayloadService.filenames = restored.fileFieldNames;
                }
            }
            if (result.headers_cm) {
                //enable code mirror for headers RAW input
                enableCodeMirrorForHeaders();
            }
            if (result.payload_cm) {
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
        var files = window.restClientPayloadService.files;
        var fileFieldNames = [];
        files.forEach(function(file){
            fileFieldNames[fileFieldNames.length] = file.key;
        });
        latestrequest.fileFieldNames = fileFieldNames;
        latestrequest.headers = window.restClientHeadersService.value;
        latestrequest.url = window.restClientUrlService.value;
        latestrequest.method = window.restClientUrlService.getMethod();
        app.localStorage.add({'latestrequest': JSON.stringify(latestrequest)});
    },
    prepareRequestData: function() {
        var request = {
            payload: window.restClientPayloadService.value,
            files: window.restClientPayloadService.files,
            headers: HttpHeadersParser.fromString(window.restClientHeadersService.value),
            url: window.restClientUrlService.value,
            method: window.restClientUrlService.getMethod()
        };
        return request;
    },
    observeFormActions: function() {
        var context = this;
        
        var sendButtons = document.querySelectorAll('*[data-action="send-form-action"]');
        var buttons = Array.prototype.slice.call(sendButtons);
        buttons.forEach(function(button){
            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (this.getAttribute('disabled') !== null)
                    return;
                context.startRequest();
            }, false);
        });
        
        $('body').on('request.start', function(){
            $('.request-loader').removeClass('hidden');
        });
        $('body').on('request.end', function(){
            $('.request-loader').addClass('hidden');
        });
        
        $('#response-panel a[data-toggle="tab"]').on('show.bs.tab', function(e) {
            
            //remove all poprovers from hidden tab
            var oldTab = e.relatedTarget;
            if(oldTab.hash === '#xmlResponseTab'){
                $('#XmlHtmlPanel *[data-image]').popover('hide');
            } else if(oldTab.hash === '#jsonResponseTab'){
                $('#JsonHtmlPanel *[data-image]').popover('hide');
            }
        });
        
    },
    startRequest: function() {
        var requestData = this.prepareRequestData();
        window.restClientWebRequest.prepareRequest(requestData, function() {
            this.storeRequestHistory(requestData);
            this._runRequestObject(requestData);
        }.bind(this));
    },
    _runRequestObject: function(requestData) {
        var req = new XMLHttpRequest();
        req.open(requestData.method, requestData.url, true);

        for (var i = 0, len = requestData.headers.len; i < len; i++) {
            var header = requestData.headers[i];
            try{
                req.addRequestHeader(header.key, header.value);
            }catch(e){
                console.error('Trying to set HTTP request header prohibited by the spec.');
            }
        }

        req.addEventListener('load', this._requestLoadEnd.bind(this), false);
        req.addEventListener('progress', this._requestLoadProgress.bind(this), false);
        req.addEventListener('error', this._requestLoadError.bind(this), false);

        try {
            $('body').trigger('request.start');
            this.requestStart = performance.now();
            if (requestData.payload) {
                req.send(requestData.payload);
            } else {
                req.send();
            }
        } catch(e) {
            this.requestEnd = performance.now();
            console.error('Error during request initialization.', e);
            window.restClientWebRequest.getRequestData(function(data) {
                this._completeRequest(req, data, true);
            }.bind(this));
        }
    },
    _requestLoadEnd: function(e) {
        this.requestEnd = performance.now();
        var context = this;
        window.restClientWebRequest.getRequestData(function(data) {
           context._completeRequest(e.target, data, false);
        });
    },
    _requestLoadProgress: function(e) {
        console.log('_requestLoadProgress', e);
    },
    _requestLoadError: function(e) {
        this.requestEnd = performance.now();
        console.log('_requestLoadError');
        var context = this;
        window.restClientWebRequest.getRequestData(function(data) {
            context._completeRequest(e.target, data, true);
        });
    },
    
    _completeRequest: function(transport, collectedData, isError){
        window.restClientWebRequest.reset();
        $('body').trigger('request.end');
        console.log('_completeRequest','transport',transport,'data',collectedData,'error',isError);
        
        this.responseURL = collectedData.URL;
        window.restClientUI.resetResponseView();
        
        //STATUS PANEL
        var requestTime = Math.round(this.requestEnd - this.requestStart);
        
        var headStatusValue = document.querySelector('#headStatusValue');
        var headLoadingTime = document.querySelector('#headLoadingTime');
        
        var responseStatusValue = document.querySelector('#responseStatusValue');
        var responseStatusLoadingTime = document.querySelector('#responseStatusLoadingTime');
        
        if(transport.status === 0 || transport.status >= 500){
            window.restClientUI.setResponseStatusState("error");
        } else if(transport.status >= 400){
            window.restClientUI.setResponseStatusState("warning");
        } else {
            window.restClientUI.setResponseStatusState("ok");
        }
        
        var statusTxt = "";
        if(!!transport.status){
            statusTxt += transport.status + " ";
        } else {
            statusTxt += "error";
        }
        if(!!transport.statusText){
            statusTxt += transport.statusText;
        }
        
        responseStatusValue.innerText = statusTxt;
        headStatusValue.innerText = statusTxt;
        responseStatusLoadingTime.innerText = requestTime+' ms';
        headLoadingTime.innerText = requestTime+' ms';
        
        this.responseContentType = this._getResponseContentType(collectedData.RESPONSE_HEADERS);
        this.fillHeadersData('request',collectedData.REQUEST_HEADERS);
        this.fillHeadersData('response',collectedData.RESPONSE_HEADERS);
        this._fillRedirectsPanel(collectedData.REDIRECT_DATA);
        
        this.rawResponseBody = transport.response;
        
        //request body
        var rawResponseCode = document.querySelector('#rawResponseCode');
        
        if(!this.rawResponseBody || this.rawResponseBody.trim().isEmpty()){
            $('#rawResponseTab .parsed-options-panel:visible').hide();
            rawResponseCode.innerHTML = '<i class="response-no-data">Response does not contain any data</i>';
            return;
        } else {
            $('#rawResponseTab .parsed-options-panel:hidden').show();
        }
        
        rawResponseCode.innerText = this.rawResponseBody;
        
        //check if request is an XML request
        var xmlData = transport.responseXML;
        
        //check if json tab is required
        //it is only required if proper content-type is set and the response is not and XML document
        if(xmlData === null){
            this._isJsonHeader(this.responseContentType, function(header){
                if(header === null){
                    // no JSON
                    //check binnary data. if not show "parsed" panel with CM parser
                    
                    //but how to check binary data?
                    
                    //run code mirror
                    if(this.responseContentType && this.responseContentType.indexOf("javascript") !== -1){
                        this.responseContentType = "text/javascript";
                    }
                    document.querySelector('a[href="#parsedResponseTab"]').classList.remove('hidden');
                    $('a[href="#parsedResponseTab"]').tab('show');
                    loadCodeMirror(function(){
                        this._responseCodeMirror(transport.response, this.responseContentType);
                    }.bind(this));
                    
                } else {
                    //is JSON
                    document.querySelector('#JsonHtmlPanel').innerHTML = '';
                    document.querySelector('a[href="#jsonResponseTab"]').classList.remove('hidden');
                    $('a[href="#jsonResponseTab"]').tab('show');
                    this._setJSONtab(transport.response);
                }
            }.bind(this));
        } else {
            document.querySelector('a[href="#xmlResponseTab"]').classList.remove('hidden');
            $('a[href="#xmlResponseTab"]').tab('show');
            this._setXmlTab(xmlData);
        }
    },
    /**
     * It the response if not either JSON or XML present it in "parsed" panel.
     * It will use CodeMirror to parse data.
     * @param {String} text The response text to parse
     * @param {String} encoding The content type encoding used with CM.
     * @returns {Void}
     */
    _responseCodeMirror: function(text, encoding){
        var progressContent = document.querySelector('#progress-bar-template').content.cloneNode(true),
            panel = document.querySelector('#CMHtmlPanel'),
            cmPanel = panel.children[0];
        
        //reset panel content
        //and add loader
        
        cmPanel.innerHTML = '';
        cmPanel.classList.add('hidden');
        panel.appendChild(progressContent);
        
        var bar = panel.querySelector('.progress-bar'),
            textBar = bar.firstChild;
        
        textBar.innerText = 'loading...';
        
        bar.setAttribute('aria-valuenow', 0);
        bar.setAttribute('aria-valuemax', 0);
        bar.style.width = '100%';
        
        
        var elements = [];
        var clb = function(a,b) {
            elements.push({'string':a,'style':b});
        };
        var ready = function() {
            //worker create the view as HTML and add active links if will find any.
            var worker = new Worker(chrome.runtime.getURL('js/workers/htmlviewer.js'));
            worker.addEventListener('message', function(e) {
                cmPanel.innerHTML = e.data;
                cmPanel.classList.remove('hidden');
                panel.removeChild(bar.parentNode);
                this._initializePopovers(cmPanel);
            }.bind(this), false);
            worker.postMessage({
                'url': this.responseURL,
                'data': elements
            });
            this._addParsedHTMLcontainerControls();
        }.bind(this);
        
        try{
            //this is altered version of RunMode for CM.
            //It will not hang a browser in big amount of data and fire callback
            //when it finish.
            CodeMirror.runMode(text, encoding, clb, ready);
        } catch(e){
            console.log("Unable to initialize CodeMirror :( ", e.message);
        }
    },
    /**
     * Find a content-type header value and return it.
     * 
     * @param {Array} headers Array of objects. Each object must contain 
     *                "name" and "Value" keys.
     * @returns {String|null} content type value or NULL if not found.
     */
    _getResponseContentType: function(headers){
        var contentType = null;
        for(var i=0, len=headers.length; i<len; i++){
            var header = headers[i];
            if(!header || !header.name) continue;
            if(header.name.toLowerCase() === "content-type"){
                var val = header.value;
                if(val.indexOf(';') !== -1){
                    // in case of: Content-Type: application/json; charset=UTF-8
                    val = val.substr(0, val.indexOf(';'));
                }
                contentType = val;
                break;
            }
        }
        return contentType;
    },
    /**
     * Check if content-type header is one of predefined or added by a user JSON headers.
     * TODO: Allow user to define his own headers
     * @param {String} contentType The content-type value to check
     * @param {Function} clb Callback function with only one parameter:
     *                   String value of the header value or null if the header is not a JSON header
     * @returns {Void}
     */
    _isJsonHeader: function(contentType, clb){
        if(!contentType){
            clb.call(this, null);
            return;
        }
        app.localStorage.get('JSONHEADERS', function(result){
            if(result.JSONHEADERS && result.JSONHEADERS instanceof Array){
                var jsonHeader = null;
                if(result.JSONHEADERS.indexOf(contentType) !== -1){
                    jsonHeader = contentType;
                }
                clb.call(this,jsonHeader);
            } else {
                clb.call(this,null);
            }
        });
    },
    
    /**
     * Fill headers panel with data.
     * @param {String} type Either "request" or "response"
     * @param {Array} data Array of headers.
     * @returns {Void}
     */
    fillHeadersData: function(type, data){
        var panel, badge;
        if(type === 'request'){
            panel = document.querySelector('#requestHeadersPanel');
            badge = document.querySelector('#requestHeadersCount');
        } else if(type === 'response'){
            panel = document.querySelector('#responseHeadersPanel');
            badge = document.querySelector('#responseHeadersCount');
        } else {
            return;
        }
        panel.innerHTML = '';
        if(!data || data.length === 0){
            panel.innerHTML = '<i>There is no headers to display</i>';
            badge.innerText = '0';
        } else {
            badge.innerText = data.length;
            data.forEach(function(header){
                if(!header || !header.name) return;
                var content = document.querySelector('#http-header-display-template').content.cloneNode(true);
                content.querySelector('.header-name').innerText = header.name;
                if(header.value){
                   content.querySelector('.header-value').innerText = header.value;
                }
                panel.appendChild(content);
            });
        }
    },
    /**
     * Setup JSON tab and show parsed response.
     * @param {String} response The response
     * @returns {Void}
     */
    _setJSONtab: function(response){
        var worker = new Worker(chrome.runtime.getURL('js/workers/jsonviewer.js'));
        worker.addEventListener('message', function(e) {
            var panel = document.querySelector('#JsonHtmlPanel');
            panel.innerHTML = e.data;
            this._initializePopovers(panel);
        }.bind(this), false);
        worker.postMessage(response);
        this._addJSONcontainerControls();
    },
    /**
     * Setup XML tab and show parsed response.
     * @param {String} responseXml The response
     * @returns {Void}
     */
    _setXmlTab: function(responseXml){
        
        var progressContent = document.querySelector('#progress-bar-template').content.cloneNode(true),
            panel = document.querySelector('#XmlHtmlPanel');
            
        panel.innerHTML = '';
        panel.appendChild(progressContent);
        
        var bar = panel.querySelector('.progress-bar'),
            textBar = bar.firstChild;
        
        var xmlParser = new XMLViewer(responseXml);
        xmlParser.addProgressEvent(function(current,total){
            if(bar === null) return;
            var perc = Math.round(current/total*100);
            if(perc > 100) perc = 100;
            bar.setAttribute('aria-valuenow', current);
            bar.setAttribute('aria-valuemax', total);
            bar.style.width = perc+'%';
            textBar.innerText = perc+'% Complete';
        });
        xmlParser.getHTML(function(result){
            bar = null;
            textBar = null;
            panel.innerHTML = result;
            this._initializePopovers(panel);
        }.bind(this));
        this._addXMLcontainerControls();
    },
    /**
     * Setup XML response panel to handle "click" events to handle links.
     * It also loads popovers if any image is found. Images are contained in abbr element with data-image attribute (value is an URL to the image).
     * @returns {Void}
     */
    _addXMLcontainerControls: function(){
        if(this.XML_Controls_Added){
            return;
        }
        this.XML_Controls_Added = true;
        document.querySelector('#XmlHtmlPanel').addEventListener('click', function(e){
            if (!e.target) return;
            if(e.target.nodeName === "A"){
                if(e.ctrlKey){
                    return;
                }
                e.preventDefault();
                var url = e.target.getAttribute('href');
                window.restClientUrlService.value = url;
                return;
            }
            
            if (!e.target.getAttribute("colapse-marker"))
                    return;
            var parent = e.target.parentNode;
            var expanded = parent.dataset['expanded'];
            if (!expanded || expanded === "true") {
                parent.dataset['expanded'] = "false";
            } else {
                parent.dataset['expanded'] = "true";
            }
        });
        
        $('#XmlHtmlPanel').on('show.bs.popover', function(e) {
            var src = e.target.dataset['image'];
            if(!src) return;
            this._loadPopoverImage(src);
        }.bind(this));
        $('#XmlHtmlPanel').on('hide.bs.popover', function(e) {
            var src = e.target.dataset['image'];
            if(!src) return;
            var container = document.querySelector('[data-imgprevurl="' + src + '"]');
            if (!container)
                return;
            var blobUrl = $('a > img',container).attr('src');
            if(blobUrl){
                window.webkitURL.revokeObjectURL(blobUrl);
            }
        }.bind(this));
    },
    
    _addJSONcontainerControls: function(){
        
        if(this.JSON_Controls_Added){
            return;
        }
        this.JSON_Controls_Added = true;
        document.querySelector('#JsonHtmlPanel').addEventListener('click', function(e){
            if(!e.target) return;
            if(e.target.nodeName === "A"){
                e.preventDefault();
                var url = e.target.getAttribute('href');
                window.restClientUrlService.value = url;
                return;
            }
            var toggleId = e.target.dataset['toggle'];
            if(!toggleId) return;
            var parent = this.querySelector('div[data-element="'+toggleId+'"]');
            if(!parent) return;
            var expanded = parent.dataset['expanded'];
            if(!expanded || expanded === "true"){
                parent.dataset['expanded'] = "false";
            } else {
                parent.dataset['expanded'] = "true";
            }
        });
        
        $('#JsonHtmlPanel').on('show.bs.popover', function(e) {
            var src = e.target.dataset['image'];
            if(!src) return;
            this._loadPopoverImage(src);
        }.bind(this));
        $('#JsonHtmlPanel').on('hide.bs.popover', function(e) {
            var src = e.target.dataset['image'];
            if(!src) return;
            var container = document.querySelector('[data-imgprevurl="' + src + '"]');
            if (!container)
                return;
            var blobUrl = $('a > img',container).attr('src');
            if(blobUrl){
                window.webkitURL.revokeObjectURL(blobUrl);
            }
        }.bind(this));
    },
    
    _addParsedHTMLcontainerControls: function(){
        
        if(this.HTML_Controls_Added){
            return;
        }
        this.HTML_Controls_Added = true;
        document.querySelector('#CMHtmlPanel').addEventListener('click', function(e){
            if(!e.target) return;
            if(e.target.nodeName === "A"){
                e.preventDefault();
                var url = e.target.getAttribute('href');
                window.restClientUrlService.value = url;
                return;
            }
        });
        
        $('#CMHtmlPanel').on('show.bs.popover', function(e) {
            var src = e.target.dataset['image'];
            if(!src) return;
            this._loadPopoverImage(src);
        }.bind(this));
        $('#CMHtmlPanel').on('hide.bs.popover', function(e) {
            var src = e.target.dataset['image'];
            if(!src) return;
            var container = document.querySelector('[data-imgprevurl="' + src + '"]');
            if (!container)
                return;
            var blobUrl = $('a > img',container).attr('src');
            if(blobUrl){
                window.webkitURL.revokeObjectURL(blobUrl);
            }
        }.bind(this));
    },
    
    _initializePopovers: function(panel){
        var popovers = $('*[data-image]', panel);
        popovers.each(function(i, abbr) {
            var content = '<div data-imgprevurl="' + abbr.dataset['image'] + '" class="popover-image-prev">';
            content += '<img src="img/mini-loader.gif" alt="loading" title="loading"/><br/><i>loading</i>';
            content += '</div>';
            $(abbr).attr({
                'data-html': true,
                'data-placement': 'auto top',
                'data-trigger': 'hover',
                "data-content": content,
                'data-container': 'body',
                'data-animation': false
            });
        });
        popovers.popover();
    },
            
    _loadPopoverImage: function(src){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
            var container = document.querySelector('[data-imgprevurl="' + src + '"]');
            if (!container)
                return;
            var a = document.createElement('a');
            a.setAttribute('href',src);
            a.setAttribute('target','_blank');
            a.className = 'thumbnail';
            var img = document.createElement('img');
            img.src = window.webkitURL.createObjectURL(this.response);
            container.innerHTML = '';
            a.appendChild(img);
            container.appendChild(a);
        };
        xhr.send();
    },
    /**
     * Fill redirects panel with data returned from webRequest.
     * @param {Array} redirects
     * @returns {Void}
     */
    _fillRedirectsPanel: function(redirects){
        var len = redirects.length;
        if(len === 0){
            document.querySelector('#redirectsPanel').classList.add('hidden');
            return;
        } else {
            document.querySelector('#redirectsPanel').classList.remove('hidden');
        }
        var panel = document.querySelector('#redirectsPanelBody');
        panel.innerHTML = '';
        
        document.querySelector('#redirectsCount').innerText = len;
        for(var i=0; i<len; i++){
            var content = document.querySelector('#redirect-item-template').content.cloneNode(true);
            var status = content.querySelector('.redirect-status'),
                location = content.querySelector('.redirectTarget'),
                headersPanel = content.querySelector('.redirectHeaders'),
                redirect = redirects[i];
            status.innerText = redirect.statusLine;
            location.href = location.innerText = redirect.redirectUrl;
            
            redirect.responseHeaders.forEach(function(header){
                if(!header || !header.name) return;
                var content = document.querySelector('#http-header-display-template').content.cloneNode(true);
                content.querySelector('.header-name').innerText = header.name;
                if(header.value){
                   content.querySelector('.header-value').innerText = header.value;
                }
                headersPanel.appendChild(content);
            });
            
            if(redirect.fromCache){
                content.querySelector('.cacheInfo').classList.remove('hidden');
            }
            
            panel.appendChild(content);
        }
                /*fromCache: true
            redirectUrl: "http://www.wp.pl/"
            responseHeaders: Array[4]
            0: Object
            1: Object
            2: Object
            3: Object
            length: 4
            __proto__: Array[0]
            statusCode: 301
            statusLine: "HTTP/1.1 301 Moved Permanently"*/
    },
    
    storeRequestHistory: function(requestData){
        
        //check if the same request already exists
        var keyRange,
        options = {};
        var options = {};
        options.lower = requestData.url;
        options.upper = requestData.url;
        keyRange = window.restClientStore.history.makeKeyRange(options);
        var result = [];
        var onItem = function(item) {
            result[result.length] = item;
        };
        var insert = function(data){
            var fileFieldNames = [];
            data.files.forEach(function(file){
                fileFieldNames[fileFieldNames.length] = file.key;
            });
            
            var saveData = {
                'url': data.url,
                'time': Date.now(),
                'hit': 1,
                'payload': data.payload,
                'files': fileFieldNames,
                'headers': data.headers,
                'method': data.method
            };
            window.restClientStore.history.put(saveData);
        };
        var onEnd = function() {
            if(result.length === 0){
                insert(requestData);
                return;
            }
            
            var ins = false;
            var updateItem = null;
            for(var i=0, len = result.length; i<len; i++){
                var item = result[i];
                if(item.url !== requestData.url){
                    continue;
                }
                
                if(item.payload !== requestData.payload){
                    ins = true;
                    break;
                }
                if(item.method !== requestData.method){
                    ins = true;
                    break;
                }
                if(requestData.files.length !== item.files.length){
                    ins = true;
                } else {
                    //check files names array
                    requestData.files.forEach(function(fileData){
                        if(item.files.indexOf(fileData.key) === -1){
                            ins = true;
                        }
                    });
                }
                
                var headers = requestData.headers;
                var checkHeaders = item.headers;
                if(headers.length !== checkHeaders.length){
                    ins = true;
                } else {
                    for(var i=0, len=headers.length; i<len; i++){
                        var headerData = headers[i];
                        var key = headerData.key;
                        var found = false;
                        for(var j=0, jLen=checkHeaders.length; j<jLen; j++){
                            if(checkHeaders[j].key === key){
                                found = true;
                                break;
                            }
                        }
                        if(!found){
                            ins = true;
                            break;
                        }
                    }
                }
                if(ins){
                    break;
                } else {
                    updateItem = item;
                    break;
                }
            }
            if(ins){
                insert(requestData);
            } else if(updateItem){
                updateItem.hit++;
                updateItem.time = Date.now();
                window.restClientStore.history.put(updateItem);
            }
        };
        window.restClientStore.history.iterate(onItem, {
            index: 'url',
            keyRange: keyRange,
            filterDuplicates: true,
            onEnd: onEnd,
            autoContinue: true
        });
    },
    
    observeResponsePanelActions: function(){
        if(this.responsePanelOberved){
            return;
        }
        this.responsePanelOberved = true;
        
        document.querySelector('#responsePanel').addEventListener('click', function(e){
            var action = e.target.dataset['action'];
            if(!action) return;
            
            switch(action){
                case 'save-as-file':
                    var button = e.target;
                    var download = button.getAttribute("download");
                    if(download){
                        
                    } else {
                        e.preventDefault();
                        
                    }
                    break;
                case 'force-json-tab':
                    
                    break;
                case 'copy-to-clipboard':
                    copyText(this.rawResponseBody);
                    break;
                case 'response-in-new-tab':
                    var wnd = window.open();
                    wnd.document.body.innerHTML = this.rawResponseBody;
                    break;
                default: return;
            }
            
            
        }.bind(this),false);
        document.querySelector('#response-panel').addEventListener('click', function(e){
            var action = e.target.dataset['action'];
            if(!action){
                return;
            }
            switch(action){
                case 'hide-request-headers': 
                case 'hide-response-headers':
                    if(e.target.dataset['state'] === 'closed'){
                        window.restClientUI.setResponseHeadersPanelState(action === 'hide-response-headers' ? 'response' : 'request','opened');
                    } else {
                        window.restClientUI.setResponseHeadersPanelState(action === 'hide-response-headers' ? 'response' : 'request','closed');
                    }
                    break;
                default: return;
            }
        }.bind(this),false);
    }
};

console.group('Rest Client for Google Chrome');
console.log('Welcome to the Rest Client for Google Chrome debug console.');
console.error('If you see any error message like this, send an issue report at https://github.com/jarrodek/advanced-rest-client/issues. It will help me to make this application even better for you :)');
console.groupEnd();
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


function enableCodeMirrorForHeaders() {
    loadCodeMirror(function() {
        window.restClientUI.enableHeadersCodeMirror();
        var anchor = document.querySelector('#RunCodeMirrorHeadersAction');
        anchor.dataset['endabled'] = 'true';
        anchor.innerText = 'Remove code mirror editor';
    }.bind(this));
}


/*
 * List of app's events:
 * jQuery events (handle with $(element).on();)
 * 
 * - headerchange - fired when headers value change
 * - httpmethodchange - HTTP method has changed
 * - payloadchange - HTTP payload change.
 * - request.start - fired when the request is about to start
 * - request.end - firet after current request ends.
 * 
 * HTML events (handle with addEventListener):
 * - toggleurleditor - when URL editor has been toggled.
 * - header.field.added - fired when header's form row has been added to UI.
 * - payload.field.added - fired when payload's form row has been added to UI.
 * - file.field.added - fired when file's form row has been added to UI.
 * 
 * - payload.field.removed - fired when payloads's form row has been removed from UI.
 * - file.field.removed - fired when file's form row has been removed from UI.
 */
