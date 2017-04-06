function cloneObject(obj) {
  var result = {};
  Object.keys(obj).forEach(function (key) {
    result[key] = obj[key];
  });
  return result;
}

function bindEvents(thisArg, events) {
   Object.keys(events).forEach(function (selector) {
        Object.keys(events[selector]).forEach(function (event) {
            var handler = events[selector][event].bind(thisArg);
            if('document' === selector) {
                document.addEventListener(event, handler, false);
            } else if ('window' === selector) {
                window.addEventListener(event, handler, false);
            } else {
                document.querySelectorAll(selector).forEach(function (dom) {
                    dom.addEventListener(event, handler, false);
                });
            }
        });
    }); // all events bound
}

function f(name, params) {
  params = Array.prototype.slice.call(arguments, 1, arguments.length);
  return name + '(' + params.join(', ') + ')';
}


// https://en.wikipedia.org/wiki/Points_of_the_compass
var CARDINAL_POINTS = {
  8: [
    'N', 'NE',
    'E', 'SE',
    'S', 'SW',
    'W', 'NW'
  ],
  16: [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ],
  32: [
    'N', 'NbE', 'NNE', 'NEbN', 'NE', 'NEbE', 'ENE', 'EbN',
    'E', 'EbS', 'ESE', 'SEbE', 'SE', 'SEbS', 'SSE', 'SbE',
    'S', 'SbW', 'SSW', 'SWbS', 'SW', 'SWbW', 'WSW', 'WbS',
    'W', 'WbN', 'WNW', 'NWbW', 'NW', 'NWbN', 'NNW', 'NbW'
  ]
};

function cardinalPoint(degrees, numPoints) {
  var result = '';
  var names = CARDINAL_POINTS[numPoints];
  var slice = 360 / names.length;

  for(var i = 0; i < names.length; i++) {
    var name = names[i];
    var min = (slice * i) - (slice / 2);
    var max = (slice * i) + (slice / 2);

    if ('N' === name && (degrees >= min + 360 || degrees <= max)) {
      result = name;
      break;
    }//end if: special check for North

    if (degrees >= min && degrees <= max) {
      result = name;
      break;
    }//end if: bounds checked
  }//end for: all points checked

  if('' === result) {
    console.error('ERROR: ' + degrees);
    result = '&mdash;'
  }//end if: check for errors
  return result;
}

function randomHeading (success) {
  var degrees = Math.random() * 360;
  success({ magneticHeading: degrees, trueHeading: degrees });
}

var IS_CORDOVA = !!window.cordova;

var app = {
  // options
  frequency: 500, // milliseconds
  showDegrees: true,
  numPoints: 32,

  // internal
  degrees: null, // degrees off North
  orientation: 'portrait-primary',
  $heading: null,
  $compass: null,
  $direction: null,
  $orientation: null,
  watch_id: null,

  init: function () {
    if(IS_CORDOVA) {
      bindEvents(this, {
        'document': {'deviceready': this.start},
        'window': {'orientationchange': this.orient}
      });
    } else {
      bindEvents(this, {'window': {'load': this.start}});
    }//end if: bound appropriate init
    bindEvents(this, {
      'window': {'orientationchange': this.orient}
    });

    this.$heading = document.querySelector('#heading');
    this.$compass = document.querySelector('#compass');
    this.$direction = document.querySelector('#direction');
    this.$orientation = document.querySelector('#orientation');
    return this;
  },

  orient: function () {
    this.orientation = screen.orientation.type;
    return this;
  },

  start: function () {
    var noop = function () {};
    var success = function (heading) {
      this.degrees = heading.trueHeading || 0;
      switch(this.orientation) {
      case 'portrait-primary':
        break;
      case 'landscape-primary':
        this.degrees += 90;
        break;
      case 'landscape-secondary':
        this.degrees -= 90;
        break;
      case 'portrait-secondary':
        this.degrees += 180;
        break;
      }//end switch: adjustments made

      this.degrees = Math.abs(this.degrees % 360).toFixed(2);
      this.render();
    }.bind(this);

    this.orient();
    if (IS_CORDOVA) {
      navigator.compass.getCurrentHeading(success);
      this.watch_id = navigator.compass.watchHeading(success, noop, {
        frequency: this.frequency
      });
    } else {
      randomHeading(success);
      this.watch_id = window.setInterval(function () {
        randomHeading(success)
      }, this.frequency);
    }//end if: set a clock
    return this.render();
  },

  render: function () {
    var degrees = this.degrees || 0;
    this.$direction.innerHTML = cardinalPoint(this.degrees, this.numPoints);
    this.$heading.innerText = degrees;
    this.$orientation.innerText = this.orientation;
    this.$compass.style.transform =
      'translateY(-50%) translateX(-50%) ' +
      f('rotate', degrees + 'deg');
    return this;
  }
};

app.init();
