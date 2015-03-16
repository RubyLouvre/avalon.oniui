var gulp = require('gulp'),
	concat = require('gulp-concat'),
    esformatter = require('gulp-esformatter'),
	less = require('semicolon-less/gulpplugin');

var paths = {
	old: [
		"src/00 inter.js",
		"src/01 variable.js",
		"src/02 xhr.old.js",
		"src/03 parseXML.js",
		"src/04 ajaxExtend.js",
    	"src/05 _methods.js",
    	"src/06 methods.js",
    	"src/07 avalon.ajaxConverters.js",
    	"src/08 avalon.param.js",
    	"src/09 avalon.unparam.js",
    	"src/10 avalon.serialize.js",
    	"src/11 avalon.ajaxTransports.old.js",
    	"src/12 outer.js"
	],
	modern: [
		"src/00 inter.js",
		"src/01 variable.js",
		"src/02 xhr.modern.js",
		"src/03 parseXML.modern.js",
		"src/04 ajaxExtend.js",
    	"src/05 _methods.js",
    	"src/06 methods.js",
    	"src/07 avalon.ajaxConverters.js",
    	"src/08 avalon.param.js",
    	"src/09 avalon.unparam.js",
    	"src/10 avalon.serialize.js",
    	"src/11 avalon.ajaxTransports.modern.js",
    	"src/12 outer.js"
	]
};

gulp.task('old', function() {
	return gulp.src(paths.old)
    .pipe(concat('mmRequest.js'))
    .pipe(esformatter({
        indent: {
            value: '    '
        }
    }))
    .pipe(less())
    .pipe(gulp.dest('public'));
});

gulp.task('modern', function() {
	return gulp.src(paths.modern)
    .pipe(concat('mmRequest.modern.js'))
    .pipe(esformatter({
        indent: {
            value: '    '
        }
    }))
    .pipe(less())
    .pipe(gulp.dest('public'));
});

gulp.task('watch', function() {
    gulp.watch('src/*.js', ['old', 'modern']);
});

gulp.task('default', ['old', 'modern', 'watch']);
