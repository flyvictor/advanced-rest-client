var ArcDirectives = angular.module('arc.directives', []);

ArcDirectives.config(['$compileProvider', function($compileProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob):|data:image\/|filesystem:chrome-extension/);
    }]);

ArcDirectives.directive('appVersion', ['version', function(version) {
        return function(scope, elm, attrs) {
            elm.text(version);
        };
    }]);

ArcDirectives.directive('httpHeaderEditor', [function() {
        return {
            restrict: 'E',
            scope: {
                'header': '=',
                'remove': '&onRemove'
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