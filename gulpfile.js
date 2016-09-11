var gulp = require("gulp");
var nodemon = require("gulp-nodemon");
var livereload = require("gulp-livereload");


gulp.task("develop", function developHandler() {
  livereload.listen();
  nodemon({
    script: "bin/www",
    ext: "js jade coffee",
    stdout: false
  }).on("readable", function onNodemonReadable() {
    this.stdout.on("data", function onStdoutData(chunk) {
      if (/^Express server listening on port/.test(chunk)) {
        livereload.changed(__dirname);
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
});

gulp.task("default", [
  "develop"
]);
