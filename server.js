const midi = require('midi');
const ws281x = require('rpi-ws281x-native');
const converter = require('hsl-to-rgb-for-reals');

// Setup Led Strip interface
var NUM_LEDS = 150
pixelData = new Uint32Array(NUM_LEDS);
ws281x.init(NUM_LEDS, { gpioPin: 18 });


// Set up a new input.
const input = new midi.Input();
var MidiDeviceIdx = -1

function waitForMidiCtrl() {
  // Count the available input ports.
  const nbItf = input.getPortCount();
  // Get the name of a specified input port.
  for (i=0;i<nbItf;i++) {
    const midiDevice = input.getPortName(i) 
    //console.log(midiDevice);
    if (midiDevice.includes('WORLDE easy control MIDI')) {
      MidiDeviceIdx = i
      return true
    }
  }
  return false
}


var MidiCtrlReady = false
do {
  MidiCtrlReady = waitForMidiCtrl()
} while (MidiCtrlReady == false);


function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

function colorwheel(pos) {
  pos = 255 - pos;
  if (pos < 85) { return rgb2Int(255 - pos * 3, 0, pos * 3); }
  else if (pos < 170) { pos -= 85; return rgb2Int(0, pos * 3, 255 - pos * 3); }
  else { pos -= 170; return rgb2Int(pos * 3, 255 - pos * 3, 0); }
}

function map_range(value, low1, high1, low2, high2) {
  if (value<low1) {
    value = low1
  }
  if (value>high1) {
    value = high1
  }
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}
/*

var offset = 0;
setInterval(function () {
  for (var i = 0; i < NUM_LEDS; i++) {
    pixelData[i] = colorwheel((offset + i) % 256);
  }

  offset = (offset + 1) % 256;
  ws281x.render(pixelData);
}, 1000 / 30);
*/

var indexes = [{start:0, length:64}, {start:64, length:20}, {start:84, length:20}]

//RGB Mode
var color= [];
var brightness= [];

//HSL Mode
var hsl= [];
var hue=[]
var saturation=[]
var lightness=[]

function updateRGBStrip(idx) {
  for (var i = indexes[idx].start; i < indexes[idx].start+indexes[idx].length; i++) {
    r=(((color[idx] & 0xff0000) >> 16) * brightness[idx])/255
    g=(((color[idx] & 0xff00) >> 8) * brightness[idx])/255
    b=((color[idx] & 0xff) * brightness[idx])/255
    pixelData[i] = rgb2Int(r, g, b)
  }
  ws281x.render(pixelData);  
}

function updateHSLStrip(idx) {
  for (var i = indexes[idx].start; i < indexes[idx].start+indexes[idx].length; i++) {
    pixelData[i] = rgb2Int(hsl[idx][0], hsl[idx][1], hsl[idx][2])
  }
  ws281x.render(pixelData);  
}

for (var i=0; i<3; i++) {
  color[i] = rgb2Int(255, 255, 255)
  brightness[i] = 0
  hue[i]=0
  saturation[i]=0
  lightness[i]=0
  updateRGBStrip(i)
}

const NoteOff = 128 // 0x80
const NoteOn = 144 // 0x90
const PolyphonicKeyPressure  = 160 // 0xA0
const ControlChange = 176 // 0xB0
const ProgramChange = 192 // 0xC0
const ChannelPressure = 208 // 0xD0
const PitchBend = 224 //0xE0

const Bank1_Slidder1 = 3
const Bank1_Vol1 = 14

const Bank1_Slidder2 = 4
const Bank1_Vol2 = 15

const Bank1_Slidder3 = 5
const Bank1_Vol3 = 16

const Bank1_Slidder4 = 6
const Bank1_Vol4 = 17

const Bank1_Slidder5 = 7
const Bank1_Vol5 = 18



// Configure a callback.
input.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  // console.log(`m: ${message} d: ${deltaTime}`);
  [type, key, value] = message
  switch (type) {
    case ControlChange:
      switch (key) {
        //Front Strip
        case Bank1_Slidder1:
          color[0]=colorwheel(map_range(value, 0, 127, 0, 255))
          updateRGBStrip(0)
          break;
        case Bank1_Vol1:
          brightness[0]=map_range(value, 0, 127, 0, 255)
          updateRGBStrip(0)
          break;

        //Scene Strip
        case Bank1_Slidder2:
          hue[1]=Number(map_range(value, 0, 127, 0, 360))
          hsl[1]=converter(hue[1], saturation[1], lightness[1])
          updateHSLStrip(1)
          break;
        case Bank1_Slidder3:
          saturation[1]=Number(map_range(value, 0, 127, 0, 1))
          hsl[1]=converter(hue[1], saturation[1], lightness[1])
          updateHSLStrip(1)
          break;
        case Bank1_Slidder4:
          lightness[1]=Number(map_range(value, 0, 127, 0, 1))
          hsl[1]=converter(hue[1], saturation[1], lightness[1])
          updateHSLStrip(1)
          break;
        // Back Strip (White)
        case Bank1_Vol5:
          brightness[2]=map_range(value, 0, 127, 0, 255)
          updateRGBStrip(2)
          break;
            }
      break;
  }

});


 
// Open the first available input port.
input.openPort(MidiDeviceIdx);


// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
input.ignoreTypes(false, false, false);
 
// ... receive MIDI messages ...
 
// Close the port when done.

setInterval(function() {
  //do nothing
  // input.closePort();
}, 100000);
