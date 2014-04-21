'use strict';

/* Filters */

var ArcFilters = angular.module('arc.filters', []);
ArcFilters.filter('interpolate', ['version', function(version) {
        return function(text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        };
    }]);