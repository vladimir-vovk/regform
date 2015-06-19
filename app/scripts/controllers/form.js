'use strict';

/**
 * @ngdoc function
 * @name regformApp.controller:FormController
 * @description
 * # FormController
 * Main controller of the regformApp
 */
angular.module('regformApp')

.directive('autoFocus', function($timeout) {
    return {
        restrict: 'AC',
        link: function(scope, element) {
            $timeout(function(){
                element[0].focus();
            }, 0);
        }
    };
})

.filter('phone', function () {
    return function (tel) {
        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;

            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;

            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;

            default:
                return tel;
        }

        if (country === 1) {
            country = '';
        }

        number = number.slice(0, 3) + '-' + number.slice(3, 5) + '-' + number.slice(5);

        return (country + ' (' + city + ') ' + number).trim();
    };
})

.directive('validNumber', function() {
    return {
        require: '?ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
            if(!ngModelCtrl) {
                return;
            }

            ngModelCtrl.$parsers.push(function(val) {
                var clean = val.replace( /[^0-9]+/g, '');
                if (attrs.size && clean.length > attrs.size) {
                    clean = clean.slice(0, attrs.size);
                }
                if (val !== clean) {
                    ngModelCtrl.$setViewValue(clean);
                    ngModelCtrl.$render();
                }
                return clean;
            });

            element.bind('keypress', function(event) {
                if(event.keyCode === 32) {
                    event.preventDefault();
                }
            });
        }
    };
})

.directive('match', function () {
    return {
        require: 'ngModel',
        restrict: 'A',
        scope: {
            match: '='
        },
        link: function(scope, elem, attrs, ctrl) {
            scope.$watch(function() {
                var modelValue = ctrl.$modelValue || ctrl.$$invalidModelValue;
                return (ctrl.$pristine && angular.isUndefined(modelValue)) || scope.match === modelValue;
            }, function(currentValue) {
                ctrl.$setValidity('match', currentValue);
            });
        }
    };
})

.controller('FormCtrl', function ($scope, $state, localStorageService) {

    $scope.formData = {};
    $scope.validSteps = {
        formStep1: false,
        formStep2: false,
        formStep3: false
    };

    $state.go('form.step1');

    /**
     * next state available only if previous valid
     */
    $scope.$on('$stateChangeStart',
               function(event, toState) {
                   /* redirect to step1 */
                   if (toState.name === 'form') {
                       event.preventDefault();
                       $state.go('form.step1');
                   }

                   /* check next step available */
                   if (toState.name === 'form.step2' && !$scope.validSteps.formStep1) {
                       event.preventDefault();
                   } else if (toState.name === 'form.step3' && !$scope.validSteps.formStep2) {
                       event.preventDefault();
                   } else if (toState.name === 'form.step4' && !$scope.validSteps.formStep3) {
                       event.preventDefault();
                   }
               });

    /**
     * local storage
     */
    var dataInStorage = localStorageService.get('formData');
    $scope.formData = dataInStorage || {};

    // $scope.$watch('formData', function () {
    //     localStorageService.add('formData', $scope.formData);
    // }, true);


    /**
    * form fields validation
    */

    $scope.isValid = function(form, fieldName) {
        return form[fieldName].$dirty && form[fieldName].$valid;
    };

    $scope.isInvalid = function(form, fieldName) {
        return form[fieldName].$dirty && form[fieldName].$invalid;
    };

    $scope.validState = function(form, fieldName) {
        var className = '';

        if ($scope.isValid(form, fieldName)) {
            className = 'has-success';
        } else if ($scope.isInvalid(form, fieldName)) {
            className = 'has-error';
        }

        $scope.validSteps[form.$name] = form.$valid;

        return className;
    };

    function validDate(text) {

        var date = Date.parse(text);

        if (isNaN(date)) {
            return false;
        }

        var comp = text.split('/');

        if (comp.length !== 3) {
            return false;
        }

        var m = parseInt(comp[0], 10);
        var d = parseInt(comp[1], 10);
        var y = parseInt(comp[2], 10);

        if (y.toString().length !== 4) {
            return false;
        }

        date = new Date(y, m - 1, d);
        return (date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d);
    }

    /**
     * form 1
     */

    $scope.submitStep1 = function(form) {
        if (!$scope.formData.login) {
            form.login.$dirty = true;
        }

        if (!$scope.formData.email) {
            form.email.$dirty = true;
        }

        if (!$scope.formData.password) {
            form.password.$dirty = true;
        }

        if ($scope.formData.password && !$scope.formData.passwordConfirm) {
            form.passwordConfirm.$dirty = true;
        }

        $scope.validSteps.formStep1 = form.$valid;

        if (form.$valid) {
            $state.go('form.step2');
        }
    };

    /**
     * form 2
     */

    $scope.updateBirthdate = function(form) {
        var dateString = '' + $scope.formData.birthMonth + '/' + $scope.formData.birthDay + '/' + $scope.formData.birthYear;
        form.birthdate.$dirty = true;

        if (validDate(dateString)) {
            form.birthdate.$setValidity('date', true);
            dateString = '' + $scope.formData.birthYear + '-' +
                    ('0' + $scope.formData.birthMonth).slice(-2) + '-' +
                    ('0' + $scope.formData.birthDay).slice(-2) +
                    'T00:00:00+0000';
            $scope.formData.birthdate = new Date(dateString);

        } else {
            form.birthdate.$setValidity('date', false);
            $scope.formData.birthdate = null;
        }
    };

    $scope.submitStep2 = function(form) {
        if (!$scope.formData.name) {
            form.name.$dirty = true;
        }

        if (!$scope.formData.surname) {
            form.surname.$dirty = true;
        }

        if (!$scope.formData.birthdate) {
            form.birthdate.$dirty = true;
            form.birthdate.$setValidity('date', false);
        }

        if (!$scope.formData.sex) {
            form.sex.$dirty = true;
        }


        $scope.validSteps.formStep2 = form.$valid;

        if (form.$valid) {
            $state.go('form.step3');
        }
    };

    /**
     * form 3
     */

    $scope.submitStep3 = function(form) {
        if (!$scope.formData.country) {
            form.country.$dirty = true;
        }

        if (!$scope.formData.city) {
            form.city.$dirty = true;
        }

        if (!$scope.formData.address) {
            form.address.$dirty = true;
        }

        if (!$scope.formData.phone) {
            form.phone.$dirty = true;
        }

        $scope.validSteps.formStep3 = form.$valid;

        if (form.$valid) {
            $state.go('form.step4');
        }
    };

    /**
     * submit form
     */

    $scope.submitForm = function() {
        localStorageService.add('formData', $scope.formData);
        $state.go('form.step1');
    };

    $scope.clearForm = function() {
        $scope.formData = {};
        $scope.validSteps = {};

        localStorageService.remove('formData');
        $state.go('form.step1');
    };

});
