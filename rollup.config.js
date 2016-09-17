var npm = require("rollup-plugin-node-resolve").npm;

module.exports = {
  entry: "index.js",
  format: "umd",
  moduleName: "bundle",
  plugins: [npm({ jsnext: true })],
  dest: "public/js/bundle.js"
};
