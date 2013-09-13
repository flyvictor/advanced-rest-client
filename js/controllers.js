
function AppController() {
    this.initialized = false;
}
AppController.prototype = {
    constructor: AppController,
    initialize: function() {
        this.initialized = true;
    },
    show: function(action, params) {
    },
    onBeforeShow: function() {
    },
    onShow: function() {
    },
    onHide: function() {
    }
};

function RequestController() {}
RequestController.prototype = Object.create(AppController.prototype);
Object.defineProperty(RequestController.prototype, "historyId", {
    get: function() {
        return this._historyId;
    },
    set: function(id) {
        this._historyId = id;
        if (this.currentResponse !== null) {
            window.restClientRequestsStorage.saveHistoryResponse(id, this.currentResponse);
        }
    }
});
RequestController.prototype.initialize = function() {
    this.reset();
    this.observeFormActions();
    this.observeResponsePanelActions();
    this.observePageUnload();
    this.restoreLatestState();
};
RequestController.prototype.reset = function() {
    this.requestStart = 0;
    this.requestEnd = 0;
    /**
     * Requested by the user URL.
     */
    this.requestURL = null;
    /**
     * Final response URL.
     * Note: it may be different than this.requestURL in case of redirect.
     */
    this.responseURL = null;
    this.currentResponse = null;
    this._historyId = null;
};
RequestController.prototype.show = function(action, params) {
    
    switch(action){
        case 'default':
            
        break;
        default: return;
    }
    
    console.log('show request controller', action, params);
};
RequestController.prototype.onBeforeShow = function() {
    window.restClientUI.showPage('request');
};
RequestController.prototype.observeFormActions = function() {
    var context = this;
    var sendButtons = document.querySelectorAll('*[data-action="send-form-action"]');
    var buttons = Array.prototype.slice.call(sendButtons);
    buttons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.getAttribute('disabled') !== null)
                return;
            context.startRequest();
        }, false);
    });

    $('body').on('request.start', function() {
        $('.request-loader').removeClass('hidden');
    });
    $('body').on('request.end', function() {
        $('.request-loader').addClass('hidden');
    });
    $('#response-panel a[data-toggle="tab"]').on('show.bs.tab', function(e) {
        //remove all poprovers from hidden tab
        var oldTab = e.relatedTarget;
        if (oldTab.hash === '#xmlResponseTab') {
            $('#XmlHtmlPanel *[data-image]').popover('hide');
        } else if (oldTab.hash === '#jsonResponseTab') {
            $('#JsonHtmlPanel *[data-image]').popover('hide');
        }
    });
};
RequestController.prototype.restoreLatestState = function() {
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
            if (restored.fileFieldNames && restored.fileFieldNames.length > 0) {
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
};
RequestController.prototype.observePageUnload = function() {
    window.addEventListener("beforeunload", function() {
        this.saveState();
    }.bind(this), false);
};
RequestController.prototype.saveState = function() {
    var latestrequest = {};
    latestrequest.payload = window.restClientPayloadService.value;
    var files = window.restClientPayloadService.files;
    var fileFieldNames = [];
    files.forEach(function(file) {
        fileFieldNames[fileFieldNames.length] = file.key;
    });
    latestrequest.fileFieldNames = fileFieldNames;
    latestrequest.headers = window.restClientHeadersService.value;
    latestrequest.url = window.restClientUrlService.value;
    latestrequest.method = window.restClientUrlService.getMethod();
    app.localStorage.add({'latestrequest': JSON.stringify(latestrequest)});
};
RequestController.prototype.prepareRequestData = function() {
    var request = {
        payload: window.restClientPayloadService.value,
        files: window.restClientPayloadService.files,
        headers: HttpHeadersParser.fromString(window.restClientHeadersService.value),
        url: window.restClientUrlService.value,
        method: window.restClientUrlService.getMethod()
    };
    return request;
};

RequestController.prototype.startRequest = function() {
    //show "request" page
    window.restClient.router.router.navigate('/index.html?request');
    logGroup('HTTP Request logs');
    this.reset();
    var requestData = this.prepareRequestData();
    window.restClientWebRequest.prepareRequest(requestData, function() {
        window.restClientRequestsStorage.saveHistory(requestData, function(saveId) {
            this.historyId = saveId;
        }.bind(this));
        this.requestURL = requestData.url;
        this._runRequestObject(requestData);
    }.bind(this));
};
RequestController.prototype._runRequestObject = function(requestData) {
    var req = new XMLHttpRequest();
    req.open(requestData.method, requestData.url, true);

    for (var i = 0, len = requestData.headers.len; i < len; i++) {
        var header = requestData.headers[i];
        try {
            req.addRequestHeader(header.key, header.value);
        } catch (e) {
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
    } catch (e) {
        this.requestEnd = performance.now();
        console.error('Error during request initialization.', e);
        window.restClientWebRequest.getRequestData(function(data) {
            this._completeRequest(req, data, true);
        }.bind(this));
    }
};
RequestController.prototype._requestLoadEnd = function(e) {
    this.requestEnd = performance.now();
    var context = this;
    window.restClientWebRequest.getRequestData(function(data) {
        context._completeRequest(e.target, data, false);
    });
};
RequestController.prototype._requestLoadProgress = function(e) {
    console.log('_requestLoadProgress', e);
};
RequestController.prototype._requestLoadError = function(e) {
    this.requestEnd = performance.now();
    var context = this;
    window.restClientWebRequest.getRequestData(function(data) {
        context._completeRequest(e.target, data, true);
    });
};
RequestController.prototype._completeRequest = function(transport, collectedData, isError) {
    window.restClientWebRequest.reset();
    $('body').trigger('request.end');
    console.log('_completeRequest', 'transport', transport, 'data', collectedData, 'error', isError);
    logGroupEnd();

    this.responseURL = collectedData.FINAL_URL;
    window.restClientUI.resetResponseView();

    this.currentResponse = collectedData;
    this.currentResponse.response = transport.response;
    this.currentResponse.status = transport.status;
    this.currentResponse.statusText = transport.statusText;

    if (this._historyId !== null) {
        window.restClientRequestsStorage.saveHistoryResponse(this._historyId, this.currentResponse);
    }


    //STATUS PANEL
    var requestTime = Math.round(this.requestEnd - this.requestStart);

    var headStatusValue = document.querySelector('#headStatusValue');
    var headLoadingTime = document.querySelector('#headLoadingTime');

    var responseStatusValue = document.querySelector('#responseStatusValue');
    var responseStatusLoadingTime = document.querySelector('#responseStatusLoadingTime');

    if (transport.status === 0 || transport.status >= 500) {
        window.restClientUI.setResponseStatusState("error");
    } else if (transport.status >= 400) {
        window.restClientUI.setResponseStatusState("warning");
    } else {
        window.restClientUI.setResponseStatusState("ok");
    }

    var statusTxt = "";
    if (!!transport.status) {
        statusTxt += transport.status + " ";
    } else {
        statusTxt += "error";
    }
    if (!!transport.statusText) {
        statusTxt += transport.statusText;
    }

    responseStatusValue.innerText = statusTxt;
    headStatusValue.innerText = statusTxt;
    responseStatusLoadingTime.innerText = requestTime + ' ms';
    headLoadingTime.innerText = requestTime + ' ms';

    this.responseContentType = this._getResponseContentType(collectedData.RESPONSE_HEADERS);
    this.fillHeadersData('request', collectedData.REQUEST_HEADERS);
    this.fillHeadersData('response', collectedData.RESPONSE_HEADERS);
    this._fillRedirectsPanel(collectedData.REDIRECT_DATA);

    //request body
    var rawResponseCode = document.querySelector('#rawResponseCode');

    if (!this.currentResponse.response || this.currentResponse.response.trim().isEmpty()) {
        $('#rawResponseTab .parsed-options-panel:visible').hide();
        rawResponseCode.innerHTML = '<i class="response-no-data">Response does not contain any data</i>';
        return;
    } else {
        $('#rawResponseTab .parsed-options-panel:hidden').show();
    }

    rawResponseCode.innerText = this.currentResponse.response;

    //check if request is an XML request
    var xmlData = transport.responseXML;

    //check if json tab is required
    //it is only required if proper content-type is set and the response is not and XML document
    if (xmlData === null) {
        this._isJsonHeader(this.responseContentType, function(header) {
            if (header === null) {
                // no JSON
                //check binnary data. if not show "parsed" panel with CM parser

                //but how to check binary data?

                //run code mirror
                if (this.responseContentType && this.responseContentType.indexOf("javascript") !== -1) {
                    this.responseContentType = "text/javascript";
                }
                document.querySelector('a[href="#parsedResponseTab"]').classList.remove('hidden');
                $('a[href="#parsedResponseTab"]').tab('show');
                loadCodeMirror(function() {
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
};
/**
* It the response if not either JSON or XML present it in "parsed" panel.
* It will use CodeMirror to parse data.
* @param {String} text The response text to parse
* @param {String} encoding The content type encoding used with CM.
* @returns {Void}
*/
RequestController.prototype._responseCodeMirror = function(text, encoding) {
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
    var clb = function(a, b) {
        elements.push({'string': a, 'style': b});
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

    try {
        //this is altered version of RunMode for CM.
        //It will not hang a browser in big amount of data and fire callback
        //when it finish.
        CodeMirror.runMode(text, encoding, clb, ready);
    } catch (e) {
        console.log("Unable to initialize CodeMirror :( ", e.message);
    }
};
/**
* Find a content-type header value and return it.
* 
* @param {Array} headers Array of objects. Each object must contain 
*                "name" and "Value" keys.
* @returns {String|null} content type value or NULL if not found.
*/
RequestController.prototype._getResponseContentType = function(headers) {
    var contentType = null;
    for (var i = 0, len = headers.length; i < len; i++) {
        var header = headers[i];
        if (!header || !header.name)
            continue;
        if (header.name.toLowerCase() === "content-type") {
            var val = header.value;
            if (val.indexOf(';') !== -1) {
                // in case of: Content-Type: application/json; charset=UTF-8
                val = val.substr(0, val.indexOf(';'));
            }
            contentType = val;
            break;
        }
    }
    return contentType;
};

/**
 * Check if content-type header is one of predefined or added by a user JSON headers.
 * TODO: Allow user to define his own headers
 * @param {String} contentType The content-type value to check
 * @param {Function} clb Callback function with only one parameter:
 *                   String value of the header value or null if the header is not a JSON header
 * @returns {Void}
 */
RequestController.prototype._isJsonHeader = function(contentType, clb) {
    if (!contentType) {
        clb.call(this, null);
        return;
    }
    app.localStorage.get('JSONHEADERS', function(result) {
        if (result.JSONHEADERS && result.JSONHEADERS instanceof Array) {
            var jsonHeader = null;
            if (result.JSONHEADERS.indexOf(contentType) !== -1) {
                jsonHeader = contentType;
            }
            clb.call(this, jsonHeader);
        } else {
            clb.call(this, null);
        }
    });
};

/**
 * Fill headers panel with data.
 * @param {String} type Either "request" or "response"
 * @param {Array} data Array of headers.
 * @returns {Void}
 */
RequestController.prototype.fillHeadersData = function(type, data) {
    var panel, badge;
    if (type === 'request') {
        panel = document.querySelector('#requestHeadersPanel');
        badge = document.querySelector('#requestHeadersCount');
    } else if (type === 'response') {
        panel = document.querySelector('#responseHeadersPanel');
        badge = document.querySelector('#responseHeadersCount');
    } else {
        return;
    }
    panel.innerHTML = '';
    if (!data || data.length === 0) {
        panel.innerHTML = '<i>There is no headers to display</i>';
        badge.innerText = '0';
    } else {
        badge.innerText = data.length;
        data.forEach(function(header) {
            if (!header || !header.name)
                return;
            var content = document.querySelector('#http-header-display-template').content.cloneNode(true);
            content.querySelector('.header-name').innerText = header.name;
            if (header.value) {
                content.querySelector('.header-value').innerText = header.value;
            }
            panel.appendChild(content);
        });
    }
};

/**
 * Setup JSON tab and show parsed response.
 * @param {String} response The response
 * @returns {Void}
 */
RequestController.prototype._setJSONtab = function(response) {
    var worker = new Worker(chrome.runtime.getURL('js/workers/jsonviewer.js'));
    worker.addEventListener('message', function(e) {
        var panel = document.querySelector('#JsonHtmlPanel');
        panel.innerHTML = e.data;
        this._initializePopovers(panel);
    }.bind(this), false);
    worker.postMessage(response);
    this._addJSONcontainerControls();
};
/**
* Setup XML tab and show parsed response.
* @param {String} responseXml The response
* @returns {Void}
*/
RequestController.prototype._setXmlTab = function(responseXml) {
    var progressContent = document.querySelector('#progress-bar-template').content.cloneNode(true),
            panel = document.querySelector('#XmlHtmlPanel');

    panel.innerHTML = '';
    panel.appendChild(progressContent);

    var bar = panel.querySelector('.progress-bar'),
            textBar = bar.firstChild;

    var xmlParser = new XMLViewer(responseXml);
    xmlParser.addProgressEvent(function(current, total) {
        if (bar === null)
            return;
        var perc = Math.round(current / total * 100);
        if (perc > 100)
            perc = 100;
        bar.setAttribute('aria-valuenow', current);
        bar.setAttribute('aria-valuemax', total);
        bar.style.width = perc + '%';
        textBar.innerText = perc + '% Complete';
    });
    xmlParser.getHTML(function(result) {
        bar = null;
        textBar = null;
        panel.innerHTML = result;
        this._initializePopovers(panel);
    }.bind(this));
    this._addXMLcontainerControls();
};
/**
* Setup XML response panel to handle "click" events to handle links.
* It also loads popovers if any image is found. Images are contained in abbr element with data-image attribute (value is an URL to the image).
* @returns {Void}
*/
RequestController.prototype._addXMLcontainerControls = function() {
    if (this.XML_Controls_Added) {
        return;
    }
    this.XML_Controls_Added = true;
    document.querySelector('#XmlHtmlPanel').addEventListener('click', function(e) {
        if (!e.target)
            return;
        if (e.target.nodeName === "A") {
            if (e.ctrlKey) {
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
        if (!src)
            return;
        this._loadPopoverImage(src);
    }.bind(this));
    $('#XmlHtmlPanel').on('hide.bs.popover', function(e) {
        var src = e.target.dataset['image'];
        if (!src)
            return;
        var container = document.querySelector('[data-imgprevurl="' + src + '"]');
        if (!container)
            return;
        var blobUrl = $('a > img', container).attr('src');
        if (blobUrl) {
            window.webkitURL.revokeObjectURL(blobUrl);
        }
    }.bind(this));
};
RequestController.prototype._addJSONcontainerControls = function() {
    if (this.JSON_Controls_Added) {
        return;
    }
    this.JSON_Controls_Added = true;
    document.querySelector('#JsonHtmlPanel').addEventListener('click', function(e) {
        if (!e.target)
            return;
        if (e.target.nodeName === "A") {
            e.preventDefault();
            var url = e.target.getAttribute('href');
            window.restClientUrlService.value = url;
            return;
        }
        var toggleId = e.target.dataset['toggle'];
        if (!toggleId)
            return;
        var parent = this.querySelector('div[data-element="' + toggleId + '"]');
        if (!parent)
            return;
        var expanded = parent.dataset['expanded'];
        if (!expanded || expanded === "true") {
            parent.dataset['expanded'] = "false";
        } else {
            parent.dataset['expanded'] = "true";
        }
    });

    $('#JsonHtmlPanel').on('show.bs.popover', function(e) {
        var src = e.target.dataset['image'];
        if (!src)
            return;
        this._loadPopoverImage(src);
    }.bind(this));
    $('#JsonHtmlPanel').on('hide.bs.popover', function(e) {
        var src = e.target.dataset['image'];
        if (!src)
            return;
        var container = document.querySelector('[data-imgprevurl="' + src + '"]');
        if (!container)
            return;
        var blobUrl = $('a > img', container).attr('src');
        if (blobUrl) {
            window.webkitURL.revokeObjectURL(blobUrl);
        }
    }.bind(this));
};
RequestController.prototype._addParsedHTMLcontainerControls = function() {
    if (this.HTML_Controls_Added) {
        return;
    }
    this.HTML_Controls_Added = true;
    document.querySelector('#CMHtmlPanel').addEventListener('click', function(e) {
        if (!e.target)
            return;
        if (e.target.nodeName === "A") {
            e.preventDefault();
            var url = e.target.getAttribute('href');
            window.restClientUrlService.value = url;
            return;
        }
    });

    $('#CMHtmlPanel').on('show.bs.popover', function(e) {
        var src = e.target.dataset['image'];
        if (!src)
            return;
        this._loadPopoverImage(src);
    }.bind(this));
    $('#CMHtmlPanel').on('hide.bs.popover', function(e) {
        var src = e.target.dataset['image'];
        if (!src)
            return;
        var container = document.querySelector('[data-imgprevurl="' + src + '"]');
        if (!container)
            return;
        var blobUrl = $('a > img', container).attr('src');
        if (blobUrl) {
            window.webkitURL.revokeObjectURL(blobUrl);
        }
    }.bind(this));
};
RequestController.prototype._initializePopovers = function(panel) {
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
};
RequestController.prototype._loadPopoverImage = function(src) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', src, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
        var container = document.querySelector('[data-imgprevurl="' + src + '"]');
        if (!container)
            return;
        var a = document.createElement('a');
        a.setAttribute('href', src);
        a.setAttribute('target', '_blank');
        a.className = 'thumbnail';
        var img = document.createElement('img');
        img.src = window.webkitURL.createObjectURL(this.response);
        container.innerHTML = '';
        a.appendChild(img);
        container.appendChild(a);
    };
    xhr.send();
};
/**
* Fill redirects panel with data returned from webRequest.
* @param {Array} redirects
* @returns {Void}
*/
RequestController.prototype._fillRedirectsPanel = function(redirects) {
    var len = redirects.length;
    if (len === 0) {
        document.querySelector('#redirectsPanel').classList.add('hidden');
        return;
    } else {
        document.querySelector('#redirectsPanel').classList.remove('hidden');
    }
    var panel = document.querySelector('#redirectsPanelBody');
    panel.innerHTML = '';

    document.querySelector('#redirectsCount').innerText = len;
    for (var i = 0; i < len; i++) {
        var content = document.querySelector('#redirect-item-template').content.cloneNode(true);
        var status = content.querySelector('.redirect-status'),
                location = content.querySelector('.redirectTarget'),
                headersPanel = content.querySelector('.redirectHeaders'),
                redirect = redirects[i];
        status.innerText = redirect.statusLine;
        location.href = location.innerText = redirect.redirectUrl;

        redirect.responseHeaders.forEach(function(header) {
            if (!header || !header.name)
                return;
            var content = document.querySelector('#http-header-display-template').content.cloneNode(true);
            content.querySelector('.header-name').innerText = header.name;
            if (header.value) {
                content.querySelector('.header-value').innerText = header.value;
            }
            headersPanel.appendChild(content);
        });

        if (redirect.fromCache) {
            content.querySelector('.cacheInfo').classList.remove('hidden');
        }

        panel.appendChild(content);
    }
};
RequestController.prototype.observeResponsePanelActions = function() {
    if (this.responsePanelOberved) {
        return;
    }
    this.responsePanelOberved = true;

    document.querySelector('#responsePanel').addEventListener('click', function(e) {
        var action = e.target.dataset['action'];
        if (!action)
            return;

        switch (action) {
            case 'save-as-file':
                var button = e.target;
                var download = button.getAttribute("download");
                if (download) {

                } else {
                    e.preventDefault();

                }
                break;
            case 'force-json-tab':

                break;
            case 'copy-to-clipboard':
                copyText(this.currentResponse.response);
                break;
            case 'response-in-new-tab':
                var wnd = window.open();
                wnd.document.body.innerHTML = this.currentResponse.response;
                break;
            default:
                return;
        }


    }.bind(this), false);
    document.querySelector('#response-panel').addEventListener('click', function(e) {
        var action = e.target.dataset['action'];
        if (!action) {
            return;
        }
        switch (action) {
            case 'hide-request-headers':
            case 'hide-response-headers':
                if (e.target.dataset['state'] === 'closed') {
                    window.restClientUI.setResponseHeadersPanelState(action === 'hide-response-headers' ? 'response' : 'request', 'opened');
                } else {
                    window.restClientUI.setResponseHeadersPanelState(action === 'hide-response-headers' ? 'response' : 'request', 'closed');
                }
                break;
            default:
                return;
        }
    }.bind(this), false);
};



function HistoryController() {
}
HistoryController.prototype = Object.create(AppController.prototype);
HistoryController.prototype.onBeforeShow = function() {
    window.restClientUI.showPage('history');
};
function SettingsController() {
}
SettingsController.prototype = Object.create(AppController.prototype);
SettingsController.prototype.onBeforeShow = function(){
    window.restClientUI.showPage('settings');
};



(function(window) {

    var current = null;
    var controllers = [];
    var controllers_names = ['request','history','settings'];
    controllers['request'] = new RequestController();
    controllers['history'] = new HistoryController();
    controllers['settings'] = new SettingsController();

    function initializeControlers() {
        
        for (var i = 0, len = controllers_names.length; i < len; i++) {
            var ctrl = controllers[controllers_names[i]];
            ctrl.initialize();
        }
    }

    function runControllerAction(controller, action, params) {
        if (!controller in controllers)
            return;
        var obj = controllers[controller];
        if (current === obj) {
            obj.show(action, params);
        } else {
            current = obj;
            obj.onBeforeShow();
            obj.show(action, params);
            obj.onShow();
        }
    }

    window.restClientController = {
        initilize: initializeControlers,
        runAction: runControllerAction
    };
})(this);