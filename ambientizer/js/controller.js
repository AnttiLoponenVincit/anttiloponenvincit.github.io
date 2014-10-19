var midicps = T("midicps");
var baseInterval = 500;

generatorApp.controller("generatorController", ['$scope', function($scope) {

    $scope.speed = 10;
    $scope.scaleKey = "major";

    $scope.generate = function() {
        if ($scope.inputString) {
            $scope.play = true;
            var speed = $scope.speed;
            if (!speed || speed == 0 || speed > 10) {
                speed = 10;
            }
            var interval = speed * baseInterval;
            // find number of first char
            var firstNote = $scope.inputString.charCodeAt(0);
            firstNote = adjustMelodyNotePitch(firstNote);
            // define scale
            // console.log('key: ' + $scope.scaleKey);

            var scale = getScale(firstNote, $scope.scaleKey);
            var notes =  [];
            // make a list of the other chars as numbers
            for (var i = 1; i < $scope.inputString.length; i++) {
                notes.push($scope.inputString.charCodeAt(i));
            }
            //console.log('first note: ' + firstNote);
            console.log('raw notes: ' + notes);
            // first note number is put to the list as it is
            var scaledNotes = [firstNote];
            // the rest are converted to fit the scale
            console.log('scale: ' + scale);
            scaledNotes = scaledNotes.concat(getScaledNotes(scale, notes));
            console.log('scaledNotes ' + scaledNotes);
            //playBass(firstNote);
            var melodyIndex = 0;
            var bassIndex = 0;
            var melodySynth = T("SynthDef").play();

            melodySynth.def = function(opts) {
                var VCO = T("saw", {freq:opts.freq});

                var cutoff = T("env", {table:[8000 / 10 * speed, [8000 / 10 * speed, 500], [1000, 1000]]}).bang();
                var VCF    = T("lpf", {cutoff:cutoff, Q:1}, VCO);

                var t = T("+sin", {freq:0.1, add:100, mul:25});
                var delay = T("delay", {time:t, fb:0.4, mix:0.5}, VCF);

                var chorus = T("chorus", {delay:30, rate:1, depth:100, fb:0, mix:0.5}, VCF);
                var reverb = T("reverb", {room:0.9, damp:0.2, mix:0.7}, VCF);
                var EG  = T("adsr", {a:1000 / 10 * speed, d:1000 / 10 * speed, s:0.5, r:1500 / 10 * speed, lv:0.2});
                var VCA = EG.append(VCF).bang();

                return VCA;
            };

            var melodySynth2 = T("SynthDef").play();

            melodySynth2.def = function(opts) {
                var VCO = T("saw", {freq:opts.freq + 1});

                var cutoff = T("env", {table:[8000 / 10 * speed, [8000 / 10 * speed, 500], [1000, 1000]]}).bang();
                var VCF    = T("lpf", {cutoff:cutoff, Q:1}, VCO);

                var t = T("+sin", {freq:0.1, add:100, mul:25});
                var delay = T("delay", {time:t, fb:0.4, mix:0.5}, VCF);

                var chorus = T("chorus", {delay:30, rate:1, depth:100, fb:0, mix:0.5}, VCF);
                var reverb = T("reverb", {room:0.9, damp:0.2, mix:0.7}, VCF);
                var EG  = T("adsr", {a:1000 / 10 * speed, d:1000 / 10 * speed, s:0.5, r:1500 / 10 * speed, lv:0.2});
                var VCA = EG.append(VCF).bang();

                return VCA;
            };

            var bassSynth = T("SynthDef").play();

            bassSynth.def = function(opts) {
                var VCO = T("saw", {freq:opts.freq + 1});
                var cutoff = T("sin", {freq:"5200ms", mul:200, add:500}).kr();
                var VCF    = T("lpf", {cutoff:cutoff, Q:8}, VCO);
                var EG  = T("adsr", {a:500 / 10 * speed, d:1000 / 10 * speed, s:0.5, r:1500 / 10 * speed, lv:0.1});
                var VCA = EG.append(VCF).bang();
                return VCA;
            };

            var subBassSynth = T("SynthDef").play();

            subBassSynth.def = function(opts) {
                var VCO = T("square", {freq:opts.freq});
                var VCF    = T("lpf", {cutoff:100, Q:1}, VCO);
                var EG  = T("adsr", {a:500 / 10 * speed, d:1000 / 10 * speed, s:0.5, r:1500 / 10 * speed, lv:0.6});
                var VCA = EG.append(VCF).bang();
                return VCA;
            };

            var bassNotes = getBassNotes($scope.inputString, $scope.scaleKey);
            var currentBassNote;

            // play bass note and move to the next

            var playBass = function() {
                var note = bassNotes[bassIndex];
                console.log('playing bass note ' + note);

                if (bassNotes.length > 1 || (bassNotes.length == 2 && bassNotes[0] != bassNotes[1])) {
                    while (note == currentBassNote) {
                        console.log("current and prev bass are the same");
                        bassIndex++;
                        if (bassIndex >= bassNotes.length) {
                            bassIndex = 0;
                        }
                        note = bassNotes[bassIndex];
                    }
                }

                if ($scope.play) {
                    bassSynth.noteOn(note);
                    subBassSynth.noteOn(note - 12);
                }
                bassIndex++;
                if (bassIndex >= bassNotes.length) {
                    bassIndex = 0;
                }
                if (currentBassNote) {
                    bassSynth.noteOff(currentBassNote);
                    subBassSynth.noteOff(currentBassNote - 12);
                }
                currentBassNote = note;
            };

            var currentNote;

            // play melody note and move to the next

            var playMelody = function() {

                var note = scaledNotes[melodyIndex];
                if (scaledNotes.length > 1) {
                    while (note == currentNote) {
                        console.log("current and prev are the same");
                        melodyIndex++;
                        if (melodyIndex >= scaledNotes.length) {
                            melodyIndex = 0;
                        }
                        note = scaledNotes[melodyIndex];
                    }
                }

                console.log('Playing melody note ' + note);
                if ($scope.play) {
                    melodySynth.noteOn(note);
                    melodySynth2.noteOn(note);
                }
                melodyIndex++;
                if (melodyIndex >= scaledNotes.length) {
                    melodyIndex = 0;
                }
                if (currentNote) {
                    melodySynth2.noteOff(currentNote);
                    melodySynth.noteOff(currentNote);
                }
                currentNote = note;

            };

            // init first notes without timeout
            playBass();
            playMelody();
            // sequence the rest
            if ($scope.play) {
                var bassInterval = setInterval(playBass, interval * 4);
                var melodyInterval = setInterval(playMelody, interval);
            }

            // mute and stop the intervals
            $scope.mute = function() {
                console.log("Please mute");
                melodySynth2.noteOff(currentNote).stop();
                melodySynth.noteOff(currentNote).stop();
                bassSynth.noteOff(currentBassNote).stop();
                subBassSynth.noteOff(currentBassNote - 12).stop();
                clearInterval(bassInterval);
                clearInterval(melodyInterval);
                $scope.play = false;
            }

        }


    }
}]);

var getScaledNotes = function(scale, notes) {
    // adjust the notes to fit the scale for musicalitys sake
    var scaledNotes = [];
    for (var i = 0; i < notes.length; i++) {
        var rawNote = adjustMelodyNotePitch(notes[i]);

        var scaledNote = null;
        // if note is on the scale we add it as it is
        if (scale.indexOf(rawNote) > 0) {
            scaledNote = rawNote;
        } else {
            scaledNote = getClosest(rawNote, scale);
        }
        if (scaledNote && !isNaN(scaledNote)) {
            scaledNotes.push(scaledNote);
        }
    }
    return scaledNotes;

};

var getClosest =  function(note, scale) {
    // find the closest note from the scale
    var curr = scale[0];
    var diff = Math.abs (note - curr);
    for (var val = 0; val < scale.length; val++) {
        var newdiff = Math.abs (note - scale[val]);
        if (newdiff < diff) {
            diff = newdiff;
            curr = scale[val];
        }
    }
    return curr;
};

var getBassNotes = function(inputString, scale) {
    if (inputString.indexOf(" ") > 0) {
        var words = inputString.split(" ");
        var bassNotes = [];
        // for indian scale we use root note and minor second
        if (scale == 'indian') {
            bassNotes.push(adjustBassNotePitch(words[0].charCodeAt(0)));
            bassNotes.push(adjustBassNotePitch(words[0].charCodeAt(0)) + 1);
        } else {
            // otherwise we find the first letters of the words for bass sequence
            for (var i = 0; i < words.length; i++) {
                var bassNote = adjustBassNotePitch(words[i].charCodeAt(0));
                if (bassNote && !isNaN(bassNote))
                bassNotes.push(bassNote);
            }
        }
        // only one word makes single bass note
    } else {
        bassNotes = [inputString.charCodeAt(0), inputString.charCodeAt(0)];
    }

    return bassNotes;
};

var adjustMelodyNotePitch = function(note) {
    // make sure the notes are not too high or low
    console.log('adjusting note ' + note);
    while(note > 80) {
        note = note - 12;
    }
    while(note < 55) {
        note = note + 12;
    }
    console.log("adjusted melody note to " + note);
    return note;
};

var adjustBassNotePitch = function(note) {
    // make sure the bass notes are not too high or low
    console.log('adjusting bass note ' + note);

    while(note > 55) {
        note = note - 12;
    }
    while(note < 35) {
        note = note + 12;
    }
    console.log("adjusted bass note to " + note);
    return note;
};