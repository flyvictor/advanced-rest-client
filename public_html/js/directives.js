var ArcDirectives = angular.module('arc.directives', []);

ArcDirectives.config(['$compileProvider', function($compileProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\/|filesystem:chrome-extension/);
    }]);

ArcDirectives.directive('appVersion', ['version', function(version) {
        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }]);

ArcDirectives.directive('httpHeaderEditor', ['$q','Definitions',function($q,Definitions) {
        return {
            restrict: 'E',
            scope: {
                'header': '=',
                'extSuggestion': '&suggestion',
                'remove': '&onRemove'
            },
            controller: function($scope) {
                $scope.valuePlaceholder = '';
                var requestHeaders = null;
                var cache = {};
                
                var getQueryResult = function(query){
                    if(!requestHeaders) return [];
                    
                    if(query in cache){
                        return cache[query];
                    }
                    
                    if(query.trim() === ''){
                        return requestHeaders;
                    }
                    
                    query = query.toLowerCase();
                    var result = requestHeaders.filter(function(element){
                        return element.value.toLowerCase().indexOf(query) !== -1;
                    });
                    cache[query] = result;
                    return result;
                };
                
                $scope.query = function(query){
                    var defered = $q.defer();
                    if(requestHeaders !== null){
                        defered.resolve(getQueryResult(query));
                        return defered.promise;
                    }
                    
                    Definitions.get('request-headers')
                    .then(function(headers){
                        var displays = [];
                        headers.data.forEach(function(item){
                            displays[displays.length] = {
                                'value': item.key,
                                'display': item.key,
                                'example': item.example
                            };
                        });
                        requestHeaders = displays;
                        defered.resolve(getQueryResult(query));
                    })
                    .catch(function(e){ 
                        console.error(e); 
                        defered.reject(); 
                    });
                    
                    return defered.promise;
                };
                $scope.suggestion = function(suggestion){
                    $scope.header.name = suggestion;
                    var hasPlaceholder = false;
                    for(var i=0,len=requestHeaders.length; i<len; i++){
                        if(requestHeaders[i].value === suggestion){
                            $scope.valuePlaceholder = requestHeaders[i].example;
                            hasPlaceholder = true;
                            break;
                        }
                    }
                    if(!hasPlaceholder){
                        $scope.valuePlaceholder = '';
                    }
                    $scope.extSuggestion()(suggestion);
                };
            },
            templateUrl: 'views/partials/header-editor.html'
        };
    }]);
ArcDirectives.directive('hidableEditorForm', [function() {
    function link(scope, element, attrs) {
        element.find('.collapse-form').addClass('cursor-pointer');
        element.on('click', function(e){
            if(e.target.classList.contains('collapse-form')){
                if(this.classList.contains('collapsed')){
                    this.classList.remove('collapsed');
                } else {
                    this.classList.add('collapsed');
                }
            };
        });
    };
    return {
        restrict: 'A',
        transclude: true,
        templateUrl: 'views/partials/hidable-editor-form.html',
        link: link
    };
}]);
/**
 * http://stackoverflow.com/a/17063046
 */
ArcDirectives.directive("fileread", [function() {
    return {
        scope: {
            fileread: "="
        },
        link: function(scope, element, attributes) {
            element.bind("change", function(changeEvent) {
                scope.$apply(function() {
                    scope.fileread = changeEvent.target.files;
                    // or all selected files:
                    // scope.fileread = changeEvent.target.files;
                });
            });
        }
    };
}]);
/**
 * File drag and drop.
 */
ArcDirectives.directive('fileDropzone', ['$timeout', function($timeout) {
    
    var link = function(scope, element, attrs){
        scope.fallback = function(){
            var elm = element.find('#ArcHttpFilesInput');
            if(elm.length === 0) return;
            fallbackClick(elm[0]);
        };
        
        var handleFiles = function(files, items){
            for(var i=0, len = files.length; i<len; i++){
                var presumablyFile = files[i];
                if(items){
                    var presumablyFileItem = items[i];
                    //User can drop any file - even a directory.
                    //The app should distinguish between them 
                    //and read directory entries if needed 
                    //This if only available on Chrome.   
                    var entry = presumablyFileItem.webkitGetAsEntry();
                    if(!entry){
                        continue;
                    }
                    if(entry.isFile){
                        appendFile(presumablyFile);
                    } else {
                        $timeout(function(){
                            entry.createReader().readEntries(directoryRead, directoryReadError);
                        },0);
                    }
                } else {
                    appendFile(presumablyFile);
                }
            }
        };
        
        var directoryRead = function(entries){
            for(var i=0, len=entries.length; i<len; i++){
                var entry = entries[i];
                if(entry.isFile){
                    $timeout(function(entry){
                        entry.file(function(file) {
                            appendFile(file);
                        }, directoryReadError);
                    }.bind(this,entry),0);
                } else {
                    $timeout(function(){
                        entry.createReader().readEntries(directoryRead, directoryReadError);
                    });
                }
            }
        };
        var directoryReadError = function(){};
        
        var appendFile = function(file){
            scope.$apply(function(){
                scope.files.push(file);
            });
        };
        
        
        var handleDrop = function(e){
            if (e.stopPropagation) {
                e.stopPropagation(); // stops the browser from redirecting.
            }
            e.preventDefault();
            var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
            handleFiles(dataTransfer.files, dataTransfer.items);
            this.classList.remove('over');
            return false;
        };
        var elm = element.find('#ArcHttpFilesInput');
        if(elm.length !== 0) {
            var fallbackHandler = function(e){
                handleFiles(e.target.files);
            };
            elm[0].addEventListener('change', fallbackHandler, false);
        }
        var el = element[0];
        el.addEventListener('dragenter', handleDragEnter, false);
        el.addEventListener('dragover', handleDragOver, false);
        el.addEventListener('dragleave', handleDragLeave, false);
        return el.addEventListener('drop', handleDrop, false);
    };
    
    function fallbackClick(el) {
        var evt = document.createEvent('Event');
        evt.initEvent('click', true, true);
        el.dispatchEvent(evt);
    }
    
    var handleDragOver = function(event) {
        if (event !== null) {
            event.preventDefault();
        }
        var dataTransfer = event.dataTransfer || event.originalEvent.dataTransfer;
        dataTransfer.effectAllowed = 'copy';
        return false;
    };
    var handleDragEnter = function(e) {
        this.classList.add('over');
    };
    var handleDragLeave = function(e) {
        this.classList.remove('over');
    };
    
    var directive = {
        restrict: 'A',
        scope: {
          files: '='
        },
        link: link,
        replace: true,
        templateUrl: 'views/partials/file_drop.html'
    };
    return directive;
}]);

ArcDirectives.directive('responseStatus', [function() {
    return {
        restrict: 'E',
        scope: {
            'status': '=',
            'executeCommand': '&executeCommand'
        },
        templateUrl: 'views/partials/response-status.html'
    };
}]);
ArcDirectives.directive('responseRedirect', [function() {
    return {
        restrict: 'E',
        scope: {
            'redirect': '=',
            'index': '='
        },
        templateUrl: 'views/partials/response-redirect.html'
    };
}]);
ArcDirectives.directive('responseHeaders', ['Definitions',function(Definitions) {
    return {
        restrict: 'E',
        scope: {
            'headers': '='
        },
        templateUrl: 'views/partials/response-headers.html',
        controller: function($scope) {
            $scope.defs = {};
            $scope.addPopover = function(e){
                if(e.currentTarget.dataset.popover){
                    return;
                }
                e.currentTarget.dataset.popover = true;
                var name = e.currentTarget.querySelector('.header-name').textContent.toLowerCase();
                if(name.trim() === '') return;
                
                
                var filterHeaders = function(statuses){
                    if(statuses && statuses.data && (statuses.data instanceof Array)){
                        var res = statuses.data.filter(function(item){
                            return item.key.toLowerCase() === name;
                        });
                        if(res.length === 0) return null;
                        return res[0];
                    }
                };
                var setPopover = function(header){
                    if(!header) return;
                    $scope.defs[header.key.toLowerCase()] = header.desc;                    
                };
                
                Definitions.get('response-headers')
                .then(filterHeaders)
                .then(setPopover);
            };
            
        }
    };
}]);

ArcDirectives.directive("userProfile", ['$User','analytics','$modal',function($User,analytics,$modal) {
    return {
        restrict: 'A',
        scope: {},
        controller: function($scope) {
            
            var UserInfoModal = function ($scope, $modalInstance, user) {
                $scope.user = user;
                $scope.dismiss = function() {
                    $modalInstance.dismiss('cancel');
                };
                $scope.logoff = function(){
                    $modalInstance.close('logoff');
                };
            };
            
            
            $scope.user = $User;
            $scope.signIn = function(){
               $User.authorize(true);
               analytics.event('User','Sign in', 'Menu login');
            };
            $scope.signOut = function(){
                $User.removeToken();
                analytics.event('User','Sign out', 'Menu login');
            };
            $scope.openUserModal = function(){
                var modalInstance = $modal.open({
                    templateUrl: 'views/partials/user-info-modal.html',
                    controller: UserInfoModal,
                    resolve: {
                        'user': function(){
                            return $scope.user;
                        }
                    }
                });
                modalInstance.result.then(function(cmd) {
                    switch(cmd){
                        case 'logoff': $scope.signOut(); break;
                    }
                }, function() {
                    
                });
            };
        },
        templateUrl: 'views/partials/userthumb.html'
    };
}]);

ArcDirectives.directive('inputSuggestions', [function() {
    return {
        restrict: 'A',
        scope: {
            /**
             * A query function. It will be called when the user will type some text into the text field.
             * This function must return a $q object.
             * When the user will type another letter previous $q will be canceled and will cause a new query function call.
             */
            'query': '&query',
            /**
             * Callback function on user selection.
             * It will be called when the user will accept suggestion.
             */
            'suggestion': '&suggestion',
            /**
             * Predefinied list of suggestions to display.
             * It will not prevent of 'query' function call.
             */
            'defaultSuggestions': '='
        },
        controller: ['$scope','$timeout', '$document', function($scope, $timeout, $document){
            /**
             * Called on suggestion selection.
             * @param {String} suggestion
             * @returns {undefined}
             */
            $scope.select = function(suggestion){
                $scope.suggestion(suggestion);
            };
            /**
             * Array of the suggestions.
             * It is an array of objects. It should contain two keys:
             * 'value' - returned by the suggestion value. It will be entered into text field and passed to suggestion function call.
             * 'display' - a value to display. It either can be text or any HTML value. HTML values are not going to be validated!
             */
            $scope.suggestions = [];
            /**
             * Currently selected item via up/down arrows
             */
            $scope.selectedIndex = -1;
            $scope.lastQuery = null;
            var lastFuture = null;
            
            var makeQuery = function(value){
                
                if($scope.lastQuery === value){
                    return;
                }
                
                $scope.lastQuery = value;
//                if(value.trim() === ''){
//                    //@todo: stop showing the suggestions?
//                    return;
//                }
                
                lastFuture = $scope.query()(value);
                lastFuture.then(function(result){
                    if(!(result instanceof Array)){
                        throw "Query function must result in an Array.";
                    }
                    
                    $scope.suggestions = result;
                    if(result.length === 1){
                        $scope.selectedIndex = 0;
                    }
                })
                //.catch(function(reason){})
                .finally(function(){
                    lastFuture = null;
                });
            };
            
            
            /**
             * Scope function for link.
             * @param {String} value value from text field.
             * @returns {undefined}
             */
            $scope.makeQuery = function(value){
                $timeout(function(){
                    makeQuery(value);
                }, 0);
            };
            
            $scope.makeSelection = function(index){
                if(index >= 0 && index < $scope.suggestions.length){
                    $scope.suggestion()($scope.suggestions[index].value);
                    $scope.cleanUp();
                }
            };
            
            $scope.cleanUp = function(){
                lastFuture = null;
                $scope.suggestions = [];
                $scope.selectedIndex = -1;
            };
            
            var keydown = function(e){
                if(e.keyCode === 27){
                    $scope.$apply(function(){
                        $scope.cleanUp();
                    });
                }
            };
            
            $document[0].addEventListener('keydown', keydown, false);
            $scope.$on('$destroy', function() {
                $document[0].removeEventListener('keydown', keydown, false);
                $scope.cleanUp();
            });
        }],
        link: function(scope, element, attrs){
            
            /**
             * Functional keys.
             * Up moves selection up.
             * Down moves selction down.
             * Enter and right accept the suggestion. @todo: Add click event
             * Esc cancel suggestions display.
             * @type Object
             */
            var keys = {up: 38, right: 39, down: 40, enter: 13, esc: 27};
            
            var keydown = function(e){
                switch(e.keyCode){
                    case keys.up: 
                        scope.selectedIndex--;
                        if(scope.selectedIndex < 0){
                            scope.selectedIndex = scope.suggestions.length-1;
                        }
                        e.preventDefault();
                        break;
                    case keys.down: 
                        scope.selectedIndex++;
                        if(scope.selectedIndex >= scope.suggestions.length){
                            scope.selectedIndex = 0;
                        }
                        e.preventDefault();
                        break;
                    case keys.enter:
                    case keys.right: 
                        scope.makeSelection(scope.selectedIndex);
                        e.preventDefault();
                        break;
                    case keys.esc: 
                        scope.cleanUp();
                        e.preventDefault();
                        break;
                    default:
                        break;
                }
            };
            
            
            var keyup = function(e){
                scope.makeQuery(e.target.value);
            };
            
            element[0].addEventListener('keydown', keydown, false);
            element[0].addEventListener('keyup', keyup, false);
            element.on('$destroy', function() {
                element[0].removeEventListener('keydown', keydown, false);
                element[0].removeEventListener('keyup', keyup, false);
            });
        },
        templateUrl: 'views/partials/input-suggestions.html',
        transclude: true
    };
}]);