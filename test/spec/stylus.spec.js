'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require('chai-as-promised');
var rewire = require('rewire');
var path = require('path');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('task:stylus', function() {
	var mockApi;
	var mockStylus;
	var mockMkdirp;
	var mockFs;
	var task;
	before(function() {
		mockApi = createMockApi();
		mockStylus = createMockStylus();
		mockMkdirp = createMockMkdirp();
		mockFs = createMockFs();
		task = rewire('../../lib/tasks/stylus');
		task.__set__('stylus', mockStylus);
		task.__set__('mkdirp', mockMkdirp);
		task.__set__('fs', mockFs);
	});

	afterEach(function() {
		mockStylus.reset();
		mockMkdirp.reset();
		mockFs.reset();
	});

	function createMockApi() {
		return {
			errors: {
				TaskError: createCustomError('TaskError')
			}
		};

		function createCustomError(type) {
			function CustomError(message) {
				this.message = message;
			}

			CustomError.prototype = Object.create(Error.prototype);
			CustomError.prototype.name = type;

			return CustomError;
		}
	}

	function createMockStylus() {
		var stylus = sinon.spy(function(css, options, callback) {
			var instance = {
				import: sinon.spy(function(file) {}),
				render: sinon.spy(function(callback) {
					setTimeout(function() {
						var hasError = Boolean(options.error);
						if (hasError) {
							callback(new Error('Stylus error'));
						} else {
							callback(null, '<output>');
						}
					});
				}),
				reset: function() {
					this.import.reset();
					this.render.reset();
				}
			};
			stylus.instance = instance;
			return instance;
		});
		stylus.instance = null;

		var reset = stylus.reset;
		stylus.reset = function() {
			stylus.instance = null;
			reset.call(stylus);
		};
		return stylus;
	}

	function createMockMkdirp() {
		return sinon.spy(function(path, callback) {
			setTimeout(function() {
				callback(null);
			});
		});
	}

	function createMockFs() {
		var mockFs = {
			readFile: sinon.spy(function(filename, options, callback) {
				setTimeout(function() {
					var hasError = (path.basename(filename) === 'read-error.styl');
					if (hasError) {
						callback(new Error('Read error'));
					} else {
						callback(null, '<input>');
					}
				});
			}),
			writeFile: sinon.spy(function(filename, data, options, callback) {
				setTimeout(function() {
					var hasError = (path.basename(filename) === 'write-error.css');
					if (hasError) {
						callback(new Error('Write error'));
					} else {
						callback(null);
					}
				});
			})
		};

		mockFs.reset = function() {
			mockFs.readFile.reset();
			mockFs.writeFile.reset();
		};

		return mockFs;
	}

	it('should have a description', function() {
		expect(task.description).to.be.a('string');
	});

	it('should specify default configuration', function() {
		expect(task.defaults).to.eql({
			source: null,
			destination: null,
			options: {
				globals: {},
				functions: {},
				use: [],
				paths: []
			}
		});
	});

	it('should throw an error if no source path is specified', function() {
		var attempts = [
			function() { return task.call(mockApi, { destination: '/project/dist/app.css', options: {} }); },
			function() { return task.call(mockApi, { source: undefined, destination: '/project/dist/app.css', options: {} }); },
			function() { return task.call(mockApi, { source: null, destination: '/project/dist/app.css', options: {} }); },
			function() { return task.call(mockApi, { source: false, destination: '/project/dist/app.css', options: {} }); }
		];
		attempts.forEach(function(attempt) {
			expect(attempt).to.throw(mockApi.errors.TaskError);
			expect(attempt).to.throw('No source');
		});
	});

	it('should throw an error if no destination path is specified', function() {
		var attempts = [
			function() { task.call(mockApi, { source: '/project/src/index.styl', options: {} }); },
			function() { task.call(mockApi, { source: '/project/src/index.styl', destination: undefined, options: {} }); },
			function() { task.call(mockApi, { source: '/project/src/index.styl', destination: null, options: {} }); },
			function() { task.call(mockApi, { source: '/project/src/index.styl', destination: false, options: {} }); }
		];
		attempts.forEach(function(attempt) {
			expect(attempt).to.throw(mockApi.errors.TaskError);
			expect(attempt).to.throw('No destination');
		});
	});

	it('should compile source files using Stylus API', function() {
		var promise = task.call(mockApi, {
			source: '/project/src/index.styl',
			destination: '/project/dist/app.css'
		});

		return expect(promise).to.eventually.equal('<output>')
			.then(function() {
				expect(mockStylus).to.have.been.calledOnce;
				expect(mockStylus).to.have.been.calledWith(
					'<input>',
					{
						filename: '/project/src/index.styl'
					}
				);

				expect(mockFs.writeFile).to.have.been.calledWith(
					'/project/dist/app.css',
					'<output>',
					{ encoding: 'utf8' }
				);

				expect(mockMkdirp).to.have.been.calledOnce;
				expect(mockMkdirp).to.have.been.calledWith(
					'/project/dist'
				);
				expect(mockMkdirp).to.have.been.calledBefore(mockFs.writeFile);
			});
	});

	it('should pass options to Stylus API', function() {
		var foobar = function() {};

		var promise = task.call(mockApi, {
			source: '/project/src/index.styl',
			destination: '/project/dist/app.css',
			options: {
				globals: {
					foo: 'bar'
				},
				functions: {
					'foobar': foobar
				},
				use: [
					foobar
				],
				paths: [
					'/project/includes/'
				],
				sourcemap: true,
				prefix: 'project-',
				linenos: true,
				'include css': true
			}
		});

		return expect(promise).to.eventually.equal('<output>')
			.then(function() {
				expect(mockStylus).to.have.been.calledOnce;
				expect(mockStylus).to.have.been.calledWith(
					'<input>',
					{
						filename: '/project/src/index.styl',
						globals: {
							foo: 'bar'
						},
						functions: {
							'foobar': foobar
						},
						use: [
							foobar
						],
						paths: [
							'/project/includes/'
						],
						sourcemap: true,
						prefix: 'project-',
						linenos: true,
						'include css': true
					}
				);
			});
	});

	it('should re-throw read errors', function() {
		var promise = task.call(mockApi, {
			source: '/project/src/read-error.styl',
			destination: '/project/dist/app.css'
		});

		return expect(promise).to.be.rejectedWith('Read error');
	});

	it('should re-throw stylus errors', function() {
		var promise = task.call(mockApi, {
			source: '/project/src/index.styl',
			destination: '/project/dist/app.css',
			options: {
				error: true
			}
		});

		return expect(promise).to.be.rejectedWith('Stylus error');
	});

	it('should re-throw write errors', function() {
		var promise = task.call(mockApi, {
			source: '/project/src/index.styl',
			destination: '/project/dist/write-error.css'
		});

		return expect(promise).to.be.rejectedWith('Write error');
	});
});
