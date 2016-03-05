(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":5}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],6:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],7:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":6,"_process":5,"inherits":3}],8:[function(require,module,exports){
var gpio = require("gpio");


////////////RELAY CONTROL FUNCTIONS///////////////
function GPIOS (gpios_used, gpios_used_mapped, invert_output, sample_interval) {
	this.gpios_used = gpios_used;
	this.gpios_used_mapped = gpios_used_mapped;
	this.invert_output = invert_output;
	this.sample_interval;									//currently all GPIOs set to same sample interval, but this can vary

	this.gpios_initialized;
}


GPIOS.prototype.initializeOutputGPIOs = function () {
	var gpios_ready = [];
	var gpios_used = this.gpios_used;				//make a local reference to parent object

	if (gpios_used.length > 1){
		for (var item in gpios_used) {
			var instance = this.createOutputGPIO(gpios_used[item]);  //create gpio instance object
			gpios_ready.push(instance);										  //add it to the gpios_initialized array
			console.log("Creating Output GPIO:    " + gpios_used[item]);
		}
	}

	else {
		var instance = this.createOutputGPIO(gpios_used);  //create gpio instance object
		gpios_ready.push(instance);										  //add it to the gpios_initialized array
		console.log("Creating Output GPIO:    " + gpios_used);
	}

	this.gpios_initialized = gpios_ready;
}


GPIOS.prototype.initializeInputGPIOs = function (gpios_used) {
	//NOT IMPLEMENTED YET

}


GPIOS.prototype.createOutputGPIO = function (gpio_num) {
	var gpio_instance = gpio.export(gpio_num, {
		direction: 'out',
		interval: this.sample_interval,
		ready: function () {			
			this.write(gpio_instance, false);	//initialize at known state. when inverted, set will instead act as LOW
		}
	});

	return gpio_instance;
}


GPIOS.prototype.createInputGPIO = function(gpio_num) {
	var gpio_instance = gpio.export(gpio_num, {
		direction: "in",
		//interval: this.sample_interval,
		ready: function() {
			console.log("in ready callback of createInputGPIO");
		}
	});

	return gpio_instance;
	//use event emitter to detect changes on gpio.
}


GPIOS.prototype.sweepHigh = function (total_duration, relays_used){
	var total_relays = relays_used;
	var time_per_relay = total_duration/total_relays;

	var current_relay = 0;		//initialize at the first relay (numbered 0 through total specified)
	var current_time = 0;		//initialize the current time

	var interval = setInterval(function(){
		this.setGPIOsHigh(current_relay);

		current_relay += 1;
		current_time += time_per_relay;

		if( current_time>(total_duration-time_per_relay) ) {	//stop execution before last nonexisten relay
			clearInterval(interval);
		}

	}, time_per_relay);
}


GPIOS.prototype.sweepLow = function (total_duration, relays_used){
	var total_relays = relays_used;
	var time_per_relay = total_duration/total_relays;

	var current_relay = 0;		//initialize at the first relay (numbered 0 through total specified)
	var current_time = 0;		//initialize the current time

	var interval = setInterval(function(){
		this.setGPIOsLow(current_relay);

		current_relay += 1;
		current_time += time_per_relay;

		if( current_time>(total_duration-time_per_relay) ) {	//stop execution before last nonexisten relay
			clearInterval(interval);
		}

	}, time_per_relay);
}


GPIOS.prototype.setGPIOsHigh = function	(gpios_selected){			//will take an array of 1 or more pins to turn on
	if (gpios_selected.length > 1){
		for (item in gpios_selected) {
			var value = gpios_selected[item];
			//console.log("GPIO SET HIGH:    " + gpios_used[value]);
			this.write(this.gpios_initialized[value], true);
		}
	}
	else {
		var value = gpios_selected;

		//console.log("GPIO SET HIGH:    " + gpios_used[value]);
		this.write(this.gpios_initialized[value], true);
	}
}


GPIOS.prototype.setGPIOsLow = function (gpios_selected) {			//will take an array of 1 or more pins to turn off
	if (gpios_selected.length > 1){
		for (item in gpios_selected) {
			var value = gpios_selected[item];
			//console.log("GPIO SET LOW:     " + gpios_used[value]);
			this.write(this.gpios_initialized[value], false);
		}
	}
	else {
		var value = gpios_selected;
		//console.log("GPIO SET LOW:     " + gpios_used[value]);
		this.write(this.gpios_initialized[value], false);
	}
}


GPIOS.prototype.write = function (gpio_instance, value) {				//gpio_instance is the GPIO # the OS defines
   	if (invert_output) {							//invert the input selected if invert is selected
   		console.log("value in is: " + value);
   		value = !value;
   	}

   	if(value === true) {
   		console.log("value out is: " + value);
   		console.log("GPIO SET HIGH");
   		gpio_instance.set();
	}
	else if(value === false) {
  		console.log("value out is: " + value);
		console.log("GPIO SET LOW");
   		gpio_instance.reset();
	}
	else {
		console.log("value not accepted");
	}
}


GPIOS.prototype.read = function (gpio_instance) {
	//NOT IMPLEMENTED YET

}


module.exports = GPIOS;
},{"gpio":10}],9:[function(require,module,exports){
// Wait until DOM is loaded to start
$(document).ready(function() {

    // setting up the GPIOs on the Raspberry Pi
    var gpios_used = [2, 3, 4, 17, 27, 22];       //according to RPi pinout labels
    var gpios_used_mapped = [0, 1, 2, 3, 4, 5];   //use sequential mapping for easier selection
    var invert_output = false;                    //switch on/off logic relative to gpio output
    var sample_interval = 100;                    //sample interval in milliseconds for gpio 

    var GPIOS = require('./GPIOS');
    var lamp_gpios = new GPIOS(gpios_used, gpios_used_mapped, invert_output, sample_interval);

    lamp_gpios.initializeOutputGPIOs();
    lamp_gpios.sweepHigh(10,6);               //run a test of sweeping high


    // jQuery logic for handling button groups
    $(".js-button-group button").click(function() {
      $(".js-button-group button").removeClass("bg-darken-4");
      $(".js-button-group button").addClass("gray");

      $(this).addClass("bg-darken-4");
      $(this).removeClass("gray");
    });

    // create the audio context (chrome only for now)
    if (! window.AudioContext) {
      if (! window.webkitAudioContext) {
          alert('no audiocontext found');
      }
      window.AudioContext = window.webkitAudioContext;
    }
    var context;
    var audioBuffer;
    var sourceNode;
    var analyser;
    var javascriptNode;
    var microphoneStream = null;
    var gainNode = null;
    var audioPlaying = false;
    var audioNodesSetUp = false;
    var useMicrophone = false;
    var timeData = {
      startTime: 0,     // Starting time of playback
      beatTimecodes: [] // Array of [beatTime-startTime]
    };

    // For controlling the background response.
    var BG_STYLE_COLORS = 0;
    var BG_STYLE_GIFS = 1;
    var bgStyle = BG_STYLE_COLORS;
    var gifSet = [];
    var activeBgGifIndex = 0;

    // get the context from the canvas to draw on
    var ctx = $("#canvas").get(0).getContext("2d");
    // create a gradient for the fill. Note the strange
    // offset, since the gradient is calculated based on
    // the canvas, not the specific element we draw
    var gradient = ctx.createLinearGradient(0,0,0,300);
    gradient.addColorStop(1,'#D7D7D7');
    gradient.addColorStop(0,'#FFFFFF');
    var beat_detect_gradient = ctx.createLinearGradient(0,0,0,300);
    beat_detect_gradient.addColorStop(1,'#C2C2C2');
    beat_detect_gradient.addColorStop(0,'#FFFFFF');

    // Beat detection with Dendrite.
    var beatDetector = new Dendrite();
    var beatDetectBand = 10;       // 3rd-to-last band we see out of 16.
    var beatDetectThreshold = 150; // Out of 255. Eyeballed this.
    var beatSamplingRate = 60;     // Default to 100% of beat events.
    var beat_detected = true;
    beatDetector.setFrequencyBand(beatDetectBand);
    beatDetector.setThreshold(beatDetectThreshold);
    beatDetector.onBeatDetected(onBeatDetected);

    // Visualization globals
    var active_bg_color_idx = 0;
    var BG_COLORS = [
      "#F7977A",
      "#F9AD81",
      "#FDC68A",
      "#FFF79A",
      "#C4DF9B",
      "#A2D39C",
      "#82CA9D",
      "#7BCDC8",
      "#6ECFF6",
      "#7EA7D8",
      "#8493CA",
      "#8882BE",
      "#A187BE",
      "#BC8DBF",
      "#BC8DBF",
      "#F49AC2",
      "#F6989D"
    ];

    // Slightly less ugly to simulate pageviews with symbolic constants.
    var URL_BUTTON_COLOR    = '/click/bg-color/';
    var URL_BUTTON_GIF      = '/click/bg-gif/';
    var URL_BUTTON_FILE     = '/click/source/file/';
    var URL_BUTTON_MIC      = '/click/source/mic/';
    var URL_BUTTON_PLAY     = '/click/file/play/';
    var URL_BUTTON_STOP     = '/click/file/stop/';
    var URL_BUTTON_NEXT     = '/click/file/next/';
    var URL_RANGE_BAND      = '/click/range/band/';
    var URL_RANGE_SAMPLING  = '/click/range/beat-sampling-rate/';
    var URL_RANGE_THRESHOLD = '/click/range/threshold/';
    var URL_SEARCH_GIPHY    = '/search/giphy/';

    // track list.
    var activeTrackID = 0;
    var TRACKLIST = [
      "audio/demo.mp3",
      "audio/uptown.mp3"
    ];


    // load the sound
    console.log("active track is: " + TRACKLIST[activeTrackID]);
    loadSound(TRACKLIST[activeTrackID], isPreload=true);


    // Set up click events.
    $('#bg-gif').click(toGifBackground);
    $('#bg-color').click(toColorBackground);
    $('#source-mic').click(toAudioSourceMicrophone);
    $('#source-mp3').click(toAudioSourceFile);
    $('#playback').click(startPlayback);
    $('#stop-playback').click(stopPlayback);
    $('#next').click(nextSound);
    $('#giphy-search-form').submit(onGiphyFormSubmit);
    $('#beat-detect-threshold').change(onChangeThresholdSlider);
    $('#beat-detect-band').change(onChangeBandSlider);
    $('#beat-sampling-rate').change(onChangeBeatSamplingSlider);

    // Pre-load party GIFs so there's something there if user switches to GIFs
    // without using the text box.
    giphySearch('party');
    updateUI();

    // TODO: Clean up creation of AudioNodes (either singletons or
    // garbage collect them). If you swap back and forth between
    // microphone and mp3 analysis, you get ghosting from multiple
    // nodes drawing almost-identical graphs.
    function setupAudioNodes() {
      if (!audioNodesSetUp) {
        // Hack to get load audio contexts from USER event not WINDOW event
        // because of restriction in mobile Safari/iOS.
        context = new AudioContext();

        // setup a javascript node
        javascriptNode = context.createScriptProcessor(2048, 1, 1);
        // connect to destination, else it isn't called
        javascriptNode.connect(context.destination);
        // setup a analyzer
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 32;

        // When the javascript node is called
        // we use information from the analyzer node
        // to draw the volume
        javascriptNode.onaudioprocess = function() {
          // get the average for the first channel
          var array =  new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          // clear the current state
          ctx.clearRect(0, 0, 400, 325);
          drawSpectrum(array);
          beatDetector.process(array);
        };

        // Mark as done (via first user event). Don't need to do again.
        audioNodesSetUp = true;
      }
    }
 
    /**
     * Microphone code adapted from StackOverflow.
     * http://stackoverflow.com/questions/26532328/how-do-i-get-audio-data-from-my-microphone-using-audiocontext-html5
     */
    function setupMicrophoneBuffer() {
      if (!navigator.getUserMedia) {
        navigator.getUserMedia =
            navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;
      }

      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          {audio:true},
          function(stream) {
            startMicrophone(stream);
          },
          function(e) {
            alert('Error capturing audio.');
          }
        );
      } else {
        alert('getUserMedia not supported in this browser.');
      };
    }

    function startMicrophone(stream){
      var BUFF_SIZE = 16384;
      microphoneStream = context.createMediaStreamSource(stream);

      // Comment out to disconnect output speakers. Everything else will
      // work OK this eliminates possibility of feedback squealing or
      // leave it in and turn down the volume.
      gainNode = context.createGain();
      //microphoneStream.connect(gainNode);

      // --- setup FFT
      javascriptNode = context.createScriptProcessor(2048, 1, 1);
      analyser = context.createAnalyser();
      analyser.smoothingTimeConstant = 0;
      analyser.fftSize = 32;

      gainNode.connect(context.destination);
      javascriptNode.connect(gainNode);
      analyser.connect(javascriptNode);
      microphoneStream.connect(analyser);

      javascriptNode.onaudioprocess = function() {  // FFT in frequency domain
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        // Draw the spectrum.
        ctx.clearRect(0, 0, 400, 325);
        drawSpectrum(array);
        beatDetector.process(array);
      }
    }

    /**
     * End microphone code from Stackoverflow.
     */

    // load the specified sound
    function loadSound(url, isPreload) {
      setupAudioNodes();

      // create a buffer source node
      sourceNode = context.createBufferSource();
      sourceNode.connect(analyser);
      analyser.connect(javascriptNode);
      sourceNode.connect(context.destination);

      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';

      // When loaded decode the data
      request.onload = function() {
        // decode the data
        context.decodeAudioData(request.response, function(buffer) {
          // when the audio is decoded play the sound
          if (!isPreload) {
            initSound(buffer);
          }
        }, onError);
      }
      request.send();
    }


    function initSound(buffer) {
      sourceNode.buffer = buffer;
      audioPlaying = true;
      resetBeatsDetected();
      timeData.startTime = Date.now(); // As close to playing file as possible.
      sourceNode.start(0);
      // Update UI.
      $('#playback').addClass('playing');
      updateUI();  // Called in start/stopPlayback, but this call happens
                   // in parallel, updates audioPlaying=true too late.
    }

    function stopSound() {
      audioPlaying = false;
      sourceNode.stop(0);
      $('#playback').removeClass('playing');
    }

    function toGifBackground() {
      if (bgStyle != BG_STYLE_GIFS) {
        //_triggerPageview(URL_BUTTON_GIF);
        // Set to gifs
        bgStyle = BG_STYLE_GIFS;
        // Update UI.
        updateUI();
      }
    }

    // TODO: separate button clicks from the main handler so GA doesn't
    // double count, eg, giphy search?
    function toColorBackground() {
      if (bgStyle != BG_STYLE_COLORS) {
        //_triggerPageview(URL_BUTTON_COLOR);
        // Set to colors
        bgStyle = BG_STYLE_COLORS;
        // Update UI.
        updateUI();
      }
    }

    function onGiphyFormSubmit(event) {
      var query = $.trim($('#giphy-search-query').val());
      //_triggerPageview(//_buildURL(URL_SEARCH_GIPHY, query));

      // Some basic validation.
      if ((query !== undefined) && (query != "")) {
        // Automatically switch to GIF background.
        toGifBackground();
        // Get images from Giphy.
        giphySearch(query);
      }
      // Don't let form submit refresh the page.
      event.preventDefault();
    }

    // From Giphy's API reference: https://github.com/Giphy/GiphyAPI
    // and RaveRobot: https://github.com/simplecasual/raverobot.com
    function giphySearch(query) {
      var xhr = $.get("https://api.giphy.com/v1/gifs/search?q=" + query + "&api_key=dc6zaTOxFJmzC&limit=20");
      xhr.done(function(data) { 
        var loading = [];
        var gifURL = "";
        for (var i = 0; i < data.data.length; i++) {
          gifURL = "https://media2.giphy.com/media/" + data.data[i].id + "/giphy.gif"
          loading.push(gifURL); 
        }
        var numLoaded = 0;
        var nextGifset = [];
        $(loading).each(function (i, uri) {
          var img = new Image();
          img.src = uri;
          nextGifset.push(uri);
          $(img).load(function() {
            if (numLoaded == 0) {
              gifSet = nextGifset;
            }
            numLoaded++;
          });
        });
      });
    }

    function startPlayback() {
      // Playback controls disabled in microphone mode.
      if (!useMicrophone) {
        //_triggerPageview(URL_BUTTON_PLAY);
        // Only start playing if we're not already.
        if (!audioPlaying) {
          // Start playing from audio file. Can't unpause an
          // AudioBufferSourceNode so we have to load from scratch :(
          loadSound(TRACKLIST[activeTrackID]); 

          updateUI();
        }
      }
    }

    function stopPlayback() {
      // Playback controls disabled in microphone mode.
      if (!useMicrophone) {
        //_triggerPageview(URL_BUTTON_STOP);
        // Only stop playing if we're already playing.
        if (audioPlaying) {
          // Stop playing from audio file.
          stopSound();
          printBeatsDetected();

          updateUI();
        }
      }
    }

    function toAudioSourceFile() {
      // Only do this if we're not already sourcing audio from files.
      if (useMicrophone) {
        //_triggerPageview(URL_BUTTON_FILE);
        // Turn off microphone.
        microphoneStream.disconnect();
        printBeatsDetected();

        // Update UI.
        useMicrophone = false;
        updateUI();
      }
    }

    function toAudioSourceMicrophone() {
      // Only do this if we're not already sourcing audio from the mic.
      if (!useMicrophone) {
        //_triggerPageview(URL_BUTTON_MIC);
        // Stop playback if it's happening.
        if (audioPlaying) {
          stopPlayback();
        }

        // Set up to record beats immediately.
        // (Is there a better time to start?) Seems like people will need to
        // adjust manually no matter what, might as well start when they click 'Mic'.
        resetBeatsDetected();
        timeData.startTime = Date.now();

        // Turn on microphone.
        setupAudioNodes();
        setupMicrophoneBuffer();

        // Update UI.
        useMicrophone = true;
        updateUI();
      }
    }

    function onChangeThresholdSlider(event) {
      var newThreshold = $('#beat-detect-threshold').val();
      //_triggerPageview(//_buildURL(URL_RANGE_THRESHOLD, newThreshold));

      beatDetectThreshold = newThreshold;
      beatDetector.setThreshold(beatDetectThreshold);
      $('#threshold-range-value').val(newThreshold);
    }

    function onChangeBandSlider(event) {
      var newBand = $('#beat-detect-band').val();
      //_triggerPageview(//_buildURL(URL_RANGE_BAND, newBand));

      beatDetectBand = newBand;
      beatDetector.setFrequencyBand(beatDetectBand);
      $('#band-range-value').val(newBand);
    }

    function onChangeBeatSamplingSlider(event) {
      var newSamplingRate = $('#beat-sampling-rate').val();
      //_triggerPageview(//_buildURL(URL_RANGE_SAMPLING, newSamplingRate));
      beatSamplingRate = newSamplingRate;
      $('#beat-sampling-value').val(newSamplingRate + '%');
    }

    function nextSound() {
      // Playback controls disabled in microphone mode.
      if (!useMicrophone) {
        //_triggerPageview(URL_BUTTON_NEXT);

        //var newURL = prompt("Enter URL of a new song to play");
        //if (newURL !== undefined) {
        //  songURL = newURL;
        //}
        if (audioPlaying) {
          // Only stop first if already playing.
          stopPlayback();
        }
        // Increment track.
        activeTrackID = (activeTrackID + 1) % TRACKLIST.length;
        // Now play (which will load newly-updated songURL).
        startPlayback();
      }
    }

    // log if an error occurs
    function onError(e) {
      console.log("Error!");
      console.log(e);
    }

    /**
     * Callback to store array of beats detected.
     */
    function registerBeatDetected(array, beatTime) {
      var timeCode = beatTime - timeData.startTime;
      timeData.beatTimecodes.push(timeCode);
    }

    function resetBeatsDetected() {
      timeData.beatTimecodes = [];
    }

    function printBeatsDetected() {
      console.log('beats detected at the following ms offsets: ' +
          timeData.beatTimecodes);
    }

    /**
     * Draw the EQ spectrum lines, given one frame of audio.
     */
    function drawSpectrum(array) {
      // Odd numbers -> corresponding even ones, since we're only showing half.
      var displayBand = beatDetectBand;
      if ((displayBand % 2) != 0) {
        displayBand++;
      }
      // Draw the frequency bands.
      for ( var i = 0; i < (array.length); i+=2 ){
        if (i == displayBand) {
          // Set the beat detecting fill style.
          ctx.fillStyle = beat_detect_gradient;
        } else {
          // Set the fill style.
          ctx.fillStyle = gradient;
        }
        // Draw the EQ bar.
        var value = array[i];
        ctx.fillRect(i*25,325-value,20,325);

        //display the frequency band and resulting value
        console.log("frequency band is: " + i + "    value is: " + array[i]);

      }
      // Now draw a line to show the threshold value.
      var yVal = 325-beatDetectThreshold;
      ctx.fillRect(0, yVal, 400, 1);
    };

    // Called when Dendrite detects a beat.
    function onBeatDetected(array, beatTime) {
      var roll = Math.random()*100;  // Random roll out of 100%.
      if (roll < beatSamplingRate) {
        swapBackground(array, beatTime);
        registerBeatDetected(array, beatTime);
      }
    }

    /**
     * Redraw the background color in response to the beat detection.
     */
    function swapBackground(array, timestamp) {
      if (bgStyle == BG_STYLE_COLORS) {
        // Clear any existing background image.
        $('.js-background').css('background-image', '');
        // Increment color ID by two. This gives more visual change per swap, and
        // there's an odd number in the array, so 2nd time through is different.
        active_bg_color_idx = (active_bg_color_idx + 2) % BG_COLORS.length;
        $('.js-background').css('background-color', BG_COLORS[active_bg_color_idx]);
      } else {
        // Don't start gifSet lookups before the data comes back.
        if (gifSet && (gifSet.length > 0)) {
          // Increment to next gif.
          activeBgGifIndex = (activeBgGifIndex + 1) % gifSet.length;
          $('.js-background').css('background-image', 'url(\'' + gifSet[activeBgGifIndex] + '\')');
        }
      }
    }

    /**
     * Called whenever we need to update the UI.
     * Keeps all UI-specific logic in one place.
     */
    function updateUI() {
      // Set play/pause button.
      if (audioPlaying) {
        $('#playback').addClass('display-none');
        $('#stop-playback').removeClass('display-none');
      } else {
        $('#playback').removeClass('display-none');
        $('#stop-playback').addClass('display-none');
      }
      // Playback controls are disabled in microphone mode. Hide them.
      if (useMicrophone) {
        $('#playback').attr('disabled','true');
        $('#stop-playback').attr('disabled','true');
        $('#next').attr('disabled','true');
      } else {
        $('#playback').removeAttr('disabled');
        $('#stop-playback').removeAttr('disabled');
        $('#next').removeAttr('disabled');
      }
    }

    /**
     * Register simulated pageviews with GA
     * https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
     *
     * @param page,String -- Relative URL for the page to log a view on.
     *                       eg. '/my-overridden-page?id=1'
     * @param title,String -- HTML title of simulated page (optional)
     *                       eg. 'My overridden Page'
     */
    /*function _triggerPageview(page, title) {
      ga('send', 'pageview', {
        'page': page,
        'title': title
      });
    }*/

    /*
     * Returns full GA URL for URLs that need a param appended.
     */
    /*function _buildURL(page, queryParam) {
      return page + queryParam;
    }*/
});

},{"./GPIOS":8}],10:[function(require,module,exports){
var fs = require('fs');
var util = require('util');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var exists = fs.exists || path.exists;

var gpiopath = '/sys/class/gpio/';

var logError = function(e) { if(e) console.log(e.code, e.action, e.path); };
var logMessage = function() { if (exports.logging) console.log.apply(console, arguments); };

var _write = function(str, file, fn, override) {
	if(typeof fn !== "function") fn = logError;
	fs.writeFile(file, str, function(err) {
		if(err && !override) {
			err.path = file;
			err.action = 'write';
			logError(err);
		} else {
			if(typeof fn === "function") fn();
		}
	});
};
var _read = function(file, fn) {
	fs.readFile(file, "utf-8", function(err, data) {
		if(err) {
			err.path = file;
			err.action = 'read';
			logError(err);
		} else {
			if(typeof fn === "function") fn(data);
			else logMessage("value: ", data);
		}
	});
};

var _unexport = function(number, fn) {
	_write(number, gpiopath + 'unexport', function(err) {
		if(err) return logError(err);
		if(typeof fn === 'function') fn();
	}, 1);
};
var _export = function(n, fn) {
	if(exists(gpiopath + 'gpio'+n)) {
		// already exported, unexport and export again
		logMessage('Header already exported');
		_unexport(n, function() { _export(n, fn); });
	} else {
		logMessage('Exporting gpio' + n);
		_write(n, gpiopath + 'export', function(err) {
			// if there's an error when exporting, unexport and repeat
			if(err) _unexport(n, function() { _export(n, fn); });
			else if(typeof fn === 'function') fn();
		}, 1);
	}
};
var _testwrite = function(file, fn) {
	fs.open(file, 'w', function(err, fd) {
		if (err) {
			fn(false, err);
			return;
		}
		fs.close(fd, function(err){
			fn(true, null);	
		});
	});
};

// fs.watch doesn't get fired because the file never
// gets 'accessed' when setting header via hardware
// manually watching value changes
var FileWatcher = function(path, interval, fn) {
	if(typeof fn === 'undefined') {
		fn = interval;
		interval = 100;
	}
	if(typeof interval !== 'number') return false;
	if(typeof fn !== 'function') return false;

	var value;
	var readTimer = setInterval(function() {
		_read(path, function(val) {
			if(value !== val) {
				if(typeof value !== 'undefined') fn(val);
				value = val;
			}
		});
	}, interval);

	this.stop = function() { clearInterval(readTimer); };
};


var GPIO = function(headerNum, opts) {
	opts = opts || {};

	var self = this;
	var dir = opts.direction;
	var interval = opts.interval;
	if(typeof interval !== 'number') interval = 100;
	this.interval = interval;

	this.headerNum = headerNum;
	this.value = 0;

	this.PATH = {};
	this.PATH.PIN =       gpiopath + 'gpio' + headerNum + '/';
	this.PATH.VALUE =     this.PATH.PIN + 'value';
	this.PATH.DIRECTION = this.PATH.PIN + 'direction';

	this.export(function() {
		var onSuccess = function() {
			self.setDirection(dir, function () {
				if(typeof opts.ready === 'function') opts.ready.call(self);
			});
		};
		var attempts = 0;
		var makeAttempt = function() {
			attempts += 1;
			_testwrite(self.PATH.DIRECTION, function(success, err){
				if (success) {
					onSuccess();
				} else {
					logMessage('Could not write to pin: ' + err.code);
					if (attempts <= 5) {
						logMessage('Trying again in 100ms');
						setTimeout(makeAttempt, 100);
					} else {
						logMessage('Failed to access pin after 5 attempts. Giving up.');
					}
				}
			});
		};
		makeAttempt();
	});
};

util.inherits(GPIO, EventEmitter);


/**
 * Export and unexport gpio#, takes callback which fires when operation is completed
 */
GPIO.prototype.export = function(fn) { _export(this.headerNum, fn); };
GPIO.prototype.unexport = function(fn) {
	if(this.valueWatcher) this.valueWatcher.stop();
	_unexport(this.headerNum, fn);
};


/**
 * Sets direction, default is "out"
 */
GPIO.prototype.setDirection = function(dir, fn) {
	var self = this, path = this.PATH.DIRECTION;
	if(typeof dir !== "string" || dir !== "in") dir = "out";
	this.direction = dir;

	logMessage('Setting direction "' + dir + '" on gpio' + this.headerNum);

	function watch () {
		if(dir === 'in') {
			if (!self.valueWatcher) {
				// watch for value changes only for direction "in"
				// since we manually trigger event for "out" direction when setting value
				self.valueWatcher = new FileWatcher(self.PATH.VALUE, self.interval, function(val) {
					val = parseInt(val, 10);
					self.value = val;
					self.emit("valueChange", val);
					self.emit("change", val);
				});
			}
		} else {
			// if direction is "out", try to clear the valueWatcher
			if(self.valueWatcher) {
				self.valueWatcher.stop();
				self.valueWatcher = null;
			}
		}
	}
	_read(path, function(currDir) {
		var changedDirection = false;
		if(currDir.indexOf(dir) !== -1) {
			logMessage('Current direction is already ' + dir);
			logMessage('Attempting to set direction anyway.');
		} else {
			changedDirection = true;
		}
		_write(dir, path, function() {
			watch();

			if(typeof fn === 'function') fn();
			if (changedDirection) {
				self.emit('directionChange', dir);
			}
		}, 1);
	
	});
};

/**
 * Internal getter, stores value
 */
GPIO.prototype._get = function(fn) {
	var self = this, currVal = this.value;

	if(this.direction === 'out') return currVal;

	_read(this.PATH.VALUE, function(val) {
		val = parseInt(val, 10);
		if(val !== currVal) {
			self.value = val;
			if(typeof fn === "function") fn.call(this, self.value);
		}
	});
};

/**
 * Sets the value. If v is specified as 0 or '0', reset will be called
 */
GPIO.prototype.set = function(v, fn) {
	var self = this;
	var callback = typeof v === 'function' ? v : fn;
	if(typeof v !== "number" || v !== 0) v = 1;

	// if direction is out, just emit change event since we can reliably predict
	// if the value has changed; we don't have to rely on watching a file
	if(this.direction === 'out') {
		if(this.value !== v) {
			_write(v, this.PATH.VALUE, function() {
				self.value = v;
				self.emit('valueChange', v);
				self.emit('change', v);
				if(typeof callback === 'function') callback(self.value, true);
			});
		} else {
			if(typeof callback === 'function') callback(this.value, false);
		}
	}
};
GPIO.prototype.reset = function(fn) { this.set(0, fn); };

exports.logging = false;
exports.export = function(headerNum, direction) { return new GPIO(headerNum, direction); };
exports.unexport = _unexport;


},{"events":2,"fs":1,"path":4,"util":7}]},{},[9]);
