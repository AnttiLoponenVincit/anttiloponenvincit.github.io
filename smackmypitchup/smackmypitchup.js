// Timbre.js values
var glide = T("param", {value:880});
var cutoff = 1000;
var VCO = T("osc", {wave: "saw", freq:glide, mul:0.2});
var resonance = 20;
var VCF = T("lpf", {cutoff:cutoff, Q:resonance}, VCO);
var EG  = T("adsr", {a:10, d:1500, s:1, r:500}, VCF).play();
// PItch recognizion values
var currentPitch;
var currentAmp = 0;
var initAmp = 0;
var currentFreq;
var RAND_LENGTH = 20;
var RAND_TIME = 500;
var pitchTimes = [];
// Sample player values
var bufferList;
var bufferLoader;
var SOUNDS_LENGTH = 13;
var isPlaying = false;
VCO.wave = "saw";

var sounds = {
	"A": 0,
	"A#": 1,
	"B": 2,
	"C": 3,
	"C#": 4,
	"D": 5,
	"D#": 6,
	"E": 7,
	"F": 8,
	"F#": 9,
	"G": 10,
	"G#": 11
};
// Color change values
var colors = {
	"A": "#500000",
	"A#": "#202000",
	"B": "#005000",
	"C": "#000050",
	"C#": "#002020",
	"D": "#404000",
	"D#": "#200020",
	"E": "#400040",
	"F": "#004040",
	"F#": "#103060",
	"G": "#603010",
	"G#": "#103010"
};
var currentColor = "#000";
// Crazy mode values
var crazyMode = false;
var noteCount = 0;
var CRAZY_MODE_THRESHOLD = 200;

var cutoff = 2600;
var dynamic = true;

/* This function copied from https://css-tricks.com/snippets/javascript/lighten-darken-color/ */
function LightenDarkenColor(col, amt) {
  
    var usePound = false;
  
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
 
    var num = parseInt(col,16);
 
    var r = (num >> 16) + amt;
 
    if (r > 255) r = 255;
    else if  (r < 0) r = 0;
 
    var b = ((num >> 8) & 0x00FF) + amt;
 
    if (b > 255) b = 255;
    else if  (b < 0) b = 0;
 
    var g = (num & 0x0000FF) + amt;
 
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
 
    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
  
}

/* Load samples, copied mostly from http://www.html5rocks.com/en/tutorials/webaudio/intro/ */ 
function initSounds() {

  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();

  var sounds = [];
  for (var i = 1; i < SOUNDS_LENGTH + 1; i++) {
  	sounds.push('pasila/pasila' + i + '.wav')
  }

  bufferLoader = new BufferLoader(
    context,
	sounds,
	/* Custom made callback */
    function (buffers) {
    	bufferList = buffers;
    }
    );

  bufferLoader.load();
}


/* Copied from http://www.html5rocks.com/en/tutorials/webaudio/intro/*/ 
function playSound(buffer) {
	isPlaying = true;
  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(context.destination);       // connect the source to the context's destination (the speakers)
  source.start(0);                           // play the source now
                                             // note: on older systems, may have to use deprecated noteOn(time);
  // Added handler for removing duplicate samples
  source.onended = function () {
  	isPlaying = false;
  };
}

initSounds();

$(document).ready(function () {
	// Handler for changed pitch
	$(document).on('pitchChanged', function (event, pitch, freq) {	
		// add note count for activating crazy mode
		$('#pitch').text(pitch);
		noteCount++;
		if (noteCount > CRAZY_MODE_THRESHOLD) {
			$('.button').css({'opacity': Math.min(0.8, (noteCount - CRAZY_MODE_THRESHOLD)/100)});
		}
		// change synth freq
		if (freq) {
			glide.linTo(freq, "50ms");
		}
		// Change color according to note
		currentColor = colors[pitch];
		currentPitch = pitch;
		if (!currentColor) {
			currentColor = "#000";
		}
		// Check for random notes
		pitchTimes.push(new Date().getTime());
		if (pitchTimes.length  == RAND_LENGTH) {
			// check if we have too many notes too quickly
			if (pitchTimes[RAND_LENGTH - 1] - pitchTimes[0] < RAND_TIME) {
				$('#pitch').text('?!');
				// Pick up a random sample
				var index = Math.floor((Math.random() * SOUNDS_LENGTH));
				if (!isPlaying) {
					playSound(bufferList[index]);
				}
			}
			pitchTimes.shift();
		}
	});
	// Handler for changed amplitude
	$(document).on('ampChanged', function (event, amp) {
		if (amp < 0.05) {
			$('#pitch').text("");
			$('body').css({'background-color': LightenDarkenColor('#111', amp * 10)});
		} else {
			// Adjust color lightness
			$('body').css({'background-color': LightenDarkenColor(currentColor, amp * 10)});			
		}

		amp = Math.round(amp*1000)/1000;

		// In crazy mode play new sample
		if (crazyMode) {
			if (!isPlaying && currentPitch) {
				playSound(bufferList[sounds[currentPitch]]);
			}
		} else {
			// Trigger synth note
			if (amp - currentAmp > 2) {
				initAmp = amp;
				EG.bang();
			}
			// Adjust filter cutoff to amplitude
			if (amp > 0.01 && dynamic) {
				var ampCutoff = amp/initAmp * cutoff;
				VCF.cutoff = Math.max(ampCutoff, 500);
			}
			// Release synth note when amplitude is low enough
			if (amp < 0.1) {
				EG.release();
			}

		}
		currentAmp = amp;
	});
	// Toggle crazy mode
	$('#red-button').on('click', function () {
		crazyMode = !crazyMode;
			$('#pitch').toggle();
			$('#waveform').toggle();
			$('#filter-container').toggle();
			$('#vco-container').toggle();
		if (crazyMode) {
			$('img').attr('src', 'repomies.jpg');
			$(this).css({"background-position-x": '146px'});
			$('#button-text').css({'visibility': 'hidden'});

		} else {
			$('img').attr('src', 'synth.png');
			$(this).css({"background-position-x": '0'});
			$('#button-text').css({'visibility': ''});
		}
		return false
	});

    $( "#cutoff" ).slider({
      orientation: "vertical",
      range: "min",
      min: 1000,
      max: 6000,
      value: cutoff,
      slide: function( event, ui ) {
        cutoff = ui.value;
        if (!dynamic) {
        	VCF.cutoff = cutoff;
        }
      }
    });
    $( "#resonance" ).slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 50,
      value: resonance,
      slide: function( event, ui ) {
        VCF.Q = ui.value;
      }
    });
    $('#autowah').on('click', function () {
    	dynamic = !dynamic;
    }); 
    $('.waveform-select').on('click', function () {
    	VCO.wave = $(this).val();
    }); 

});