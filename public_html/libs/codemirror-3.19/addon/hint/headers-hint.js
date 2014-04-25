(function() {
    function headersHint(editor, headersStructure, getToken) {
        var cur = editor.getCursor();
        var token = getToken(editor, cur);
        var tokenString = (!!token.string) ? "" : token.string.trim();
        if (tokenString.trim() === "") {

        }
        var keywords = [];
        var i = 0;

        var from = {line: cur.line, ch: cur.ch + 2};
        var to = {line: cur.line, ch: cur.ch};
        var flagClean = true;


        //if it is start of the line show every possibility
        var last = editor.getRange({line: cur.line, ch: cur.ch - 1}, cur);
        var last2 = editor.getRange({line: cur.line, ch: cur.ch - 2}, cur);

        if ((last === ":" || last2 === ": ") || (last === "," || last2 === ", ")) {
            var key = editor.getRange({line: cur.line, ch: 0}, cur);
            if (!key)
                key = "";
            key = key.substr(0, key.indexOf(":")).trim().toLowerCase();
            keywords = getHeaderValuesFor(headersStructure, key);
        } else if (editor.getRange({line: cur.line, ch: 0}, cur).trim() !== "") {
            var prev = editor.getRange({line: cur.line, ch: 0}, cur).trim();
            if (prev.indexOf(":") > -1) {
                //looking for value
                tokenString = prev.substr(prev.indexOf(":") + 1).trim().toLowerCase();
                keywords = getHeaderValuesFor(headersStructure, key);
            } else {
                //looking for header name starting with...
                tokenString = prev.toLowerCase();
                keywords = getKeywords(headersStructure);
            }
            from.ch = token.start;
        } else {
            for (i = 0; i < headersStructure.length; i++) {
                keywords = getKeywords(headersStructure);
            }
        }

        if (flagClean === true && tokenString.trim() === "") {
            flagClean = false;
        }

        if (flagClean) {
            keywords = cleanResults(tokenString, keywords);
        }

        return {list: keywords, from: from, to: to};
    }

    /**
     * Get all keywords (headers names).
     * @param {Array} headersStructure List of possible headers
     * @return {Array} Array of founded header names.
     */
    var getKeywords = function(headersStructure) {
        var keywords = [];
        for (var i = 0; i < headersStructure.length; i++) {
            keywords.push({
                text: headersStructure[i].key,
                hint: function(cm, data, completion) {
                    cm.replaceRange(completion.text + ": ", data.from, data.to);
                }
            });
        }
        return keywords;
    };

    var getHeaderValuesFor = function(headersStructure, key) {
        var keywords = [];
        for (var i = 0; i < headersStructure.length; i++) {
            if (headersStructure[i].key.toLowerCase() === key) {
                if (headersStructure[i].values && headersStructure[i].values.length > 0) {

                    headersStructure[i].values.forEach(function(item) {
                        var completion = {
                            text: item,
                            hint: function(cm, data, completion) {
                                cm.replaceRange(completion.text, data.from, data.to);
                            }
                        };
                        keywords.push(completion);
                    });

                }
                break;
            }
        }
        return keywords;
    };

    var cleanResults = function(text, keywords) {
        var results = [];
        var i = 0;

        for (i = 0; i < keywords.length; i++) {
            if (keywords[i].text) {
                if (keywords[i].text.toLowerCase().substring(0, text.length) === text) {
                    results.push(keywords[i]);
                }
            } else {
                if (keywords[i].toLowerCase().substring(0, text.length) === text) {
                    results.push(keywords[i]);
                }
            }
        }

        return results;
    };
    
    var languages = ['en-US','en-GB','de'];
    var CT = ['text/plain', 'text/html', 'text/javascript', 'application/json','application/xml','application/atom+xml'];
    var common_UA = ['Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36','Mozilla/5.0 (Windows NT 6.1; WOW64; rv:24.0) Gecko/20100101 Firefox/24.0','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/536.30.1 (KHTML, like Gecko) Version/6.0.5 Safari/536.30.1','Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)'];
    
    var headersStructure = [
        {key: 'Accept', values: CT},
        {key: 'Accept-Charset', values: ['utf-8', 'utf-16', 'iso-8859-1', 'iso-8859-2', 'iso-8859-3', 'iso-8859-4', 'iso-8859-5', 'iso-8859-6']},
        {key: 'Accept-Datetime', values: []},
        {key: 'Accept-Encoding', values: ['compress', 'gzip', 'deflate', 'identity']},
        {key: 'Accept-Language', values: languages},
        {key: 'Authorization', values: ['Basic ...','Barer ...']},
        {key: 'Cache-Control', values: ['no-cache','no-store','max-age=9000','max-stale=','min-fresh=','no-transform','only-if-cached']},
        {key: 'Connection', values: ['close']},
        {key: 'Content-Encoding', values: ['gzip']},
        {key: 'Content-Language', values: languages},
        {key: 'Content-Length', values: []},
        {key: 'Content-Location', values: []},
        {key: 'Content-MD5', values: []},
        {key: 'Content-Type', values: ['application/atom+xml', 'application/json', 'application/xml', 'application/x-www-form-urlencoded', 'multipart/form-data']},
        {key: 'Content-Range', values: []},
        {key: 'Cookie', values: []},
        {key: 'Date', values: []},
        {key: 'DNT', values: [0, 1]},
        {key: 'ETag', values: [""]},
        {key: 'Expect', values: ['100-continue']},
        {key: 'From', values: ['john@doe.com']},
        {key: 'Front-End-Https', values: ['on', 'off']},
        {key: 'Host', values: []}, //TODO: how to get current request host here?
        {key: 'If-Match', values: []},
        {key: 'If-Modified-Since', values: []},
        {key: 'If-None-Match', values: []},
        {key: 'If-Range', values: []},
        {key: 'If-Unmodified-Since', values: []},
        {key: 'Max-Forwards', values: []},
        {key: 'Origin', values: []},
        {key: 'Pragma', values: ['no-cache']},
        {key: 'Proxy-Authorization', values: []},
        {key: 'Proxy-Connection', values: ['keep-alive']},
        {key: 'Range', values: []},
        {key: 'Referer', values: []},
        {key: 'TE', values: []},
        {key: 'Transfer-Encoding', values: ['chunked']},
        {key: 'Upgrade', values: ['HTTP/2.0','SHTTP/1.3','IRC/6.9','RTA/x11']},
        {key: 'User-Agent', values: common_UA},
        {key: 'Via', values: []},
        {key: 'Warning', values: []},
        {key: 'X-ATT-DeviceId', values: []},
        {key: 'X-Forwarded-For', values: []},
        {key: 'X-Forwarded-Proto', values: ['http', 'https']},
        {key: 'X-Requested-With', values: ['XMLHttpRequest']},
        {key: 'X-Wap-Profile', values: []}
    ];



    CodeMirror.headersHint = function(editor, showHints, options) {
        if (String.prototype.trim === undefined) {
            String.prototype.trim = function() {
                return this.replace(/^\s+|\s+$/g, '');
            };
        }
        if (!Array.prototype.forEach) {
            Array.prototype.forEach = function(fn, scope) {
                for (var i = 0, len = this.length; i < len; ++i) {
                    fn.call(scope, this[i], i, this);
                }
            };
        }

        if (typeof showHints === "function") {
            window.setTimeout(function() {
                var hints = headersHint(editor, headersStructure, function(e, cur) {
                    return e.getTokenAt(cur);
                });
                showHints(hints);
            }, 1);
            return;
        }

        return headersHint(editor, headersStructure, function(e, cur) {
            return e.getTokenAt(cur);
        });
    };
})();