'use strict';

var slice = [].slice;


/**
 * @param {Arguments} Arguments
 * @returns {Array}
 */
exports.args = function args(Arguments) {
  return slice.call(Arguments, 0);
};


/**
 * @param {Function} callback <code>(err, userData)</code>
 */
exports.wrapDataCallback = function wrapDataCallback(callback) {
  if (callback) {
    return function onresponse(err, res) {
      callback(err, res);
    };
  }
};
