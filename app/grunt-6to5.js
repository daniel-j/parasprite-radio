'use strict';
var to5 = require('6to5');
var path = require('path');

module.exports = function (grunt) {
	grunt.registerMultiTask('6to5', 'Transpile ES6 to ES5', function () {
		var options = this.options();
		delete options.filename;
		delete options.filenameRelative;


		this.files.forEach(function (el) {

			if (options.sourceMap === true) {
				if (!options.sourceRoot) {
					options.sourceRoot = path.relative(path.dirname(el.src[0]), path.dirname(el.dest));
				}

				if (!options.sourceFileName) {
					options.sourceFileName = path.basename(el.dest);
				}

				if (!options.sourceMapName) {
					options.sourceMapName = path.basename(el.src[0]);
				}
			}

			var res = to5.transformFileSync(el.src[0], options);

			
			if (options.sourceMap === true) {
				res.code += "\n//# sourceMappingURL=" + path.basename(el.dest + '.map');
			}

			grunt.file.write(el.dest, res.code);


			if (res.map) {
				grunt.file.write(el.dest + '.map', JSON.stringify(res.map));
			}
		});
	});
};
