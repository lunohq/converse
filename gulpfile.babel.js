import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
import del from 'del'
import path from 'path'
import babel from 'gulp-babel'

import manifest from './package.json'

// Load all of our Gulp plugins
const $ = loadPlugins()

// Gather the library data from `package.json`
const mainFile = manifest.main
const destinationFolder = path.dirname(mainFile)

function cleanLib(done) {
  del([destinationFolder]).then(() => done())
}

function cleanTmp(done) {
  del(['tmp']).then(() => done())
}

function onError() {
  $.util.beep()
}

// Lint a set of files
function lint(files) {
  return gulp.src(files)
    .pipe($.plumber())
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError())
    .pipe($.jscs())
    .pipe($.jscs.reporter())
    .pipe($.jscs.reporter('fail'))
    .on('error', onError)
}

function lintSrc() {
  return lint('src/**/*.js')
}

function lintGulpfile() {
  return lint('gulpfile.babel.js')
}

function build() {
  return gulp.src('src/**/*.js')
    .pipe($.plumber())
    .pipe(babel())
    .pipe(gulp.dest(destinationFolder))
}

// Run build while we make changes
function building() {
  gulp.watch(['src/**/*'], ['build'])
}

// Remove the built files
gulp.task('clean', cleanLib)

// Remove our temporary files
gulp.task('clean-tmp', cleanTmp)

// Lint our source code
gulp.task('lint-src', lintSrc)

// Lint this file
gulp.task('lint-gulpfile', lintGulpfile)

// Lint everything
gulp.task('lint', ['lint-src', 'lint-gulpfile'])

// Build two versions of the library
gulp.task('build', ['lint', 'clean'], build)

// Build as we make changes
gulp.task('building', building)
