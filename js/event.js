/**
 * Listen for app install, app update or chrome update.
 * In case of install, create database schema and set
 * initianal settings.
 * @param {Object} param
 */
chrome.runtime.onInstalled.addListener(function(details){
    var action;
    var clb = function(){
        if(!!action){
            action = null;
        }
    }
    switch(details.reason){
        case 'install': 
            action = new AppInstaller().install(clb);
            break;
        case 'update': 
            action = new AppInstaller().upgrade(details.previousVersion, clb);
            action = null;
            break;
        case 'chrome_update': break;
    }
});

function AppInstaller(){
    this.installComplete = function(){}
}
AppInstaller.prototype = {
    constructor: AppInstaller,
    
    install: function(installComplete){
        console.warn('Thank you for choosing Advanced Rest Client :)');
        console.warn('Now I\'m installing');
        
        this.installComplete = installComplete;
        this._doInstall();
        return this;
    },
    upgrade: function(previousVersion, installComplete){
        console.warn('Thank you for choosing Advanced Rest Client :)');
        console.warn('Now I\'m upgrading');
        
        this.installComplete = installComplete;
        
        return this;
    },
    
    _doInstall: function(){
        // get definitions data
        this.getAsset('js/definitions.json', function(data) {
            if(data == null){
                //nothing
            } else {
                try{
                    data = JSON.parse(data);
                } catch(e){
                    console.error('Error parsing asset', e);
                }
            }
            var putHeaders = [],
                putStatus = [];
            
            
            if (!!data){
                if (!!data.requests) {
                    data.requests.forEach(function(headers) {
                        headers.label = headers.key;
                        delete headers.key;
                        headers.type = 'request';
                        putHeaders[putHeaders.length] = {type: "put", value: headers};
                    });
                    data.responses.forEach(function(headers) {
                        headers.label = headers.key;
                        delete headers.key;
                        headers.type = 'response';
                        putHeaders[putHeaders.length] = {type: "put", value: headers};
                    });
                }
                if (!!data.codes) {
                    data.codes.forEach(function(code) {
                        code.code = code.key;
                        delete code.key;
                        putStatus[putStatus.length] = {type: "put", value: code};
                    });
                }
                var save = {}
                if(!!data.notSupportedW3CHeaders){
                    save.notSupportedW3CHeaders = data.notSupportedW3CHeaders;
                }
                if(!!data.browserDefaultHeaders){
                    save.browserDefaultHeaders = data.browserDefaultHeaders;
                }
                chrome.storage.local.set(save);
            }
            this._initializeDatabases(putHeaders, putStatus);
            
        }.bind(this));
    },
    
    _initializeDatabases: function(headers, statuses){
        var context = this;
        var callbacksCount = 4;
        var callback = function(){
            this.installComplete();
        };
        
        new IDBStore({
            dbVersion: 1,
            storeName: 'headers',
            keyPath: 'id',
            autoIncrement: true,
            onStoreReady: function() {
                this.batch(headers, function(){
                    console.log('Headers definitions updated');
                    callbacksCount--;
                    if(callbacksCount == 0){
                        callback.call(context);
                    }
                }, function(e){
                    console.error('Headers definitions not updated', e);
                    callbacksCount--;
                    if(callbacksCount == 0){
                        callback.call(context);
                    }
                });
            },
            indexes: [
                {name: 'label', keyPath: 'label', unique: false, multiEntry: false},
                {name: 'type', keyPath: 'type', unique: false, multiEntry: false}
            ]
        });
        new IDBStore({
            dbVersion: 1,
            storeName: 'statuses',
            keyPath: 'id',
            autoIncrement: true,
            onStoreReady: function() {
                this.batch(statuses, function(){
                    console.log('Statuses definitions updated');
                    callbacksCount--;
                    if(callbacksCount == 0){
                        callback.call(context);
                    }
                }, function(e){
                    console.error('Statuses definitions not updated', e);
                    callbacksCount--;
                    if(callbacksCount == 0){
                        callback.call(context);
                    }
                });
            },
            indexes: [{name: 'code', keyPath: 'code', unique: false, multiEntry: false}]
        });
        new IDBStore({
            dbVersion: 1,
            storeName: 'history',
            keyPath: 'historyid',
            autoIncrement: true,
            onStoreReady: function() {
                console.log('Initialized history storage');
                callbacksCount--;
                if(callbacksCount == 0){
                    callback.call(context);
                }
            },
            indexes: [
                {name: 'url', keyPath: 'url', unique: false, multiEntry: false},
                {name: 'time', keyPath: 'time', unique: true, multiEntry: false}
            ]
        });
        new IDBStore({
            dbVersion: 1,
            storeName: 'requests',
            keyPath: 'requestid',
            autoIncrement: true,
            onStoreReady: function() {
                console.log('Initialized requests storage');
                callbacksCount--;
                if(callbacksCount == 0){
                    callback.call(context);
                }
            },
            indexes: [
                {name: 'url', keyPath: 'url', unique: false, multiEntry: false},
                {name: 'time', keyPath: 'time', unique: true, multiEntry: false},
                {name: 'project', keyPath: 'project', unique: false, multiEntry: false},
                {name: 'name', keyPath: 'name', unique: false, multiEntry: false}
            ]
        });
    },
    
    
    getAsset: function(asset, callback){
        var context = this;
        var request = new XMLHttpRequest();
        request.open('GET',asset,true);
        request.addEventListener('load', function(e){
            callback.call(context, request.responseText);
        });
        request.addEventListener('error', function(e){
            console.error('Error downloading asset');
            callback.call(context, null);
        });
        request.send();
    }
}