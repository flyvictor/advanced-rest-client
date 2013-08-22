
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
    appendUrlQueryParamRow: function(key,value) {
        key = key || false;
        value = value || false;
        var content = document.querySelector('#query-editor-param-row-template').content.cloneNode(true);
        if(key){
            content.querySelector('.query-key').value = key;
        }
        if(value){
            content.querySelector('.query-value').value = value;
        }
        var container = document.querySelector('#query-params-container');
        container.appendChild(content);
        $('.has-tooltip', container).popover({trigger:'hover'});
    },
            
    extractQueryParamsValues: function(containerRow){
        var key = containerRow.children[0].value;
        var value = containerRow.children[1].value;
        return [key, value];
    },
    extractQueryParamsInputs: function(containerRow){
        var key = containerRow.children[0];
        var value = containerRow.children[1];
        return [key, value];
    },
    
    clearAllQueryParamsRows: function(){
        var paramsContainers = document.querySelectorAll('#query-params-container > .query-param-row');
        var params = Array.prototype.slice.call(paramsContainers);
        params.forEach(function(item){
            item.parentNode.removeChild(item);
        });
    },
    
    clearAllHttpHeadersRows: function(){
        var paramsContainers = document.querySelectorAll('#HttpHeadersForm .request-header-param-row');
        var params = Array.prototype.slice.call(paramsContainers);
        params.forEach(function(item){
            item.parentNode.removeChild(item);
        });
    },
    extractHttpHeadersValues: function(containerRow){
        var children = Array.prototype.slice.call(containerRow.children),
            key, value;
        children.forEach(function(child){
            if(child && child.classList){
                if(child.classList.contains('request-header-key')){
                    key = child.value;
                } else if(child.classList.contains('request-header-value')){
                    value = child.value;
                }
            }
        });
        return {key: key, value:value};
    },
    extractHttpHeadersInputs: function(containerRow){
        var children = Array.prototype.slice.call(containerRow.children),
            key, value;
        children.forEach(function(child){
            if(child && child.classList){
                if(child.classList.contains('request-header-key')){
                    key = child;
                } else if(child.classList.contains('request-header-value')){
                    value = child;
                }
            }
        });
        return {key: key, value:value};
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
                if(type){
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
    ensureFormHasRow: function(type){
        if(!type){
            throw "Type argument is not specified.";
        }
        var wrap;
        switch (type){
            case 'header': wrap = '#HttpHeadersForm > .wrapper'; break;
            case 'payload': wrap = '#HttpPayloadForm > .wrapper'; break;
            case 'file': wrap = '#HttpPayloadFiles > .wrapper'; break;
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
        if(this.headersCodeMirror !== null){
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
        var tpl, wrap;
        var updateKeyVal = false;
        switch (type) {
            case 'header':
                tpl = '#http-headers-row-template';
                wrap = '#HttpHeadersForm > .wrapper';
                updateKeyVal = true;
                break;
            case 'payload':
                tpl = '#http-payload-row-template';
                wrap = '#HttpPayloadForm > .wrapper';
                break;
            case 'file':
                tpl = '#http-payload-file-row-template';
                wrap = '#HttpPayloadFiles > .wrapper';
                break;
        }
        
        var content = document.querySelector(tpl).content.cloneNode(true);
        if(updateKeyVal){
            if(key){
                content.querySelector('.request-header-key').value = key;
            }
            if(value){
                content.querySelector('.request-header-value').value = value;
            }
        }
        var container = document.querySelector(wrap);
        container.appendChild(content);
        $('.has-tooltip', container).tooltip();
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
                        $(e.target).parents('.request-payload-file-row').remove();
                        break;
                    case 'remove-payload-param':
                        $(e.target).parents('.request-payload-row').remove();
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
            var sendButton = document.querySelector('#RequestActionsPanel *[data-action="send-form-action"]');
            sendButton.classList.remove('disabled');
            sendButton.removeAttribute('disabled');
            
            document.getElementById('full-request-url').setCustomValidity("The URL may not be valid.");
        });
        body.on('formnotready', function(e) {
            var sendButton = document.querySelector('#RequestActionsPanel *[data-action="send-form-action"]');
            sendButton.classList.add('disabled');
            sendButton.setAttribute('disabled', true);
            
            document.getElementById('full-request-url').setCustomValidity("");
        });
        body.on('formready', function(e) {
            var sendButton = document.querySelector('#RequestActionsPanel *[data-action="send-form-action"]');
            sendButton.classList.remove('disabled');
            sendButton.removeAttribute('disabled');
            
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
    }
};



(function() {
    window.restClientUI = new RestClientUI();
    window.restClientUI.initialize();
})();