const gulp = require("gulp");

// Dev Server
const browserSync = require("browser-sync").create("dev-server");

// Task Ordering
const runSequence = require("run-sequence");

//File Manipulation
const clean = require("gulp-clean");

// Import Gulp Tasks
const requireDir = require("require-dir")("./gulp/tasks");
const paths = require("./gulp/constants");

//Tidy Up - Delete Dist Folder
gulp.task("tidy", () => {
  return gulp.src("../dist", { read: false }).pipe(clean({ force: true }));
});

// Create BrowserSync Server & Watch For Changes
gulp.task("serve", () => {
  browserSync.init({
    server: paths.server
  });
  // Watch Markdown, Template, SASS & JS Files For Changes
  gulp.watch([paths.markdown, paths.templates], ["html"]);
  gulp.watch(paths.css, ["sass"]);
  gulp.watch(paths.scripts, ["js"]);
});

// Sequence Tasks, Before Build Then Watch For Changes
gulp.task("build", () => {
  runSequence("tidy", ["html", "js", "sass", "serve"]);
});

// Chain All Tasks
gulp.task("default", ["build"]);
