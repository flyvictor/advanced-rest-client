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


/**
 * Binds a CodeMirror widget to a <textarea> element.
 * https://github.com/angular-ui/ui-codemirror
 */
angular.module('ui.codemirror', [])
    .constant('uiCodemirrorConfig', {})
    .directive('uiCodemirror', ['uiCodemirrorConfig', function (uiCodemirrorConfig) {
        'use strict';
        return {
            restrict: 'EA',
            require: '?ngModel',
            priority: 1,
            compile: function (templateElement) {
                
                // Require CodeMirror
                if (angular.isUndefined(window.CodeMirror)) {
                    throw new Error('ui-codemirror need CodeMirror to work... (o rly?)');
                }

                var value = templateElement.text();
                
                /**
                 * Function to be called when options are updated
                 * @param {Object} newValues
                 * @returns {undefined}
                 */
                var updateOptions = function(newValues) {
                    for (var key in newValues) {
                        if (newValues.hasOwnProperty(key)) {
                            this.setOption(key, newValues[key]);
                        }
                    }
                };
                /**
                 * CodeMirror expects a string.
                 * This function will be passed to ngModel formatters to be sure 
                 * that the value is string.
                 * This does not change the model.
                 * 
                 * @param {Any} value
                 * @returns {String}
                 */
                var modelFormatter = function(value){
                    if (angular.isUndefined(value) || value === null) {
                        return '';
                    }
                    else if (angular.isObject(value) || angular.isArray(value)) {
                        throw new Error('ui-codemirror cannot use an object or an array as a model');
                    }
                    return value;
                };
                
                /**
                 * Callback function for CodeMirror constructor.
                 * It should insert CM editor into the DOM.
                 * @param {type} cm_el
                 * @returns {undefined}
                 */
                var cmCreateFunction = function(cm_el){
                    var instanceElement = this;
                    angular.forEach(templateElement.prop('attributes'), function(a) {
                        if (a.name === 'ui-codemirror') {
                            cm_el.setAttribute('ui-codemirror-opts', a.textContent);
                        } else if (a.name === 'class') {
                            cm_el.classList.add(a.textContent);
                        } else {
                            cm_el.setAttribute(a.name, a.textContent);
                        }
                    });
                    if (templateElement.parent().length <= 0) {
                        instanceElement.append(cm_el);
                    }
                    instanceElement.replaceWith(cm_el);
                };
                
                var postLink = function(scope, instanceElement, iAttrs, ngModel){
                    
                    var codeMirror = new window.CodeMirror(cmCreateFunction.bind(instanceElement), {'value': value});
                    
                    var options, opts;
                    options = uiCodemirrorConfig.codemirror || {};
                    opts = angular.extend({}, options, scope.$eval(iAttrs.uiCodemirror), scope.$eval(iAttrs.uiCodemirrorOpts));
                    updateOptions.call(codeMirror,opts);
                    
                    if (angular.isDefined(scope.$eval(iAttrs.uiCodemirror))) {
                        scope.$watch(iAttrs.uiCodemirror, updateOptions.bind(codeMirror), true);
                    }
                    // Specialize change event
                    codeMirror.on('change', function(instance) {
                        var newValue = instance.getValue();
                        if (ngModel && newValue !== ngModel.$viewValue) {
                            ngModel.$setViewValue(newValue);
                        }
                        if (!scope.$$phase) {
                            scope.$apply();
                        }
                    });

                    if (ngModel) {
                        ngModel.$formatters.push(modelFormatter);
                        // Override the ngModelController $render method, 
                        // which is what gets called when the model is updated.
                        // This takes care of the synchronizing the codeMirror element 
                        // with the underlying model, in the case that it is changed 
                        // by something else.
                        ngModel.$render = function () {
                          //Code mirror expects a string so make sure it gets one
                          //Although the formatter have already done this, 
                          //it can be possible that another formatter returns 
                          //undefined (for example the required directive)
                          var safeViewValue = ngModel.$viewValue || '';
                          codeMirror.setValue(safeViewValue);
                        };
                    }
                    // Watch ui-refresh and refresh the directive
                    if (iAttrs.uiRefresh) {
                        scope.$watch(iAttrs.uiRefresh, function (newVal, oldVal) {
                            // Skip the initial watch firing
                            if (newVal !== oldVal) {
                                codeMirror.refresh();
                            }
                        }, true);
                    }
                    // onLoad callback
                    if (angular.isFunction(opts.onLoad)) {
                      opts.onLoad(codeMirror);
                    }
                };
                
                return postLink;
            }
        };
    }
]);