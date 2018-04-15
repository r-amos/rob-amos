const gulp = require("gulp");
const imagemin = require("gulp-imagemin");

// Define Path Constants
const paths = require("../constants");

gulp.task("img", () =>
  gulp
    .src(paths.img)
    .pipe(imagemin())
    .pipe(gulp.dest("../dist/img"))
);
