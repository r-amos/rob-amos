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

// Allow For New/Deleted Actions To Be Watched
const watch = require("gulp-watch");

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
  watch(paths.markdown, () => runSequence("html"));
  watch(paths.templates, () => {
    runSequence("html");
  });
  watch("./stylesheets/**/*.scss", () => runSequence("sass"));
  watch(paths.scripts, () => runSequence("js"));
});

// Sequence Tasks, Before Build Then Watch For Changes
gulp.task("build", () => {
  runSequence("tidy", "sass", ["html","img", "js", "serve"]);
});

// Chain All Tasks
gulp.task("default", ["build"]);
