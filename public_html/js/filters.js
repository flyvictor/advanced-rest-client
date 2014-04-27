'use strict';

/* Filters */

var ArcFilters = angular.module('arc.filters', []);
ArcFilters.filter('interpolate', ['version', function(version) {
        return function(text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        };
    }]);
ArcFilters.filter('filesize', [function() {
        return function(text) {
            var value = parseInt(text);
            var units = ['bytes','KB','MB','GB','TB'];
            for(var i=0,len=units.length; i<len;i++){
                if(value < 1024){
                    return (Math.round(value * 100) / 100) + ' ' + units[i];
                }
                value = value/1024;
            }
        };
    }]);