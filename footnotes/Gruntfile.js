/*global module:false*/

var now = new Date();


module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    meta: {
      version: "0.1.0"
    },

    concat: {
      options: {

    banner: "\n/*! <%= pkg.name %>.jsx - v<%= pkg.version %> - " +
            "<%= grunt.template.today('yyyy-mm-dd') %> */\n",
        stripBanners: false
      },
      scripts: {
        src: [
        "src/head.jsx",
        "src/globals.jsx",
        "src/settings.jsx",
        "src/ux.jsx",
        "src/ui.jsx",
        "src/util.jsx",
        "src/units.jsx",
        "src/clean_up.jsx",
        "../extendscript_modules/reseter.jsx",
        "src/ruler.jsx",
        "src/pages.jsx",
        "src/stories.jsx",
        "src/processors.jsx",
        "src/main.jsx"
        ],
        dest: "src/tmp/<%= pkg.name %>.concat.<%= pkg.version %>.jsx"
      }
    },

    copy: {
      "script": {
        src: "src/tmp/<%= pkg.name %>.concat.wrap.<%= pkg.version %>.jsx",
        dest: "dist/<%= pkg.name %>.jsx",
      },
        "docs":{
        src: "assets/images/img.gif",
        dest: "dist/docs/assets/images/img.gif",
      }
    },
     /**
     * wrap it
     */
    wrap: {
      "script": {
        src: ["src/tmp/<%= pkg.name %>.concat.<%= pkg.version %>.jsx"],
        dest: "src/tmp/<%= pkg.name %>.concat.wrap.<%= pkg.version %>.jsx",
        options: {
          wrapper: ["(function(thisObj) {", "})(this);\n"]
        },
      },
    },
    watch: {
      files: ["src/*.jsx", "src/*.js", "src/lib/*","../extendscript_modules/*"],
      tasks: ["concat:scripts", "wrap:script","copy:script"]
    },
    markdown: {
      all: {
          options: {
            template: "src/docs/template.html",
              gfm: true,
              highlight: "auto",
            // preCompile: function(src, context) {},
            // postCompile: function(src, context) {},
            templateContext: {
              title:"<%= pkg.name %>",
              now:now.getUTCFullYear().toString() + "-" + (now.getUTCMonth() + 1).toString() + "-" + now.getUTCDate().toString()
            },

              // codeLines: {
              //   before: "<span>",
              //   after: "</span>"
              // }

          },
        files: [{
          expand: true,
          src: "./README.md",
          dest: "./dist/docs/",
          ext: ".html"
        }]
      }
    },
    compress: {
  main: {
    options: {
      archive: "zips/<%= pkg.name %>.<%= pkg.version %>.zip"
    },
    files: [
      // {src: ["path/*"], dest: "internal_folder/", filter: "isFile"}, // includes files in path
      {flatten:true, src:["dist/<%= pkg.name %>.jsx","dist/docs/**"]}, // includes files in path and its subdirs
      // {expand: true, cwd: "path/", src: ["**"], dest: "internal_folder3/"}, // makes all src relative to cwd
      // {flatten: true, src: ["path/**"], dest: "internal_folder4/", filter: "isFile"} // flattens results to a single level
    ]
  }
},
  });
  grunt.registerTask("build", ["concat:scripts", "wrap:script","copy:script","markdown:all","copy:docs","compress:main"]);
  grunt.registerTask("build-docs",["markdown:all","copy:docs"]);
  grunt.registerTask("default", ["watch"]);

};
