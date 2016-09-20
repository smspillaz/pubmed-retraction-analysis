var npm = require("rollup-plugin-node-resolve");
var commonjs = require("rollup-plugin-commonjs");

module.exports = {
  entry: "index.js",
  format: "umd",
  moduleName: "bundle",
  plugins: [npm({ jsnext: true }), commonjs()],
  dest: "public/js/bundle.js"
};
