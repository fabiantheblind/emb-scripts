﻿//~ Copyright 2015 Fabian "fabiantheblind" Morón Zirfas//~ Permission is hereby granted, free of charge, to any person obtaining a copy//~ of this software and associated documentation files (the "Software"), to deal//~ in the Software without restriction, including without limitation the rights//~ to use, copy, modify, merge, publish, distribute, sublicense, and/or sell//~ copies of the Software, and to permit persons to whom the Software is//~ furnished to do so, subject to the following conditions://~ The above copyright notice and this permission notice shall be included in all//~ copies or substantial portions of the Software.//~ THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR//~ IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,//~ FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE//~ AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER//~ LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,//~ OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE//~ SOFTWARE.var main = function() {  if (app.documents.length < 1) {    return;  }  var doc = app.documents[0];  var names = [];  // get all parstyle name to list  for (var d = 0; d < doc.allParagraphStyles.length; d++) {    names.push(doc.allParagraphStyles[d].name);  }  // create a dialog for the user  var dlg = app.dialogs.add({    name: "Select a style for the footnotes",    canCancel: true  });  var colmn = dlg.dialogColumns.add();  var row = colmn.dialogRows.add();  row.staticTexts.add({    staticLabel: "Style:"  });  var selected_par = row.dropdowns.add({    stringList: names,    selectedIndex: 0  });  //Display the dialog box.  if (dlg.show() === true) {    //  get the selectied style    var parname = doc.allParagraphStyles[selected_par.selectedIndex].name;    for (var i = 0; i < doc.stories.length; i++) {      var story = doc.stories[i];      for (var j = 0; j < story.footnotes.length; j++) {        var footnote = story.footnotes[j];        for (var k = 0; k < footnote.paragraphs.length; k++) {          var paragraph = footnote.paragraphs[k];          paragraph.appliedParagraphStyle = doc.paragraphStyles.item(parname);        }      }    }  }else{    $.writeln("User aborted");  }};main(); // run that