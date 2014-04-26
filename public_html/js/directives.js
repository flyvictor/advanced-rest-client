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
ArcDirectives.directive('fileDropzone', function() {
    
    var link = function(scope, element, attrs){
        
        scope.fallback = function(){
            var elm = element.find('#ArcHttpFilesInput');
            if(elm.length === 0) return;
            fallbackClick(elm[0]);
        };
        
        var handleFiles = function(files){
            var filesArray = [];
            for(var i=0, len = files.length; i<len; i++){
                filesArray[filesArray.length] = files[i];
            }
            scope.$apply(function(){
                scope.files = scope.files.concat(filesArray);
            });
        };
        var handleDrop = function(e){
            if (e.stopPropagation) {
                e.stopPropagation(); // stops the browser from redirecting.
            }
            var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
            handleFiles(dataTransfer.files);
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
});