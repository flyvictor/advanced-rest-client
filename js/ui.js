
function RestClientUI() {
    this.headersCodeMirror = null;
}

RestClientUI.prototype = {
    constructor: RestClientUI,
    initialize: function() {
        this.observeUiEvents();

        this.initUrlField();
        this.initHttpMethod();
        this.initRequestHeaders();
        this.initRequestPayload();
        this.initTabs();
        this.restoreUiState();
        this.initTooltips();
        this.observePageUnload();
        this.handleLeftMenu();
    },
    uiEvent: function(name, details) {
        if (typeof details === 'undefined')
            details = {};

        var opt = {
            detail: details,
            bubbles: true,
            cancelable: true
        };

        return new CustomEvent(name, opt);
    },
    /// Initialize URL panel with URL editor
    initUrlField: function() {
        var urlContainer = $('#url-panel');
        urlContainer.on('click', function(e) {
            if (e.target.id) {
                switch (e.target.id) {
                    case 'request-url-panel-toggle':
                        var event = this.uiEvent('toggleurleditor');
                        document.querySelector('#url-panel').dispatchEvent(event);
                        break;
                }
            }
            if (e.target.dataset['action']) {
                e.preventDefault();
                switch (e.target.dataset['action']) {
                    case 'query-parameters-add':
                        this.appendUrlQueryParamRow();
                        break;
                    case 'remove-query-param':
                        $(e.target).parents('.query-param-row').remove();
                        break;
                }
            }
        }.bind(this));
        var scrollShaddowAdded = false;
        var nav = document.querySelector('#topNav');
        //handle page scroll and add shadow
        $(window).on('scroll', function(e) {
            if (document.body.scrollTop === 0) {
                if (scrollShaddowAdded) {
                    scrollShaddowAdded = false;
                    nav.classList.remove('activated');
                }
            } else {
                if (!scrollShaddowAdded) {
                    scrollShaddowAdded = true;
                    nav.classList.add('activated');
                }
            }
        });

    },
    /// Open or close URL editor panel 
    toggleUrlEditor: function(e) {

        var container = $('#url-panel');
        if (container.length === 0)
            return;

        var fullUrlField = $('#full-request-url');
        if (container.hasClass('expanded')) {
            container.trigger('toggle', ['Custom', 'before-close']);
            //close
            container.removeClass('expanded');
            fullUrlField.attr('placeholder', 'enter HTTP request URL here');
        } else {
            container.trigger('toggle', ['Custom', 'before-open']);
            //open
            container.addClass('expanded');
            fullUrlField.attr('placeholder', 'enter server URL here (e.g. http://my.server:8080)');
            //ensure that there is at least one query parametes row
            var queryContainer = $('#query-params-container');
            if (queryContainer.children().length === 1) {
                this.appendUrlQueryParamRow();
            }
        }
    },
    /**
     * Append #query-editor-param-row-template template to #query-params-container
     * @param {String} key If present insert key into text field
     * @param {String} value If present insert value into text field
     * @returns {undefined}
     */
    appendUrlQueryParamRow: function(key, value) {
        key = key || false;
        value = value || false;
        var content = document.querySelector('#query-editor-param-row-template').content.cloneNode(true);
        if (key) {
            content.querySelector('.query-key').value = key;
        }
        if (value) {
            content.querySelector('.query-value').value = value;
        }
        var container = document.querySelector('#query-params-container');
        container.appendChild(content);
        $('.has-tooltip', container).popover({trigger: 'hover'});
    },
    extractQueryParamsValues: function(containerRow) {
        var key = containerRow.children[0].value;
        var value = containerRow.children[1].value;
        return [key, value];
    },
    extractQueryParamsInputs: function(containerRow) {
        var key = containerRow.children[0];
        var value = containerRow.children[1];
        return [key, value];
    },
    clearAllQueryParamsRows: function() {
        this._clearFormRows('query');
    },
    clearAllHttpHeadersRows: function() {
        this._clearFormRows('header');
    },
    clearAllPayloadRows: function() {
        this._clearFormRows('payload');
    },
    clearAllFilesRows: function() {
        this._clearFormRows('file');
    },
    _clearFormRows: function(type) {
        var paramsContainers, params, query;
        switch (type) {
            case 'query':
                query = '#query-params-container > .query-param-row';
                break;
            case 'header':
                query = '#HttpHeadersForm .request-header-param-row';
                break;
            case 'payload':
                query = '#HttpPayloadForm .request-payload-row';
                break;
            case 'file':
                query = '#HttpPayloadFiles .request-payload-file-row';
                break;
        }
        paramsContainers = document.querySelectorAll(query);
        params = Array.prototype.slice.call(paramsContainers);
        params.forEach(function(item) {
            item.parentNode.removeChild(item);
        });
    },
    extractHttpHeadersValues: function(containerRow) {
        return this._extractFormValues('header', containerRow);
    },
//    extractHttpHeadersInputs: function(containerRow){
//        var children = Array.prototype.slice.call(containerRow.children),
//            key, value;
//        children.forEach(function(child){
//            if(child && child.classList){
//                if(child.classList.contains('request-header-key')){
//                    key = child;
//                } else if(child.classList.contains('request-header-value')){
//                    value = child;
//                }
//            }
//        });
//        return {key: key, value:value};
//    },
    extractPayloadValues: function(containerRow) {
        return this._extractFormValues('payload', containerRow);
    },
    _extractFormValues: function(type, container) {
        var keyCls, valueCls, key, value, children = Array.prototype.slice.call(container.children);
        switch (type) {
            case 'header':
                keyCls = 'request-header-key';
                valueCls = 'request-header-value';
                break;
            case 'payload':
                keyCls = 'request-payload-key';
                valueCls = 'request-payload-value';
                break;
        }
        children.forEach(function(child) {
            if (child && child.classList) {
                if (child.classList.contains(keyCls)) {
                    key = child.value;
                } else if (child.classList.contains(valueCls)) {
                    value = child.value;
                }
            }
        });
        return {key: key, value: value};
    },
    initHttpMethod: function() {
        $('#method-panel').change(function(e) {
            if (!e.target.value) {
                return;
            }
            var method = e.target.value;
            $(e.target).trigger('httpmethodchange', method);

            //movile view - select option
            if (e.target.id === 'selectedHttpMethod') {
                var defaultMethods = "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS,OTHER".split(',');
                if (defaultMethods.indexOf(method) === -1) {
                    //alternative method
                    document.querySelector('#HttpMethodOTHERValue').removeAttribute('disabled');
                    $('#HttpMethodOTHERValue').val(method);
                    return;
                }

                $('#HttpMethod' + method).click();
                if (method === 'OTHER') {
                    var dialog = $('#addMethodDialod');
                    dialog.modal();
                    $('#dialog-save-http-method', dialog).on('click', function(e) {
                        var value = $('#dialog-add-http-method', dialog).val();
                        $('#HttpMethodOTHERValue').val(value);

                        $('#selectedHttpMethod')
                                .append($("<option></option>")
                                .attr("value", value)
                                .attr('selected', true)
                                .text(value));

                        dialog.modal('hide');
                    });
                }
                return;
            }

        }.bind(this));
    },
    /**
     * Initialize UI tabs.
     * Handle change to tabs state if needed.
     * 
     * 
     * @returns {undefined}
     */
    initTabs: function() {

        $('.nav-tabs a').click(function(e) {
            e.preventDefault();
            var target = e.target.dataset['target'];
            if (!target)
                return;
            $('a[data-target="' + target + '"]').tab('show');
        });

        $('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
            if (e.target.dataset['target']) {
                var type;
                switch (e.target.dataset['target']) {
                    case '#HttpHeadersForm':
                        type = 'header';
                        break;
                    case '#HttpPayloadForm':
                        type = 'payload';
                        break;
                    case '#HttpPayloadFiles':
                        type = 'file';
                        break;
                }
                if (type) {
                    this.ensureFormHasRow(type);
                }
            }
        }.bind(this));
    },
    /**
     * Be sure that either Headers or Payload form has at least one row
     * @param {String} type Either "header", "payload" or "file"
     * @returns {Void}
     */
    ensureFormHasRow: function(type) {
        if (!type) {
            throw "Type argument is not specified.";
        }
        var wrap;
        switch (type) {
            case 'header':
                wrap = '#HttpHeadersForm > .wrapper';
                break;
            case 'payload':
                wrap = '#HttpPayloadForm > .wrapper';
                break;
            case 'file':
                wrap = '#HttpPayloadFiles > .wrapper';
                break;
        }
        if (wrap) {
            var queryContainer = $(wrap);
            if (queryContainer.children().length === 1) {
                this.appendHttpDataRow(type);
            }
        }
    },
    /**
     * Init all tooltips
     * @returns {undefined}
     */
    initTooltips: function() {
        $('.has-tooltip').tooltip();
    },
    /**
     * Enable CodeMirror for HTTP headers raw input.
     * @returns {undefined}
     */
    enableHeadersCodeMirror: function() {
        if (typeof CodeMirror === 'undefined') {
            return;
        }
        var opts = {
            'mode': "message/http",
            'autoClearEmptyLines': true,
            'lineWrapping': true,
            'value': 'HttpTest: akdskfj',
            'extraKeys': {
                'Ctrl-Space': 'autocompleteHeaders'
            },
            'onKeyEvent': function(inst, event) {
                if (event.type === 'keyup') {
                    var keys = [0, 16, 17, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 91];
                    if (keys.indexOf(event.keyCode) !== -1)
                        return;
                    $('#RawHttpHeaders').val(inst.getValue());
                }
            }
        };
        //var context = this;
        (function() {
            CodeMirror.commands = CodeMirror.commands || {};
            CodeMirror.commands.autocompleteHeaders = function(cm) {
                try {
                    CodeMirror.showHint(cm, CodeMirror.headersHint);
                } catch (e) {
                }
            };
        }());
        this.headersCodeMirror = CodeMirror.fromTextArea(document.querySelector('#RawHttpHeaders'), opts);
        this.headersCodeMirror.refresh();
        opts = null;
    },
    disbaleHeadersCodeMirror: function() {
        if (this.headersCodeMirror !== null) {
            this.headersCodeMirror.toTextArea();
            this.headersCodeMirror = null;
        }
    },
    /**
     * 
     * @param {Array} scriptsList Array of the scripts to load.
     * @param {Function} callback Function to call after all files are loaded successfully.
     * @param {String} baseUrl baseUrl for liblary array
     * @returns {undefined}
     */
    loadScripts: function(scriptsList, callback, baseUrl) {

        if (!scriptsList || scriptsList.length === 0) {
            callback.call(this);
            return;
        }

        baseUrl = baseUrl || '';
        var context = this;
        window.setTimeout(function() {
            var script = scriptsList.shift();

            var ga = document.createElement('script');
            ga.type = 'text/javascript';
            ga.async = true;
            ga.src = baseUrl + script;
            ga.addEventListener('load', function(e) {
                context.loadScripts(scriptsList, callback, baseUrl);
                context = null;
            });
            ga.addEventListener('error', function(e) {
                context = null;
                scriptsList = null;
                callback = null;
                baseUrl = null;
            });
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(ga, s);

        }.bind(this), 1);
    },
    /**
     * Initialize request headers panel
     * @returns {undefined}
     */
    initRequestHeaders: function() {
        var context = this;
        $('#HttpHeadersPanel').click(function(e) {
            if (e.target.dataset['action']) {
                e.preventDefault();
                switch (e.target.dataset['action']) {
                    case 'request-headers-add':
                        context.appendHttpDataRow('header');
                        break;
                    case 'remove-request-header-param':
                        $(e.target).parents('.request-header-param-row').remove();
                        break;
                }
            }
        });
    },
    /**
     * Append #query-editor-param-row-template template to #query-params-container
     * @param {String} type Either 'header', 'payload' or file
     * @param {String} key
     * @param {String} value
     * @returns {undefined}
     */
    appendHttpDataRow: function(type, key, value) {
        key = key || false;
        value = value || false;
        type = type || 'header';
        var tpl, wrap, keyField, valueField;
        var updateKeyVal = false;
        switch (type) {
            case 'header':
                tpl = '#http-headers-row-template';
                wrap = '#HttpHeadersForm > .wrapper';
                keyField = '.request-header-key';
                valueField = '.request-header-value';
                updateKeyVal = true;
                break;
            case 'payload':
                tpl = '#http-payload-row-template';
                wrap = '#HttpPayloadForm > .wrapper';
                keyField = '.request-payload-key';
                valueField = '.request-payload-value';
                updateKeyVal = true;
                break;
            case 'file':
                tpl = '#http-payload-file-row-template';
                wrap = '#HttpPayloadFiles > .wrapper';

                keyField = '.request-payload-file-name';
                updateKeyVal = true;
                break;
        }

        var content = document.querySelector(tpl).content.cloneNode(true);
        if (updateKeyVal) {
            if (key) {
                content.querySelector(keyField).value = key;
            }
            if (value) {
                content.querySelector(valueField).value = value;
            }
        }
        var container = document.querySelector(wrap);
        container.appendChild(content);
        $('.has-tooltip', container).tooltip();

        var eventName = type + '.field.added';
        var event = this.uiEvent(eventName);
        container.dispatchEvent(event);
    },
    initRequestPayload: function() {
        var context = this;
        $('#HttpPayloadPanel').click(function(e) {
            if (e.target.dataset['action']) {
                e.preventDefault();
                switch (e.target.dataset['action']) {
                    case 'request-payload-file-add':
                        context.appendHttpDataRow('file');
                        break;
                    case 'request-payload-add':
                        context.appendHttpDataRow('payload');
                        break;
                    case 'remove-payload-file-param':
                        var row = $(e.target).parents('.request-payload-file-row');
                        var wrapper = row.parent();
                        row.remove();
                        if (wrapper.length > 0) {
                            var event = context.uiEvent('file.field.removed');
                            wrapper[0].dispatchEvent(event);
                        }
                        break;
                    case 'remove-payload-param':
                        var row = $(e.target).parents('.request-payload-row');
                        var wrapper = row.parent();
                        row.remove();
                        if (wrapper.length > 0) {
                            var event = context.uiEvent('payload.field.removed');
                            wrapper[0].dispatchEvent(event);
                        }
                        break;
                }
            }
        });
    },
    observePageUnload: function() {
        window.addEventListener("beforeunload", function() {
            this.saveUiState();
        }.bind(this), false);
    },
    saveUiState: function() {
        var data = {
            'detailedurlpanel': document.querySelector('#url-panel').classList.contains('expanded'),
            'headersTab': document.querySelector('#HttpHeadersPanel .nav-tabs .active a').dataset['target'].replace('#', ''),
            'payloadTab': document.querySelector('#HttpPayloadPanel .nav-tabs .active a').dataset['target'].replace('#', '')
        };
        app.localStorage.add(data);
    },
    restoreUiState: function() {
        var data = {
            'detailedurlpanel': false,
            'headersTab': 'HttpHeadersRaw',
            'payloadTab': 'HttpPayloadRaw'
        };
        app.localStorage.get(data, function(result) {
            if (result.detailedurlpanel === true) {
                this.toggleUrlEditor(null);
            }
            if (result.headersTab !== '') {
                $('a[data-target="#' + result.headersTab + '"]').tab('show');
                this.ensureFormHasRow('header');
            }
            if (result.payloadTab !== '') {
                $('a[data-target="#' + result.payloadTab + '"]').tab('show');
                this.ensureFormHasRow('payload');
            }
        }.bind(this));
        
        
        var requestHeadersPanelState = window.sessionStorage['req_head_panel_state'] || "opened";
        var responseHeadersPanelState = window.sessionStorage['res_head_panel_state'] || "opened";
        this.setResponseHeadersPanelState('request',requestHeadersPanelState);
        this.setResponseHeadersPanelState('response',responseHeadersPanelState);
    },
    
    setResponseHeadersPanelState: function(type, state){
        var panel, button, key, wrapper;
        if(type === 'request'){
            wrapper = document.querySelector('#requestHeaders');
            panel = wrapper.querySelector('#requestHeadersPanel');
            key = 'req_head_panel_state';
        } else if(type === 'response'){
            wrapper = document.querySelector('#responseHeaders');
            panel = wrapper.querySelector('#responseHeadersPanel');
            key = 'res_head_panel_state';
        } else {
            return;
        }
        var img_open = '&times;';
        var img_close = '↶';
        
        button = wrapper.querySelector('.close');
        button.dataset['state'] = state;
        window.sessionStorage[key] = state;
        
        if(state === 'opened'){
            button.innerHTML = img_open;
            panel.classList.remove('hidden');
        } else if(state === 'closed'){
            button.innerText = img_close;
            panel.classList.add('hidden');
        }
    },
    
    /**
     * Because of event oriented nature of the application 
     * this is main method which controling an UI.<br/>
     * <br/>
     * If any part of the apps logic whant to change UI state it should fire 
     * an event which will be processed here.<br/>
     * <br/>
     * It has predefinied set of actions for some app states like 'formerror' 
     * which can be used to disable action controls.<br/>
     * <br/>
     * <pre>
     * Available handlers:
     * <b>formerror</b> - request form contain an error (disable action controls)
     * <b>formready</b> - request form is filled with data (enable action controls)
     * <b>toggleurleditor</b> - toggle URL editor
     * <b>httpmethodchange</b> - Http method has changed. First parameter is new HTTP method.
     * </pre>
     */
    observeUiEvents: function() {
        var body = $('body');
        var context = this;
        //Form error - disable action buttons
        body.on('formerror', function(e) {
            var sendButtons = document.querySelectorAll('*[data-action="send-form-action"]');
            var buttons = Array.prototype.slice.call(sendButtons);
            buttons.forEach(function(button) {
                button.classList.remove('disabled');
                button.removeAttribute('disabled');
            });
            document.getElementById('full-request-url').setCustomValidity("The URL may not be valid.");
        });
        body.on('formnotready', function(e) {
            var sendButtons = document.querySelectorAll('*[data-action="send-form-action"]');
            var buttons = Array.prototype.slice.call(sendButtons);
            buttons.forEach(function(button) {
                button.classList.add('disabled');
                button.setAttribute('disabled', true);
            });

            document.getElementById('full-request-url').setCustomValidity("");
        });
        body.on('formready', function(e) {
            var sendButtons = document.querySelectorAll('*[data-action="send-form-action"]');
            var buttons = Array.prototype.slice.call(sendButtons);
            buttons.forEach(function(button) {
                button.classList.remove('disabled');
                button.removeAttribute('disabled');
            });

            document.getElementById('full-request-url').setCustomValidity("");
        });

        body.on('toggleurleditor', function(e) {
            context.toggleUrlEditor();
        });

        body.on('httpmethodchange', function(e, currentMethod) {
            if (!currentMethod)
                return;
            context.setCurrentPayloadState(currentMethod);
        });

    },
    setCurrentPayloadState: function(state) {
        var payloadPanel = document.querySelector('#HttpPayloadPanel');
        var getMethods = 'GET,HEAD'.split(',');
        if (getMethods.indexOf(state) === -1) {
            //show payload
            payloadPanel.classList.remove('hidden');
        } else {
            //hide payload
            payloadPanel.classList.add('hidden');
        }
        /// enable "other" input field if needed.
        var defaultMethods = "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS".split(',');
        if (defaultMethods.indexOf(state) === -1) {
            document.querySelector('#HttpMethodOTHERValue').removeAttribute('disabled');
        } else {
            document.querySelector('#HttpMethodOTHERValue').setAttribute('disabled', true);
        }
    },
    /**
     * Reset panels in response view to it's initial state.
     * @returns {Void}
     */
    resetResponseView: function() {
        //hide all tabs buttons
        document.querySelector('a[href="#xmlResponseTab"]').classList.add('hidden');
        document.querySelector('a[href="#jsonResponseTab"]').classList.add('hidden');
        document.querySelector('a[href="#binaryResponseTab"]').classList.add('hidden');
        document.querySelector('a[href="#parsedResponseTab"]').classList.add('hidden');

        //clean response panels
        document.querySelector('#rawResponseCode').innerHTML = '';
        document.querySelector('#CMHtmlPanel .cm-s-default').innerHTML = '';
        document.querySelector('#JsonHtmlPanel').innerHTML = '';
        document.querySelector('#XmlHtmlPanel').innerHTML = '';

        //show default tab
        $('a[href="#rawResponseTab"]').tab('show');

        document.querySelector('#response-panel').classList.remove('hidden');
        document.querySelector('#responseBodyPanels').classList.remove('hidden');
    },
    /**
     * Set response state depanding on response's status code
     * @param {String} state Either "ok", "warning" or "error"
     * @returns {Void}
     */
    setResponseStatusState: function(state) {
        var panelCls, labelCls;
        switch (state) {
            case 'ok':
                panelCls = 'panel panel-success';
                labelCls = 'label label-success';
                break;
            case 'warning':
                panelCls = 'panel panel-warning';
                labelCls = 'label label-warning';
                break;
            case 'error':
                panelCls = 'panel panel-danger';
                labelCls = 'label label-danger';
                break;
            default:
                return;
        }
        var statusPanel = document.querySelector('#responseStatusPanel');
        var responseStatusValue = document.querySelector('#responseStatusValue');
        var headStatusValue = document.querySelector('#headStatusValue');
        responseStatusValue.className = labelCls;
        headStatusValue.className = labelCls;
        statusPanel.className = panelCls;
    },
    handleLeftMenu: function() {
        var menuTriggers = $('.left-menu-trigger');
        var menuPanel = $('#leftnav');
        menuTriggers.on('mouseover', function(e) {
            menuPanel.addClass('active');
        });
        menuPanel.on('mouseout', function(e) {
            if (e.toElement && e.toElement.id !== 'leftnav' && $(e.toElement).parents('#leftnav').length === 0) {
                menuPanel.removeClass('active');
            }
        });
    }
};



(function() {
    window.restClientUI = new RestClientUI();
    window.restClientUI.initialize();
})();