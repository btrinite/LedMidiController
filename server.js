const midi = require('midi');
var isPi = require('detect-rpi');
var ws281x = {}

if (isPi()) {
  ws281x = require('rpi-ws281x-native');
  console.log(`Raspberry detected !`);
} else {

  const RPI_WS281X_fake = {
    num: 0,
    config: {},
    init: function(num, config) {
      console.log(`WS281x init for ${num} leds`);
      this.num=num
      this.config=config
    },
    render: function(strip) {
      console.log(`WS281x render`);
    }
  };

  ws281x = Object.create(RPI_WS281X_fake);
}

const converter = require('hsl-to-rgb-for-reals');


// Setup Led Strip interface
var NUM_LEDS = 163
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
    //console.log (midiDevice)
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

console.log ("MIDI Controller detected")

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

const indexes = [{start:0, length:106}, {start:106, length:37}, {start:143, length:2}, {start:145, length:16}, {start:161, length:2}]
//const indexes = [{start:0, length:46}, {start:106, length:37}, {start:143, length:2}, {start:145, length:16}, {start:161, length:2}]
const FRONT_STRIP = 0
const SCENE_STRIP = 1
const CONTROL_FRONT_LEDS = 2
const BACK_STRIP = 3
const CONTROL_SCENE_LEDS = 4

//Programm
var program = [];

//RGB Mode
var color= [];
var brightness= [];

//HSL Mode
var hsl= [];
var hue=[]
var saturation=[]
var lightness=[]

function updateRGBStrip(idx) {
  for (var i = 0; i < indexes[idx].length; i++) {
    r=(((color[idx].leds[i] & 0xff0000) >> 16) * brightness[idx])/255
    g=(((color[idx].leds[i] & 0xff00) >> 8) * brightness[idx])/255
    b=((color[idx].leds[i] & 0xff) * brightness[idx])/255
    pixelData[i+indexes[idx].start] = rgb2Int(r, g, b)
  }
  ws281x.render(pixelData);  
}

function updateHSLStrip(idx) {
  for (var i = indexes[idx].start; i < indexes[idx].start+indexes[idx].length; i++) {
    pixelData[i] = rgb2Int(hsl[idx][0], hsl[idx][1], hsl[idx][2])
  }
  ws281x.render(pixelData);  
}

for (var i=0; i<indexes.length; i++) {
  color[i]={leds:[]}
  for (var j=0; j<indexes[i].length; j++) {
    color[i].leds[j] = rgb2Int(255, 255, 255)
  }
  brightness[i] = 0
  hue[i]=0
  saturation[i]=0
  lightness[i]=0
  
  updateRGBStrip(i)
}

//default value

brightness[CONTROL_FRONT_LEDS]=map_range(32, 0, 127, 0, 255)
updateRGBStrip(CONTROL_FRONT_LEDS)

lightness[CONTROL_SCENE_LEDS]=Number(map_range(32, 0, 127, 0, 1))
lightness[SCENE_STRIP]=Number(map_range(0, 0, 127, 0, 1))
hue[SCENE_STRIP]=Number(map_range(0, 0, 127, 0, 359))
saturation[SCENE_STRIP]=Number(map_range(0, 0, 127, 0, 1))

hsl[CONTROL_SCENE_LEDS]=converter(hue[SCENE_STRIP], saturation[SCENE_STRIP], lightness[CONTROL_SCENE_LEDS])
hsl[SCENE_STRIP]=converter(hue[SCENE_STRIP], saturation[SCENE_STRIP], lightness[SCENE_STRIP])
updateHSLStrip(CONTROL_SCENE_LEDS)

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

const Bank1_Slidder6 = 8
const Bank1_Vol6 = 19

const Bank1_Slidder7 = 9
const Bank1_Vol7 = 20

const Bank1_Slidder8 = 10
const Bank1_Vol8 = 21

const Bank1_Touch1_Record = 44
const Bank1_Touch2_Play = 45
const Bank1_Touch3_Stop = 46
const Bank1_Touch4_Erase = 49

const Bank1_SW1 = 23
const Bank1_SW2 = 24
const Bank1_SW3 = 25
const Bank1_SW4 = 26
const Bank1_SW5 = 27
const Bank1_SW6 = 28
const Bank1_SW7 = 29
const Bank1_SW8 = 30

const Bank1_CROSSFADER = 9
const Bank1_KNOB = 10

var playIdx=0

animateEnabled=false
tick=0;
animateSpeed=1

function setAllLedColor (strip, newcolor) {
  for (var j=0; j<indexes[strip].length; j++) {
    color[strip].leds[j] = newcolor
  }
}
function enableAnimate(){
  tick=0
  animateEnabled = true
}

function disableAnimate() {
  animateEnabled=false
}

var RainbowOffset = 0;

function RainbowTick (strip) {
  var _this = this;
  for (var i = 0; i < indexes[strip].length; i++) {
    color[strip].leds[i] = colorwheel((RainbowOffset + i) % 256);
  }

  RainbowOffset = (RainbowOffset + 1) % 256;

  updateRGBStrip(FRONT_STRIP)
}; 

function animate () {
  if (animateEnabled) {
    tick++
    if (tick%animateSpeed == 0) {
      RainbowTick(FRONT_STRIP)
    }
  }
}

// Configure a callback.
input.on('message', (deltaTime, message) => {
  // The message is an array of numbers corresponding to the MIDI bytes:
  //   [status, data1, data2]
  // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  // information interpreting the messages.
  //console.log(`m: ${message} d: ${deltaTime}`);
  [type, key, value] = message
  switch (type) {
    case ControlChange:
      console.log (key)
      switch (key) {
        //Front Strip
        case Bank1_Slidder1:
          setAllLedColor(FRONT_STRIP, colorwheel(map_range(value, 0, 127, 0, 255)))
          setAllLedColor(CONTROL_FRONT_LEDS, colorwheel(map_range(value, 0, 127, 0, 255)))
          console.log(`FRONT STRIP : Color ${color[FRONT_STRIP].leds[0]}`)
          updateRGBStrip(FRONT_STRIP)
          updateRGBStrip(CONTROL_FRONT_LEDS)
          break;
        case Bank1_Vol1:
          brightness[FRONT_STRIP]=map_range(value, 0, 127, 0, 255)
          console.log(`FRONT STRIP : brightness ${brightness[FRONT_STRIP]}`)
          updateRGBStrip(FRONT_STRIP)
          updateRGBStrip(CONTROL_FRONT_LEDS)
          break;

        //Scene Strip
        case Bank1_Slidder2:
          hue[SCENE_STRIP]=Number(map_range(value, 0, 127, 0, 359))
          hsl[SCENE_STRIP]=converter(hue[SCENE_STRIP], saturation[SCENE_STRIP], lightness[SCENE_STRIP])
          hsl[CONTROL_SCENE_LEDS]=converter(hue[SCENE_STRIP], saturation[SCENE_STRIP], lightness[CONTROL_SCENE_LEDS])
          console.log(`SCENE STRIP : hue ${hue[SCENE_STRIP]}`)
          updateHSLStrip(SCENE_STRIP)
          updateHSLStrip(CONTROL_SCENE_LEDS)
          break;
        case Bank1_Slidder3:
          saturation[SCENE_STRIP]=Number(map_range(value, 0, 127, 0, 1))
          hsl[SCENE_STRIP]=converter(hue[SCENE_STRIP], saturation[SCENE_STRIP], lightness[SCENE_STRIP])
          hsl[CONTROL_SCENE_LEDS]=converter(hue[SCENE_STRIP], saturation[SCENE_STRIP], lightness[CONTROL_SCENE_LEDS])
          console.log(`SCENE STRIP : saturation ${saturation[SCENE_STRIP]}`)
          updateHSLStrip(SCENE_STRIP)
          updateHSLStrip(CONTROL_SCENE_LEDS)
          break;
        case Bank1_Slidder4:
          lightness[SCENE_STRIP]=Number(map_range(value, 0, 127, 0, 1))
          hsl[SCENE_STRIP]=converter(hue[SCENE_STRIP], saturation[SCENE_STRIP], lightness[SCENE_STRIP])
          hsl[CONTROL_SCENE_LEDS]=converter(hue[SCENE_STRIP], saturation[SCENE_STRIP], lightness[CONTROL_SCENE_LEDS])
          console.log(`SCENE STRIP : lightness ${lightness[SCENE_STRIP]}`)
          updateHSLStrip(SCENE_STRIP)
          updateHSLStrip(CONTROL_SCENE_LEDS)
          break;

        // Back Strip (White)
        case Bank1_Vol5:
          brightness[BACK_STRIP]=map_range(value, 0, 127, 0, 255)
          console.log(`BACK STRIP : brightness ${brightness[BACK_STRIP]}`)
          updateRGBStrip(BACK_STRIP)
          break;

        case Bank1_Touch1_Record:
          if (value>=127) {
            console.log(`PROG : Record`)
            program.push([
              {'strip':FRONT_STRIP, 'color':color[FRONT_STRIP].leds[0]},
              {'strip':FRONT_STRIP, 'brightness':brightness[FRONT_STRIP]},
              {'strip':CONTROL_FRONT_LEDS, 'color':color[CONTROL_FRONT_LEDS].leds[0]},
              {'strip':SCENE_STRIP, 'hsl':hsl[SCENE_STRIP]},
              {'strip':CONTROL_SCENE_LEDS, 'hsl':hsl[CONTROL_SCENE_LEDS]}])
            console.log(program[program.length-1]) 
          }
          break;
        case Bank1_Touch3_Stop:
          if (value>=127) {
            console.log(`PROG : Stop`)
            playIdx = 0;
          }
          break;
        case Bank1_Touch2_Play:
          if (program.length<1) {
            break
          }
          if (value>=127) {
            console.log(`PROG : Play`)
            console.log (`Play index ${playIdx}`)
            console.log(program[playIdx]) 
            setAllLedColor(FRONT_STRIP, program[playIdx][0].color)
            brightness[FRONT_STRIP] = program[playIdx][1].brightness
            setAllLedColor(CONTROL_FRONT_LEDS, program[playIdx][2].color)
            updateRGBStrip(FRONT_STRIP)
            updateRGBStrip(CONTROL_FRONT_LEDS)
            hsl[SCENE_STRIP] = program[playIdx][3].hsl
            hsl[CONTROL_SCENE_LEDS]=program[playIdx][4].hsl
            updateHSLStrip(SCENE_STRIP)
            updateHSLStrip(CONTROL_SCENE_LEDS)
            playIdx=(playIdx+1)%program.length
          }
          break;
        case Bank1_Touch4_Erase:
          if (value>=127) {
            console.log(`PROG : Reset`)
            program=[]
            playIdx = 0;
            console.log(program) 
          }
          break;
        case Bank1_SW8:
          if (value>=127) {
            console.log(`ANIM : On`)
            enableAnimate()
          } else {
            console.log(`ANIM : Off`)
            disableAnimate() 
          }
          break;
          case Bank1_Vol8:
            animateSpeed=201-map_range(value, 0, 127, 1, 200)
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

(function wait () {
  if (!false) setTimeout(wait, 1);
  animate ()

})();