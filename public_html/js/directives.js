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
            templateUrl: 'views/header-editor.html'
        };
    }]);
ArcDirectives.directive('headersEditorForm', [function() {
    function link(scope, element, attrs) {
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
        templateUrl: 'views/partials/headers-editor-form.html',
        link: link
    };
}]);