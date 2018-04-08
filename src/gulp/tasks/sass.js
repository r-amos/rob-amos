// Standard
const gulp = require("gulp");
const path = require("path");

// SASS
const sass = require("gulp-sass");
const cleanCSS = require("gulp-clean-css");
const autoprefixer = require("gulp-autoprefixer");

// Get BrowserSync Dev Server Instance
const browserSync = require("browser-sync").get("dev-server");

// Define Path Constants
const paths = require("../constants");

// Compile, Autoprefix & Minify SASS, Output & Inject
gulp.task("sass", () => {
  return (
    gulp
      .src(paths.css)
      .pipe(sass.sync().on("error", sass.logError))
      .pipe(autoprefixer())
      .pipe(cleanCSS({ compatibility: "ie8" }))
      .pipe(gulp.dest("../dist/css"))
      // Inject Into Browsersync
      .pipe(browserSync.stream())
  );
});
