'use strict';

var fs = require('fs');
var path = require('path');
var objectAssign = require('object-assign');
var Promise = require('promise');
var mkdirp = require('mkdirp');
var stylus = require('stylus');

module.exports = function(config) {
	var source = config.source;
	var destination = config.destination;
	var options = config.options || {};

	var api = this;
	if (!source) {
		throw new api.errors.TaskError('No source path specified');
	}
	if (!destination) {
		throw new api.errors.TaskError('No destination path specified');
	}
	return compile(source, destination, options);


	function compile(source, destination, options) {
		return readFile(source)
			.then(function(data) {
				var stylusOptions = getStylusOptions(options, source);
				var imports = options.imports || [];
				return compileStylus(data, stylusOptions, imports);
			})
			.then(function(css) {
				return writeFile(css, destination);
			});


		function readFile(filename) {
			return new Promise(function(resolve, reject) {
				fs.readFile(filename, { encoding: 'utf8' }, function(error, data) {
					if (error) {
						reject(error);
					} else {
						resolve(data);
					}
				});
			});
		}

		function getStylusOptions(options, source) {
			var filename = path.resolve(source);
			var stylusOptions = objectAssign({}, options, {
				filename: filename
			});
			return stylusOptions;
		}

		function compileStylus(data, options, imports, settings) {
			return new Promise(function(resolve, reject) {
				var renderer = stylus(data, options);

				applyImports(renderer, imports);

				renderer.render(function(error, data) {
					if (error) {
						reject(error);
					} else {
						resolve(data);
					}
				});


				function applyImports(renderer, imports) {
					imports.forEach(function(filename) {
						renderer.import(filename);
					});
				}
			});
		}

		function writeFile(data, filename) {
			var directory = path.dirname(filename);
			return ensureDirectoryExists(directory)
				.then(function() {
					return writeData(data, filename);
				});


			function ensureDirectoryExists(directory) {
				return new Promise(function(resolve, reject) {
					mkdirp(directory, function(error) {
						if (error) {
							reject(error);
						} else {
							resolve(null);
						}
					});
				});
			}

			function writeData(data, filename) {
				return new Promise(function(resolve, reject) {
					fs.writeFile(filename, data, { encoding: 'utf8' }, function(error) {
						if (error) {
							reject(error);
						} else {
							resolve(data);
						}
					});
				});
			}
		}
	}
};

module.exports.defaults = {
	source: null,
	destination: null,
	options: {
		globals: {},
		functions: {},
		use: [],
		paths: []
	}
};

module.exports.description = 'Compile CSS using Stylus';
