
const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const tsify = require('tsify');
const uglify = require('gulp-uglify');
// const sourcemaps = require('gulp-sourcemaps');
const buffer = require('vinyl-buffer');

// const paths = {
//     pages: ['./pages/*.html'],
//     assets: ['./assets/*']
// };

// gulp.task('copy-html', () => gulp.src(paths.pages).pipe(gulp.dest('dist')));
// gulp.task('copy-assets', () => gulp.src(paths.assets).pipe(gulp.dest('dist/assets')));

const build = (isWorker, isDebug) => {

    const entry_src = !isWorker ? './src/main/main.ts' : './src/worker/main.ts';
    const dist_file = !isWorker ? 'bundle.js' : 'worker.js';

    const stream = browserify({
            basedir: '.',
            debug: (isDebug === true),
            entries: [ entry_src ],
            cache: {},
            packageCache: {}
        })
        .plugin(tsify)
        .bundle()
        .pipe(source(dist_file))
        .pipe(buffer());

    if (isDebug === true) {
        // stream.pipe(sourcemaps.init({loadMaps: true}))
        //       .pipe(sourcemaps.write('./'));
    }
    else {
        stream.pipe(uglify());
    }

    stream.pipe(gulp.dest('dist'));

    return stream;
};

gulp.task('build-release',          () => build(false, false));
gulp.task('build-debug',            () => build(false, true));
gulp.task('build-worker-release',   () => build(true, false));
gulp.task('build-worker-debug',     () => build(true, true));

gulp.task('default',    gulp.series(gulp.parallel('build-release', 'build-worker-release')));
gulp.task('debug',      gulp.series(gulp.parallel('build-debug',   'build-worker-debug')));
