/* 
 * Copyright 2014 jarrod.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


angular.module('arc.fsHistory', [])
.provider('fsHistory', function() {
    
        var syncable = true;
        
        this.setSyncable = function(value){
            syncable = value;
        };
        
        function toArray(list) {
            return Array.prototype.slice.call(list || [], 0);
        }

        
        var FsHistoryProvider = {
            '$get': ['$q', 'LocalFs', 'SyncableFs',
                function($q, LocalFs, SyncableFs){
                    
                    Object.defineProperty(FsHistoryProvider, 'factory', {
                        get: function() {
                            return syncable ? SyncableFs : LocalFs;
                        }
                    });
                    
                    var getFile = function(filename){
                        var defered = $q.defer();
                        FsHistoryProvider.factory.requestFilesystem()
                        .then(function(fs){
                            fs.root.getFile(filename, {create: true}, function(fileEntry) {
                                defered.resolve(fileEntry);
                            }, function(error){
                                defered.reject(error);
                            });
                        })
                        .catch(defered.reject);
                        return defered.promise;
                    };
                    
                    var readFile = function(fileEntry){
                        var defered = $q.defer();
                        fileEntry.file(function(file) {
                            var reader = new FileReader();
                            reader.onloadend = function(e) {
                                defered.resolve(this.result);
                            };
                            reader.onerror = function(error) {
                                defered.reject(error);
                            };
                            reader.readAsText(file);
                        }, function(error){
                            defered.reject(error);
                        });
                        return defered.promise;
                    };
                    
                    var getFileContents = function(filename){
                        var defered = $q.defer();
                        getFile(filename)
                        .then(readFile)
                        .then(defered.resolve)
                        .catch(defered.reject);
                        return defered.promise;
                    };
                    /**
                     * 
                     * @param {FileEntry|String} file Either FileEntry or name.
                     * @returns {$q@call;defer.promise}
                     */
                    var writeFile = function(file, data, mime){
                        if(typeof file !== 'string'){
                            return writeFileEntry(file, data, mime);
                        }
                        
                        var defered = $q.defer();
                        getFile(file)
                        .then(function(fileEntry){
                            return writeFileEntry(fileEntry, data, mime);
                        })
                        .then(defered.resolve)
                        .catch(defered.reject);
                        
                        return defered.promise;
                    };
                    /**
                     * 
                     * @param {FileEntry} fileEntry FileEntry for write to
                     * @param {String|ArrayBuffer} data Data to write
                     * @param {type} mime Files mime type.
                     * @returns {$q@call;defer.promise}
                     */
                    var writeFileEntry = function(fileEntry, data, mime){
                        var defered = $q.defer();
                        fileEntry.createWriter(function(fileWriter) {
                            fileWriter.onwriteend = function(e) {
                                defered.resolve();
                            };
                            fileWriter.onerror = function(e) {
                                defered.reject(e);
                            };
                            var toWrite;
                            if(typeof data === 'string'){
                                toWrite = [data];
                            } else {
                                toWrite = data;
                            }
                            var blob = new Blob(toWrite, {type: mime});
                            fileWriter.write(blob);
                        }, defered.reject);
                        return defered.promise;
                    };
                    
                    var deleteFile = function(fileEntry){
                        var defered = $q.defer();
                        fileEntry.remove(defered.resolve,defered.reject);
                        return defered.promise;
                    };
                    
                    
                    //
                    // Factory functions.
                    //
                    var listHistory = function(){
                        var defered = $q.defer();
                        //get all files started with 'h_';
                        FsHistoryProvider.factory.requestFilesystem()
                        .then(function(fs){
                            var dirReader = fs.root.createReader();
                            var entries = [];
                            var readEntries = function() {
                                dirReader.readEntries (function(results) {
                                    if (!results.length) {
                                        defered.resolve(entries.sort());
                                    } else {
                                        entries = entries.concat(toArray(results));
                                        readEntries();
                                    }
                                }, defered.reject);
                            };
                            readEntries();
                        });
                        
                        return defered.promise;
                    };
                    
                    var getHistoryEntry = function(fileKey){
                        var defered = $q.defer();
                        var filename = 'h_' + fileKey;
                        getFileContents(filename)
                        .then(defered.resolve)
                        .catch(defered.reject);
                        return defered.promise;
                    };
                    
                    var setHistoryEntry = function(fileKey, content){
                        if((typeof fileKey === 'string') && fileKey.indexOf('h_') !== 0){
                            fileKey = 'h_' + fileKey;
                        }
                        if(typeof content !== 'string'){
                            content = JSON.stringify(content);
                        }
                        
                        var defered = $q.defer();
                        writeFile(fileKey, content, 'application/json')
                        .then(defered.resolve)
                        .catch(defered.reject);
                        return defered.promise;
                    };
                    
                    var removeHistoryEntry = function(fileKey){
                        if((typeof fileKey === 'string') && fileKey.indexOf('h_') !== 0){
                            fileKey = 'h_' + fileKey;
                        }
                        var defered = $q.defer();
                        getFile(fileKey).then(function(fileEntry){
                            return deleteFile(fileEntry);
                        }).then(defered.resolve).catch(defered.reject);
                        return defered.promise;
                    };
                    
                    return {
                        'list': listHistory,
                        'get': getHistoryEntry,
                        'set': setHistoryEntry,
                        'remove': removeHistoryEntry
                    };
                }]
        };
        
        return FsHistoryProvider;
})
.factory('SyncableFs',['$q', function($q){
        /**
         * @ngdoc overvew
         * @name SyncableFs.requestFilesystem
         * 
         * @description Returns a syncable filesystem backed by Google Drive. 
         * The returned DOMFileSystem instance can be operated on in the same 
         * way as the Temporary and Persistant file systems 
         * (see http://www.w3.org/TR/file-system-api/), except that 
         * the filesystem object returned for Sync FileSystem does NOT support 
         * directory operations (yet). You can get a list of file entries 
         * by reading the root directory (by creating a new DirectoryReader), 
         * but cannot create a new directory in it.
         * 
         * Calling this multiple times from the same app will return the same 
         * handle to the same file system.
         * 
         * @returns {$q@call;defer.promise} Promise will result with
         * DOMFileSystem object.
         */
        var requestFilesystem = function(){
            var defered = $q.defer();
            chrome.syncFileSystem.requestFileSystem(function(fileSystem){
                defered.resolve(fileSystem);
            });
            return defered.promise;
        };
        /**
         * @ngdoc overvew
         * @name SyncableFs.getUsageAndQuota
         * 
         * @description Returns the current usage and quota in bytes for the 
         * 'syncable' file storage for the app.
         * 
         * 
         * @returns {$q@call;defer.promise} Promise will result with 'syncable'
         * filesystem status. Object will have folowwing keys: 
         * - usageBytes (integer) 
         * - quotaBytes (integer) 
         */
        var getUsageAndQuota = function(){
            var defered = $q.defer();
            
            requestFilesystem()
            .then(function(fs){
                chrome.syncFileSystem.getUsageAndQuota(fs, function(info){
                    defered.resolve(info);
                });
            });
            
            return defered.promise;
        };
        /**
         * @ngdoc overvew
         * @name SyncableFs.getFileStatus
         * 
         * @description Returns the FileStatus for the given fileEntry. 
         * 
         * @param {Object} fileEntry The fileEntry
         * 
         * @returns {$q@call;defer.promise} Promise will result with FileStatus: 
         * The status value can be 'synced', 'pending' or 'conflicting'. 
         * Note that 'conflicting' state only happens when the service's 
         * conflict resolution policy is set to 'manual'
         */
        var getFileStatus = function(fileEntry){
            var defered = $q.defer();
            chrome.syncFileSystem.getFileStatus(fileEntry, function(status){
                defered.resolve(status);
            });
            return defered.promise;
        };
        /**
         * @ngdoc overvew
         * @name SyncableFs.getFileStatuses
         * 
         * @description Returns each FileStatus for the given fileEntry array. 
         * Typically called with the result from dirReader.readEntries().
         * 
         * @param {Array} fileEntriesArray array of object fileEntries
         * 
         * @returns {$q@call;defer.promise} Promise will result with an array 
         * of objects, where keys are: 
         *  - fileEntry - One of the Entry's originally given to getFileStatuses.
         *  - status - The status value can be 'synced', 'pending' or 'conflicting'.
         *  - error (optional) - Optional error that is only returned if there 
         *      was a problem retrieving the FileStatus for the given file.
         */
        var getFileStatuses = function(fileEntriesArray){
            var defered = $q.defer();
            chrome.syncFileSystem.getFileStatuses(fileEntriesArray, function(statusesArray){
                defered.resolve(statusesArray);
            });
            return defered.promise;
        };
        /**
         * @ngdoc overvew
         * @name SyncableFs.getServiceStatus
         * 
         * @description Returns the current sync backend status.
         * 
         * @returns {$q@call;defer.promise} Promise will result with one of 
         * states: "initializing", "running", "authentication_required", 
         * "temporary_unavailable", or "disabled"
         */
        var getServiceStatus = function(){
            var defered = $q.defer();
            chrome.syncFileSystem.getServiceStatus(function(status){
                defered.resolve(status);
            });
            return defered.promise;
        };
        
        var service = {
            'requestFilesystem': requestFilesystem,
            'getUsageAndQuota': getUsageAndQuota,
            'getFileStatus': getFileStatus,
            'getFileStatuses': getFileStatuses,
            'getServiceStatus': getServiceStatus
        };
        
        return service;
}])
.factory('LocalFs',['$q', function($q){
    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
    var storageQuota = 512 * 1024 * 1024;
    /**
     * @ngdoc overvew
     * @name LocalFs.requestFilesystem
     * 
     * @description Request a local filesystem.
     * 
     * @returns {$q@call;defer.promise} Promise will result with
     * DOMFileSystem object.
     */
    var requestFilesystem = function() {
        var defered = $q.defer();
        
        var onInit = function(fs){
            defered.resolve(fs);
        };
        var onError = function(e){
            defered.reject(e);
        };
        
        navigator.webkitPersistentStorage.requestQuota(PERSISTENT, storageQuota, function(grantedBytes) {
            window.requestFileSystem(window.PERSISTENT, grantedBytes, onInit, onError);
        }, onError);
        return defered.promise;
    };
    /**
     * @ngdoc overvew
     * @name LocalFs.getUsageAndQuota
     * 
     * @description Returns the current usage and quota in bytes for the 
     * local file storage for the app.
     * 
     * 
     * @returns {$q@call;defer.promise} Promise will result with local
     * filesystem usage and quota status. Object will have folowing keys: 
     * - usageBytes (integer) 
     * - quotaBytes (integer) 
     */
    var getUsageAndQuota = function(){
        var defered = $q.defer();

        navigator.webkitPersistentStorage.queryUsageAndQuota(
            function(currentUsageInBytes, currentQuotaInBytes){
                defered.resolve({
                    'usageBytes': currentUsageInBytes,
                    'quotaBytes': currentQuotaInBytes
                });
            }, function(e){
                defered.reject(e);
            });

        return defered.promise;
    };
    /**
     * @ngdoc overvew
     * @name LocalFs.getFileStatus
     * 
     * @description Since local FS doesn't have sync status this function
     * will always return 'synced' (as a fallback to OK result for synced FS)
     * 
     * @param {Object} fileEntry The fileEntry
     * 
     * @returns {$q@call;defer.promise} Promise will result with 'synced'
     * status to be aligned with 'synced' FS as a OK response.
     */
    var getFileStatus = function(fileEntry){
        var defered = $q.defer();
        defered.resolve('synced');
        return defered.promise;
    };
   /**
    * @ngdoc overvew
    * @name LocalFs.getFileStatuses
    * 
    * @description Since local FS doesn't have sync status this function
     * will always return 'synced' for all files in the array (as a fallback 
     * to OK result for synced FS)
    * 
    * @param {Array} fileEntriesArray array of object fileEntries
    * 
    * @returns {$q@call;defer.promise} Promise will result with an array 
    * of objects, where keys are: 
    *  - fileEntry - One of the Entry's originally given to getFileStatuses.
    *  - status - Always 'synced'
    */
   var getFileStatuses = function(fileEntriesArray){
       var defered = $q.defer();
       var result = [];
       for(var i=0, len=fileEntriesArray.length; i<len; i++){
           result[result.length] = {
               'fileEntry': fileEntriesArray[i],
               'status': 'synced'
           };
       }
       return defered.promise;
    };
    /**
     * @ngdoc overvew
     * @name LocalFs.getServiceStatus
     * 
     * @description For local FS this function can only result with 'running' status.
     * 
     * @returns {$q@call;defer.promise} Promise will result with "running" status
     */
    var getServiceStatus = function(){
        var defered = $q.defer();
        defered.resolve('running');
        return defered.promise;
    };
    
    var service = {
        'requestFilesystem': requestFilesystem,
        'getUsageAndQuota': getUsageAndQuota,
        'getFileStatus': getFileStatus,
        'getFileStatuses': getFileStatuses,
        'getServiceStatus': getServiceStatus
    };

    return service;
}]);