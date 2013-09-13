/***********************************************************
 // * 
 // *    THIS FILE IS INCLUDED BY WEBWORKER.
 // *    DO NOT MAKE ANY REFERENCE TO document or window OBJECT
 // *    (at least not in the closure).
 // *
 // ********************************************************/

function RequestObject(initialData) {
    this.url = initialData.url || null;
    this.method = initialData.method || null;
    this.headers = initialData.headers || null;
    this.payload = initialData.payload || null;
    this.files = initialData.files || [];
}
RequestObject.prototype = {
    constructor: RequestObject,
    /**
     * Compare to request objects.
     * @param {Object|RequestObject} other
     * @returns {Boolean} true if every value of the request object is equal.
     */
    compare: function(other) {
        // not the same if url is different
        if (other.url !== this.url) {
            return false;
        }
        if (other.method !== this.method) {
            return false;
        }

        if (this.payload === null && other.payload === "") {
            this.payload = '';
        }

        if (other.payload !== this.payload) {
            return false;
        }

        if (other.files.length !== this.files.length) {
            return false;
        } else {
            for (var i = 0, len = other.files.length; i < len; i++) {
                if (other.files.indexOf(this.files[i].key) === -1) {
                    return false;
                }
            }
        }

        if (this.headers.length !== other.headers.length) {
            return false;
        } else {
            var headers = this.headers;
            var checkHeaders = other.headers;
            for (var i = 0, len = headers.length; i < len; i++) {
                var headerData = headers[i];
                var key = headerData.key;
                var found = false;
                for (var j = 0, jLen = checkHeaders.length; j < jLen; j++) {
                    if (checkHeaders[j].key === key) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return false;
                }
            }
        }
        return true;
    }
};

function createCustomeEvent(name, details) {
    if (typeof details === 'undefined')
        details = {};
    var opt = {
        detail: details,
        bubbles: true,
        cancelable: true
    };
    return new CustomEvent(name, opt);
}