
const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const tsify = require('tsify');
const uglify = require('gulp-uglify');
const buffer = require('vinyl-buffer');

const build = (opts) => {

    const entry_file = !opts.isWorker ? './src/main/main.ts' : './src/worker/main.ts';
    const build_file = !opts.isWorker ? 'bundle.js' : 'worker.js';

    const stream = browserify({
            basedir: '.',
            debug: (opts.isDebug === true),
            entries: [ entry_file ],
            cache: {},
            packageCache: {}
        })
        .plugin(tsify)
        .bundle()
        .pipe(source(build_file))
        .pipe(buffer());

    if (opts.isDebug === false) {
        stream.pipe(uglify());
    }

    stream.pipe(gulp.dest('dist'));

    return stream;
};

gulp.task('build-release',          () => build({ isWorker: false, isDebug: false }));
gulp.task('build-debug',            () => build({ isWorker: false, isDebug: true }));
gulp.task('build-worker-release',   () => build({ isWorker: true, isDebug: false }));
gulp.task('build-worker-debug',     () => build({ isWorker: true, isDebug: true }));

gulp.task('default',    gulp.series(gulp.parallel('build-release', 'build-worker-release')));
gulp.task('debug',      gulp.series(gulp.parallel('build-debug',   'build-worker-debug')));
