const midi = require('midi');
const ws281x = require('rpi-ws281x-native');

 
// Set up a new input.
const input = new midi.Input();
 
// Count the available input ports.
const nbItf = input.getPortCount();
 
// Get the name of a specified input port.
for (i=0;i<nbItf;i++) {
   console.log(input.getPortName(i));
}
var NUM_LEDS = 10
pixelData = new Uint32Array(NUM_LEDS);
 
ws281x.init(NUM_LEDS, { gpioPin: 18 });

function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

function colorwheel(pos) {
  pos = 255 - pos;
  if (pos < 85) { return rgb2Int(255 - pos * 3, 0, pos * 3); }
  else if (pos < 170) { pos -= 85; return rgb2Int(0, pos * 3, 255 - pos * 3); }
  else { pos -= 170; return rgb2Int(pos * 3, 255 - pos * 3, 0); }
}

var offset = 0;
setInterval(function () {
  for (var i = 0; i < NUM_LEDS; i++) {
    pixelData[i] = colorwheel((offset + i) % 256);
  }

  offset = (offset + 1) % 256;
  ws281x.render(pixelData);
}, 1000 / 30);


// Configure a callback.
input.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  console.log(`m: ${message} d: ${deltaTime}`);
});

/*
 
// Open the first available input port.
input.openPort(1);
 
// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
input.ignoreTypes(false, false, false);
 
// ... receive MIDI messages ...
*/
 
// Close the port when done.
/*
setTimeout(function() {
  input.closePort();
}, 100000);
*/
