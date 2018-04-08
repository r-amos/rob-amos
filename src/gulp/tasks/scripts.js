// Standard
const gulp = require("gulp");
const path = require("path");

// ES6 & JS Minification
const babel = require("gulp-babel");
const minify = require("gulp-minify");

// Define Path Constants
const paths = require("../constants");

//Transpile ES6, Minify (Exclude Original Source)
gulp.task("js", () => {
  return gulp
    .src(paths.scripts)
    .pipe(babel({ presets: ["env"] }))
    .pipe(minify({ noSource: true }))
    .pipe(gulp.dest("../dist/js"));
});
