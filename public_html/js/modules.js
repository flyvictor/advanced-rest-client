'use strict';

var ArcModules = angular.module('arc.modules', []);
/**
 * @ngdoc object
 * @name ngStorage.$localStorage
 * @requires $rootScope
 * @requires $window
 */
ArcModules.factory('$localStorage', _storageFactory('local'));

/**
 * @ngdoc object
 * @name chromeStorage.$syncStorage
 * @requires $rootScope
 * @requires $window
 */
ArcModules.factory('$syncStorage', _storageFactory('sync'));

function _storageFactory(storageType) {
    return [function() {
            return chrome.storage[storageType];
        }];
}


