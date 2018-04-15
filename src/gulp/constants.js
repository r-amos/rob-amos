function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true
  });
}

// Define Constants

define("markdown", ["*.md", "./posts/*.md"]);
define("scripts", "./js/**/*.js");
define("css", "./stylesheets/*.scss");
define("img", "./img/*");
define("templates", "./templates/**/*.njk");
define("server", "../dist");
