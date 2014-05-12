String.prototype.isEmpty = function() {
    return (this.trim() === "");
};

String.prototype.endsWith = function(str) {
    if (!str || str.isEmpty()) {
        return false;
    }
    var len = -str.length;
    return this.substr(len) === str;
};

self.onmessage = function(e) {

    var passedData = e.data;
    var elements = passedData.elements;
    var baseUrl = passedData.url;
    passedData = null;
    

    var result = "";
    for (var i = 0, len = elements.length; i < len; i++) {
        var str = elements[i].string;
        if (str === null) {
            continue;
        }
        var style = elements[i].style;
        if (str === "\n") {
            result += "<br>";
        } else if (style !== null) {
            result += '<span class="cm-' + style + '">' + SafeHtmlUtils.htmlEscape(str) + "</span>";
        } else {
            result += SafeHtmlUtils.htmlEscape(str);
        }
    }

    var domainAndPath = baseUrl;
    if(domainAndPath.endsWith('.css') || domainAndPath.endsWith('.js')){
        domainAndPath = domainAndPath.substring(0, domainAndPath.lastIndexOf('/')+1);
    }

    var domain = domainAndPath;
    var domainSlashPos = domainAndPath.indexOf("/", domainAndPath.indexOf("://") + 3);
    if (domainSlashPos > 0) {
        domain = domainAndPath.substring(0, domainSlashPos);
    }
    var protocol = domain.substr(0, domain.indexOf("/"));

    var reg = /(href|src)<\/span>=<span class="cm-string">&quot;([^<"]+)&quot;/gim;
    if (reg.test(result)) {
        var line;
        try{
        while ((line = reg.exec(result)) !== null) {
//            0 - whole match
//            1 - href|src group
//            2 - ([^<"&]+) group
//            index - start index
//            input - the result variable
            var wholeLine = line[0];
            var attrName = line[1];
            var url = line[2].trim();
            if(url.indexOf('javascript:') === 0){
                continue;
            }
            if(url.indexOf('mailto:') === 0){
                continue;
            }
            
            
            var fullHref = "about:blank";
            if (url.indexOf("://") !== -1) {
                fullHref = url;
            } else if (url.indexOf("/") === 0) {
                if (url[1] === "/") {
                    //case where href depends on base domain protocol
                    fullHref = protocol + url;
                } else {
                    fullHref = domain + url;
                }
            } else {
                fullHref = domainAndPath + url;
            }
            
            var lowerValue = url.toLowerCase();
            if(lowerValue.endsWith('png') || lowerValue.endsWith('jpg') || lowerValue.endsWith('jpeg') || lowerValue.endsWith('gif')){
                var replacement = attrName + '</span>=<span class="cm-string">';
                replacement += '&quot;<abbr title="Preview" data-image="'+fullHref+'">' + url + '</abbr>&quot;';
                result = result.replace(wholeLine, replacement);
            } else{
                
                var replacement = attrName + '</span>=<span class="cm-string">';
                replacement += '&quot;<a title="Click to insert into URL field" response-anchor href="' + fullHref + '">' + url + '</a>&quot;';
                result = result.replace(wholeLine, replacement);
            }
        }
        }catch(e){}
    }
    //css images
    var reg = /url<\/span>\s?\(\s?<span class="cm-string">"?([^<"]+)/gim;
    if (reg.test(result)) {
        var line;
        try{
            while ((line = reg.exec(result)) !== null) {
                var wholeLine = line[0];
                var url = line[1].trim();
                var lowerValue = url.toLowerCase();

                if(lowerValue.endsWith('png') || lowerValue.endsWith('jpg') || lowerValue.endsWith('jpeg') || lowerValue.endsWith('gif')){
                    
                    var fullHref = "about:blank";
                    if (url.indexOf("://") !== -1) {
                        fullHref = url;
                    } else if (url.indexOf("/") === 0) {
                        if (url[1] === "/") {
                            //case where href depends on base domain protocol
                            fullHref = protocol + url;
                        } else {
                            fullHref = domain + url;
                        }
                    } else {
                        fullHref = domainAndPath + url;
                    }

                    var replacement = 'url</span><span class="cm-string">';
                    replacement += '("<abbr title="Preview" data-image="'+fullHref+'">' + url + '</abbr>")';
                    result = result.replace(wholeLine, replacement);
                }
            }
        }catch(e){}
    }
    
    self.postMessage(result);
};

var SafeHtmlUtils = {
    AMP_RE: /&/gm,
    GT_RE: />/gm,
    LT_RE: /</gm,
    SQUOT_RE: /'/gm,
    QUOT_RE: /"/gm,
    htmlEscape: function(s) {
        if (s.indexOf("&") !== -1) {
            s = s.replace(SafeHtmlUtils.AMP_RE, '&amp;');
        }
        if (s.indexOf("<") !== -1) {
            s = s.replace(SafeHtmlUtils.LT_RE, '&lt;');
        }
        if (s.indexOf(">") !== -1) {
            s = s.replace(SafeHtmlUtils.GT_RE, '&gt;');
        }
        if (s.indexOf("\"") !== -1) {
            s = s.replace(SafeHtmlUtils.QUOT_RE, '&quot;');
        }
        if (s.indexOf("'") !== -1) {
            s = s.replace(SafeHtmlUtils.SQUOT_RE, '&#39;');
        }
        return s;
    }
};