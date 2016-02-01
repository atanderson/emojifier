var   browserify = require('browserify')
    , sourcemaps = require('gulp-sourcemaps')
    , riotify = require('riotify')
    , uglify = require('gulp-uglify')
    , source = require('vinyl-source-stream')
    , buffer = require('vinyl-buffer')
    , rename = require('gulp-rename')
    , concat = require('gulp-concat')
    , gutil = require('gulp-util')
    , gulp = require('gulp')
    , sass = require('gulp-sass')
    , del = require('del')
    ;

// delete the build directory contents
gulp.task('clean', function(){
    del('./frontend/build/**/*');
});

//moves a single file :)
gulp.task('move', function(){
    gulp.src('./frontend/src/*.html')
        .pipe(gulp.dest('./frontend/build'));
});

//bundle all the scripts/tags into a single file w/sourcemaps
gulp.task('browserify', function(){
    return browserify({
        entries: './frontend/src/js/app.js',
        extensions: ['*.js', '*.tag'],
        debug: true
    })
    .transform(riotify)
    .bundle()
    .pipe(source('./frontend/src/js/app.js'))
    .pipe(rename({
        dirname: '',
        extname: '.min.js'
    }))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify().on('error', gutil.log))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./frontend/build/js/'));
});

//sass compile and concat
gulp.task('styles', function(){
    gulp.src('./frontend/src/styles/*')
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(concat('styles.min.css'))
        .pipe(gulp.dest('./frontend/build/css'));
});

gulp.task('build', ['move', 'browserify', 'styles']);

gulp.task('watch', function(){
    gulp.watch('./frontend/src/**/*', ['build']);
});

gulp.task('default', ['build']);
