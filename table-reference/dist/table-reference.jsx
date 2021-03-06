(function(thisObj) {

/*! table-reference.jsx - v0.2.6 - 2015-12-11 */
/*
 * table-reference.jsx
 * creates hyperlinks from patterns
 * currently the pattern is for the sources
 *
 *  $$(NumberAbb. Number)$$
 *
 * for the targets
 *
 * $$NumberName Number$$
 *
 * it also connects the targets from process one to
 *
 * ==NumberName Number==
 *
 * e.g.
 *
 * ##(1Abb. 1)## -- to --> ##1Abb. 1## -- to --> ||1Abb. 1||
 *
 *
 *
 *
 * it creates its own find change grep query if necessary and executes it
 *
 * https://github.com/fabiantheblind/emb-scripts
 *
 * Copyright (c) 2015 fabiantheblind
 * Licensed under the MIT license.
 */

// ##Version history
// 0.2.5 add security check for to many targets
// 0.2.4 multiple sources
// 0.2.3 update query
// 0.2.2 update query
// 0.2.1 added jumptotext or not
// 0.2.0 works fine
// 0.1.0 initial version based on image-reference.jsx
//


// #target "indesign-8" // jshint ignore:line

var DEBUG = true;
var now = new Date();
var formatted_date = now.getUTCFullYear().toString() + "-" + (now.getUTCMonth() + 1).toString() + "-" + now.getUTCDate().toString();
var formatted_time = now.getHours().toString()+ "-" + now.getMinutes().toString() + "-" +now.getSeconds().toString();

var settings = {
    "jumptotext":true,
  "delimiter": null,
  "linefeeds": null,
  "rewirte": true,
  "queries": [{
    "name":"Find text to table sub text",
    "prefix": "ToTbl-",
    "source": {
      "fcquery": "01-emb-table-in-text-source",
      "mode": SearchModes.grepSearch,
      "findGrepPreferences": {
        "findWhat": "\\$\\$\\d{1,10}-([0-9]{1,10}+\\.?[0-9]{1,10}.*?|[0-9]{1,10}.*?)\\$\\$",
      },
      "changeGrepPreferences": {
        "changeTo": "$1"
      },
      "parstyle": null,
      "charstyle": null
    },
    "target": {
      "fcquery": "02-emb-table-in-text-target",
      "mode": SearchModes.grepSearch,

      "findGrepPreferences": {
        "findWhat": "\\$\\|\\d{1,10}-([0-9]{1,10}+\\.?[0-9]{1,10}.*?|[0-9]{1,10}.*?)\\|\\$",
      },
      "changeGrepPreferences": {
        "changeTo": "$1"
      },
      "parstyle": null,
      "charstyle": null,
    }
  }, {
    "prefix": "ToTblRef-",
    "name":"Find sub table text to table reference",
    "source": {
      "fcquery": "03-emb-table-sub-text-source",
      "mode": SearchModes.grepSearch,

      "findGrepPreferences": {
        "findWhat": "\\$\\|\\d{1,10}-([0-9]{1,10}+\\.?[0-9]{1,10}.*?|[0-9]{1,10}.*?)\\|\\$",
      },
      "changeGrepPreferences": {
        "changeTo": "$1"
      },
      "parstyle": null,
      "charstyle": null
    },
    "target": {
      "fcquery": "04-emb-table-sub-text-target",
      "mode": SearchModes.grepSearch,

      "findGrepPreferences": {
        "findWhat": "==\\d{1,10}-([0-9]{1,10}+\\.?[0-9]{1,10}.*?|[0-9]{1,10}.*?)==",
      },
      "changeGrepPreferences": {
        "changeTo": "$1"
      },
      "parstyle": null,
      "charstyle": null
    }
  }],
  "hyperlinks": {
    "prefix": "LYNK-",
    "appearance": HyperlinkAppearanceHighlight.NONE
  }
};



if (DEBUG) {
  settings.hyperlinks.appearance = HyperlinkAppearanceHighlight.OUTLINE;
}
/**
 * check the operating system to use the right linefeeds
 * @param  {String} $.os.substring(0,1) Check the first character
 * @return {nothing}
 */
if($.os.substring(0,1) == "M"){
  if(DEBUG){$.writeln("OS is Macintosh");}
  settings.delimiter = "\n";
  settings.linefeeds = "Unix";

}else{
  if(DEBUG){$.writeln("OS is Windows");}
  settings.delimiter = "\r";
  settings.linefeeds = "Windows";
}
/**
 * reset the FC fields
 * @return {nothing}
 */
var reset = function() {
  // now empty the find what field!!!thats important!!!
  app.findGrepPreferences = NothingEnum.nothing;
  app.findTextPreferences = NothingEnum.nothing;

  // empts the change to field!!!thats important!!!
  app.changeGrepPreferences = NothingEnum.nothing;
  app.findTextPreferences = NothingEnum.nothing;
};


/**
 * [padder description]
 * @param  {[type]} n     [description]
 * @param  {[type]} width [description]
 * @param  {[type]} z     [description]
 * @return {[type]}       [description]
 */
var padder = function(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

/**
 * a logging function to get the result of the process to the user
 * @param  {Document}  d    the doc to work on
 * @param  {String}    str  the string to log
 * @return {nothing}
 */
var logger = function(d, str, fn) {
  var del = settings.delimiter;
  var folder = Folder(d.filePath + "/script-logs");
  if(folder.exists !== true){
    folder.create();
  }

  var path = folder.fsName + "/log." + nf +"." + File($.fileName).name + " " + formatted_date + " " + formatted_time + ".txt";
  if (DEBUG) {
    $.writeln(path);
  }

  var head = "Script: " + File($.fileName).name + del + "Execution time: " + formatted_date + " " + formatted_time + del;
  var log = File(path);
  log.open("w");
  log.encoding = "UTF-8";
  log.lineFeed = settings.linefeeds; //convert to UNIX lineFeed
  // if(log !==null){
  log.write(head + str);
  log.close();
  log.execute();
  // }

};

/**
 * train InDesign. Creates the FC queries
 * @param  {Object}   obj  the settings to use
 * @return {nothing}
 */
var trainer = function(obj) {

  try {
    app.loadFindChangeQuery(obj.fcquery, obj.mode);
    var passed = true;
    if (DEBUG) $.writeln("passed training. Query exists");
    if (settings.rewirte === true) {
      if (DEBUG) {
        $.writeln("rewriting query");
      }
      // thanks peter kahrel for that path
      // http://www.kahrel.plus.com/indesign/grep_query_manager.html
      var queryFolder = app.scriptPreferences.scriptsFolder.parent.parent.fsName + "/Find-Change Queries/Grep/";
      File(queryFolder + "/" + obj.fcquery + ".xml").remove();
      reset();
      //-----------
      app.findGrepPreferences = obj.findGrepPreferences;
      app.changeGrepPreferences = obj.changeGrepPreferences;
      app.saveFindChangeQuery(obj.fcquery, obj.mode);
    }
    // if (passed) return;
  } catch (e) {
    if (DEBUG) {
      $.writeln("could not find query");
    }
    // setup fc here
    reset();
    //-----------
    app.findGrepPreferences.findWhat = obj.findGrepPreferences.findWhat;
    // app.findGrepPreferences.findWhat = obj.findGrepPreferences.findWhat;
    app.changeGrepPreferences.changeTo = obj.changeGrepPreferences.changeTo;
    // app.findGrepPreferences = obj.findGrepPreferences;
    // app.changeGrepPreferences = obj.changeGrepPreferences;
    app.findChangeGrepOptions.includeFootnotes = true;
    app.findChangeGrepOptions.includeHiddenLayers = true;
    app.findChangeGrepOptions.includeLockedLayersForFind = true;
    app.findChangeGrepOptions.includeLockedStoriesForFind = true;
    app.findChangeGrepOptions.includeMasterPages = true;

    app.saveFindChangeQuery(obj.fcquery, obj.mode);
    if (DEBUG) {
      $.writeln("query created");
    }
  }
};

/**
 * search the pattern by FC query
 * @param  {Document} d  the doc to work on
 * @return {Object}      the found items packed in an object
 */
var searcher = function(d, queryname, querymode) {
  reset();
  app.loadFindChangeQuery(queryname, querymode);
  var result = d.findGrep();


  // var report = "Sources:\n";
  // for (var i = 0; i < sources.length; i++) {
  //   report += sources[i].contents;
  // }
  // report += "\nTargets:\n";

  // for (var j = 0; j < targets.length; j++) {
  //   report += targets[j].contents;
  // }
  // if (DEBUG) $.writeln("\n-----\n" + report);

  return result;
};
/**
 * Module uses the FindChange possibilites and removes all used references
 * @param  {Array Text}              items  Text elemts returned by app.documents[index].findGrep()
 * @param  {Array of Boolean}        unused Coresponds with the items array if true the element was used
 * @param  {String}                  query  Name of the FindChange query to use
 * @param  {SearchModes.grepSearch}  mode   The type of the FC query
 * @param  {Document}                d      the current doc to work on
 * @return {nothing}
 */
var cleaner = function(d, items, unused, query, mode, parstylename, charstylename) {
  reset();
  var par = null;
  for(var p = 0; p < d.allParagraphStyles.length;p++){
    if(parstylename == d.allParagraphStyles[p].name){
      par = d.allparagraphstyles[p];
      if(DEBUG){$.writeln("got the right par style: " + par.name);}
      break;
    }
  }

  if(DEBUG === true && par === null){$.writeln("could not find the parstyle with the name " + parstylename);}

  var cha = null;
  for(var c = 0; c < d.allCharacterStyles.length;c++){
    if(charstylename == d.allCharacterStyles[c].name){
      cha = d.allCharacterStyles[c];
      if(DEBUG){$.writeln("got the right char style: " + cha.name);}
      break;
    }
  }

  if(DEBUG === true && cha === null){$.writeln("could not find the charstyle with the name " + charstylename);}

  app.loadFindChangeQuery(query, mode);
  for (var i = 0; i < items.length; i++) {
    if (DEBUG) {
      $.writeln(items[i].contents);
      $.write("is ");
      if (unused[i] === true) {
        $.writeln("used ");

      } else {
        $.writeln("unused ");

      }

    }
    if (unused[i] === true) {
      if (DEBUG) {
        $.writeln("clean up " + items[i].contents);
      }
      if(par !== null){
        app.changeGrepPreferences.appliedParagraphStyle = par;
      }

      if(cha !== null){
        app.changeGrepPreferences.appliedCharacterStyle = cha;
      }

      items[i].changeGrep();

    }

  }
  // d.changeGrep();
};

var string_cleaner = function(str){
  var result = str.replace(/\s/g, " ");
  return result;
};
/**
 * Removes all hyperlinks, hl-sources and hl-targets currently unused
 * @param  {Document} d       the current document
 * @param  {String}   prefix  a prefix for identifiying the hyperlinks
 * @return {nothing}
 */
var hl_destroyer = function(d, prefix) {

  var hlsdest = d.hyperlinkTextDestinations;

  for (var j = hlsdest.length - 1; j >= 0; j--) {
    var dest = hlsdest[j];
    if (dest.name.substring(0, prefix.length) == prefix) {
      dest.remove();
      if (DEBUG) {
        $.writeln("found link destination with prefix: " + prefix + " and removed it");
      }
    }
  }

  var hlssrc = d.hyperlinkTextSources;
  for (var k = hlssrc.length - 1; k >= 0; k--) {
    var src = hlssrc[k];
    if (src.name.substring(0, prefix.length) == prefix) {
      src.remove();
      if (DEBUG) {
        $.writeln("found link source with prefix: " + prefix + " and removed it");
      }
    }
  }

  var hls = d.hyperlinks;
  for (i = hls.length - 1; i >= 0; i--) {
    var link = hls[i];
    if (link.name.substring(0, prefix.length) == prefix) {
      link.remove();
      if (DEBUG) {
        $.writeln("found link with prefix: " + prefix + " and removed it");
      }
    }

  }
};

/**
 * builds the hyperlinks
 * @param  {Document} d       the doc to work on
 * @param  {Object}   data    an object that holds all the found items
 * @param  {String}   prefix  the refix for the hyperlinks
 * @return {Object}           a collection of results for further processing
 */
var hl_builder = function(d, data, prefix, slice) {
  var del = settings.delimiter;
  var report = "";
  var unused_tgt_report = "";
  var unused_src_report = "";
  var unused_sources = [];
  var unused_targets = [];

  if (slice === null || slice === undefined) {
    slice = {
      "src": 2,
      "tgt": 2
    };
  }
  for (var k = 0; k < data.src.length; k++) {
    unused_sources.push(false);
  }
  for (var m = 0; m < data.tgt.length; m++) {
    unused_targets.push(false);
  }

// The
// YOU DID NOT WORK RIGHT CHECK
  var cleantargets_report = [];
  var targets_not_clean = false;
  var alltargets = [];
  for(var n = 0; n < data.tgt.length;n++){
    $.writeln(data.tgt[n].contents);
    alltargets.push(data.tgt[n].contents);
    for(var o = 0; o < data.tgt.length;o++){
      if(n !== o){
        if(data.tgt[n].contents === data.tgt[o].contents){
          targets_not_clean = true;
          var character = data.tgt[n].characters[0];
          var textframe =  character.parentTextFrames[0];
          var pg;
          try{
            pg = textframe.parentPage.name;
          }catch(e){
            pg = null;
          }
          var str = (pg === null)  ? "Target \"" + data.tgt[n].contents +"\" is a duplicate! The containing textFrame is somewhere in the nimbus of your document" :"Target \"" + data.tgt[n].contents +"\" on page " + pg +" is a duplicate!";
          cleantargets_report.push(str);
          // alert(data.tgt[n].constructor.name);
        }
        }else{
          // dont do enything when we are at the same index
        }
    }
  }

  if(targets_not_clean === true){
    var str_tgts = alltargets.join("\n");
    var str_report = cleantargets_report.join("\n");
    var res = prompt("You have to many targets! I can't process them. Best thing is to revert to the last saved state?\n All changes the script made will be lost! Please use the upcoming report to clean your document. Fix your targets in your document and run the script again. Best is you DONT SAVE the document.");
    if(res ===true){
      d.revert();
    }
    logger(d, "ERROR REPORT DUPLICATE TARGETS"+ del + "DUPLICATES:" + del+ str_report +del+"All targets in document:"+del+ str_tgts ,"DUPLICATES");
    // abort write log!
    exit();
  }


  if(DEBUG){$.writeln("Looping Targets start");}
  for (var i = 0; i < data.tgt.length; i++) {
    var tgt_has_src = false;
    // if(DEBUG) $.writeln(data.tgt[i].contents);
    var clear_tgt_content = data.tgt[i].contents.slice(slice.tgt, -slice.tgt);
    // var clear_tgt_content = string_cleaner(tmp_tgt);
    if (DEBUG) {
      $.writeln("Target: " + clear_tgt_content);
    }
    report += "------- " + data.tgt[i].contents + "-------" + del + del;

    var dest = null;
    // try{

    if (settings.jumptotext === true) {
      // jumps to text
      dest = d.hyperlinkTextDestinations.add(data.tgt[i]);
    } else {
      // jumps tp page
      var parentItem = data.tgt[i].parentTextFrames[0];
      var parentPage = null;
      if (parentItem instanceof TextFrame) {
        parentPage = parentItem.parentPage;
      } else if (parentItem instanceof TextPath) {
        parentPage = parent.parentPage;
      }

      dest = d.hyperlinkPageDestinations.add({
        "destinationPage": parentPage,
        "viewSetting": HyperlinkDestinationPageSetting.FIT_WINDOW
      });

    }
    // }catch(e){
    //   var str = "This hyperlink text destinations is already in use\n"+data.tgt[i].contents+"\nSkipping...";
    //   alert(str);
    //   report += str;
    //   continue;
    // }

    dest.name = prefix + clear_tgt_content + formatted_date + " " + formatted_time + padder(i, 4, "-");

    if(DEBUG){$.writeln("Looping sources for target " + data.tgt[i].toSource());}
    for (var j = 0; j < data.src.length; j++) {
      // var src_has_tgt = false;
      var clear_src_content = data.src[j].contents.slice(slice.src, -slice.src);
      // var clear_src_content = string_cleaner(tmp_src);
      if (DEBUG) {
        $.writeln("Source: " + clear_src_content);
      }

      if (clear_src_content === clear_tgt_content) {
        tgt_has_src = true;
        // src_has_tgt = true;
        unused_sources[j] = true;
        unused_targets[i] = true;
        if (DEBUG) {
          $.writeln("found a match src: " + clear_src_content + " tgt: " + clear_tgt_content);
        }
        report += data.src[j].contents + " --> " + data.tgt[i].contents + del;
        // try{
        // if(DEBUG){$.writeln("ERROR: " +data.src[j].contents);}
        // alert(data.src[j].toSource());
        var src = d.hyperlinkTextSources.add(data.src[j]);
        // }catch(e){
          // data.src[j].fillColor = d.swatches[4];
        //   var str = "This text source is already in use by another hyperlink\n" + data.src[j].contents;
        //   alert(str);
        //   report+=str;
        //   continue;
        // }
        src.name = prefix + clear_src_content + formatted_date + " " + formatted_time + String(i) + padder(j, 4, "-");
        // try {

        var hl = d.hyperlinks.add({
          source: src,
          destination: dest,
          highlight: settings.hyperlinks.appearance,
          name: prefix + clear_src_content + String(i) + padder(j, 4, "-")
        });
        // }catch(e){
        //   var str = "This text is already in use by another hyperlink:\nSource: " + src.sourceText.contents +"\nTarget: "+dest.destinationText.contents ;
        //   alert(str);
        //   report+=str;
        //   continue;
        // }

        // match
      }

      // if(src_has_tgt === false){

      // }
    }
    if (tgt_has_src === false) {
      unused_tgt_report += "Target: " + data.tgt[i].contents + " has no source" + del;
    }
  }
  for (var l = 0; l < data.src.length; l++) {
    if (unused_sources[l] === false) {
      unused_src_report += "Source: " + data.src[l].contents + " has no targets" + del;
    }

  }
  return {
    "unused_sources": unused_sources,
    "unused_targets": unused_targets,
    "unused_src_report": unused_src_report,
    "unused_tgt_report": unused_tgt_report,
    "report": report
  };
};

/**
 * This is the main element to call the hyperlink destroy and creation
 * @param  {Document} d     the document to work on
 * @param  {Object}   data  collection of elements found by findGrep()
 * @return {Object}         pass through the result of the hl_builder()
 */
var hyperlinker = function(d, data, slice, prefix) {
  // remove all existing hyperlinks
  // d.hyperlinks.everyItem().remove();
  if (prefix === null || prefix === undefined) {
    prefix = settings.hyperlinks.prefix;
  }
  // remove links created by script
  //
  // hl_destroyer(d, prefix); // <-- Should not happen
  // it could be that some links get added after script run.
  //
  var res = hl_builder(d, data, prefix, slice);

  return res;
};
/**
 * The main function to execute
 * everything else is separated into modules
 * @return {nothing}
 */

var main = function() {
  for (var t = 0; t < settings.queries.length; t++) {
    trainer(settings.queries[t].source);
    if (DEBUG) {
      $.writeln("Trained source for query No " + (t + 1));
    }

    trainer(settings.queries[t].target);
    if (DEBUG) {
      $.writeln("Trained target for query No " + (t + 1));
    }
  }

  if (app.documents.length > 0) {
    var doc = app.activeDocument;
    if (doc.saved !== true) {
      alert("Your document was never saved.\nPlease save it at least once so I can create the log file for you. Aborting script execution ");
      return;
    }
    if (doc.modified === true) {
      var saveit = confirm("Your document was modified before the script execution. Do you want me to save these changes before proceeding? ");
      if (saveit === true) {
        doc.save();
      }
    }
    // first run

    if (DEBUG) {
      $.writeln("Running first search and hyperlink build\n------------------------");
    }
    var results = [];
    var data = [];
    var sources = [];
    var targets = [];
    var del = settings.delimiter;
    var slice = [{
      "src": 2,
      "tgt": 2
    }, {
      "src": 2,
      "tgt": 2
    }];

    for (var q = 0; q < settings.queries.length; q++) {
      sources.push(
        searcher(
          doc,
          settings.queries[q].source.fcquery,
          settings.queries[q].source.mode
        )
      );
      targets.push(
        searcher(
          doc,
          settings.queries[q].target.fcquery,
          settings.queries[q].target.mode
        )
      );
      data.push({
        "src": sources[q],
        "tgt": targets[q]
      });
      if (DEBUG) {
        $.writeln(data[q].src.length + " " + data[q].tgt.length);
      }

      var prefix = settings.hyperlinks.prefix + settings.queries[q].prefix;

      results.push(
        hyperlinker(
          doc,
          data[q],
          slice[q],
          prefix
        )
      );

      if (DEBUG) {
        $.writeln(results[q].toSource());
      }
      if (DEBUG) {
        $.writeln("Running search and hyperlink build No: " + (q + 1) + "\n------------------------");
      }
    }

    // clean up
    for (var i = 0; i < data.length; i++) {

      cleaner(
        doc,
        data[i].src,
        results[i].unused_sources,
        settings.queries[i].source.fcquery,
        settings.queries[i].source.mode,
        null,
        settings.queries[i].source.charstyle
      );

      cleaner(
        doc,
        data[i].tgt,
        results[i].unused_targets,
        settings.queries[i].target.fcquery,
        settings.queries[i].target.mode,
        null,
        settings.queries[i].target.charstyle
      );
    }

    var str = "#Overview: " + del +
      "Found: " + del + "Sources: " + data[0].src.length + del + "Targets: " + data[0].tgt.length + del + del + "Sources: " + data[1].src.length + del + "Targets: " + data[1].tgt.length + del + del;

    var line = del + "---------------------------------" + del;
    var res = str +
      results[0].unused_src_report + del +
      results[0].unused_tgt_report + line + del;

    res += results[1].unused_src_report + del +
      results[1].unused_tgt_report + line + del +
      results[0].report + results[1].report;

    logger(doc, res, "HYPERLINKS");

  } else {

    alert("Please open a document to work on.\nThe script will process the front most document.");
  }
};

main();
})(this);
