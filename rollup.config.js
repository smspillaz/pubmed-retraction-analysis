import npm from "rollup-plugin-node-resolve";

export default {
    entry: "index.js",
    format: "umd",
    moduleName: "bundle",
    plugins: [npm({jsnext: true})],
    dest: "public/js/bundle.js"
};
