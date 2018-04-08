// Standard
const gulp = require("gulp");
const path = require("path");

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

// Get BrowserSync Dev Server Instance
const browserSync = require("browser-sync").get("dev-server");
// Stream Manipulation
const tap = require("gulp-tap");
// Task Ordering
const runSequence = require("run-sequence");
// Define Path Constants
const paths = require("../constants");

// File Manipulation
const fs = require("fs");
const rename = require("gulp-rename");

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

// Store Posts Data In Memory
const posts = {};

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

// Combine & Order HTML Generation & Posts Index Generation
gulp.task("html", () => {
  runSequence("generateHTML", "generatePostsIndex");
});
