// Standard
const gulp = require("gulp");
const path = require("path");
const moment = require("moment");
const critical = require('critical');

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
nunjucks.configure({ autoescape: false, noCache: true });

// HTML Minification
const htmlmin = require("gulp-htmlmin");

// HTML Validation

const w3cjs = require('gulp-w3cjs');

// Store Posts Data In Memory
let posts = [];

// Get All Pages Markdown & Create HTML
gulp.task("generateHTML", () => {
  if (posts.length != 0) posts = [];

  // Maintain Directory Structure On Output With {base: "."} Parameter
  return (
    gulp
      .src(paths.markdown, { base: "." })
      // Remove Front Matter, Making It Available On File Object
      .pipe(grayMatter({ remove: true }))
      // Tap Into Stream And Build Posts Data To Be Used To Create Posts Index
      // Reformat Date & Add To File
      .pipe(
        tap(file => {
          if (
            file.data.template === "post" &&
            !posts.map(post => post.title).includes(file.data.title)
          ) {
            let blogDate = file.data.date.toString();
            file.data.formattedDate = moment(
              blogDate.substring(0, 4) +
                "-" +
                blogDate.substring(4, 6) +
                "-" +
                blogDate.substring(6, 9),
              "YYYY-MM-DD"
            ).format("MMMM Do YYYY");
            posts.push(file.data);
          }
        })
      )
      // Tap Into Stream, Convert Markdown To HTML (markdown has been Configured With Highlighting)
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
        Template To Be Used. 'Other' Parameters Specify nunjucks As Template Engine
        */
      .pipe(
        wrap(
          data => {
            return fs
              .readFileSync(`./templates/pages/${data.template}.njk`)
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
    .src("./templates/pages/posts.njk")
    .pipe(
      wrap(
        data => {
          return fs.readFileSync(`./templates/pages/posts.njk`).toString();
        },
        { posts: posts },
        { engine: "nunjucks" }
      )
    )
    // Minify HTML
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulpNunjucks.compile({ posts: posts }))
    .pipe(rename("index.html"))
    .pipe(gulp.dest("../dist/posts"));
  browserSync.reload();
});

// Critical CSS (Above The Fold CSS Generation)

gulp.task("critical", () => {
  critical.generate({
      inline: true,
      base: '../dist/',
      src: 'index.html',
      dest: '../dist/index.html',
      minify: true,
      width: 1290,
      height: 800
  });
});

// Combine & Order HTML Generation & Posts Index Generation
gulp.task("html", () => {
  runSequence("generateHTML", "generatePostsIndex", "critical");
});

// HTML Validation
 
gulp.task('validate', function () {
    gulp.src('../dist/**/*.html')
        .pipe(w3cjs())
        .pipe(w3cjs.reporter());
});
