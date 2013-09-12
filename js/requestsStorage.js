
/**
 * This object store Request related data
 * like history, request itself, project data or response for request
 * @param {Object} appStorage Reference to apps storage object.
 * @returns {Object}
 */
function RequestsStorage(appStorage){
    this.appStore = appStorage;
    this._worker = null;
    this.proxydata = {};
}
RequestsStorage.prototype = {
    constructor: RequestsStorage,
    
    get worker(){
        if(this._worker === null){
            this._worker = new Worker(chrome.runtime.getURL('js/workers/historystore.js'));
            this._worker.addEventListener('message', this._onMessage.bind(this), false);
        }
        return this._worker;
    },
    
    someId: function (){
        return window.performance.now();
    },
    
    _onMessage: function(e){
        var msg = e.data.msg,
            id = e.data.id;
        if(!id) return;
        var appData = this.proxydata[id];
        if(!appData) return;
        delete this.proxydata[id];
        
        switch (msg) {
            case 'savehistory':
                appData.clb.call(window, e.data.data);
            break;
            case 'savehistoryresponse':
                appData.clb.call(window, e.data.data);
            break;
        }
    },
    
    /**
     * Store request in history storage.
     * If the request already exist in the store it only updates its counter.
     * 
     * Use request counter to determine order in URL's suggestions field.
     * 
     * @param {Object} requestData - The request data to save. Only required parameter is the URL.
     * @param {Function} clb - callback function to call after save. It will handle one 
     * @returns {Void}
     */
    saveHistory: function(requestData, clb){
        if(typeof clb !== 'function'){
            clb = function(){};
        }
        var id =  this.someId();
        this.proxydata[id] = {
            'clb': clb
        };
        this.worker.postMessage({cmd: 'savehistory', 'requestData': requestData, 'id': id});
        
//        
//        requestData = new RequestObject(requestData);
//        //check if the same request already exists
//        var context = this;
//        var keyRange,
//        options = {};
//        var options = {};
//        options.lower = requestData.url;
//        options.upper = requestData.url;
//        keyRange = this.appStore.history.makeKeyRange(options);
//        var result = [];
//        var onItem = function(item) {
//            result[result.length] = item;
//        };
//        var insert = function(data){
//            var fileFieldNames = [];
//            data.files = data.files || [];
//            data.files.forEach(function(file){
//                fileFieldNames[fileFieldNames.length] = file.key;
//            });
//            
//            var saveData = {
//                'url': data.url,
//                'time': Date.now(),
//                'hit': 1,
//                'payload': data.payload,
//                'files': fileFieldNames,
//                'headers': data.headers,
//                'method': data.method
//            };
//            context.appStore.history.put(saveData, function(id){
//                clb.call(window, id);
//            }, function(error){
//                clb.call(window, null);
//            });
//        };
//        var onEnd = function() {
//            if(result.length === 0){
//                insert(requestData);
//                return;
//            }
//            
//            for(var i=0, len = result.length; i<len; i++){
//                var item = result[i];
//                if(requestData.compare(item)){
//                    //update
//                    item.hit++;
//                    item.time = Date.now();
//                    context.appStore.history.put(item, function(id){
//                        clb.call(window, id);
//                    }, function(error){
//                        clb.call(window, null);
//                    });
//                    return;
//                }
//            }
//            
//            insert(requestData);
//        };
//        this.appStore.history.iterate(onItem, {
//            index: 'url',
//            keyRange: keyRange,
//            filterDuplicates: false,
//            onEnd: onEnd,
//            autoContinue: true
//        });
    },
    
    /**
     * Save response data in indexed DB.
     * @param {Number} historyId - Required ID of the history object.
     * @param {Object|RequestObject} responseData - response data to save
     *      it accepts object with following keys:
     *      "ERROR" - 
     *      "REDIRECT_DATA" - array of redirect objects
     *      "REQUEST_HEADERS" - array of objects with "key", "name" keys
     *      "RESPONSE_HEADERS" - array of objects with "key", "name" keys
     *      "URL" - final (after all redirects!) url
     *      "requestedUrl" - an URL from user input
     *      "response" - String with response
     *      "status" - int response status
     *      "statusText" - String response status text.
     * @param {type} callback
     * @returns {undefined}
     */
    saveHistoryResponse: function(historyId, responseData, callback){
        if(typeof callback !== 'function'){
            callback = function(){};
        }
        
        var id =  this.someId();
        
        this.proxydata[id] = {
            'clb': callback
        };
        
        this.worker.postMessage({cmd: 'savehistoryresponse', id: id, 'historyId': historyId, 'responseData': responseData });
        
//        this.appStore.history.get(historyId, function(data){
//            if(!data.responses || !data.responses instanceof Array){
//                data.responses = [];
//            }
//            responseData.time = new Date().getTime();
//            data.responses.push(responseData);
//            this.appStore.history.put(data, function(id){
//                callback.call(window, data);
//            }, function(error){
//                callback.call(window, error);
//            });
//        }.bind(this), function(error){
//            callback(error);
//        });
    }
};