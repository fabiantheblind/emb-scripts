(function(thisObj) {

/*! footnotes.jsx - v0.1.0 - 2015-04-20 */
/*
 * footnotes
 * https://github.com/fabiantheblind/emb-scripts
 *
 * Copyright (c) 2015 fabiantheblind
 * Licensed under the MIT license.
 */

var DEBUG = false;
var now = new Date();
var formatted_date = now.getUTCFullYear().toString() + "-" + (now.getUTCMonth() + 1).toString() + "-" + now.getUTCDate().toString();
var formatted_time = now.getHours().toString()+ "-" + now.getMinutes().toString() + "-" +now.getSeconds().toString();


var settings = {
  "continuousNumbering" :false,
  "doFootnotesStory":true,
  "footnoteNumberStyle":"Fussnotenziffer unten",
   "units" : {
    "horizontal": MeasurementUnits.MILLIMETERS,
    "vertical":MeasurementUnits.MILLIMETERS
  }
};
var doc_check = function(){
var d = null;
  if (app.documents.length < 1) {
    alert("Please open a document I can work with");
  } else {
    d = app.documents[0];
    if (d.saved !== true) {
      alert("Your document was never saved.\nPlease save it at least once so I can create the log file for you. Aborting script execution ");
      exit();
      // return;
    }
    if (d.modified === true) {
      var saveit = confirm("Your document was modified before the script execution. Do you want me to save these changes before proceeding? ");
      if (saveit === true) {
        d.save();
      }
    }
  } // end of doc
  return d;
};
var create_window = function(msg, st_length, fn_length) {
  var gutter = 5;
  var x = gutter;
  var y = gutter;
  var w = 300 - (gutter);
  var h = 15;
  var win = new Window("palette"); // create new palette
  // if (stories.length === 1) {
  //   msg = "Processing selected story";
  // } else {
  //   msg = "Processing whole document";
  // }
  win.txt = win.add('statictext', [x, y, w, y + h], msg); // add some text to the wdow
  win.txt.alignment = 'left';
  y += h + gutter;
  win.st_txt = win.add('statictext', [x, y, w, y + h], "stories " + st_length); // add some text to the wdow
  win.st_txt.alignment = 'left';
  y += h + gutter;
  win.stories_bar = win.add("progressbar", [x, y, w, y + h], 0, st_length); // add the bar
  // win.stories_bar.preferredSize = [300, 20]; // set the size
  // for (var st = 0; st < stories.length; st++) {
  //   footnoteslength += stories[st].footnotes.length;
  // }
  y += h + gutter;
  win.footn_txt = win.add('statictext', [x, y, w, y + h], "footnotes " + fn_length); // add some text to the wdow
  win.footn_txt.alignment = 'left';
  y += h + gutter;
  win.footn_bar = win.add("progressbar", [x, y, w, y + h], 0, fn_length); // add the bar
  // win.footn_bar.preferredSize = [300, 20]; // set the size
  return win;
};


/**
 * Taken from ScriptUI by Peter Kahrel
 * http://www.kahrel.plus.com/indesign/scriptui.html
 * see also
 * https://github.com/fabiantheblind/extendscript/wiki/Progress-And-Delay
 * @param  {Palette} w    the palette the progress is shown on
 * @param  {Number} stop the max value of the progressbar
 * @return {ProgressBar}  returns the progressbar element to play with
 */

// usage
// var progress_win = new Window("palette"); // creste new palette
// progress = progress_bar(progress_win, end, 'Calculating Positions'); // call the pbar function
//
// progress.value = progress.value + 1;
//
// progress.parent.close();
//
function progress_bar(w, stop, labeltext) {
  var txt = w.add('statictext', undefined, labeltext); // add some text to the window
  var pbar = w.add("progressbar", undefined, 0, stop); // add the bar
  pbar.preferredSize = [300, 20]; // set the size
  w.show(); // show it
  return pbar; // return it for further use
}


/**
 * [get_height description]
 * @param  {[type]} p [description]
 * @return {[type]}   [description]
 */
var get_height = function(p) {
  var gb = null;
  var res = p.createOutlines(false);
  if (DEBUG) {
    $.writeln("created outline");
    $.writeln(res[0].constructor.name);
  }
  gb = res[0].geometricBounds;
  for (var i = res.length - 1; i >= 0; i--) {
    res[i].remove();

  }
  return gb;
};


var get_height_2c = function(fr) {
  try {

    var polygons = fr.createOutlines(false);
    var y2 = 0;

    for (var i = 0; i < polygons.length; i++) {
      if (polygons[i].geometricBounds[2] > y2) {
        y2 = polygons[i].geometricBounds[2];
      }
    }
    for (var j = polygons.length - 1; j >= 0; j--) {
      polygons[j].remove();
    }
    return y2;
  } catch (e) {
    return fr.geometricBounds[2];
  }
};

// var get_textframe_lower_bounds = function(l){

//   return l.baseline;
// };
var frame_height_calculator = function(pars, tfgb) {

  var gb = null;
  var prev_gb = null;
  var yc1 = 0;
  var yc2 = 0;
  var y = 0;
  var diff = 0;
  for (var i = 0; i < pars.length; i++) {
    var p = pars[i];
    gb = get_height(p);
    if (prev_gb === null) {
      yc1 = gb[0];
      if (DEBUG) {
        $.writeln("first iteration");

      }
    } else {
      if (gb[1] === prev_gb[1]) {
        if (DEBUG) {
          $.writeln("we are still in the same column");
        }
      } else {
        if (DEBUG) {
          $.writeln("new column");
        }
        yc2 = gb[0];
        break;
      }
    }
    prev_gb = gb;
  } // end of loop

  if ((yc1 === 0) || yc2 === 0) {
    // we only have footnotes in one column.
    // That means we need to get the heigt of the whole tf as yc2 or yc1
    if (yc2 === 0) {
      diff = (tfgb[2] - yc1);
      y = tfgb[2] - (diff / 2);
    } else if (yc1 === 0) {
      diff = (tfgb[2] - yc2);
      y = tfgb[2] - (diff / 2);
    }
  } else {
    var diff1 = tfgb[2] - yc1;
    var diff2 = tfgb[2] - yc2;
    y = tfgb[2] - ((diff1 + diff2) / 2);


    // at this point we have footnotes in both colums
    if (yc1 === yc2) {
      y = yc1;
      if (DEBUG) {
        $.writeln("This should not happen often");
      }
    }
    if (DEBUG) {
      $.writeln("Y is: " + y);
    }
  }
  return y;
};

var footnote_infos = function(tf, txt) {
  var pg = tf.parentPage;
  var infofr = pg.textFrames.add({
    contents:"This frame is just to see which footnotes where originally on this page.\n"
    });
  var d = pg.parent.parent;
  var pw = d.documentPreferences.pageWidth;
  var ph = d.documentPreferences.pageHeight;
var gb = [];
  if (pg.side === PageSideOptions.LEFT_HAND) {
    gb = [0,-50,ph,-5 ];

  } else if (pg.side === PageSideOptions.RIGHT_HAND) {
    gb = [0, pw + 5, ph, pw + 50];
  }
  infofr.geometricBounds = gb;
  infofr.contents+=  txt;
};
var units = {};
units.get = function(d) {
  var u = {
    "horizontal": d.viewPreferences.horizontalMeasurementUnits,
    "vertical": d.viewPreferences.verticalMeasurementUnits

  };
  return u;
};
units.set = function(d, u) {
  d.viewPreferences.horizontalMeasurementUnits = u.horizontal;
  d.viewPreferences.verticalMeasurementUnits = u.vertical;
};
var clean_up = {};

clean_up.change = {};
clean_up.change.grep = function(item, grepfw, grepct, style) {
  reset();
  app.findGrepPreferences.findWhat = grepfw;
  app.changeGrepPreferences.changeTo = grepct;
  if (style !== null) {
    app.changeGrepPreferences.appliedCharacterStyle = style;
  }
  item.changeGrep();
};

clean_up.find = {};

clean_up.find.text = function(item, textfw, textct, style) {
  app.findTextPreferences.findWhat = textfw;
  app.changeTextPreferences.changeTo = textct;
  if(style !== null){
    app.changeTextPreferences.appliedCharacterStyle = style;
  }
  var res = item.findText();
  return res;
};
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


var set_ruler = function(d){
  var r = d.viewPreferences.rulerOrigin;
  d.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
  return r;
};

reset_ruler = function(d, r){
  d.viewPreferences.rulerOrigin = r;
};

// http://forums.adobe.com/thread/615381
var  find_page = function(theObj) {
     if (theObj.hasOwnProperty("baseline")) {
          theObj = theObj.parentTextFrames[0];
     }
     while (theObj !== null) {
          if (theObj.hasOwnProperty ("parentPage")) return theObj.parentPage;
          var whatIsIt = theObj.constructor;
          switch (whatIsIt) {
               case Page : return theObj;
               case Character : theObj = theObj.parentTextFrames[0]; break;
               // case Footnote :;
               // drop through
               case Cell : theObj = theObj.insertionPoints[0].parentTextFrames[0]; break;
               case Note : theObj = theObj.storyOffset; break;
               case Application : return null;
          }
          if (theObj === null) return null;
          theObj = theObj.parent;
     }
     return theObj;
}; // end findPage
var find_stories = function(d) {
    var array = [];
    // no selection: return all stories
    if(app.selection.length === 0) {
        alert("Please select a story to work on","Convert footnotes", true);
        exit();

    } else {
        try {

            var ps = app.selection[0].parentStory;
            return [app.selection[0].parentStory];
        } catch(e) {
            alert("Invalid selection", "Convert footnotes", true);
            exit();
        }
    }
};

var get_footnotes_length = function(stories){
    var num = 0;
          for (var st = 0; st < stories.length; st++) {
        num += stories[st].footnotes.length;
      }
      return num;
};
var main = function() {
  var rulerorigin = null;
  var curr_units = null;
  // var curr_horizontalMeasurementUnits = null;
  // var curr_verticalMeasurementUnits = null;
  // get all the stories
  var stories = null;
  var footnotestyle = null;
  var markerstyle = null;
  var separator = null;
  var win = null;
  var msg = "";
  var footnoteslength = 0;
  var doc = null;
  var footnote_story = null;

  app.scriptPreferences.enableRedraw = true;

  doc = doc_check();
  if (doc === null) {
    alert("No document to work on fatal error. This should never happen");
    return;
  }
  curr_units = units.get(doc);
  units.set(doc, settings.units);
  rulerorigin = set_ruler(doc);

  // get all the stories
  stories = find_stories(doc);
  footnotestyle = doc.footnoteOptions.footnoteTextStyle;
  markerstyle = doc.footnoteOptions.footnoteMarkerStyle;
  separator = doc.footnoteOptions.separatorText;
  if (stories === null) {
    alert("Please select the story I should work on");
    return;
  } else {
    if (DEBUG) {
      $.writeln(stories);
    }

    if (stories.length === 1) {
      msg = "Processing selected story";
    } else {
      // this will never happen
      // to risky
      msg = "Processing whole document";
    }

    footnoteslength = get_footnotes_length(stories);
    // for (var st = 0; st < stories.length; st++) {
    //   footnoteslength += stories[st].footnotes.length;
    // }
    win = create_window(msg, stories.length, footnoteslength); //new Window("palette"); // create new palette

    win.show(); // show it

    var footnote_frames = [];
    for (var i = 0; i < stories.length; i++) {
      win.stories_bar.value = i;
      var story = stories[i];
      var counter = story.footnotes.length;
      if (DEBUG) {
        $.writeln("story number " + i + " has " + story.textContainers.length + " textFrames");
      }
      for (var t = story.textContainers.length - 1; t >= 0; t--) {
        var tf = story.textContainers[t];
        // find last character in frame
        var dupe = tf.duplicate();
        var tf_y2 = get_height_2c(dupe);
        dupe.remove();

        var footn = null;
        // var double_column = false;
        var pargb = null;
        var y1 = 0;
        var x1 = 0;
        var y2 = 0;
        var x2 = 0;
        var footn_frame = null;
        var pars = [];


        if (tf instanceof TextPath) {
          alert("This script works currently only with textFrames not textPaths.\nSorry for that.");
          continue;
        }
        if (tf.footnotes.length < 1) {
          continue;
        }

        // tf_y2 = tf.lines.lastItem().baseline;
        footn = tf.footnotes;

        if (tf.textColumns.length > 0) {
          // we have double columns
          // double_column = true;

          if (DEBUG) {
            $.writeln("we have " + tf.textColumns.length + " columns");
          }
          // aggreagate all paragraphs in footnotes
          for (var fn = 0; fn < tf.footnotes.length; fn++) {
            for (var p = 0; p < tf.footnotes[fn].paragraphs.length; p++) {
              pars.push(tf.footnotes[fn].paragraphs[p]);
            }
          }
          y1 = frame_height_calculator(pars, tf.geometricBounds) - 1;

        } else {
          if (DEBUG) {
            $.writeln("we have only one column");
          }
          pargb = get_height(footn[0].paragraphs[0]);
          y1 = pargb[0] - 1;
        }
        // detect if we have the 2 column or one column layout
        //
        var column_width = 0;
        var frame_width = 0;
        var frame_y2 = 0;
        if (tf.textFramePreferences.textColumnCount > 1) {
          // two columns
          column_width = 80;
          frame_width = 184.999999999968;
          frame_y2 = 250.5;
        } else {
          // one column
          column_width = 60;
          frame_width = 145;
          frame_y2 = 212.500277777778;

        }
        y2 = frame_y2; // tf.geometricBounds[2];
        x2 = frame_width;
        if (tf.parentPage.side === PageSideOptions.LEFT_HAND) {
          x1 = 21.999999999968;

        } else if (tf.parentPage.side === PageSideOptions.RIGHT_HAND) {
          x1 = 21.999999999968 - 6;
          x2 = x2 - 6;

        }

        // this is a bit dirty but should save us
        // from having frames without content
        if ((y1 > y2) || (y2 - y1) < 3) {
          y1 = y2 - 3;
        }

        footn_frame = tf.parentPage.textFrames.add({
          geometricBounds: [y1, x1, y2, x2],
          textFramePreferences: {
            textColumnCount: 2,
            textColumnGutter: 3,
            textColumnFixedWidth: column_width

          }
        });
        var info = [];
        for (var j = footn.length - 1; j >= 0; j--) {
          var onenote = footn[j];
          win.footn_bar.value = win.footn_bar.value + 1;

          onenote.texts[0].move(LocationOptions.AFTER, footn_frame.insertionPoints.firstItem());
          footn_frame.insertionPoints.firstItem().contents = "\r" + "\t" + counter;
          info.push(counter);
          onenote.storyOffset.contents = "|=" + counter + "=|";

          onenote.remove();
          footn_frame.paragraphs.firstItem().remove();
          counter--;
        }
        footnote_infos(tf, info.join("\r"));
        var old_bounds = tf.geometricBounds;
        if (DEBUG) {
          // just to see whats going on
          // var line = tf.parentPage.graphicLines.add();
          // line.paths[0].pathPoints[0].anchor = [old_bounds[1], tf_y2];
          // line.paths[0].pathPoints[1].anchor = [old_bounds[1] + 10, tf_y2];
        }
        if (tf_y2 > y2) {
          tf_y2 = y2;
        }
        tf.geometricBounds = [old_bounds[0], old_bounds[1], tf_y2, old_bounds[3]];
        footnote_frames.push(footn_frame);
      } // end of textContainer

      reset();
      clean_up.change.grep(story, "(\\|\\=)(\\d{1,10})(\\=\\|)", "$2", markerstyle);
      reset();
      clean_up.change.grep(footnote_frames[0].parentStory, "\\A\\r", "", null);

    } // end of for stories loop

    for (var fnf = footnote_frames.length - 1; fnf >= 0; fnf--) {
      var curr_frame = footnote_frames[fnf];
      reset();
      var footnote_markers = null;
      footnote_markers = clean_up.find.text(curr_frame, "^F", "", null);
      for (var f = footnote_markers.length - 1; f >= 0; f--) {
        footnote_markers[f].remove();
      }
      reset();
      clean_up.change.grep(curr_frame, "(\\t\\d{1,100}\\t)", "\\r$1", doc.characterStyles.itemByName(settings.footnoteNumberStyle));
      if (settings.doFootnotesStory === true) {
        if (fnf !== footnote_frames.length - 1) {
          curr_frame.previousTextFrame = footnote_frames[fnf + 1];
        }
      }
    } // end fn loop
    footnote_story = footnote_frames[0].parentStory;
    win.close();
  } // end of else no story selected
  // RESET doc
  reset_ruler(doc, rulerorigin);
  units.set(doc, curr_units);
  return footnote_story;
};
var fn_story = main();
// we need to clena up once more

try{

var markers = clean_up.find.text(fn_story, "^F", "", null);
for (var f = markers.length - 1; f >= 0; f--) {
  markers[f].remove();
}
}catch(e){}

try{clean_up.change.grep(fn_story, "(\\t\\d{1,100}\\t)", "\\r$1", app.activeDocument.characterStyles.itemByName(settings.footnoteNumberStyle));
}catch(e){}
})(this);