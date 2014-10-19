var scales = {

    'major': [2, 2, 1, 2, 2, 2],
    'minor': [2, 1, 2, 2, 1, 2],
    'indian': [1, 3, 1, 2, 1, 3]
};

var getScale = function(firstNote, scaleType) {
    if (!scaleType) {
        scaleType = "major";
    }
    var scale = scales[scaleType];
    if (scale) {
        var currentNote = firstNote;
        var scaledNotes = [currentNote];
        scale.forEach(function(interval) {
            currentNote = currentNote + interval;
            scaledNotes.push(currentNote);
        });
        scaledNotes = scaledNotes.concat(addOctaves(scaledNotes));
        return scaledNotes;

    }
};

var addOctaves = function(scale) {
    var octaves = [];
    scale.forEach(function(note) {
        octaves.push(note - 12);
        octaves.push(note + 12);
    });
    return octaves;
};