const DB_VERSION = 2;

/**
 * Listen for app install, app update or chrome update.
 * In case of install, create database schema and set
 * initianal settings.
 * @param {Object} details
 */
chrome.runtime.onInstalled.addListener(function(details) {
//    console.log('onInstalled',details);
//    var action;
//    var clb = function() {
//        if (!!action) {
//            action = null;
//        }
//    };
//    switch (details.reason) {
//        case 'install':
//            action = new AppInstaller().install(clb);
//            break;
//        case 'update':
////            action = new AppInstaller().upgrade(details.previousVersion, clb);
//            action = null;
//            break;
//        case 'chrome_update':
//            break;
//    }
});



chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'id': 'arcMainWindow',
    'minWidth': 1280,
    'minHeight': 800
  });
});


function AppInstaller() {
    this.installComplete = function() {
    };
}
AppInstaller.prototype = {
    constructor: AppInstaller,
    install: function(installComplete) {
        console.warn('Thank you for choosing Advanced Rest Client :)');
        console.warn('Now I\'m installing');

        this.installComplete = installComplete;
        this._doInstall();
        return this;
    },
    upgrade: function(previousVersion, installComplete) {
        console.warn('Thank you for choosing Advanced Rest Client :)');
        console.warn('Now I\'m upgrading');

        this._doUpgrade(installComplete);

        return this;
    },
    _doUpgrade: function(realCallback) {
        //set local storage
        //first check if there is synced values

        ///items stored in sync already by prev version
        var syncValues = {
            CMH_ENABLED: null,
            CMP_ENABLED: null,
            DEBUG_ENABLED: null, //key to delete
            MAGICVARS_ENABLED: null,
            NOTIFICATIONS_ENABLED: null
        };
        var context = this;
        chrome.storage.sync.get(syncValues, function(data) {
            
            var oldValues = {
                JSONHEADERS: null,
                SHORTCUTS: null,
                tutorials: null
            };
            
            chrome.storage.local.get(oldValues, function(oldData){
                var shortcutsList = [{"cmd": ["ctrl+o", "command+o"], "action": "OPEN_REQUEST"}, {"cmd": ["command+s", "ctrl+s"], "action": "SAVE_REQUEST"}];
                var localShortcuts = null;
                if (!!oldData.SHORTCUTS) {
                    try {
                        localShortcuts = JSON.parse(oldData.SHORTCUTS);
                        shortcutsList = [];
                        for (var i = 0, len = localShortcuts.length; i < len; i++) {
                            var current = localShortcuts[i];
                            if (!current.t)
                                continue;
                            var cmd = "";
                            if (current.a) {
                                cmd += "alt+";
                            }
                            if (current.c) {
                                cmd += "ctrl+";
                            }
                            if (current.a) {
                                cmd += "shift+";
                            }
                            cmd += String.fromCharCode(current.k);
                            shortcutsList[shortcutsList.length] = {
                                "action": current.t,
                                "cmd": cmd
                            };
                        }
                    } catch (e) {
                    }
                }
                var syncValuesSet = {
                    'JSONHEADERS': !!oldData.JSONHEADERS ? ["application/json", "text/json", "text/x-json"] : oldData.JSONHEADERS,
                    'SHORTCUTS': shortcutsList,
                    'tutorials': !!oldData.tutorials ? null : oldData.tutorials,
                    'detailedurlpanel': false,
                    "headersTab": "HttpHeadersRaw",
                    "payloadTab": "HttpPayloadRaw"
                };
                
                if (data.CMH_ENABLED === true) {
                    syncValuesSet.headers_cm = true;
                } else {
                    syncValuesSet.headers_cm = false;
                }
                if (data.CMP_ENABLED === true) {
                    syncValuesSet.payload_cm = true;
                } else {
                    syncValuesSet.payload_cm = false;
                }
                chrome.storage.sync.set(syncValuesSet, function() {
                    console.log('Sync storage values set.');
                });
                
                context.installComplete = function() {
                    //TODO: copy data from WebSQL to IndexedDB
                    realCallback.call(context);
                };
                
                context._addAssetsToDb();
            });
            
        });
    },
    _doInstall: function() {
        //shortcuts: ["cmd":["shortcuts list like: ctrl+s"], "action":"OPEN_REQUEST"]
        var syncValuesSet = {
            'JSONHEADERS': ["application/json", "text/json", "text/x-json"],
            'SHORTCUTS': [{"cmd": ["ctrl+o", "command+o"], "action": "OPEN_REQUEST"}, {"cmd": ["command+s", "ctrl+s"], "action": "SAVE_REQUEST"}],
            'tutorials': null,
            'detailedurlpanel': false,
            "headersTab": "HttpHeadersRaw",
            "payloadTab": "HttpPayloadRaw",
            "headers_cm": true,
            "payload_cm": true,
            'latestrequest': JSON.stringify({'url': 'https://gdata.youtube.com/feeds/api/playlists/OU2XLYxmsIKNXidK5HZsHu9T7zs6nxwK/?v=2&alt=json&feature=plcp'})
        };

        chrome.storage.sync.set(syncValuesSet, function() {
            console.log('Sync storage values set.');
        });
        this._addAssetsToDb();
    },
    _addAssetsToDb: function() {
        // get definitions data
        this.getAsset('js/definitions.json', function(data) {
            if (data === null) {
                //nothing
            } else {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('Error parsing asset', e);
                }
            }
            var putHeaders = [],
                    putStatus = [];
            if (!!data) {
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
                var save = {};
                if (!!data.notSupportedW3CHeaders) {
                    save.notSupportedW3CHeaders = data.notSupportedW3CHeaders;
                }
                if (!!data.browserDefaultHeaders) {
                    save.browserDefaultHeaders = data.browserDefaultHeaders;
                }
                chrome.storage.sync.set(save);
            }
            this._initializeDatabases(putHeaders, putStatus);

        }.bind(this));
    },
    _initializeDatabases: function(headers, statuses) {
        var context = this;
        var callbacksCount = 4;
        var callback = function() {
            this.installComplete();
        };

        new IDBStore({
            dbVersion: DB_VERSION,
            storeName: 'headers',
            keyPath: 'id',
            autoIncrement: true,
            onStoreReady: function() {
                this.batch(headers, function() {
                    console.log('Headers definitions updated');
                    callbacksCount--;
                    if (callbacksCount === 0) {
                        callback.call(context);
                    }
                }, function(e) {
                    console.error('Headers definitions not updated', e);
                    callbacksCount--;
                    if (callbacksCount === 0) {
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
            dbVersion: DB_VERSION,
            storeName: 'statuses',
            keyPath: 'id',
            autoIncrement: true,
            onStoreReady: function() {
                this.batch(statuses, function() {
                    console.log('Statuses definitions updated');
                    callbacksCount--;
                    if (callbacksCount === 0) {
                        callback.call(context);
                    }
                }, function(e) {
                    console.error('Statuses definitions not updated', e);
                    callbacksCount--;
                    if (callbacksCount === 0) {
                        callback.call(context);
                    }
                });
            },
            indexes: [{name: 'code', keyPath: 'code', unique: false, multiEntry: false}]
        });
        new IDBStore({
            dbVersion: DB_VERSION,
            storeName: 'history',
            keyPath: 'historyid',
            autoIncrement: true,
            onStoreReady: function() {
                console.log('Initialized history storage');
                callbacksCount--;
                if (callbacksCount === 0) {
                    callback.call(context);
                }
            },
            indexes: [
                {name: 'url', keyPath: 'url', unique: false, multiEntry: false},
                {name: 'time', keyPath: 'time', unique: true, multiEntry: false}
            ]
        });
        new IDBStore({
            dbVersion: DB_VERSION,
            storeName: 'requests',
            keyPath: 'requestid',
            autoIncrement: true,
            onStoreReady: function() {
                console.log('Initialized requests storage');
                callbacksCount--;
                if (callbacksCount === 0) {
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
    getAsset: function(asset, callback) {
        var context = this;
        var request = new XMLHttpRequest();
        request.open('GET', asset, true);
        request.addEventListener('load', function(e) {
            callback.call(context, request.responseText);
        });
        request.addEventListener('error', function(e) {
            console.error('Error downloading asset');
            callback.call(context, null);
        });
        request.send();
    }
};

var CLIENT_ID = '10525470235.apps.googleusercontent.com';
window.googleAuth = null;
function initOauth2Object() {
    window.googleAuth = new OAuth2('google', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        api_scope: SCOPES
    });
}

var Drive = {
    authDrive: function(callback) {
        if (!window.googleAuth) {
            initOauth2Object();
        }
        var at = window.googleAuth.getAccessToken();
        if (at && window.googleAuth.isAccessTokenExpired()) {
            at = null;
        }
        if(!at){
            window.googleAuth.authorize(function() {
                var at = window.googleAuth.getAccessToken();
                callback(Drive._prepareAuthObject(at));
            });
            return;
        }
        callback(Drive._prepareAuthObject(at));
    },
    _prepareAuthObject: function(at) {
        var data = null;
        if (at) {
            data = {
                'access_token': at,
                'expires_in': window.googleAuth.get('expiresIn') - (~~((Date.now() - window.googleAuth.get('accessTokenDate')) / 1000))
            };
        }
        return data;
    }
}