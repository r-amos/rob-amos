const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const browserSync = require("browser-sync").create();
const tap = require("gulp-tap");
const runSequence = require("run-sequence");

const rename = require("gulp-rename");

//Delete Files
const clean = require("gulp-clean");

// ES6 & JS Minification
const babel = require("gulp-babel");
const minify = require("gulp-minify");

// Converting Markdown To HTML & Extract Grey Matter
const hljs = require("highlightjs");
const grayMatter = require("gulp-gray-matter");
// Configure Markdown To Use Highlightjs & Wrap Blocks In Classes
const markdown = require("markdown-it")({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(lang, str, true).value +
          "</code></pre>"
        );
      } catch (__) {}
    }

    return (
      '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
    );
  }
});

// Wrap Stream Content With A Template
const wrap = require("gulp-wrap");

// Rename File Extensions
const ext = require("gulp-ext");

// Templating Engine
const nunjucks = require("nunjucks");
const gulpNunjucks = require("gulp-nunjucks");
// Prevent Auto Escaping The Outputted HTML
nunjucks.configure({ autoescape: false });

// HTML Minification
const htmlmin = require("gulp-htmlmin");

// SASS
const sass = require("gulp-sass");
const cleanCSS = require("gulp-clean-css");
const autoprefixer = require("gulp-autoprefixer");

// Define Path Constants
const paths = {
  markdown: ["*.md", "./posts/*/*.md"],
  scripts: "./js/**/*.js",
  css: "./stylesheets/**/*.scss",
  templates: "./templates/*.html",
  server: "../dist"
};

// Store Posts Data In Memory
const posts = {};

//Tidy Up - Delete Dist Folder
gulp.task("tidy", () => {
  return gulp.src("../dist", { read: false }).pipe(clean({ force: true }));
});

// Get All Pages Markdown & Create HTML
gulp.task("generateHTML", () => {
  // Maintain Directory Structure On Output With {base: "."} Parameter
  return (
    gulp
      .src(paths.markdown, { base: "." })
      // Remove Front Matter, Making It Available On File Object
      .pipe(grayMatter({ remove: true }))
      // Tap Into Stream And Build Posts Data To Be Used To Create Posts Index
      .pipe(
        tap(file => {
          //TODO: Logic To Rip Section Of Text to Act As A Preview
          posts[path.basename(file.path)] = file.data;
        })
      )
      // Tap Into Stream, Convert Markdown To HTML (markdown Configured Eith Highlighting)
      .pipe(
        tap(file => {
          file.contents = Buffer.from(
            markdown.render(file.contents.toString())
          );
        })
      )
      /*  
            Wrap Generated HTML In Template, Use A Call Back To Acces File Object
            Data Property Containing Front Matter Added In GrayMatter. Use To Determine
            Template To Be Used. Other Parameters Specify nunjucks As Template Engine

        */
      .pipe(
        wrap(
          data => {
            return fs
              .readFileSync(`./templates/${data.template}.html`)
              .toString();
          },
          null,
          { engine: "nunjucks" }
        )
      )
      // Minify HTML
      .pipe(htmlmin({ collapseWhitespace: true }))
      // Tap Into Stream & Change Output For Posts Only
      .pipe(
        tap((file, t) => {
          if (file.data.template === "post")
            return t.through(rename, [`./posts/${file.data.url}`]);
        })
      )
      //Change Extentions From .md
      .pipe(ext.replace("html"))
      .pipe(gulp.dest("../dist"))
  );
});

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

//Transpile ES6, Minify (Exclude Original Source)
gulp.task("js", () => {
  return gulp
    .src(paths.scripts)
    .pipe(babel({ presets: ["env"] }))
    .pipe(minify({ noSource: true }))
    .pipe(gulp.dest("../dist/js"));
});

// Create BrowserSync Server & Watch For Changes
gulp.task("serve", () => {
  browserSync.init({
    server: paths.server
  });
  // Watch Markdown, Template, SASS & JS Files For Changes
  gulp.watch([paths.markdown, paths.templates], ["html"]);
  gulp.watch(paths.css, ["sass"]);
  gulp.watch(paths.js, ["js"]);
});

// Combine & Order HTML Generation & Posts Index Generation
gulp.task("html", () => {
  runSequence("generateHTML", "generatePostsIndex");
});

// Take Posts Data In Memory & Iterate To Create
// The Post Listing Index
gulp.task("generatePostsIndex", () => {
  gulp
    .src("./templates/posts.html")
    .pipe(gulpNunjucks.compile({ posts: posts }))
    .pipe(rename("index.html"))
    .pipe(gulp.dest("../dist/posts"));
  browserSync.reload();
});

// Sequence Tasks, Before Build Then Watch For Changes
gulp.task("build", () => {
  runSequence("tidy", ["html", "js", "sass", "serve"]);
});

// Chain All Tasks
gulp.task("default", ["build"]);
