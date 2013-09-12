if (typeof window === 'undefined') {
    window = {};
    window.indexedDB = indexedDB;
    window.IDBKeyRange = IDBKeyRange || webkitIDBKeyRange;
}

importScripts('../idbstore.min.js');
importScripts('../apphelper.js');

var history;
var initialized = false;

function initialize(clb) {
    if (initialized) {
        setTimeout(clb, 0);
        return;
    }

    history = new IDBStore({
        storeName: 'history',
        onStoreReady: function() {
            initialized = true;
            setTimeout(clb, 0);
        }
    });
}

onmessage = function(e) {
    var cmd = e.data.cmd,
        id = e.data.id; //callback ID;

    switch (cmd) {
        case 'savehistory':
            initialize(function() {
                saveHistory(e.data.requestData, function(data) {
                    postMessage({'msg': 'savehistory', 'data': data, 'id': id});
                });
            });
            break;
        case 'savehistoryresponse':
            initialize(function() {
                saveHistoryResponse(e.data.historyId, e.data.responseData, function(data) {
                    postMessage({'msg': 'savehistoryresponse', 'data': data, 'id': id});
                });
            });
            break;
    }
};







function saveHistory(requestData, clb) {
    requestData = new RequestObject(requestData);

    var keyRange,
            options = {};
    var options = {};
    options.lower = requestData.url;
    options.upper = requestData.url;
    keyRange = history.makeKeyRange(options);
    var result = [];
    var onItem = function(item) {
        result[result.length] = item;
    };
    var insert = function(data) {
        var fileFieldNames = [];
        data.files = data.files || [];
        data.files.forEach(function(file) {
            fileFieldNames[fileFieldNames.length] = file.key;
        });

        var saveData = {
            'url': data.url,
            'time': Date.now(),
            'hit': 1,
            'payload': data.payload,
            'files': fileFieldNames,
            'headers': data.headers,
            'method': data.method
        };
        history.put(saveData, function(id) {
            clb.call(this, id);
        }, function(error) {
            clb.call(this, null);
        });
    };
    var onEnd = function() {
        if (result.length === 0) {
            insert(requestData);
            return;
        }

        for (var i = 0, len = result.length; i < len; i++) {
            var item = result[i];
            if (requestData.compare(item)) {
                //update
                item.hit++;
                item.time = Date.now();
                history.put(item, function(id) {
                    clb.call(this, id);
                }, function(error) {
                    clb.call(this, null);
                });
                return;
            }
        }

        insert(requestData);
    };
    history.iterate(onItem, {
        index: 'url',
        keyRange: keyRange,
        filterDuplicates: false,
        onEnd: onEnd,
        autoContinue: true
    });
}


function saveHistoryResponse(historyId, responseData, callback) {
    if (typeof callback !== 'function') {
        callback = function() {
        };
    }

    history.get(historyId, function(data) {
        if (!data.responses || !data.responses instanceof Array) {
            data.responses = [];
        }
        responseData.time = new Date().getTime();
        data.responses.push(responseData);
        history.put(data, function(id) {
            callback.call(this, data);
        }, function(error) {
            callback.call(this, error);
        });
    }.bind(this), function(error) {
        callback(error);
    });
}