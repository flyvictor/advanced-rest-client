var debug = true;
//hat's this???
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
 * Check if current string ends with given [str].
 * @param {type} str The string to check
 * @returns {Boolean} True if this ends with given [str].
 */
String.prototype.endsWith = function(str) {
    if (!str || str.isEmpty()) {
        return false;
    }
    var len = -str.length;
    return this.substr(len) === str;
};





if(typeof app === 'undefined'){
    window.app = {};
}
if(typeof chrome === 'undefined'){
    chrome = {};
}

/**
 * browser local storage vs chrome.storage
 * If in chrome extension env use asynchronius chrome.storage while on regular env use localstorage
 */
app.localStorage = {};
app.localStorage.chromeApp = typeof chrome.storage === 'undefined' ? false : true;
/**
 * Save in local storage.
 * Chromes local storage service is asynchronius so each call require callback function;
 * @param {String|Object} key If key is not a String only this parameter will be use to save data
 * @param {String} value
 * @param {Function} callback Function to call after save.
 */
app.localStorage.add = function(key,value,callback){
    if(app.localStorage.chromeApp){
        var obj = {};
        if(typeof key === 'string'){
            obj[key] = value;
        } else {
            obj = key;
        }
        chrome.storage.sync.set(obj, callback);
        return;
    }
    
    if(typeof key === 'string'){
        window.localStorage[key] = value;
    } else {
         for(var _prop in key){ 
            if(key.hasOwnProperty(_prop)){ 
                window.localStorage[_prop] = key[_prop];
            }
         }
    }
    if(typeof callback === 'function')
        callback();
};
/**
 * 
 * @param {String|Array|Object} key A single key to get, list of keys to get, or a dictionary specifying default values
 * @param {Function} callback Callback with storage items.
 * @returns {unresolved}
 */
app.localStorage.get = function(key,callback){
    if(app.localStorage.chromeApp){
        chrome.storage.sync.get(key, callback);
        return;
    }
    
    if(typeof key === 'string'){
        var value = window.localStorage[key];
        if(typeof value === 'undefined'){
            callback({});
            return;
        }
        callback({'key': value});
    }
    
    var arrResult = {};
    if(key instanceof Array){
        var len = key.length;
        for(var i=0; i<len; i++){
            var value = window.localStorage[key[i]];
            if(typeof value === 'undefined') continue;
            arrResult[key[i]] = value;
        }
        callback(arrResult);
    }
    
    if(typeof key === 'object'){
        for(var _prop in key){ 
            if(key.hasOwnProperty(_prop)){ 
                var value = window.localStorage[_prop];
                if(typeof value === 'undefined') value = key[_prop];
                
                arrResult[_prop] = app.parseValueToType(value);
            } 
        }
        callback.call(window,arrResult);
    }
    
    
};

app.parseValueToType = function(guess){
    if(typeof guess === "string"){
        if(guess === "true")
            return true;
        if(guess === "false")
            return false;
        if(!isNaN(guess)){
            var reg = /(,|\.)+/gim;
            if(reg.test(guess)){
                return parseFloat(guess);
            }
            return parseInt(guess);
        }
    }
    return guess;
};







function XMLViewer(data) {
    this.linkRegExp = /(&quot;|&lt;|&gt;)?([^"\s&;<>]*:\/\/[^"\s<>]*)(&quot;|&lt;|&gt;)?/gim;
    this.xml = data;
    this.latestError = null;
    this.progressEvents = [];
    this.nodesCount = null;
    this.nodesProcessed = 0;
}
XMLViewer.STYLE = {
    prettyPrint: "XML_parser_prettyPrint",
    comment: "XML_parser_comment",
    punctuation: "XML_parser_punctuation",
    tagname: "XML_parser_tagname",
    attname: "XML_parser_attname",
    attribute: "XML_parser_attribute",
    cdata: "XML_parser_cdata",
    inline: "XML_parser_inline",
    arrowExpanded: "XML_parser_arrowExpanded",
    arrowEmpty: "XML_parser_arrowEmpty",
    processing: "XML_parser_processing",
    node: "XML_parser_node",
    opened: "XML_parser_opened",
    nodeMargin: "XML_parser_nodeMargin",
    collapseIndicator: "XML_parser_collapseIndicator"
};
XMLViewer.prototype = {
    
    addProgressEvent: function(cb){
        if(typeof cb === 'function')
            this.progressEvents[this.progressEvents.length] = cb;
    },
    
    getHTML: function(callback) {
        
        this.nodesCount = this.xml.querySelectorAll('*').length;
        this._fireCallbackEvent(0, this.nodesCount);
        
        var result = '<div class="' + XMLViewer.STYLE.prettyPrint + '">';
        setTimeout(function() {
            this.parse(this.xml, function(data){
                result += data;
                result += "</div>";
                callback.call(this, result);
            });
        }.bind(this),0);
        
    },
    /**
     * Parse XML node
     */
    parse: function(node, callback) {
        var parsed = "";
        
        if(!node){
            callback(parsed);
            return;
        }
        
        
        var type = node.nodeType;
        switch (type) {
            case document.ELEMENT_NODE: //ELEMENT_NODE, value null
                
                this._parseElement(node, function(data){
                    parsed += '<div class="' + XMLViewer.STYLE.node + '">' + data + '</div>';
                    callback(parsed);
                });
                return;
            case document.TEXT_NODE: //TEXT_NODE, content of node
                var value = node.nodeValue;
                value = SafeHtmlUtils.htmlEscape(value);
                if (value === "") {
                    return "";
                }
                parsed += value;
                break;
            case document.CDATA_SECTION_NODE: //CDATA_SECTION_NODE, content of node
                parsed += '<span colapse-marker="true" class="' + XMLViewer.STYLE.arrowExpanded + '">&nbsp;</span>';
                parsed += '<span class="' + XMLViewer.STYLE.cdata + '">&lt;![CDATA[</span><div collapsible style="white-space: pre;">';
//		parsed += this.urlify(SafeHtmlUtils.htmlEscape(node.nodeValue));
                parsed += SafeHtmlUtils.htmlEscape(node.nodeValue);
                parsed += '</div><span class="' + XMLViewer.STYLE.cdata + '">]]&gt;</span>';
                break;
            case 7: //document declaration
                parsed += '<div class="' + XMLViewer.STYLE.processing + '">&lt;?xml ' + node.nodeValue + ' ?&gt;</div>';
                break;
            case document.COMMENT_NODE: // comment text
                parsed += '<div class="' + XMLViewer.STYLE.comment + '">&lt;--';
                parsed += node.nodeValue;
                parsed += "--&gt</div>";
                break;
            case document.DOCUMENT_NODE:
                parsed += '<div class="' + XMLViewer.STYLE.node + '">';
                parsed += '<div class="' + XMLViewer.STYLE.processing + '">';
                parsed += "&lt;?xml";
                if(node.xmlVersion){
                    parsed += " version='" + node.xmlVersion + "'";
                }
                if(node.xmlEncoding){
                    parsed += " encoding='" + node.xmlEncoding + "'";
                }
                parsed += " ?&gt";
                parsed += '</div>';
                parsed += '</div>';
                
                if(node.childNodes.length > 0){
                    this.parse(node.childNodes[0], function(data){
                        parsed += data;
                        callback(parsed);
                    }.bind(this));
                } else {
                    callback(parsed);
                }
                return;
            default:
                console.warn('Undefined XML node');
                console.dir(node);
                break;
        }

        parsed = '<div class="' + XMLViewer.STYLE.node + '">' + parsed + '</div>';
        callback(parsed);
    },
    _parseElement: function(node, callback) {
        var childrenCount = node.childNodes.length;
        
        
        var parsed = "";
        if (childrenCount > 1 || this._childIsCDATA(node)) {
            parsed += '<span colapse-marker="true" class="' + XMLViewer.STYLE.arrowExpanded + '">&nbsp;</span>';
        }
        parsed += '<span class="' + XMLViewer.STYLE.punctuation + '">&lt;</span>';
        parsed += '<span class="' + XMLViewer.STYLE.tagname + '">' + node.nodeName + '</span>';
        parsed += this.parseAttributes(node);
        if (childrenCount > 0) {
            var children = node.childNodes;
            parsed += '<span class="' + XMLViewer.STYLE.punctuation + '">&gt;</span>';
            var showInline = false;
            if (childrenCount === 1 && children.item(0).nodeType === 3) {
                //simple: only one child - text - show response inline.
                showInline = true;
            }
            if (showInline) {
                parsed += '<div class="' + XMLViewer.STYLE.inline + '">';
            } else {
                parsed += '<div collapse-indicator class="' + XMLViewer.STYLE.collapseIndicator + '">...</div>';
                parsed += '<div collapsible class="' + XMLViewer.STYLE.nodeMargin + '">';
            }
            
            var i = 0;
            var finish = function(){
                parsed += "</div>";
                parsed += '<span class="' + XMLViewer.STYLE.punctuation + '">&lt;/</span>';
                parsed += '<span class="' + XMLViewer.STYLE.tagname + '">' + node.nodeName + '</span>';
                parsed += '<span class="' + XMLViewer.STYLE.punctuation + '">&gt;</span>';
                this.nodesProcessed += childrenCount;
                if(!this.nodesCount !== null)
                    this._fireCallbackEvent(this.nodesProcessed,this.nodesCount);
                callback(parsed);
            }.bind(this);

            var _parse = function(){
                if(i >= childrenCount) {
                    finish();
                    return;
                }
                setTimeout(function() {
                    this.parse(children.item(i), function(data){
                        parsed += data;
                        _parse();
                    });
                    i++;
                }.bind(this), 0);
            }.bind(this);
            _parse();
            
            return;
        } else {
            parsed += '<span class="' + XMLViewer.STYLE.punctuation + '"> /&gt;</span>';
        }
        
        callback(parsed);
    },
    _childIsCDATA: function(node) {
        if (node && node.firstChild && node.firstChild.nodeType === document.CDATA_SECTION_NODE)
            return true;
        return false;
    },
    parseAttributes: function(node) {
        var parsed = "";
        var attr = node.attributes;
        if (attr != null && attr.length > 0) {
            for (var i = 0; i < attr.length; i++) {
                parsed += " " + this.getAttributesString(attr.item(i));
            }
        }
        return parsed;
    },
    getAttributesString: function(attr) {
        var data = '<span class="' + XMLViewer.STYLE.attname + '">';
        var name = attr.nodeName;
        name = SafeHtmlUtils.htmlEscape(name);
        data += name;
        data += "</span>";
        data += '<span class="' + XMLViewer.STYLE.punctuation + '">=</span>';
        data += '<span class="' + XMLViewer.STYLE.attribute + '">&quot;';
        var value = attr.value;
        value = SafeHtmlUtils.htmlEscape(value);
        var lowerName = name.toLowerCase();
        var lowerValue = value.toLowerCase();
        if(lowerName === 'href'){
            data += '<a response-anchor href="'+value+'">'+value+'</a>';
        } else {
            if(lowerValue.endsWith('png') || lowerValue.endsWith('jpg') || lowerValue.endsWith('jpeg') || lowerValue.endsWith('gif')){
                data += '<abbr title="Preview" data-image="'+value+'">'+value+'</abbr>';
            } else {
                data += value;
            }
        }
        data += "&quot;</span>";
        return data;
    },
    urlify: function(text) {
        var exp = /([^"\s&;]*:\/\/[^"\s]*)(&quot;)?/gim;
        return text.replace(exp, '<a response-anchor href="$1">$1</a>');
    },
    
    _fireCallbackEvent: function(current, total){
        for(var i=0,len = this.progressEvents.length; i<len; i++){
            setTimeout(function(i){
                this.progressEvents[i](current, total);
            }.bind(this, i), 0);
        }
    }
}
var SafeHtmlUtils = {
    AMP_RE: new RegExp(/&/g),
    GT_RE: new RegExp(/>/g),
    LT_RE: new RegExp(/</g),
    SQUOT_RE: new RegExp(/'/g),
    QUOT_RE: new RegExp(/"/g),
    htmlEscape: function(s) {
        if (s.indexOf("&") != -1) {
            s = s.replace(SafeHtmlUtils.AMP_RE, '&amp;');
        }
        if (s.indexOf("<") != -1) {
            s = s.replace(SafeHtmlUtils.LT_RE, '&lt;');
        }
        if (s.indexOf(">") != -1) {
            s = s.replace(SafeHtmlUtils.GT_RE, '&gt;');
        }
        if (s.indexOf('"') != -1) {
            s = s.replace(SafeHtmlUtils.QUOT_RE, '&quot;');
        }
        if (s.indexOf("'") != -1) {
            s = s.replace(SafeHtmlUtils.SQUOT_RE, '&#39;');
        }
        return s;
    }
}


/**
 * It will try to parse HTTP payload from string to key - value pairs (and vice 
 * versa) if the content-type header is set to application/x-www-form-urlencoded
 * @type Object
 */
var HttpPayloadParser = {
    /**
     * Parse payload string to FormData values ("key", "value" keys).
     * @param {type} str The string to parse. If [str] is not valid x-www-form-urlencoded value empty array will return.
     * @param {Boolean} decode True if keys and values should be decoded.
     * @returns {Array} Array of "key" and "value" objects.
     */
    fromString: function(str, decode) {
        var result = [];
        if (!str || str.isEmpty()) {
            return result;
        }
        for (var dataList = str.split(/[\r\n]/), len = dataList.length, i = 0; i < len; i++) {
            result = result.concat(HttpPayloadParser._stringToFormArrayUrlEncode(dataList[i], decode));
        }
        return result;
    },
    /**
     * 
     * @param {type} input
     * @param {type} decode
     * @returns {Array}
     */
    _stringToFormArrayUrlEncode: function(input, decode) {
        var result = [];
        if (!input || input.isEmpty()) {
            return result;
        }

        /*
         * Chrome inspector has FormData output like:
         * key:value
         * key:value
         * and so on.
         * When copying from inspector parse data to create proper form data.
         * 
         * But first check if it is not just regular form data input.
         * 
         * @TODO: check other inputs that contain ":" in it.
         */
        var htmlInputCheck = /^([^\\=]{1,})=(.*)$/m;
        if (!htmlInputCheck.test(input)) {
            var r = /^([^\\:]{1,}):(.*)$/gm;
            input = input.replace(r, "$1=$2&");
            if (input.endsWith("&")) {
                input = input.substr(0, input.length - 1);
            }
        }

        for (var i = 0, list = input.split("&"), len = list.length; i < len; i++) {
            var param = list[i];
            var _tmp = param.split("=", 2);
            if (_tmp.length !== 2) {
                continue;
            }
            try {
                var name = decode ? URL.decodeQueryString(_tmp[0].trim()) : _tmp[0].trim();
                var value = decode ? URL.decodeQueryString(_tmp[1].trim()) : _tmp[1].trim();
                var data = {
                    'key': name,
                    'value': value
                };
                result[result.length] = data;
            } catch (e) {
            }
        }
        return result;
    },
    /**
     * Convert array of objects ("key" and "value") to payload string according to x-www-form-urlencoded spec.
     * @param {Array} arr
     * @param {Boolean} encode True if keys and values should be encoded.
     * @returns {String}
     */
    toString: function(arr, encode) {
        var result = "";
        result = HttpPayloadParser._formArrayToStringUrlEncode(arr, encode);
        return result;
    },
    /**
     * 
     * @param {Array} arr
     * @param {Boolean} encode
     * @returns {HttpPayloadParser._formArrayToStringUrlEncode.result|String}
     */
    _formArrayToStringUrlEncode: function(arr, encode) {
        var result = "";
        if (!arr || arr.length === 0)
            return "";
        for (var i = 0, len = arr.length; i < len; i++) {
            var item = arr[i];
            if (!result.isEmpty()) {
                result += "&";
            }
            var key = item.key || "";
            var value = item.value || "";
            key = key.trim();
            value = value.trim();

            if (!(key.isEmpty() && value.isEmpty())) {
                if (encode)
                    result += URL.encodeQueryString(key);
                else
                    result += key;
                result += "=";
                if (encode)
                    result += URL.encodeQueryString(value);
                else
                    result += value;
            }
        }
        return result;
    }
};

var URL = {
    /**
     * Returns a string where all URL component escape sequences have been
     * converted back to their original character representations.
     * <p>
     * Note: this method will convert the space character escape short form, '+',
     * into a space. It should therefore only be used for query-string parts.
     * 
     * @param encodedURLComponent string containing encoded URL component
     *          sequences
     * @return string with no encoded URL component encoded sequences
     * 
     * @throws NullPointerException if encodedURLComponent is <code>null</code>
     */
    decodeQueryString: function(encodedURLComponent) {
        var regexp = /\+/g;
        return decodeURIComponent(encodedURLComponent.replace(regexp, "%20"));
    },
    /**
     * Returns a string where all characters that are not valid for a URL
     * component have been escaped. The escaping of a character is done by
     * converting it into its UTF-8 encoding and then encoding each of the
     * resulting bytes as a %xx hexadecimal escape sequence.
     * <p>
     * Note: this method will convert any the space character into its escape
     * short form, '+' rather than %20. It should therefore only be used for
     * query-string parts.
     * 
     * <p>
     * The following character sets are <em>not</em> escaped by this method:
     * <ul>
     * <li>ASCII digits or letters</li>
     * <li>ASCII punctuation characters:
     * 
     * <pre>- _ . ! ~ * ' ( )</pre>
     * </li>
     * </ul>
     * </p>
     * 
     * <p>
     * Notice that this method <em>does</em> encode the URL component delimiter
     * characters:<blockquote>
     * 
     * <pre>
     * ; / ? : &amp; = + $ , #
     * </pre>
     * 
     * </blockquote>
     * </p>
     * 
     * @param decodedURLComponent a string containing invalid URL characters
     * @return a string with all invalid URL characters escaped
     * 
     */
    encodeQueryString: function(decodedURLComponent) {
        var regexp = /%20/g;
        return encodeURIComponent(decodedURLComponent).replace(regexp, "+");
    }
};


/**
 * Copy [str] to clipboard.
 * It require "clipboardWrite" permissions for Chrome Extesions.
 * @param {type} str
 * @returns {undefined}
 */
function copyText(str){
    var clipboardholder = document.createElement("textarea");
    document.body.appendChild(clipboardholder);
    clipboardholder.value = str;
    clipboardholder.select();
    document.execCommand("Copy");
    clipboardholder.parentNode.removeChild(clipboardholder);
}