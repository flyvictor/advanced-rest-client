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
        ga.src = chrome.runtime.getURL(root + sc);
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
    this.router = null;
}
RestClientApp.prototype = {
    constructor: RestClientApp,
    initialize: function() {
        //initialize routers
        this.observePageChange();
        window.restClientController.initilize();
        this.initializeRouter();
    },
    
    observePageChange: function(){
        document.querySelector('body').addEventListener("pagechangeevent", function(e) {
            if(!e.detail) return;
            var page = e.detail.page, action = null, params = null;
            if(!page) return;
            switch(page){
                case 'history': 
                    action = 'defaut';
                    break;
                case 'request': 
                    action = 'defaut';
                    break;
                default: return;
            }
            window.restClientController.runAction(page, action, params);
        }, false);
    },
    
    initializeRouter: function(){
        this.router = new AppRouter();
        this.router.initialize();
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
window.restClientRequestsStorage = new RequestsStorage(window.restClientStore);

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
 * 
 * - pagechangeevent - when "page" change requested (from router).
 */
