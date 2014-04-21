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
                'error': '='
            },
            templateUrl: 'views/header-editor.html'
        };
    }]);