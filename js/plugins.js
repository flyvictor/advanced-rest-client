
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
        
        chrome.storage.local.set(obj, callback);
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
        chrome.storage.local.get(key, callback);
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