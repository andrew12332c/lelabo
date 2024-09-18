// global variables used by the preprocess library
var preprocess_fileinput;
var preprocess_max_width;
var preprocess_max_height;
var preprocess_preview;
var preprocess_form;
var preprocess_fileoutput;

function processfile(file) {
    if( !( /image/i ).test( file.type )) {
        alert( "File "+ file.name +" is not an image." );
        return false;
    }

    // read the files
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    
    reader.onload = function (event) {
      // blob stuff
      var blob = new Blob([event.target.result]); // create blob...
      window.URL = window.URL || window.webkitURL;
      var blobURL = window.URL.createObjectURL(blob); // and get it's URL
      
      // helper Image object
      var image = new Image();
      image.src = blobURL;
      //preprocess_preview.appendChild(image); // preprocess_preview commented out, I am using the canvas instead
      image.onload = function() {
        // have to wait till it's loaded
        var resized = resizeMe(image); // send it to canvas
       	var newinput = preprocess_fileoutput;
        newinput.value = resized; // put result from canvas into new hidden input
        preprocess_form.appendChild(newinput);
      }
    };
}

function readfiles(files) {
  
    // remove the existing canvases and hidden inputs if user re-selects new pics
    var existinginputs = document.getElementsByName('images[]');
    var existingcanvases = document.getElementsByTagName('canvas');
    while (existinginputs.length > 0) { // it's a live list so removing the first element each time
      // DOMNode.prototype.remove = function() {this.parentNode.removeChild(this);}
      preprocess_form.removeChild(existinginputs[0]);
      if(preprocess_preview){
    	  preprocess_preview.removeChild(existingcanvases[0]);
	  }
    } 
  
    for (var i = 0; i < files.length; i++) {
      processfile(files[i]); // process each file at once
    }
    //preprocess_fileinput.value = ""; //remove the original files from preprocess_fileinput
    // TODO remove the previous hidden inputs if user selects other files
}

// this is where it starts. event triggered when user selects files with the input field defined by fileinput_id inside the form with form_id
// preview_id is optional if you want the customer to see a preview of their image first before uploading
function initPreprocess(fileinput_id, form_id, preview_id, fileoutput_id){
	console.log("beginning preprocess init");

	preprocess_fileinput = document.getElementById(fileinput_id);

	if (typeof preprocess_fileinput == 'undefined') {
		console.log("no preprocess_fileinput defined; no further action for preprocess.js");
		return;
	}
	
	preprocess_max_width = preprocess_fileinput.getAttribute('data-maxwidth');
	preprocess_max_height = preprocess_fileinput.getAttribute('data-maxheight');
	preprocess_preview = document.getElementById(preview_id);
	preprocess_form = document.getElementById(form_id);
	preprocess_fileoutput = document.getElementById(fileoutput_id);

	preprocess_fileinput.onchange = function(){
	  if ( !( window.File && window.FileReader && window.FileList && window.Blob ) ) {
	    alert('The File APIs are not fully supported in this browser.');
	    return false;
	  }
	  readfiles(preprocess_fileinput.files);
	}
}

// === RESIZE ====

function resizeMe(img) {
  
  var canvas = document.createElement('canvas');

  var width = img.width;
  var height = img.height;

  // calculate the width and height, constraining the proportions
  if (width > height) {
    if (width > preprocess_max_width) {
      //height *= preprocess_max_width / width;
      height = Math.round(height *= preprocess_max_width / width);
      width = preprocess_max_width;
    }
  } else {
    if (height > preprocess_max_height) {
      //width *= preprocess_max_height / height;
      width = Math.round(width *= preprocess_max_height / height);
      height = preprocess_max_height;
    }
  }
  
  // resize the canvas and draw the image data into it
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  
  if(preprocess_preview) {
  	preprocess_preview.innerHTML = '';
  	preprocess_preview.appendChild(canvas); // do the actual resized preview
  }
  
  return canvas.toDataURL("image/jpeg",0.7); // get the data from canvas as 70% JPG (can be also PNG, etc.)

}
