(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.Uncharted || (g.Uncharted = {})).Personas = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2015 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 2.11.0
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, cancel, using, filter, any, each, timers
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule.js");
var Queue = _dereq_("./queue.js");
var util = _dereq_("./util.js");

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule =
        schedule.isStatic ? schedule(this.drainQueues) : schedule;
}

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.enableTrampoline = function() {
    if (!this._trampolineEnabled) {
        this._trampolineEnabled = true;
        this._schedule = function(fn) {
            setTimeout(fn, 0);
        };
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._normalQueue.length() > 0;
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    if (schedule.isStatic) {
        schedule = function(fn) { setTimeout(fn, 0); };
    }
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;

},{"./queue.js":28,"./schedule.js":31,"./util.js":38}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (this._isPending()) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, ret._progress, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, ret._progress, ret, context);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 131072;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~131072);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 131072) === 131072;
};

Promise.bind = function (thisArg, value) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        maybePromise._then(function() {
            ret._resolveCallback(value);
        }, ret._reject, ret._progress, ret, null);
    } else {
        ret._resolveCallback(value);
    }
    return ret;
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise.js")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise.js":23}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util.js":38}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var errors = _dereq_("./errors.js");
var async = _dereq_("./async.js");
var CancellationError = errors.CancellationError;

Promise.prototype._cancel = function (reason) {
    if (!this.isCancellable()) return this;
    var parent;
    var promiseToReject = this;
    while ((parent = promiseToReject._cancellationParent) !== undefined &&
        parent.isCancellable()) {
        promiseToReject = parent;
    }
    this._unsetCancellable();
    promiseToReject._target()._rejectCallback(reason, false, true);
};

Promise.prototype.cancel = function (reason) {
    if (!this.isCancellable()) return this;
    if (reason === undefined) reason = new CancellationError();
    async.invokeLater(this._cancel, this, reason);
    return this;
};

Promise.prototype.cancellable = function () {
    if (this._cancellable()) return this;
    async.enableTrampoline();
    this._setCancellable();
    this._cancellationParent = undefined;
    return this;
};

Promise.prototype.uncancellable = function () {
    var ret = this.then();
    ret._unsetCancellable();
    return ret;
};

Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
    var ret = this._then(didFulfill, didReject, didProgress,
                         undefined, undefined);

    ret._setCancellable();
    ret._cancellationParent = undefined;
    return ret;
};
};

},{"./async.js":2,"./errors.js":13}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var warn;

function CapturedTrace(parent) {
    this._parent = parent;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = CapturedTrace.parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = stackFramePattern.test(line) ||
            "    (No stack trace)" === line;
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

CapturedTrace.parseStackAndMessage = function(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
};

CapturedTrace.formatAndLogError = function(error, title) {
    if (typeof console !== "undefined") {
        var message;
        if (typeof error === "object" || typeof error === "function") {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof warn === "function") {
            warn(message);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
};

CapturedTrace.unhandledRejection = function (reason) {
    CapturedTrace.formatAndLogError(reason, "^--- With additional stack trace: ");
};

CapturedTrace.isSupported = function () {
    return typeof captureStackTrace === "function";
};

CapturedTrace.fireRejectionEvent =
function(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent(name, reason, promise);
    } catch (e) {
        globalEventFired = true;
        async.throwLater(e);
    }

    var domEventFired = false;
    if (fireDomEvent) {
        try {
            domEventFired = fireDomEvent(name.toLowerCase(), {
                reason: reason,
                promise: promise
            });
        } catch (e) {
            domEventFired = true;
            async.throwLater(e);
        }
    }

    if (!globalEventFired && !localEventFired && !domEventFired &&
        name === "unhandledRejection") {
        CapturedTrace.formatAndLogError(reason, "Unhandled rejection ");
    }
};

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}
CapturedTrace.setBounds = function(firstLineError, lastLineError) {
    if (!CapturedTrace.isSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit = Error.stackTraceLimit + 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

var fireDomEvent;
var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function(name, reason, promise) {
            if (name === "rejectionHandled") {
                return process.emit(name, promise);
            } else {
                return process.emit(name, reason, promise);
            }
        };
    } else {
        var customEventWorks = false;
        var anyEventWorks = true;
        try {
            var ev = new self.CustomEvent("test");
            customEventWorks = ev instanceof CustomEvent;
        } catch (e) {}
        if (!customEventWorks) {
            try {
                var event = document.createEvent("CustomEvent");
                event.initCustomEvent("testingtheevent", false, true, {});
                self.dispatchEvent(event);
            } catch (e) {
                anyEventWorks = false;
            }
        }
        if (anyEventWorks) {
            fireDomEvent = function(type, detail) {
                var event;
                if (customEventWorks) {
                    event = new self.CustomEvent(type, {
                        detail: detail,
                        bubbles: false,
                        cancelable: true
                    });
                } else if (self.dispatchEvent) {
                    event = document.createEvent("CustomEvent");
                    event.initCustomEvent(type, false, true, detail);
                }

                return event ? !self.dispatchEvent(event) : false;
            };
        }

        var toWindowMethodNameMap = {};
        toWindowMethodNameMap["unhandledRejection"] = ("on" +
            "unhandledRejection").toLowerCase();
        toWindowMethodNameMap["rejectionHandled"] = ("on" +
            "rejectionHandled").toLowerCase();

        return function(name, reason, promise) {
            var methodName = toWindowMethodNameMap[name];
            var method = self[methodName];
            if (!method) return false;
            if (name === "rejectionHandled") {
                method.call(self, promise);
            } else {
                method.call(self, reason, promise);
            }
            return true;
        };
    }
})();

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    warn = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        warn = function(message) {
            process.stderr.write("\u001b[31m" + message + "\u001b[39m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        warn = function(message) {
            console.warn("%c" + message, "color: red");
        };
    }
}

return CapturedTrace;
};

},{"./async.js":2,"./util.js":38}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util.js");
var errors = _dereq_("./errors.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var keys = _dereq_("./es5.js").keys;
var TypeError = errors.TypeError;

function CatchFilter(instances, callback, promise) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}

function safePredicate(predicate, e) {
    var safeObject = {};
    var retfilter = tryCatch(predicate).call(safeObject, e);

    if (retfilter === errorObj) return retfilter;

    var safeKeys = keys(safeObject);
    if (safeKeys.length) {
        errorObj.e = new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a");
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function (e) {
    var cb = this._callback;
    var promise = this._promise;
    var boundTo = promise._boundValue();
    for (var i = 0, len = this._instances.length; i < len; ++i) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            (item != null && item.prototype instanceof Error);

        if (itemIsErrorType && e instanceof item) {
            var ret = tryCatch(cb).call(boundTo, e);
            if (ret === errorObj) {
                NEXT_FILTER.e = ret.e;
                return NEXT_FILTER;
            }
            return ret;
        } else if (typeof item === "function" && !itemIsErrorType) {
            var shouldHandle = safePredicate(item, e);
            if (shouldHandle === errorObj) {
                e = errorObj.e;
                break;
            } else if (shouldHandle) {
                var ret = tryCatch(cb).call(boundTo, e);
                if (ret === errorObj) {
                    NEXT_FILTER.e = ret.e;
                    return NEXT_FILTER;
                }
                return ret;
            }
        }
    }
    NEXT_FILTER.e = e;
    return NEXT_FILTER;
};

return CatchFilter;
};

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace, isDebugging) {
var contextStack = [];
function Context() {
    this._trace = new CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.pop();
    }
};

function createContext() {
    if (isDebugging()) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}

Promise.prototype._peekContext = peekContext;
Promise.prototype._pushContext = Context.prototype._pushContext;
Promise.prototype._popContext = Context.prototype._popContext;

return createContext;
};

},{}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var Warning = _dereq_("./errors.js").Warning;
var util = _dereq_("./util.js");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var debugging = false || (util.isNode &&
                    (!!process.env["BLUEBIRD_DEBUG"] ||
                     process.env["NODE_ENV"] === "development"));

if (util.isNode && process.env["BLUEBIRD_DEBUG"] == 0) debugging = false;

if (debugging) {
    async.disableTrampolineIfNecessary();
}

Promise.prototype._ignoreRejections = function() {
    this._unsetRejectionIsUnhandled();
    this._bitField = this._bitField | 16777216;
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 16777216) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    CapturedTrace.fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._getCarriedStackTrace() || this._settledValue;
        this._setUnhandledRejectionIsNotified();
        CapturedTrace.fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 524288;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~524288);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 524288) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 2097152;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~2097152);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 2097152) > 0;
};

Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
    this._bitField = this._bitField | 1048576;
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._isCarryingStackTrace = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._getCarriedStackTrace = function () {
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : undefined;
};

Promise.prototype._captureStackTrace = function () {
    if (debugging) {
        this._trace = new CapturedTrace(this._peekContext());
    }
    return this;
};

Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
    if (debugging && canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = CapturedTrace.parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
};

Promise.prototype._warn = function(message) {
    var warning = new Warning(message);
    var ctx = this._peekContext();
    if (ctx) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = CapturedTrace.parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }
    CapturedTrace.formatAndLogError(warning, "");
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.longStackTraces = function () {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/DT1qyG\u000a");
    }
    debugging = CapturedTrace.isSupported();
    if (debugging) {
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return debugging && CapturedTrace.isSupported();
};

if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

return function() {
    return debugging;
};
};

},{"./async.js":2,"./errors.js":13,"./util.js":38}],11:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;

module.exports = function(Promise) {
var returner = function () {
    return this;
};
var thrower = function () {
    throw this;
};
var returnUndefined = function() {};
var throwUndefined = function() {
    throw undefined;
};

var wrapper = function (value, action) {
    if (action === 1) {
        return function () {
            throw value;
        };
    } else if (action === 2) {
        return function () {
            return value;
        };
    }
};


Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value === undefined) return this.then(returnUndefined);

    if (isPrimitive(value)) {
        return this._then(
            wrapper(value, 2),
            undefined,
            undefined,
            undefined,
            undefined
       );
    } else if (value instanceof Promise) {
        value._ignoreRejections();
    }
    return this._then(returner, undefined, undefined, value, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    if (reason === undefined) return this.then(throwUndefined);

    if (isPrimitive(reason)) {
        return this._then(
            wrapper(reason, 1),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(thrower, undefined, undefined, reason, undefined);
};
};

},{"./util.js":38}],12:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, null, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, null, INTERNAL);
};
};

},{}],13:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util.js");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    notEnumerableProp(Error, "__BluebirdErrorTypes__", errorTypes);
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5.js":14,"./util.js":38}],14:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, NEXT_FILTER, tryConvertToPromise) {
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;
var thrower = util.thrower;

function returnThis() {
    return this;
}
function throwThis() {
    throw this;
}
function return$(r) {
    return function() {
        return r;
    };
}
function throw$(r) {
    return function() {
        throw r;
    };
}
function promisedFinally(ret, reasonOrValue, isFulfilled) {
    var then;
    if (isPrimitive(reasonOrValue)) {
        then = isFulfilled ? return$(reasonOrValue) : throw$(reasonOrValue);
    } else {
        then = isFulfilled ? returnThis : throwThis;
    }
    return ret._then(then, thrower, undefined, reasonOrValue, undefined);
}

function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue())
                    : handler();

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, reasonOrValue,
                                    promise.isFulfilled());
        }
    }

    if (promise.isRejected()) {
        NEXT_FILTER.e = reasonOrValue;
        return NEXT_FILTER;
    } else {
        return reasonOrValue;
    }
}

function tapHandler(value) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue(), value)
                    : handler(value);

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, value, true);
        }
    }
    return value;
}

Promise.prototype._passThroughHandler = function (handler, isFinally) {
    if (typeof handler !== "function") return this.then();

    var promiseAndHandler = {
        promise: this,
        handler: handler
    };

    return this._then(
            isFinally ? finallyHandler : tapHandler,
            isFinally ? finallyHandler : undefined, undefined,
            promiseAndHandler, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThroughHandler(handler, true);
};

Promise.prototype.tap = function (handler) {
    return this._passThroughHandler(handler, false);
};
};

},{"./util.js":38}],17:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise) {
var errors = _dereq_("./errors.js");
var TypeError = errors.TypeError;
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    var promise = this._promise = new Promise(INTERNAL);
    promise._captureStackTrace();
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
}

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._next(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    if (result === errorObj) {
        return this._promise._rejectCallback(result.e, false, true);
    }

    var value = result.value;
    if (result.done === true) {
        this._promise._resolveCallback(value);
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._throw(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/4Y4pDk\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise._then(
            this._next,
            this._throw,
            undefined,
            this,
            null
       );
    }
};

PromiseSpawn.prototype._throw = function (reason) {
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._next = function (value) {
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        spawn._generator = generator;
        spawn._next(undefined);
        return spawn.promise();
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors.js":13,"./util.js":38}],18:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var caller = function(count) {
        var values = [];
        for (var i = 1; i <= count; ++i) values.push("holder.p" + i);
        return new Function("holder", "                                      \n\
            'use strict';                                                    \n\
            var callback = holder.fn;                                        \n\
            return callback(values);                                         \n\
            ".replace(/values/g, values.join(", ")));
    };
    var thenCallbacks = [];
    var callers = [undefined];
    for (var i = 1; i <= 5; ++i) {
        thenCallbacks.push(thenCallback(i));
        callers.push(caller(i));
    }

    var Holder = function(total, fn) {
        this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
        this.fn = fn;
        this.total = total;
        this.now = 0;
    };

    Holder.prototype.callers = callers;
    Holder.prototype.checkFulfillment = function(promise) {
        var now = this.now;
        now++;
        var total = this.total;
        if (now >= total) {
            var handler = this.callers[total];
            promise._pushContext();
            var ret = tryCatch(handler)(this);
            promise._popContext();
            if (ret === errorObj) {
                promise._rejectCallback(ret.e, false, true);
            } else {
                promise._resolveCallback(ret);
            }
        } else {
            this.now = now;
        }
    };

    var reject = function (reason) {
        this._reject(reason);
    };
}
}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last < 6 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var holder = new Holder(last, fn);
                var callbacks = thenCallbacks;
                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        if (maybePromise._isPending()) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                        } else if (maybePromise._isFulfilled()) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else {
                            ret._reject(maybePromise._reason());
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                return ret;
            }
        }
    }
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util.js":38}],19:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var PENDING = {};
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    async.invoke(init, this, undefined);
}
util.inherits(MappingPromiseArray, PromiseArray);
function init() {this._init$(undefined, -2);}

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;
    if (values[index] === PENDING) {
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var callback = this._callback;
        var receiver = this._promise._boundValue();
        this._promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        this._promise._popContext();
        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                if (limit >= 1) this._inFlight++;
                values[index] = PENDING;
                return maybePromise._proxyPromiseArray(this, index);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }

    }
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter);
}

Promise.prototype.map = function (fn, options) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

    return map(this, fn, options, null).promise();
};

Promise.map = function (promises, fn, options, _filter) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    return map(promises, fn, options, _filter).promise();
};


};

},{"./async.js":2,"./util.js":38}],20:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        ret._popContext();
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn, args, ctx) {
    if (typeof fn !== "function") {
        return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value = util.isArray(args)
        ? tryCatch(fn).apply(ctx, args)
        : tryCatch(fn).call(ctx, args);
    ret._popContext();
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false, true);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util.js":38}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var target = promise._target();
        var newReason = target._getCarriedStackTrace();
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback =
Promise.prototype.nodeify = function (nodeback, options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./async.js":2,"./util.js":38}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

Promise.prototype.progressed = function (handler) {
    return this._then(undefined, undefined, handler, undefined, undefined);
};

Promise.prototype._progress = function (progressValue) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._target()._progressUnchecked(progressValue);

};

Promise.prototype._progressHandlerAt = function (index) {
    return index === 0
        ? this._progressHandler0
        : this[(index << 2) + index - 5 + 2];
};

Promise.prototype._doProgressWith = function (progression) {
    var progressValue = progression.value;
    var handler = progression.handler;
    var promise = progression.promise;
    var receiver = progression.receiver;

    var ret = tryCatch(handler).call(receiver, progressValue);
    if (ret === errorObj) {
        if (ret.e != null &&
            ret.e.name !== "StopProgressPropagation") {
            var trace = util.canAttachTrace(ret.e)
                ? ret.e : new Error(util.toString(ret.e));
            promise._attachExtraTrace(trace);
            promise._progress(ret.e);
        }
    } else if (ret instanceof Promise) {
        ret._then(promise._progress, null, null, promise, undefined);
    } else {
        promise._progress(ret);
    }
};


Promise.prototype._progressUnchecked = function (progressValue) {
    var len = this._length();
    var progress = this._progress;
    for (var i = 0; i < len; i++) {
        var handler = this._progressHandlerAt(i);
        var promise = this._promiseAt(i);
        if (!(promise instanceof Promise)) {
            var receiver = this._receiverAt(i);
            if (typeof handler === "function") {
                handler.call(receiver, progressValue, promise);
            } else if (receiver instanceof PromiseArray &&
                       !receiver._isResolved()) {
                receiver._promiseProgressed(progressValue, promise);
            }
            continue;
        }

        if (typeof handler === "function") {
            async.invoke(this._doProgressWith, this, {
                handler: handler,
                promise: promise,
                receiver: this._receiverAt(i),
                value: progressValue
            });
        } else {
            async.invoke(progress, promise, progressValue);
        }
    }
};
};

},{"./async.js":2,"./util.js":38}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/LhFpo0\u000a");
};
var reflect = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};

var util = _dereq_("./util.js");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var UNDEFINED_BINDING = {};
var async = _dereq_("./async.js");
var errors = _dereq_("./errors.js");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {e: null};
var tryConvertToPromise = _dereq_("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var CapturedTrace = _dereq_("./captured_trace.js")();
var isDebugging = _dereq_("./debuggability.js")(Promise, CapturedTrace);
 /*jshint unused:false*/
var createContext =
    _dereq_("./context.js")(Promise, CapturedTrace, isDebugging);
var CatchFilter = _dereq_("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = _dereq_("./promise_resolver.js");
var nodebackForPromise = PromiseResolver._nodebackForPromise;
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;

function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("the promise constructor requires a resolver function\u000a\u000a    See http://goo.gl/EC22Yn\u000a");
    }
    if (this.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a");
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._progressHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settledValue = undefined;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (typeof item === "function") {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(
                    new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a"));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(undefined, catchFilter.doFilter, undefined,
            catchFilter, undefined);
    }
    return this._then(undefined, fn, undefined, undefined, undefined);
};

Promise.prototype.reflect = function () {
    return this._then(reflect, reflect, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject, didProgress) {
    if (isDebugging() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (didFulfill, didReject) {
    return this.all()._then(didFulfill, didReject, undefined, APPLY, undefined);
};

Promise.prototype.isCancellable = function () {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.getNewLibraryCopy = module.exports;

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = function(fn) {
    var ret = new Promise(INTERNAL);
    var result = tryCatch(fn)(nodebackForPromise(ret));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true, true);
    }
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.defer = Promise.pending = function () {
    var promise = new Promise(INTERNAL);
    return new PromiseResolver(promise);
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        var val = ret;
        ret = new Promise(INTERNAL);
        ret._fulfillUnchecked(val);
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        ret._propagateFrom(this, 4 | 1);
        ret._captureStackTrace();
    }

    var target = this._target();
    if (target !== this) {
        if (receiver === undefined) receiver = this._boundTo;
        if (!haveInternalData) ret._setIsMigrated();
    }

    var callbackIndex = target._addCallbacks(didFulfill,
                                             didReject,
                                             didProgress,
                                             ret,
                                             receiver,
                                             getDomain());

    if (target._isResolved() && !target._isSettlePromisesQueued()) {
        async.invoke(
            target._settlePromiseAtPostResolution, target, callbackIndex);
    }

    return ret;
};

Promise.prototype._settlePromiseAtPostResolution = function (index) {
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    this._settlePromiseAt(index);
};

Promise.prototype._length = function () {
    return this._bitField & 131071;
};

Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
    return (this._bitField & 939524096) > 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 536870912) === 536870912;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -131072) |
        (len & 131071);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 33554432) > 0;
};

Promise.prototype._cancellable = function () {
    return (this._bitField & 67108864) > 0;
};

Promise.prototype._setCancellable = function () {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function () {
    this._bitField = this._bitField & (~67108864);
};

Promise.prototype._setIsMigrated = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._unsetIsMigrated = function () {
    this._bitField = this._bitField & (~4194304);
};

Promise.prototype._isMigrated = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0
        ? this._receiver0
        : this[
            index * 5 - 5 + 4];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return index === 0
        ? this._promise0
        : this[index * 5 - 5 + 3];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return index === 0
        ? this._fulfillmentHandler0
        : this[index * 5 - 5 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return index === 0
        ? this._rejectionHandler0
        : this[index * 5 - 5 + 1];
};

Promise.prototype._boundValue = function() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
};

Promise.prototype._migrateCallbacks = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var progress = follower._progressHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (promise instanceof Promise) promise._setIsMigrated();
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, progress, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this._progressHandler0 =
                domain === null ? progress : domain.bind(progress);
        }
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promise;
        this[base + 4] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this[base + 2] =
                domain === null ? progress : domain.bind(progress);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promiseSlotValue;
        this[base + 4] = receiver;
    }
    this._setLength(index + 1);
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false, true);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    var propagationFlags = 1 | (shouldBind ? 4 : 0);
    this._propagateFrom(maybePromise, propagationFlags);
    var promise = maybePromise._target();
    if (promise._isPending()) {
        var len = this._length();
        for (var i = 0; i < len; ++i) {
            promise._migrateCallbacks(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (promise._isFulfilled()) {
        this._fulfillUnchecked(promise._value());
    } else {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
    if (!shouldNotMarkOriginatingFromRejection) {
        util.markAsOriginatingFromRejection(reason);
    }
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason, hasStack ? undefined : trace);
};

Promise.prototype._resolveFromResolver = function (resolver) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = tryCatch(resolver)(function(value) {
        if (promise === null) return;
        promise._resolveCallback(value);
        promise = null;
    }, function (reason) {
        if (promise === null) return;
        promise._rejectCallback(reason, synchronous);
        promise = null;
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined && r === errorObj && promise !== null) {
        promise._rejectCallback(r.e, true, true);
        promise = null;
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    if (promise._isRejected()) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY && !this._isRejected()) {
        x = tryCatch(handler).apply(this._boundValue(), value);
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    promise._popContext();

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false, true);
    } else {
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._cleanValues = function () {
    if (this._cancellable()) {
        this._cancellationParent = undefined;
    }
};

Promise.prototype._propagateFrom = function (parent, flags) {
    if ((flags & 1) > 0 && parent._cancellable()) {
        this._setCancellable();
        this._cancellationParent = parent;
    }
    if ((flags & 4) > 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
};

Promise.prototype._fulfill = function (value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function (index) {
    var promise = this._promiseAt(index);
    var isPromise = promise instanceof Promise;

    if (isPromise && promise._isMigrated()) {
        promise._unsetIsMigrated();
        return async.invoke(this._settlePromiseAt, this, index);
    }
    var handler = this._isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    var carriedStackTrace =
        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
    var value = this._settledValue;
    var receiver = this._receiverAt(index);
    this._clearCallbackDataAtIndex(index);

    if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (this._isFulfilled()) {
                receiver._promiseFulfilled(value, promise);
            }
            else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (this._isFulfilled()) {
            promise._fulfill(value);
        } else {
            promise._reject(value, carriedStackTrace);
        }
    }

    if (index >= 4 && (index & 31) === 4)
        async.invokeLater(this._setLength, this, 0);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    if (index === 0) {
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._receiver0 =
        this._promise0 = undefined;
    } else {
        var base = index * 5 - 5;
        this[base + 3] =
        this[base + 4] =
        this[base + 0] =
        this[base + 1] =
        this[base + 2] = undefined;
    }
};

Promise.prototype._isSettlePromisesQueued = function () {
    return (this._bitField &
            -1073741824) === -1073741824;
};

Promise.prototype._setSettlePromisesQueued = function () {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._unsetSettlePromisesQueued = function () {
    this._bitField = this._bitField & (~-1073741824);
};

Promise.prototype._queueSettlePromises = function() {
    async.settlePromises(this);
    this._setSettlePromisesQueued();
};

Promise.prototype._fulfillUnchecked = function (value) {
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        this._queueSettlePromises();
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._setRejected();
    this._settledValue = reason;
    this._cleanValues();

    if (this._isFinal()) {
        async.throwLater(function(e) {
            if ("stack" in e) {
                async.invokeFirst(
                    CapturedTrace.unhandledRejection, undefined, e);
            }
            throw e;
        }, trace === undefined ? reason : trace);
        return;
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        this._queueSettlePromises();
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._settlePromises = function () {
    this._unsetSettlePromisesQueued();
    var len = this._length();
    for (var i = 0; i < len; i++) {
        this._settlePromiseAt(i);
    }
};


util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./progress.js")(Promise, PromiseArray);
_dereq_("./method.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_("./bind.js")(Promise, INTERNAL, tryConvertToPromise);
_dereq_("./finally.js")(Promise, NEXT_FILTER, tryConvertToPromise);
_dereq_("./direct_resolve.js")(Promise);
_dereq_("./synchronous_inspection.js")(Promise);
_dereq_("./join.js")(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
Promise.version = "2.11.0";
Promise.Promise = Promise;
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./cancel.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise);
_dereq_('./nodeify.js')(Promise);
_dereq_('./call_get.js')(Promise);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./settle.js')(Promise, PromiseArray);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./timers.js')(Promise, INTERNAL);
_dereq_('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._progressHandler0 = value;                                         
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
        p._settledValue = value;                                             
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    CapturedTrace.setBounds(async.firstLineError, util.lastLineError);       
    return Promise;                                                          

};

},{"./any.js":1,"./async.js":2,"./bind.js":3,"./call_get.js":5,"./cancel.js":6,"./captured_trace.js":7,"./catch_filter.js":8,"./context.js":9,"./debuggability.js":10,"./direct_resolve.js":11,"./each.js":12,"./errors.js":13,"./filter.js":15,"./finally.js":16,"./generators.js":17,"./join.js":18,"./map.js":19,"./method.js":20,"./nodeify.js":21,"./progress.js":22,"./promise_array.js":24,"./promise_resolver.js":25,"./promisify.js":26,"./props.js":27,"./race.js":29,"./reduce.js":30,"./settle.js":32,"./some.js":33,"./synchronous_inspection.js":34,"./thenables.js":35,"./timers.js":36,"./using.js":37,"./util.js":38}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection) {
var util = _dereq_("./util.js");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    var parent;
    if (values instanceof Promise) {
        parent = values;
        promise._propagateFrom(parent, 1 | 4);
    }
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        this._values = values;
        if (values._isFulfilled()) {
            values = values._value();
            if (!isArray(values)) {
                var err = new Promise.TypeError("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
                this.__hardReject__(err);
                return;
            }
        } else if (values._isPending()) {
            values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
            return;
        } else {
            this._reject(values._reason());
            return;
        }
    } else if (!isArray(values)) {
        this._promise._reject(apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a")._reason());
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var promise = this._promise;
    for (var i = 0; i < len; ++i) {
        var isResolved = this._isResolved();
        var maybePromise = tryConvertToPromise(values[i], promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (isResolved) {
                maybePromise._ignoreRejections();
            } else if (maybePromise._isPending()) {
                maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                this._promiseFulfilled(maybePromise._value(), i);
            } else {
                this._promiseRejected(maybePromise._reason(), i);
            }
        } else if (!isResolved) {
            this._promiseFulfilled(maybePromise, i);
        }
    }
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype.__hardReject__ =
PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false, true);
};

PromiseArray.prototype._promiseProgressed = function (progressValue, index) {
    this._promise._progress({
        index: index,
        value: progressValue
    });
};


PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

PromiseArray.prototype._promiseRejected = function (reason, index) {
    this._totalResolved++;
    this._reject(reason);
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util.js":38}],25:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors.js");
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var haveGetters = util.haveGetters;
var es5 = _dereq_("./es5.js");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise) {
    return function(err, value) {
        if (promise === null) return;

        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (arguments.length > 2) {
            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
            promise._fulfill(args);
        } else {
            promise._fulfill(value);
        }

        promise = null;
    };
}


var PromiseResolver;
if (!haveGetters) {
    PromiseResolver = function (promise) {
        this.promise = promise;
        this.asCallback = nodebackForPromise(promise);
        this.callback = this.asCallback;
    };
}
else {
    PromiseResolver = function (promise) {
        this.promise = promise;
    };
}
if (haveGetters) {
    var prop = {
        get: function() {
            return nodebackForPromise(this.promise);
        }
    };
    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
}

PromiseResolver._nodebackForPromise = nodebackForPromise;

PromiseResolver.prototype.toString = function () {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.resolve =
PromiseResolver.prototype.fulfill = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._resolveCallback(value);
};

PromiseResolver.prototype.reject = function (reason) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._rejectCallback(reason);
};

PromiseResolver.prototype.progress = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._progress(value);
};

PromiseResolver.prototype.cancel = function (err) {
    this.promise.cancel(err);
};

PromiseResolver.prototype.timeout = function () {
    this.reject(new TimeoutError("timeout"));
};

PromiseResolver.prototype.isResolved = function () {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function () {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],26:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util.js");
var nodebackForPromise = _dereq_("./promise_resolver.js")
    ._nodebackForPromise;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/iWrZbw\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";

    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL","'use strict';                            \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise);                      \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
        "
        .replace("Parameters", parameterDeclaration(newParameterCount))
        .replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode))(
            Promise,
            fn,
            receiver,
            withAppended,
            maybeWrapAsError,
            nodebackForPromise,
            util.tryCatch,
            util.errorObj,
            util.notEnumerableProp,
            INTERNAL
        );
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key, fn, suffix);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver) {
    return makeNodePromisified(callback, receiver, undefined, callback);
}

Promise.promisify = function (fn, receiver) {
    if (typeof fn !== "function") {
        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    if (isPromisified(fn)) {
        return fn;
    }
    var ret = promisify(fn, arguments.length < 2 ? THIS : receiver);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/9ITlV0\u000a");
    }
    options = Object(options);
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/8FZo5V\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier);
            promisifyAll(value, suffix, filter, promisifier);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier);
};
};


},{"./errors":13,"./promise_resolver.js":25,"./util.js":38}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var isObject = util.isObject;
var es5 = _dereq_("./es5.js");

function PropertiesPromiseArray(obj) {
    var keys = es5.keys(obj);
    var len = keys.length;
    var values = new Array(len * 2);
    for (var i = 0; i < len; ++i) {
        var key = keys[i];
        values[i] = obj[key];
        values[i + len] = key;
    }
    this.constructor$(values);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {
    this._init$(undefined, -3) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val = {};
        var keyOffset = this.length();
        for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._resolve(val);
    }
};

PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/OsFKC8\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 4);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5.js":14,"./util.js":38}],28:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],29:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var isArray = _dereq_("./util.js").isArray;

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else if (!isArray(promises)) {
        return apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 4 | 1);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util.js":38}],30:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
function ReductionPromiseArray(promises, fn, accum, _each) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._preservedValues = _each === INTERNAL ? [] : null;
    this._zerothIsAccum = (accum === undefined);
    this._gotAccum = false;
    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
    this._valuesPhase = undefined;
    var maybePromise = tryConvertToPromise(accum, this._promise);
    var rejected = false;
    var isPromise = maybePromise instanceof Promise;
    if (isPromise) {
        maybePromise = maybePromise._target();
        if (maybePromise._isPending()) {
            maybePromise._proxyPromiseArray(this, -1);
        } else if (maybePromise._isFulfilled()) {
            accum = maybePromise._value();
            this._gotAccum = true;
        } else {
            this._reject(maybePromise._reason());
            rejected = true;
        }
    }
    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._accum = accum;
    if (!rejected) async.invoke(init, this, undefined);
}
function init() {
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._init = function () {};

ReductionPromiseArray.prototype._resolveEmptyArray = function () {
    if (this._gotAccum || this._zerothIsAccum) {
        this._resolve(this._preservedValues !== null
                        ? [] : this._accum);
    }
};

ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    values[index] = value;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var isEach = preservedValues !== null;
    var gotAccum = this._gotAccum;
    var valuesPhase = this._valuesPhase;
    var valuesPhaseIndex;
    if (!valuesPhase) {
        valuesPhase = this._valuesPhase = new Array(length);
        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
            valuesPhase[valuesPhaseIndex] = 0;
        }
    }
    valuesPhaseIndex = valuesPhase[index];

    if (index === 0 && this._zerothIsAccum) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
        valuesPhase[index] = ((valuesPhaseIndex === 0)
            ? 1 : 2);
    } else if (index === -1) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
    } else {
        if (valuesPhaseIndex === 0) {
            valuesPhase[index] = 1;
        } else {
            valuesPhase[index] = 2;
            this._accum = value;
        }
    }
    if (!gotAccum) return;

    var callback = this._callback;
    var receiver = this._promise._boundValue();
    var ret;

    for (var i = this._reducingIndex; i < length; ++i) {
        valuesPhaseIndex = valuesPhase[i];
        if (valuesPhaseIndex === 2) {
            this._reducingIndex = i + 1;
            continue;
        }
        if (valuesPhaseIndex !== 1) return;
        value = values[i];
        this._promise._pushContext();
        if (isEach) {
            preservedValues.push(value);
            ret = tryCatch(callback).call(receiver, value, i, length);
        }
        else {
            ret = tryCatch(callback)
                .call(receiver, this._accum, value, i, length);
        }
        this._promise._popContext();

        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                valuesPhase[i] = 4;
                return maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }

        this._reducingIndex = i + 1;
        this._accum = ret;
    }

    this._resolve(isEach ? preservedValues : this._accum);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};
};

},{"./async.js":2,"./util.js":38}],31:[function(_dereq_,module,exports){
"use strict";
var schedule;
var util = _dereq_("./util");
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
};
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":38}],32:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util.js");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._settledValue = value;
    this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._settledValue = reason;
    this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return new SettledPromiseArray(this).promise();
};
};

},{"./util.js":38}],33:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util.js");
var RangeError = _dereq_("./errors.js").RangeError;
var AggregateError = _dereq_("./errors.js").AggregateError;
var isArray = util.isArray;


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
    }

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            e.push(this._values[i]);
        }
        this._reject(e);
    }
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/1wAmHx\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors.js":13,"./util.js":38}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValue = promise._settledValue;
    }
    else {
        this._bitField = 0;
        this._settledValue = undefined;
    }
}

PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.isFulfilled =
Promise.prototype._isFulfilled = function () {
    return (this._bitField & 268435456) > 0;
};

PromiseInspection.prototype.isRejected =
Promise.prototype._isRejected = function () {
    return (this._bitField & 134217728) > 0;
};

PromiseInspection.prototype.isPending =
Promise.prototype._isPending = function () {
    return (this._bitField & 402653184) === 0;
};

PromiseInspection.prototype.isResolved =
Promise.prototype._isResolved = function () {
    return (this._bitField & 402653184) > 0;
};

Promise.prototype.isPending = function() {
    return this._target()._isPending();
};

Promise.prototype.isRejected = function() {
    return this._target()._isRejected();
};

Promise.prototype.isFulfilled = function() {
    return this._target()._isFulfilled();
};

Promise.prototype.isResolved = function() {
    return this._target()._isResolved();
};

Promise.prototype._value = function() {
    return this._settledValue;
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue;
};

Promise.prototype.value = function() {
    var target = this._target();
    if (!target.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return target._settledValue;
};

Promise.prototype.reason = function() {
    var target = this._target();
    if (!target.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    target._unsetRejectionIsUnhandled();
    return target._settledValue;
};


Promise.PromiseInspection = PromiseInspection;
};

},{}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) {
            return obj;
        }
        else if (isAnyBluebirdPromise(obj)) {
            var ret = new Promise(INTERNAL);
            obj._then(
                ret._fulfillUnchecked,
                ret._rejectUncheckedCheckError,
                ret._progressUnchecked,
                ret,
                null
            );
            return ret;
        }
        var then = util.tryCatch(getThen)(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function getThen(obj) {
    return obj.then;
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x,
                                        resolveFromThenable,
                                        rejectFromThenable,
                                        progressFromThenable);
    synchronous = false;
    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolveFromThenable(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function rejectFromThenable(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }

    function progressFromThenable(value) {
        if (!promise) return;
        if (typeof promise._progress === "function") {
            promise._progress(value);
        }
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util.js":38}],36:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message) {
    if (!promise.isPending()) return;
    
    var err;
    if(!util.isPrimitive(message) && (message instanceof Error)) {
        err = message;
    } else {
        if (typeof message !== "string") {
            message = "operation timed out";
        }
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._cancel(err);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (value, ms) {
    if (ms === undefined) {
        ms = value;
        value = undefined;
        var ret = new Promise(INTERNAL);
        setTimeout(function() { ret._fulfill(); }, ms);
        return ret;
    }
    ms = +ms;
    return Promise.resolve(value)._then(afterValue, null, null, ms, undefined);
};

Promise.prototype.delay = function (ms) {
    return delay(this, ms);
};

function successClear(value) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret = this.then().cancellable();
    ret._cancellationParent = this;
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message);
    }, ms);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};

},{"./util.js":38}],37:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext) {
    var TypeError = _dereq_("./errors.js").TypeError;
    var inherits = _dereq_("./util.js").inherits;
    var PromiseInspection = Promise.PromiseInspection;

    function inspectionMapper(inspections) {
        var len = inspections.length;
        for (var i = 0; i < len; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
                return Promise.reject(inspection.error());
            }
            inspections[i] = inspection._settledValue;
        }
        return inspections;
    }

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = Promise.defer();
        function iterator() {
            if (i >= len) return ret.resolve();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret.promise;
    }

    function disposerSuccess(value) {
        var inspection = new PromiseInspection();
        inspection._settledValue = value;
        inspection._bitField = 268435456;
        return dispose(this, inspection).thenReturn(value);
    }

    function disposerFail(reason) {
        var inspection = new PromiseInspection();
        inspection._settledValue = reason;
        inspection._bitField = 134217728;
        return dispose(this, inspection).thenThrow(reason);
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new Array(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var promise = Promise.settle(resources)
            .then(inspectionMapper)
            .then(function(vals) {
                promise._pushContext();
                var ret;
                try {
                    ret = spreadArgs
                        ? fn.apply(undefined, vals) : fn.call(undefined,  vals);
                } finally {
                    promise._popContext();
                }
                return ret;
            })
            ._then(
                disposerSuccess, disposerFail, undefined, resources, undefined);
        resources.promise = promise;
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 262144;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 262144) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~262144);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors.js":13,"./util.js":38}],38:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var canEvaluate = typeof navigator == "undefined";
var haveGetters = (function(){
    try {
        var o = {};
        es5.defineProperty(o, "f", {
            get: function () {
                return 3;
            }
        });
        return o.f === 3;
    }
    catch (e) {
        return false;
    }

})();

var errorObj = {e: {}};
var tryCatchTarget;
function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return !isPrimitive(value);
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function f() {}
    f.prototype = obj;
    var l = 8;
    while (l--) new f();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return obj instanceof Error && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    haveGetters: haveGetters,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]"
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5.js":14}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":3}],2:[function(require,module,exports){
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.4.2 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.4.2",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        comaseparator = /\s*,\s*/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
        firstDefined = function () {
            for (var i = 0, ii = this.length; i < ii; i++) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
        lastDefined = function () {
            var i = this.length;
            while (--i) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
    /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     > Arguments

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
    \*/
        eve = function (name, scope) {
            name = String(name);
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            out.firstDefined = firstDefined;
            out.lastDefined = lastDefined;
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out;
        };
        // Undocumented. Debug only.
        eve._events = events;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     > Arguments

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f) {
        name = String(name);
        if (typeof f != "function") {
            return function () {};
        }
        var names = name.split(comaseparator);
        for (var i = 0, ii = names.length; i < ii; i++) {
            (function (name) {
                var names = name.split(separator),
                    e = events,
                    exist;
                for (var i = 0, ii = names.length; i < ii; i++) {
                    e = e.n;
                    e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
                }
                e.f = e.f || [];
                for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
                    exist = true;
                    break;
                }
                !exist && e.f.push(f);
            }(names[i]));
        }
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | });
     > Arguments
     - event (string) event name
     - varargs (…) and any other arguments
     = (function) possible event handler function
    \*/
    eve.f = function (event) {
        var attrs = [].slice.call(arguments, 1);
        return function () {
            eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
     * If no arguments specified all the events will be cleared.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f) {
        if (!name) {
            eve._events = events = {n: {}};
            return;
        }
        var names = name.split(comaseparator);
        if (names.length > 1) {
            for (var i = 0, ii = names.length; i < ii; i++) {
                eve.off(names[i], f);
            }
            return;
        }
        names = name.split(separator);
        var e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f) {
        var f2 = function () {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define === "function" && define.amd ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);

},{}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
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
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
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
        runTimeout(drainQueue);
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
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
// Snap.svg 0.4.0
// 
// Copyright (c) 2013 – 2015 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// 
// build: 2015-04-07

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.4.2 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.4.2",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        comaseparator = /\s*,\s*/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
        firstDefined = function () {
            for (var i = 0, ii = this.length; i < ii; i++) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
        lastDefined = function () {
            var i = this.length;
            while (--i) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
    /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     > Arguments

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
    \*/
        eve = function (name, scope) {
            name = String(name);
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            out.firstDefined = firstDefined;
            out.lastDefined = lastDefined;
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out;
        };
        // Undocumented. Debug only.
        eve._events = events;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     > Arguments

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f) {
        name = String(name);
        if (typeof f != "function") {
            return function () {};
        }
        var names = name.split(comaseparator);
        for (var i = 0, ii = names.length; i < ii; i++) {
            (function (name) {
                var names = name.split(separator),
                    e = events,
                    exist;
                for (var i = 0, ii = names.length; i < ii; i++) {
                    e = e.n;
                    e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
                }
                e.f = e.f || [];
                for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
                    exist = true;
                    break;
                }
                !exist && e.f.push(f);
            }(names[i]));
        }
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | });
     > Arguments
     - event (string) event name
     - varargs (…) and any other arguments
     = (function) possible event handler function
    \*/
    eve.f = function (event) {
        var attrs = [].slice.call(arguments, 1);
        return function () {
            eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
     * If no arguments specified all the events will be cleared.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f) {
        if (!name) {
            eve._events = events = {n: {}};
            return;
        }
        var names = name.split(comaseparator);
        if (names.length > 1) {
            for (var i = 0, ii = names.length; i < ii; i++) {
                eve.off(names[i], f);
            }
            return;
        }
        names = name.split(separator);
        var e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f) {
        var f2 = function () {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define === "function" && define.amd ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);

(function (glob, factory) {
    // AMD support
    if (typeof define == "function" && define.amd) {
        // Define as an anonymous module
        define(["eve"], function (eve) {
            return factory(glob, eve);
        });
    } else if (typeof exports != 'undefined') {
        // Next for Node.js or CommonJS
        var eve = require('eve');
        module.exports = factory(glob, eve);
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        factory(glob, glob.eve);
    }
}(window || this, function (window, eve) {

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var mina = (function (eve) {
    var animations = {},
    requestAnimFrame = window.requestAnimationFrame       ||
                       window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame    ||
                       window.oRequestAnimationFrame      ||
                       window.msRequestAnimationFrame     ||
                       function (callback) {
                           setTimeout(callback, 16);
                       },
    isArray = Array.isArray || function (a) {
        return a instanceof Array ||
            Object.prototype.toString.call(a) == "[object Array]";
    },
    idgen = 0,
    idprefix = "M" + (+new Date).toString(36),
    ID = function () {
        return idprefix + (idgen++).toString(36);
    },
    diff = function (a, b, A, B) {
        if (isArray(a)) {
            res = [];
            for (var i = 0, ii = a.length; i < ii; i++) {
                res[i] = diff(a[i], b, A[i], B);
            }
            return res;
        }
        var dif = (A - a) / (B - b);
        return function (bb) {
            return a + dif * (bb - b);
        };
    },
    timer = Date.now || function () {
        return +new Date;
    },
    sta = function (val) {
        var a = this;
        if (val == null) {
            return a.s;
        }
        var ds = a.s - val;
        a.b += a.dur * ds;
        a.B += a.dur * ds;
        a.s = val;
    },
    speed = function (val) {
        var a = this;
        if (val == null) {
            return a.spd;
        }
        a.spd = val;
    },
    duration = function (val) {
        var a = this;
        if (val == null) {
            return a.dur;
        }
        a.s = a.s * val / a.dur;
        a.dur = val;
    },
    stopit = function () {
        var a = this;
        delete animations[a.id];
        a.update();
        eve("mina.stop." + a.id, a);
    },
    pause = function () {
        var a = this;
        if (a.pdif) {
            return;
        }
        delete animations[a.id];
        a.update();
        a.pdif = a.get() - a.b;
    },
    resume = function () {
        var a = this;
        if (!a.pdif) {
            return;
        }
        a.b = a.get() - a.pdif;
        delete a.pdif;
        animations[a.id] = a;
    },
    update = function () {
        var a = this,
            res;
        if (isArray(a.start)) {
            res = [];
            for (var j = 0, jj = a.start.length; j < jj; j++) {
                res[j] = +a.start[j] +
                    (a.end[j] - a.start[j]) * a.easing(a.s);
            }
        } else {
            res = +a.start + (a.end - a.start) * a.easing(a.s);
        }
        a.set(res);
    },
    frame = function () {
        var len = 0;
        for (var i in animations) if (animations.hasOwnProperty(i)) {
            var a = animations[i],
                b = a.get(),
                res;
            len++;
            a.s = (b - a.b) / (a.dur / a.spd);
            if (a.s >= 1) {
                delete animations[i];
                a.s = 1;
                len--;
                (function (a) {
                    setTimeout(function () {
                        eve("mina.finish." + a.id, a);
                    });
                }(a));
            }
            a.update();
        }
        len && requestAnimFrame(frame);
    },
    /*\
     * mina
     [ method ]
     **
     * Generic animation of numbers
     **
     - a (number) start _slave_ number
     - A (number) end _slave_ number
     - b (number) start _master_ number (start time in general case)
     - B (number) end _master_ number (end time in gereal case)
     - get (function) getter of _master_ number (see @mina.time)
     - set (function) setter of _slave_ number
     - easing (function) #optional easing function, default is @mina.linear
     = (object) animation descriptor
     o {
     o         id (string) animation id,
     o         start (number) start _slave_ number,
     o         end (number) end _slave_ number,
     o         b (number) start _master_ number,
     o         s (number) animation status (0..1),
     o         dur (number) animation duration,
     o         spd (number) animation speed,
     o         get (function) getter of _master_ number (see @mina.time),
     o         set (function) setter of _slave_ number,
     o         easing (function) easing function, default is @mina.linear,
     o         status (function) status getter/setter,
     o         speed (function) speed getter/setter,
     o         duration (function) duration getter/setter,
     o         stop (function) animation stopper
     o         pause (function) pauses the animation
     o         resume (function) resumes the animation
     o         update (function) calles setter with the right value of the animation
     o }
    \*/
    mina = function (a, A, b, B, get, set, easing) {
        var anim = {
            id: ID(),
            start: a,
            end: A,
            b: b,
            s: 0,
            dur: B - b,
            spd: 1,
            get: get,
            set: set,
            easing: easing || mina.linear,
            status: sta,
            speed: speed,
            duration: duration,
            stop: stopit,
            pause: pause,
            resume: resume,
            update: update
        };
        animations[anim.id] = anim;
        var len = 0, i;
        for (i in animations) if (animations.hasOwnProperty(i)) {
            len++;
            if (len == 2) {
                break;
            }
        }
        len == 1 && requestAnimFrame(frame);
        return anim;
    };
    /*\
     * mina.time
     [ method ]
     **
     * Returns the current time. Equivalent to:
     | function () {
     |     return (new Date).getTime();
     | }
    \*/
    mina.time = timer;
    /*\
     * mina.getById
     [ method ]
     **
     * Returns an animation by its id
     - id (string) animation's id
     = (object) See @mina
    \*/
    mina.getById = function (id) {
        return animations[id] || null;
    };

    /*\
     * mina.linear
     [ method ]
     **
     * Default linear easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.linear = function (n) {
        return n;
    };
    /*\
     * mina.easeout
     [ method ]
     **
     * Easeout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easeout = function (n) {
        return Math.pow(n, 1.7);
    };
    /*\
     * mina.easein
     [ method ]
     **
     * Easein easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easein = function (n) {
        return Math.pow(n, .48);
    };
    /*\
     * mina.easeinout
     [ method ]
     **
     * Easeinout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easeinout = function (n) {
        if (n == 1) {
            return 1;
        }
        if (n == 0) {
            return 0;
        }
        var q = .48 - n / 1.04,
            Q = Math.sqrt(.1734 + q * q),
            x = Q - q,
            X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
            y = -Q - q,
            Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
            t = X + Y + .5;
        return (1 - t) * 3 * t * t + t * t * t;
    };
    /*\
     * mina.backin
     [ method ]
     **
     * Backin easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.backin = function (n) {
        if (n == 1) {
            return 1;
        }
        var s = 1.70158;
        return n * n * ((s + 1) * n - s);
    };
    /*\
     * mina.backout
     [ method ]
     **
     * Backout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.backout = function (n) {
        if (n == 0) {
            return 0;
        }
        n = n - 1;
        var s = 1.70158;
        return n * n * ((s + 1) * n + s) + 1;
    };
    /*\
     * mina.elastic
     [ method ]
     **
     * Elastic easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.elastic = function (n) {
        if (n == !!n) {
            return n;
        }
        return Math.pow(2, -10 * n) * Math.sin((n - .075) *
            (2 * Math.PI) / .3) + 1;
    };
    /*\
     * mina.bounce
     [ method ]
     **
     * Bounce easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.bounce = function (n) {
        var s = 7.5625,
            p = 2.75,
            l;
        if (n < (1 / p)) {
            l = s * n * n;
        } else {
            if (n < (2 / p)) {
                n -= (1.5 / p);
                l = s * n * n + .75;
            } else {
                if (n < (2.5 / p)) {
                    n -= (2.25 / p);
                    l = s * n * n + .9375;
                } else {
                    n -= (2.625 / p);
                    l = s * n * n + .984375;
                }
            }
        }
        return l;
    };
    window.mina = mina;
    return mina;
})(typeof eve == "undefined" ? function () {} : eve);
// Copyright (c) 2013 - 2015 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var Snap = (function(root) {
Snap.version = "0.4.0";
/*\
 * Snap
 [ method ]
 **
 * Creates a drawing surface or wraps existing SVG element.
 **
 - width (number|string) width of surface
 - height (number|string) height of surface
 * or
 - DOM (SVGElement) element to be wrapped into Snap structure
 * or
 - array (array) array of elements (will return set of elements)
 * or
 - query (string) CSS query selector
 = (object) @Element
\*/
function Snap(w, h) {
    if (w) {
        if (w.nodeType) {
            return wrap(w);
        }
        if (is(w, "array") && Snap.set) {
            return Snap.set.apply(Snap, w);
        }
        if (w instanceof Element) {
            return w;
        }
        if (h == null) {
            w = glob.doc.querySelector(String(w));
            return wrap(w);
        }
    }
    w = w == null ? "100%" : w;
    h = h == null ? "100%" : h;
    return new Paper(w, h);
}
Snap.toString = function () {
    return "Snap v" + this.version;
};
Snap._ = {};
var glob = {
    win: root.window,
    doc: root.window.document
};
Snap._.glob = glob;
var has = "hasOwnProperty",
    Str = String,
    toFloat = parseFloat,
    toInt = parseInt,
    math = Math,
    mmax = math.max,
    mmin = math.min,
    abs = math.abs,
    pow = math.pow,
    PI = math.PI,
    round = math.round,
    E = "",
    S = " ",
    objectToString = Object.prototype.toString,
    ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i,
    colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i,
    bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
    reURLValue = /^url\(#?([^)]+)\)$/,
    separator = Snap._.separator = /[,\s]+/,
    whitespace = /[\s]/g,
    commaSpaces = /[\s]*,[\s]*/,
    hsrg = {hs: 1, rg: 1},
    pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig,
    tCommand = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig,
    pathValues = /(-?\d*\.?\d*(?:e[\-+]?\\d+)?)[\s]*,?[\s]*/ig,
    idgen = 0,
    idprefix = "S" + (+new Date).toString(36),
    ID = function (el) {
        return (el && el.type ? el.type : E) + idprefix + (idgen++).toString(36);
    },
    xlink = "http://www.w3.org/1999/xlink",
    xmlns = "http://www.w3.org/2000/svg",
    hub = {},
    URL = Snap.url = function (url) {
        return "url('#" + url + "')";
    };

function $(el, attr) {
    if (attr) {
        if (el == "#text") {
            el = glob.doc.createTextNode(attr.text || attr["#text"] || "");
        }
        if (el == "#comment") {
            el = glob.doc.createComment(attr.text || attr["#text"] || "");
        }
        if (typeof el == "string") {
            el = $(el);
        }
        if (typeof attr == "string") {
            if (el.nodeType == 1) {
                if (attr.substring(0, 6) == "xlink:") {
                    return el.getAttributeNS(xlink, attr.substring(6));
                }
                if (attr.substring(0, 4) == "xml:") {
                    return el.getAttributeNS(xmlns, attr.substring(4));
                }
                return el.getAttribute(attr);
            } else if (attr == "text") {
                return el.nodeValue;
            } else {
                return null;
            }
        }
        if (el.nodeType == 1) {
            for (var key in attr) if (attr[has](key)) {
                var val = Str(attr[key]);
                if (val) {
                    if (key.substring(0, 6) == "xlink:") {
                        el.setAttributeNS(xlink, key.substring(6), val);
                    } else if (key.substring(0, 4) == "xml:") {
                        el.setAttributeNS(xmlns, key.substring(4), val);
                    } else {
                        el.setAttribute(key, val);
                    }
                } else {
                    el.removeAttribute(key);
                }
            }
        } else if ("text" in attr) {
            el.nodeValue = attr.text;
        }
    } else {
        el = glob.doc.createElementNS(xmlns, el);
    }
    return el;
}
Snap._.$ = $;
Snap._.id = ID;
function getAttrs(el) {
    var attrs = el.attributes,
        name,
        out = {};
    for (var i = 0; i < attrs.length; i++) {
        if (attrs[i].namespaceURI == xlink) {
            name = "xlink:";
        } else {
            name = "";
        }
        name += attrs[i].name;
        out[name] = attrs[i].textContent;
    }
    return out;
}
function is(o, type) {
    type = Str.prototype.toLowerCase.call(type);
    if (type == "finite") {
        return isFinite(o);
    }
    if (type == "array" &&
        (o instanceof Array || Array.isArray && Array.isArray(o))) {
        return true;
    }
    return  (type == "null" && o === null) ||
            (type == typeof o && o !== null) ||
            (type == "object" && o === Object(o)) ||
            objectToString.call(o).slice(8, -1).toLowerCase() == type;
}
/*\
 * Snap.format
 [ method ]
 **
 * Replaces construction of type `{<name>}` to the corresponding argument
 **
 - token (string) string to format
 - json (object) object which properties are used as a replacement
 = (string) formatted string
 > Usage
 | // this draws a rectangular shape equivalent to "M10,20h40v50h-40z"
 | paper.path(Snap.format("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
 |     x: 10,
 |     y: 20,
 |     dim: {
 |         width: 40,
 |         height: 50,
 |         "negative width": -40
 |     }
 | }));
\*/
Snap.format = (function () {
    var tokenRegex = /\{([^\}]+)\}/g,
        objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
        replacer = function (all, key, obj) {
            var res = obj;
            key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                name = name || quotedName;
                if (res) {
                    if (name in res) {
                        res = res[name];
                    }
                    typeof res == "function" && isFunc && (res = res());
                }
            });
            res = (res == null || res == obj ? all : res) + "";
            return res;
        };
    return function (str, obj) {
        return Str(str).replace(tokenRegex, function (all, key) {
            return replacer(all, key, obj);
        });
    };
})();
function clone(obj) {
    if (typeof obj == "function" || Object(obj) !== obj) {
        return obj;
    }
    var res = new obj.constructor;
    for (var key in obj) if (obj[has](key)) {
        res[key] = clone(obj[key]);
    }
    return res;
}
Snap._.clone = clone;
function repush(array, item) {
    for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
        return array.push(array.splice(i, 1)[0]);
    }
}
function cacher(f, scope, postprocessor) {
    function newf() {
        var arg = Array.prototype.slice.call(arguments, 0),
            args = arg.join("\u2400"),
            cache = newf.cache = newf.cache || {},
            count = newf.count = newf.count || [];
        if (cache[has](args)) {
            repush(count, args);
            return postprocessor ? postprocessor(cache[args]) : cache[args];
        }
        count.length >= 1e3 && delete cache[count.shift()];
        count.push(args);
        cache[args] = f.apply(scope, arg);
        return postprocessor ? postprocessor(cache[args]) : cache[args];
    }
    return newf;
}
Snap._.cacher = cacher;
function angle(x1, y1, x2, y2, x3, y3) {
    if (x3 == null) {
        var x = x1 - x2,
            y = y1 - y2;
        if (!x && !y) {
            return 0;
        }
        return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
    } else {
        return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
    }
}
function rad(deg) {
    return deg % 360 * PI / 180;
}
function deg(rad) {
    return rad * 180 / PI % 360;
}
function x_y() {
    return this.x + S + this.y;
}
function x_y_w_h() {
    return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
}

/*\
 * Snap.rad
 [ method ]
 **
 * Transform angle to radians
 - deg (number) angle in degrees
 = (number) angle in radians
\*/
Snap.rad = rad;
/*\
 * Snap.deg
 [ method ]
 **
 * Transform angle to degrees
 - rad (number) angle in radians
 = (number) angle in degrees
\*/
Snap.deg = deg;
/*\
 * Snap.sin
 [ method ]
 **
 * Equivalent to `Math.sin()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) sin
\*/
Snap.sin = function (angle) {
    return math.sin(Snap.rad(angle));
};
/*\
 * Snap.tan
 [ method ]
 **
 * Equivalent to `Math.tan()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) tan
\*/
Snap.tan = function (angle) {
    return math.tan(Snap.rad(angle));
};
/*\
 * Snap.cos
 [ method ]
 **
 * Equivalent to `Math.cos()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) cos
\*/
Snap.cos = function (angle) {
    return math.cos(Snap.rad(angle));
};
/*\
 * Snap.asin
 [ method ]
 **
 * Equivalent to `Math.asin()` only works with degrees, not radians.
 - num (number) value
 = (number) asin in degrees
\*/
Snap.asin = function (num) {
    return Snap.deg(math.asin(num));
};
/*\
 * Snap.acos
 [ method ]
 **
 * Equivalent to `Math.acos()` only works with degrees, not radians.
 - num (number) value
 = (number) acos in degrees
\*/
Snap.acos = function (num) {
    return Snap.deg(math.acos(num));
};
/*\
 * Snap.atan
 [ method ]
 **
 * Equivalent to `Math.atan()` only works with degrees, not radians.
 - num (number) value
 = (number) atan in degrees
\*/
Snap.atan = function (num) {
    return Snap.deg(math.atan(num));
};
/*\
 * Snap.atan2
 [ method ]
 **
 * Equivalent to `Math.atan2()` only works with degrees, not radians.
 - num (number) value
 = (number) atan2 in degrees
\*/
Snap.atan2 = function (num) {
    return Snap.deg(math.atan2(num));
};
/*\
 * Snap.angle
 [ method ]
 **
 * Returns an angle between two or three points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 - x3 (number) #optional x coord of third point
 - y3 (number) #optional y coord of third point
 = (number) angle in degrees
\*/
Snap.angle = angle;
/*\
 * Snap.len
 [ method ]
 **
 * Returns distance between two points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 = (number) distance
\*/
Snap.len = function (x1, y1, x2, y2) {
    return Math.sqrt(Snap.len2(x1, y1, x2, y2));
};
/*\
 * Snap.len2
 [ method ]
 **
 * Returns squared distance between two points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 = (number) distance
\*/
Snap.len2 = function (x1, y1, x2, y2) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
};
/*\
 * Snap.closestPoint
 [ method ]
 **
 * Returns closest point to a given one on a given path.
 > Parameters
 - path (Element) path element
 - x (number) x coord of a point
 - y (number) y coord of a point
 = (object) in format
 {
    x (number) x coord of the point on the path
    y (number) y coord of the point on the path
    length (number) length of the path to the point
    distance (number) distance from the given point to the path
 }
\*/
// Copied from http://bl.ocks.org/mbostock/8027637
Snap.closestPoint = function (path, x, y) {
    function distance2(p) {
        var dx = p.x - x,
            dy = p.y - y;
        return dx * dx + dy * dy;
    }
    var pathNode = path.node,
        pathLength = pathNode.getTotalLength(),
        precision = pathLength / pathNode.pathSegList.numberOfItems * .125,
        best,
        bestLength,
        bestDistance = Infinity;

    // linear scan for coarse approximation
    for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
        if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
            best = scan, bestLength = scanLength, bestDistance = scanDistance;
        }
    }

    // binary search for precise estimate
    precision *= .5;
    while (precision > .5) {
        var before,
            after,
            beforeLength,
            afterLength,
            beforeDistance,
            afterDistance;
        if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
            best = before, bestLength = beforeLength, bestDistance = beforeDistance;
        } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
            best = after, bestLength = afterLength, bestDistance = afterDistance;
        } else {
            precision *= .5;
        }
    }

    best = {
        x: best.x,
        y: best.y,
        length: bestLength,
        distance: Math.sqrt(bestDistance)
    };
    return best;
}
/*\
 * Snap.is
 [ method ]
 **
 * Handy replacement for the `typeof` operator
 - o (…) any object or primitive
 - type (string) name of the type, e.g., `string`, `function`, `number`, etc.
 = (boolean) `true` if given value is of given type
\*/
Snap.is = is;
/*\
 * Snap.snapTo
 [ method ]
 **
 * Snaps given value to given grid
 - values (array|number) given array of values or step of the grid
 - value (number) value to adjust
 - tolerance (number) #optional maximum distance to the target value that would trigger the snap. Default is `10`.
 = (number) adjusted value
\*/
Snap.snapTo = function (values, value, tolerance) {
    tolerance = is(tolerance, "finite") ? tolerance : 10;
    if (is(values, "array")) {
        var i = values.length;
        while (i--) if (abs(values[i] - value) <= tolerance) {
            return values[i];
        }
    } else {
        values = +values;
        var rem = value % values;
        if (rem < tolerance) {
            return value - rem;
        }
        if (rem > values - tolerance) {
            return value - rem + values;
        }
    }
    return value;
};
// Colour
/*\
 * Snap.getRGB
 [ method ]
 **
 * Parses color string as RGB object
 - color (string) color string in one of the following formats:
 # <ul>
 #     <li>Color name (<code>red</code>, <code>green</code>, <code>cornflowerblue</code>, etc)</li>
 #     <li>#••• — shortened HTML color: (<code>#000</code>, <code>#fc0</code>, etc.)</li>
 #     <li>#•••••• — full length HTML color: (<code>#000000</code>, <code>#bd2300</code>)</li>
 #     <li>rgb(•••, •••, •••) — red, green and blue channels values: (<code>rgb(200,&nbsp;100,&nbsp;0)</code>)</li>
 #     <li>rgba(•••, •••, •••, •••) — also with opacity</li>
 #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>)</li>
 #     <li>rgba(•••%, •••%, •••%, •••%) — also with opacity</li>
 #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>)</li>
 #     <li>hsba(•••, •••, •••, •••) — also with opacity</li>
 #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
 #     <li>hsba(•••%, •••%, •••%, •••%) — also with opacity</li>
 #     <li>hsl(•••, •••, •••) — hue, saturation and luminosity values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;0.5)</code>)</li>
 #     <li>hsla(•••, •••, •••, •••) — also with opacity</li>
 #     <li>hsl(•••%, •••%, •••%) — same as above, but in %</li>
 #     <li>hsla(•••%, •••%, •••%, •••%) — also with opacity</li>
 # </ul>
 * Note that `%` can be used any time: `rgb(20%, 255, 50%)`.
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••,
 o     error (boolean) true if string can't be parsed
 o }
\*/
Snap.getRGB = cacher(function (colour) {
    if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    if (colour == "none") {
        return {r: -1, g: -1, b: -1, hex: "none", toString: rgbtoString};
    }
    !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
    if (!colour) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    var res,
        red,
        green,
        blue,
        opacity,
        t,
        values,
        rgb = colour.match(colourRegExp);
    if (rgb) {
        if (rgb[2]) {
            blue = toInt(rgb[2].substring(5), 16);
            green = toInt(rgb[2].substring(3, 5), 16);
            red = toInt(rgb[2].substring(1, 3), 16);
        }
        if (rgb[3]) {
            blue = toInt((t = rgb[3].charAt(3)) + t, 16);
            green = toInt((t = rgb[3].charAt(2)) + t, 16);
            red = toInt((t = rgb[3].charAt(1)) + t, 16);
        }
        if (rgb[4]) {
            values = rgb[4].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red *= 2.55);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green *= 2.55);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue *= 2.55);
            rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
        }
        if (rgb[5]) {
            values = rgb[5].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red /= 100);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green /= 100);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue /= 100);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Snap.hsb2rgb(red, green, blue, opacity);
        }
        if (rgb[6]) {
            values = rgb[6].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red /= 100);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green /= 100);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue /= 100);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Snap.hsl2rgb(red, green, blue, opacity);
        }
        red = mmin(math.round(red), 255);
        green = mmin(math.round(green), 255);
        blue = mmin(math.round(blue), 255);
        opacity = mmin(mmax(opacity, 0), 1);
        rgb = {r: red, g: green, b: blue, toString: rgbtoString};
        rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
        rgb.opacity = is(opacity, "finite") ? opacity : 1;
        return rgb;
    }
    return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
}, Snap);
/*\
 * Snap.hsb
 [ method ]
 **
 * Converts HSB values to a hex representation of the color
 - h (number) hue
 - s (number) saturation
 - b (number) value or brightness
 = (string) hex representation of the color
\*/
Snap.hsb = cacher(function (h, s, b) {
    return Snap.hsb2rgb(h, s, b).hex;
});
/*\
 * Snap.hsl
 [ method ]
 **
 * Converts HSL values to a hex representation of the color
 - h (number) hue
 - s (number) saturation
 - l (number) luminosity
 = (string) hex representation of the color
\*/
Snap.hsl = cacher(function (h, s, l) {
    return Snap.hsl2rgb(h, s, l).hex;
});
/*\
 * Snap.rgb
 [ method ]
 **
 * Converts RGB values to a hex representation of the color
 - r (number) red
 - g (number) green
 - b (number) blue
 = (string) hex representation of the color
\*/
Snap.rgb = cacher(function (r, g, b, o) {
    if (is(o, "finite")) {
        var round = math.round;
        return "rgba(" + [round(r), round(g), round(b), +o.toFixed(2)] + ")";
    }
    return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
});
var toHex = function (color) {
    var i = glob.doc.getElementsByTagName("head")[0] || glob.doc.getElementsByTagName("svg")[0],
        red = "rgb(255, 0, 0)";
    toHex = cacher(function (color) {
        if (color.toLowerCase() == "red") {
            return red;
        }
        i.style.color = red;
        i.style.color = color;
        var out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
        return out == red ? null : out;
    });
    return toHex(color);
},
hsbtoString = function () {
    return "hsb(" + [this.h, this.s, this.b] + ")";
},
hsltoString = function () {
    return "hsl(" + [this.h, this.s, this.l] + ")";
},
rgbtoString = function () {
    return this.opacity == 1 || this.opacity == null ?
            this.hex :
            "rgba(" + [this.r, this.g, this.b, this.opacity] + ")";
},
prepareRGB = function (r, g, b) {
    if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in r) {
        b = r.b;
        g = r.g;
        r = r.r;
    }
    if (g == null && is(r, string)) {
        var clr = Snap.getRGB(r);
        r = clr.r;
        g = clr.g;
        b = clr.b;
    }
    if (r > 1 || g > 1 || b > 1) {
        r /= 255;
        g /= 255;
        b /= 255;
    }
    
    return [r, g, b];
},
packageRGB = function (r, g, b, o) {
    r = math.round(r * 255);
    g = math.round(g * 255);
    b = math.round(b * 255);
    var rgb = {
        r: r,
        g: g,
        b: b,
        opacity: is(o, "finite") ? o : 1,
        hex: Snap.rgb(r, g, b),
        toString: rgbtoString
    };
    is(o, "finite") && (rgb.opacity = o);
    return rgb;
};
/*\
 * Snap.color
 [ method ]
 **
 * Parses the color string and returns an object featuring the color's component values
 - clr (string) color string in one of the supported formats (see @Snap.getRGB)
 = (object) Combined RGB/HSB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••,
 o     error (boolean) `true` if string can't be parsed,
 o     h (number) hue,
 o     s (number) saturation,
 o     v (number) value (brightness),
 o     l (number) lightness
 o }
\*/
Snap.color = function (clr) {
    var rgb;
    if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
        rgb = Snap.hsb2rgb(clr);
        clr.r = rgb.r;
        clr.g = rgb.g;
        clr.b = rgb.b;
        clr.opacity = 1;
        clr.hex = rgb.hex;
    } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
        rgb = Snap.hsl2rgb(clr);
        clr.r = rgb.r;
        clr.g = rgb.g;
        clr.b = rgb.b;
        clr.opacity = 1;
        clr.hex = rgb.hex;
    } else {
        if (is(clr, "string")) {
            clr = Snap.getRGB(clr);
        }
        if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr && !("error" in clr)) {
            rgb = Snap.rgb2hsl(clr);
            clr.h = rgb.h;
            clr.s = rgb.s;
            clr.l = rgb.l;
            rgb = Snap.rgb2hsb(clr);
            clr.v = rgb.b;
        } else {
            clr = {hex: "none"};
            clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
            clr.error = 1;
        }
    }
    clr.toString = rgbtoString;
    return clr;
};
/*\
 * Snap.hsb2rgb
 [ method ]
 **
 * Converts HSB values to an RGB object
 - h (number) hue
 - s (number) saturation
 - v (number) value or brightness
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••
 o }
\*/
Snap.hsb2rgb = function (h, s, v, o) {
    if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
        v = h.b;
        s = h.s;
        o = h.o;
        h = h.h;
    }
    h *= 360;
    var R, G, B, X, C;
    h = (h % 360) / 60;
    C = v * s;
    X = C * (1 - abs(h % 2 - 1));
    R = G = B = v - C;

    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    return packageRGB(R, G, B, o);
};
/*\
 * Snap.hsl2rgb
 [ method ]
 **
 * Converts HSL values to an RGB object
 - h (number) hue
 - s (number) saturation
 - l (number) luminosity
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••
 o }
\*/
Snap.hsl2rgb = function (h, s, l, o) {
    if (is(h, "object") && "h" in h && "s" in h && "l" in h) {
        l = h.l;
        s = h.s;
        h = h.h;
    }
    if (h > 1 || s > 1 || l > 1) {
        h /= 360;
        s /= 100;
        l /= 100;
    }
    h *= 360;
    var R, G, B, X, C;
    h = (h % 360) / 60;
    C = 2 * s * (l < .5 ? l : 1 - l);
    X = C * (1 - abs(h % 2 - 1));
    R = G = B = l - C / 2;

    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    return packageRGB(R, G, B, o);
};
/*\
 * Snap.rgb2hsb
 [ method ]
 **
 * Converts RGB values to an HSB object
 - r (number) red
 - g (number) green
 - b (number) blue
 = (object) HSB object in the following format:
 o {
 o     h (number) hue,
 o     s (number) saturation,
 o     b (number) brightness
 o }
\*/
Snap.rgb2hsb = function (r, g, b) {
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    var H, S, V, C;
    V = mmax(r, g, b);
    C = V - mmin(r, g, b);
    H = (C == 0 ? null :
         V == r ? (g - b) / C :
         V == g ? (b - r) / C + 2 :
                  (r - g) / C + 4
        );
    H = ((H + 360) % 6) * 60 / 360;
    S = C == 0 ? 0 : C / V;
    return {h: H, s: S, b: V, toString: hsbtoString};
};
/*\
 * Snap.rgb2hsl
 [ method ]
 **
 * Converts RGB values to an HSL object
 - r (number) red
 - g (number) green
 - b (number) blue
 = (object) HSL object in the following format:
 o {
 o     h (number) hue,
 o     s (number) saturation,
 o     l (number) luminosity
 o }
\*/
Snap.rgb2hsl = function (r, g, b) {
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    var H, S, L, M, m, C;
    M = mmax(r, g, b);
    m = mmin(r, g, b);
    C = M - m;
    H = (C == 0 ? null :
         M == r ? (g - b) / C :
         M == g ? (b - r) / C + 2 :
                  (r - g) / C + 4);
    H = ((H + 360) % 6) * 60 / 360;
    L = (M + m) / 2;
    S = (C == 0 ? 0 :
         L < .5 ? C / (2 * L) :
                  C / (2 - 2 * L));
    return {h: H, s: S, l: L, toString: hsltoString};
};

// Transformations
/*\
 * Snap.parsePathString
 [ method ]
 **
 * Utility method
 **
 * Parses given path string into an array of arrays of path segments
 - pathString (string|array) path string or array of segments (in the last case it is returned straight away)
 = (array) array of segments
\*/
Snap.parsePathString = function (pathString) {
    if (!pathString) {
        return null;
    }
    var pth = Snap.path(pathString);
    if (pth.arr) {
        return Snap.path.clone(pth.arr);
    }
    
    var paramCounts = {a: 7, c: 6, o: 2, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, u: 3, z: 0},
        data = [];
    if (is(pathString, "array") && is(pathString[0], "array")) { // rough assumption
        data = Snap.path.clone(pathString);
    }
    if (!data.length) {
        Str(pathString).replace(pathCommand, function (a, b, c) {
            var params = [],
                name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
                b && params.push(+b);
            });
            if (name == "m" && params.length > 2) {
                data.push([b].concat(params.splice(0, 2)));
                name = "l";
                b = b == "m" ? "l" : "L";
            }
            if (name == "o" && params.length == 1) {
                data.push([b, params[0]]);
            }
            if (name == "r") {
                data.push([b].concat(params));
            } else while (params.length >= paramCounts[name]) {
                data.push([b].concat(params.splice(0, paramCounts[name])));
                if (!paramCounts[name]) {
                    break;
                }
            }
        });
    }
    data.toString = Snap.path.toString;
    pth.arr = Snap.path.clone(data);
    return data;
};
/*\
 * Snap.parseTransformString
 [ method ]
 **
 * Utility method
 **
 * Parses given transform string into an array of transformations
 - TString (string|array) transform string or array of transformations (in the last case it is returned straight away)
 = (array) array of transformations
\*/
var parseTransformString = Snap.parseTransformString = function (TString) {
    if (!TString) {
        return null;
    }
    var paramCounts = {r: 3, s: 4, t: 2, m: 6},
        data = [];
    if (is(TString, "array") && is(TString[0], "array")) { // rough assumption
        data = Snap.path.clone(TString);
    }
    if (!data.length) {
        Str(TString).replace(tCommand, function (a, b, c) {
            var params = [],
                name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
                b && params.push(+b);
            });
            data.push([b].concat(params));
        });
    }
    data.toString = Snap.path.toString;
    return data;
};
function svgTransform2string(tstr) {
    var res = [];
    tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, function (all, name, params) {
        params = params.split(/\s*,\s*|\s+/);
        if (name == "rotate" && params.length == 1) {
            params.push(0, 0);
        }
        if (name == "scale") {
            if (params.length > 2) {
                params = params.slice(0, 2);
            } else if (params.length == 2) {
                params.push(0, 0);
            }
            if (params.length == 1) {
                params.push(params[0], 0, 0);
            }
        }
        if (name == "skewX") {
            res.push(["m", 1, 0, math.tan(rad(params[0])), 1, 0, 0]);
        } else if (name == "skewY") {
            res.push(["m", 1, math.tan(rad(params[0])), 0, 1, 0, 0]);
        } else {
            res.push([name.charAt(0)].concat(params));
        }
        return all;
    });
    return res;
}
Snap._.svgTransform2string = svgTransform2string;
Snap._.rgTransform = /^[a-z][\s]*-?\.?\d/i;
function transform2matrix(tstr, bbox) {
    var tdata = parseTransformString(tstr),
        m = new Snap.Matrix;
    if (tdata) {
        for (var i = 0, ii = tdata.length; i < ii; i++) {
            var t = tdata[i],
                tlen = t.length,
                command = Str(t[0]).toLowerCase(),
                absolute = t[0] != command,
                inver = absolute ? m.invert() : 0,
                x1,
                y1,
                x2,
                y2,
                bb;
            if (command == "t" && tlen == 2){
                m.translate(t[1], 0);
            } else if (command == "t" && tlen == 3) {
                if (absolute) {
                    x1 = inver.x(0, 0);
                    y1 = inver.y(0, 0);
                    x2 = inver.x(t[1], t[2]);
                    y2 = inver.y(t[1], t[2]);
                    m.translate(x2 - x1, y2 - y1);
                } else {
                    m.translate(t[1], t[2]);
                }
            } else if (command == "r") {
                if (tlen == 2) {
                    bb = bb || bbox;
                    m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                } else if (tlen == 4) {
                    if (absolute) {
                        x2 = inver.x(t[2], t[3]);
                        y2 = inver.y(t[2], t[3]);
                        m.rotate(t[1], x2, y2);
                    } else {
                        m.rotate(t[1], t[2], t[3]);
                    }
                }
            } else if (command == "s") {
                if (tlen == 2 || tlen == 3) {
                    bb = bb || bbox;
                    m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                } else if (tlen == 4) {
                    if (absolute) {
                        x2 = inver.x(t[2], t[3]);
                        y2 = inver.y(t[2], t[3]);
                        m.scale(t[1], t[1], x2, y2);
                    } else {
                        m.scale(t[1], t[1], t[2], t[3]);
                    }
                } else if (tlen == 5) {
                    if (absolute) {
                        x2 = inver.x(t[3], t[4]);
                        y2 = inver.y(t[3], t[4]);
                        m.scale(t[1], t[2], x2, y2);
                    } else {
                        m.scale(t[1], t[2], t[3], t[4]);
                    }
                }
            } else if (command == "m" && tlen == 7) {
                m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
            }
        }
    }
    return m;
}
Snap._.transform2matrix = transform2matrix;
Snap._unit2px = unit2px;
var contains = glob.doc.contains || glob.doc.compareDocumentPosition ?
    function (a, b) {
        var adown = a.nodeType == 9 ? a.documentElement : a,
            bup = b && b.parentNode;
            return a == bup || !!(bup && bup.nodeType == 1 && (
                adown.contains ?
                    adown.contains(bup) :
                    a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
            ));
    } :
    function (a, b) {
        if (b) {
            while (b) {
                b = b.parentNode;
                if (b == a) {
                    return true;
                }
            }
        }
        return false;
    };
function getSomeDefs(el) {
    var p = (el.node.ownerSVGElement && wrap(el.node.ownerSVGElement)) ||
            (el.node.parentNode && wrap(el.node.parentNode)) ||
            Snap.select("svg") ||
            Snap(0, 0),
        pdefs = p.select("defs"),
        defs  = pdefs == null ? false : pdefs.node;
    if (!defs) {
        defs = make("defs", p.node).node;
    }
    return defs;
}
function getSomeSVG(el) {
    return el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) || Snap.select("svg");
}
Snap._.getSomeDefs = getSomeDefs;
Snap._.getSomeSVG = getSomeSVG;
function unit2px(el, name, value) {
    var svg = getSomeSVG(el).node,
        out = {},
        mgr = svg.querySelector(".svg---mgr");
    if (!mgr) {
        mgr = $("rect");
        $(mgr, {x: -9e9, y: -9e9, width: 10, height: 10, "class": "svg---mgr", fill: "none"});
        svg.appendChild(mgr);
    }
    function getW(val) {
        if (val == null) {
            return E;
        }
        if (val == +val) {
            return val;
        }
        $(mgr, {width: val});
        try {
            return mgr.getBBox().width;
        } catch (e) {
            return 0;
        }
    }
    function getH(val) {
        if (val == null) {
            return E;
        }
        if (val == +val) {
            return val;
        }
        $(mgr, {height: val});
        try {
            return mgr.getBBox().height;
        } catch (e) {
            return 0;
        }
    }
    function set(nam, f) {
        if (name == null) {
            out[nam] = f(el.attr(nam) || 0);
        } else if (nam == name) {
            out = f(value == null ? el.attr(nam) || 0 : value);
        }
    }
    switch (el.type) {
        case "rect":
            set("rx", getW);
            set("ry", getH);
        case "image":
            set("width", getW);
            set("height", getH);
        case "text":
            set("x", getW);
            set("y", getH);
        break;
        case "circle":
            set("cx", getW);
            set("cy", getH);
            set("r", getW);
        break;
        case "ellipse":
            set("cx", getW);
            set("cy", getH);
            set("rx", getW);
            set("ry", getH);
        break;
        case "line":
            set("x1", getW);
            set("x2", getW);
            set("y1", getH);
            set("y2", getH);
        break;
        case "marker":
            set("refX", getW);
            set("markerWidth", getW);
            set("refY", getH);
            set("markerHeight", getH);
        break;
        case "radialGradient":
            set("fx", getW);
            set("fy", getH);
        break;
        case "tspan":
            set("dx", getW);
            set("dy", getH);
        break;
        default:
            set(name, getW);
    }
    svg.removeChild(mgr);
    return out;
}
/*\
 * Snap.select
 [ method ]
 **
 * Wraps a DOM element specified by CSS selector as @Element
 - query (string) CSS selector of the element
 = (Element) the current element
\*/
Snap.select = function (query) {
    query = Str(query).replace(/([^\\]):/g, "$1\\:");
    return wrap(glob.doc.querySelector(query));
};
/*\
 * Snap.selectAll
 [ method ]
 **
 * Wraps DOM elements specified by CSS selector as set or array of @Element
 - query (string) CSS selector of the element
 = (Element) the current element
\*/
Snap.selectAll = function (query) {
    var nodelist = glob.doc.querySelectorAll(query),
        set = (Snap.set || Array)();
    for (var i = 0; i < nodelist.length; i++) {
        set.push(wrap(nodelist[i]));
    }
    return set;
};

function add2group(list) {
    if (!is(list, "array")) {
        list = Array.prototype.slice.call(arguments, 0);
    }
    var i = 0,
        j = 0,
        node = this.node;
    while (this[i]) delete this[i++];
    for (i = 0; i < list.length; i++) {
        if (list[i].type == "set") {
            list[i].forEach(function (el) {
                node.appendChild(el.node);
            });
        } else {
            node.appendChild(list[i].node);
        }
    }
    var children = node.childNodes;
    for (i = 0; i < children.length; i++) {
        this[j++] = wrap(children[i]);
    }
    return this;
}
// Hub garbage collector every 10s
setInterval(function () {
    for (var key in hub) if (hub[has](key)) {
        var el = hub[key],
            node = el.node;
        if (el.type != "svg" && !node.ownerSVGElement || el.type == "svg" && (!node.parentNode || "ownerSVGElement" in node.parentNode && !node.ownerSVGElement)) {
            delete hub[key];
        }
    }
}, 1e4);
function Element(el) {
    if (el.snap in hub) {
        return hub[el.snap];
    }
    var svg;
    try {
        svg = el.ownerSVGElement;
    } catch(e) {}
    /*\
     * Element.node
     [ property (object) ]
     **
     * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
     > Usage
     | // draw a circle at coordinate 10,10 with radius of 10
     | var c = paper.circle(10, 10, 10);
     | c.node.onclick = function () {
     |     c.attr("fill", "red");
     | };
    \*/
    this.node = el;
    if (svg) {
        this.paper = new Paper(svg);
    }
    /*\
     * Element.type
     [ property (string) ]
     **
     * SVG tag name of the given element.
    \*/
    this.type = el.tagName || el.nodeName;
    var id = this.id = ID(this);
    this.anims = {};
    this._ = {
        transform: []
    };
    el.snap = id;
    hub[id] = this;
    if (this.type == "g") {
        this.add = add2group;
    }
    if (this.type in {g: 1, mask: 1, pattern: 1, symbol: 1}) {
        for (var method in Paper.prototype) if (Paper.prototype[has](method)) {
            this[method] = Paper.prototype[method];
        }
    }
}
   /*\
     * Element.attr
     [ method ]
     **
     * Gets or sets given attributes of the element.
     **
     - params (object) contains key-value pairs of attributes you want to set
     * or
     - param (string) name of the attribute
     = (Element) the current element
     * or
     = (string) value of attribute
     > Usage
     | el.attr({
     |     fill: "#fc0",
     |     stroke: "#000",
     |     strokeWidth: 2, // CamelCase...
     |     "fill-opacity": 0.5, // or dash-separated names
     |     width: "*=2" // prefixed values
     | });
     | console.log(el.attr("fill")); // #fc0
     * Prefixed values in format `"+=10"` supported. All four operations
     * (`+`, `-`, `*` and `/`) could be used. Optionally you can use units for `+`
     * and `-`: `"+=2em"`.
    \*/
    Element.prototype.attr = function (params, value) {
        var el = this,
            node = el.node;
        if (!params) {
            if (node.nodeType != 1) {
                return {
                    text: node.nodeValue
                };
            }
            var attr = node.attributes,
                out = {};
            for (var i = 0, ii = attr.length; i < ii; i++) {
                out[attr[i].nodeName] = attr[i].nodeValue;
            }
            return out;
        }
        if (is(params, "string")) {
            if (arguments.length > 1) {
                var json = {};
                json[params] = value;
                params = json;
            } else {
                return eve("snap.util.getattr." + params, el).firstDefined();
            }
        }
        for (var att in params) {
            if (params[has](att)) {
                eve("snap.util.attr." + att, el, params[att]);
            }
        }
        return el;
    };
/*\
 * Snap.parse
 [ method ]
 **
 * Parses SVG fragment and converts it into a @Fragment
 **
 - svg (string) SVG string
 = (Fragment) the @Fragment
\*/
Snap.parse = function (svg) {
    var f = glob.doc.createDocumentFragment(),
        full = true,
        div = glob.doc.createElement("div");
    svg = Str(svg);
    if (!svg.match(/^\s*<\s*svg(?:\s|>)/)) {
        svg = "<svg>" + svg + "</svg>";
        full = false;
    }
    div.innerHTML = svg;
    svg = div.getElementsByTagName("svg")[0];
    if (svg) {
        if (full) {
            f = svg;
        } else {
            while (svg.firstChild) {
                f.appendChild(svg.firstChild);
            }
        }
    }
    return new Fragment(f);
};
function Fragment(frag) {
    this.node = frag;
}
/*\
 * Snap.fragment
 [ method ]
 **
 * Creates a DOM fragment from a given list of elements or strings
 **
 - varargs (…) SVG string
 = (Fragment) the @Fragment
\*/
Snap.fragment = function () {
    var args = Array.prototype.slice.call(arguments, 0),
        f = glob.doc.createDocumentFragment();
    for (var i = 0, ii = args.length; i < ii; i++) {
        var item = args[i];
        if (item.node && item.node.nodeType) {
            f.appendChild(item.node);
        }
        if (item.nodeType) {
            f.appendChild(item);
        }
        if (typeof item == "string") {
            f.appendChild(Snap.parse(item).node);
        }
    }
    return new Fragment(f);
};

function make(name, parent) {
    var res = $(name);
    parent.appendChild(res);
    var el = wrap(res);
    return el;
}
function Paper(w, h) {
    var res,
        desc,
        defs,
        proto = Paper.prototype;
    if (w && w.tagName == "svg") {
        if (w.snap in hub) {
            return hub[w.snap];
        }
        var doc = w.ownerDocument;
        res = new Element(w);
        desc = w.getElementsByTagName("desc")[0];
        defs = w.getElementsByTagName("defs")[0];
        if (!desc) {
            desc = $("desc");
            desc.appendChild(doc.createTextNode("Created with Snap"));
            res.node.appendChild(desc);
        }
        if (!defs) {
            defs = $("defs");
            res.node.appendChild(defs);
        }
        res.defs = defs;
        for (var key in proto) if (proto[has](key)) {
            res[key] = proto[key];
        }
        res.paper = res.root = res;
    } else {
        res = make("svg", glob.doc.body);
        $(res.node, {
            height: h,
            version: 1.1,
            width: w,
            xmlns: xmlns
        });
    }
    return res;
}
function wrap(dom) {
    if (!dom) {
        return dom;
    }
    if (dom instanceof Element || dom instanceof Fragment) {
        return dom;
    }
    if (dom.tagName && dom.tagName.toLowerCase() == "svg") {
        return new Paper(dom);
    }
    if (dom.tagName && dom.tagName.toLowerCase() == "object" && dom.type == "image/svg+xml") {
        return new Paper(dom.contentDocument.getElementsByTagName("svg")[0]);
    }
    return new Element(dom);
}

Snap._.make = make;
Snap._.wrap = wrap;
/*\
 * Paper.el
 [ method ]
 **
 * Creates an element on paper with a given name and no attributes
 **
 - name (string) tag name
 - attr (object) attributes
 = (Element) the current element
 > Usage
 | var c = paper.circle(10, 10, 10); // is the same as...
 | var c = paper.el("circle").attr({
 |     cx: 10,
 |     cy: 10,
 |     r: 10
 | });
 | // and the same as
 | var c = paper.el("circle", {
 |     cx: 10,
 |     cy: 10,
 |     r: 10
 | });
\*/
Paper.prototype.el = function (name, attr) {
    var el = make(name, this.node);
    attr && el.attr(attr);
    return el;
};
/*\
 * Element.children
 [ method ]
 **
 * Returns array of all the children of the element.
 = (array) array of Elements
\*/
Element.prototype.children = function () {
    var out = [],
        ch = this.node.childNodes;
    for (var i = 0, ii = ch.length; i < ii; i++) {
        out[i] = Snap(ch[i]);
    }
    return out;
};
function jsonFiller(root, o) {
    for (var i = 0, ii = root.length; i < ii; i++) {
        var item = {
                type: root[i].type,
                attr: root[i].attr()
            },
            children = root[i].children();
        o.push(item);
        if (children.length) {
            jsonFiller(children, item.childNodes = []);
        }
    }
}
/*\
 * Element.toJSON
 [ method ]
 **
 * Returns object representation of the given element and all its children.
 = (object) in format
 o {
 o     type (string) this.type,
 o     attr (object) attributes map,
 o     childNodes (array) optional array of children in the same format
 o }
\*/
Element.prototype.toJSON = function () {
    var out = [];
    jsonFiller([this], out);
    return out[0];
};
// default
eve.on("snap.util.getattr", function () {
    var att = eve.nt();
    att = att.substring(att.lastIndexOf(".") + 1);
    var css = att.replace(/[A-Z]/g, function (letter) {
        return "-" + letter.toLowerCase();
    });
    if (cssAttr[has](css)) {
        return this.node.ownerDocument.defaultView.getComputedStyle(this.node, null).getPropertyValue(css);
    } else {
        return $(this.node, att);
    }
});
var cssAttr = {
    "alignment-baseline": 0,
    "baseline-shift": 0,
    "clip": 0,
    "clip-path": 0,
    "clip-rule": 0,
    "color": 0,
    "color-interpolation": 0,
    "color-interpolation-filters": 0,
    "color-profile": 0,
    "color-rendering": 0,
    "cursor": 0,
    "direction": 0,
    "display": 0,
    "dominant-baseline": 0,
    "enable-background": 0,
    "fill": 0,
    "fill-opacity": 0,
    "fill-rule": 0,
    "filter": 0,
    "flood-color": 0,
    "flood-opacity": 0,
    "font": 0,
    "font-family": 0,
    "font-size": 0,
    "font-size-adjust": 0,
    "font-stretch": 0,
    "font-style": 0,
    "font-variant": 0,
    "font-weight": 0,
    "glyph-orientation-horizontal": 0,
    "glyph-orientation-vertical": 0,
    "image-rendering": 0,
    "kerning": 0,
    "letter-spacing": 0,
    "lighting-color": 0,
    "marker": 0,
    "marker-end": 0,
    "marker-mid": 0,
    "marker-start": 0,
    "mask": 0,
    "opacity": 0,
    "overflow": 0,
    "pointer-events": 0,
    "shape-rendering": 0,
    "stop-color": 0,
    "stop-opacity": 0,
    "stroke": 0,
    "stroke-dasharray": 0,
    "stroke-dashoffset": 0,
    "stroke-linecap": 0,
    "stroke-linejoin": 0,
    "stroke-miterlimit": 0,
    "stroke-opacity": 0,
    "stroke-width": 0,
    "text-anchor": 0,
    "text-decoration": 0,
    "text-rendering": 0,
    "unicode-bidi": 0,
    "visibility": 0,
    "word-spacing": 0,
    "writing-mode": 0
};

eve.on("snap.util.attr", function (value) {
    var att = eve.nt(),
        attr = {};
    att = att.substring(att.lastIndexOf(".") + 1);
    attr[att] = value;
    var style = att.replace(/-(\w)/gi, function (all, letter) {
            return letter.toUpperCase();
        }),
        css = att.replace(/[A-Z]/g, function (letter) {
            return "-" + letter.toLowerCase();
        });
    if (cssAttr[has](css)) {
        this.node.style[style] = value == null ? E : value;
    } else {
        $(this.node, attr);
    }
});
(function (proto) {}(Paper.prototype));

// simple ajax
/*\
 * Snap.ajax
 [ method ]
 **
 * Simple implementation of Ajax
 **
 - url (string) URL
 - postData (object|string) data for post request
 - callback (function) callback
 - scope (object) #optional scope of callback
 * or
 - url (string) URL
 - callback (function) callback
 - scope (object) #optional scope of callback
 = (XMLHttpRequest) the XMLHttpRequest object, just in case
\*/
Snap.ajax = function (url, postData, callback, scope){
    var req = new XMLHttpRequest,
        id = ID();
    if (req) {
        if (is(postData, "function")) {
            scope = callback;
            callback = postData;
            postData = null;
        } else if (is(postData, "object")) {
            var pd = [];
            for (var key in postData) if (postData.hasOwnProperty(key)) {
                pd.push(encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]));
            }
            postData = pd.join("&");
        }
        req.open((postData ? "POST" : "GET"), url, true);
        if (postData) {
            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        if (callback) {
            eve.once("snap.ajax." + id + ".0", callback);
            eve.once("snap.ajax." + id + ".200", callback);
            eve.once("snap.ajax." + id + ".304", callback);
        }
        req.onreadystatechange = function() {
            if (req.readyState != 4) return;
            eve("snap.ajax." + id + "." + req.status, scope, req);
        };
        if (req.readyState == 4) {
            return req;
        }
        req.send(postData);
        return req;
    }
};
/*\
 * Snap.load
 [ method ]
 **
 * Loads external SVG file as a @Fragment (see @Snap.ajax for more advanced AJAX)
 **
 - url (string) URL
 - callback (function) callback
 - scope (object) #optional scope of callback
\*/
Snap.load = function (url, callback, scope) {
    Snap.ajax(url, function (req) {
        var f = Snap.parse(req.responseText);
        scope ? callback.call(scope, f) : callback(f);
    });
};
var getOffset = function (elem) {
    var box = elem.getBoundingClientRect(),
        doc = elem.ownerDocument,
        body = doc.body,
        docElem = doc.documentElement,
        clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
        top  = box.top  + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop ) - clientTop,
        left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
    return {
        y: top,
        x: left
    };
};
/*\
 * Snap.getElementByPoint
 [ method ]
 **
 * Returns you topmost element under given point.
 **
 = (object) Snap element object
 - x (number) x coordinate from the top left corner of the window
 - y (number) y coordinate from the top left corner of the window
 > Usage
 | Snap.getElementByPoint(mouseX, mouseY).attr({stroke: "#f00"});
\*/
Snap.getElementByPoint = function (x, y) {
    var paper = this,
        svg = paper.canvas,
        target = glob.doc.elementFromPoint(x, y);
    if (glob.win.opera && target.tagName == "svg") {
        var so = getOffset(target),
            sr = target.createSVGRect();
        sr.x = x - so.x;
        sr.y = y - so.y;
        sr.width = sr.height = 1;
        var hits = target.getIntersectionList(sr, null);
        if (hits.length) {
            target = hits[hits.length - 1];
        }
    }
    if (!target) {
        return null;
    }
    return wrap(target);
};
/*\
 * Snap.plugin
 [ method ]
 **
 * Let you write plugins. You pass in a function with five arguments, like this:
 | Snap.plugin(function (Snap, Element, Paper, global, Fragment) {
 |     Snap.newmethod = function () {};
 |     Element.prototype.newmethod = function () {};
 |     Paper.prototype.newmethod = function () {};
 | });
 * Inside the function you have access to all main objects (and their
 * prototypes). This allow you to extend anything you want.
 **
 - f (function) your plugin body
\*/
Snap.plugin = function (f) {
    f(Snap, Element, Paper, glob, Fragment);
};
glob.win.Snap = Snap;
return Snap;
}(window || this));

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var elproto = Element.prototype,
        is = Snap.is,
        Str = String,
        unit2px = Snap._unit2px,
        $ = Snap._.$,
        make = Snap._.make,
        getSomeDefs = Snap._.getSomeDefs,
        has = "hasOwnProperty",
        wrap = Snap._.wrap;
    /*\
     * Element.getBBox
     [ method ]
     **
     * Returns the bounding box descriptor for the given element
     **
     = (object) bounding box descriptor:
     o {
     o     cx: (number) x of the center,
     o     cy: (number) x of the center,
     o     h: (number) height,
     o     height: (number) height,
     o     path: (string) path command for the box,
     o     r0: (number) radius of a circle that fully encloses the box,
     o     r1: (number) radius of the smallest circle that can be enclosed,
     o     r2: (number) radius of the largest circle that can be enclosed,
     o     vb: (string) box as a viewbox command,
     o     w: (number) width,
     o     width: (number) width,
     o     x2: (number) x of the right side,
     o     x: (number) x of the left side,
     o     y2: (number) y of the bottom edge,
     o     y: (number) y of the top edge
     o }
    \*/
    elproto.getBBox = function (isWithoutTransform) {
        if (!Snap.Matrix || !Snap.path) {
            return this.node.getBBox();
        }
        var el = this,
            m = new Snap.Matrix;
        if (el.removed) {
            return Snap._.box();
        }
        while (el.type == "use") {
            if (!isWithoutTransform) {
                m = m.add(el.transform().localMatrix.translate(el.attr("x") || 0, el.attr("y") || 0));
            }
            if (el.original) {
                el = el.original;
            } else {
                var href = el.attr("xlink:href");
                el = el.original = el.node.ownerDocument.getElementById(href.substring(href.indexOf("#") + 1));
            }
        }
        var _ = el._,
            pathfinder = Snap.path.get[el.type] || Snap.path.get.deflt;
        try {
            if (isWithoutTransform) {
                _.bboxwt = pathfinder ? Snap.path.getBBox(el.realPath = pathfinder(el)) : Snap._.box(el.node.getBBox());
                return Snap._.box(_.bboxwt);
            } else {
                el.realPath = pathfinder(el);
                el.matrix = el.transform().localMatrix;
                _.bbox = Snap.path.getBBox(Snap.path.map(el.realPath, m.add(el.matrix)));
                return Snap._.box(_.bbox);
            }
        } catch (e) {
            // Firefox doesn’t give you bbox of hidden element
            return Snap._.box();
        }
    };
    var propString = function () {
        return this.string;
    };
    function extractTransform(el, tstr) {
        if (tstr == null) {
            var doReturn = true;
            if (el.type == "linearGradient" || el.type == "radialGradient") {
                tstr = el.node.getAttribute("gradientTransform");
            } else if (el.type == "pattern") {
                tstr = el.node.getAttribute("patternTransform");
            } else {
                tstr = el.node.getAttribute("transform");
            }
            if (!tstr) {
                return new Snap.Matrix;
            }
            tstr = Snap._.svgTransform2string(tstr);
        } else {
            if (!Snap._.rgTransform.test(tstr)) {
                tstr = Snap._.svgTransform2string(tstr);
            } else {
                tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
            }
            if (is(tstr, "array")) {
                tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
            }
            el._.transform = tstr;
        }
        var m = Snap._.transform2matrix(tstr, el.getBBox(1));
        if (doReturn) {
            return m;
        } else {
            el.matrix = m;
        }
    }
    /*\
     * Element.transform
     [ method ]
     **
     * Gets or sets transformation of the element
     **
     - tstr (string) transform string in Snap or SVG format
     = (Element) the current element
     * or
     = (object) transformation descriptor:
     o {
     o     string (string) transform string,
     o     globalMatrix (Matrix) matrix of all transformations applied to element or its parents,
     o     localMatrix (Matrix) matrix of transformations applied only to the element,
     o     diffMatrix (Matrix) matrix of difference between global and local transformations,
     o     global (string) global transformation as string,
     o     local (string) local transformation as string,
     o     toString (function) returns `string` property
     o }
    \*/
    elproto.transform = function (tstr) {
        var _ = this._;
        if (tstr == null) {
            var papa = this,
                global = new Snap.Matrix(this.node.getCTM()),
                local = extractTransform(this),
                ms = [local],
                m = new Snap.Matrix,
                i,
                localString = local.toTransformString(),
                string = Str(local) == Str(this.matrix) ?
                            Str(_.transform) : localString;
            while (papa.type != "svg" && (papa = papa.parent())) {
                ms.push(extractTransform(papa));
            }
            i = ms.length;
            while (i--) {
                m.add(ms[i]);
            }
            return {
                string: string,
                globalMatrix: global,
                totalMatrix: m,
                localMatrix: local,
                diffMatrix: global.clone().add(local.invert()),
                global: global.toTransformString(),
                total: m.toTransformString(),
                local: localString,
                toString: propString
            };
        }
        if (tstr instanceof Snap.Matrix) {
            this.matrix = tstr;
            this._.transform = tstr.toTransformString();
        } else {
            extractTransform(this, tstr);
        }

        if (this.node) {
            if (this.type == "linearGradient" || this.type == "radialGradient") {
                $(this.node, {gradientTransform: this.matrix});
            } else if (this.type == "pattern") {
                $(this.node, {patternTransform: this.matrix});
            } else {
                $(this.node, {transform: this.matrix});
            }
        }

        return this;
    };
    /*\
     * Element.parent
     [ method ]
     **
     * Returns the element's parent
     **
     = (Element) the parent element
    \*/
    elproto.parent = function () {
        return wrap(this.node.parentNode);
    };
    /*\
     * Element.append
     [ method ]
     **
     * Appends the given element to current one
     **
     - el (Element|Set) element to append
     = (Element) the parent element
    \*/
    /*\
     * Element.add
     [ method ]
     **
     * See @Element.append
    \*/
    elproto.append = elproto.add = function (el) {
        if (el) {
            if (el.type == "set") {
                var it = this;
                el.forEach(function (el) {
                    it.add(el);
                });
                return this;
            }
            el = wrap(el);
            this.node.appendChild(el.node);
            el.paper = this.paper;
        }
        return this;
    };
    /*\
     * Element.appendTo
     [ method ]
     **
     * Appends the current element to the given one
     **
     - el (Element) parent element to append to
     = (Element) the child element
    \*/
    elproto.appendTo = function (el) {
        if (el) {
            el = wrap(el);
            el.append(this);
        }
        return this;
    };
    /*\
     * Element.prepend
     [ method ]
     **
     * Prepends the given element to the current one
     **
     - el (Element) element to prepend
     = (Element) the parent element
    \*/
    elproto.prepend = function (el) {
        if (el) {
            if (el.type == "set") {
                var it = this,
                    first;
                el.forEach(function (el) {
                    if (first) {
                        first.after(el);
                    } else {
                        it.prepend(el);
                    }
                    first = el;
                });
                return this;
            }
            el = wrap(el);
            var parent = el.parent();
            this.node.insertBefore(el.node, this.node.firstChild);
            this.add && this.add();
            el.paper = this.paper;
            this.parent() && this.parent().add();
            parent && parent.add();
        }
        return this;
    };
    /*\
     * Element.prependTo
     [ method ]
     **
     * Prepends the current element to the given one
     **
     - el (Element) parent element to prepend to
     = (Element) the child element
    \*/
    elproto.prependTo = function (el) {
        el = wrap(el);
        el.prepend(this);
        return this;
    };
    /*\
     * Element.before
     [ method ]
     **
     * Inserts given element before the current one
     **
     - el (Element) element to insert
     = (Element) the parent element
    \*/
    elproto.before = function (el) {
        if (el.type == "set") {
            var it = this;
            el.forEach(function (el) {
                var parent = el.parent();
                it.node.parentNode.insertBefore(el.node, it.node);
                parent && parent.add();
            });
            this.parent().add();
            return this;
        }
        el = wrap(el);
        var parent = el.parent();
        this.node.parentNode.insertBefore(el.node, this.node);
        this.parent() && this.parent().add();
        parent && parent.add();
        el.paper = this.paper;
        return this;
    };
    /*\
     * Element.after
     [ method ]
     **
     * Inserts given element after the current one
     **
     - el (Element) element to insert
     = (Element) the parent element
    \*/
    elproto.after = function (el) {
        el = wrap(el);
        var parent = el.parent();
        if (this.node.nextSibling) {
            this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
        } else {
            this.node.parentNode.appendChild(el.node);
        }
        this.parent() && this.parent().add();
        parent && parent.add();
        el.paper = this.paper;
        return this;
    };
    /*\
     * Element.insertBefore
     [ method ]
     **
     * Inserts the element after the given one
     **
     - el (Element) element next to whom insert to
     = (Element) the parent element
    \*/
    elproto.insertBefore = function (el) {
        el = wrap(el);
        var parent = this.parent();
        el.node.parentNode.insertBefore(this.node, el.node);
        this.paper = el.paper;
        parent && parent.add();
        el.parent() && el.parent().add();
        return this;
    };
    /*\
     * Element.insertAfter
     [ method ]
     **
     * Inserts the element after the given one
     **
     - el (Element) element next to whom insert to
     = (Element) the parent element
    \*/
    elproto.insertAfter = function (el) {
        el = wrap(el);
        var parent = this.parent();
        el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
        this.paper = el.paper;
        parent && parent.add();
        el.parent() && el.parent().add();
        return this;
    };
    /*\
     * Element.remove
     [ method ]
     **
     * Removes element from the DOM
     = (Element) the detached element
    \*/
    elproto.remove = function () {
        var parent = this.parent();
        this.node.parentNode && this.node.parentNode.removeChild(this.node);
        delete this.paper;
        this.removed = true;
        parent && parent.add();
        return this;
    };
    /*\
     * Element.select
     [ method ]
     **
     * Gathers the nested @Element matching the given set of CSS selectors
     **
     - query (string) CSS selector
     = (Element) result of query selection
    \*/
    elproto.select = function (query) {
        query = Str(query).replace(/([^\\]):/g, "$1\\:");
        return wrap(this.node.querySelector(query));
    };
    /*\
     * Element.selectAll
     [ method ]
     **
     * Gathers nested @Element objects matching the given set of CSS selectors
     **
     - query (string) CSS selector
     = (Set|array) result of query selection
    \*/
    elproto.selectAll = function (query) {
        var nodelist = this.node.querySelectorAll(query),
            set = (Snap.set || Array)();
        for (var i = 0; i < nodelist.length; i++) {
            set.push(wrap(nodelist[i]));
        }
        return set;
    };
    /*\
     * Element.asPX
     [ method ]
     **
     * Returns given attribute of the element as a `px` value (not %, em, etc.)
     **
     - attr (string) attribute name
     - value (string) #optional attribute value
     = (Element) result of query selection
    \*/
    elproto.asPX = function (attr, value) {
        if (value == null) {
            value = this.attr(attr);
        }
        return +unit2px(this, attr, value);
    };
    // SIERRA Element.use(): I suggest adding a note about how to access the original element the returned <use> instantiates. It's a part of SVG with which ordinary web developers may be least familiar.
    /*\
     * Element.use
     [ method ]
     **
     * Creates a `<use>` element linked to the current element
     **
     = (Element) the `<use>` element
    \*/
    elproto.use = function () {
        var use,
            id = this.node.id;
        if (!id) {
            id = this.id;
            $(this.node, {
                id: id
            });
        }
        if (this.type == "linearGradient" || this.type == "radialGradient" ||
            this.type == "pattern") {
            use = make(this.type, this.node.parentNode);
        } else {
            use = make("use", this.node.parentNode);
        }
        $(use.node, {
            "xlink:href": "#" + id
        });
        use.original = this;
        return use;
    };
    function fixids(el) {
        var els = el.selectAll("*"),
            it,
            url = /^\s*url\(("|'|)(.*)\1\)\s*$/,
            ids = [],
            uses = {};
        function urltest(it, name) {
            var val = $(it.node, name);
            val = val && val.match(url);
            val = val && val[2];
            if (val && val.charAt() == "#") {
                val = val.substring(1);
            } else {
                return;
            }
            if (val) {
                uses[val] = (uses[val] || []).concat(function (id) {
                    var attr = {};
                    attr[name] = URL(id);
                    $(it.node, attr);
                });
            }
        }
        function linktest(it) {
            var val = $(it.node, "xlink:href");
            if (val && val.charAt() == "#") {
                val = val.substring(1);
            } else {
                return;
            }
            if (val) {
                uses[val] = (uses[val] || []).concat(function (id) {
                    it.attr("xlink:href", "#" + id);
                });
            }
        }
        for (var i = 0, ii = els.length; i < ii; i++) {
            it = els[i];
            urltest(it, "fill");
            urltest(it, "stroke");
            urltest(it, "filter");
            urltest(it, "mask");
            urltest(it, "clip-path");
            linktest(it);
            var oldid = $(it.node, "id");
            if (oldid) {
                $(it.node, {id: it.id});
                ids.push({
                    old: oldid,
                    id: it.id
                });
            }
        }
        for (i = 0, ii = ids.length; i < ii; i++) {
            var fs = uses[ids[i].old];
            if (fs) {
                for (var j = 0, jj = fs.length; j < jj; j++) {
                    fs[j](ids[i].id);
                }
            }
        }
    }
    /*\
     * Element.clone
     [ method ]
     **
     * Creates a clone of the element and inserts it after the element
     **
     = (Element) the clone
    \*/
    elproto.clone = function () {
        var clone = wrap(this.node.cloneNode(true));
        if ($(clone.node, "id")) {
            $(clone.node, {id: clone.id});
        }
        fixids(clone);
        clone.insertAfter(this);
        return clone;
    };
    /*\
     * Element.toDefs
     [ method ]
     **
     * Moves element to the shared `<defs>` area
     **
     = (Element) the element
    \*/
    elproto.toDefs = function () {
        var defs = getSomeDefs(this);
        defs.appendChild(this.node);
        return this;
    };
    /*\
     * Element.toPattern
     [ method ]
     **
     * Creates a `<pattern>` element from the current element
     **
     * To create a pattern you have to specify the pattern rect:
     - x (string|number)
     - y (string|number)
     - width (string|number)
     - height (string|number)
     = (Element) the `<pattern>` element
     * You can use pattern later on as an argument for `fill` attribute:
     | var p = paper.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({
     |         fill: "none",
     |         stroke: "#bada55",
     |         strokeWidth: 5
     |     }).pattern(0, 0, 10, 10),
     |     c = paper.circle(200, 200, 100);
     | c.attr({
     |     fill: p
     | });
    \*/
    elproto.pattern = elproto.toPattern = function (x, y, width, height) {
        var p = make("pattern", getSomeDefs(this));
        if (x == null) {
            x = this.getBBox();
        }
        if (is(x, "object") && "x" in x) {
            y = x.y;
            width = x.width;
            height = x.height;
            x = x.x;
        }
        $(p.node, {
            x: x,
            y: y,
            width: width,
            height: height,
            patternUnits: "userSpaceOnUse",
            id: p.id,
            viewBox: [x, y, width, height].join(" ")
        });
        p.node.appendChild(this.node);
        return p;
    };
// SIERRA Element.marker(): clarify what a reference point is. E.g., helps you offset the object from its edge such as when centering it over a path.
// SIERRA Element.marker(): I suggest the method should accept default reference point values.  Perhaps centered with (refX = width/2) and (refY = height/2)? Also, couldn't it assume the element's current _width_ and _height_? And please specify what _x_ and _y_ mean: offsets? If so, from where?  Couldn't they also be assigned default values?
    /*\
     * Element.marker
     [ method ]
     **
     * Creates a `<marker>` element from the current element
     **
     * To create a marker you have to specify the bounding rect and reference point:
     - x (number)
     - y (number)
     - width (number)
     - height (number)
     - refX (number)
     - refY (number)
     = (Element) the `<marker>` element
     * You can specify the marker later as an argument for `marker-start`, `marker-end`, `marker-mid`, and `marker` attributes. The `marker` attribute places the marker at every point along the path, and `marker-mid` places them at every point except the start and end.
    \*/
    // TODO add usage for markers
    elproto.marker = function (x, y, width, height, refX, refY) {
        var p = make("marker", getSomeDefs(this));
        if (x == null) {
            x = this.getBBox();
        }
        if (is(x, "object") && "x" in x) {
            y = x.y;
            width = x.width;
            height = x.height;
            refX = x.refX || x.cx;
            refY = x.refY || x.cy;
            x = x.x;
        }
        $(p.node, {
            viewBox: [x, y, width, height].join(" "),
            markerWidth: width,
            markerHeight: height,
            orient: "auto",
            refX: refX || 0,
            refY: refY || 0,
            id: p.id
        });
        p.node.appendChild(this.node);
        return p;
    };
    // animation
    function slice(from, to, f) {
        return function (arr) {
            var res = arr.slice(from, to);
            if (res.length == 1) {
                res = res[0];
            }
            return f ? f(res) : res;
        };
    }
    var Animation = function (attr, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        this.attr = attr;
        this.dur = ms;
        easing && (this.easing = easing);
        callback && (this.callback = callback);
    };
    Snap._.Animation = Animation;
    /*\
     * Snap.animation
     [ method ]
     **
     * Creates an animation object
     **
     - attr (object) attributes of final destination
     - duration (number) duration of the animation, in milliseconds
     - easing (function) #optional one of easing functions of @mina or custom one
     - callback (function) #optional callback function that fires when animation ends
     = (object) animation object
    \*/
    Snap.animation = function (attr, ms, easing, callback) {
        return new Animation(attr, ms, easing, callback);
    };
    /*\
     * Element.inAnim
     [ method ]
     **
     * Returns a set of animations that may be able to manipulate the current element
     **
     = (object) in format:
     o {
     o     anim (object) animation object,
     o     mina (object) @mina object,
     o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
    \*/
    elproto.inAnim = function () {
        var el = this,
            res = [];
        for (var id in el.anims) if (el.anims[has](id)) {
            (function (a) {
                res.push({
                    anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
                    mina: a,
                    curStatus: a.status(),
                    status: function (val) {
                        return a.status(val);
                    },
                    stop: function () {
                        a.stop();
                    }
                });
            }(el.anims[id]));
        }
        return res;
    };
    /*\
     * Snap.animate
     [ method ]
     **
     * Runs generic animation of one number into another with a caring function
     **
     - from (number|array) number or array of numbers
     - to (number|array) number or array of numbers
     - setter (function) caring function that accepts one number argument
     - duration (number) duration, in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function to execute when animation ends
     = (object) animation object in @mina format
     o {
     o     id (string) animation id, consider it read-only,
     o     duration (function) gets or sets the duration of the animation,
     o     easing (function) easing,
     o     speed (function) gets or sets the speed of the animation,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
     | var rect = Snap().rect(0, 0, 10, 10);
     | Snap.animate(0, 10, function (val) {
     |     rect.attr({
     |         x: val
     |     });
     | }, 1000);
     | // in given context is equivalent to
     | rect.animate({x: 10}, 1000);
    \*/
    Snap.animate = function (from, to, setter, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        var now = mina.time(),
            anim = mina(from, to, now, now + ms, mina.time, setter, easing);
        callback && eve.once("mina.finish." + anim.id, callback);
        return anim;
    };
    /*\
     * Element.stop
     [ method ]
     **
     * Stops all the animations for the current element
     **
     = (Element) the current element
    \*/
    elproto.stop = function () {
        var anims = this.inAnim();
        for (var i = 0, ii = anims.length; i < ii; i++) {
            anims[i].stop();
        }
        return this;
    };
    /*\
     * Element.animate
     [ method ]
     **
     * Animates the given attributes of the element
     **
     - attrs (object) key-value pairs of destination attributes
     - duration (number) duration of the animation in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function that executes when the animation ends
     = (Element) the current element
    \*/
    elproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = easing.dur;
            attrs = attrs.attr;
        }
        var fkeys = [], tkeys = [], keys = {}, from, to, f, eq,
            el = this;
        for (var key in attrs) if (attrs[has](key)) {
            if (el.equal) {
                eq = el.equal(key, Str(attrs[key]));
                from = eq.from;
                to = eq.to;
                f = eq.f;
            } else {
                from = +el.attr(key);
                to = +attrs[key];
            }
            var len = is(from, "array") ? from.length : 1;
            keys[key] = slice(fkeys.length, fkeys.length + len, f);
            fkeys = fkeys.concat(from);
            tkeys = tkeys.concat(to);
        }
        var now = mina.time(),
            anim = mina(fkeys, tkeys, now, now + ms, mina.time, function (val) {
                var attr = {};
                for (var key in keys) if (keys[has](key)) {
                    attr[key] = keys[key](val);
                }
                el.attr(attr);
            }, easing);
        el.anims[anim.id] = anim;
        anim._attrs = attrs;
        anim._callback = callback;
        eve("snap.animcreated." + el.id, anim);
        eve.once("mina.finish." + anim.id, function () {
            delete el.anims[anim.id];
            callback && callback.call(el);
        });
        eve.once("mina.stop." + anim.id, function () {
            delete el.anims[anim.id];
        });
        return el;
    };
    var eldata = {};
    /*\
     * Element.data
     [ method ]
     **
     * Adds or retrieves given value associated with given key. (Don’t confuse
     * with `data-` attributes)
     *
     * See also @Element.removeData
     - key (string) key to store data
     - value (any) #optional value to store
     = (object) @Element
     * or, if value is not specified:
     = (any) value
     > Usage
     | for (var i = 0, i < 5, i++) {
     |     paper.circle(10 + 15 * i, 10, 10)
     |          .attr({fill: "#000"})
     |          .data("i", i)
     |          .click(function () {
     |             alert(this.data("i"));
     |          });
     | }
    \*/
    elproto.data = function (key, value) {
        var data = eldata[this.id] = eldata[this.id] || {};
        if (arguments.length == 0){
            eve("snap.data.get." + this.id, this, data, null);
            return data;
        }
        if (arguments.length == 1) {
            if (Snap.is(key, "object")) {
                for (var i in key) if (key[has](i)) {
                    this.data(i, key[i]);
                }
                return this;
            }
            eve("snap.data.get." + this.id, this, data[key], key);
            return data[key];
        }
        data[key] = value;
        eve("snap.data.set." + this.id, this, value, key);
        return this;
    };
    /*\
     * Element.removeData
     [ method ]
     **
     * Removes value associated with an element by given key.
     * If key is not provided, removes all the data of the element.
     - key (string) #optional key
     = (object) @Element
    \*/
    elproto.removeData = function (key) {
        if (key == null) {
            eldata[this.id] = {};
        } else {
            eldata[this.id] && delete eldata[this.id][key];
        }
        return this;
    };
    /*\
     * Element.outerSVG
     [ method ]
     **
     * Returns SVG code for the element, equivalent to HTML's `outerHTML`.
     *
     * See also @Element.innerSVG
     = (string) SVG code for the element
    \*/
    /*\
     * Element.toString
     [ method ]
     **
     * See @Element.outerSVG
    \*/
    elproto.outerSVG = elproto.toString = toString(1);
    /*\
     * Element.innerSVG
     [ method ]
     **
     * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
     = (string) SVG code for the element
    \*/
    elproto.innerSVG = toString();
    function toString(type) {
        return function () {
            var res = type ? "<" + this.type : "",
                attr = this.node.attributes,
                chld = this.node.childNodes;
            if (type) {
                for (var i = 0, ii = attr.length; i < ii; i++) {
                    res += " " + attr[i].name + '="' +
                            attr[i].value.replace(/"/g, '\\"') + '"';
                }
            }
            if (chld.length) {
                type && (res += ">");
                for (i = 0, ii = chld.length; i < ii; i++) {
                    if (chld[i].nodeType == 3) {
                        res += chld[i].nodeValue;
                    } else if (chld[i].nodeType == 1) {
                        res += wrap(chld[i]).toString();
                    }
                }
                type && (res += "</" + this.type + ">");
            } else {
                type && (res += "/>");
            }
            return res;
        };
    }
    elproto.toDataURL = function () {
        if (window && window.btoa) {
            var bb = this.getBBox(),
                svg = Snap.format('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="{x} {y} {width} {height}">{contents}</svg>', {
                x: +bb.x.toFixed(3),
                y: +bb.y.toFixed(3),
                width: +bb.width.toFixed(3),
                height: +bb.height.toFixed(3),
                contents: this.outerSVG()
            });
            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        }
    };
    /*\
     * Fragment.select
     [ method ]
     **
     * See @Element.select
    \*/
    Fragment.prototype.select = elproto.select;
    /*\
     * Fragment.selectAll
     [ method ]
     **
     * See @Element.selectAll
    \*/
    Fragment.prototype.selectAll = elproto.selectAll;
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var objectToString = Object.prototype.toString,
        Str = String,
        math = Math,
        E = "";
    function Matrix(a, b, c, d, e, f) {
        if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
            this.a = a.a;
            this.b = a.b;
            this.c = a.c;
            this.d = a.d;
            this.e = a.e;
            this.f = a.f;
            return;
        }
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }
    (function (matrixproto) {
        /*\
         * Matrix.add
         [ method ]
         **
         * Adds the given matrix to existing one
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         * or
         - matrix (object) @Matrix
        \*/
        matrixproto.add = function (a, b, c, d, e, f) {
            var out = [[], [], []],
                m = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
                matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
                x, y, z, res;

            if (a && a instanceof Matrix) {
                matrix = [[a.a, a.c, a.e], [a.b, a.d, a.f], [0, 0, 1]];
            }

            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    res = 0;
                    for (z = 0; z < 3; z++) {
                        res += m[x][z] * matrix[z][y];
                    }
                    out[x][y] = res;
                }
            }
            this.a = out[0][0];
            this.b = out[1][0];
            this.c = out[0][1];
            this.d = out[1][1];
            this.e = out[0][2];
            this.f = out[1][2];
            return this;
        };
        /*\
         * Matrix.invert
         [ method ]
         **
         * Returns an inverted version of the matrix
         = (object) @Matrix
        \*/
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        /*\
         * Matrix.clone
         [ method ]
         **
         * Returns a copy of the matrix
         = (object) @Matrix
        \*/
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        /*\
         * Matrix.translate
         [ method ]
         **
         * Translate the matrix
         - x (number) horizontal offset distance
         - y (number) vertical offset distance
        \*/
        matrixproto.translate = function (x, y) {
            return this.add(1, 0, 0, 1, x, y);
        };
        /*\
         * Matrix.scale
         [ method ]
         **
         * Scales the matrix
         - x (number) amount to be scaled, with `1` resulting in no change
         - y (number) #optional amount to scale along the vertical axis. (Otherwise `x` applies to both axes.)
         - cx (number) #optional horizontal origin point from which to scale
         - cy (number) #optional vertical origin point from which to scale
         * Default cx, cy is the middle point of the element.
        \*/
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
            this.add(x, 0, 0, y, 0, 0);
            (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
            return this;
        };
        /*\
         * Matrix.rotate
         [ method ]
         **
         * Rotates the matrix
         - a (number) angle of rotation, in degrees
         - x (number) horizontal origin point from which to rotate
         - y (number) vertical origin point from which to rotate
        \*/
        matrixproto.rotate = function (a, x, y) {
            a = Snap.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            return this.add(1, 0, 0, 1, -x, -y);
        };
        /*\
         * Matrix.x
         [ method ]
         **
         * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
         - x (number)
         - y (number)
         = (number) x
        \*/
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        /*\
         * Matrix.y
         [ method ]
         **
         * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
         - x (number)
         - y (number)
         = (number) y
        \*/
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };
        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(4);
        };
        matrixproto.toString = function () {
            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(4), this.f.toFixed(4)];
        };
        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }
        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }
        /*\
         * Matrix.determinant
         [ method ]
         **
         * Finds determinant of the given matrix.
         = (number) determinant
        \*/
        matrixproto.determinant = function () {
            return this.a * this.d - this.b * this.c;
        };
        /*\
         * Matrix.split
         [ method ]
         **
         * Splits matrix into primitive transformations
         = (object) in format:
         o dx (number) translation by x
         o dy (number) translation by y
         o scalex (number) scale by x
         o scaley (number) scale by y
         o shear (number) shear
         o rotate (number) rotation in deg
         o isSimple (boolean) could it be represented via simple transformations
        \*/
        matrixproto.split = function () {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            // scale and shear
            var row = [[this.a, this.c], [this.b, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            if (this.determinant() < 0) {
                out.scalex = -out.scalex;
            }

            // rotation
            var sin = -row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = Snap.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = Snap.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };
        /*\
         * Matrix.toTransformString
         [ method ]
         **
         * Returns transform string that represents given matrix
         = (string) transform string
        \*/
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this.split();
            if (!+s.shear.toFixed(9)) {
                s.scalex = +s.scalex.toFixed(4);
                s.scaley = +s.scaley.toFixed(4);
                s.rotate = +s.rotate.toFixed(4);
                return  (s.dx || s.dy ? "t" + [+s.dx.toFixed(4), +s.dy.toFixed(4)] : E) + 
                        (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E) +
                        (s.rotate ? "r" + [+s.rotate.toFixed(4), 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };
    })(Matrix.prototype);
    /*\
     * Snap.Matrix
     [ method ]
     **
     * Matrix constructor, extend on your own risk.
     * To create matrices use @Snap.matrix.
    \*/
    Snap.Matrix = Matrix;
    /*\
     * Snap.matrix
     [ method ]
     **
     * Utility method
     **
     * Returns a matrix based on the given parameters
     - a (number)
     - b (number)
     - c (number)
     - d (number)
     - e (number)
     - f (number)
     * or
     - svgMatrix (SVGMatrix)
     = (object) @Matrix
    \*/
    Snap.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
});
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var has = "hasOwnProperty",
        make = Snap._.make,
        wrap = Snap._.wrap,
        is = Snap.is,
        getSomeDefs = Snap._.getSomeDefs,
        reURLValue = /^url\(#?([^)]+)\)$/,
        $ = Snap._.$,
        URL = Snap.url,
        Str = String,
        separator = Snap._.separator,
        E = "";
    // Attributes event handlers
    eve.on("snap.util.attr.mask", function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            if (value instanceof Fragment && value.node.childNodes.length == 1) {
                value = value.node.firstChild;
                getSomeDefs(this).appendChild(value);
                value = wrap(value);
            }
            if (value.type == "mask") {
                var mask = value;
            } else {
                mask = make("mask", getSomeDefs(this));
                mask.node.appendChild(value.node);
            }
            !mask.node.id && $(mask.node, {
                id: mask.id
            });
            $(this.node, {
                mask: URL(mask.id)
            });
        }
    });
    (function (clipIt) {
        eve.on("snap.util.attr.clip", clipIt);
        eve.on("snap.util.attr.clip-path", clipIt);
        eve.on("snap.util.attr.clipPath", clipIt);
    }(function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            if (value.type == "clipPath") {
                var clip = value;
            } else {
                clip = make("clipPath", getSomeDefs(this));
                clip.node.appendChild(value.node);
                !clip.node.id && $(clip.node, {
                    id: clip.id
                });
            }
            $(this.node, {
                "clip-path": URL(clip.node.id || clip.id)
            });
        }
    }));
    function fillStroke(name) {
        return function (value) {
            eve.stop();
            if (value instanceof Fragment && value.node.childNodes.length == 1 &&
                (value.node.firstChild.tagName == "radialGradient" ||
                value.node.firstChild.tagName == "linearGradient" ||
                value.node.firstChild.tagName == "pattern")) {
                value = value.node.firstChild;
                getSomeDefs(this).appendChild(value);
                value = wrap(value);
            }
            if (value instanceof Element) {
                if (value.type == "radialGradient" || value.type == "linearGradient"
                   || value.type == "pattern") {
                    if (!value.node.id) {
                        $(value.node, {
                            id: value.id
                        });
                    }
                    var fill = URL(value.node.id);
                } else {
                    fill = value.attr(name);
                }
            } else {
                fill = Snap.color(value);
                if (fill.error) {
                    var grad = Snap(getSomeDefs(this).ownerSVGElement).gradient(value);
                    if (grad) {
                        if (!grad.node.id) {
                            $(grad.node, {
                                id: grad.id
                            });
                        }
                        fill = URL(grad.node.id);
                    } else {
                        fill = value;
                    }
                } else {
                    fill = Str(fill);
                }
            }
            var attrs = {};
            attrs[name] = fill;
            $(this.node, attrs);
            this.node.style[name] = E;
        };
    }
    eve.on("snap.util.attr.fill", fillStroke("fill"));
    eve.on("snap.util.attr.stroke", fillStroke("stroke"));
    var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
    eve.on("snap.util.grad.parse", function parseGrad(string) {
        string = Str(string);
        var tokens = string.match(gradrg);
        if (!tokens) {
            return null;
        }
        var type = tokens[1],
            params = tokens[2],
            stops = tokens[3];
        params = params.split(/\s*,\s*/).map(function (el) {
            return +el == el ? +el : el;
        });
        if (params.length == 1 && params[0] == 0) {
            params = [];
        }
        stops = stops.split("-");
        stops = stops.map(function (el) {
            el = el.split(":");
            var out = {
                color: el[0]
            };
            if (el[1]) {
                out.offset = parseFloat(el[1]);
            }
            return out;
        });
        return {
            type: type,
            params: params,
            stops: stops
        };
    });

    eve.on("snap.util.attr.d", function (value) {
        eve.stop();
        if (is(value, "array") && is(value[0], "array")) {
            value = Snap.path.toString.call(value);
        }
        value = Str(value);
        if (value.match(/[ruo]/i)) {
            value = Snap.path.toAbsolute(value);
        }
        $(this.node, {d: value});
    })(-1);
    eve.on("snap.util.attr.#text", function (value) {
        eve.stop();
        value = Str(value);
        var txt = glob.doc.createTextNode(value);
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        this.node.appendChild(txt);
    })(-1);
    eve.on("snap.util.attr.path", function (value) {
        eve.stop();
        this.attr({d: value});
    })(-1);
    eve.on("snap.util.attr.class", function (value) {
        eve.stop();
        this.node.className.baseVal = value;
    })(-1);
    eve.on("snap.util.attr.viewBox", function (value) {
        var vb;
        if (is(value, "object") && "x" in value) {
            vb = [value.x, value.y, value.width, value.height].join(" ");
        } else if (is(value, "array")) {
            vb = value.join(" ");
        } else {
            vb = value;
        }
        $(this.node, {
            viewBox: vb
        });
        eve.stop();
    })(-1);
    eve.on("snap.util.attr.transform", function (value) {
        this.transform(value);
        eve.stop();
    })(-1);
    eve.on("snap.util.attr.r", function (value) {
        if (this.type == "rect") {
            eve.stop();
            $(this.node, {
                rx: value,
                ry: value
            });
        }
    })(-1);
    eve.on("snap.util.attr.textpath", function (value) {
        eve.stop();
        if (this.type == "text") {
            var id, tp, node;
            if (!value && this.textPath) {
                tp = this.textPath;
                while (tp.node.firstChild) {
                    this.node.appendChild(tp.node.firstChild);
                }
                tp.remove();
                delete this.textPath;
                return;
            }
            if (is(value, "string")) {
                var defs = getSomeDefs(this),
                    path = wrap(defs.parentNode).path(value);
                defs.appendChild(path.node);
                id = path.id;
                path.attr({id: id});
            } else {
                value = wrap(value);
                if (value instanceof Element) {
                    id = value.attr("id");
                    if (!id) {
                        id = value.id;
                        value.attr({id: id});
                    }
                }
            }
            if (id) {
                tp = this.textPath;
                node = this.node;
                if (tp) {
                    tp.attr({"xlink:href": "#" + id});
                } else {
                    tp = $("textPath", {
                        "xlink:href": "#" + id
                    });
                    while (node.firstChild) {
                        tp.appendChild(node.firstChild);
                    }
                    node.appendChild(tp);
                    this.textPath = wrap(tp);
                }
            }
        }
    })(-1);
    eve.on("snap.util.attr.text", function (value) {
        if (this.type == "text") {
            var i = 0,
                node = this.node,
                tuner = function (chunk) {
                    var out = $("tspan");
                    if (is(chunk, "array")) {
                        for (var i = 0; i < chunk.length; i++) {
                            out.appendChild(tuner(chunk[i]));
                        }
                    } else {
                        out.appendChild(glob.doc.createTextNode(chunk));
                    }
                    out.normalize && out.normalize();
                    return out;
                };
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var tuned = tuner(value);
            while (tuned.firstChild) {
                node.appendChild(tuned.firstChild);
            }
        }
        eve.stop();
    })(-1);
    function setFontSize(value) {
        eve.stop();
        if (value == +value) {
            value += "px";
        }
        this.node.style.fontSize = value;
    }
    eve.on("snap.util.attr.fontSize", setFontSize)(-1);
    eve.on("snap.util.attr.font-size", setFontSize)(-1);


    eve.on("snap.util.getattr.transform", function () {
        eve.stop();
        return this.transform();
    })(-1);
    eve.on("snap.util.getattr.textpath", function () {
        eve.stop();
        return this.textPath;
    })(-1);
    // Markers
    (function () {
        function getter(end) {
            return function () {
                eve.stop();
                var style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
                if (style == "none") {
                    return style;
                } else {
                    return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
                }
            };
        }
        function setter(end) {
            return function (value) {
                eve.stop();
                var name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
                if (value == "" || !value) {
                    this.node.style[name] = "none";
                    return;
                }
                if (value.type == "marker") {
                    var id = value.node.id;
                    if (!id) {
                        $(value.node, {id: value.id});
                    }
                    this.node.style[name] = URL(id);
                    return;
                }
            };
        }
        eve.on("snap.util.getattr.marker-end", getter("end"))(-1);
        eve.on("snap.util.getattr.markerEnd", getter("end"))(-1);
        eve.on("snap.util.getattr.marker-start", getter("start"))(-1);
        eve.on("snap.util.getattr.markerStart", getter("start"))(-1);
        eve.on("snap.util.getattr.marker-mid", getter("mid"))(-1);
        eve.on("snap.util.getattr.markerMid", getter("mid"))(-1);
        eve.on("snap.util.attr.marker-end", setter("end"))(-1);
        eve.on("snap.util.attr.markerEnd", setter("end"))(-1);
        eve.on("snap.util.attr.marker-start", setter("start"))(-1);
        eve.on("snap.util.attr.markerStart", setter("start"))(-1);
        eve.on("snap.util.attr.marker-mid", setter("mid"))(-1);
        eve.on("snap.util.attr.markerMid", setter("mid"))(-1);
    }());
    eve.on("snap.util.getattr.r", function () {
        if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
            eve.stop();
            return $(this.node, "rx");
        }
    })(-1);
    function textExtract(node) {
        var out = [];
        var children = node.childNodes;
        for (var i = 0, ii = children.length; i < ii; i++) {
            var chi = children[i];
            if (chi.nodeType == 3) {
                out.push(chi.nodeValue);
            }
            if (chi.tagName == "tspan") {
                if (chi.childNodes.length == 1 && chi.firstChild.nodeType == 3) {
                    out.push(chi.firstChild.nodeValue);
                } else {
                    out.push(textExtract(chi));
                }
            }
        }
        return out;
    }
    eve.on("snap.util.getattr.text", function () {
        if (this.type == "text" || this.type == "tspan") {
            eve.stop();
            var out = textExtract(this.node);
            return out.length == 1 ? out[0] : out;
        }
    })(-1);
    eve.on("snap.util.getattr.#text", function () {
        return this.node.textContent;
    })(-1);
    eve.on("snap.util.getattr.viewBox", function () {
        eve.stop();
        var vb = $(this.node, "viewBox");
        if (vb) {
            vb = vb.split(separator);
            return Snap._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.points", function () {
        var p = $(this.node, "points");
        eve.stop();
        if (p) {
            return p.split(separator);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.path", function () {
        var p = $(this.node, "d");
        eve.stop();
        return p;
    })(-1);
    eve.on("snap.util.getattr.class", function () {
        return this.node.className.baseVal;
    })(-1);
    function getFontSize() {
        eve.stop();
        return this.node.style.fontSize;
    }
    eve.on("snap.util.getattr.fontSize", getFontSize)(-1);
    eve.on("snap.util.getattr.font-size", getFontSize)(-1);
});

// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var rgNotSpace = /\S+/g,
        rgBadSpace = /[\t\r\n\f]/g,
        rgTrim = /(^\s+|\s+$)/g,
        Str = String,
        elproto = Element.prototype;
    /*\
     * Element.addClass
     [ method ]
     **
     * Adds given class name or list of class names to the element.
     - value (string) class name or space separated list of class names
     **
     = (Element) original element.
    \*/
    elproto.addClass = function (value) {
        var classes = Str(value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;

        if (classes.length) {
            j = 0;
            while ((clazz = classes[j++])) {
                pos = curClasses.indexOf(clazz);
                if (!~pos) {
                    curClasses.push(clazz);
                }
            }

            finalValue = curClasses.join(" ");
            if (className != finalValue) {
                elem.className.baseVal = finalValue;
            }
        }
        return this;
    };
    /*\
     * Element.removeClass
     [ method ]
     **
     * Removes given class name or list of class names from the element.
     - value (string) class name or space separated list of class names
     **
     = (Element) original element.
    \*/
    elproto.removeClass = function (value) {
        var classes = Str(value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;
        if (curClasses.length) {
            j = 0;
            while ((clazz = classes[j++])) {
                pos = curClasses.indexOf(clazz);
                if (~pos) {
                    curClasses.splice(pos, 1);
                }
            }

            finalValue = curClasses.join(" ");
            if (className != finalValue) {
                elem.className.baseVal = finalValue;
            }
        }
        return this;
    };
    /*\
     * Element.hasClass
     [ method ]
     **
     * Checks if the element has a given class name in the list of class names applied to it.
     - value (string) class name
     **
     = (boolean) `true` if the element has given class
    \*/
    elproto.hasClass = function (value) {
        var elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [];
        return !!~curClasses.indexOf(value);
    };
    /*\
     * Element.toggleClass
     [ method ]
     **
     * Add or remove one or more classes from the element, depending on either
     * the class’s presence or the value of the `flag` argument.
     - value (string) class name or space separated list of class names
     - flag (boolean) value to determine whether the class should be added or removed
     **
     = (Element) original element.
    \*/
    elproto.toggleClass = function (value, flag) {
        if (flag != null) {
            if (flag) {
                return this.addClass(value);
            } else {
                return this.removeClass(value);
            }
        }
        var classes = (value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;
        j = 0;
        while ((clazz = classes[j++])) {
            pos = curClasses.indexOf(clazz);
            if (~pos) {
                curClasses.splice(pos, 1);
            } else {
                curClasses.push(clazz);
            }
        }

        finalValue = curClasses.join(" ");
        if (className != finalValue) {
            elem.className.baseVal = finalValue;
        }
        return this;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var operators = {
            "+": function (x, y) {
                    return x + y;
                },
            "-": function (x, y) {
                    return x - y;
                },
            "/": function (x, y) {
                    return x / y;
                },
            "*": function (x, y) {
                    return x * y;
                }
        },
        Str = String,
        reUnit = /[a-z]+$/i,
        reAddon = /^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;
    function getNumber(val) {
        return val;
    }
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }
    eve.on("snap.util.attr", function (val) {
        var plus = Str(val).match(reAddon);
        if (plus) {
            var evnt = eve.nt(),
                name = evnt.substring(evnt.lastIndexOf(".") + 1),
                a = this.attr(name),
                atr = {};
            eve.stop();
            var unit = plus[3] || "",
                aUnit = a.match(reUnit),
                op = operators[plus[1]];
            if (aUnit && aUnit == unit) {
                val = op(parseFloat(a), +plus[2]);
            } else {
                a = this.asPX(name);
                val = op(this.asPX(name), this.asPX(name, plus[2] + unit));
            }
            if (isNaN(a) || isNaN(val)) {
                return;
            }
            atr[name] = val;
            this.attr(atr);
        }
    })(-10);
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this,
            bplus = Str(b).match(reAddon);
        if (bplus) {
            eve.stop();
            var unit = bplus[3] || "",
                aUnit = a.match(reUnit),
                op = operators[bplus[1]];
            if (aUnit && aUnit == unit) {
                return {
                    from: parseFloat(a),
                    to: op(parseFloat(a), +bplus[2]),
                    f: getUnit(aUnit)
                };
            } else {
                a = this.asPX(name);
                return {
                    from: a,
                    to: op(a, this.asPX(name, bplus[2] + unit)),
                    f: getNumber
                };
            }
        }
    })(-10);
});
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var proto = Paper.prototype,
        is = Snap.is;
    /*\
     * Paper.rect
     [ method ]
     *
     * Draws a rectangle
     **
     - x (number) x coordinate of the top left corner
     - y (number) y coordinate of the top left corner
     - width (number) width
     - height (number) height
     - rx (number) #optional horizontal radius for rounded corners, default is 0
     - ry (number) #optional vertical radius for rounded corners, default is rx or 0
     = (object) the `rect` element
     **
     > Usage
     | // regular rectangle
     | var c = paper.rect(10, 10, 50, 50);
     | // rectangle with rounded corners
     | var c = paper.rect(40, 40, 50, 50, 10);
    \*/
    proto.rect = function (x, y, w, h, rx, ry) {
        var attr;
        if (ry == null) {
            ry = rx;
        }
        if (is(x, "object") && x == "[object Object]") {
            attr = x;
        } else if (x != null) {
            attr = {
                x: x,
                y: y,
                width: w,
                height: h
            };
            if (rx != null) {
                attr.rx = rx;
                attr.ry = ry;
            }
        }
        return this.el("rect", attr);
    };
    /*\
     * Paper.circle
     [ method ]
     **
     * Draws a circle
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - r (number) radius
     = (object) the `circle` element
     **
     > Usage
     | var c = paper.circle(50, 50, 40);
    \*/
    proto.circle = function (cx, cy, r) {
        var attr;
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr = {
                cx: cx,
                cy: cy,
                r: r
            };
        }
        return this.el("circle", attr);
    };

    var preload = (function () {
        function onerror() {
            this.parentNode.removeChild(this);
        }
        return function (src, f) {
            var img = glob.doc.createElement("img"),
                body = glob.doc.body;
            img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
            img.onload = function () {
                f.call(img);
                img.onload = img.onerror = null;
                body.removeChild(img);
            };
            img.onerror = onerror;
            body.appendChild(img);
            img.src = src;
        };
    }());

    /*\
     * Paper.image
     [ method ]
     **
     * Places an image on the surface
     **
     - src (string) URI of the source image
     - x (number) x offset position
     - y (number) y offset position
     - width (number) width of the image
     - height (number) height of the image
     = (object) the `image` element
     * or
     = (object) Snap element object with type `image`
     **
     > Usage
     | var c = paper.image("apple.png", 10, 10, 80, 80);
    \*/
    proto.image = function (src, x, y, width, height) {
        var el = this.el("image");
        if (is(src, "object") && "src" in src) {
            el.attr(src);
        } else if (src != null) {
            var set = {
                "xlink:href": src,
                preserveAspectRatio: "none"
            };
            if (x != null && y != null) {
                set.x = x;
                set.y = y;
            }
            if (width != null && height != null) {
                set.width = width;
                set.height = height;
            } else {
                preload(src, function () {
                    Snap._.$(el.node, {
                        width: this.offsetWidth,
                        height: this.offsetHeight
                    });
                });
            }
            Snap._.$(el.node, set);
        }
        return el;
    };
    /*\
     * Paper.ellipse
     [ method ]
     **
     * Draws an ellipse
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - rx (number) horizontal radius
     - ry (number) vertical radius
     = (object) the `ellipse` element
     **
     > Usage
     | var c = paper.ellipse(50, 50, 40, 20);
    \*/
    proto.ellipse = function (cx, cy, rx, ry) {
        var attr;
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr ={
                cx: cx,
                cy: cy,
                rx: rx,
                ry: ry
            };
        }
        return this.el("ellipse", attr);
    };
    // SIERRA Paper.path(): Unclear from the link what a Catmull-Rom curveto is, and why it would make life any easier.
    /*\
     * Paper.path
     [ method ]
     **
     * Creates a `<path>` element using the given string as the path's definition
     - pathString (string) #optional path string in SVG format
     * Path string consists of one-letter commands, followed by comma seprarated arguments in numerical form. Example:
     | "M10,20L30,40"
     * This example features two commands: `M`, with arguments `(10, 20)` and `L` with arguments `(30, 40)`. Uppercase letter commands express coordinates in absolute terms, while lowercase commands express them in relative terms from the most recently declared coordinates.
     *
     # <p>Here is short list of commands available, for more details see <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path's data attribute's format are described in the SVG specification.">SVG path string format</a> or <a href="https://developer.mozilla.org/en/SVG/Tutorial/Paths">article about path strings at MDN</a>.</p>
     # <table><thead><tr><th>Command</th><th>Name</th><th>Parameters</th></tr></thead><tbody>
     # <tr><td>M</td><td>moveto</td><td>(x y)+</td></tr>
     # <tr><td>Z</td><td>closepath</td><td>(none)</td></tr>
     # <tr><td>L</td><td>lineto</td><td>(x y)+</td></tr>
     # <tr><td>H</td><td>horizontal lineto</td><td>x+</td></tr>
     # <tr><td>V</td><td>vertical lineto</td><td>y+</td></tr>
     # <tr><td>C</td><td>curveto</td><td>(x1 y1 x2 y2 x y)+</td></tr>
     # <tr><td>S</td><td>smooth curveto</td><td>(x2 y2 x y)+</td></tr>
     # <tr><td>Q</td><td>quadratic Bézier curveto</td><td>(x1 y1 x y)+</td></tr>
     # <tr><td>T</td><td>smooth quadratic Bézier curveto</td><td>(x y)+</td></tr>
     # <tr><td>A</td><td>elliptical arc</td><td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td></tr>
     # <tr><td>R</td><td><a href="http://en.wikipedia.org/wiki/Catmull–Rom_spline#Catmull.E2.80.93Rom_spline">Catmull-Rom curveto</a>*</td><td>x1 y1 (x y)+</td></tr></tbody></table>
     * * _Catmull-Rom curveto_ is a not standard SVG command and added to make life easier.
     * Note: there is a special case when a path consists of only three commands: `M10,10R…z`. In this case the path connects back to its starting point.
     > Usage
     | var c = paper.path("M10 10L90 90");
     | // draw a diagonal line:
     | // move to 10,10, line to 90,90
    \*/
    proto.path = function (d) {
        var attr;
        if (is(d, "object") && !is(d, "array")) {
            attr = d;
        } else if (d) {
            attr = {d: d};
        }
        return this.el("path", attr);
    };
    /*\
     * Paper.g
     [ method ]
     **
     * Creates a group element
     **
     - varargs (…) #optional elements to nest within the group
     = (object) the `g` element
     **
     > Usage
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g(c2, c1); // note that the order of elements is different
     * or
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g();
     | g.add(c2, c1);
    \*/
    /*\
     * Paper.group
     [ method ]
     **
     * See @Paper.g
    \*/
    proto.group = proto.g = function (first) {
        var attr,
            el = this.el("g");
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /*\
     * Paper.svg
     [ method ]
     **
     * Creates a nested SVG element.
     - x (number) @optional X of the element
     - y (number) @optional Y of the element
     - width (number) @optional width of the element
     - height (number) @optional height of the element
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     **
     = (object) the `svg` element
     **
    \*/
    proto.svg = function (x, y, width, height, vbx, vby, vbw, vbh) {
        var attrs = {};
        if (is(x, "object") && y == null) {
            attrs = x;
        } else {
            if (x != null) {
                attrs.x = x;
            }
            if (y != null) {
                attrs.y = y;
            }
            if (width != null) {
                attrs.width = width;
            }
            if (height != null) {
                attrs.height = height;
            }
            if (vbx != null && vby != null && vbw != null && vbh != null) {
                attrs.viewBox = [vbx, vby, vbw, vbh];
            }
        }
        return this.el("svg", attrs);
    };
    /*\
     * Paper.mask
     [ method ]
     **
     * Equivalent in behaviour to @Paper.g, except it’s a mask.
     **
     = (object) the `mask` element
     **
    \*/
    proto.mask = function (first) {
        var attr,
            el = this.el("mask");
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /*\
     * Paper.ptrn
     [ method ]
     **
     * Equivalent in behaviour to @Paper.g, except it’s a pattern.
     - x (number) @optional X of the element
     - y (number) @optional Y of the element
     - width (number) @optional width of the element
     - height (number) @optional height of the element
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     **
     = (object) the `pattern` element
     **
    \*/
    proto.ptrn = function (x, y, width, height, vx, vy, vw, vh) {
        if (is(x, "object")) {
            var attr = x;
        } else {
            attr = {patternUnits: "userSpaceOnUse"};
            if (x) {
                attr.x = x;
            }
            if (y) {
                attr.y = y;
            }
            if (width != null) {
                attr.width = width;
            }
            if (height != null) {
                attr.height = height;
            }
            if (vx != null && vy != null && vw != null && vh != null) {
                attr.viewBox = [vx, vy, vw, vh];
            } else {
                attr.viewBox = [x || 0, y || 0, width || 0, height || 0];
            }
        }
        return this.el("pattern", attr);
    };
    /*\
     * Paper.use
     [ method ]
     **
     * Creates a <use> element.
     - id (string) @optional id of element to link
     * or
     - id (Element) @optional element to link
     **
     = (object) the `use` element
     **
    \*/
    proto.use = function (id) {
        if (id != null) {
            if (id instanceof Element) {
                if (!id.attr("id")) {
                    id.attr({id: Snap._.id(id)});
                }
                id = id.attr("id");
            }
            if (String(id).charAt() == "#") {
                id = id.substring(1);
            }
            return this.el("use", {"xlink:href": "#" + id});
        } else {
            return Element.prototype.use.call(this);
        }
    };
    /*\
     * Paper.symbol
     [ method ]
     **
     * Creates a <symbol> element.
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     = (object) the `symbol` element
     **
    \*/
    proto.symbol = function (vx, vy, vw, vh) {
        var attr = {};
        if (vx != null && vy != null && vw != null && vh != null) {
            attr.viewBox = [vx, vy, vw, vh];
        }

        return this.el("symbol", attr);
    };
    /*\
     * Paper.text
     [ method ]
     **
     * Draws a text string
     **
     - x (number) x coordinate position
     - y (number) y coordinate position
     - text (string|array) The text string to draw or array of strings to nest within separate `<tspan>` elements
     = (object) the `text` element
     **
     > Usage
     | var t1 = paper.text(50, 50, "Snap");
     | var t2 = paper.text(50, 50, ["S","n","a","p"]);
     | // Text path usage
     | t1.attr({textpath: "M10,10L100,100"});
     | // or
     | var pth = paper.path("M10,10L100,100");
     | t1.attr({textpath: pth});
    \*/
    proto.text = function (x, y, text) {
        var attr = {};
        if (is(x, "object")) {
            attr = x;
        } else if (x != null) {
            attr = {
                x: x,
                y: y,
                text: text || ""
            };
        }
        return this.el("text", attr);
    };
    /*\
     * Paper.line
     [ method ]
     **
     * Draws a line
     **
     - x1 (number) x coordinate position of the start
     - y1 (number) y coordinate position of the start
     - x2 (number) x coordinate position of the end
     - y2 (number) y coordinate position of the end
     = (object) the `line` element
     **
     > Usage
     | var t1 = paper.line(50, 50, 100, 100);
    \*/
    proto.line = function (x1, y1, x2, y2) {
        var attr = {};
        if (is(x1, "object")) {
            attr = x1;
        } else if (x1 != null) {
            attr = {
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2
            };
        }
        return this.el("line", attr);
    };
    /*\
     * Paper.polyline
     [ method ]
     **
     * Draws a polyline
     **
     - points (array) array of points
     * or
     - varargs (…) points
     = (object) the `polyline` element
     **
     > Usage
     | var p1 = paper.polyline([10, 10, 100, 100]);
     | var p2 = paper.polyline(10, 10, 100, 100);
    \*/
    proto.polyline = function (points) {
        if (arguments.length > 1) {
            points = Array.prototype.slice.call(arguments, 0);
        }
        var attr = {};
        if (is(points, "object") && !is(points, "array")) {
            attr = points;
        } else if (points != null) {
            attr = {points: points};
        }
        return this.el("polyline", attr);
    };
    /*\
     * Paper.polygon
     [ method ]
     **
     * Draws a polygon. See @Paper.polyline
    \*/
    proto.polygon = function (points) {
        if (arguments.length > 1) {
            points = Array.prototype.slice.call(arguments, 0);
        }
        var attr = {};
        if (is(points, "object") && !is(points, "array")) {
            attr = points;
        } else if (points != null) {
            attr = {points: points};
        }
        return this.el("polygon", attr);
    };
    // gradients
    (function () {
        var $ = Snap._.$;
        // gradients' helpers
        function Gstops() {
            return this.selectAll("stop");
        }
        function GaddStop(color, offset) {
            var stop = $("stop"),
                attr = {
                    offset: +offset + "%"
                };
            color = Snap.color(color);
            attr["stop-color"] = color.hex;
            if (color.opacity < 1) {
                attr["stop-opacity"] = color.opacity;
            }
            $(stop, attr);
            this.node.appendChild(stop);
            return this;
        }
        function GgetBBox() {
            if (this.type == "linearGradient") {
                var x1 = $(this.node, "x1") || 0,
                    x2 = $(this.node, "x2") || 1,
                    y1 = $(this.node, "y1") || 0,
                    y2 = $(this.node, "y2") || 0;
                return Snap._.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
            } else {
                var cx = this.node.cx || .5,
                    cy = this.node.cy || .5,
                    r = this.node.r || 0;
                return Snap._.box(cx - r, cy - r, r * 2, r * 2);
            }
        }
        function gradient(defs, str) {
            var grad = eve("snap.util.grad.parse", null, str).firstDefined(),
                el;
            if (!grad) {
                return null;
            }
            grad.params.unshift(defs);
            if (grad.type.toLowerCase() == "l") {
                el = gradientLinear.apply(0, grad.params);
            } else {
                el = gradientRadial.apply(0, grad.params);
            }
            if (grad.type != grad.type.toLowerCase()) {
                $(el.node, {
                    gradientUnits: "userSpaceOnUse"
                });
            }
            var stops = grad.stops,
                len = stops.length,
                start = 0,
                j = 0;
            function seed(i, end) {
                var step = (end - start) / (i - j);
                for (var k = j; k < i; k++) {
                    stops[k].offset = +(+start + step * (k - j)).toFixed(2);
                }
                j = i;
                start = end;
            }
            len--;
            for (var i = 0; i < len; i++) if ("offset" in stops[i]) {
                seed(i, stops[i].offset);
            }
            stops[len].offset = stops[len].offset || 100;
            seed(len, stops[len].offset);
            for (i = 0; i <= len; i++) {
                var stop = stops[i];
                el.addStop(stop.color, stop.offset);
            }
            return el;
        }
        function gradientLinear(defs, x1, y1, x2, y2) {
            var el = Snap._.make("linearGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (x1 != null) {
                $(el.node, {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2
                });
            }
            return el;
        }
        function gradientRadial(defs, cx, cy, r, fx, fy) {
            var el = Snap._.make("radialGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (cx != null) {
                $(el.node, {
                    cx: cx,
                    cy: cy,
                    r: r
                });
            }
            if (fx != null && fy != null) {
                $(el.node, {
                    fx: fx,
                    fy: fy
                });
            }
            return el;
        }
        /*\
         * Paper.gradient
         [ method ]
         **
         * Creates a gradient element
         **
         - gradient (string) gradient descriptor
         > Gradient Descriptor
         * The gradient descriptor is an expression formatted as
         * follows: `<type>(<coords>)<colors>`.  The `<type>` can be
         * either linear or radial.  The uppercase `L` or `R` letters
         * indicate absolute coordinates offset from the SVG surface.
         * Lowercase `l` or `r` letters indicate coordinates
         * calculated relative to the element to which the gradient is
         * applied.  Coordinates specify a linear gradient vector as
         * `x1`, `y1`, `x2`, `y2`, or a radial gradient as `cx`, `cy`,
         * `r` and optional `fx`, `fy` specifying a focal point away
         * from the center of the circle. Specify `<colors>` as a list
         * of dash-separated CSS color values.  Each color may be
         * followed by a custom offset value, separated with a colon
         * character.
         > Examples
         * Linear gradient, relative from top-left corner to bottom-right
         * corner, from black through red to white:
         | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
         * Linear gradient, absolute from (0, 0) to (100, 100), from black
         * through red at 25% to white:
         | var g = paper.gradient("L(0, 0, 100, 100)#000-#f00:25-#fff");
         * Radial gradient, relative from the center of the element with radius
         * half the width, from black to white:
         | var g = paper.gradient("r(0.5, 0.5, 0.5)#000-#fff");
         * To apply the gradient:
         | paper.circle(50, 50, 40).attr({
         |     fill: g
         | });
         = (object) the `gradient` element
        \*/
        proto.gradient = function (str) {
            return gradient(this.defs, str);
        };
        proto.gradientLinear = function (x1, y1, x2, y2) {
            return gradientLinear(this.defs, x1, y1, x2, y2);
        };
        proto.gradientRadial = function (cx, cy, r, fx, fy) {
            return gradientRadial(this.defs, cx, cy, r, fx, fy);
        };
        /*\
         * Paper.toString
         [ method ]
         **
         * Returns SVG code for the @Paper
         = (string) SVG code for the @Paper
        \*/
        proto.toString = function () {
            var doc = this.node.ownerDocument,
                f = doc.createDocumentFragment(),
                d = doc.createElement("div"),
                svg = this.node.cloneNode(true),
                res;
            f.appendChild(d);
            d.appendChild(svg);
            Snap._.$(svg, {xmlns: "http://www.w3.org/2000/svg"});
            res = d.innerHTML;
            f.removeChild(f.firstChild);
            return res;
        };
        /*\
         * Paper.toDataURL
         [ method ]
         **
         * Returns SVG code for the @Paper as Data URI string.
         = (string) Data URI string
        \*/
        proto.toDataURL = function () {
            if (window && window.btoa) {
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(this)));
            }
        };
        /*\
         * Paper.clear
         [ method ]
         **
         * Removes all child nodes of the paper, except <defs>.
        \*/
        proto.clear = function () {
            var node = this.node.firstChild,
                next;
            while (node) {
                next = node.nextSibling;
                if (node.tagName != "defs") {
                    node.parentNode.removeChild(node);
                } else {
                    proto.clear.call({node: node});
                }
                node = next;
            }
        };
    }());
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
        is = Snap.is,
        clone = Snap._.clone,
        has = "hasOwnProperty",
        p2s = /,?([a-z]),?/gi,
        toFloat = parseFloat,
        math = Math,
        PI = math.PI,
        mmin = math.min,
        mmax = math.max,
        pow = math.pow,
        abs = math.abs;
    function paths(ps) {
        var p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100
            };
        }
        setTimeout(function () {
            for (var key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    }
    function box(x, y, width, height) {
        if (x == null) {
            x = y = width = height = 0;
        }
        if (y == null) {
            y = x.y;
            width = x.width;
            height = x.height;
            x = x.x;
        }
        return {
            x: x,
            y: y,
            width: width,
            w: width,
            height: height,
            h: height,
            x2: x + width,
            y2: y + height,
            cx: x + width / 2,
            cy: y + height / 2,
            r1: math.min(width, height) / 2,
            r2: math.max(width, height) / 2,
            r0: math.sqrt(width * width + height * height) / 2,
            path: rectPath(x, y, width, height),
            vb: [x, y, width, height].join(" ")
        };
    }
    function toString() {
        return this.join(",").replace(p2s, "$1");
    }
    function pathClone(pathArray) {
        var res = clone(pathArray);
        res.toString = toString;
        return res;
    }
    function getPointAtSegmentLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y,
                getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    }
    function getLengthFactory(istotal, subpath) {
        function O(val) {
            return +(+val).toFixed(3);
        }
        return Snap._.cacher(function (path, length, onlystart) {
            if (path instanceof Element) {
                path = path.attr("d");
            }
            path = path2curve(path);
            var x, y, p, l, sp = "", subpaths = {}, point,
                len = 0;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            sp += [
                                "C" + O(point.start.x),
                                O(point.start.y),
                                O(point.m.x),
                                O(point.m.y),
                                O(point.x),
                                O(point.y)
                            ];
                            if (onlystart) {return sp;}
                            subpaths.start = sp;
                            sp = [
                                "M" + O(point.x),
                                O(point.y) + "C" + O(point.n.x),
                                O(point.n.y),
                                O(point.end.x),
                                O(point.end.y),
                                O(p[5]),
                                O(p[6])
                            ].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            return point;
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ? len : subpath ? subpaths : findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            return point;
        }, null, Snap._.clone);
    }
    var getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);
    function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
            mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = (90 - math.atan2(mx - nx, my - ny) * 180 / PI);
        // (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha
        };
    }
    function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!Snap.is(p1x, "array")) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        var bbox = curveDim.apply(null, p1x);
        return box(
            bbox.min.x,
            bbox.min.y,
            bbox.max.x - bbox.min.x,
            bbox.max.y - bbox.min.y
        );
    }
    function isPointInsideBBox(bbox, x, y) {
        return  x >= bbox.x &&
                x <= bbox.x + bbox.width &&
                y >= bbox.y &&
                y <= bbox.y + bbox.height;
    }
    function isBBoxIntersect(bbox1, bbox2) {
        bbox1 = box(bbox1);
        bbox2 = box(bbox2);
        return isPointInsideBBox(bbox2, bbox1.x, bbox1.y)
            || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y)
            || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2)
            || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2)
            || isPointInsideBBox(bbox1, bbox2.x, bbox2.y)
            || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y)
            || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2)
            || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2)
            || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x
                || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
            && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y
                || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    }
    function base3(t, p1, p2, p3, p4) {
        var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }
    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        var z2 = z / 2,
            n = 12,
            Tvalues = [-.1252,.1252,-.3678,.3678,-.5873,.5873,-.7699,.7699,-.9041,.9041,-.9816,.9816],
            Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
            sum = 0;
        for (var i = 0; i < n; i++) {
            var ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * math.sqrt(comb);
        }
        return z2 * sum;
    }
    function getTotLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        var t = 1,
            step = t / 2,
            t2 = t - step,
            l,
            e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }
    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
            denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        var px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }
    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }
    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }
    function interHelper(bez1, bez2, justCount) {
        var bbox1 = bezierBBox(bez1),
            bbox2 = bezierBBox(bez2);
        if (!isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        var l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = ~~(l1 / 8),
            n2 = ~~(l2 / 8),
            dots1 = [],
            dots2 = [],
            xy = {},
            res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; i++) {
            var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; i++) {
            p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; i++) {
            for (var j = 0; j < n2; j++) {
                var di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: t1,
                                t2: t2
                            });
                        }
                    }
                }
            }
        }
        return res;
    }
    function pathIntersection(path1, path2) {
        return interPathHelper(path1, path2);
    }
    function pathIntersectionNumber(path1, path2) {
        return interPathHelper(path1, path2, 1);
    }
    function interPathHelper(path1, path2, justCount) {
        path1 = path2curve(path1);
        path2 = path2curve(path2);
        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        for (var i = 0, ii = path1.length; i < ii; i++) {
            var pi = path1[i];
            if (pi[0] == "M") {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == "C") {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                for (var j = 0, jj = path2.length; j < jj; j++) {
                    var pj = path2[j];
                    if (pj[0] == "M") {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == "C") {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        var intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            for (var k = 0, kk = intr.length; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }
    function isPointInsidePath(path, x, y) {
        var bbox = pathBBox(path);
        return isPointInsideBBox(bbox, x, y) &&
               interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
    }
    function pathBBox(path) {
        var pth = paths(path);
        if (pth.bbox) {
            return clone(pth.bbox);
        }
        if (!path) {
            return box();
        }
        path = path2curve(path);
        var x = 0, 
            y = 0,
            X = [],
            Y = [],
            p;
        for (var i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X.concat(dim.min.x, dim.max.x);
                Y = Y.concat(dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        var xmin = mmin.apply(0, X),
            ymin = mmin.apply(0, Y),
            xmax = mmax.apply(0, X),
            ymax = mmax.apply(0, Y),
            bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
        pth.bbox = clone(bb);
        return bb;
    }
    function rectPath(x, y, w, h, r) {
        if (r) {
            return [
                ["M", +x + (+r), y],
                ["l", w - r * 2, 0],
                ["a", r, r, 0, 0, 1, r, r],
                ["l", 0, h - r * 2],
                ["a", r, r, 0, 0, 1, -r, r],
                ["l", r * 2 - w, 0],
                ["a", r, r, 0, 0, 1, -r, -r],
                ["l", 0, r * 2 - h],
                ["a", r, r, 0, 0, 1, r, -r],
                ["z"]
            ];
        }
        var res = [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
        res.toString = toString;
        return res;
    }
    function ellipsePath(x, y, rx, ry, a) {
        if (a == null && ry == null) {
            ry = rx;
        }
        x = +x;
        y = +y;
        rx = +rx;
        ry = +ry;
        if (a != null) {
            var rad = Math.PI / 180,
                x1 = x + rx * Math.cos(-ry * rad),
                x2 = x + rx * Math.cos(-a * rad),
                y1 = y + rx * Math.sin(-ry * rad),
                y2 = y + rx * Math.sin(-a * rad),
                res = [["M", x1, y1], ["A", rx, rx, 0, +(a - ry > 180), 0, x2, y2]];
        } else {
            res = [
                ["M", x, y],
                ["m", 0, -ry],
                ["a", rx, ry, 0, 1, 1, 0, 2 * ry],
                ["a", rx, ry, 0, 1, 1, 0, -2 * ry],
                ["z"]
            ];
        }
        res.toString = toString;
        return res;
    }
    var unit2px = Snap._unit2px,
        getPath = {
        path: function (el) {
            return el.attr("path");
        },
        circle: function (el) {
            var attr = unit2px(el);
            return ellipsePath(attr.cx, attr.cy, attr.r);
        },
        ellipse: function (el) {
            var attr = unit2px(el);
            return ellipsePath(attr.cx || 0, attr.cy || 0, attr.rx, attr.ry);
        },
        rect: function (el) {
            var attr = unit2px(el);
            return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height, attr.rx, attr.ry);
        },
        image: function (el) {
            var attr = unit2px(el);
            return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
        },
        line: function (el) {
            return "M" + [el.attr("x1") || 0, el.attr("y1") || 0, el.attr("x2"), el.attr("y2")];
        },
        polyline: function (el) {
            return "M" + el.attr("points");
        },
        polygon: function (el) {
            return "M" + el.attr("points") + "z";
        },
        deflt: function (el) {
            var bbox = el.node.getBBox();
            return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
        }
    };
    function pathToRelative(pathArray) {
        var pth = paths(pathArray),
            lowerCase = String.prototype.toLowerCase;
        if (pth.rel) {
            return pathClone(pth.rel);
        }
        if (!Snap.is(pathArray, "array") || !Snap.is(pathArray && pathArray[0], "array")) {
            pathArray = Snap.parsePathString(pathArray);
        }
        var res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0;
        if (pathArray[0][0] == "M") {
            x = pathArray[0][1];
            y = pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res.push(["M", x, y]);
        }
        for (var i = start, ii = pathArray.length; i < ii; i++) {
            var r = res[i] = [],
                pa = pathArray[i];
            if (pa[0] != lowerCase.call(pa[0])) {
                r[0] = lowerCase.call(pa[0]);
                switch (r[0]) {
                    case "a":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] - x).toFixed(3);
                        r[7] = +(pa[7] - y).toFixed(3);
                        break;
                    case "v":
                        r[1] = +(pa[1] - y).toFixed(3);
                        break;
                    case "m":
                        mx = pa[1];
                        my = pa[2];
                    default:
                        for (var j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
                        }
                }
            } else {
                r = res[i] = [];
                if (pa[0] == "m") {
                    mx = pa[1] + x;
                    my = pa[2] + y;
                }
                for (var k = 0, kk = pa.length; k < kk; k++) {
                    res[i][k] = pa[k];
                }
            }
            var len = res[i].length;
            switch (res[i][0]) {
                case "z":
                    x = mx;
                    y = my;
                    break;
                case "h":
                    x += +res[i][len - 1];
                    break;
                case "v":
                    y += +res[i][len - 1];
                    break;
                default:
                    x += +res[i][len - 2];
                    y += +res[i][len - 1];
            }
        }
        res.toString = toString;
        pth.rel = pathClone(res);
        return res;
    }
    function pathToAbsolute(pathArray) {
        var pth = paths(pathArray);
        if (pth.abs) {
            return pathClone(pth.abs);
        }
        if (!is(pathArray, "array") || !is(pathArray && pathArray[0], "array")) { // rough assumption
            pathArray = Snap.parsePathString(pathArray);
        }
        if (!pathArray || !pathArray.length) {
            return [["M", 0, 0]];
        }
        var res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0,
            pa0;
        if (pathArray[0][0] == "M") {
            x = +pathArray[0][1];
            y = +pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res[0] = ["M", x, y];
        }
        var crz = pathArray.length == 3 &&
            pathArray[0][0] == "M" &&
            pathArray[1][0].toUpperCase() == "R" &&
            pathArray[2][0].toUpperCase() == "Z";
        for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
            res.push(r = []);
            pa = pathArray[i];
            pa0 = pa[0];
            if (pa0 != pa0.toUpperCase()) {
                r[0] = pa0.toUpperCase();
                switch (r[0]) {
                    case "A":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +pa[6] + x;
                        r[7] = +pa[7] + y;
                        break;
                    case "V":
                        r[1] = +pa[1] + y;
                        break;
                    case "H":
                        r[1] = +pa[1] + x;
                        break;
                    case "R":
                        var dots = [x, y].concat(pa.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        res.pop();
                        res = res.concat(catmullRom2bezier(dots, crz));
                        break;
                    case "O":
                        res.pop();
                        dots = ellipsePath(x, y, pa[1], pa[2]);
                        dots.push(dots[0]);
                        res = res.concat(dots);
                        break;
                    case "U":
                        res.pop();
                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                        r = ["U"].concat(res[res.length - 1].slice(-2));
                        break;
                    case "M":
                        mx = +pa[1] + x;
                        my = +pa[2] + y;
                    default:
                        for (j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +pa[j] + ((j % 2) ? x : y);
                        }
                }
            } else if (pa0 == "R") {
                dots = [x, y].concat(pa.slice(1));
                res.pop();
                res = res.concat(catmullRom2bezier(dots, crz));
                r = ["R"].concat(pa.slice(-2));
            } else if (pa0 == "O") {
                res.pop();
                dots = ellipsePath(x, y, pa[1], pa[2]);
                dots.push(dots[0]);
                res = res.concat(dots);
            } else if (pa0 == "U") {
                res.pop();
                res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                r = ["U"].concat(res[res.length - 1].slice(-2));
            } else {
                for (var k = 0, kk = pa.length; k < kk; k++) {
                    r[k] = pa[k];
                }
            }
            pa0 = pa0.toUpperCase();
            if (pa0 != "O") {
                switch (r[0]) {
                    case "Z":
                        x = +mx;
                        y = +my;
                        break;
                    case "H":
                        x = r[1];
                        break;
                    case "V":
                        y = r[1];
                        break;
                    case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
        }
        res.toString = toString;
        pth.abs = pathClone(res);
        return res;
    }
    function l2c(x1, y1, x2, y2) {
        return [x1, y1, x2, y2, x2, y2];
    }
    function q2c(x1, y1, ax, ay, x2, y2) {
        var _13 = 1 / 3,
            _23 = 2 / 3;
        return [
                _13 * x1 + _23 * ax,
                _13 * y1 + _23 * ay,
                _13 * x2 + _23 * ax,
                _13 * y2 + _23 * ay,
                x2,
                y2
            ];
    }
    function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
        // for more information of where this math came from visit:
        // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
        var _120 = PI * 120 / 180,
            rad = PI / 180 * (+angle || 0),
            res = [],
            xy,
            rotate = Snap._.cacher(function (x, y, rad) {
                var X = x * math.cos(rad) - y * math.sin(rad),
                    Y = x * math.sin(rad) + y * math.cos(rad);
                return {x: X, y: Y};
            });
        if (!recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            var cos = math.cos(PI / 180 * angle),
                sin = math.sin(PI / 180 * angle),
                x = (x1 - x2) / 2,
                y = (y1 - y2) / 2;
            var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (h > 1) {
                h = math.sqrt(h);
                rx = h * rx;
                ry = h * ry;
            }
            var rx2 = rx * rx,
                ry2 = ry * ry,
                k = (large_arc_flag == sweep_flag ? -1 : 1) *
                    math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                cx = k * rx * y / ry + (x1 + x2) / 2,
                cy = k * -ry * x / rx + (y1 + y2) / 2,
                f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
                f2 = math.asin(((y2 - cy) / ry).toFixed(9));

            f1 = x1 < cx ? PI - f1 : f1;
            f2 = x2 < cx ? PI - f2 : f2;
            f1 < 0 && (f1 = PI * 2 + f1);
            f2 < 0 && (f2 = PI * 2 + f2);
            if (sweep_flag && f1 > f2) {
                f1 = f1 - PI * 2;
            }
            if (!sweep_flag && f2 > f1) {
                f2 = f2 - PI * 2;
            }
        } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
        }
        var df = f2 - f1;
        if (abs(df) > _120) {
            var f2old = f2,
                x2old = x2,
                y2old = y2;
            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
            x2 = cx + rx * math.cos(f2);
            y2 = cy + ry * math.sin(f2);
            res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
        }
        df = f2 - f1;
        var c1 = math.cos(f1),
            s1 = math.sin(f1),
            c2 = math.cos(f2),
            s2 = math.sin(f2),
            t = math.tan(df / 4),
            hx = 4 / 3 * rx * t,
            hy = 4 / 3 * ry * t,
            m1 = [x1, y1],
            m2 = [x1 + hx * s1, y1 - hy * c1],
            m3 = [x2 + hx * s2, y2 - hy * c2],
            m4 = [x2, y2];
        m2[0] = 2 * m1[0] - m2[0];
        m2[1] = 2 * m1[1] - m2[1];
        if (recursive) {
            return [m2, m3, m4].concat(res);
        } else {
            res = [m2, m3, m4].concat(res).join().split(",");
            var newres = [];
            for (var i = 0, ii = res.length; i < ii; i++) {
                newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
            }
            return newres;
        }
    }
    function findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t;
        return {
            x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
            y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
        };
    }
    
    // Returns bounding box of cubic bezier curve.
    // Source: http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
    // Original version: NISHIO Hirokazu
    // Modifications: https://github.com/timo22345
    function curveDim(x0, y0, x1, y1, x2, y2, x3, y3) {
        var tvalues = [],
            bounds = [[], []],
            a, b, c, t, t1, t2, b2ac, sqrtb2ac;
        for (var i = 0; i < 2; ++i) {
            if (i == 0) {
                b = 6 * x0 - 12 * x1 + 6 * x2;
                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * x0;
            } else {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }
            if (abs(a) < 1e-12) {
                if (abs(b) < 1e-12) {
                    continue;
                }
                t = -c / b;
                if (0 < t && t < 1) {
                    tvalues.push(t);
                }
                continue;
            }
            b2ac = b * b - 4 * c * a;
            sqrtb2ac = math.sqrt(b2ac);
            if (b2ac < 0) {
                continue;
            }
            t1 = (-b + sqrtb2ac) / (2 * a);
            if (0 < t1 && t1 < 1) {
                tvalues.push(t1);
            }
            t2 = (-b - sqrtb2ac) / (2 * a);
            if (0 < t2 && t2 < 1) {
                tvalues.push(t2);
            }
        }

        var x, y, j = tvalues.length,
            jlen = j,
            mt;
        while (j--) {
            t = tvalues[j];
            mt = 1 - t;
            bounds[0][j] = (mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) + (t * t * t * x3);
            bounds[1][j] = (mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) + (t * t * t * y3);
        }

        bounds[0][jlen] = x0;
        bounds[1][jlen] = y0;
        bounds[0][jlen + 1] = x3;
        bounds[1][jlen + 1] = y3;
        bounds[0].length = bounds[1].length = jlen + 2;


        return {
          min: {x: mmin.apply(0, bounds[0]), y: mmin.apply(0, bounds[1])},
          max: {x: mmax.apply(0, bounds[0]), y: mmax.apply(0, bounds[1])}
        };
    }

    function path2curve(path, path2) {
        var pth = !path2 && paths(path);
        if (!path2 && pth.curve) {
            return pathClone(pth.curve);
        }
        var p = pathToAbsolute(path),
            p2 = path2 && pathToAbsolute(path2),
            attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            processPath = function (path, d, pcom) {
                var nx, ny;
                if (!path) {
                    return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
                }
                !(path[0] in {T: 1, Q: 1}) && (d.qx = d.qy = null);
                switch (path[0]) {
                    case "M":
                        d.X = path[1];
                        d.Y = path[2];
                        break;
                    case "A":
                        path = ["C"].concat(a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
                        break;
                    case "S":
                        if (pcom == "C" || pcom == "S") { // In "S" case we have to take into account, if the previous command is C/S.
                            nx = d.x * 2 - d.bx;          // And reflect the previous
                            ny = d.y * 2 - d.by;          // command's control point relative to the current point.
                        }
                        else {                            // or some else or nothing
                            nx = d.x;
                            ny = d.y;
                        }
                        path = ["C", nx, ny].concat(path.slice(1));
                        break;
                    case "T":
                        if (pcom == "Q" || pcom == "T") { // In "T" case we have to take into account, if the previous command is Q/T.
                            d.qx = d.x * 2 - d.qx;        // And make a reflection similar
                            d.qy = d.y * 2 - d.qy;        // to case "S".
                        }
                        else {                            // or something else or nothing
                            d.qx = d.x;
                            d.qy = d.y;
                        }
                        path = ["C"].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                        break;
                    case "Q":
                        d.qx = path[1];
                        d.qy = path[2];
                        path = ["C"].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                        break;
                    case "L":
                        path = ["C"].concat(l2c(d.x, d.y, path[1], path[2]));
                        break;
                    case "H":
                        path = ["C"].concat(l2c(d.x, d.y, path[1], d.y));
                        break;
                    case "V":
                        path = ["C"].concat(l2c(d.x, d.y, d.x, path[1]));
                        break;
                    case "Z":
                        path = ["C"].concat(l2c(d.x, d.y, d.X, d.Y));
                        break;
                }
                return path;
            },
            fixArc = function (pp, i) {
                if (pp[i].length > 7) {
                    pp[i].shift();
                    var pi = pp[i];
                    while (pi.length) {
                        pcoms1[i] = "A"; // if created multiple C:s, their original seg is saved
                        p2 && (pcoms2[i] = "A"); // the same as above
                        pp.splice(i++, 0, ["C"].concat(pi.splice(0, 6)));
                    }
                    pp.splice(i, 1);
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            fixM = function (path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                    path2.splice(i, 0, ["M", a2.x, a2.y]);
                    a1.bx = 0;
                    a1.by = 0;
                    a1.x = path1[i][1];
                    a1.y = path1[i][2];
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            pcoms1 = [], // path commands of original path p
            pcoms2 = [], // path commands of original path p2
            pfirst = "", // temporary holder for original path command
            pcom = ""; // holder for previous path command of original path
        for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
            p[i] && (pfirst = p[i][0]); // save current path command

            if (pfirst != "C") // C is not saved yet, because it may be result of conversion
            {
                pcoms1[i] = pfirst; // Save current path command
                i && ( pcom = pcoms1[i - 1]); // Get previous path command pcom
            }
            p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

            if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
            // which may produce multiple C:s
            // so we have to make sure that C is also C in original path

            fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1

            if (p2) { // the same procedures is done to p2
                p2[i] && (pfirst = p2[i][0]);
                if (pfirst != "C") {
                    pcoms2[i] = pfirst;
                    i && (pcom = pcoms2[i - 1]);
                }
                p2[i] = processPath(p2[i], attrs2, pcom);

                if (pcoms2[i] != "A" && pfirst == "C") {
                    pcoms2[i] = "C";
                }

                fixArc(p2, i);
            }
            fixM(p, p2, attrs, attrs2, i);
            fixM(p2, p, attrs2, attrs, i);
            var seg = p[i],
                seg2 = p2 && p2[i],
                seglen = seg.length,
                seg2len = p2 && seg2.length;
            attrs.x = seg[seglen - 2];
            attrs.y = seg[seglen - 1];
            attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
            attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
            attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
            attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
            attrs2.x = p2 && seg2[seg2len - 2];
            attrs2.y = p2 && seg2[seg2len - 1];
        }
        if (!p2) {
            pth.curve = pathClone(p);
        }
        return p2 ? [p, p2] : p;
    }
    function mapPath(path, matrix) {
        if (!matrix) {
            return path;
        }
        var x, y, i, j, ii, jj, pathi;
        path = path2curve(path);
        for (i = 0, ii = path.length; i < ii; i++) {
            pathi = path[i];
            for (j = 1, jj = pathi.length; j < jj; j += 2) {
                x = matrix.x(pathi[j], pathi[j + 1]);
                y = matrix.y(pathi[j], pathi[j + 1]);
                pathi[j] = x;
                pathi[j + 1] = y;
            }
        }
        return path;
    }

    // http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        var d = [];
        for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
            var p = [
                        {x: +crp[i - 2], y: +crp[i - 1]},
                        {x: +crp[i],     y: +crp[i + 1]},
                        {x: +crp[i + 2], y: +crp[i + 3]},
                        {x: +crp[i + 4], y: +crp[i + 5]}
                    ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push(["C",
                  (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                  (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                  (p[1].x + 6 * p[2].x - p[3].x) / 6,
                  (p[1].y + 6*p[2].y - p[3].y) / 6,
                  p[2].x,
                  p[2].y
            ]);
        }

        return d;
    }

    // export
    Snap.path = paths;

    /*\
     * Snap.path.getTotalLength
     [ method ]
     **
     * Returns the length of the given path in pixels
     **
     - path (string) SVG path string
     **
     = (number) length
    \*/
    Snap.path.getTotalLength = getTotalLength;
    /*\
     * Snap.path.getPointAtLength
     [ method ]
     **
     * Returns the coordinates of the point located at the given length along the given path
     **
     - path (string) SVG path string
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
    \*/
    Snap.path.getPointAtLength = getPointAtLength;
    /*\
     * Snap.path.getSubpath
     [ method ]
     **
     * Returns the subpath of a given path between given start and end lengths
     **
     - path (string) SVG path string
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
    \*/
    Snap.path.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        var a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };
    /*\
     * Element.getTotalLength
     [ method ]
     **
     * Returns the length of the path in pixels (only works for `path` elements)
     = (number) length
    \*/
    elproto.getTotalLength = function () {
        if (this.node.getTotalLength) {
            return this.node.getTotalLength();
        }
    };
    // SIERRA Element.getPointAtLength()/Element.getTotalLength(): If a <path> is broken into different segments, is the jump distance to the new coordinates set by the _M_ or _m_ commands calculated as part of the path's total length?
    /*\
     * Element.getPointAtLength
     [ method ]
     **
     * Returns coordinates of the point located at the given length on the given path (only works for `path` elements)
     **
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
    \*/
    elproto.getPointAtLength = function (length) {
        return getPointAtLength(this.attr("d"), length);
    };
    // SIERRA Element.getSubpath(): Similar to the problem for Element.getPointAtLength(). Unclear how this would work for a segmented path. Overall, the concept of _subpath_ and what I'm calling a _segment_ (series of non-_M_ or _Z_ commands) is unclear.
    /*\
     * Element.getSubpath
     [ method ]
     **
     * Returns subpath of a given element from given start and end lengths (only works for `path` elements)
     **
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
    \*/
    elproto.getSubpath = function (from, to) {
        return Snap.path.getSubpath(this.attr("d"), from, to);
    };
    Snap._.box = box;
    /*\
     * Snap.path.findDotsAtSegment
     [ method ]
     **
     * Utility method
     **
     * Finds dot coordinates on the given cubic beziér curve at the given t
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (object) point information in format:
     o {
     o     x: (number) x coordinate of the point,
     o     y: (number) y coordinate of the point,
     o     m: {
     o         x: (number) x coordinate of the left anchor,
     o         y: (number) y coordinate of the left anchor
     o     },
     o     n: {
     o         x: (number) x coordinate of the right anchor,
     o         y: (number) y coordinate of the right anchor
     o     },
     o     start: {
     o         x: (number) x coordinate of the start of the curve,
     o         y: (number) y coordinate of the start of the curve
     o     },
     o     end: {
     o         x: (number) x coordinate of the end of the curve,
     o         y: (number) y coordinate of the end of the curve
     o     },
     o     alpha: (number) angle of the curve derivative at the point
     o }
    \*/
    Snap.path.findDotsAtSegment = findDotsAtSegment;
    /*\
     * Snap.path.bezierBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given cubic beziér curve
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     * or
     - bez (array) array of six points for beziér curve
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
    \*/
    Snap.path.bezierBBox = bezierBBox;
    /*\
     * Snap.path.isPointInsideBBox
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside bounding box
     - bbox (string) bounding box
     - x (string) x coordinate of the point
     - y (string) y coordinate of the point
     = (boolean) `true` if point is inside
    \*/
    Snap.path.isPointInsideBBox = isPointInsideBBox;
    Snap.closest = function (x, y, X, Y) {
        var r = 100,
            b = box(x - r / 2, y - r / 2, r, r),
            inside = [],
            getter = X[0].hasOwnProperty("x") ? function (i) {
                return {
                    x: X[i].x,
                    y: X[i].y
                };
            } : function (i) {
                return {
                    x: X[i],
                    y: Y[i]
                };
            },
            found = 0;
        while (r <= 1e6 && !found) {
            for (var i = 0, ii = X.length; i < ii; i++) {
                var xy = getter(i);
                if (isPointInsideBBox(b, xy.x, xy.y)) {
                    found++;
                    inside.push(xy);
                    break;
                }
            }
            if (!found) {
                r *= 2;
                b = box(x - r / 2, y - r / 2, r, r)
            }
        }
        if (r == 1e6) {
            return;
        }
        var len = Infinity,
            res;
        for (i = 0, ii = inside.length; i < ii; i++) {
            var l = Snap.len(x, y, inside[i].x, inside[i].y);
            if (len > l) {
                len = l;
                inside[i].len = l;
                res = inside[i];
            }
        }
        return res;
    };
    /*\
     * Snap.path.isBBoxIntersect
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if two bounding boxes intersect
     - bbox1 (string) first bounding box
     - bbox2 (string) second bounding box
     = (boolean) `true` if bounding boxes intersect
    \*/
    Snap.path.isBBoxIntersect = isBBoxIntersect;
    /*\
     * Snap.path.intersection
     [ method ]
     **
     * Utility method
     **
     * Finds intersections of two paths
     - path1 (string) path string
     - path2 (string) path string
     = (array) dots of intersection
     o [
     o     {
     o         x: (number) x coordinate of the point,
     o         y: (number) y coordinate of the point,
     o         t1: (number) t value for segment of path1,
     o         t2: (number) t value for segment of path2,
     o         segment1: (number) order number for segment of path1,
     o         segment2: (number) order number for segment of path2,
     o         bez1: (array) eight coordinates representing beziér curve for the segment of path1,
     o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
     o     }
     o ]
    \*/
    Snap.path.intersection = pathIntersection;
    Snap.path.intersectionNumber = pathIntersectionNumber;
    /*\
     * Snap.path.isPointInside
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside a given closed path.
     *
     * Note: fill mode doesn’t affect the result of this method.
     - path (string) path string
     - x (number) x of the point
     - y (number) y of the point
     = (boolean) `true` if point is inside the path
    \*/
    Snap.path.isPointInside = isPointInsidePath;
    /*\
     * Snap.path.getBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given path
     - path (string) path string
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
    \*/
    Snap.path.getBBox = pathBBox;
    Snap.path.get = getPath;
    /*\
     * Snap.path.toRelative
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into relative values
     - path (string) path string
     = (array) path string
    \*/
    Snap.path.toRelative = pathToRelative;
    /*\
     * Snap.path.toAbsolute
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into absolute values
     - path (string) path string
     = (array) path string
    \*/
    Snap.path.toAbsolute = pathToAbsolute;
    /*\
     * Snap.path.toCubic
     [ method ]
     **
     * Utility method
     **
     * Converts path to a new path where all segments are cubic beziér curves
     - pathString (string|array) path string or array of segments
     = (array) array of segments
    \*/
    Snap.path.toCubic = path2curve;
    /*\
     * Snap.path.map
     [ method ]
     **
     * Transform the path string with the given matrix
     - path (string) path string
     - matrix (object) see @Matrix
     = (string) transformed path string
    \*/
    Snap.path.map = mapPath;
    Snap.path.toString = toString;
    Snap.path.clone = pathClone;
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var mmax = Math.max,
        mmin = Math.min;

    // Set
    var Set = function (items) {
        this.items = [];
	this.bindings = {};
        this.length = 0;
        this.type = "set";
        if (items) {
            for (var i = 0, ii = items.length; i < ii; i++) {
                if (items[i]) {
                    this[this.items.length] = this.items[this.items.length] = items[i];
                    this.length++;
                }
            }
        }
    },
    setproto = Set.prototype;
    /*\
     * Set.push
     [ method ]
     **
     * Adds each argument to the current set
     = (object) original element
    \*/
    setproto.push = function () {
        var item,
            len;
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            item = arguments[i];
            if (item) {
                len = this.items.length;
                this[len] = this.items[len] = item;
                this.length++;
            }
        }
        return this;
    };
    /*\
     * Set.pop
     [ method ]
     **
     * Removes last element and returns it
     = (object) element
    \*/
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    /*\
     * Set.forEach
     [ method ]
     **
     * Executes given function for each element in the set
     *
     * If the function returns `false`, the loop stops running.
     **
     - callback (function) function to run
     - thisArg (object) context object for the callback
     = (object) Set object
    \*/
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    /*\
     * Set.animate
     [ method ]
     **
     * Animates each element in set in sync.
     *
     **
     - attrs (object) key-value pairs of destination attributes
     - duration (number) duration of the animation in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function that executes when the animation ends
     * or
     - animation (array) array of animation parameter for each element in set in format `[attrs, duration, easing, callback]`
     > Usage
     | // animate all elements in set to radius 10
     | set.animate({r: 10}, 500, mina.easein);
     | // or
     | // animate first element to radius 10, but second to radius 20 and in different time
     | set.animate([{r: 10}, 500, mina.easein], [{r: 20}, 1500, mina.easein]);
     = (Element) the current element
    \*/
    setproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Snap._.Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = easing.dur;
            attrs = attrs.attr;
        }
        var args = arguments;
        if (Snap.is(attrs, "array") && Snap.is(args[args.length - 1], "array")) {
            var each = true;
        }
        var begin,
            handler = function () {
                if (begin) {
                    this.b = begin;
                } else {
                    begin = this.b;
                }
            },
            cb = 0,
            set = this,
            callbacker = callback && function () {
                if (++cb == set.length) {
                    callback.call(this);
                }
            };
        return this.forEach(function (el, i) {
            eve.once("snap.animcreated." + el.id, handler);
            if (each) {
                args[i] && el.animate.apply(el, args[i]);
            } else {
                el.animate(attrs, ms, easing, callbacker);
            }
        });
    };
    setproto.remove = function () {
        while (this.length) {
            this.pop().remove();
        }
        return this;
    };
    /*\
     * Set.bind
     [ method ]
     **
     * Specifies how to handle a specific attribute when applied
     * to a set.
     *
     **
     - attr (string) attribute name
     - callback (function) function to run
     * or
     - attr (string) attribute name
     - element (Element) specific element in the set to apply the attribute to
     * or
     - attr (string) attribute name
     - element (Element) specific element in the set to apply the attribute to
     - eattr (string) attribute on the element to bind the attribute to
     = (object) Set object
    \*/
    setproto.bind = function (attr, a, b) {
        var data = {};
        if (typeof a == "function") {
            this.bindings[attr] = a;
        } else {
            var aname = b || attr;
            this.bindings[attr] = function (v) {
                data[aname] = v;
                a.attr(data);
            };
        }
        return this;
    };
    setproto.attr = function (value) {
        var unbound = {};
        for (var k in value) {
            if (this.bindings[k]) {
                this.bindings[k](value[k]);
            } else {
                unbound[k] = value[k];
            }
        }
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            this.items[i].attr(unbound);
        }
        return this;
    };
    /*\
     * Set.clear
     [ method ]
     **
     * Removes all elements from the set
    \*/
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    /*\
     * Set.splice
     [ method ]
     **
     * Removes range of elements from the set
     **
     - index (number) position of the deletion
     - count (number) number of element to remove
     - insertion… (object) #optional elements to insert
     = (object) set elements that were deleted
    \*/
    setproto.splice = function (index, count, insertion) {
        index = index < 0 ? mmax(this.length + index, 0) : index;
        count = mmax(0, mmin(this.length - index, count));
        var tail = [],
            todel = [],
            args = [],
            i;
        for (i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (i = 0; i < count; i++) {
            todel.push(this[index + i]);
        }
        for (; i < this.length - index; i++) {
            tail.push(this[index + i]);
        }
        var arglen = args.length;
        for (i = 0; i < arglen + tail.length; i++) {
            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= count - arglen;
        while (this[i]) {
            delete this[i++];
        }
        return new Set(todel);
    };
    /*\
     * Set.exclude
     [ method ]
     **
     * Removes given element from the set
     **
     - element (object) element to remove
     = (boolean) `true` if object was found and removed from the set
    \*/
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
        return false;
    };
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    setproto.getBBox = function () {
        var x = [],
            y = [],
            x2 = [],
            y2 = [];
        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
            var box = this.items[i].getBBox();
            x.push(box.x);
            y.push(box.y);
            x2.push(box.x + box.width);
            y2.push(box.y + box.height);
        }
        x = mmin.apply(0, x);
        y = mmin.apply(0, y);
        x2 = mmax.apply(0, x2);
        y2 = mmax.apply(0, y2);
        return {
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y,
            cx: x + (x2 - x) / 2,
            cy: y + (y2 - y) / 2
        };
    };
    setproto.clone = function (s) {
        s = new Set;
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    setproto.toString = function () {
        return "Snap\u2018s set";
    };
    setproto.type = "set";
    // export
    Snap.Set = Set;
    Snap.set = function () {
        var set = new Set;
        if (arguments.length) {
            set.push.apply(set, Array.prototype.slice.call(arguments, 0));
        }
        return set;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var names = {},
        reUnit = /[a-z]+$/i,
        Str = String;
    names.stroke = names.fill = "colour";
    function getEmpty(item) {
        var l = item[0];
        switch (l.toLowerCase()) {
            case "t": return [l, 0, 0];
            case "m": return [l, 1, 0, 0, 1, 0, 0];
            case "r": if (item.length == 4) {
                return [l, 0, item[2], item[3]];
            } else {
                return [l, 0];
            }
            case "s": if (item.length == 5) {
                return [l, 1, 1, item[3], item[4]];
            } else if (item.length == 3) {
                return [l, 1, 1];
            } else {
                return [l, 1];
            }
        }
    }
    function equaliseTransform(t1, t2, getBBox) {
        t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
        t1 = Snap.parseTransformString(t1) || [];
        t2 = Snap.parseTransformString(t2) || [];
        var maxlength = Math.max(t1.length, t2.length),
            from = [],
            to = [],
            i = 0, j, jj,
            tt1, tt2;
        for (; i < maxlength; i++) {
            tt1 = t1[i] || getEmpty(t2[i]);
            tt2 = t2[i] || getEmpty(tt1);
            if ((tt1[0] != tt2[0]) ||
                (tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
                ) {
                    t1 = Snap._.transform2matrix(t1, getBBox());
                    t2 = Snap._.transform2matrix(t2, getBBox());
                    from = [["m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f]];
                    to = [["m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f]];
                    break;
            }
            from[i] = [];
            to[i] = [];
            for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
                j in tt1 && (from[i][j] = tt1[j]);
                j in tt2 && (to[i][j] = tt2[j]);
            }
        }
        return {
            from: path2array(from),
            to: path2array(to),
            f: getPath(from)
        };
    }
    function getNumber(val) {
        return val;
    }
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }
    function getViewBox(val) {
        return val.join(" ");
    }
    function getColour(clr) {
        return Snap.rgb(clr[0], clr[1], clr[2]);
    }
    function getPath(path) {
        var k = 0, i, ii, j, jj, out, a, b = [];
        for (i = 0, ii = path.length; i < ii; i++) {
            out = "[";
            a = ['"' + path[i][0] + '"'];
            for (j = 1, jj = path[i].length; j < jj; j++) {
                a[j] = "val[" + (k++) + "]";
            }
            out += a + "]";
            b[i] = out;
        }
        return Function("val", "return Snap.path.toString.call([" + b + "])");
    }
    function path2array(path) {
        var out = [];
        for (var i = 0, ii = path.length; i < ii; i++) {
            for (var j = 1, jj = path[i].length; j < jj; j++) {
                out.push(path[i][j]);
            }
        }
        return out;
    }
    function isNumeric(obj) {
        return isFinite(parseFloat(obj));
    }
    function arrayEqual(arr1, arr2) {
        if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
            return false;
        }
        return arr1.toString() == arr2.toString();
    }
    Element.prototype.equal = function (name, b) {
        return eve("snap.util.equal", this, name, b).firstDefined();
    };
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this;
        if (isNumeric(a) && isNumeric(b)) {
            return {
                from: parseFloat(a),
                to: parseFloat(b),
                f: getNumber
            };
        }
        if (names[name] == "colour") {
            A = Snap.color(a);
            B = Snap.color(b);
            return {
                from: [A.r, A.g, A.b, A.opacity],
                to: [B.r, B.g, B.b, B.opacity],
                f: getColour
            };
        }
        if (name == "viewBox") {
            A = this.attr(name).vb.split(" ").map(Number);
            B = b.split(" ").map(Number);
            return {
                from: A,
                to: B,
                f: getViewBox
            };
        }
        if (name == "transform" || name == "gradientTransform" || name == "patternTransform") {
            if (b instanceof Snap.Matrix) {
                b = b.toTransformString();
            }
            if (!Snap._.rgTransform.test(b)) {
                b = Snap._.svgTransform2string(b);
            }
            return equaliseTransform(a, b, function () {
                return el.getBBox(1);
            });
        }
        if (name == "d" || name == "path") {
            A = Snap.path.toCubic(a, b);
            return {
                from: path2array(A[0]),
                to: path2array(A[1]),
                f: getPath(A[0])
            };
        }
        if (name == "points") {
            A = Str(a).split(Snap._.separator);
            B = Str(b).split(Snap._.separator);
            return {
                from: A,
                to: B,
                f: function (val) { return val; }
            };
        }
        var aUnit = a.match(reUnit),
            bUnit = Str(b).match(reUnit);
        if (aUnit && arrayEqual(aUnit, bUnit)) {
            return {
                from: parseFloat(a),
                to: parseFloat(b),
                f: getUnit(aUnit)
            };
        } else {
            return {
                from: this.asPX(name),
                to: this.asPX(name, b),
                f: getNumber
            };
        }
    });
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
    has = "hasOwnProperty",
    supportsTouch = "createTouch" in glob.doc,
    events = [
        "click", "dblclick", "mousedown", "mousemove", "mouseout",
        "mouseover", "mouseup", "touchstart", "touchmove", "touchend",
        "touchcancel"
    ],
    touchMap = {
        mousedown: "touchstart",
        mousemove: "touchmove",
        mouseup: "touchend"
    },
    getScroll = function (xy, el) {
        var name = xy == "y" ? "scrollTop" : "scrollLeft",
            doc = el && el.node ? el.node.ownerDocument : glob.doc;
        return doc[name in doc.documentElement ? "documentElement" : "body"][name];
    },
    preventDefault = function () {
        this.returnValue = false;
    },
    preventTouch = function () {
        return this.originalEvent.preventDefault();
    },
    stopPropagation = function () {
        this.cancelBubble = true;
    },
    stopTouch = function () {
        return this.originalEvent.stopPropagation();
    },
    addEvent = function (obj, type, fn, element) {
        var realName = supportsTouch && touchMap[type] ? touchMap[type] : type,
            f = function (e) {
                var scrollY = getScroll("y", element),
                    scrollX = getScroll("x", element);
                if (supportsTouch && touchMap[has](type)) {
                    for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                        if (e.targetTouches[i].target == obj || obj.contains(e.targetTouches[i].target)) {
                            var olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                }
                var x = e.clientX + scrollX,
                    y = e.clientY + scrollY;
                return fn.call(element, e, x, y);
            };

        if (type !== realName) {
            obj.addEventListener(type, f, false);
        }

        obj.addEventListener(realName, f, false);

        return function () {
            if (type !== realName) {
                obj.removeEventListener(type, f, false);
            }

            obj.removeEventListener(realName, f, false);
            return true;
        };
    },
    drag = [],
    dragMove = function (e) {
        var x = e.clientX,
            y = e.clientY,
            scrollY = getScroll("y"),
            scrollX = getScroll("x"),
            dragi,
            j = drag.length;
        while (j--) {
            dragi = drag[j];
            if (supportsTouch) {
                var i = e.touches && e.touches.length,
                    touch;
                while (i--) {
                    touch = e.touches[i];
                    if (touch.identifier == dragi.el._drag.id || dragi.el.node.contains(touch.target)) {
                        x = touch.clientX;
                        y = touch.clientY;
                        (e.originalEvent ? e.originalEvent : e).preventDefault();
                        break;
                    }
                }
            } else {
                e.preventDefault();
            }
            var node = dragi.el.node,
                o,
                next = node.nextSibling,
                parent = node.parentNode,
                display = node.style.display;
            // glob.win.opera && parent.removeChild(node);
            // node.style.display = "none";
            // o = dragi.el.paper.getElementByPoint(x, y);
            // node.style.display = display;
            // glob.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
            // o && eve("snap.drag.over." + dragi.el.id, dragi.el, o);
            x += scrollX;
            y += scrollY;
            eve("snap.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
        }
    },
    dragUp = function (e) {
        Snap.unmousemove(dragMove).unmouseup(dragUp);
        var i = drag.length,
            dragi;
        while (i--) {
            dragi = drag[i];
            dragi.el._drag = {};
            eve("snap.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
            eve.off("snap.drag.*." + dragi.el.id);
        }
        drag = [];
    };
    /*\
     * Element.click
     [ method ]
     **
     * Adds a click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unclick
     [ method ]
     **
     * Removes a click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.dblclick
     [ method ]
     **
     * Adds a double click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.undblclick
     [ method ]
     **
     * Removes a double click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mousedown
     [ method ]
     **
     * Adds a mousedown event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousedown
     [ method ]
     **
     * Removes a mousedown event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mousemove
     [ method ]
     **
     * Adds a mousemove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousemove
     [ method ]
     **
     * Removes a mousemove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseout
     [ method ]
     **
     * Adds a mouseout event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseout
     [ method ]
     **
     * Removes a mouseout event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseover
     [ method ]
     **
     * Adds a mouseover event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseover
     [ method ]
     **
     * Removes a mouseover event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseup
     [ method ]
     **
     * Adds a mouseup event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseup
     [ method ]
     **
     * Removes a mouseup event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchstart
     [ method ]
     **
     * Adds a touchstart event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchstart
     [ method ]
     **
     * Removes a touchstart event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchmove
     [ method ]
     **
     * Adds a touchmove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchmove
     [ method ]
     **
     * Removes a touchmove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchend
     [ method ]
     **
     * Adds a touchend event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchend
     [ method ]
     **
     * Removes a touchend event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchcancel
     [ method ]
     **
     * Adds a touchcancel event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchcancel
     [ method ]
     **
     * Removes a touchcancel event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    for (var i = events.length; i--;) {
        (function (eventName) {
            Snap[eventName] = elproto[eventName] = function (fn, scope) {
                if (Snap.is(fn, "function")) {
                    this.events = this.events || [];
                    this.events.push({
                        name: eventName,
                        f: fn,
                        unbind: addEvent(this.node || document, eventName, fn, scope || this)
                    });
                } else {
                    for (var i = 0, ii = this.events.length; i < ii; i++) if (this.events[i].name == eventName) {
                        try {
                            this.events[i].f.call(this);
                        } catch (e) {}
                    }
                }
                return this;
            };
            Snap["un" + eventName] =
            elproto["un" + eventName] = function (fn) {
                var events = this.events || [],
                    l = events.length;
                while (l--) if (events[l].name == eventName &&
                               (events[l].f == fn || !fn)) {
                    events[l].unbind();
                    events.splice(l, 1);
                    !events.length && delete this.events;
                    return this;
                }
                return this;
            };
        })(events[i]);
    }
    /*\
     * Element.hover
     [ method ]
     **
     * Adds hover event handlers to the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     - icontext (object) #optional context for hover in handler
     - ocontext (object) #optional context for hover out handler
     = (object) @Element
    \*/
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /*\
     * Element.unhover
     [ method ]
     **
     * Removes hover event handlers from the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     = (object) @Element
    \*/
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    var draggable = [];
    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
    /*\
     * Element.drag
     [ method ]
     **
     * Adds event handlers for an element's drag gesture
     **
     - onmove (function) handler for moving
     - onstart (function) handler for drag start
     - onend (function) handler for drag end
     - mcontext (object) #optional context for moving handler
     - scontext (object) #optional context for drag start handler
     - econtext (object) #optional context for drag end handler
     * Additionaly following `drag` events are triggered: `drag.start.<id>` on start, 
     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element is dragged over another element 
     * `drag.over.<id>` fires as well.
     *
     * Start event and start handler are called in specified context or in context of the element with following parameters:
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * Move event and move handler are called in specified context or in context of the element with following parameters:
     o dx (number) shift by x from the start point
     o dy (number) shift by y from the start point
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * End event and end handler are called in specified context or in context of the element with following parameters:
     o event (object) DOM event object
     = (object) @Element
    \*/
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        var el = this;
        if (!arguments.length) {
            var origTransform;
            return el.drag(function (dx, dy) {
                this.attr({
                    transform: origTransform + (origTransform ? "T" : "t") + [dx, dy]
                });
            }, function () {
                origTransform = this.transform().local;
            });
        }
        function start(e, x, y) {
            (e.originalEvent || e).preventDefault();
            el._drag.x = x;
            el._drag.y = y;
            el._drag.id = e.identifier;
            !drag.length && Snap.mousemove(dragMove).mouseup(dragUp);
            drag.push({el: el, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("snap.drag.start." + el.id, onstart);
            onmove && eve.on("snap.drag.move." + el.id, onmove);
            onend && eve.on("snap.drag.end." + el.id, onend);
            eve("snap.drag.start." + el.id, start_scope || move_scope || el, x, y, e);
        }
        function init(e, x, y) {
            eve("snap.draginit." + el.id, el, e, x, y);
        }
        eve.on("snap.draginit." + el.id, start);
        el._drag = {};
        draggable.push({el: el, start: start, init: init});
        el.mousedown(init);
        return el;
    };
    /*
     * Element.onDragOver
     [ method ]
     **
     * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id)
     - f (function) handler for event, first argument would be the element you are dragging over
    \*/
    // elproto.onDragOver = function (f) {
    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
    // };
    /*\
     * Element.undrag
     [ method ]
     **
     * Removes all drag event handlers from the given element
    \*/
    elproto.undrag = function () {
        var i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].init);
            draggable.splice(i, 1);
            eve.unbind("snap.drag.*." + this.id);
            eve.unbind("snap.draginit." + this.id);
        }
        !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
        return this;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
        pproto = Paper.prototype,
        rgurl = /^\s*url\((.+)\)/,
        Str = String,
        $ = Snap._.$;
    Snap.filter = {};
    /*\
     * Paper.filter
     [ method ]
     **
     * Creates a `<filter>` element
     **
     - filstr (string) SVG fragment of filter provided as a string
     = (object) @Element
     * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
     > Usage
     | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    pproto.filter = function (filstr) {
        var paper = this;
        if (paper.type != "svg") {
            paper = paper.paper;
        }
        var f = Snap.parse(Str(filstr)),
            id = Snap._.id(),
            width = paper.node.offsetWidth,
            height = paper.node.offsetHeight,
            filter = $("filter");
        $(filter, {
            id: id,
            filterUnits: "userSpaceOnUse"
        });
        filter.appendChild(f.node);
        paper.defs.appendChild(filter);
        return new Element(filter);
    };
    
    eve.on("snap.util.getattr.filter", function () {
        eve.stop();
        var p = $(this.node, "filter");
        if (p) {
            var match = Str(p).match(rgurl);
            return match && Snap.select(match[1]);
        }
    });
    eve.on("snap.util.attr.filter", function (value) {
        if (value instanceof Element && value.type == "filter") {
            eve.stop();
            var id = value.node.id;
            if (!id) {
                $(value.node, {id: value.id});
                id = value.id;
            }
            $(this.node, {
                filter: Snap.url(id)
            });
        }
        if (!value || value == "none") {
            eve.stop();
            this.node.removeAttribute("filter");
        }
    });
    /*\
     * Snap.filter.blur
     [ method ]
     **
     * Returns an SVG markup string for the blur filter
     **
     - x (number) amount of horizontal blur, in pixels
     - y (number) #optional amount of vertical blur, in pixels
     = (string) filter representation
     > Usage
     | var f = paper.filter(Snap.filter.blur(5, 10)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Snap.filter.blur = function (x, y) {
        if (x == null) {
            x = 2;
        }
        var def = y == null ? x : [x, y];
        return Snap.format('\<feGaussianBlur stdDeviation="{def}"/>', {
            def: def
        });
    };
    Snap.filter.blur.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.shadow
     [ method ]
     **
     * Returns an SVG markup string for the shadow filter
     **
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - blur (number) #optional amount of blur
     - color (string) #optional color of the shadow
     - opacity (number) #optional `0..1` opacity of the shadow
     * or
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - color (string) #optional color of the shadow
     - opacity (number) #optional `0..1` opacity of the shadow
     * which makes blur default to `4`. Or
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - opacity (number) #optional `0..1` opacity of the shadow
     = (string) filter representation
     > Usage
     | var f = paper.filter(Snap.filter.shadow(0, 2, 3)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Snap.filter.shadow = function (dx, dy, blur, color, opacity) {
        if (typeof blur == "string") {
            color = blur;
            opacity = color;
            blur = 4;
        }
        if (typeof color != "string") {
            opacity = color;
            color = "#000";
        }
        color = color || "#000";
        if (blur == null) {
            blur = 4;
        }
        if (opacity == null) {
            opacity = 1;
        }
        if (dx == null) {
            dx = 0;
            dy = 2;
        }
        if (dy == null) {
            dy = dx;
        }
        color = Snap.color(color);
        return Snap.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>', {
            color: color,
            dx: dx,
            dy: dy,
            blur: blur,
            opacity: opacity
        });
    };
    Snap.filter.shadow.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.grayscale
     [ method ]
     **
     * Returns an SVG markup string for the grayscale filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.grayscale = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>', {
            a: 0.2126 + 0.7874 * (1 - amount),
            b: 0.7152 - 0.7152 * (1 - amount),
            c: 0.0722 - 0.0722 * (1 - amount),
            d: 0.2126 - 0.2126 * (1 - amount),
            e: 0.7152 + 0.2848 * (1 - amount),
            f: 0.0722 - 0.0722 * (1 - amount),
            g: 0.2126 - 0.2126 * (1 - amount),
            h: 0.0722 + 0.9278 * (1 - amount)
        });
    };
    Snap.filter.grayscale.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.sepia
     [ method ]
     **
     * Returns an SVG markup string for the sepia filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.sepia = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>', {
            a: 0.393 + 0.607 * (1 - amount),
            b: 0.769 - 0.769 * (1 - amount),
            c: 0.189 - 0.189 * (1 - amount),
            d: 0.349 - 0.349 * (1 - amount),
            e: 0.686 + 0.314 * (1 - amount),
            f: 0.168 - 0.168 * (1 - amount),
            g: 0.272 - 0.272 * (1 - amount),
            h: 0.534 - 0.534 * (1 - amount),
            i: 0.131 + 0.869 * (1 - amount)
        });
    };
    Snap.filter.sepia.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.saturate
     [ method ]
     **
     * Returns an SVG markup string for the saturate filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.saturate = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="saturate" values="{amount}"/>', {
            amount: 1 - amount
        });
    };
    Snap.filter.saturate.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.hueRotate
     [ method ]
     **
     * Returns an SVG markup string for the hue-rotate filter
     **
     - angle (number) angle of rotation
     = (string) filter representation
    \*/
    Snap.filter.hueRotate = function (angle) {
        angle = angle || 0;
        return Snap.format('<feColorMatrix type="hueRotate" values="{angle}"/>', {
            angle: angle
        });
    };
    Snap.filter.hueRotate.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.invert
     [ method ]
     **
     * Returns an SVG markup string for the invert filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.invert = function (amount) {
        if (amount == null) {
            amount = 1;
        }
//        <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" color-interpolation-filters="sRGB"/>
        return Snap.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>', {
            amount: amount,
            amount2: 1 - amount
        });
    };
    Snap.filter.invert.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.brightness
     [ method ]
     **
     * Returns an SVG markup string for the brightness filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.brightness = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>', {
            amount: amount
        });
    };
    Snap.filter.brightness.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.contrast
     [ method ]
     **
     * Returns an SVG markup string for the contrast filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.contrast = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>', {
            amount: amount,
            amount2: .5 - amount / 2
        });
    };
    Snap.filter.contrast.toString = function () {
        return this();
    };
});

// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var box = Snap._.box,
        is = Snap.is,
        firstLetter = /^[^a-z]*([tbmlrc])/i,
        toString = function () {
            return "T" + this.dx + "," + this.dy;
        };
    /*\
     * Element.getAlign
     [ method ]
     **
     * Returns shift needed to align the element relatively to given element.
     * If no elements specified, parent `<svg>` container will be used.
     - el (object) @optional alignment element
     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
     = (object|string) Object in format `{dx: , dy: }` also has a string representation as a transformation string
     > Usage
     | el.transform(el.getAlign(el2, "top"));
     * or
     | var dy = el.getAlign(el2, "top").dy;
    \*/
    Element.prototype.getAlign = function (el, way) {
        if (way == null && is(el, "string")) {
            way = el;
            el = null;
        }
        el = el || this.paper;
        var bx = el.getBBox ? el.getBBox() : box(el),
            bb = this.getBBox(),
            out = {};
        way = way && way.match(firstLetter);
        way = way ? way[1].toLowerCase() : "c";
        switch (way) {
            case "t":
                out.dx = 0;
                out.dy = bx.y - bb.y;
            break;
            case "b":
                out.dx = 0;
                out.dy = bx.y2 - bb.y2;
            break;
            case "m":
                out.dx = 0;
                out.dy = bx.cy - bb.cy;
            break;
            case "l":
                out.dx = bx.x - bb.x;
                out.dy = 0;
            break;
            case "r":
                out.dx = bx.x2 - bb.x2;
                out.dy = 0;
            break;
            default:
                out.dx = bx.cx - bb.cx;
                out.dy = 0;
            break;
        }
        out.toString = toString;
        return out;
    };
    /*\
     * Element.align
     [ method ]
     **
     * Aligns the element relatively to given one via transformation.
     * If no elements specified, parent `<svg>` container will be used.
     - el (object) @optional alignment element
     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
     = (object) this element
     > Usage
     | el.align(el2, "top");
     * or
     | el.align("middle");
    \*/
    Element.prototype.align = function (el, way) {
        return this.transform("..." + this.getAlign(el, way));
    };
});

return Snap;
}));
},{"eve":2}],5:[function(require,module,exports){
var cola;
(function (cola) {
    var packingOptions = {
        PADDING: 10,
        GOLDEN_SECTION: (1 + Math.sqrt(5)) / 2,
        FLOAT_EPSILON: 0.0001,
        MAX_INERATIONS: 100
    };
    // assign x, y to nodes while using box packing algorithm for disconnected graphs
    function applyPacking(graphs, w, h, node_size, desired_ratio) {
        if (desired_ratio === void 0) { desired_ratio = 1; }
        var init_x = 0, init_y = 0, svg_width = w, svg_height = h, desired_ratio = typeof desired_ratio !== 'undefined' ? desired_ratio : 1, node_size = typeof node_size !== 'undefined' ? node_size : 0, real_width = 0, real_height = 0, min_width = 0, global_bottom = 0, line = [];
        if (graphs.length == 0)
            return;
        /// that would take care of single nodes problem
        // graphs.forEach(function (g) {
        //     if (g.array.length == 1) {
        //         g.array[0].x = 0;
        //         g.array[0].y = 0;
        //     }
        // });
        calculate_bb(graphs);
        apply(graphs, desired_ratio);
        put_nodes_to_right_positions(graphs);
        // get bounding boxes for all separate graphs
        function calculate_bb(graphs) {
            graphs.forEach(function (g) {
                calculate_single_bb(g);
            });
            function calculate_single_bb(graph) {
                var min_x = Number.MAX_VALUE, min_y = Number.MAX_VALUE, max_x = 0, max_y = 0;
                graph.array.forEach(function (v) {
                    var w = typeof v.width !== 'undefined' ? v.width : node_size;
                    var h = typeof v.height !== 'undefined' ? v.height : node_size;
                    w /= 2;
                    h /= 2;
                    max_x = Math.max(v.x + w, max_x);
                    min_x = Math.min(v.x - w, min_x);
                    max_y = Math.max(v.y + h, max_y);
                    min_y = Math.min(v.y - h, min_y);
                });
                graph.width = max_x - min_x;
                graph.height = max_y - min_y;
            }
        }
        //function plot(data, left, right, opt_x, opt_y) {
        //    // plot the cost function
        //    var plot_svg = d3.select("body").append("svg")
        //        .attr("width", function () { return 2 * (right - left); })
        //        .attr("height", 200);
        //    var x = d3.time.scale().range([0, 2 * (right - left)]);
        //    var xAxis = d3.svg.axis().scale(x).orient("bottom");
        //    plot_svg.append("g").attr("class", "x axis")
        //        .attr("transform", "translate(0, 199)")
        //        .call(xAxis);
        //    var lastX = 0;
        //    var lastY = 0;
        //    var value = 0;
        //    for (var r = left; r < right; r += 1) {
        //        value = step(data, r);
        //        // value = 1;
        //        plot_svg.append("line").attr("x1", 2 * (lastX - left))
        //            .attr("y1", 200 - 30 * lastY)
        //            .attr("x2", 2 * r - 2 * left)
        //            .attr("y2", 200 - 30 * value)
        //            .style("stroke", "rgb(6,120,155)");
        //        lastX = r;
        //        lastY = value;
        //    }
        //    plot_svg.append("circle").attr("cx", 2 * opt_x - 2 * left).attr("cy", 200 - 30 * opt_y)
        //        .attr("r", 5).style('fill', "rgba(0,0,0,0.5)");
        //}
        // actual assigning of position to nodes
        function put_nodes_to_right_positions(graphs) {
            graphs.forEach(function (g) {
                // calculate current graph center:
                var center = { x: 0, y: 0 };
                g.array.forEach(function (node) {
                    center.x += node.x;
                    center.y += node.y;
                });
                center.x /= g.array.length;
                center.y /= g.array.length;
                // calculate current top left corner:
                var corner = { x: center.x - g.width / 2, y: center.y - g.height / 2 };
                var offset = { x: g.x - corner.x + svg_width / 2 - real_width / 2, y: g.y - corner.y + svg_height / 2 - real_height / 2 };
                // put nodes:
                g.array.forEach(function (node) {
                    node.x += offset.x;
                    node.y += offset.y;
                });
            });
        }
        // starts box packing algorithm
        // desired ratio is 1 by default
        function apply(data, desired_ratio) {
            var curr_best_f = Number.POSITIVE_INFINITY;
            var curr_best = 0;
            data.sort(function (a, b) { return b.height - a.height; });
            min_width = data.reduce(function (a, b) {
                return a.width < b.width ? a.width : b.width;
            });
            var left = x1 = min_width;
            var right = x2 = get_entire_width(data);
            var iterationCounter = 0;
            var f_x1 = Number.MAX_VALUE;
            var f_x2 = Number.MAX_VALUE;
            var flag = -1; // determines which among f_x1 and f_x2 to recompute
            var dx = Number.MAX_VALUE;
            var df = Number.MAX_VALUE;
            while ((dx > min_width) || df > packingOptions.FLOAT_EPSILON) {
                if (flag != 1) {
                    var x1 = right - (right - left) / packingOptions.GOLDEN_SECTION;
                    var f_x1 = step(data, x1);
                }
                if (flag != 0) {
                    var x2 = left + (right - left) / packingOptions.GOLDEN_SECTION;
                    var f_x2 = step(data, x2);
                }
                dx = Math.abs(x1 - x2);
                df = Math.abs(f_x1 - f_x2);
                if (f_x1 < curr_best_f) {
                    curr_best_f = f_x1;
                    curr_best = x1;
                }
                if (f_x2 < curr_best_f) {
                    curr_best_f = f_x2;
                    curr_best = x2;
                }
                if (f_x1 > f_x2) {
                    left = x1;
                    x1 = x2;
                    f_x1 = f_x2;
                    flag = 1;
                }
                else {
                    right = x2;
                    x2 = x1;
                    f_x2 = f_x1;
                    flag = 0;
                }
                if (iterationCounter++ > 100) {
                    break;
                }
            }
            // plot(data, min_width, get_entire_width(data), curr_best, curr_best_f);
            step(data, curr_best);
        }
        // one iteration of the optimization method
        // (gives a proper, but not necessarily optimal packing)
        function step(data, max_width) {
            line = [];
            real_width = 0;
            real_height = 0;
            global_bottom = init_y;
            for (var i = 0; i < data.length; i++) {
                var o = data[i];
                put_rect(o, max_width);
            }
            return Math.abs(get_real_ratio() - desired_ratio);
        }
        // looking for a position to one box 
        function put_rect(rect, max_width) {
            var parent = undefined;
            for (var i = 0; i < line.length; i++) {
                if ((line[i].space_left >= rect.height) && (line[i].x + line[i].width + rect.width + packingOptions.PADDING - max_width) <= packingOptions.FLOAT_EPSILON) {
                    parent = line[i];
                    break;
                }
            }
            line.push(rect);
            if (parent !== undefined) {
                rect.x = parent.x + parent.width + packingOptions.PADDING;
                rect.y = parent.bottom;
                rect.space_left = rect.height;
                rect.bottom = rect.y;
                parent.space_left -= rect.height + packingOptions.PADDING;
                parent.bottom += rect.height + packingOptions.PADDING;
            }
            else {
                rect.y = global_bottom;
                global_bottom += rect.height + packingOptions.PADDING;
                rect.x = init_x;
                rect.bottom = rect.y;
                rect.space_left = rect.height;
            }
            if (rect.y + rect.height - real_height > -packingOptions.FLOAT_EPSILON)
                real_height = rect.y + rect.height - init_y;
            if (rect.x + rect.width - real_width > -packingOptions.FLOAT_EPSILON)
                real_width = rect.x + rect.width - init_x;
        }
        ;
        function get_entire_width(data) {
            var width = 0;
            data.forEach(function (d) { return width += d.width + packingOptions.PADDING; });
            return width;
        }
        function get_real_ratio() {
            return (real_width / real_height);
        }
    }
    cola.applyPacking = applyPacking;
    /**
     * connected components of graph
     * returns an array of {}
     */
    function separateGraphs(nodes, links) {
        var marks = {};
        var ways = {};
        var graphs = [];
        var clusters = 0;
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var n1 = link.source;
            var n2 = link.target;
            if (ways[n1.index])
                ways[n1.index].push(n2);
            else
                ways[n1.index] = [n2];
            if (ways[n2.index])
                ways[n2.index].push(n1);
            else
                ways[n2.index] = [n1];
        }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (marks[node.index])
                continue;
            explore_node(node, true);
        }
        function explore_node(n, is_new) {
            if (marks[n.index] !== undefined)
                return;
            if (is_new) {
                clusters++;
                graphs.push({ array: [] });
            }
            marks[n.index] = clusters;
            graphs[clusters - 1].array.push(n);
            var adjacent = ways[n.index];
            if (!adjacent)
                return;
            for (var j = 0; j < adjacent.length; j++) {
                explore_node(adjacent[j], false);
            }
        }
        return graphs;
    }
    cola.separateGraphs = separateGraphs;
})(cola || (cola = {}));
var cola;
(function (cola) {
    var vpsc;
    (function (vpsc) {
        var PositionStats = (function () {
            function PositionStats(scale) {
                this.scale = scale;
                this.AB = 0;
                this.AD = 0;
                this.A2 = 0;
            }
            PositionStats.prototype.addVariable = function (v) {
                var ai = this.scale / v.scale;
                var bi = v.offset / v.scale;
                var wi = v.weight;
                this.AB += wi * ai * bi;
                this.AD += wi * ai * v.desiredPosition;
                this.A2 += wi * ai * ai;
            };
            PositionStats.prototype.getPosn = function () {
                return (this.AD - this.AB) / this.A2;
            };
            return PositionStats;
        })();
        vpsc.PositionStats = PositionStats;
        var Constraint = (function () {
            function Constraint(left, right, gap, equality) {
                if (equality === void 0) { equality = false; }
                this.left = left;
                this.right = right;
                this.gap = gap;
                this.equality = equality;
                this.active = false;
                this.unsatisfiable = false;
                this.left = left;
                this.right = right;
                this.gap = gap;
                this.equality = equality;
            }
            Constraint.prototype.slack = function () {
                return this.unsatisfiable ? Number.MAX_VALUE
                    : this.right.scale * this.right.position() - this.gap
                        - this.left.scale * this.left.position();
            };
            return Constraint;
        })();
        vpsc.Constraint = Constraint;
        var Variable = (function () {
            function Variable(desiredPosition, weight, scale) {
                if (weight === void 0) { weight = 1; }
                if (scale === void 0) { scale = 1; }
                this.desiredPosition = desiredPosition;
                this.weight = weight;
                this.scale = scale;
                this.offset = 0;
            }
            Variable.prototype.dfdv = function () {
                return 2.0 * this.weight * (this.position() - this.desiredPosition);
            };
            Variable.prototype.position = function () {
                return (this.block.ps.scale * this.block.posn + this.offset) / this.scale;
            };
            // visit neighbours by active constraints within the same block
            Variable.prototype.visitNeighbours = function (prev, f) {
                var ff = function (c, next) { return c.active && prev !== next && f(c, next); };
                this.cOut.forEach(function (c) { return ff(c, c.right); });
                this.cIn.forEach(function (c) { return ff(c, c.left); });
            };
            return Variable;
        })();
        vpsc.Variable = Variable;
        var Block = (function () {
            function Block(v) {
                this.vars = [];
                v.offset = 0;
                this.ps = new PositionStats(v.scale);
                this.addVariable(v);
            }
            Block.prototype.addVariable = function (v) {
                v.block = this;
                this.vars.push(v);
                this.ps.addVariable(v);
                this.posn = this.ps.getPosn();
            };
            // move the block where it needs to be to minimize cost
            Block.prototype.updateWeightedPosition = function () {
                this.ps.AB = this.ps.AD = this.ps.A2 = 0;
                for (var i = 0, n = this.vars.length; i < n; ++i)
                    this.ps.addVariable(this.vars[i]);
                this.posn = this.ps.getPosn();
            };
            Block.prototype.compute_lm = function (v, u, postAction) {
                var _this = this;
                var dfdv = v.dfdv();
                v.visitNeighbours(u, function (c, next) {
                    var _dfdv = _this.compute_lm(next, v, postAction);
                    if (next === c.right) {
                        dfdv += _dfdv * c.left.scale;
                        c.lm = _dfdv;
                    }
                    else {
                        dfdv += _dfdv * c.right.scale;
                        c.lm = -_dfdv;
                    }
                    postAction(c);
                });
                return dfdv / v.scale;
            };
            Block.prototype.populateSplitBlock = function (v, prev) {
                var _this = this;
                v.visitNeighbours(prev, function (c, next) {
                    next.offset = v.offset + (next === c.right ? c.gap : -c.gap);
                    _this.addVariable(next);
                    _this.populateSplitBlock(next, v);
                });
            };
            // traverse the active constraint tree applying visit to each active constraint
            Block.prototype.traverse = function (visit, acc, v, prev) {
                var _this = this;
                if (v === void 0) { v = this.vars[0]; }
                if (prev === void 0) { prev = null; }
                v.visitNeighbours(prev, function (c, next) {
                    acc.push(visit(c));
                    _this.traverse(visit, acc, next, v);
                });
            };
            // calculate lagrangian multipliers on constraints and
            // find the active constraint in this block with the smallest lagrangian.
            // if the lagrangian is negative, then the constraint is a split candidate.  
            Block.prototype.findMinLM = function () {
                var m = null;
                this.compute_lm(this.vars[0], null, function (c) {
                    if (!c.equality && (m === null || c.lm < m.lm))
                        m = c;
                });
                return m;
            };
            Block.prototype.findMinLMBetween = function (lv, rv) {
                this.compute_lm(lv, null, function () { });
                var m = null;
                this.findPath(lv, null, rv, function (c, next) {
                    if (!c.equality && c.right === next && (m === null || c.lm < m.lm))
                        m = c;
                });
                return m;
            };
            Block.prototype.findPath = function (v, prev, to, visit) {
                var _this = this;
                var endFound = false;
                v.visitNeighbours(prev, function (c, next) {
                    if (!endFound && (next === to || _this.findPath(next, v, to, visit))) {
                        endFound = true;
                        visit(c, next);
                    }
                });
                return endFound;
            };
            // Search active constraint tree from u to see if there is a directed path to v.
            // Returns true if path is found.
            Block.prototype.isActiveDirectedPathBetween = function (u, v) {
                if (u === v)
                    return true;
                var i = u.cOut.length;
                while (i--) {
                    var c = u.cOut[i];
                    if (c.active && this.isActiveDirectedPathBetween(c.right, v))
                        return true;
                }
                return false;
            };
            // split the block into two by deactivating the specified constraint
            Block.split = function (c) {
                /* DEBUG
                            console.log("split on " + c);
                            console.assert(c.active, "attempt to split on inactive constraint");
                DEBUG */
                c.active = false;
                return [Block.createSplitBlock(c.left), Block.createSplitBlock(c.right)];
            };
            Block.createSplitBlock = function (startVar) {
                var b = new Block(startVar);
                b.populateSplitBlock(startVar, null);
                return b;
            };
            // find a split point somewhere between the specified variables
            Block.prototype.splitBetween = function (vl, vr) {
                /* DEBUG
                            console.assert(vl.block === this);
                            console.assert(vr.block === this);
                DEBUG */
                var c = this.findMinLMBetween(vl, vr);
                if (c !== null) {
                    var bs = Block.split(c);
                    return { constraint: c, lb: bs[0], rb: bs[1] };
                }
                // couldn't find a split point - for example the active path is all equality constraints
                return null;
            };
            Block.prototype.mergeAcross = function (b, c, dist) {
                c.active = true;
                for (var i = 0, n = b.vars.length; i < n; ++i) {
                    var v = b.vars[i];
                    v.offset += dist;
                    this.addVariable(v);
                }
                this.posn = this.ps.getPosn();
            };
            Block.prototype.cost = function () {
                var sum = 0, i = this.vars.length;
                while (i--) {
                    var v = this.vars[i], d = v.position() - v.desiredPosition;
                    sum += d * d * v.weight;
                }
                return sum;
            };
            return Block;
        })();
        vpsc.Block = Block;
        var Blocks = (function () {
            function Blocks(vs) {
                this.vs = vs;
                var n = vs.length;
                this.list = new Array(n);
                while (n--) {
                    var b = new Block(vs[n]);
                    this.list[n] = b;
                    b.blockInd = n;
                }
            }
            Blocks.prototype.cost = function () {
                var sum = 0, i = this.list.length;
                while (i--)
                    sum += this.list[i].cost();
                return sum;
            };
            Blocks.prototype.insert = function (b) {
                /* DEBUG
                            console.assert(!this.contains(b), "blocks error: tried to reinsert block " + b.blockInd)
                DEBUG */
                b.blockInd = this.list.length;
                this.list.push(b);
                /* DEBUG
                            console.log("insert block: " + b.blockInd);
                            this.contains(b);
                DEBUG */
            };
            Blocks.prototype.remove = function (b) {
                /* DEBUG
                            console.log("remove block: " + b.blockInd);
                            console.assert(this.contains(b));
                DEBUG */
                var last = this.list.length - 1;
                var swapBlock = this.list[last];
                this.list.length = last;
                if (b !== swapBlock) {
                    this.list[b.blockInd] = swapBlock;
                    swapBlock.blockInd = b.blockInd;
                }
            };
            // merge the blocks on either side of the specified constraint, by copying the smaller block into the larger
            // and deleting the smaller.
            Blocks.prototype.merge = function (c) {
                var l = c.left.block, r = c.right.block;
                /* DEBUG
                            console.assert(l!==r, "attempt to merge within the same block");
                DEBUG */
                var dist = c.right.offset - c.left.offset - c.gap;
                if (l.vars.length < r.vars.length) {
                    r.mergeAcross(l, c, dist);
                    this.remove(l);
                }
                else {
                    l.mergeAcross(r, c, -dist);
                    this.remove(r);
                }
                /* DEBUG
                            console.assert(Math.abs(c.slack()) < 1e-6, "Error: Constraint should be at equality after merge!");
                            console.log("merged on " + c);
                DEBUG */
            };
            Blocks.prototype.forEach = function (f) {
                this.list.forEach(f);
            };
            // useful, for example, after variable desired positions change.
            Blocks.prototype.updateBlockPositions = function () {
                this.list.forEach(function (b) { return b.updateWeightedPosition(); });
            };
            // split each block across its constraint with the minimum lagrangian 
            Blocks.prototype.split = function (inactive) {
                var _this = this;
                this.updateBlockPositions();
                this.list.forEach(function (b) {
                    var v = b.findMinLM();
                    if (v !== null && v.lm < Solver.LAGRANGIAN_TOLERANCE) {
                        b = v.left.block;
                        Block.split(v).forEach(function (nb) { return _this.insert(nb); });
                        _this.remove(b);
                        inactive.push(v);
                    }
                });
            };
            return Blocks;
        })();
        vpsc.Blocks = Blocks;
        var Solver = (function () {
            function Solver(vs, cs) {
                this.vs = vs;
                this.cs = cs;
                this.vs = vs;
                vs.forEach(function (v) {
                    v.cIn = [], v.cOut = [];
                    /* DEBUG
                                    v.toString = () => "v" + vs.indexOf(v);
                    DEBUG */
                });
                this.cs = cs;
                cs.forEach(function (c) {
                    c.left.cOut.push(c);
                    c.right.cIn.push(c);
                    /* DEBUG
                                    c.toString = () => c.left + "+" + c.gap + "<=" + c.right + " slack=" + c.slack() + " active=" + c.active;
                    DEBUG */
                });
                this.inactive = cs.map(function (c) { c.active = false; return c; });
                this.bs = null;
            }
            Solver.prototype.cost = function () {
                return this.bs.cost();
            };
            // set starting positions without changing desired positions.
            // Note: it throws away any previous block structure.
            Solver.prototype.setStartingPositions = function (ps) {
                this.inactive = this.cs.map(function (c) { c.active = false; return c; });
                this.bs = new Blocks(this.vs);
                this.bs.forEach(function (b, i) { return b.posn = ps[i]; });
            };
            Solver.prototype.setDesiredPositions = function (ps) {
                this.vs.forEach(function (v, i) { return v.desiredPosition = ps[i]; });
            };
            /* DEBUG
                    private getId(v: Variable): number {
                        return this.vs.indexOf(v);
                    }
            
                    // sanity check of the index integrity of the inactive list
                    checkInactive(): void {
                        var inactiveCount = 0;
                        this.cs.forEach(c=> {
                            var i = this.inactive.indexOf(c);
                            console.assert(!c.active && i >= 0 || c.active && i < 0, "constraint should be in the inactive list if it is not active: " + c);
                            if (i >= 0) {
                                inactiveCount++;
                            } else {
                                console.assert(c.active, "inactive constraint not found in inactive list: " + c);
                            }
                        });
                        console.assert(inactiveCount === this.inactive.length, inactiveCount + " inactive constraints found, " + this.inactive.length + "in inactive list");
                    }
                    // after every call to satisfy the following should check should pass
                    checkSatisfied(): void {
                        this.cs.forEach(c=>console.assert(c.slack() >= vpsc.Solver.ZERO_UPPERBOUND, "Error: Unsatisfied constraint! "+c));
                    }
            DEBUG */
            Solver.prototype.mostViolated = function () {
                var minSlack = Number.MAX_VALUE, v = null, l = this.inactive, n = l.length, deletePoint = n;
                for (var i = 0; i < n; ++i) {
                    var c = l[i];
                    if (c.unsatisfiable)
                        continue;
                    var slack = c.slack();
                    if (c.equality || slack < minSlack) {
                        minSlack = slack;
                        v = c;
                        deletePoint = i;
                        if (c.equality)
                            break;
                    }
                }
                if (deletePoint !== n &&
                    (minSlack < Solver.ZERO_UPPERBOUND && !v.active || v.equality)) {
                    l[deletePoint] = l[n - 1];
                    l.length = n - 1;
                }
                return v;
            };
            // satisfy constraints by building block structure over violated constraints
            // and moving the blocks to their desired positions
            Solver.prototype.satisfy = function () {
                if (this.bs == null) {
                    this.bs = new Blocks(this.vs);
                }
                /* DEBUG
                            console.log("satisfy: " + this.bs);
                DEBUG */
                this.bs.split(this.inactive);
                var v = null;
                while ((v = this.mostViolated()) && (v.equality || v.slack() < Solver.ZERO_UPPERBOUND && !v.active)) {
                    var lb = v.left.block, rb = v.right.block;
                    /* DEBUG
                                    console.log("most violated is: " + v);
                                    this.bs.contains(lb);
                                    this.bs.contains(rb);
                    DEBUG */
                    if (lb !== rb) {
                        this.bs.merge(v);
                    }
                    else {
                        if (lb.isActiveDirectedPathBetween(v.right, v.left)) {
                            // cycle found!
                            v.unsatisfiable = true;
                            continue;
                        }
                        // constraint is within block, need to split first
                        var split = lb.splitBetween(v.left, v.right);
                        if (split !== null) {
                            this.bs.insert(split.lb);
                            this.bs.insert(split.rb);
                            this.bs.remove(lb);
                            this.inactive.push(split.constraint);
                        }
                        else {
                            /* DEBUG
                                                    console.log("unsatisfiable constraint found");
                            DEBUG */
                            v.unsatisfiable = true;
                            continue;
                        }
                        if (v.slack() >= 0) {
                            /* DEBUG
                                                    console.log("violated constraint indirectly satisfied: " + v);
                            DEBUG */
                            // v was satisfied by the above split!
                            this.inactive.push(v);
                        }
                        else {
                            /* DEBUG
                                                    console.log("merge after split:");
                            DEBUG */
                            this.bs.merge(v);
                        }
                    }
                }
                /* DEBUG
                            this.checkSatisfied();
                DEBUG */
            };
            // repeatedly build and split block structure until we converge to an optimal solution
            Solver.prototype.solve = function () {
                this.satisfy();
                var lastcost = Number.MAX_VALUE, cost = this.bs.cost();
                while (Math.abs(lastcost - cost) > 0.0001) {
                    this.satisfy();
                    lastcost = cost;
                    cost = this.bs.cost();
                }
                return cost;
            };
            Solver.LAGRANGIAN_TOLERANCE = -1e-4;
            Solver.ZERO_UPPERBOUND = -1e-10;
            return Solver;
        })();
        vpsc.Solver = Solver;
    })(vpsc = cola.vpsc || (cola.vpsc = {}));
})(cola || (cola = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var cola;
(function (cola) {
    var vpsc;
    (function (vpsc) {
        //Based on js_es:
        //
        //https://github.com/vadimg/js_bintrees
        //
        //Copyright (C) 2011 by Vadim Graboys
        //
        //Permission is hereby granted, free of charge, to any person obtaining a copy
        //of this software and associated documentation files (the "Software"), to deal
        //in the Software without restriction, including without limitation the rights
        //to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        //copies of the Software, and to permit persons to whom the Software is
        //furnished to do so, subject to the following conditions:
        //
        //The above copyright notice and this permission notice shall be included in
        //all copies or substantial portions of the Software.
        //
        //THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        //IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        //FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        //AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        //LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        //OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
        //THE SOFTWARE.
        var TreeBase = (function () {
            function TreeBase() {
                // returns iterator to node if found, null otherwise
                this.findIter = function (data) {
                    var res = this._root;
                    var iter = this.iterator();
                    while (res !== null) {
                        var c = this._comparator(data, res.data);
                        if (c === 0) {
                            iter._cursor = res;
                            return iter;
                        }
                        else {
                            iter._ancestors.push(res);
                            res = res.get_child(c > 0);
                        }
                    }
                    return null;
                };
            }
            // removes all nodes from the tree
            TreeBase.prototype.clear = function () {
                this._root = null;
                this.size = 0;
            };
            ;
            // returns node data if found, null otherwise
            TreeBase.prototype.find = function (data) {
                var res = this._root;
                while (res !== null) {
                    var c = this._comparator(data, res.data);
                    if (c === 0) {
                        return res.data;
                    }
                    else {
                        res = res.get_child(c > 0);
                    }
                }
                return null;
            };
            ;
            // Returns an interator to the tree node immediately before (or at) the element
            TreeBase.prototype.lowerBound = function (data) {
                return this._bound(data, this._comparator);
            };
            ;
            // Returns an interator to the tree node immediately after (or at) the element
            TreeBase.prototype.upperBound = function (data) {
                var cmp = this._comparator;
                function reverse_cmp(a, b) {
                    return cmp(b, a);
                }
                return this._bound(data, reverse_cmp);
            };
            ;
            // returns null if tree is empty
            TreeBase.prototype.min = function () {
                var res = this._root;
                if (res === null) {
                    return null;
                }
                while (res.left !== null) {
                    res = res.left;
                }
                return res.data;
            };
            ;
            // returns null if tree is empty
            TreeBase.prototype.max = function () {
                var res = this._root;
                if (res === null) {
                    return null;
                }
                while (res.right !== null) {
                    res = res.right;
                }
                return res.data;
            };
            ;
            // returns a null iterator
            // call next() or prev() to point to an element
            TreeBase.prototype.iterator = function () {
                return new Iterator(this);
            };
            ;
            // calls cb on each node's data, in order
            TreeBase.prototype.each = function (cb) {
                var it = this.iterator(), data;
                while ((data = it.next()) !== null) {
                    cb(data);
                }
            };
            ;
            // calls cb on each node's data, in reverse order
            TreeBase.prototype.reach = function (cb) {
                var it = this.iterator(), data;
                while ((data = it.prev()) !== null) {
                    cb(data);
                }
            };
            ;
            // used for lowerBound and upperBound
            TreeBase.prototype._bound = function (data, cmp) {
                var cur = this._root;
                var iter = this.iterator();
                while (cur !== null) {
                    var c = this._comparator(data, cur.data);
                    if (c === 0) {
                        iter._cursor = cur;
                        return iter;
                    }
                    iter._ancestors.push(cur);
                    cur = cur.get_child(c > 0);
                }
                for (var i = iter._ancestors.length - 1; i >= 0; --i) {
                    cur = iter._ancestors[i];
                    if (cmp(data, cur.data) > 0) {
                        iter._cursor = cur;
                        iter._ancestors.length = i;
                        return iter;
                    }
                }
                iter._ancestors.length = 0;
                return iter;
            };
            ;
            return TreeBase;
        })();
        vpsc.TreeBase = TreeBase;
        var Iterator = (function () {
            function Iterator(tree) {
                this._tree = tree;
                this._ancestors = [];
                this._cursor = null;
            }
            Iterator.prototype.data = function () {
                return this._cursor !== null ? this._cursor.data : null;
            };
            ;
            // if null-iterator, returns first node
            // otherwise, returns next node
            Iterator.prototype.next = function () {
                if (this._cursor === null) {
                    var root = this._tree._root;
                    if (root !== null) {
                        this._minNode(root);
                    }
                }
                else {
                    if (this._cursor.right === null) {
                        // no greater node in subtree, go up to parent
                        // if coming from a right child, continue up the stack
                        var save;
                        do {
                            save = this._cursor;
                            if (this._ancestors.length) {
                                this._cursor = this._ancestors.pop();
                            }
                            else {
                                this._cursor = null;
                                break;
                            }
                        } while (this._cursor.right === save);
                    }
                    else {
                        // get the next node from the subtree
                        this._ancestors.push(this._cursor);
                        this._minNode(this._cursor.right);
                    }
                }
                return this._cursor !== null ? this._cursor.data : null;
            };
            ;
            // if null-iterator, returns last node
            // otherwise, returns previous node
            Iterator.prototype.prev = function () {
                if (this._cursor === null) {
                    var root = this._tree._root;
                    if (root !== null) {
                        this._maxNode(root);
                    }
                }
                else {
                    if (this._cursor.left === null) {
                        var save;
                        do {
                            save = this._cursor;
                            if (this._ancestors.length) {
                                this._cursor = this._ancestors.pop();
                            }
                            else {
                                this._cursor = null;
                                break;
                            }
                        } while (this._cursor.left === save);
                    }
                    else {
                        this._ancestors.push(this._cursor);
                        this._maxNode(this._cursor.left);
                    }
                }
                return this._cursor !== null ? this._cursor.data : null;
            };
            ;
            Iterator.prototype._minNode = function (start) {
                while (start.left !== null) {
                    this._ancestors.push(start);
                    start = start.left;
                }
                this._cursor = start;
            };
            ;
            Iterator.prototype._maxNode = function (start) {
                while (start.right !== null) {
                    this._ancestors.push(start);
                    start = start.right;
                }
                this._cursor = start;
            };
            ;
            return Iterator;
        })();
        vpsc.Iterator = Iterator;
        var Node = (function () {
            function Node(data) {
                this.data = data;
                this.left = null;
                this.right = null;
                this.red = true;
            }
            Node.prototype.get_child = function (dir) {
                return dir ? this.right : this.left;
            };
            ;
            Node.prototype.set_child = function (dir, val) {
                if (dir) {
                    this.right = val;
                }
                else {
                    this.left = val;
                }
            };
            ;
            return Node;
        })();
        var RBTree = (function (_super) {
            __extends(RBTree, _super);
            function RBTree(comparator) {
                _super.call(this);
                this._root = null;
                this._comparator = comparator;
                this.size = 0;
            }
            // returns true if inserted, false if duplicate
            RBTree.prototype.insert = function (data) {
                var ret = false;
                if (this._root === null) {
                    // empty tree
                    this._root = new Node(data);
                    ret = true;
                    this.size++;
                }
                else {
                    var head = new Node(undefined); // fake tree root
                    var dir = false;
                    var last = false;
                    // setup
                    var gp = null; // grandparent
                    var ggp = head; // grand-grand-parent
                    var p = null; // parent
                    var node = this._root;
                    ggp.right = this._root;
                    // search down
                    while (true) {
                        if (node === null) {
                            // insert new node at the bottom
                            node = new Node(data);
                            p.set_child(dir, node);
                            ret = true;
                            this.size++;
                        }
                        else if (RBTree.is_red(node.left) && RBTree.is_red(node.right)) {
                            // color flip
                            node.red = true;
                            node.left.red = false;
                            node.right.red = false;
                        }
                        // fix red violation
                        if (RBTree.is_red(node) && RBTree.is_red(p)) {
                            var dir2 = ggp.right === gp;
                            if (node === p.get_child(last)) {
                                ggp.set_child(dir2, RBTree.single_rotate(gp, !last));
                            }
                            else {
                                ggp.set_child(dir2, RBTree.double_rotate(gp, !last));
                            }
                        }
                        var cmp = this._comparator(node.data, data);
                        // stop if found
                        if (cmp === 0) {
                            break;
                        }
                        last = dir;
                        dir = cmp < 0;
                        // update helpers
                        if (gp !== null) {
                            ggp = gp;
                        }
                        gp = p;
                        p = node;
                        node = node.get_child(dir);
                    }
                    // update root
                    this._root = head.right;
                }
                // make root black
                this._root.red = false;
                return ret;
            };
            ;
            // returns true if removed, false if not found
            RBTree.prototype.remove = function (data) {
                if (this._root === null) {
                    return false;
                }
                var head = new Node(undefined); // fake tree root
                var node = head;
                node.right = this._root;
                var p = null; // parent
                var gp = null; // grand parent
                var found = null; // found item
                var dir = true;
                while (node.get_child(dir) !== null) {
                    var last = dir;
                    // update helpers
                    gp = p;
                    p = node;
                    node = node.get_child(dir);
                    var cmp = this._comparator(data, node.data);
                    dir = cmp > 0;
                    // save found node
                    if (cmp === 0) {
                        found = node;
                    }
                    // push the red node down
                    if (!RBTree.is_red(node) && !RBTree.is_red(node.get_child(dir))) {
                        if (RBTree.is_red(node.get_child(!dir))) {
                            var sr = RBTree.single_rotate(node, dir);
                            p.set_child(last, sr);
                            p = sr;
                        }
                        else if (!RBTree.is_red(node.get_child(!dir))) {
                            var sibling = p.get_child(!last);
                            if (sibling !== null) {
                                if (!RBTree.is_red(sibling.get_child(!last)) && !RBTree.is_red(sibling.get_child(last))) {
                                    // color flip
                                    p.red = false;
                                    sibling.red = true;
                                    node.red = true;
                                }
                                else {
                                    var dir2 = gp.right === p;
                                    if (RBTree.is_red(sibling.get_child(last))) {
                                        gp.set_child(dir2, RBTree.double_rotate(p, last));
                                    }
                                    else if (RBTree.is_red(sibling.get_child(!last))) {
                                        gp.set_child(dir2, RBTree.single_rotate(p, last));
                                    }
                                    // ensure correct coloring
                                    var gpc = gp.get_child(dir2);
                                    gpc.red = true;
                                    node.red = true;
                                    gpc.left.red = false;
                                    gpc.right.red = false;
                                }
                            }
                        }
                    }
                }
                // replace and remove if found
                if (found !== null) {
                    found.data = node.data;
                    p.set_child(p.right === node, node.get_child(node.left === null));
                    this.size--;
                }
                // update root and make it black
                this._root = head.right;
                if (this._root !== null) {
                    this._root.red = false;
                }
                return found !== null;
            };
            ;
            RBTree.is_red = function (node) {
                return node !== null && node.red;
            };
            RBTree.single_rotate = function (root, dir) {
                var save = root.get_child(!dir);
                root.set_child(!dir, save.get_child(dir));
                save.set_child(dir, root);
                root.red = true;
                save.red = false;
                return save;
            };
            RBTree.double_rotate = function (root, dir) {
                root.set_child(!dir, RBTree.single_rotate(root.get_child(!dir), !dir));
                return RBTree.single_rotate(root, dir);
            };
            return RBTree;
        })(TreeBase);
        vpsc.RBTree = RBTree;
    })(vpsc = cola.vpsc || (cola.vpsc = {}));
})(cola || (cola = {}));
///<reference path="vpsc.ts"/>
///<reference path="rbtree.ts"/>
var cola;
(function (cola) {
    var vpsc;
    (function (vpsc) {
        function computeGroupBounds(g) {
            g.bounds = typeof g.leaves !== "undefined" ?
                g.leaves.reduce(function (r, c) { return c.bounds.union(r); }, Rectangle.empty()) :
                Rectangle.empty();
            if (typeof g.groups !== "undefined")
                g.bounds = g.groups.reduce(function (r, c) { return computeGroupBounds(c).union(r); }, g.bounds);
            g.bounds = g.bounds.inflate(g.padding);
            return g.bounds;
        }
        vpsc.computeGroupBounds = computeGroupBounds;
        var Rectangle = (function () {
            function Rectangle(x, X, y, Y) {
                this.x = x;
                this.X = X;
                this.y = y;
                this.Y = Y;
            }
            Rectangle.empty = function () { return new Rectangle(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY); };
            Rectangle.prototype.cx = function () { return (this.x + this.X) / 2; };
            Rectangle.prototype.cy = function () { return (this.y + this.Y) / 2; };
            Rectangle.prototype.overlapX = function (r) {
                var ux = this.cx(), vx = r.cx();
                if (ux <= vx && r.x < this.X)
                    return this.X - r.x;
                if (vx <= ux && this.x < r.X)
                    return r.X - this.x;
                return 0;
            };
            Rectangle.prototype.overlapY = function (r) {
                var uy = this.cy(), vy = r.cy();
                if (uy <= vy && r.y < this.Y)
                    return this.Y - r.y;
                if (vy <= uy && this.y < r.Y)
                    return r.Y - this.y;
                return 0;
            };
            Rectangle.prototype.setXCentre = function (cx) {
                var dx = cx - this.cx();
                this.x += dx;
                this.X += dx;
            };
            Rectangle.prototype.setYCentre = function (cy) {
                var dy = cy - this.cy();
                this.y += dy;
                this.Y += dy;
            };
            Rectangle.prototype.width = function () {
                return this.X - this.x;
            };
            Rectangle.prototype.height = function () {
                return this.Y - this.y;
            };
            Rectangle.prototype.union = function (r) {
                return new Rectangle(Math.min(this.x, r.x), Math.max(this.X, r.X), Math.min(this.y, r.y), Math.max(this.Y, r.Y));
            };
            /**
             * return any intersection points between the given line and the sides of this rectangle
             * @method lineIntersection
             * @param x1 number first x coord of line
             * @param y1 number first y coord of line
             * @param x2 number second x coord of line
             * @param y2 number second y coord of line
             * @return any intersection points found
             */
            Rectangle.prototype.lineIntersections = function (x1, y1, x2, y2) {
                var sides = [[this.x, this.y, this.X, this.y],
                    [this.X, this.y, this.X, this.Y],
                    [this.X, this.Y, this.x, this.Y],
                    [this.x, this.Y, this.x, this.y]];
                var intersections = [];
                for (var i = 0; i < 4; ++i) {
                    var r = Rectangle.lineIntersection(x1, y1, x2, y2, sides[i][0], sides[i][1], sides[i][2], sides[i][3]);
                    if (r !== null)
                        intersections.push({ x: r.x, y: r.y });
                }
                return intersections;
            };
            /**
             * return any intersection points between a line extending from the centre of this rectangle to the given point,
             *  and the sides of this rectangle
             * @method lineIntersection
             * @param x2 number second x coord of line
             * @param y2 number second y coord of line
             * @return any intersection points found
             */
            Rectangle.prototype.rayIntersection = function (x2, y2) {
                var ints = this.lineIntersections(this.cx(), this.cy(), x2, y2);
                return ints.length > 0 ? ints[0] : null;
            };
            Rectangle.prototype.vertices = function () {
                return [
                    { x: this.x, y: this.y },
                    { x: this.X, y: this.y },
                    { x: this.X, y: this.Y },
                    { x: this.x, y: this.Y },
                    { x: this.x, y: this.y }];
            };
            Rectangle.lineIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
                var dx12 = x2 - x1, dx34 = x4 - x3, dy12 = y2 - y1, dy34 = y4 - y3, denominator = dy34 * dx12 - dx34 * dy12;
                if (denominator == 0)
                    return null;
                var dx31 = x1 - x3, dy31 = y1 - y3, numa = dx34 * dy31 - dy34 * dx31, a = numa / denominator, numb = dx12 * dy31 - dy12 * dx31, b = numb / denominator;
                if (a >= 0 && a <= 1 && b >= 0 && b <= 1) {
                    return {
                        x: x1 + a * dx12,
                        y: y1 + a * dy12
                    };
                }
                return null;
            };
            Rectangle.prototype.inflate = function (pad) {
                return new Rectangle(this.x - pad, this.X + pad, this.y - pad, this.Y + pad);
            };
            return Rectangle;
        })();
        vpsc.Rectangle = Rectangle;
        function makeEdgeBetween(source, target, ah) {
            var si = source.rayIntersection(target.cx(), target.cy()) || { x: source.cx(), y: source.cy() }, ti = target.rayIntersection(source.cx(), source.cy()) || { x: target.cx(), y: target.cy() }, dx = ti.x - si.x, dy = ti.y - si.y, l = Math.sqrt(dx * dx + dy * dy), al = l - ah;
            return {
                sourceIntersection: si,
                targetIntersection: ti,
                arrowStart: { x: si.x + al * dx / l, y: si.y + al * dy / l }
            };
        }
        vpsc.makeEdgeBetween = makeEdgeBetween;
        function makeEdgeTo(s, target, ah) {
            var ti = target.rayIntersection(s.x, s.y);
            if (!ti)
                ti = { x: target.cx(), y: target.cy() };
            var dx = ti.x - s.x, dy = ti.y - s.y, l = Math.sqrt(dx * dx + dy * dy);
            return { x: ti.x - ah * dx / l, y: ti.y - ah * dy / l };
        }
        vpsc.makeEdgeTo = makeEdgeTo;
        var Node = (function () {
            function Node(v, r, pos) {
                this.v = v;
                this.r = r;
                this.pos = pos;
                this.prev = makeRBTree();
                this.next = makeRBTree();
            }
            return Node;
        })();
        var Event = (function () {
            function Event(isOpen, v, pos) {
                this.isOpen = isOpen;
                this.v = v;
                this.pos = pos;
            }
            return Event;
        })();
        function compareEvents(a, b) {
            if (a.pos > b.pos) {
                return 1;
            }
            if (a.pos < b.pos) {
                return -1;
            }
            if (a.isOpen) {
                // open must come before close
                return -1;
            }
            if (b.isOpen) {
                // open must come before close
                return 1;
            }
            return 0;
        }
        function makeRBTree() {
            return new vpsc.RBTree(function (a, b) { return a.pos - b.pos; });
        }
        var xRect = {
            getCentre: function (r) { return r.cx(); },
            getOpen: function (r) { return r.y; },
            getClose: function (r) { return r.Y; },
            getSize: function (r) { return r.width(); },
            makeRect: function (open, close, center, size) { return new Rectangle(center - size / 2, center + size / 2, open, close); },
            findNeighbours: findXNeighbours
        };
        var yRect = {
            getCentre: function (r) { return r.cy(); },
            getOpen: function (r) { return r.x; },
            getClose: function (r) { return r.X; },
            getSize: function (r) { return r.height(); },
            makeRect: function (open, close, center, size) { return new Rectangle(open, close, center - size / 2, center + size / 2); },
            findNeighbours: findYNeighbours
        };
        function generateGroupConstraints(root, f, minSep, isContained) {
            if (isContained === void 0) { isContained = false; }
            var padding = root.padding, gn = typeof root.groups !== 'undefined' ? root.groups.length : 0, ln = typeof root.leaves !== 'undefined' ? root.leaves.length : 0, childConstraints = !gn ? []
                : root.groups.reduce(function (ccs, g) { return ccs.concat(generateGroupConstraints(g, f, minSep, true)); }, []), n = (isContained ? 2 : 0) + ln + gn, vs = new Array(n), rs = new Array(n), i = 0, add = function (r, v) { rs[i] = r; vs[i++] = v; };
            if (isContained) {
                // if this group is contained by another, then we add two dummy vars and rectangles for the borders
                var b = root.bounds, c = f.getCentre(b), s = f.getSize(b) / 2, open = f.getOpen(b), close = f.getClose(b), min = c - s + padding / 2, max = c + s - padding / 2;
                root.minVar.desiredPosition = min;
                add(f.makeRect(open, close, min, padding), root.minVar);
                root.maxVar.desiredPosition = max;
                add(f.makeRect(open, close, max, padding), root.maxVar);
            }
            if (ln)
                root.leaves.forEach(function (l) { return add(l.bounds, l.variable); });
            if (gn)
                root.groups.forEach(function (g) {
                    var b = g.bounds;
                    add(f.makeRect(f.getOpen(b), f.getClose(b), f.getCentre(b), f.getSize(b)), g.minVar);
                });
            var cs = generateConstraints(rs, vs, f, minSep);
            if (gn) {
                vs.forEach(function (v) { v.cOut = [], v.cIn = []; });
                cs.forEach(function (c) { c.left.cOut.push(c), c.right.cIn.push(c); });
                root.groups.forEach(function (g) {
                    var gapAdjustment = (g.padding - f.getSize(g.bounds)) / 2;
                    g.minVar.cIn.forEach(function (c) { return c.gap += gapAdjustment; });
                    g.minVar.cOut.forEach(function (c) { c.left = g.maxVar; c.gap += gapAdjustment; });
                });
            }
            return childConstraints.concat(cs);
        }
        function generateConstraints(rs, vars, rect, minSep) {
            var i, n = rs.length;
            var N = 2 * n;
            console.assert(vars.length >= n);
            var events = new Array(N);
            for (i = 0; i < n; ++i) {
                var r = rs[i];
                var v = new Node(vars[i], r, rect.getCentre(r));
                events[i] = new Event(true, v, rect.getOpen(r));
                events[i + n] = new Event(false, v, rect.getClose(r));
            }
            events.sort(compareEvents);
            var cs = new Array();
            var scanline = makeRBTree();
            for (i = 0; i < N; ++i) {
                var e = events[i];
                var v = e.v;
                if (e.isOpen) {
                    scanline.insert(v);
                    rect.findNeighbours(v, scanline);
                }
                else {
                    // close event
                    scanline.remove(v);
                    var makeConstraint = function (l, r) {
                        var sep = (rect.getSize(l.r) + rect.getSize(r.r)) / 2 + minSep;
                        cs.push(new vpsc.Constraint(l.v, r.v, sep));
                    };
                    var visitNeighbours = function (forward, reverse, mkcon) {
                        var u, it = v[forward].iterator();
                        while ((u = it[forward]()) !== null) {
                            mkcon(u, v);
                            u[reverse].remove(v);
                        }
                    };
                    visitNeighbours("prev", "next", function (u, v) { return makeConstraint(u, v); });
                    visitNeighbours("next", "prev", function (u, v) { return makeConstraint(v, u); });
                }
            }
            console.assert(scanline.size === 0);
            return cs;
        }
        function findXNeighbours(v, scanline) {
            var f = function (forward, reverse) {
                var it = scanline.findIter(v);
                var u;
                while ((u = it[forward]()) !== null) {
                    var uovervX = u.r.overlapX(v.r);
                    if (uovervX <= 0 || uovervX <= u.r.overlapY(v.r)) {
                        v[forward].insert(u);
                        u[reverse].insert(v);
                    }
                    if (uovervX <= 0) {
                        break;
                    }
                }
            };
            f("next", "prev");
            f("prev", "next");
        }
        function findYNeighbours(v, scanline) {
            var f = function (forward, reverse) {
                var u = scanline.findIter(v)[forward]();
                if (u !== null && u.r.overlapX(v.r) > 0) {
                    v[forward].insert(u);
                    u[reverse].insert(v);
                }
            };
            f("next", "prev");
            f("prev", "next");
        }
        function generateXConstraints(rs, vars) {
            return generateConstraints(rs, vars, xRect, 1e-6);
        }
        vpsc.generateXConstraints = generateXConstraints;
        function generateYConstraints(rs, vars) {
            return generateConstraints(rs, vars, yRect, 1e-6);
        }
        vpsc.generateYConstraints = generateYConstraints;
        function generateXGroupConstraints(root) {
            return generateGroupConstraints(root, xRect, 1e-6);
        }
        vpsc.generateXGroupConstraints = generateXGroupConstraints;
        function generateYGroupConstraints(root) {
            return generateGroupConstraints(root, yRect, 1e-6);
        }
        vpsc.generateYGroupConstraints = generateYGroupConstraints;
        function removeOverlaps(rs) {
            var vs = rs.map(function (r) { return new vpsc.Variable(r.cx()); });
            var cs = vpsc.generateXConstraints(rs, vs);
            var solver = new vpsc.Solver(vs, cs);
            solver.solve();
            vs.forEach(function (v, i) { return rs[i].setXCentre(v.position()); });
            vs = rs.map(function (r) { return new vpsc.Variable(r.cy()); });
            cs = vpsc.generateYConstraints(rs, vs);
            solver = new vpsc.Solver(vs, cs);
            solver.solve();
            vs.forEach(function (v, i) { return rs[i].setYCentre(v.position()); });
        }
        vpsc.removeOverlaps = removeOverlaps;
        var IndexedVariable = (function (_super) {
            __extends(IndexedVariable, _super);
            function IndexedVariable(index, w) {
                _super.call(this, 0, w);
                this.index = index;
            }
            return IndexedVariable;
        })(vpsc.Variable);
        vpsc.IndexedVariable = IndexedVariable;
        var Projection = (function () {
            function Projection(nodes, groups, rootGroup, constraints, avoidOverlaps) {
                var _this = this;
                if (rootGroup === void 0) { rootGroup = null; }
                if (constraints === void 0) { constraints = null; }
                if (avoidOverlaps === void 0) { avoidOverlaps = false; }
                this.nodes = nodes;
                this.groups = groups;
                this.rootGroup = rootGroup;
                this.avoidOverlaps = avoidOverlaps;
                this.variables = nodes.map(function (v, i) {
                    return v.variable = new IndexedVariable(i, 1);
                });
                if (constraints)
                    this.createConstraints(constraints);
                if (avoidOverlaps && rootGroup && typeof rootGroup.groups !== 'undefined') {
                    nodes.forEach(function (v) {
                        if (!v.width || !v.height) {
                            //If undefined, default to nothing
                            v.bounds = new vpsc.Rectangle(v.x, v.x, v.y, v.y);
                            return;
                        }
                        var w2 = v.width / 2, h2 = v.height / 2;
                        v.bounds = new vpsc.Rectangle(v.x - w2, v.x + w2, v.y - h2, v.y + h2);
                    });
                    computeGroupBounds(rootGroup);
                    var i = nodes.length;
                    groups.forEach(function (g) {
                        _this.variables[i] = g.minVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
                        _this.variables[i] = g.maxVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
                    });
                }
            }
            Projection.prototype.createSeparation = function (c) {
                return new vpsc.Constraint(this.nodes[c.left].variable, this.nodes[c.right].variable, c.gap, typeof c.equality !== "undefined" ? c.equality : false);
            };
            Projection.prototype.makeFeasible = function (c) {
                var _this = this;
                if (!this.avoidOverlaps)
                    return;
                var axis = 'x', dim = 'width';
                if (c.axis === 'x')
                    axis = 'y', dim = 'height';
                var vs = c.offsets.map(function (o) { return _this.nodes[o.node]; }).sort(function (a, b) { return a[axis] - b[axis]; });
                var p = null;
                vs.forEach(function (v) {
                    if (p)
                        v[axis] = p[axis] + p[dim] + 1;
                    p = v;
                });
            };
            Projection.prototype.createAlignment = function (c) {
                var _this = this;
                var u = this.nodes[c.offsets[0].node].variable;
                this.makeFeasible(c);
                var cs = c.axis === 'x' ? this.xConstraints : this.yConstraints;
                c.offsets.slice(1).forEach(function (o) {
                    var v = _this.nodes[o.node].variable;
                    cs.push(new vpsc.Constraint(u, v, o.offset, true));
                });
            };
            Projection.prototype.createConstraints = function (constraints) {
                var _this = this;
                var isSep = function (c) { return typeof c.type === 'undefined' || c.type === 'separation'; };
                this.xConstraints = constraints
                    .filter(function (c) { return c.axis === "x" && isSep(c); })
                    .map(function (c) { return _this.createSeparation(c); });
                this.yConstraints = constraints
                    .filter(function (c) { return c.axis === "y" && isSep(c); })
                    .map(function (c) { return _this.createSeparation(c); });
                constraints
                    .filter(function (c) { return c.type === 'alignment'; })
                    .forEach(function (c) { return _this.createAlignment(c); });
            };
            Projection.prototype.setupVariablesAndBounds = function (x0, y0, desired, getDesired) {
                this.nodes.forEach(function (v, i) {
                    if (v.fixed) {
                        v.variable.weight = v.fixedWeight ? v.fixedWeight : 1000;
                        desired[i] = getDesired(v);
                    }
                    else {
                        v.variable.weight = 1;
                    }
                    var w = (v.width || 0) / 2, h = (v.height || 0) / 2;
                    var ix = x0[i], iy = y0[i];
                    v.bounds = new Rectangle(ix - w, ix + w, iy - h, iy + h);
                });
            };
            Projection.prototype.xProject = function (x0, y0, x) {
                if (!this.rootGroup && !(this.avoidOverlaps || this.xConstraints))
                    return;
                this.project(x0, y0, x0, x, function (v) { return v.px; }, this.xConstraints, generateXGroupConstraints, function (v) { return v.bounds.setXCentre(x[v.variable.index] = v.variable.position()); }, function (g) {
                    var xmin = x[g.minVar.index] = g.minVar.position();
                    var xmax = x[g.maxVar.index] = g.maxVar.position();
                    var p2 = g.padding / 2;
                    g.bounds.x = xmin - p2;
                    g.bounds.X = xmax + p2;
                });
            };
            Projection.prototype.yProject = function (x0, y0, y) {
                if (!this.rootGroup && !this.yConstraints)
                    return;
                this.project(x0, y0, y0, y, function (v) { return v.py; }, this.yConstraints, generateYGroupConstraints, function (v) { return v.bounds.setYCentre(y[v.variable.index] = v.variable.position()); }, function (g) {
                    var ymin = y[g.minVar.index] = g.minVar.position();
                    var ymax = y[g.maxVar.index] = g.maxVar.position();
                    var p2 = g.padding / 2;
                    g.bounds.y = ymin - p2;
                    ;
                    g.bounds.Y = ymax + p2;
                });
            };
            Projection.prototype.projectFunctions = function () {
                var _this = this;
                return [
                    function (x0, y0, x) { return _this.xProject(x0, y0, x); },
                    function (x0, y0, y) { return _this.yProject(x0, y0, y); }
                ];
            };
            Projection.prototype.project = function (x0, y0, start, desired, getDesired, cs, generateConstraints, updateNodeBounds, updateGroupBounds) {
                this.setupVariablesAndBounds(x0, y0, desired, getDesired);
                if (this.rootGroup && this.avoidOverlaps) {
                    computeGroupBounds(this.rootGroup);
                    cs = cs.concat(generateConstraints(this.rootGroup));
                }
                this.solve(this.variables, cs, start, desired);
                this.nodes.forEach(updateNodeBounds);
                if (this.rootGroup && this.avoidOverlaps) {
                    this.groups.forEach(updateGroupBounds);
                }
            };
            Projection.prototype.solve = function (vs, cs, starting, desired) {
                var solver = new vpsc.Solver(vs, cs);
                solver.setStartingPositions(starting);
                solver.setDesiredPositions(desired);
                solver.solve();
            };
            return Projection;
        })();
        vpsc.Projection = Projection;
    })(vpsc = cola.vpsc || (cola.vpsc = {}));
})(cola || (cola = {}));
///<reference path="vpsc.ts"/>
///<reference path="rectangle.ts"/>
var cola;
(function (cola) {
    var geom;
    (function (geom) {
        var Point = (function () {
            function Point() {
            }
            return Point;
        })();
        geom.Point = Point;
        var LineSegment = (function () {
            function LineSegment(x1, y1, x2, y2) {
                this.x1 = x1;
                this.y1 = y1;
                this.x2 = x2;
                this.y2 = y2;
            }
            return LineSegment;
        })();
        geom.LineSegment = LineSegment;
        var PolyPoint = (function (_super) {
            __extends(PolyPoint, _super);
            function PolyPoint() {
                _super.apply(this, arguments);
            }
            return PolyPoint;
        })(Point);
        geom.PolyPoint = PolyPoint;
        /** tests if a point is Left|On|Right of an infinite line.
         * @param points P0, P1, and P2
         * @return >0 for P2 left of the line through P0 and P1
         *            =0 for P2 on the line
         *            <0 for P2 right of the line
         */
        function isLeft(P0, P1, P2) {
            return (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
        }
        geom.isLeft = isLeft;
        function above(p, vi, vj) {
            return isLeft(p, vi, vj) > 0;
        }
        function below(p, vi, vj) {
            return isLeft(p, vi, vj) < 0;
        }
        /**
         * returns the convex hull of a set of points using Andrew's monotone chain algorithm
         * see: http://geomalgorithms.com/a10-_hull-1.html#Monotone%20Chain
         * @param S array of points
         * @return the convex hull as an array of points
         */
        function ConvexHull(S) {
            var P = S.slice(0).sort(function (a, b) { return a.x !== b.x ? b.x - a.x : b.y - a.y; });
            var n = S.length, i;
            var minmin = 0;
            var xmin = P[0].x;
            for (i = 1; i < n; ++i) {
                if (P[i].x !== xmin)
                    break;
            }
            var minmax = i - 1;
            var H = [];
            H.push(P[minmin]); // push minmin point onto stack
            if (minmax === n - 1) {
                if (P[minmax].y !== P[minmin].y)
                    H.push(P[minmax]);
            }
            else {
                // Get the indices of points with max x-coord and min|max y-coord
                var maxmin, maxmax = n - 1;
                var xmax = P[n - 1].x;
                for (i = n - 2; i >= 0; i--)
                    if (P[i].x !== xmax)
                        break;
                maxmin = i + 1;
                // Compute the lower hull on the stack H
                i = minmax;
                while (++i <= maxmin) {
                    // the lower line joins P[minmin]  with P[maxmin]
                    if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin)
                        continue; // ignore P[i] above or on the lower line
                    while (H.length > 1) {
                        // test if  P[i] is left of the line at the stack top
                        if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                            break; // P[i] is a new hull  vertex
                        else
                            H.length -= 1; // pop top point off  stack
                    }
                    if (i != minmin)
                        H.push(P[i]);
                }
                // Next, compute the upper hull on the stack H above the bottom hull
                if (maxmax != maxmin)
                    H.push(P[maxmax]); // push maxmax point onto stack
                var bot = H.length; // the bottom point of the upper hull stack
                i = maxmin;
                while (--i >= minmax) {
                    // the upper line joins P[maxmax]  with P[minmax]
                    if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax)
                        continue; // ignore P[i] below or on the upper line
                    while (H.length > bot) {
                        // test if  P[i] is left of the line at the stack top
                        if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                            break; // P[i] is a new hull  vertex
                        else
                            H.length -= 1; // pop top point off  stack
                    }
                    if (i != minmin)
                        H.push(P[i]); // push P[i] onto stack
                }
            }
            return H;
        }
        geom.ConvexHull = ConvexHull;
        // apply f to the points in P in clockwise order around the point p
        function clockwiseRadialSweep(p, P, f) {
            P.slice(0).sort(function (a, b) { return Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x); }).forEach(f);
        }
        geom.clockwiseRadialSweep = clockwiseRadialSweep;
        function nextPolyPoint(p, ps) {
            if (p.polyIndex === ps.length - 1)
                return ps[0];
            return ps[p.polyIndex + 1];
        }
        function prevPolyPoint(p, ps) {
            if (p.polyIndex === 0)
                return ps[ps.length - 1];
            return ps[p.polyIndex - 1];
        }
        // tangent_PointPolyC(): fast binary search for tangents to a convex polygon
        //    Input:  P = a 2D point (exterior to the polygon)
        //            n = number of polygon vertices
        //            V = array of vertices for a 2D convex polygon with V[n] = V[0]
        //    Output: rtan = index of rightmost tangent point V[rtan]
        //            ltan = index of leftmost tangent point V[ltan]
        function tangent_PointPolyC(P, V) {
            return { rtan: Rtangent_PointPolyC(P, V), ltan: Ltangent_PointPolyC(P, V) };
        }
        // Rtangent_PointPolyC(): binary search for convex polygon right tangent
        //    Input:  P = a 2D point (exterior to the polygon)
        //            n = number of polygon vertices
        //            V = array of vertices for a 2D convex polygon with V[n] = V[0]
        //    Return: index "i" of rightmost tangent point V[i]
        function Rtangent_PointPolyC(P, V) {
            var n = V.length - 1;
            // use binary search for large convex polygons
            var a, b, c; // indices for edge chain endpoints
            var upA, dnC; // test for up direction of edges a and c
            // rightmost tangent = maximum for the isLeft() ordering
            // test if V[0] is a local maximum
            if (below(P, V[1], V[0]) && !above(P, V[n - 1], V[0]))
                return 0; // V[0] is the maximum tangent point
            for (a = 0, b = n;;) {
                if (b - a === 1)
                    if (above(P, V[a], V[b]))
                        return a;
                    else
                        return b;
                c = Math.floor((a + b) / 2); // midpoint of [a,b], and 0<c<n
                dnC = below(P, V[c + 1], V[c]);
                if (dnC && !above(P, V[c - 1], V[c]))
                    return c; // V[c] is the maximum tangent point
                // no max yet, so continue with the binary search
                // pick one of the two subchains [a,c] or [c,b]
                upA = above(P, V[a + 1], V[a]);
                if (upA) {
                    if (dnC)
                        b = c; // select [a,c]
                    else {
                        if (above(P, V[a], V[c]))
                            b = c; // select [a,c]
                        else
                            a = c; // select [c,b]
                    }
                }
                else {
                    if (!dnC)
                        a = c; // select [c,b]
                    else {
                        if (below(P, V[a], V[c]))
                            b = c; // select [a,c]
                        else
                            a = c; // select [c,b]
                    }
                }
            }
        }
        // Ltangent_PointPolyC(): binary search for convex polygon left tangent
        //    Input:  P = a 2D point (exterior to the polygon)
        //            n = number of polygon vertices
        //            V = array of vertices for a 2D convex polygon with V[n]=V[0]
        //    Return: index "i" of leftmost tangent point V[i]
        function Ltangent_PointPolyC(P, V) {
            var n = V.length - 1;
            // use binary search for large convex polygons
            var a, b, c; // indices for edge chain endpoints
            var dnA, dnC; // test for down direction of edges a and c
            // leftmost tangent = minimum for the isLeft() ordering
            // test if V[0] is a local minimum
            if (above(P, V[n - 1], V[0]) && !below(P, V[1], V[0]))
                return 0; // V[0] is the minimum tangent point
            for (a = 0, b = n;;) {
                if (b - a === 1)
                    if (below(P, V[a], V[b]))
                        return a;
                    else
                        return b;
                c = Math.floor((a + b) / 2); // midpoint of [a,b], and 0<c<n
                dnC = below(P, V[c + 1], V[c]);
                if (above(P, V[c - 1], V[c]) && !dnC)
                    return c; // V[c] is the minimum tangent point
                // no min yet, so continue with the binary search
                // pick one of the two subchains [a,c] or [c,b]
                dnA = below(P, V[a + 1], V[a]);
                if (dnA) {
                    if (!dnC)
                        b = c; // select [a,c]
                    else {
                        if (below(P, V[a], V[c]))
                            b = c; // select [a,c]
                        else
                            a = c; // select [c,b]
                    }
                }
                else {
                    if (dnC)
                        a = c; // select [c,b]
                    else {
                        if (above(P, V[a], V[c]))
                            b = c; // select [a,c]
                        else
                            a = c; // select [c,b]
                    }
                }
            }
        }
        // RLtangent_PolyPolyC(): get the RL tangent between two convex polygons
        //    Input:  m = number of vertices in polygon 1
        //            V = array of vertices for convex polygon 1 with V[m]=V[0]
        //            n = number of vertices in polygon 2
        //            W = array of vertices for convex polygon 2 with W[n]=W[0]
        //    Output: *t1 = index of tangent point V[t1] for polygon 1
        //            *t2 = index of tangent point W[t2] for polygon 2
        function tangent_PolyPolyC(V, W, t1, t2, cmp1, cmp2) {
            var ix1, ix2; // search indices for polygons 1 and 2
            // first get the initial vertex on each polygon
            ix1 = t1(W[0], V); // right tangent from W[0] to V
            ix2 = t2(V[ix1], W); // left tangent from V[ix1] to W
            // ping-pong linear search until it stabilizes
            var done = false; // flag when done
            while (!done) {
                done = true; // assume done until...
                while (true) {
                    if (ix1 === V.length - 1)
                        ix1 = 0;
                    if (cmp1(W[ix2], V[ix1], V[ix1 + 1]))
                        break;
                    ++ix1; // get Rtangent from W[ix2] to V
                }
                while (true) {
                    if (ix2 === 0)
                        ix2 = W.length - 1;
                    if (cmp2(V[ix1], W[ix2], W[ix2 - 1]))
                        break;
                    --ix2; // get Ltangent from V[ix1] to W
                    done = false; // not done if had to adjust this
                }
            }
            return { t1: ix1, t2: ix2 };
        }
        geom.tangent_PolyPolyC = tangent_PolyPolyC;
        function LRtangent_PolyPolyC(V, W) {
            var rl = RLtangent_PolyPolyC(W, V);
            return { t1: rl.t2, t2: rl.t1 };
        }
        geom.LRtangent_PolyPolyC = LRtangent_PolyPolyC;
        function RLtangent_PolyPolyC(V, W) {
            return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Ltangent_PointPolyC, above, below);
        }
        geom.RLtangent_PolyPolyC = RLtangent_PolyPolyC;
        function LLtangent_PolyPolyC(V, W) {
            return tangent_PolyPolyC(V, W, Ltangent_PointPolyC, Ltangent_PointPolyC, below, below);
        }
        geom.LLtangent_PolyPolyC = LLtangent_PolyPolyC;
        function RRtangent_PolyPolyC(V, W) {
            return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Rtangent_PointPolyC, above, above);
        }
        geom.RRtangent_PolyPolyC = RRtangent_PolyPolyC;
        var BiTangent = (function () {
            function BiTangent(t1, t2) {
                this.t1 = t1;
                this.t2 = t2;
            }
            return BiTangent;
        })();
        geom.BiTangent = BiTangent;
        var BiTangents = (function () {
            function BiTangents() {
            }
            return BiTangents;
        })();
        geom.BiTangents = BiTangents;
        var TVGPoint = (function (_super) {
            __extends(TVGPoint, _super);
            function TVGPoint() {
                _super.apply(this, arguments);
            }
            return TVGPoint;
        })(Point);
        geom.TVGPoint = TVGPoint;
        var VisibilityVertex = (function () {
            function VisibilityVertex(id, polyid, polyvertid, p) {
                this.id = id;
                this.polyid = polyid;
                this.polyvertid = polyvertid;
                this.p = p;
                p.vv = this;
            }
            return VisibilityVertex;
        })();
        geom.VisibilityVertex = VisibilityVertex;
        var VisibilityEdge = (function () {
            function VisibilityEdge(source, target) {
                this.source = source;
                this.target = target;
            }
            VisibilityEdge.prototype.length = function () {
                var dx = this.source.p.x - this.target.p.x;
                var dy = this.source.p.y - this.target.p.y;
                return Math.sqrt(dx * dx + dy * dy);
            };
            return VisibilityEdge;
        })();
        geom.VisibilityEdge = VisibilityEdge;
        var TangentVisibilityGraph = (function () {
            function TangentVisibilityGraph(P, g0) {
                this.P = P;
                this.V = [];
                this.E = [];
                if (!g0) {
                    var n = P.length;
                    for (var i = 0; i < n; i++) {
                        var p = P[i];
                        for (var j = 0; j < p.length; ++j) {
                            var pj = p[j], vv = new VisibilityVertex(this.V.length, i, j, pj);
                            this.V.push(vv);
                            if (j > 0)
                                this.E.push(new VisibilityEdge(p[j - 1].vv, vv));
                        }
                    }
                    for (var i = 0; i < n - 1; i++) {
                        var Pi = P[i];
                        for (var j = i + 1; j < n; j++) {
                            var Pj = P[j], t = geom.tangents(Pi, Pj);
                            for (var q in t) {
                                var c = t[q], source = Pi[c.t1], target = Pj[c.t2];
                                this.addEdgeIfVisible(source, target, i, j);
                            }
                        }
                    }
                }
                else {
                    this.V = g0.V.slice(0);
                    this.E = g0.E.slice(0);
                }
            }
            TangentVisibilityGraph.prototype.addEdgeIfVisible = function (u, v, i1, i2) {
                if (!this.intersectsPolys(new LineSegment(u.x, u.y, v.x, v.y), i1, i2)) {
                    this.E.push(new VisibilityEdge(u.vv, v.vv));
                }
            };
            TangentVisibilityGraph.prototype.addPoint = function (p, i1) {
                var n = this.P.length;
                this.V.push(new VisibilityVertex(this.V.length, n, 0, p));
                for (var i = 0; i < n; ++i) {
                    if (i === i1)
                        continue;
                    var poly = this.P[i], t = tangent_PointPolyC(p, poly);
                    this.addEdgeIfVisible(p, poly[t.ltan], i1, i);
                    this.addEdgeIfVisible(p, poly[t.rtan], i1, i);
                }
                return p.vv;
            };
            TangentVisibilityGraph.prototype.intersectsPolys = function (l, i1, i2) {
                for (var i = 0, n = this.P.length; i < n; ++i) {
                    if (i != i1 && i != i2 && intersects(l, this.P[i]).length > 0) {
                        return true;
                    }
                }
                return false;
            };
            return TangentVisibilityGraph;
        })();
        geom.TangentVisibilityGraph = TangentVisibilityGraph;
        function intersects(l, P) {
            var ints = [];
            for (var i = 1, n = P.length; i < n; ++i) {
                var int = cola.vpsc.Rectangle.lineIntersection(l.x1, l.y1, l.x2, l.y2, P[i - 1].x, P[i - 1].y, P[i].x, P[i].y);
                if (int)
                    ints.push(int);
            }
            return ints;
        }
        function tangents(V, W) {
            var m = V.length - 1, n = W.length - 1;
            var bt = new BiTangents();
            for (var i = 0; i < m; ++i) {
                for (var j = 0; j < n; ++j) {
                    var v1 = V[i == 0 ? m - 1 : i - 1];
                    var v2 = V[i];
                    var v3 = V[i + 1];
                    var w1 = W[j == 0 ? n - 1 : j - 1];
                    var w2 = W[j];
                    var w3 = W[j + 1];
                    var v1v2w2 = isLeft(v1, v2, w2);
                    var v2w1w2 = isLeft(v2, w1, w2);
                    var v2w2w3 = isLeft(v2, w2, w3);
                    var w1w2v2 = isLeft(w1, w2, v2);
                    var w2v1v2 = isLeft(w2, v1, v2);
                    var w2v2v3 = isLeft(w2, v2, v3);
                    if (v1v2w2 >= 0 && v2w1w2 >= 0 && v2w2w3 < 0
                        && w1w2v2 >= 0 && w2v1v2 >= 0 && w2v2v3 < 0) {
                        bt.ll = new BiTangent(i, j);
                    }
                    else if (v1v2w2 <= 0 && v2w1w2 <= 0 && v2w2w3 > 0
                        && w1w2v2 <= 0 && w2v1v2 <= 0 && w2v2v3 > 0) {
                        bt.rr = new BiTangent(i, j);
                    }
                    else if (v1v2w2 <= 0 && v2w1w2 > 0 && v2w2w3 <= 0
                        && w1w2v2 >= 0 && w2v1v2 < 0 && w2v2v3 >= 0) {
                        bt.rl = new BiTangent(i, j);
                    }
                    else if (v1v2w2 >= 0 && v2w1w2 < 0 && v2w2w3 >= 0
                        && w1w2v2 <= 0 && w2v1v2 > 0 && w2v2v3 <= 0) {
                        bt.lr = new BiTangent(i, j);
                    }
                }
            }
            return bt;
        }
        geom.tangents = tangents;
        function isPointInsidePoly(p, poly) {
            for (var i = 1, n = poly.length; i < n; ++i)
                if (below(poly[i - 1], poly[i], p))
                    return false;
            return true;
        }
        function isAnyPInQ(p, q) {
            return !p.every(function (v) { return !isPointInsidePoly(v, q); });
        }
        function polysOverlap(p, q) {
            if (isAnyPInQ(p, q))
                return true;
            if (isAnyPInQ(q, p))
                return true;
            for (var i = 1, n = p.length; i < n; ++i) {
                var v = p[i], u = p[i - 1];
                if (intersects(new LineSegment(u.x, u.y, v.x, v.y), q).length > 0)
                    return true;
            }
            return false;
        }
        geom.polysOverlap = polysOverlap;
    })(geom = cola.geom || (cola.geom = {}));
})(cola || (cola = {}));
/**
 * @module cola
 */
var cola;
(function (cola) {
    /**
     * Descent respects a collection of locks over nodes that should not move
     * @class Locks
     */
    var Locks = (function () {
        function Locks() {
            this.locks = {};
        }
        /**
         * add a lock on the node at index id
         * @method add
         * @param id index of node to be locked
         * @param x required position for node
         */
        Locks.prototype.add = function (id, x) {
            /* DEBUG
                        if (isNaN(x[0]) || isNaN(x[1])) debugger;
            DEBUG */
            this.locks[id] = x;
        };
        /**
         * @method clear clear all locks
         */
        Locks.prototype.clear = function () {
            this.locks = {};
        };
        /**
         * @isEmpty
         * @returns false if no locks exist
         */
        Locks.prototype.isEmpty = function () {
            for (var l in this.locks)
                return false;
            return true;
        };
        /**
         * perform an operation on each lock
         * @apply
         */
        Locks.prototype.apply = function (f) {
            for (var l in this.locks) {
                f(l, this.locks[l]);
            }
        };
        return Locks;
    })();
    cola.Locks = Locks;
    /**
     * Uses a gradient descent approach to reduce a stress or p-stress goal function over a graph with specified ideal edge lengths or a square matrix of dissimilarities.
     * The standard stress function over a graph nodes with position vectors x,y,z is (mathematica input):
     *   stress[x_,y_,z_,D_,w_]:=Sum[w[[i,j]] (length[x[[i]],y[[i]],z[[i]],x[[j]],y[[j]],z[[j]]]-d[[i,j]])^2,{i,Length[x]-1},{j,i+1,Length[x]}]
     * where: D is a square matrix of ideal separations between nodes, w is matrix of weights for those separations
     *        length[x1_, y1_, z1_, x2_, y2_, z2_] = Sqrt[(x1 - x2)^2 + (y1 - y2)^2 + (z1 - z2)^2]
     * below, we use wij = 1/(Dij^2)
     *
     * @class Descent
     */
    var Descent = (function () {
        /**
         * @method constructor
         * @param x {number[][]} initial coordinates for nodes
         * @param D {number[][]} matrix of desired distances between pairs of nodes
         * @param G {number[][]} [default=null] if specified, G is a matrix of weights for goal terms between pairs of nodes.
         * If G[i][j] > 1 and the separation between nodes i and j is greater than their ideal distance, then there is no contribution for this pair to the goal
         * If G[i][j] <= 1 then it is used as a weighting on the contribution of the variance between ideal and actual separation between i and j to the goal function
         */
        function Descent(x, D, G) {
            if (G === void 0) { G = null; }
            this.D = D;
            this.G = G;
            this.threshold = 0.0001;
            // Parameters for grid snap stress.
            // TODO: Make a pluggable "StressTerm" class instead of this
            // mess.
            this.numGridSnapNodes = 0;
            this.snapGridSize = 100;
            this.snapStrength = 1000;
            this.scaleSnapByMaxH = false;
            this.random = new PseudoRandom();
            this.project = null;
            this.x = x;
            this.k = x.length; // dimensionality
            var n = this.n = x[0].length; // number of nodes
            this.H = new Array(this.k);
            this.g = new Array(this.k);
            this.Hd = new Array(this.k);
            this.a = new Array(this.k);
            this.b = new Array(this.k);
            this.c = new Array(this.k);
            this.d = new Array(this.k);
            this.e = new Array(this.k);
            this.ia = new Array(this.k);
            this.ib = new Array(this.k);
            this.xtmp = new Array(this.k);
            this.locks = new Locks();
            this.minD = Number.MAX_VALUE;
            var i = n, j;
            while (i--) {
                j = n;
                while (--j > i) {
                    var d = D[i][j];
                    if (d > 0 && d < this.minD) {
                        this.minD = d;
                    }
                }
            }
            if (this.minD === Number.MAX_VALUE)
                this.minD = 1;
            i = this.k;
            while (i--) {
                this.g[i] = new Array(n);
                this.H[i] = new Array(n);
                j = n;
                while (j--) {
                    this.H[i][j] = new Array(n);
                }
                this.Hd[i] = new Array(n);
                this.a[i] = new Array(n);
                this.b[i] = new Array(n);
                this.c[i] = new Array(n);
                this.d[i] = new Array(n);
                this.e[i] = new Array(n);
                this.ia[i] = new Array(n);
                this.ib[i] = new Array(n);
                this.xtmp[i] = new Array(n);
            }
        }
        Descent.createSquareMatrix = function (n, f) {
            var M = new Array(n);
            for (var i = 0; i < n; ++i) {
                M[i] = new Array(n);
                for (var j = 0; j < n; ++j) {
                    M[i][j] = f(i, j);
                }
            }
            return M;
        };
        Descent.prototype.offsetDir = function () {
            var _this = this;
            var u = new Array(this.k);
            var l = 0;
            for (var i = 0; i < this.k; ++i) {
                var x = u[i] = this.random.getNextBetween(0.01, 1) - 0.5;
                l += x * x;
            }
            l = Math.sqrt(l);
            return u.map(function (x) { return x *= _this.minD / l; });
        };
        // compute first and second derivative information storing results in this.g and this.H
        Descent.prototype.computeDerivatives = function (x) {
            var _this = this;
            var n = this.n;
            if (n < 1)
                return;
            var i;
            /* DEBUG
                        for (var u: number = 0; u < n; ++u)
                            for (i = 0; i < this.k; ++i)
                                if (isNaN(x[i][u])) debugger;
            DEBUG */
            var d = new Array(this.k);
            var d2 = new Array(this.k);
            var Huu = new Array(this.k);
            var maxH = 0;
            for (var u = 0; u < n; ++u) {
                for (i = 0; i < this.k; ++i)
                    Huu[i] = this.g[i][u] = 0;
                for (var v = 0; v < n; ++v) {
                    if (u === v)
                        continue;
                    // The following loop randomly displaces nodes that are at identical positions
                    var maxDisplaces = n; // avoid infinite loop in the case of numerical issues, such as huge values
                    while (maxDisplaces--) {
                        var sd2 = 0;
                        for (i = 0; i < this.k; ++i) {
                            var dx = d[i] = x[i][u] - x[i][v];
                            sd2 += d2[i] = dx * dx;
                        }
                        if (sd2 > 1e-9)
                            break;
                        var rd = this.offsetDir();
                        for (i = 0; i < this.k; ++i)
                            x[i][v] += rd[i];
                    }
                    var l = Math.sqrt(sd2);
                    var D = this.D[u][v];
                    var weight = this.G != null ? this.G[u][v] : 1;
                    if (weight > 1 && l > D || !isFinite(D)) {
                        for (i = 0; i < this.k; ++i)
                            this.H[i][u][v] = 0;
                        continue;
                    }
                    if (weight > 1) {
                        weight = 1;
                    }
                    var D2 = D * D;
                    var gs = 2 * weight * (l - D) / (D2 * l);
                    var l3 = l * l * l;
                    var hs = 2 * -weight / (D2 * l3);
                    if (!isFinite(gs))
                        console.log(gs);
                    for (i = 0; i < this.k; ++i) {
                        this.g[i][u] += d[i] * gs;
                        Huu[i] -= this.H[i][u][v] = hs * (l3 + D * (d2[i] - sd2) + l * sd2);
                    }
                }
                for (i = 0; i < this.k; ++i)
                    maxH = Math.max(maxH, this.H[i][u][u] = Huu[i]);
            }
            // Grid snap forces
            var r = this.snapGridSize / 2;
            var g = this.snapGridSize;
            var w = this.snapStrength;
            var k = w / (r * r);
            var numNodes = this.numGridSnapNodes;
            //var numNodes = n;
            for (var u = 0; u < numNodes; ++u) {
                for (i = 0; i < this.k; ++i) {
                    var xiu = this.x[i][u];
                    var m = xiu / g;
                    var f = m % 1;
                    var q = m - f;
                    var a = Math.abs(f);
                    var dx = (a <= 0.5) ? xiu - q * g :
                        (xiu > 0) ? xiu - (q + 1) * g : xiu - (q - 1) * g;
                    if (-r < dx && dx <= r) {
                        if (this.scaleSnapByMaxH) {
                            this.g[i][u] += maxH * k * dx;
                            this.H[i][u][u] += maxH * k;
                        }
                        else {
                            this.g[i][u] += k * dx;
                            this.H[i][u][u] += k;
                        }
                    }
                }
            }
            if (!this.locks.isEmpty()) {
                this.locks.apply(function (u, p) {
                    for (i = 0; i < _this.k; ++i) {
                        _this.H[i][u][u] += maxH;
                        _this.g[i][u] -= maxH * (p[i] - x[i][u]);
                    }
                });
            }
            /* DEBUG
                        for (var u: number = 0; u < n; ++u)
                            for (i = 0; i < this.k; ++i) {
                                if (isNaN(this.g[i][u])) debugger;
                                for (var v: number = 0; v < n; ++v)
                                    if (isNaN(this.H[i][u][v])) debugger;
                            }
            DEBUG */
        };
        Descent.dotProd = function (a, b) {
            var x = 0, i = a.length;
            while (i--)
                x += a[i] * b[i];
            return x;
        };
        // result r = matrix m * vector v
        Descent.rightMultiply = function (m, v, r) {
            var i = m.length;
            while (i--)
                r[i] = Descent.dotProd(m[i], v);
        };
        // computes the optimal step size to take in direction d using the
        // derivative information in this.g and this.H
        // returns the scalar multiplier to apply to d to get the optimal step
        Descent.prototype.computeStepSize = function (d) {
            var numerator = 0, denominator = 0;
            for (var i = 0; i < this.k; ++i) {
                numerator += Descent.dotProd(this.g[i], d[i]);
                Descent.rightMultiply(this.H[i], d[i], this.Hd[i]);
                denominator += Descent.dotProd(d[i], this.Hd[i]);
            }
            if (denominator === 0 || !isFinite(denominator))
                return 0;
            return 1 * numerator / denominator;
        };
        Descent.prototype.reduceStress = function () {
            this.computeDerivatives(this.x);
            var alpha = this.computeStepSize(this.g);
            for (var i = 0; i < this.k; ++i) {
                this.takeDescentStep(this.x[i], this.g[i], alpha);
            }
            return this.computeStress();
        };
        Descent.copy = function (a, b) {
            var m = a.length, n = b[0].length;
            for (var i = 0; i < m; ++i) {
                for (var j = 0; j < n; ++j) {
                    b[i][j] = a[i][j];
                }
            }
        };
        // takes a step of stepSize * d from x0, and then project against any constraints.
        // result is returned in r.
        // x0: starting positions
        // r: result positions will be returned here
        // d: unconstrained descent vector
        // stepSize: amount to step along d
        Descent.prototype.stepAndProject = function (x0, r, d, stepSize) {
            Descent.copy(x0, r);
            this.takeDescentStep(r[0], d[0], stepSize);
            if (this.project)
                this.project[0](x0[0], x0[1], r[0]);
            this.takeDescentStep(r[1], d[1], stepSize);
            if (this.project)
                this.project[1](r[0], x0[1], r[1]);
            // todo: allow projection against constraints in higher dimensions
            for (var i = 2; i < this.k; i++)
                this.takeDescentStep(r[i], d[i], stepSize);
            // the following makes locks extra sticky... but hides the result of the projection from the consumer
            //if (!this.locks.isEmpty()) {
            //    this.locks.apply((u, p) => {
            //        for (var i = 0; i < this.k; i++) {
            //            r[i][u] = p[i];
            //        }
            //    });
            //}
        };
        Descent.mApply = function (m, n, f) {
            var i = m;
            while (i-- > 0) {
                var j = n;
                while (j-- > 0)
                    f(i, j);
            }
        };
        Descent.prototype.matrixApply = function (f) {
            Descent.mApply(this.k, this.n, f);
        };
        Descent.prototype.computeNextPosition = function (x0, r) {
            var _this = this;
            this.computeDerivatives(x0);
            var alpha = this.computeStepSize(this.g);
            this.stepAndProject(x0, r, this.g, alpha);
            /* DEBUG
                        for (var u: number = 0; u < this.n; ++u)
                            for (var i = 0; i < this.k; ++i)
                                if (isNaN(r[i][u])) debugger;
            DEBUG */
            if (this.project) {
                this.matrixApply(function (i, j) { return _this.e[i][j] = x0[i][j] - r[i][j]; });
                var beta = this.computeStepSize(this.e);
                beta = Math.max(0.2, Math.min(beta, 1));
                this.stepAndProject(x0, r, this.e, beta);
            }
        };
        Descent.prototype.run = function (iterations) {
            var stress = Number.MAX_VALUE, converged = false;
            while (!converged && iterations-- > 0) {
                var s = this.rungeKutta();
                converged = Math.abs(stress / s - 1) < this.threshold;
                stress = s;
            }
            return stress;
        };
        Descent.prototype.rungeKutta = function () {
            var _this = this;
            this.computeNextPosition(this.x, this.a);
            Descent.mid(this.x, this.a, this.ia);
            this.computeNextPosition(this.ia, this.b);
            Descent.mid(this.x, this.b, this.ib);
            this.computeNextPosition(this.ib, this.c);
            this.computeNextPosition(this.c, this.d);
            var disp = 0;
            this.matrixApply(function (i, j) {
                var x = (_this.a[i][j] + 2.0 * _this.b[i][j] + 2.0 * _this.c[i][j] + _this.d[i][j]) / 6.0, d = _this.x[i][j] - x;
                disp += d * d;
                _this.x[i][j] = x;
            });
            return disp;
        };
        Descent.mid = function (a, b, m) {
            Descent.mApply(a.length, a[0].length, function (i, j) {
                return m[i][j] = a[i][j] + (b[i][j] - a[i][j]) / 2.0;
            });
        };
        Descent.prototype.takeDescentStep = function (x, d, stepSize) {
            for (var i = 0; i < this.n; ++i) {
                x[i] = x[i] - stepSize * d[i];
            }
        };
        Descent.prototype.computeStress = function () {
            var stress = 0;
            for (var u = 0, nMinus1 = this.n - 1; u < nMinus1; ++u) {
                for (var v = u + 1, n = this.n; v < n; ++v) {
                    var l = 0;
                    for (var i = 0; i < this.k; ++i) {
                        var dx = this.x[i][u] - this.x[i][v];
                        l += dx * dx;
                    }
                    l = Math.sqrt(l);
                    var d = this.D[u][v];
                    if (!isFinite(d))
                        continue;
                    var rl = d - l;
                    var d2 = d * d;
                    stress += rl * rl / d2;
                }
            }
            return stress;
        };
        Descent.zeroDistance = 1e-10;
        return Descent;
    })();
    cola.Descent = Descent;
    // Linear congruential pseudo random number generator
    var PseudoRandom = (function () {
        function PseudoRandom(seed) {
            if (seed === void 0) { seed = 1; }
            this.seed = seed;
            this.a = 214013;
            this.c = 2531011;
            this.m = 2147483648;
            this.range = 32767;
        }
        // random real between 0 and 1
        PseudoRandom.prototype.getNext = function () {
            this.seed = (this.seed * this.a + this.c) % this.m;
            return (this.seed >> 16) / this.range;
        };
        // random real between min and max
        PseudoRandom.prototype.getNextBetween = function (min, max) {
            return min + this.getNext() * (max - min);
        };
        return PseudoRandom;
    })();
    cola.PseudoRandom = PseudoRandom;
})(cola || (cola = {}));
var cola;
(function (cola) {
    var powergraph;
    (function (powergraph) {
        var PowerEdge = (function () {
            function PowerEdge(source, target, type) {
                this.source = source;
                this.target = target;
                this.type = type;
            }
            return PowerEdge;
        })();
        powergraph.PowerEdge = PowerEdge;
        var Configuration = (function () {
            function Configuration(n, edges, linkAccessor, rootGroup) {
                var _this = this;
                this.linkAccessor = linkAccessor;
                this.modules = new Array(n);
                this.roots = [];
                if (rootGroup) {
                    this.initModulesFromGroup(rootGroup);
                }
                else {
                    this.roots.push(new ModuleSet());
                    for (var i = 0; i < n; ++i)
                        this.roots[0].add(this.modules[i] = new Module(i));
                }
                this.R = edges.length;
                edges.forEach(function (e) {
                    var s = _this.modules[linkAccessor.getSourceIndex(e)], t = _this.modules[linkAccessor.getTargetIndex(e)], type = linkAccessor.getType(e);
                    s.outgoing.add(type, t);
                    t.incoming.add(type, s);
                });
            }
            Configuration.prototype.initModulesFromGroup = function (group) {
                var moduleSet = new ModuleSet();
                this.roots.push(moduleSet);
                for (var i = 0; i < group.leaves.length; ++i) {
                    var node = group.leaves[i];
                    var module = new Module(node.id);
                    this.modules[node.id] = module;
                    moduleSet.add(module);
                }
                if (group.groups) {
                    for (var j = 0; j < group.groups.length; ++j) {
                        var child = group.groups[j];
                        // Propagate group properties (like padding, stiffness, ...) as module definition so that the generated power graph group will inherit it
                        var definition = {};
                        for (var prop in child)
                            if (prop !== "leaves" && prop !== "groups" && child.hasOwnProperty(prop))
                                definition[prop] = child[prop];
                        // Use negative module id to avoid clashes between predefined and generated modules
                        moduleSet.add(new Module(-1 - j, new LinkSets(), new LinkSets(), this.initModulesFromGroup(child), definition));
                    }
                }
                return moduleSet;
            };
            // merge modules a and b keeping track of their power edges and removing the from roots
            Configuration.prototype.merge = function (a, b, k) {
                if (k === void 0) { k = 0; }
                var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
                var children = new ModuleSet();
                children.add(a);
                children.add(b);
                var m = new Module(this.modules.length, outInt, inInt, children);
                this.modules.push(m);
                var update = function (s, i, o) {
                    s.forAll(function (ms, linktype) {
                        ms.forAll(function (n) {
                            var nls = n[i];
                            nls.add(linktype, m);
                            nls.remove(linktype, a);
                            nls.remove(linktype, b);
                            a[o].remove(linktype, n);
                            b[o].remove(linktype, n);
                        });
                    });
                };
                update(outInt, "incoming", "outgoing");
                update(inInt, "outgoing", "incoming");
                this.R -= inInt.count() + outInt.count();
                this.roots[k].remove(a);
                this.roots[k].remove(b);
                this.roots[k].add(m);
                return m;
            };
            Configuration.prototype.rootMerges = function (k) {
                if (k === void 0) { k = 0; }
                var rs = this.roots[k].modules();
                var n = rs.length;
                var merges = new Array(n * (n - 1));
                var ctr = 0;
                for (var i = 0, i_ = n - 1; i < i_; ++i) {
                    for (var j = i + 1; j < n; ++j) {
                        var a = rs[i], b = rs[j];
                        merges[ctr] = { id: ctr, nEdges: this.nEdges(a, b), a: a, b: b };
                        ctr++;
                    }
                }
                return merges;
            };
            Configuration.prototype.greedyMerge = function () {
                for (var i = 0; i < this.roots.length; ++i) {
                    // Handle single nested module case
                    if (this.roots[i].modules().length < 2)
                        continue;
                    // find the merge that allows for the most edges to be removed.  secondary ordering based on arbitrary id (for predictability)
                    var ms = this.rootMerges(i).sort(function (a, b) { return a.nEdges == b.nEdges ? a.id - b.id : a.nEdges - b.nEdges; });
                    var m = ms[0];
                    if (m.nEdges >= this.R)
                        continue;
                    this.merge(m.a, m.b, i);
                    return true;
                }
            };
            Configuration.prototype.nEdges = function (a, b) {
                var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
                return this.R - inInt.count() - outInt.count();
            };
            Configuration.prototype.getGroupHierarchy = function (retargetedEdges) {
                var _this = this;
                var groups = [];
                var root = {};
                toGroups(this.roots[0], root, groups);
                var es = this.allEdges();
                es.forEach(function (e) {
                    var a = _this.modules[e.source];
                    var b = _this.modules[e.target];
                    retargetedEdges.push(new PowerEdge(typeof a.gid === "undefined" ? e.source : groups[a.gid], typeof b.gid === "undefined" ? e.target : groups[b.gid], e.type));
                });
                return groups;
            };
            Configuration.prototype.allEdges = function () {
                var es = [];
                Configuration.getEdges(this.roots[0], es);
                return es;
            };
            Configuration.getEdges = function (modules, es) {
                modules.forAll(function (m) {
                    m.getEdges(es);
                    Configuration.getEdges(m.children, es);
                });
            };
            return Configuration;
        })();
        powergraph.Configuration = Configuration;
        function toGroups(modules, group, groups) {
            modules.forAll(function (m) {
                if (m.isLeaf()) {
                    if (!group.leaves)
                        group.leaves = [];
                    group.leaves.push(m.id);
                }
                else {
                    var g = group;
                    m.gid = groups.length;
                    if (!m.isIsland() || m.isPredefined()) {
                        g = { id: m.gid };
                        if (m.isPredefined())
                            // Apply original group properties
                            for (var prop in m.definition)
                                g[prop] = m.definition[prop];
                        if (!group.groups)
                            group.groups = [];
                        group.groups.push(m.gid);
                        groups.push(g);
                    }
                    toGroups(m.children, g, groups);
                }
            });
        }
        var Module = (function () {
            function Module(id, outgoing, incoming, children, definition) {
                if (outgoing === void 0) { outgoing = new LinkSets(); }
                if (incoming === void 0) { incoming = new LinkSets(); }
                if (children === void 0) { children = new ModuleSet(); }
                this.id = id;
                this.outgoing = outgoing;
                this.incoming = incoming;
                this.children = children;
                this.definition = definition;
            }
            Module.prototype.getEdges = function (es) {
                var _this = this;
                this.outgoing.forAll(function (ms, edgetype) {
                    ms.forAll(function (target) {
                        es.push(new PowerEdge(_this.id, target.id, edgetype));
                    });
                });
            };
            Module.prototype.isLeaf = function () {
                return this.children.count() === 0;
            };
            Module.prototype.isIsland = function () {
                return this.outgoing.count() === 0 && this.incoming.count() === 0;
            };
            Module.prototype.isPredefined = function () {
                return typeof this.definition !== "undefined";
            };
            return Module;
        })();
        powergraph.Module = Module;
        function intersection(m, n) {
            var i = {};
            for (var v in m)
                if (v in n)
                    i[v] = m[v];
            return i;
        }
        var ModuleSet = (function () {
            function ModuleSet() {
                this.table = {};
            }
            ModuleSet.prototype.count = function () {
                return Object.keys(this.table).length;
            };
            ModuleSet.prototype.intersection = function (other) {
                var result = new ModuleSet();
                result.table = intersection(this.table, other.table);
                return result;
            };
            ModuleSet.prototype.intersectionCount = function (other) {
                return this.intersection(other).count();
            };
            ModuleSet.prototype.contains = function (id) {
                return id in this.table;
            };
            ModuleSet.prototype.add = function (m) {
                this.table[m.id] = m;
            };
            ModuleSet.prototype.remove = function (m) {
                delete this.table[m.id];
            };
            ModuleSet.prototype.forAll = function (f) {
                for (var mid in this.table) {
                    f(this.table[mid]);
                }
            };
            ModuleSet.prototype.modules = function () {
                var vs = [];
                this.forAll(function (m) {
                    if (!m.isPredefined())
                        vs.push(m);
                });
                return vs;
            };
            return ModuleSet;
        })();
        powergraph.ModuleSet = ModuleSet;
        var LinkSets = (function () {
            function LinkSets() {
                this.sets = {};
                this.n = 0;
            }
            LinkSets.prototype.count = function () {
                return this.n;
            };
            LinkSets.prototype.contains = function (id) {
                var result = false;
                this.forAllModules(function (m) {
                    if (!result && m.id == id) {
                        result = true;
                    }
                });
                return result;
            };
            LinkSets.prototype.add = function (linktype, m) {
                var s = linktype in this.sets ? this.sets[linktype] : this.sets[linktype] = new ModuleSet();
                s.add(m);
                ++this.n;
            };
            LinkSets.prototype.remove = function (linktype, m) {
                var ms = this.sets[linktype];
                ms.remove(m);
                if (ms.count() === 0) {
                    delete this.sets[linktype];
                }
                --this.n;
            };
            LinkSets.prototype.forAll = function (f) {
                for (var linktype in this.sets) {
                    f(this.sets[linktype], linktype);
                }
            };
            LinkSets.prototype.forAllModules = function (f) {
                this.forAll(function (ms, lt) { return ms.forAll(f); });
            };
            LinkSets.prototype.intersection = function (other) {
                var result = new LinkSets();
                this.forAll(function (ms, lt) {
                    if (lt in other.sets) {
                        var i = ms.intersection(other.sets[lt]), n = i.count();
                        if (n > 0) {
                            result.sets[lt] = i;
                            result.n += n;
                        }
                    }
                });
                return result;
            };
            return LinkSets;
        })();
        powergraph.LinkSets = LinkSets;
        function intersectionCount(m, n) {
            return Object.keys(intersection(m, n)).length;
        }
        function getGroups(nodes, links, la, rootGroup) {
            var n = nodes.length, c = new powergraph.Configuration(n, links, la, rootGroup);
            while (c.greedyMerge())
                ;
            var powerEdges = [];
            var g = c.getGroupHierarchy(powerEdges);
            powerEdges.forEach(function (e) {
                var f = function (end) {
                    var g = e[end];
                    if (typeof g == "number")
                        e[end] = nodes[g];
                };
                f("source");
                f("target");
            });
            return { groups: g, powerEdges: powerEdges };
        }
        powergraph.getGroups = getGroups;
    })(powergraph = cola.powergraph || (cola.powergraph = {}));
})(cola || (cola = {}));
/**
 * @module cola
 */
var cola;
(function (cola) {
    // compute the size of the union of two sets a and b
    function unionCount(a, b) {
        var u = {};
        for (var i in a)
            u[i] = {};
        for (var i in b)
            u[i] = {};
        return Object.keys(u).length;
    }
    // compute the size of the intersection of two sets a and b
    function intersectionCount(a, b) {
        var n = 0;
        for (var i in a)
            if (typeof b[i] !== 'undefined')
                ++n;
        return n;
    }
    function getNeighbours(links, la) {
        var neighbours = {};
        var addNeighbours = function (u, v) {
            if (typeof neighbours[u] === 'undefined')
                neighbours[u] = {};
            neighbours[u][v] = {};
        };
        links.forEach(function (e) {
            var u = la.getSourceIndex(e), v = la.getTargetIndex(e);
            addNeighbours(u, v);
            addNeighbours(v, u);
        });
        return neighbours;
    }
    // modify the lengths of the specified links by the result of function f weighted by w
    function computeLinkLengths(links, w, f, la) {
        var neighbours = getNeighbours(links, la);
        links.forEach(function (l) {
            var a = neighbours[la.getSourceIndex(l)];
            var b = neighbours[la.getTargetIndex(l)];
            la.setLength(l, 1 + w * f(a, b));
        });
    }
    /** modify the specified link lengths based on the symmetric difference of their neighbours
     * @class symmetricDiffLinkLengths
     */
    function symmetricDiffLinkLengths(links, la, w) {
        if (w === void 0) { w = 1; }
        computeLinkLengths(links, w, function (a, b) { return Math.sqrt(unionCount(a, b) - intersectionCount(a, b)); }, la);
    }
    cola.symmetricDiffLinkLengths = symmetricDiffLinkLengths;
    /** modify the specified links lengths based on the jaccard difference between their neighbours
     * @class jaccardLinkLengths
     */
    function jaccardLinkLengths(links, la, w) {
        if (w === void 0) { w = 1; }
        computeLinkLengths(links, w, function (a, b) {
            return Math.min(Object.keys(a).length, Object.keys(b).length) < 1.1 ? 0 : intersectionCount(a, b) / unionCount(a, b);
        }, la);
    }
    cola.jaccardLinkLengths = jaccardLinkLengths;
    /** generate separation constraints for all edges unless both their source and sink are in the same strongly connected component
     * @class generateDirectedEdgeConstraints
     */
    function generateDirectedEdgeConstraints(n, links, axis, la) {
        var components = stronglyConnectedComponents(n, links, la);
        var nodes = {};
        components.forEach(function (c, i) {
            return c.forEach(function (v) { return nodes[v] = i; });
        });
        var constraints = [];
        links.forEach(function (l) {
            var ui = la.getSourceIndex(l), vi = la.getTargetIndex(l), u = nodes[ui], v = nodes[vi];
            if (u !== v) {
                constraints.push({
                    axis: axis,
                    left: ui,
                    right: vi,
                    gap: la.getMinSeparation(l)
                });
            }
        });
        return constraints;
    }
    cola.generateDirectedEdgeConstraints = generateDirectedEdgeConstraints;
    /**
     * Tarjan's strongly connected components algorithm for directed graphs
     * returns an array of arrays of node indicies in each of the strongly connected components.
     * a vertex not in a SCC of two or more nodes is it's own SCC.
     * adaptation of https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm
     */
    function stronglyConnectedComponents(numVertices, edges, la) {
        var nodes = [];
        var index = 0;
        var stack = [];
        var components = [];
        function strongConnect(v) {
            // Set the depth index for v to the smallest unused index
            v.index = v.lowlink = index++;
            stack.push(v);
            v.onStack = true;
            // Consider successors of v
            for (var _i = 0, _a = v.out; _i < _a.length; _i++) {
                var w = _a[_i];
                if (typeof w.index === 'undefined') {
                    // Successor w has not yet been visited; recurse on it
                    strongConnect(w);
                    v.lowlink = Math.min(v.lowlink, w.lowlink);
                }
                else if (w.onStack) {
                    // Successor w is in stack S and hence in the current SCC
                    v.lowlink = Math.min(v.lowlink, w.index);
                }
            }
            // If v is a root node, pop the stack and generate an SCC
            if (v.lowlink === v.index) {
                // start a new strongly connected component
                var component = [];
                while (stack.length) {
                    w = stack.pop();
                    w.onStack = false;
                    //add w to current strongly connected component
                    component.push(w);
                    if (w === v)
                        break;
                }
                // output the current strongly connected component
                components.push(component.map(function (v) { return v.id; }));
            }
        }
        for (var i = 0; i < numVertices; i++) {
            nodes.push({ id: i, out: [] });
        }
        for (var _i = 0; _i < edges.length; _i++) {
            var e = edges[_i];
            var v_1 = nodes[la.getSourceIndex(e)], w = nodes[la.getTargetIndex(e)];
            v_1.out.push(w);
        }
        for (var _a = 0; _a < nodes.length; _a++) {
            var v = nodes[_a];
            if (typeof v.index === 'undefined')
                strongConnect(v);
        }
        return components;
    }
    cola.stronglyConnectedComponents = stronglyConnectedComponents;
})(cola || (cola = {}));
var PairingHeap = (function () {
    // from: https://gist.github.com/nervoussystem
    //{elem:object, subheaps:[array of heaps]}
    function PairingHeap(elem) {
        this.elem = elem;
        this.subheaps = [];
    }
    PairingHeap.prototype.toString = function (selector) {
        var str = "", needComma = false;
        for (var i = 0; i < this.subheaps.length; ++i) {
            var subheap = this.subheaps[i];
            if (!subheap.elem) {
                needComma = false;
                continue;
            }
            if (needComma) {
                str = str + ",";
            }
            str = str + subheap.toString(selector);
            needComma = true;
        }
        if (str !== "") {
            str = "(" + str + ")";
        }
        return (this.elem ? selector(this.elem) : "") + str;
    };
    PairingHeap.prototype.forEach = function (f) {
        if (!this.empty()) {
            f(this.elem, this);
            this.subheaps.forEach(function (s) { return s.forEach(f); });
        }
    };
    PairingHeap.prototype.count = function () {
        return this.empty() ? 0 : 1 + this.subheaps.reduce(function (n, h) {
            return n + h.count();
        }, 0);
    };
    PairingHeap.prototype.min = function () {
        return this.elem;
    };
    PairingHeap.prototype.empty = function () {
        return this.elem == null;
    };
    PairingHeap.prototype.contains = function (h) {
        if (this === h)
            return true;
        for (var i = 0; i < this.subheaps.length; i++) {
            if (this.subheaps[i].contains(h))
                return true;
        }
        return false;
    };
    PairingHeap.prototype.isHeap = function (lessThan) {
        var _this = this;
        return this.subheaps.every(function (h) { return lessThan(_this.elem, h.elem) && h.isHeap(lessThan); });
    };
    PairingHeap.prototype.insert = function (obj, lessThan) {
        return this.merge(new PairingHeap(obj), lessThan);
    };
    PairingHeap.prototype.merge = function (heap2, lessThan) {
        if (this.empty())
            return heap2;
        else if (heap2.empty())
            return this;
        else if (lessThan(this.elem, heap2.elem)) {
            this.subheaps.push(heap2);
            return this;
        }
        else {
            heap2.subheaps.push(this);
            return heap2;
        }
    };
    PairingHeap.prototype.removeMin = function (lessThan) {
        if (this.empty())
            return null;
        else
            return this.mergePairs(lessThan);
    };
    PairingHeap.prototype.mergePairs = function (lessThan) {
        if (this.subheaps.length == 0)
            return new PairingHeap(null);
        else if (this.subheaps.length == 1) {
            return this.subheaps[0];
        }
        else {
            var firstPair = this.subheaps.pop().merge(this.subheaps.pop(), lessThan);
            var remaining = this.mergePairs(lessThan);
            return firstPair.merge(remaining, lessThan);
        }
    };
    PairingHeap.prototype.decreaseKey = function (subheap, newValue, setHeapNode, lessThan) {
        var newHeap = subheap.removeMin(lessThan);
        //reassign subheap values to preserve tree
        subheap.elem = newHeap.elem;
        subheap.subheaps = newHeap.subheaps;
        if (setHeapNode !== null && newHeap.elem !== null) {
            setHeapNode(subheap.elem, subheap);
        }
        var pairingNode = new PairingHeap(newValue);
        if (setHeapNode !== null) {
            setHeapNode(newValue, pairingNode);
        }
        return this.merge(pairingNode, lessThan);
    };
    return PairingHeap;
})();
/**
 * @class PriorityQueue a min priority queue backed by a pairing heap
 */
var PriorityQueue = (function () {
    function PriorityQueue(lessThan) {
        this.lessThan = lessThan;
    }
    /**
     * @method top
     * @return the top element (the min element as defined by lessThan)
     */
    PriorityQueue.prototype.top = function () {
        if (this.empty()) {
            return null;
        }
        return this.root.elem;
    };
    /**
     * @method push
     * put things on the heap
     */
    PriorityQueue.prototype.push = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var pairingNode;
        for (var i = 0, arg; arg = args[i]; ++i) {
            pairingNode = new PairingHeap(arg);
            this.root = this.empty() ?
                pairingNode : this.root.merge(pairingNode, this.lessThan);
        }
        return pairingNode;
    };
    /**
     * @method empty
     * @return true if no more elements in queue
     */
    PriorityQueue.prototype.empty = function () {
        return !this.root || !this.root.elem;
    };
    /**
     * @method isHeap check heap condition (for testing)
     * @return true if queue is in valid state
     */
    PriorityQueue.prototype.isHeap = function () {
        return this.root.isHeap(this.lessThan);
    };
    /**
     * @method forEach apply f to each element of the queue
     * @param f function to apply
     */
    PriorityQueue.prototype.forEach = function (f) {
        this.root.forEach(f);
    };
    /**
     * @method pop remove and return the min element from the queue
     */
    PriorityQueue.prototype.pop = function () {
        if (this.empty()) {
            return null;
        }
        var obj = this.root.min();
        this.root = this.root.removeMin(this.lessThan);
        return obj;
    };
    /**
     * @method reduceKey reduce the key value of the specified heap node
     */
    PriorityQueue.prototype.reduceKey = function (heapNode, newKey, setHeapNode) {
        if (setHeapNode === void 0) { setHeapNode = null; }
        this.root = this.root.decreaseKey(heapNode, newKey, setHeapNode, this.lessThan);
    };
    PriorityQueue.prototype.toString = function (selector) {
        return this.root.toString(selector);
    };
    /**
     * @method count
     * @return number of elements in queue
     */
    PriorityQueue.prototype.count = function () {
        return this.root.count();
    };
    return PriorityQueue;
})();
///<reference path="pqueue.ts"/>
/**
 * @module shortestpaths
 */
var cola;
(function (cola) {
    var shortestpaths;
    (function (shortestpaths) {
        var Neighbour = (function () {
            function Neighbour(id, distance) {
                this.id = id;
                this.distance = distance;
            }
            return Neighbour;
        })();
        var Node = (function () {
            function Node(id) {
                this.id = id;
                this.neighbours = [];
            }
            return Node;
        })();
        var QueueEntry = (function () {
            function QueueEntry(node, prev, d) {
                this.node = node;
                this.prev = prev;
                this.d = d;
            }
            return QueueEntry;
        })();
        /**
         * calculates all-pairs shortest paths or shortest paths from a single node
         * @class Calculator
         * @constructor
         * @param n {number} number of nodes
         * @param es {Edge[]} array of edges
         */
        var Calculator = (function () {
            function Calculator(n, es, getSourceIndex, getTargetIndex, getLength) {
                this.n = n;
                this.es = es;
                this.neighbours = new Array(this.n);
                var i = this.n;
                while (i--)
                    this.neighbours[i] = new Node(i);
                i = this.es.length;
                while (i--) {
                    var e = this.es[i];
                    var u = getSourceIndex(e), v = getTargetIndex(e);
                    var d = getLength(e);
                    this.neighbours[u].neighbours.push(new Neighbour(v, d));
                    this.neighbours[v].neighbours.push(new Neighbour(u, d));
                }
            }
            /**
             * compute shortest paths for graph over n nodes with edges an array of source/target pairs
             * edges may optionally have a length attribute.  1 is the default.
             * Uses Johnson's algorithm.
             *
             * @method DistanceMatrix
             * @return the distance matrix
             */
            Calculator.prototype.DistanceMatrix = function () {
                var D = new Array(this.n);
                for (var i = 0; i < this.n; ++i) {
                    D[i] = this.dijkstraNeighbours(i);
                }
                return D;
            };
            /**
             * get shortest paths from a specified start node
             * @method DistancesFromNode
             * @param start node index
             * @return array of path lengths
             */
            Calculator.prototype.DistancesFromNode = function (start) {
                return this.dijkstraNeighbours(start);
            };
            Calculator.prototype.PathFromNodeToNode = function (start, end) {
                return this.dijkstraNeighbours(start, end);
            };
            // find shortest path from start to end, with the opportunity at 
            // each edge traversal to compute a custom cost based on the 
            // previous edge.  For example, to penalise bends.
            Calculator.prototype.PathFromNodeToNodeWithPrevCost = function (start, end, prevCost) {
                var q = new PriorityQueue(function (a, b) { return a.d <= b.d; }), u = this.neighbours[start], qu = new QueueEntry(u, null, 0), visitedFrom = {};
                q.push(qu);
                while (!q.empty()) {
                    qu = q.pop();
                    u = qu.node;
                    if (u.id === end) {
                        break;
                    }
                    var i = u.neighbours.length;
                    while (i--) {
                        var neighbour = u.neighbours[i], v = this.neighbours[neighbour.id];
                        // don't double back
                        if (qu.prev && v.id === qu.prev.node.id)
                            continue;
                        // don't retraverse an edge if it has already been explored
                        // from a lower cost route
                        var viduid = v.id + ',' + u.id;
                        if (viduid in visitedFrom && visitedFrom[viduid] <= qu.d)
                            continue;
                        var cc = qu.prev ? prevCost(qu.prev.node.id, u.id, v.id) : 0, t = qu.d + neighbour.distance + cc;
                        // store cost of this traversal
                        visitedFrom[viduid] = t;
                        q.push(new QueueEntry(v, qu, t));
                    }
                }
                var path = [];
                while (qu.prev) {
                    qu = qu.prev;
                    path.push(qu.node.id);
                }
                return path;
            };
            Calculator.prototype.dijkstraNeighbours = function (start, dest) {
                if (dest === void 0) { dest = -1; }
                var q = new PriorityQueue(function (a, b) { return a.d <= b.d; }), i = this.neighbours.length, d = new Array(i);
                while (i--) {
                    var node = this.neighbours[i];
                    node.d = i === start ? 0 : Number.POSITIVE_INFINITY;
                    node.q = q.push(node);
                }
                while (!q.empty()) {
                    // console.log(q.toString(function (u) { return u.id + "=" + (u.d === Number.POSITIVE_INFINITY ? "\u221E" : u.d.toFixed(2) )}));
                    var u = q.pop();
                    d[u.id] = u.d;
                    if (u.id === dest) {
                        var path = [];
                        var v = u;
                        while (typeof v.prev !== 'undefined') {
                            path.push(v.prev.id);
                            v = v.prev;
                        }
                        return path;
                    }
                    i = u.neighbours.length;
                    while (i--) {
                        var neighbour = u.neighbours[i];
                        var v = this.neighbours[neighbour.id];
                        var t = u.d + neighbour.distance;
                        if (u.d !== Number.MAX_VALUE && v.d > t) {
                            v.d = t;
                            v.prev = u;
                            q.reduceKey(v.q, v, function (e, q) { return e.q = q; });
                        }
                    }
                }
                return d;
            };
            return Calculator;
        })();
        shortestpaths.Calculator = Calculator;
    })(shortestpaths = cola.shortestpaths || (cola.shortestpaths = {}));
})(cola || (cola = {}));
///<reference path="handledisconnected.ts"/>
///<reference path="geom.ts"/>
///<reference path="descent.ts"/>
///<reference path="powergraph.ts"/>
///<reference path="linklengths.ts"/>
///<reference path="shortestpaths.ts"/>
/**
 * @module cola
 */
var cola;
(function (cola) {
    /**
     * The layout process fires three events:
     *  - start: layout iterations started
     *  - tick: fired once per iteration, listen to this to animate
     *  - end: layout converged, you might like to zoom-to-fit or something at notification of this event
     */
    (function (EventType) {
        EventType[EventType["start"] = 0] = "start";
        EventType[EventType["tick"] = 1] = "tick";
        EventType[EventType["end"] = 2] = "end";
    })(cola.EventType || (cola.EventType = {}));
    var EventType = cola.EventType;
    ;
    /**
     * Main interface to cola layout.
     * @class Layout
     */
    var Layout = (function () {
        function Layout() {
            var _this = this;
            this._canvasSize = [1, 1];
            this._linkDistance = 20;
            this._defaultNodeSize = 10;
            this._linkLengthCalculator = null;
            this._linkType = null;
            this._avoidOverlaps = false;
            this._handleDisconnected = true;
            this._running = false;
            this._nodes = [];
            this._groups = [];
            this._rootGroup = null;
            this._links = [];
            this._constraints = [];
            this._distanceMatrix = null;
            this._descent = null;
            this._directedLinkConstraints = null;
            this._threshold = 0.01;
            this._visibilityGraph = null;
            this._groupCompactness = 1e-6;
            // sub-class and override this property to replace with a more sophisticated eventing mechanism
            this.event = null;
            this.linkAccessor = {
                getSourceIndex: Layout.getSourceIndex,
                getTargetIndex: Layout.getTargetIndex,
                setLength: Layout.setLinkLength,
                getType: function (l) { return typeof _this._linkType === "function" ? _this._linkType(l) : 0; }
            };
        }
        // subscribe a listener to an event
        // sub-class and override this method to replace with a more sophisticated eventing mechanism
        Layout.prototype.on = function (e, listener) {
            // override me!
            if (!this.event)
                this.event = {};
            if (typeof e === 'string') {
                this.event[EventType[e]] = listener;
            }
            else {
                this.event[e] = listener;
            }
            return this;
        };
        // a function that is notified of events like "tick"
        // sub-class and override this method to replace with a more sophisticated eventing mechanism
        Layout.prototype.trigger = function (e) {
            if (this.event && typeof this.event[e.type] !== 'undefined') {
                this.event[e.type](e);
            }
        };
        // a function that kicks off the iteration tick loop
        // it calls tick() repeatedly until tick returns true (is converged)
        // subclass and override it with something fancier (e.g. dispatch tick on a timer)
        Layout.prototype.kick = function () {
            while (!this.tick())
                ;
        };
        /**
         * iterate the layout.  Returns true when layout converged.
         */
        Layout.prototype.tick = function () {
            if (this._alpha < this._threshold) {
                this._running = false;
                this.trigger({ type: EventType.end, alpha: this._alpha = 0, stress: this._lastStress });
                return true;
            }
            var n = this._nodes.length, m = this._links.length;
            var o, i;
            this._descent.locks.clear();
            for (i = 0; i < n; ++i) {
                o = this._nodes[i];
                if (o.fixed) {
                    if (typeof o.px === 'undefined' || typeof o.py === 'undefined') {
                        o.px = o.x;
                        o.py = o.y;
                    }
                    var p = [o.px, o.py];
                    this._descent.locks.add(i, p);
                }
            }
            var s1 = this._descent.rungeKutta();
            //var s1 = descent.reduceStress();
            if (s1 === 0) {
                this._alpha = 0;
            }
            else if (typeof this._lastStress !== 'undefined') {
                this._alpha = s1; //Math.abs(Math.abs(this._lastStress / s1) - 1);
            }
            this._lastStress = s1;
            this.updateNodePositions();
            this.trigger({ type: EventType.tick, alpha: this._alpha, stress: this._lastStress });
            return false;
        };
        // copy positions out of descent instance into each of the nodes' center coords
        Layout.prototype.updateNodePositions = function () {
            var x = this._descent.x[0], y = this._descent.x[1];
            var o, i = this._nodes.length;
            while (i--) {
                o = this._nodes[i];
                o.x = x[i];
                o.y = y[i];
            }
        };
        Layout.prototype.nodes = function (v) {
            if (!v) {
                if (this._nodes.length === 0 && this._links.length > 0) {
                    // if we have links but no nodes, create the nodes array now with empty objects for the links to point at.
                    // in this case the links are expected to be numeric indices for nodes in the range 0..n-1 where n is the number of nodes
                    var n = 0;
                    this._links.forEach(function (l) {
                        n = Math.max(n, l.source, l.target);
                    });
                    this._nodes = new Array(++n);
                    for (var i = 0; i < n; ++i) {
                        this._nodes[i] = {};
                    }
                }
                return this._nodes;
            }
            this._nodes = v;
            return this;
        };
        Layout.prototype.groups = function (x) {
            var _this = this;
            if (!x)
                return this._groups;
            this._groups = x;
            this._rootGroup = {};
            this._groups.forEach(function (g) {
                if (typeof g.padding === "undefined")
                    g.padding = 1;
                if (typeof g.leaves !== "undefined")
                    g.leaves.forEach(function (v, i) { (g.leaves[i] = _this._nodes[v]).parent = g; });
                if (typeof g.groups !== "undefined")
                    g.groups.forEach(function (gi, i) { (g.groups[i] = _this._groups[gi]).parent = g; });
            });
            this._rootGroup.leaves = this._nodes.filter(function (v) { return typeof v.parent === 'undefined'; });
            this._rootGroup.groups = this._groups.filter(function (g) { return typeof g.parent === 'undefined'; });
            return this;
        };
        Layout.prototype.powerGraphGroups = function (f) {
            var g = cola.powergraph.getGroups(this._nodes, this._links, this.linkAccessor, this._rootGroup);
            this.groups(g.groups);
            f(g);
            return this;
        };
        Layout.prototype.avoidOverlaps = function (v) {
            if (!arguments.length)
                return this._avoidOverlaps;
            this._avoidOverlaps = v;
            return this;
        };
        Layout.prototype.handleDisconnected = function (v) {
            if (!arguments.length)
                return this._handleDisconnected;
            this._handleDisconnected = v;
            return this;
        };
        /**
         * causes constraints to be generated such that directed graphs are laid out either from left-to-right or top-to-bottom.
         * a separation constraint is generated in the selected axis for each edge that is not involved in a cycle (part of a strongly connected component)
         * @param axis {string} 'x' for left-to-right, 'y' for top-to-bottom
         * @param minSeparation {number|link=>number} either a number specifying a minimum spacing required across all links or a function to return the minimum spacing for each link
         */
        Layout.prototype.flowLayout = function (axis, minSeparation) {
            if (!arguments.length)
                axis = 'y';
            this._directedLinkConstraints = {
                axis: axis,
                getMinSeparation: typeof minSeparation === 'number' ? function () { return minSeparation; } : minSeparation
            };
            return this;
        };
        Layout.prototype.links = function (x) {
            if (!arguments.length)
                return this._links;
            this._links = x;
            return this;
        };
        Layout.prototype.constraints = function (c) {
            if (!arguments.length)
                return this._constraints;
            this._constraints = c;
            return this;
        };
        Layout.prototype.distanceMatrix = function (d) {
            if (!arguments.length)
                return this._distanceMatrix;
            this._distanceMatrix = d;
            return this;
        };
        Layout.prototype.size = function (x) {
            if (!x)
                return this._canvasSize;
            this._canvasSize = x;
            return this;
        };
        Layout.prototype.defaultNodeSize = function (x) {
            if (!x)
                return this._defaultNodeSize;
            this._defaultNodeSize = x;
            return this;
        };
        Layout.prototype.groupCompactness = function (x) {
            if (!x)
                return this._groupCompactness;
            this._groupCompactness = x;
            return this;
        };
        Layout.prototype.linkDistance = function (x) {
            if (!x) {
                return this._linkDistance;
            }
            this._linkDistance = typeof x === "function" ? x : +x;
            this._linkLengthCalculator = null;
            return this;
        };
        Layout.prototype.linkType = function (f) {
            this._linkType = f;
            return this;
        };
        Layout.prototype.convergenceThreshold = function (x) {
            if (!x)
                return this._threshold;
            this._threshold = typeof x === "function" ? x : +x;
            return this;
        };
        Layout.prototype.alpha = function (x) {
            if (!arguments.length)
                return this._alpha;
            else {
                x = +x;
                if (this._alpha) {
                    if (x > 0)
                        this._alpha = x; // we might keep it hot
                    else
                        this._alpha = 0; // or, next tick will dispatch "end"
                }
                else if (x > 0) {
                    if (!this._running) {
                        this._running = true;
                        this.trigger({ type: EventType.start, alpha: this._alpha = x });
                        this.kick();
                    }
                }
                return this;
            }
        };
        Layout.prototype.getLinkLength = function (link) {
            return typeof this._linkDistance === "function" ? +(this._linkDistance(link)) : this._linkDistance;
        };
        Layout.setLinkLength = function (link, length) {
            link.length = length;
        };
        Layout.prototype.getLinkType = function (link) {
            return typeof this._linkType === "function" ? this._linkType(link) : 0;
        };
        /**
         * compute an ideal length for each link based on the graph structure around that link.
         * you can use this (for example) to create extra space around hub-nodes in dense graphs.
         * In particular this calculation is based on the "symmetric difference" in the neighbour sets of the source and target:
         * i.e. if neighbours of source is a and neighbours of target are b then calculation is: sqrt(|a union b| - |a intersection b|)
         * Actual computation based on inspection of link structure occurs in start(), so links themselves
         * don't have to have been assigned before invoking this function.
         * @param {number} [idealLength] the base length for an edge when its source and start have no other common neighbours (e.g. 40)
         * @param {number} [w] a multiplier for the effect of the length adjustment (e.g. 0.7)
         */
        Layout.prototype.symmetricDiffLinkLengths = function (idealLength, w) {
            var _this = this;
            if (w === void 0) { w = 1; }
            this.linkDistance(function (l) { return idealLength * l.length; });
            this._linkLengthCalculator = function () { return cola.symmetricDiffLinkLengths(_this._links, _this.linkAccessor, w); };
            return this;
        };
        /**
         * compute an ideal length for each link based on the graph structure around that link.
         * you can use this (for example) to create extra space around hub-nodes in dense graphs.
         * In particular this calculation is based on the "symmetric difference" in the neighbour sets of the source and target:
         * i.e. if neighbours of source is a and neighbours of target are b then calculation is: |a intersection b|/|a union b|
         * Actual computation based on inspection of link structure occurs in start(), so links themselves
         * don't have to have been assigned before invoking this function.
         * @param {number} [idealLength] the base length for an edge when its source and start have no other common neighbours (e.g. 40)
         * @param {number} [w] a multiplier for the effect of the length adjustment (e.g. 0.7)
         */
        Layout.prototype.jaccardLinkLengths = function (idealLength, w) {
            var _this = this;
            if (w === void 0) { w = 1; }
            this.linkDistance(function (l) { return idealLength * l.length; });
            this._linkLengthCalculator = function () { return cola.jaccardLinkLengths(_this._links, _this.linkAccessor, w); };
            return this;
        };
        /**
         * start the layout process
         * @method start
         * @param {number} [initialUnconstrainedIterations=0] unconstrained initial layout iterations
         * @param {number} [initialUserConstraintIterations=0] initial layout iterations with user-specified constraints
         * @param {number} [initialAllConstraintsIterations=0] initial layout iterations with all constraints including non-overlap
         * @param {number} [gridSnapIterations=0] iterations of "grid snap", which pulls nodes towards grid cell centers - grid of size node[0].width - only really makes sense if all nodes have the same width and height
         * @param [keepRunning=true] keep iterating asynchronously via the tick method
         */
        Layout.prototype.start = function (initialUnconstrainedIterations, initialUserConstraintIterations, initialAllConstraintsIterations, gridSnapIterations, keepRunning) {
            var _this = this;
            if (initialUnconstrainedIterations === void 0) { initialUnconstrainedIterations = 0; }
            if (initialUserConstraintIterations === void 0) { initialUserConstraintIterations = 0; }
            if (initialAllConstraintsIterations === void 0) { initialAllConstraintsIterations = 0; }
            if (gridSnapIterations === void 0) { gridSnapIterations = 0; }
            if (keepRunning === void 0) { keepRunning = true; }
            var i, j, n = this.nodes().length, N = n + 2 * this._groups.length, m = this._links.length, w = this._canvasSize[0], h = this._canvasSize[1];
            if (this._linkLengthCalculator)
                this._linkLengthCalculator();
            var x = new Array(N), y = new Array(N);
            var G = null;
            var ao = this._avoidOverlaps;
            this._nodes.forEach(function (v, i) {
                v.index = i;
                if (typeof v.x === 'undefined') {
                    v.x = w / 2, v.y = h / 2;
                }
                x[i] = v.x, y[i] = v.y;
            });
            //should we do this to clearly label groups?
            //this._groups.forEach((g, i) => g.groupIndex = i);
            var distances;
            if (this._distanceMatrix) {
                // use the user specified distanceMatrix
                distances = this._distanceMatrix;
            }
            else {
                // construct an n X n distance matrix based on shortest paths through graph (with respect to edge.length).
                distances = (new cola.shortestpaths.Calculator(N, this._links, Layout.getSourceIndex, Layout.getTargetIndex, function (l) { return _this.getLinkLength(l); })).DistanceMatrix();
                // G is a square matrix with G[i][j] = 1 iff there exists an edge between node i and node j
                // otherwise 2. (
                G = cola.Descent.createSquareMatrix(N, function () { return 2; });
                this._links.forEach(function (l) {
                    if (typeof l.source == "number")
                        l.source = _this._nodes[l.source];
                    if (typeof l.target == "number")
                        l.target = _this._nodes[l.target];
                });
                this._links.forEach(function (e) {
                    var u = Layout.getSourceIndex(e), v = Layout.getTargetIndex(e);
                    G[u][v] = G[v][u] = e.weight || 1;
                });
            }
            var D = cola.Descent.createSquareMatrix(N, function (i, j) {
                return distances[i][j];
            });
            if (this._rootGroup && typeof this._rootGroup.groups !== 'undefined') {
                var i = n;
                var addAttraction = function (i, j, strength, idealDistance) {
                    G[i][j] = G[j][i] = strength;
                    D[i][j] = D[j][i] = idealDistance;
                };
                this._groups.forEach(function (g) {
                    addAttraction(i, i + 1, _this._groupCompactness, 0.1);
                    // todo: add terms here attracting children of the group to the group dummy nodes
                    //if (typeof g.leaves !== 'undefined')
                    //    g.leaves.forEach(l => {
                    //        addAttraction(l.index, i, 1e-4, 0.1);
                    //        addAttraction(l.index, i + 1, 1e-4, 0.1);
                    //    });
                    //if (typeof g.groups !== 'undefined')
                    //    g.groups.forEach(g => {
                    //        var gid = n + g.groupIndex * 2;
                    //        addAttraction(gid, i, 0.1, 0.1);
                    //        addAttraction(gid + 1, i, 0.1, 0.1);
                    //        addAttraction(gid, i + 1, 0.1, 0.1);
                    //        addAttraction(gid + 1, i + 1, 0.1, 0.1);
                    //    });
                    x[i] = 0, y[i++] = 0;
                    x[i] = 0, y[i++] = 0;
                });
            }
            else
                this._rootGroup = { leaves: this._nodes, groups: [] };
            var curConstraints = this._constraints || [];
            if (this._directedLinkConstraints) {
                this.linkAccessor.getMinSeparation = this._directedLinkConstraints.getMinSeparation;
                curConstraints = curConstraints.concat(cola.generateDirectedEdgeConstraints(n, this._links, this._directedLinkConstraints.axis, (this.linkAccessor)));
            }
            this.avoidOverlaps(false);
            this._descent = new cola.Descent([x, y], D);
            this._descent.locks.clear();
            for (var i = 0; i < n; ++i) {
                var o = this._nodes[i];
                if (o.fixed) {
                    o.px = o.x;
                    o.py = o.y;
                    var p = [o.x, o.y];
                    this._descent.locks.add(i, p);
                }
            }
            this._descent.threshold = this._threshold;
            // apply initialIterations without user constraints or nonoverlap constraints
            this._descent.run(initialUnconstrainedIterations);
            // apply initialIterations with user constraints but no nonoverlap constraints
            if (curConstraints.length > 0)
                this._descent.project = new cola.vpsc.Projection(this._nodes, this._groups, this._rootGroup, curConstraints).projectFunctions();
            this._descent.run(initialUserConstraintIterations);
            this.separateOverlappingComponents(w, h);
            // subsequent iterations will apply all constraints
            this.avoidOverlaps(ao);
            if (ao) {
                this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
                this._descent.project = new cola.vpsc.Projection(this._nodes, this._groups, this._rootGroup, curConstraints, true).projectFunctions();
                this._nodes.forEach(function (v, i) { x[i] = v.x, y[i] = v.y; });
            }
            // allow not immediately connected nodes to relax apart (p-stress)
            this._descent.G = G;
            this._descent.run(initialAllConstraintsIterations);
            if (gridSnapIterations) {
                this._descent.snapStrength = 1000;
                this._descent.snapGridSize = this._nodes[0].width;
                this._descent.numGridSnapNodes = n;
                this._descent.scaleSnapByMaxH = n != N; // if we have groups then need to scale hessian so grid forces still apply
                var G0 = cola.Descent.createSquareMatrix(N, function (i, j) {
                    if (i >= n || j >= n)
                        return G[i][j];
                    return 0;
                });
                this._descent.G = G0;
                this._descent.run(gridSnapIterations);
            }
            this.updateNodePositions();
            this.separateOverlappingComponents(w, h);
            return keepRunning ? this.resume() : this;
        };
        // recalculate nodes position for disconnected graphs
        Layout.prototype.separateOverlappingComponents = function (width, height) {
            var _this = this;
            // recalculate nodes position for disconnected graphs
            if (!this._distanceMatrix && this._handleDisconnected) {
                var x = this._descent.x[0], y = this._descent.x[1];
                this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
                var graphs = cola.separateGraphs(this._nodes, this._links);
                cola.applyPacking(graphs, width, height, this._defaultNodeSize);
                this._nodes.forEach(function (v, i) {
                    _this._descent.x[0][i] = v.x, _this._descent.x[1][i] = v.y;
                    if (v.bounds) {
                        v.bounds.setXCentre(v.x);
                        v.bounds.setYCentre(v.y);
                    }
                });
            }
        };
        Layout.prototype.resume = function () {
            return this.alpha(0.1);
        };
        Layout.prototype.stop = function () {
            return this.alpha(0);
        };
        /// find a visibility graph over the set of nodes.  assumes all nodes have a
        /// bounds property (a rectangle) and that no pair of bounds overlaps.
        Layout.prototype.prepareEdgeRouting = function (nodeMargin) {
            if (nodeMargin === void 0) { nodeMargin = 0; }
            this._visibilityGraph = new cola.geom.TangentVisibilityGraph(this._nodes.map(function (v) {
                return v.bounds.inflate(-nodeMargin).vertices();
            }));
        };
        /// find a route avoiding node bounds for the given edge.
        /// assumes the visibility graph has been created (by prepareEdgeRouting method)
        /// and also assumes that nodes have an index property giving their position in the
        /// node array.  This index property is created by the start() method.
        Layout.prototype.routeEdge = function (edge, draw) {
            var lineData = [];
            //if (d.source.id === 10 && d.target.id === 11) {
            //    debugger;
            //}
            var vg2 = new cola.geom.TangentVisibilityGraph(this._visibilityGraph.P, { V: this._visibilityGraph.V, E: this._visibilityGraph.E }), port1 = { x: edge.source.x, y: edge.source.y }, port2 = { x: edge.target.x, y: edge.target.y }, start = vg2.addPoint(port1, edge.source.index), end = vg2.addPoint(port2, edge.target.index);
            vg2.addEdgeIfVisible(port1, port2, edge.source.index, edge.target.index);
            if (typeof draw !== 'undefined') {
                draw(vg2);
            }
            var sourceInd = function (e) { return e.source.id; }, targetInd = function (e) { return e.target.id; }, length = function (e) { return e.length(); }, spCalc = new cola.shortestpaths.Calculator(vg2.V.length, vg2.E, sourceInd, targetInd, length), shortestPath = spCalc.PathFromNodeToNode(start.id, end.id);
            if (shortestPath.length === 1 || shortestPath.length === vg2.V.length) {
                var route = cola.vpsc.makeEdgeBetween(edge.source.innerBounds, edge.target.innerBounds, 5);
                lineData = [route.sourceIntersection, route.arrowStart];
            }
            else {
                var n = shortestPath.length - 2, p = vg2.V[shortestPath[n]].p, q = vg2.V[shortestPath[0]].p, lineData = [edge.source.innerBounds.rayIntersection(p.x, p.y)];
                for (var i = n; i >= 0; --i)
                    lineData.push(vg2.V[shortestPath[i]].p);
                lineData.push(cola.vpsc.makeEdgeTo(q, edge.target.innerBounds, 5));
            }
            //lineData.forEach((v, i) => {
            //    if (i > 0) {
            //        var u = lineData[i - 1];
            //        this._nodes.forEach(function (node) {
            //            if (node.id === getSourceIndex(d) || node.id === getTargetIndex(d)) return;
            //            var ints = node.innerBounds.lineIntersections(u.x, u.y, v.x, v.y);
            //            if (ints.length > 0) {
            //                debugger;
            //            }
            //        })
            //    }
            //})
            return lineData;
        };
        //The link source and target may be just a node index, or they may be references to nodes themselves.
        Layout.getSourceIndex = function (e) {
            return typeof e.source === 'number' ? e.source : e.source.index;
        };
        //The link source and target may be just a node index, or they may be references to nodes themselves.
        Layout.getTargetIndex = function (e) {
            return typeof e.target === 'number' ? e.target : e.target.index;
        };
        // Get a string ID for a given link.
        Layout.linkId = function (e) {
            return Layout.getSourceIndex(e) + "-" + Layout.getTargetIndex(e);
        };
        // The fixed property has three bits:
        // Bit 1 can be set externally (e.g., d.fixed = true) and show persist.
        // Bit 2 stores the dragging state, from mousedown to mouseup.
        // Bit 3 stores the hover state, from mouseover to mouseout.
        // Dragend is a special case: it also clears the hover state.
        Layout.dragStart = function (d) {
            d.fixed |= 2; // set bit 2
            d.px = d.x, d.py = d.y; // set velocity to zero
        };
        Layout.dragEnd = function (d) {
            d.fixed &= ~6; // unset bits 2 and 3
            //d.fixed = 0;
        };
        Layout.mouseOver = function (d) {
            d.fixed |= 4; // set bit 3
            d.px = d.x, d.py = d.y; // set velocity to zero
        };
        Layout.mouseOut = function (d) {
            d.fixed &= ~4; // unset bit 3
        };
        return Layout;
    })();
    cola.Layout = Layout;
})(cola || (cola = {}));
///<reference path="../extern/d3.d.ts"/>
///<reference path="layout.ts"/>
var cola;
(function (cola) {
    var D3StyleLayoutAdaptor = (function (_super) {
        __extends(D3StyleLayoutAdaptor, _super);
        function D3StyleLayoutAdaptor() {
            _super.call(this);
            this.event = d3.dispatch(cola.EventType[cola.EventType.start], cola.EventType[cola.EventType.tick], cola.EventType[cola.EventType.end]);
            // bit of trickyness remapping 'this' so we can reference it in the function body.
            var d3layout = this;
            var drag;
            this.drag = function () {
                if (!drag) {
                    var drag = d3.behavior.drag()
                        .origin(function (d) { return d; })
                        .on("dragstart.d3adaptor", cola.Layout.dragStart)
                        .on("drag.d3adaptor", function (d) {
                        d.px = d3.event.x, d.py = d3.event.y;
                        d3layout.resume(); // restart annealing
                    })
                        .on("dragend.d3adaptor", cola.Layout.dragEnd);
                }
                if (!arguments.length)
                    return drag;
                // this is the context of the function, i.e. the d3 selection
                this //.on("mouseover.adaptor", colaMouseover)
                    .call(drag);
            };
        }
        D3StyleLayoutAdaptor.prototype.trigger = function (e) {
            var d3event = { type: cola.EventType[e.type], alpha: e.alpha, stress: e.stress };
            this.event[d3event.type](d3event); // via d3 dispatcher, e.g. event.start(e);
        };
        // iterate layout using a d3.timer, which queues calls to tick repeatedly until tick returns true
        D3StyleLayoutAdaptor.prototype.kick = function () {
            var _this = this;
            d3.timer(function () { return _super.prototype.tick.call(_this); });
        };
        // a function for binding to events on the adapter
        D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
            if (typeof eventType === 'string') {
                this.event.on(eventType, listener);
            }
            else {
                this.event.on(cola.EventType[eventType], listener);
            }
            return this;
        };
        return D3StyleLayoutAdaptor;
    })(cola.Layout);
    cola.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;
    /**
     * provides an interface for use with d3:
     * - uses the d3 event system to dispatch layout events such as:
     *   o "start" (start layout process)
     *   o "tick" (after each layout iteration)
     *   o "end" (layout converged and complete).
     * - uses the d3 timer to queue layout iterations.
     * - sets up d3.behavior.drag to drag nodes
     *   o use `node.call(<the returned instance of Layout>.drag)` to make nodes draggable
     * returns an instance of the cola.Layout itself with which the user
     * can interact directly.
     */
    function d3adaptor() {
        return new D3StyleLayoutAdaptor();
    }
    cola.d3adaptor = d3adaptor;
})(cola || (cola = {}));
/// <reference path="rectangle.ts"/>
/// <reference path="shortestpaths.ts"/>
/// <reference path="geom.ts"/>
/// <reference path="vpsc.ts"/>
var cola;
(function (cola) {
    var NodeWrapper = (function () {
        function NodeWrapper(id, rect, children) {
            this.id = id;
            this.rect = rect;
            this.children = children;
            this.leaf = typeof children === 'undefined' || children.length === 0;
        }
        return NodeWrapper;
    })();
    cola.NodeWrapper = NodeWrapper;
    var Vert = (function () {
        function Vert(id, x, y, node, line) {
            if (node === void 0) { node = null; }
            if (line === void 0) { line = null; }
            this.id = id;
            this.x = x;
            this.y = y;
            this.node = node;
            this.line = line;
        }
        return Vert;
    })();
    cola.Vert = Vert;
    var LongestCommonSubsequence = (function () {
        function LongestCommonSubsequence(s, t) {
            this.s = s;
            this.t = t;
            var mf = LongestCommonSubsequence.findMatch(s, t);
            var tr = t.slice(0).reverse();
            var mr = LongestCommonSubsequence.findMatch(s, tr);
            if (mf.length >= mr.length) {
                this.length = mf.length;
                this.si = mf.si;
                this.ti = mf.ti;
                this.reversed = false;
            }
            else {
                this.length = mr.length;
                this.si = mr.si;
                this.ti = t.length - mr.ti - mr.length;
                this.reversed = true;
            }
        }
        LongestCommonSubsequence.findMatch = function (s, t) {
            var m = s.length;
            var n = t.length;
            var match = { length: 0, si: -1, ti: -1 };
            var l = new Array(m);
            for (var i = 0; i < m; i++) {
                l[i] = new Array(n);
                for (var j = 0; j < n; j++)
                    if (s[i] === t[j]) {
                        var v = l[i][j] = (i === 0 || j === 0) ? 1 : l[i - 1][j - 1] + 1;
                        if (v > match.length) {
                            match.length = v;
                            match.si = i - v + 1;
                            match.ti = j - v + 1;
                        }
                        ;
                    }
                    else
                        l[i][j] = 0;
            }
            return match;
        };
        LongestCommonSubsequence.prototype.getSequence = function () {
            return this.length >= 0 ? this.s.slice(this.si, this.si + this.length) : [];
        };
        return LongestCommonSubsequence;
    })();
    cola.LongestCommonSubsequence = LongestCommonSubsequence;
    var GridRouter = (function () {
        function GridRouter(originalnodes, accessor, groupPadding) {
            var _this = this;
            if (groupPadding === void 0) { groupPadding = 12; }
            this.originalnodes = originalnodes;
            this.groupPadding = groupPadding;
            this.leaves = null;
            this.nodes = originalnodes.map(function (v, i) { return new NodeWrapper(i, accessor.getBounds(v), accessor.getChildren(v)); });
            this.leaves = this.nodes.filter(function (v) { return v.leaf; });
            this.groups = this.nodes.filter(function (g) { return !g.leaf; });
            this.cols = this.getGridLines('x');
            this.rows = this.getGridLines('y');
            // create parents for each node or group that is a member of another's children 
            this.groups.forEach(function (v) {
                return v.children.forEach(function (c) { return _this.nodes[c].parent = v; });
            });
            // root claims the remaining orphans
            this.root = { children: [] };
            this.nodes.forEach(function (v) {
                if (typeof v.parent === 'undefined') {
                    v.parent = _this.root;
                    _this.root.children.push(v.id);
                }
                // each node will have grid vertices associated with it,
                // some inside the node and some on the boundary
                // leaf nodes will have exactly one internal node at the center
                // and four boundary nodes
                // groups will have potentially many of each
                v.ports = [];
            });
            // nodes ordered by their position in the group hierarchy
            this.backToFront = this.nodes.slice(0);
            this.backToFront.sort(function (x, y) { return _this.getDepth(x) - _this.getDepth(y); });
            // compute boundary rectangles for each group
            // has to be done from front to back, i.e. inside groups to outside groups
            // such that each can be made large enough to enclose its interior
            var frontToBackGroups = this.backToFront.slice(0).reverse().filter(function (g) { return !g.leaf; });
            frontToBackGroups.forEach(function (v) {
                var r = cola.vpsc.Rectangle.empty();
                v.children.forEach(function (c) { return r = r.union(_this.nodes[c].rect); });
                v.rect = r.inflate(_this.groupPadding);
            });
            var colMids = this.midPoints(this.cols.map(function (r) { return r.pos; }));
            var rowMids = this.midPoints(this.rows.map(function (r) { return r.pos; }));
            // setup extents of lines
            var rowx = colMids[0], rowX = colMids[colMids.length - 1];
            var coly = rowMids[0], colY = rowMids[rowMids.length - 1];
            // horizontal lines
            var hlines = this.rows.map(function (r) { return { x1: rowx, x2: rowX, y1: r.pos, y2: r.pos }; })
                .concat(rowMids.map(function (m) { return { x1: rowx, x2: rowX, y1: m, y2: m }; }));
            // vertical lines
            var vlines = this.cols.map(function (c) { return { x1: c.pos, x2: c.pos, y1: coly, y2: colY }; })
                .concat(colMids.map(function (m) { return { x1: m, x2: m, y1: coly, y2: colY }; }));
            // the full set of lines
            var lines = hlines.concat(vlines);
            // we record the vertices associated with each line
            lines.forEach(function (l) { return l.verts = []; });
            // the routing graph
            this.verts = [];
            this.edges = [];
            // create vertices at the crossings of horizontal and vertical grid-lines
            hlines.forEach(function (h) {
                return vlines.forEach(function (v) {
                    var p = new Vert(_this.verts.length, v.x1, h.y1);
                    h.verts.push(p);
                    v.verts.push(p);
                    _this.verts.push(p);
                    // assign vertices to the nodes immediately under them
                    var i = _this.backToFront.length;
                    while (i-- > 0) {
                        var node = _this.backToFront[i], r = node.rect;
                        var dx = Math.abs(p.x - r.cx()), dy = Math.abs(p.y - r.cy());
                        if (dx < r.width() / 2 && dy < r.height() / 2) {
                            p.node = node;
                            break;
                        }
                    }
                });
            });
            lines.forEach(function (l, li) {
                // create vertices at the intersections of nodes and lines
                _this.nodes.forEach(function (v, i) {
                    v.rect.lineIntersections(l.x1, l.y1, l.x2, l.y2).forEach(function (intersect, j) {
                        //console.log(li+','+i+','+j+':'+intersect.x + ',' + intersect.y);
                        var p = new Vert(_this.verts.length, intersect.x, intersect.y, v, l);
                        _this.verts.push(p);
                        l.verts.push(p);
                        v.ports.push(p);
                    });
                });
                // split lines into edges joining vertices
                var isHoriz = Math.abs(l.y1 - l.y2) < 0.1;
                var delta = function (a, b) { return isHoriz ? b.x - a.x : b.y - a.y; };
                l.verts.sort(delta);
                for (var i = 1; i < l.verts.length; i++) {
                    var u = l.verts[i - 1], v = l.verts[i];
                    if (u.node && u.node === v.node && u.node.leaf)
                        continue;
                    _this.edges.push({ source: u.id, target: v.id, length: Math.abs(delta(u, v)) });
                }
            });
        }
        GridRouter.prototype.avg = function (a) { return a.reduce(function (x, y) { return x + y; }) / a.length; };
        // in the given axis, find sets of leaves overlapping in that axis
        // center of each GridLine is average of all nodes in column
        GridRouter.prototype.getGridLines = function (axis) {
            var columns = [];
            var ls = this.leaves.slice(0, this.leaves.length);
            while (ls.length > 0) {
                // find a column of all leaves overlapping in axis with the first leaf
                var overlapping = ls.filter(function (v) { return v.rect['overlap' + axis.toUpperCase()](ls[0].rect); });
                var col = {
                    nodes: overlapping,
                    pos: this.avg(overlapping.map(function (v) { return v.rect['c' + axis](); }))
                };
                columns.push(col);
                col.nodes.forEach(function (v) { return ls.splice(ls.indexOf(v), 1); });
            }
            columns.sort(function (a, b) { return a.pos - b.pos; });
            return columns;
        };
        // get the depth of the given node in the group hierarchy
        GridRouter.prototype.getDepth = function (v) {
            var depth = 0;
            while (v.parent !== this.root) {
                depth++;
                v = v.parent;
            }
            return depth;
        };
        // medial axes between node centres and also boundary lines for the grid
        GridRouter.prototype.midPoints = function (a) {
            var gap = a[1] - a[0];
            var mids = [a[0] - gap / 2];
            for (var i = 1; i < a.length; i++) {
                mids.push((a[i] + a[i - 1]) / 2);
            }
            mids.push(a[a.length - 1] + gap / 2);
            return mids;
        };
        // find path from v to root including both v and root
        GridRouter.prototype.findLineage = function (v) {
            var lineage = [v];
            do {
                v = v.parent;
                lineage.push(v);
            } while (v !== this.root);
            return lineage.reverse();
        };
        // find path connecting a and b through their lowest common ancestor
        GridRouter.prototype.findAncestorPathBetween = function (a, b) {
            var aa = this.findLineage(a), ba = this.findLineage(b), i = 0;
            while (aa[i] === ba[i])
                i++;
            // i-1 to include common ancestor only once (as first element)
            return { commonAncestor: aa[i - 1], lineages: aa.slice(i).concat(ba.slice(i)) };
        };
        // when finding a path between two nodes a and b, siblings of a and b on the
        // paths from a and b to their least common ancestor are obstacles
        GridRouter.prototype.siblingObstacles = function (a, b) {
            var _this = this;
            var path = this.findAncestorPathBetween(a, b);
            var lineageLookup = {};
            path.lineages.forEach(function (v) { return lineageLookup[v.id] = {}; });
            var obstacles = path.commonAncestor.children.filter(function (v) { return !(v in lineageLookup); });
            path.lineages
                .filter(function (v) { return v.parent !== path.commonAncestor; })
                .forEach(function (v) { return obstacles = obstacles.concat(v.parent.children.filter(function (c) { return c !== v.id; })); });
            return obstacles.map(function (v) { return _this.nodes[v]; });
        };
        // for the given routes, extract all the segments orthogonal to the axis x
        // and return all them grouped by x position
        GridRouter.getSegmentSets = function (routes, x, y) {
            // vsegments is a list of vertical segments sorted by x position
            var vsegments = [];
            for (var ei = 0; ei < routes.length; ei++) {
                var route = routes[ei];
                for (var si = 0; si < route.length; si++) {
                    var s = route[si];
                    s.edgeid = ei;
                    s.i = si;
                    var sdx = s[1][x] - s[0][x];
                    if (Math.abs(sdx) < 0.1) {
                        vsegments.push(s);
                    }
                }
            }
            vsegments.sort(function (a, b) { return a[0][x] - b[0][x]; });
            // vsegmentsets is a set of sets of segments grouped by x position
            var vsegmentsets = [];
            var segmentset = null;
            for (var i = 0; i < vsegments.length; i++) {
                var s = vsegments[i];
                if (!segmentset || Math.abs(s[0][x] - segmentset.pos) > 0.1) {
                    segmentset = { pos: s[0][x], segments: [] };
                    vsegmentsets.push(segmentset);
                }
                segmentset.segments.push(s);
            }
            return vsegmentsets;
        };
        // for all segments in this bundle create a vpsc problem such that
        // each segment's x position is a variable and separation constraints 
        // are given by the partial order over the edges to which the segments belong
        // for each pair s1,s2 of segments in the open set:
        //   e1 = edge of s1, e2 = edge of s2
        //   if leftOf(e1,e2) create constraint s1.x + gap <= s2.x
        //   else if leftOf(e2,e1) create cons. s2.x + gap <= s1.x
        GridRouter.nudgeSegs = function (x, y, routes, segments, leftOf, gap) {
            var n = segments.length;
            if (n <= 1)
                return;
            var vs = segments.map(function (s) { return new cola.vpsc.Variable(s[0][x]); });
            var cs = [];
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                    if (i === j)
                        continue;
                    var s1 = segments[i], s2 = segments[j], e1 = s1.edgeid, e2 = s2.edgeid, lind = -1, rind = -1;
                    // in page coordinates (not cartesian) the notion of 'leftof' is flipped in the horizontal axis from the vertical axis
                    // that is, when nudging vertical segments, if they increase in the y(conj) direction the segment belonging to the
                    // 'left' edge actually needs to be nudged to the right
                    // when nudging horizontal segments, if the segments increase in the x direction
                    // then the 'left' segment needs to go higher, i.e. to have y pos less than that of the right
                    if (x == 'x') {
                        if (leftOf(e1, e2)) {
                            //console.log('s1: ' + s1[0][x] + ',' + s1[0][y] + '-' + s1[1][x] + ',' + s1[1][y]);
                            if (s1[0][y] < s1[1][y]) {
                                lind = j, rind = i;
                            }
                            else {
                                lind = i, rind = j;
                            }
                        }
                    }
                    else {
                        if (leftOf(e1, e2)) {
                            if (s1[0][y] < s1[1][y]) {
                                lind = i, rind = j;
                            }
                            else {
                                lind = j, rind = i;
                            }
                        }
                    }
                    if (lind >= 0) {
                        //console.log(x+' constraint: ' + lind + '<' + rind);
                        cs.push(new cola.vpsc.Constraint(vs[lind], vs[rind], gap));
                    }
                }
            }
            var solver = new cola.vpsc.Solver(vs, cs);
            solver.solve();
            vs.forEach(function (v, i) {
                var s = segments[i];
                var pos = v.position();
                s[0][x] = s[1][x] = pos;
                var route = routes[s.edgeid];
                if (s.i > 0)
                    route[s.i - 1][1][x] = pos;
                if (s.i < route.length - 1)
                    route[s.i + 1][0][x] = pos;
            });
        };
        GridRouter.nudgeSegments = function (routes, x, y, leftOf, gap) {
            var vsegmentsets = GridRouter.getSegmentSets(routes, x, y);
            // scan the grouped (by x) segment sets to find co-linear bundles
            for (var i = 0; i < vsegmentsets.length; i++) {
                var ss = vsegmentsets[i];
                var events = [];
                for (var j = 0; j < ss.segments.length; j++) {
                    var s = ss.segments[j];
                    events.push({ type: 0, s: s, pos: Math.min(s[0][y], s[1][y]) });
                    events.push({ type: 1, s: s, pos: Math.max(s[0][y], s[1][y]) });
                }
                events.sort(function (a, b) { return a.pos - b.pos + a.type - b.type; });
                var open = [];
                var openCount = 0;
                events.forEach(function (e) {
                    if (e.type === 0) {
                        open.push(e.s);
                        openCount++;
                    }
                    else {
                        openCount--;
                    }
                    if (openCount == 0) {
                        GridRouter.nudgeSegs(x, y, routes, open, leftOf, gap);
                        open = [];
                    }
                });
            }
        };
        // obtain routes for the specified edges, nicely nudged apart
        // warning: edge paths may be reversed such that common paths are ordered consistently within bundles!
        // @param edges list of edges
        // @param nudgeGap how much to space parallel edge segements
        // @param source function to retrieve the index of the source node for a given edge
        // @param target function to retrieve the index of the target node for a given edge
        // @returns an array giving, for each edge, an array of segments, each segment a pair of points in an array
        GridRouter.prototype.routeEdges = function (edges, nudgeGap, source, target) {
            var _this = this;
            var routePaths = edges.map(function (e) { return _this.route(source(e), target(e)); });
            var order = cola.GridRouter.orderEdges(routePaths);
            var routes = routePaths.map(function (e) { return cola.GridRouter.makeSegments(e); });
            cola.GridRouter.nudgeSegments(routes, 'x', 'y', order, nudgeGap);
            cola.GridRouter.nudgeSegments(routes, 'y', 'x', order, nudgeGap);
            cola.GridRouter.unreverseEdges(routes, routePaths);
            return routes;
        };
        // path may have been reversed by the subsequence processing in orderEdges
        // so now we need to restore the original order
        GridRouter.unreverseEdges = function (routes, routePaths) {
            routes.forEach(function (segments, i) {
                var path = routePaths[i];
                if (path.reversed) {
                    segments.reverse(); // reverse order of segments
                    segments.forEach(function (segment) {
                        segment.reverse(); // reverse each segment
                    });
                }
            });
        };
        GridRouter.angleBetween2Lines = function (line1, line2) {
            var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x);
            var angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x);
            var diff = angle1 - angle2;
            if (diff > Math.PI || diff < -Math.PI) {
                diff = angle2 - angle1;
            }
            return diff;
        };
        // does the path a-b-c describe a left turn?
        GridRouter.isLeft = function (a, b, c) {
            return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) <= 0;
        };
        // for the given list of ordered pairs, returns a function that (efficiently) looks-up a specific pair to
        // see if it exists in the list
        GridRouter.getOrder = function (pairs) {
            var outgoing = {};
            for (var i = 0; i < pairs.length; i++) {
                var p = pairs[i];
                if (typeof outgoing[p.l] === 'undefined')
                    outgoing[p.l] = {};
                outgoing[p.l][p.r] = true;
            }
            return function (l, r) { return typeof outgoing[l] !== 'undefined' && outgoing[l][r]; };
        };
        // returns an ordering (a lookup function) that determines the correct order to nudge the
        // edge paths apart to minimize crossings
        GridRouter.orderEdges = function (edges) {
            var edgeOrder = [];
            for (var i = 0; i < edges.length - 1; i++) {
                for (var j = i + 1; j < edges.length; j++) {
                    var e = edges[i], f = edges[j], lcs = new cola.LongestCommonSubsequence(e, f);
                    var u, vi, vj;
                    if (lcs.length === 0)
                        continue; // no common subpath
                    if (lcs.reversed) {
                        // if we found a common subpath but one of the edges runs the wrong way, 
                        // then reverse f.
                        f.reverse();
                        f.reversed = true;
                        lcs = new cola.LongestCommonSubsequence(e, f);
                    }
                    if ((lcs.si <= 0 || lcs.ti <= 0) &&
                        (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length)) {
                        // the paths do not diverge, so make an arbitrary ordering decision
                        edgeOrder.push({ l: i, r: j });
                        continue;
                    }
                    if (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length) {
                        // if the common subsequence of the
                        // two edges being considered goes all the way to the
                        // end of one (or both) of the lines then we have to 
                        // base our ordering decision on the other end of the
                        // common subsequence
                        u = e[lcs.si + 1];
                        vj = e[lcs.si - 1];
                        vi = f[lcs.ti - 1];
                    }
                    else {
                        u = e[lcs.si + lcs.length - 2];
                        vi = e[lcs.si + lcs.length];
                        vj = f[lcs.ti + lcs.length];
                    }
                    if (GridRouter.isLeft(u, vi, vj)) {
                        edgeOrder.push({ l: j, r: i });
                    }
                    else {
                        edgeOrder.push({ l: i, r: j });
                    }
                }
            }
            //edgeOrder.forEach(function (e) { console.log('l:' + e.l + ',r:' + e.r) });
            return cola.GridRouter.getOrder(edgeOrder);
        };
        // for an orthogonal path described by a sequence of points, create a list of segments
        // if consecutive segments would make a straight line they are merged into a single segment
        // segments are over cloned points, not the original vertices
        GridRouter.makeSegments = function (path) {
            function copyPoint(p) {
                return { x: p.x, y: p.y };
            }
            var isStraight = function (a, b, c) { return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0.001; };
            var segments = [];
            var a = copyPoint(path[0]);
            for (var i = 1; i < path.length; i++) {
                var b = copyPoint(path[i]), c = i < path.length - 1 ? path[i + 1] : null;
                if (!c || !isStraight(a, b, c)) {
                    segments.push([a, b]);
                    a = b;
                }
            }
            return segments;
        };
        // find a route between node s and node t
        // returns an array of indices to verts
        GridRouter.prototype.route = function (s, t) {
            var _this = this;
            var source = this.nodes[s], target = this.nodes[t];
            this.obstacles = this.siblingObstacles(source, target);
            var obstacleLookup = {};
            this.obstacles.forEach(function (o) { return obstacleLookup[o.id] = o; });
            this.passableEdges = this.edges.filter(function (e) {
                var u = _this.verts[e.source], v = _this.verts[e.target];
                return !(u.node && u.node.id in obstacleLookup
                    || v.node && v.node.id in obstacleLookup);
            });
            // add dummy segments linking ports inside source and target
            for (var i = 1; i < source.ports.length; i++) {
                var u = source.ports[0].id;
                var v = source.ports[i].id;
                this.passableEdges.push({
                    source: u,
                    target: v,
                    length: 0
                });
            }
            for (var i = 1; i < target.ports.length; i++) {
                var u = target.ports[0].id;
                var v = target.ports[i].id;
                this.passableEdges.push({
                    source: u,
                    target: v,
                    length: 0
                });
            }
            var getSource = function (e) { return e.source; }, getTarget = function (e) { return e.target; }, getLength = function (e) { return e.length; };
            var shortestPathCalculator = new cola.shortestpaths.Calculator(this.verts.length, this.passableEdges, getSource, getTarget, getLength);
            var bendPenalty = function (u, v, w) {
                var a = _this.verts[u], b = _this.verts[v], c = _this.verts[w];
                var dx = Math.abs(c.x - a.x), dy = Math.abs(c.y - a.y);
                // don't count bends from internal node edges
                if (a.node === source && a.node === b.node || b.node === target && b.node === c.node)
                    return 0;
                return dx > 1 && dy > 1 ? 1000 : 0;
            };
            // get shortest path
            var shortestPath = shortestPathCalculator.PathFromNodeToNodeWithPrevCost(source.ports[0].id, target.ports[0].id, bendPenalty);
            // shortest path is reversed and does not include the target port
            var pathPoints = shortestPath.reverse().map(function (vi) { return _this.verts[vi]; });
            pathPoints.push(this.nodes[target.id].ports[0]);
            // filter out any extra end points that are inside the source or target (i.e. the dummy segments above)
            return pathPoints.filter(function (v, i) {
                return !(i < pathPoints.length - 1 && pathPoints[i + 1].node === source && v.node === source
                    || i > 0 && v.node === target && pathPoints[i - 1].node === target);
            });
        };
        GridRouter.getRoutePath = function (route, cornerradius, arrowwidth, arrowheight) {
            var result = {
                routepath: 'M ' + route[0][0].x + ' ' + route[0][0].y + ' ',
                arrowpath: ''
            };
            if (route.length > 1) {
                for (var i = 0; i < route.length; i++) {
                    var li = route[i];
                    var x = li[1].x, y = li[1].y;
                    var dx = x - li[0].x;
                    var dy = y - li[0].y;
                    if (i < route.length - 1) {
                        if (Math.abs(dx) > 0) {
                            x -= dx / Math.abs(dx) * cornerradius;
                        }
                        else {
                            y -= dy / Math.abs(dy) * cornerradius;
                        }
                        result.routepath += 'L ' + x + ' ' + y + ' ';
                        var l = route[i + 1];
                        var x0 = l[0].x, y0 = l[0].y;
                        var x1 = l[1].x;
                        var y1 = l[1].y;
                        dx = x1 - x0;
                        dy = y1 - y0;
                        var angle = GridRouter.angleBetween2Lines(li, l) < 0 ? 1 : 0;
                        //console.log(cola.GridRouter.angleBetween2Lines(li, l))
                        var x2, y2;
                        if (Math.abs(dx) > 0) {
                            x2 = x0 + dx / Math.abs(dx) * cornerradius;
                            y2 = y0;
                        }
                        else {
                            x2 = x0;
                            y2 = y0 + dy / Math.abs(dy) * cornerradius;
                        }
                        var cx = Math.abs(x2 - x);
                        var cy = Math.abs(y2 - y);
                        result.routepath += 'A ' + cx + ' ' + cy + ' 0 0 ' + angle + ' ' + x2 + ' ' + y2 + ' ';
                    }
                    else {
                        var arrowtip = [x, y];
                        var arrowcorner1, arrowcorner2;
                        if (Math.abs(dx) > 0) {
                            x -= dx / Math.abs(dx) * arrowheight;
                            arrowcorner1 = [x, y + arrowwidth];
                            arrowcorner2 = [x, y - arrowwidth];
                        }
                        else {
                            y -= dy / Math.abs(dy) * arrowheight;
                            arrowcorner1 = [x + arrowwidth, y];
                            arrowcorner2 = [x - arrowwidth, y];
                        }
                        result.routepath += 'L ' + x + ' ' + y + ' ';
                        if (arrowheight > 0) {
                            result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                                + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
                        }
                    }
                }
            }
            else {
                var li = route[0];
                var x = li[1].x, y = li[1].y;
                var dx = x - li[0].x;
                var dy = y - li[0].y;
                var arrowtip = [x, y];
                var arrowcorner1, arrowcorner2;
                if (Math.abs(dx) > 0) {
                    x -= dx / Math.abs(dx) * arrowheight;
                    arrowcorner1 = [x, y + arrowwidth];
                    arrowcorner2 = [x, y - arrowwidth];
                }
                else {
                    y -= dy / Math.abs(dy) * arrowheight;
                    arrowcorner1 = [x + arrowwidth, y];
                    arrowcorner2 = [x - arrowwidth, y];
                }
                result.routepath += 'L ' + x + ' ' + y + ' ';
                if (arrowheight > 0) {
                    result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                        + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
                }
            }
            return result;
        };
        return GridRouter;
    })();
    cola.GridRouter = GridRouter;
})(cola || (cola = {}));
/**
 * Use cola to do a layout in 3D!! Yay.
 * Pretty simple for the moment.
 */
var cola;
(function (cola) {
    var Link3D = (function () {
        function Link3D(source, target) {
            this.source = source;
            this.target = target;
        }
        Link3D.prototype.actualLength = function (x) {
            var _this = this;
            return Math.sqrt(x.reduce(function (c, v) {
                var dx = v[_this.target] - v[_this.source];
                return c + dx * dx;
            }, 0));
        };
        return Link3D;
    })();
    cola.Link3D = Link3D;
    var Node3D = (function () {
        function Node3D(x, y, z) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            this.x = x;
            this.y = y;
            this.z = z;
        }
        return Node3D;
    })();
    cola.Node3D = Node3D;
    var Layout3D = (function () {
        function Layout3D(nodes, links, idealLinkLength) {
            var _this = this;
            if (idealLinkLength === void 0) { idealLinkLength = 1; }
            this.nodes = nodes;
            this.links = links;
            this.idealLinkLength = idealLinkLength;
            this.constraints = null;
            this.useJaccardLinkLengths = true;
            this.result = new Array(Layout3D.k);
            for (var i = 0; i < Layout3D.k; ++i) {
                this.result[i] = new Array(nodes.length);
            }
            nodes.forEach(function (v, i) {
                for (var _i = 0, _a = Layout3D.dims; _i < _a.length; _i++) {
                    var dim = _a[_i];
                    if (typeof v[dim] == 'undefined')
                        v[dim] = Math.random();
                }
                _this.result[0][i] = v.x;
                _this.result[1][i] = v.y;
                _this.result[2][i] = v.z;
            });
        }
        ;
        Layout3D.prototype.linkLength = function (l) {
            return l.actualLength(this.result);
        };
        Layout3D.prototype.start = function (iterations) {
            var _this = this;
            if (iterations === void 0) { iterations = 100; }
            var n = this.nodes.length;
            var linkAccessor = new LinkAccessor();
            if (this.useJaccardLinkLengths)
                cola.jaccardLinkLengths(this.links, linkAccessor, 1.5);
            this.links.forEach(function (e) { return e.length *= _this.idealLinkLength; });
            // Create the distance matrix that Cola needs
            var distanceMatrix = (new cola.shortestpaths.Calculator(n, this.links, function (e) { return e.source; }, function (e) { return e.target; }, function (e) { return e.length; })).DistanceMatrix();
            var D = cola.Descent.createSquareMatrix(n, function (i, j) { return distanceMatrix[i][j]; });
            // G is a square matrix with G[i][j] = 1 iff there exists an edge between node i and node j
            // otherwise 2.
            var G = cola.Descent.createSquareMatrix(n, function () { return 2; });
            this.links.forEach(function (_a) {
                var source = _a.source, target = _a.target;
                return G[source][target] = G[target][source] = 1;
            });
            this.descent = new cola.Descent(this.result, D);
            this.descent.threshold = 1e-3;
            this.descent.G = G;
            //let constraints = this.links.map(e=> <any>{
            //    axis: 'y', left: e.source, right: e.target, gap: e.length*1.5
            //});
            if (this.constraints)
                this.descent.project = new cola.vpsc.Projection(this.nodes, null, null, this.constraints).projectFunctions();
            for (var i = 0; i < this.nodes.length; i++) {
                var v = this.nodes[i];
                if (v.fixed) {
                    this.descent.locks.add(i, [v.x, v.y, v.z]);
                }
            }
            this.descent.run(iterations);
            return this;
        };
        Layout3D.prototype.tick = function () {
            this.descent.locks.clear();
            for (var i = 0; i < this.nodes.length; i++) {
                var v = this.nodes[i];
                if (v.fixed) {
                    this.descent.locks.add(i, [v.x, v.y, v.z]);
                }
            }
            return this.descent.rungeKutta();
        };
        Layout3D.dims = ['x', 'y', 'z'];
        Layout3D.k = Layout3D.dims.length;
        return Layout3D;
    })();
    cola.Layout3D = Layout3D;
    var LinkAccessor = (function () {
        function LinkAccessor() {
        }
        LinkAccessor.prototype.getSourceIndex = function (e) { return e.source; };
        LinkAccessor.prototype.getTargetIndex = function (e) { return e.target; };
        LinkAccessor.prototype.getLength = function (e) { return e.length; };
        LinkAccessor.prototype.setLength = function (e, l) { e.length = l; };
        return LinkAccessor;
    })();
})(cola || (cola = {}));
/**
 * When compiled, this file will build a CommonJS module for WebCola.
 *
 * Unfortunately, internal and external TypeScript modules do not get
 * along well. This method of converting internal modules to external
 * modules is a bit of a hack, but is minimally invasive (i.e., no modules
 * need to be rewritten as external modules and modules can still span
 * multiple files)
 *
 * When starting a new project from scratch where CommonJS compatibility
 * is desired, consider instead preferring external modules to internal
 * modules.
 */
///<reference path="./src/d3adaptor.ts"/>
///<reference path="./src/descent.ts"/>
///<reference path="./src/geom.ts"/>
///<reference path="./src/gridrouter.ts"/>
///<reference path="./src/handledisconnected.ts"/>
///<reference path="./src/layout.ts"/>
///<reference path="./src/layout3d.ts"/>
///<reference path="./src/linklengths.ts"/>
///<reference path="./src/powergraph.ts"/>
///<reference path="./src/pqueue.ts"/>
///<reference path="./src/rectangle.ts"/>
///<reference path="./src/shortestpaths.ts"/>
///<reference path="./src/vpsc.ts"/>
///<reference path="./src/rbtree.ts"/>
// Export cola as a CommonJS module. Note that we're bypassing TypeScript's external
// module system here. Because internal modules were written with the browser in mind,
// TypeScript's model is that the current context is the global context (i.e., window.cola
// === cola), so `export = cola` is transpiled as a no-op.
module.exports = cola;

},{}],6:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/**
 * Event center is designed to work as a central event router, useful when many objects need to listen for an event
 * but don't necessarily need access to the object emitting the event.
 *
 * @class EventCenter
 * @constructor
 */
function EventCenter() {
    /* member variables */
    this.mEventMap = {};
}

/**
 * Publishes an event and forwards the specified `var_args` to all the registered callbacks.
 *
 * @method publish
 * @param {string} event - The name of the event to emit.
 * @param {...*} var_args - Arguments to forward to the event listener callbacks.
 */
EventCenter.prototype.publish = function(event/* , varArgs*/) {
    var eventQueue = this.mEventMap[event];
    if (eventQueue) {
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0, n = eventQueue.length; i < n; ++i) {
            var eventInfo = eventQueue[i];
            if (eventInfo) {
                eventInfo.callback.apply(eventInfo.context, args);
            }
        }
    }
};

/**
 * Subscribes to an event so the specified callback is called when the event is fired.
 *
 * @method subscribe
 * @param {string} event - The name of the event to subscribe to.
 * @param {Function} callback - The callback to invoke when the event is triggered.
 * @param {Object=} context - If passed the callback will be invoked within this context.
 * @returns {Object} An object containing this event subscription info. Useful to remove this listener from the event center.
 */
EventCenter.prototype.subscribe = function(event, callback, context) {
    var eventQueue = this.mEventMap[event];
    if (!eventQueue) {
        eventQueue = [];
        this.mEventMap[event] = eventQueue;
    }

    for (var i = 0, n = eventQueue.length; i < n; ++i) {
        if (eventQueue[i] === null) {
            eventQueue[i] = this._createEventInfo(event, callback, context, i);
            return eventQueue[i];
        }
    }

    var eventInfo = this._createEventInfo(event, callback, context, eventQueue.length);
    eventQueue.push(eventInfo);
    return eventInfo;
};

/**
 * Removes the specified `eventInfo` from this event center.
 *
 * @method remove
 * @param {Object} eventInfo - The object that was returned from the `subscribe` function.
 * @param {boolean=} invalidateInfo - Should the eventInfo be invalidated.
 */
EventCenter.prototype.remove = function(eventInfo, invalidateInfo) {
    if (eventInfo.event && this.mEventMap[eventInfo.event] && !isNaN(eventInfo.id)) {
        var eventQueue = this.mEventMap[eventInfo.event];
        if (eventQueue.length > eventInfo.id && eventQueue[eventInfo.id] === eventInfo) {
            eventQueue[eventInfo.id] = null;
            if (invalidateInfo) {
                this._invalidateEventInfo(eventInfo);
            }
        }
    }
};

/**
 * Removes all events and callbacks from this event center.
 *
 * @method dispose
 */
EventCenter.prototype.dispose = function() {
    var eventMap = this.mEventMap;
    for (var event in eventMap) {
        if (eventMap.hasOwnProperty(event)) {
            /* to truly avoid memory leaks invalidate all eventInfo objects manually
             * just in case another object is holding on to one of them */
            var eventQueue = eventMap[event];
            for (var i = 0, n = eventQueue.length; i < n; ++i) {
                if (eventQueue[i]) {
                    this._invalidateEventInfo(eventQueue[i]);
                }
            }
            this.mEventMap[event].length = 0;
            delete this.mEventMap[event];
        }
    }
};


/**
 * Utility function to create event info objects.
 *
 * @method _createEventInfo
 * @param {string} event - Thename of the event
 * @param {Function} callback - The callback function registered for this event.
 * @param {Object} context - The context from which the function will be called.
 * @param {number} id - The unique id for this event info within the event queue.
 * @returns {{event: *, callback: *, context: (*|null), id: *}}
 * @private
 */
EventCenter.prototype._createEventInfo = function(event, callback, context, id) {
    return {
        event: event,
        callback: callback,
        context: context || null,
        id: id,
    };
};

/**
 * Utility function to invalidate an event info object.
 *
 * @method _invalidateEventInfo
 * @param {Object} eventInfo - The event info object to invalidate.
 * @private
 */
EventCenter.prototype._invalidateEventInfo = function(eventInfo) {
    if (eventInfo.hasOwnProperty('event')) {
        delete eventInfo.event;
    }

    if (eventInfo.hasOwnProperty('callback')) {
        delete eventInfo.callback;
    }

    if (eventInfo.hasOwnProperty('context')) {
        delete eventInfo.context;
    }

    if (eventInfo.hasOwnProperty('id')) {
        delete eventInfo.id;
    }
};

/**
 * @export
 * @type {EventTracker}
 */
module.exports = EventCenter;

},{}],7:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/**
 * Utility class to easily keep track, register and unregister events.
 * NOTE: Only one event can be registered per channel.
 *
 * @class EventTracker
 * @param {EventCenter} eventCenter - The event center to use in this event tracker.
 * @constructor
 */
function EventTracker(eventCenter) {
    /* member variables */
    this.mEventCenter = eventCenter;
    this.mRegisteredEvents = {};
}

/**
 * Returns the internal container with all registered events.
 *
 * @property registeredEvents
 * @type {Object}
 * @readonly
 */
Object.defineProperty(EventTracker.prototype, 'registeredEvents', {
    get: function() {
        return this.mRegisteredEvents;
    },
});

/**
 * Registers and tracks an event at the specified channel.
 *
 * @method registerEvent
 * @param {String} channel - The channel to listen to.
 * @param {Function} callback - The function to be called when the event is triggered.
 */
EventTracker.prototype.registerEvent = function (channel, callback) {
    if (this.mRegisteredEvents[channel]) {
        this.unregisterEvent(channel);
    }
    this.mRegisteredEvents[channel] = this.mEventCenter.subscribe(channel, callback);
};

/**
 * Unregisters an event listener for the specified channel.
 *
 * @method unregisteredEvent
 * @param {String} channel - The channel in which the event was registered.
 */
EventTracker.prototype.unregisterEvent = function (channel) {
    if (this.mRegisteredEvents.hasOwnProperty(channel) && this.mRegisteredEvents[channel]) {
        var eventDescriptor = this.mRegisteredEvents[channel];
        this.mEventCenter.remove(eventDescriptor);
        this.mRegisteredEvents[channel] = null;
    }
};

/**
 * Unregisters all the events being tracked by this instance.
 *
 * @method unregisterAllEvents
 */
EventTracker.prototype.unregisterAllEvents = function () {
    for (var channel in this.mRegisteredEvents) {
        if (this.mRegisteredEvents.hasOwnProperty(channel)) {
            this.unregisterEvent(channel);
        }
    }
};

/**
 * @export
 * @type {EventTracker}
 */
module.exports = EventTracker;

},{}],8:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Snap = require('snapsvg');
var Point2D = require('./personas.core.point2d');
var Observable = require('./personas.core.observable.js');

/* get the Snap private primitives */
var __snapPrimitives = {};
Snap.plugin(function (SnapLib, Element, Paper, global, Fragment) {
    __snapPrimitives.snap = SnapLib;
    __snapPrimitives.element = Element;
    __snapPrimitives.paper = Paper;
    __snapPrimitives.global = global;
    __snapPrimitives.Fragment = Fragment;
});


/**
 * Base class for all persona and SVG elements.
 *
 * @class Node
 * @param {String} [type='g'] - The type of element to be created, defaults to `g` (group).
 * @param {Object=} attr - Attributes to be added when creating the object.
 * @constructor
 */
function Node(type, attr) {
    /* inheritance */
    var t = type || 'g';
    var element = __snapPrimitives.snap._.$(t, attr);
    __snapPrimitives.element.call(this, element);

    /* member variables */
    this.mPosition = new Point2D();
    this.mScale = 1.0;
    this.mClickHandlers = [];
    this.mDragHandlers = [];
    this.mPinchHandlers = [];
    this.mClickTouchHandlers = null;
    this.mDragTouchHandlers = null;
    this.mPinchTouchHandlers = null;
    this.__mPaper = new Observable(null);

    /* initialize */
    this.mPosition.changedCallback = this._setPosition.bind(this);

    /* setup the `onEnter` call */
    var observerId = this.__mPaper.observe(function(sender, value) {
        if (value) {
            this.onEnter(value);
            /* unregister this observer as it's not needed anymore */
            this.__mPaper.unobserve(observerId);
            observerId = -1;
        }
    }.bind(this));
}

/* inheritance */
Node.prototype = Object.create(__snapPrimitives.element.prototype);
Node.prototype.constructor = Node;

/**
 * Returns the position of this object, encapsulated in a Point2D.
 *
 * @property position
 * @type {Point2D}
 * @readonly
 */
Object.defineProperty(Node.prototype, 'position', {
    get: function () {
        return this.mPosition;
    },
});

/**
 * The current scale of this object.
 *
 * @property scale
 * @type {Number}
 */
Object.defineProperty(Node.prototype, 'scale', {
    get: function() {
        return this.mScale;
    },

    set: function (val) {
        this._setScale(val);
    },
});

/**
 * The original implementation does not account for objects being created without being added immediately to the document,
 * this results in the `paper` property of such objects never being set and tracked properly. This solves the issue by
 * keeping track of it internally.
 *
 * @property paper
 * @type {Snap.paper|Observable}
 */
Object.defineProperty(Node.prototype, 'paper', {
    get: function () {
        return this.__mPaper.getValue();
    },

    set: function (val) {
        this.__mPaper.setValue(val);
    },
});

/**
 * Appends the given element to current one
 *
 * @method append
 * @param {Node|Element} el - Element to append
 * @return {Node}
 */
Node.prototype.append = function (el) {
    /* perform the append operation */
    if (el instanceof Node) {
        el.__mPaper.ignoreChanges(1);
        __snapPrimitives.element.prototype.append.call(this, el);
        el.paper = this.__mPaper;
    } else {
        __snapPrimitives.element.prototype.append.call(this, el);
    }
    return this;
};

/**
 * Removes element from the DOM
 *
 * @method remove
 * @returns {Node}
 */
Node.prototype.remove = function () {
    __snapPrimitives.element.prototype.remove.call(this);
    this.__mPaper.reset(false);
    return this;
};


/**
 * Adds tap (touch) functionality to the default `click` method in Snap.svg
 * NOTE: Maybe the following should be implemented to define thresholds for touches in mm instead of pixels.
 *
 * <div id="my_mm" style="height:1mm;display:none"></div>
 * var pxTomm = function(px){
 *  return Math.floor(px/$('#my_mm').height()); //JQuery returns sizes in PX
 * };
 *
 * @method click
 * @param {Function} handler - The callback function to be called when a click (or tap) is detected.
 */
Node.prototype.click = function (handler) {
    __snapPrimitives.element.prototype.click.call(this, handler);

    var clickHandlers = this.mClickHandlers;
    clickHandlers.push(handler);

    if (!this.mClickTouchHandlers) {
        var initialPosition = null;
        var touchId = null;

        var touchStart = function(event) {
            if (event.touches.length > 1 && touchId !== null) {
                touchId = null;
            } else if (event.touches.length === 1 && touchId === null) {
                var touch = event.changedTouches[0];
                touchId = touch.identifier;
                initialPosition = {
                    x: touch.pageX,
                    y: touch.pageY,
                };
            }
        };

        var touchEnd = function(event) {
            if (touchId !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId) {
                        touchId = null;
                        var distance = Math.sqrt(Math.pow(initialPosition.x - touch.pageX, 2) + Math.pow(initialPosition.y - touch.pageY, 2));
                        if (!touch._personasTouchConsumed && distance < 19) {
                            touch._personasTouchConsumed = true;
                            for (var ii = 0, nn = clickHandlers.length; ii < nn; ++ii) {
                                clickHandlers[ii](null, touch.pageX, touch.pageY);
                            }
                        }
                        break;
                    }
                }
            }
        };

        var touchCancel = function(event) {
            if (touchId !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId) {
                        touchId = null;
                        break;
                    }
                }
            }
        };

        this.touchstart(touchStart);
        this.touchend(touchEnd);
        this.touchcancel(touchCancel);

        this.mClickTouchHandlers = [touchStart, touchEnd, touchCancel];
    }
};

/**
 * Removes a click/tap handler from this element.
 *
 * @method unclick
 * @param {Function=} handler - The handler to remove, if not handler is passed all handlers are removed.
 */
Node.prototype.unclick = function (handler) {
    __snapPrimitives.element.prototype.unclick.call(this, handler);

    if (this.mClickTouchHandlers) {
        if (!handler) {
            this.mClickHandlers.length = 0;
        } else {
            var handlerIndex = this.mClickHandlers.indexOf(handler);
            if (handlerIndex > -1) {
                this.mClickHandlers.splice(handlerIndex, 1);
            }
        }

        if (!this.mClickHandlers.length) {
            this.untouchstart(this.mClickTouchHandlers[0]);
            this.untouchend(this.mClickTouchHandlers[1]);
            this.untouchcancel(this.mClickTouchHandlers[2]);
            this.mClickTouchHandlers = null;
        }
    }
};

/**
 * Adds touch functionality to snap.svg's default drag function.
 * The difference between this drag function and the default drag function is that it automatically cancels when two or
 * more touches are detected.
 *
 * @method drag
 * @param {Function} onmove - handler for moving
 * @param {Function} onstart - handler for drag start
 * @param {function} onend - handler for drag end
 * @param {Object=} moveScope - context for moving handler
 * @param {Object=} startScope - context for drag start handler
 * @param {Object=} endScope - context for drag end handler
 */
Node.prototype.drag = function(onmove, onstart, onend, moveScope, startScope, endScope) {
    __snapPrimitives.element.prototype.drag.call(this, onmove, onstart, onend, moveScope, startScope, endScope);

    if (!this.mDragTouchHandlers) {
        var dragHandlers = this.mDragHandlers;
        dragHandlers.push({
            onmove: onmove,
            onstart: onstart,
            onend: onend,
        });

        var dragging = false;
        var lastPosition = null;
        var touchId = null;

        var touchStart = function(event) {
            if (event.touches.length > 1 && touchId !== null) {
                touchId = null;
                if (dragging) {
                    dragging = false;
                    for (var ii = 0, nn = dragHandlers.length; ii < nn; ++ii) {
                        if (dragHandlers[ii].onend) {
                            dragHandlers[ii].onend(null);
                        }
                    }
                }
            } else if (event.touches.length === 1 && touchId === null) {
                var touch = event.changedTouches[0];
                touchId = touch.identifier;
                lastPosition = {
                    x: touch.pageX,
                    y: touch.pageY,
                };
            }
        };

        var touchMove = function(event) {
            if (touchId !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId) {
                        var ii;
                        var nn;
                        if (dragging) {
                            for (ii = 0, nn = dragHandlers.length; ii < nn; ++ii) {
                                if (dragHandlers[ii].onmove) {
                                    dragHandlers[ii].onmove(touch.pageX - lastPosition.x, touch.pageY - lastPosition.y, touch.pageX, touch.pageY, null);
                                }
                            }
                            lastPosition.x = touch.pageX;
                            lastPosition.y = touch.pageY;
                        } else {
                            var distance = Math.sqrt(Math.pow(lastPosition.x - touch.pageX, 2) + Math.pow(lastPosition.y - touch.pageY, 2));
                            if (distance > 19) {
                                dragging = true;
                                for (ii = 0, nn = dragHandlers.length; ii < nn; ++ii) {
                                    if (dragHandlers[ii].onstart) {
                                        dragHandlers[ii].onstart(lastPosition.x, lastPosition.y, null);
                                    }
                                }
                                touchMove(event);
                            }
                        }
                        break;
                    }
                }
            }
        };

        var touchEnd = function(event) {
            if (touchId !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId) {
                        touchId = null;
                        dragging = false;
                        for (var ii = 0, nn = dragHandlers.length; ii < nn; ++ii) {
                            if (dragHandlers[ii].onend) {
                                dragHandlers[ii].onend(null);
                            }
                        }
                        break;
                    }
                }
            }
        };

        this.touchstart(touchStart);
        this.touchmove(touchMove);
        this.touchend(touchEnd);
        this.touchcancel(touchEnd);

        this.mDragTouchHandlers = [touchStart, touchMove, touchEnd];
    }
};

/**
 * Removes all drag handlers from this object.
 *
 * @method undrag
 */
Node.prototype.undrag = function() {
    __snapPrimitives.element.prototype.undrag.call(this);

    if (this.mDragTouchHandlers) {
        this.mDragHandlers.length = 0;
        this.untouchstart(this.mDragTouchHandlers[0]);
        this.untouchmove(this.mDragTouchHandlers[1]);
        this.untouchend(this.mDragTouchHandlers[2]);
        this.untouchcancel(this.mDragTouchHandlers[2]);
        this.mDragTouchHandlers = null;
    }
};

/**
 * Method to recognize and react to pinch gestures on the object.
 *
 * @method pinch
 * @param {Function} handler - The callback function to be called when a pinch gesture is updated.
 */
Node.prototype.pinch = function (handler) {
    var pinchHandlers = this.mPinchHandlers;
    pinchHandlers.push(handler);

    if (!this.mPinchTouchHandlers) {
        var lastDistance = 0;
        var center = null;
        var touchId01 = null;
        var touchId02 = null;

        var touchStart = function(event) {
            if (event.touches.length > 1 && touchId01 === null && touchId02 === null) {
                var touch01 = event.touches[0];
                touchId01 = event.touches[0].identifier;

                var touch02 = event.touches[1];
                touchId02 = event.touches[1].identifier;

                lastDistance = Math.sqrt(Math.pow(touch01.pageX - touch02.pageX, 2) + Math.pow(touch01.pageY - touch02.pageY, 2));
                center = {
                    x: (touch01.pageX + touch02.pageX) * 0.5,
                    y: (touch01.pageY + touch02.pageY) * 0.5,
                };
            }
        };

        var touchMove = function(event) {
            if (touchId01 !== null && touchId02 !== null) {
                var touches = event.touches;
                var touch01 = null;
                var touch02 = null;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId01) {
                        touch01 = touch;
                    } else if (touch.identifier === touchId02) {
                        touch02 = touch;
                    }
                }

                if (touch01 && touch02) {
                    var distance = Math.sqrt(Math.pow(touch01.pageX - touch02.pageX, 2) + Math.pow(touch01.pageY - touch02.pageY, 2));
                    var currentCenterOffsetX = ((touch01.pageX + touch02.pageX) * 0.5) - center.x;
                    var currentCenterOffsetY = ((touch01.pageY + touch02.pageY) * 0.5) - center.y;

                    var currentCenter = {
                        x: center.x - currentCenterOffsetX,
                        y: center.y - currentCenterOffsetY,
                    };

                    for (var ii = 0, nn = pinchHandlers.length; ii < nn; ++ii) {
                        if (pinchHandlers[ii]) {
                            pinchHandlers[ii](currentCenter, distance - lastDistance);
                        }
                    }
                    lastDistance = distance;
                }
            }
        };

        var touchEnd = function(event) {
            if (touchId01 !== null && touchId02 !== null) {
                var touches = event.changedTouches;
                for (var i = 0, n = touches.length; i < n; ++i) {
                    var touch = touches[i];
                    if (touch.identifier === touchId01 || touch.identifier === touchId02) {
                        touchId01 = null;
                        touchId02 = null;
                        break;
                    }
                }
            }
        };

        this.touchstart(touchStart);
        this.touchmove(touchMove);
        this.touchend(touchEnd);
        this.touchcancel(touchEnd);

        this.mClickTouchHandlers = [touchStart, touchMove, touchEnd];
    }
};

/**
 * Removes a pinch handler from this element.
 *
 * @method unpinch
 * @param {Function=} handler - The handler to remove, if not handler is passed all handlers are removed.
 */
Node.prototype.unpinch = function (handler) {
    if (this.mPinchTouchHandlers) {
        if (!handler) {
            this.mPinchHandlers.length = 0;
        } else {
            var handlerIndex = this.mPinchHandlers.indexOf(handler);
            if (handlerIndex > -1) {
                this.mPinchHandlers.splice(handlerIndex, 1);
            }
        }

        if (!this.mPinchHandlers.length) {
            this.untouchstart(this.mPinchTouchHandlers[0]);
            this.untouchmove(this.mPinchTouchHandlers[1]);
            this.untouchend(this.mPinchTouchHandlers[2]);
            this.untouchcancel(this.mPinchTouchHandlers[2]);
            this.mPinchTouchHandlers = null;
        }
    }
};

/**
 * Utility function to set the X and Y coordinates of this node.
 *
 * @method _setPosition
 * @param {Number} x - The new X coordinate for this node.
 * @param {Number} y - The new Y coordinate for this node.
 * @private
 */
Node.prototype._setPosition = function (x, y) {
    this.mPosition.mX = x;
    this.mPosition.mY = y;
    var matrix = this.transform().localMatrix;
    matrix.e = x;
    matrix.f = y;
    this.transform(matrix);
};

/**
 * Utility function to set the scale of the node.
 *
 * @method _setScale
 * @param {Number} scale - The new scale of the node.
 * @private
 */
Node.prototype._setScale = function (scale) {
    if (scale !== this.mScale) {
        this.mScale = scale;
        var matrix = new Snap.Matrix();
        matrix.e = this.mPosition.x;
        matrix.f = this.mPosition.y;
        matrix.scale(scale);
        this.transform(matrix);
    }
};

/**
 * This function is called the first time the node is added to a paper. Override it with your own implementation.
 *
 * @method onEnter
 * @param {Snap.paper} paper - The paper this node was added to.
 */
/* eslint-disable */
Node.prototype.onEnter = function(paper) {

};
/* eslint-enable */

/**
 * Mixes in the touch functionality of this class into the specified element.
 *
 * @method mixinTouch
 * @param {*} element - The element to which the touch functionality will be added.
 * @returns {*}
 * @static
 */
Node.mixinTouch = function (element) {
    element.mClickHandlers = [];
    element.mDragHandlers = [];
    element.mPinchHandlers = [];
    element.mClickTouchHandlers = null;
    element.mDragTouchHandlers = null;
    element.mPinchTouchHandlers = null;

    element.click = Node.prototype.click;
    element.unclick = Node.prototype.unclick;
    element.drag = Node.prototype.drag;
    element.undrag = Node.prototype.undrag;
    element.pinch = Node.prototype.pinch;
    element.unpinch = Node.prototype.unpinch;

    return element;
};

/**
 * @export
 * @type {Node}
 */
module.exports = Node;

},{"./personas.core.observable.js":9,"./personas.core.point2d":10,"snapsvg":4}],9:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */

/**
 * Value wrapper class to be abe to observe changes to the wrapped value. Works similarly to an ES6 Proxy.
 *
 * @class Observable
 * @param {*|Observable} value - The initial value of this observable object.
 * @constructor
 */
function Observable(value) {
    /* member variables */
    this.mValue = value;
    this.mObservers = [];
    this.mEmptySpaces = 0;
    this.mParent = null;
    this.mParentId = -1;
    this.mIgnoreCount = 0;

    /* initialization */
}

/**
 * The value of this observable object.
 *
 * @property value
 * @type {*|Observable}
 */
Object.defineProperty(Observable.prototype, 'value', {
    get: function () {
        return this.mValue;
    },

    set: function (value) {
        this.setValue(value);
    },
});

/**
 * Utility function to set the value of this observable object.
 *
 * @method setValue
 * @param {*|Observable} value - The new value of this object.
 */
Observable.prototype.setValue = function (value) {
    if (this.mIgnoreCount) {
        --this.mIgnoreCount;
    } else {
        if (value instanceof Observable) {
            if (this.mParent !== value) {
                if (this.mParent && this.mParentId !== -1) {
                    this.mParent.unobserve(this.mParentId);
                }
                this.mParent = value;
                this.mParentId = value.observe(this._handleParentValueChanged.bind(this));
            }

            var parentValue = value.getValue();
            if (this.mValue !== parentValue) {
                this.mValue = parentValue;
                this._notifyObservers(parentValue);
            }
        } else if (value !== this.mValue) {
            this.mValue = value;
            this._notifyObservers(value);
        }
    }
};

/**
 * Utility function to get the value of this Object.
 *
 * @method getValue
 * @returns {*|Observable}
 */
Observable.prototype.getValue = function () {
    return this.mValue;
};

/**
 * Starts observing the value of this object. The passed `callback` will be called when changes are made.
 *
 * @method observe
 * @param {Function} callback - The callback function to be called when the value of this object changes.
 * @returns {Number} The id assigned to this observer, used to un-observe the value.
 */
Observable.prototype.observe = function (callback) {
    var observers = this.mObservers;
    var id = observers.length;
    if (!this.mEmptySpaces) { // if there are no empty spots in the observer array
        observers.push(callback);
    } else {
        for (var i = 0; i < id; ++i) {
            if (observers[i] === null) {
                observers[i] = callback;
                id = i;
                --this.mEmptySpaces;
                break;
            }
        }
    }

    return id;
};

/**
 * Removes the observer with the given `id` from the observer list.
 *
 * @method unobserve
 * @param {Number} id - The id of the observer to remove.
 * @returns {boolean} If an observer with the specified `id` is removed the result will be `true`, `false` otherwise.
 */
Observable.prototype.unobserve = function (id) {
    var observers = this.mObservers;
    if (observers[id]) {
        observers[id] = null;
        ++this.mEmptySpaces;
        return true;
    }

    return false;
};

/**
 * Ignores changes made to the this observable by the number of times specified in this function.
 * NOTE: This is cumulative if called in succession.
 *
 * @method ignoreChanges
 * @param {Number} times - The number of times changes should be ignored.
 */
Observable.prototype.ignoreChanges = function (times) {
    this.mIgnoreCount += times;
};

/**
 * Resets this observable state.
 *
 * @method reset
 * @param {boolean} deep - Should the reset remove all observers registered with this object or only break the link to its parent.
 */
Observable.prototype.reset = function(deep) {
    if (this.mParent && this.mParentId !== -1) {
        this.mParent.unobserve(this.mParentId);
        this.mParent = null;
        this.mParentId = -1;
    }

    if (deep) {
        delete this.mObservers;
        this.mObservers = [];
    }

    this.mValue = null;
    this.mIgnoreCount = 0;
};

/**
 * Internal function to notify the observers that a change in the value of this object has happened.
 *
 * @method _notifyObservers
 * @param {*|Object} value - The new value of this object.
 * @private
 */
Observable.prototype._notifyObservers = function (value) {
    var observers = this.mObservers;
    for (var i = 0, n = observers.length; i < n; ++i) {
        if (observers[i]) {
            observers[i](this, value);
        }
    }
};

/**
 * Internal function to handle changes in the value when a parent observable was set.
 *
 * @method _handleParentValueChanged
 * @param {Observable} sender - The Observable that triggered the change.
 * @param {*} value - The new value of the Observable.
 * @private
 */
Observable.prototype._handleParentValueChanged = function (sender, value) {
    if (sender === this.mParent && value !== this.mValue) {
        this.mValue = value;
        this._notifyObservers(value);
    }
};

/**
 * @export
 * @type {Observable}
 */
module.exports = Observable;

},{}],10:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/**
 * Utility class that represents a point in a 2D space.
 *
 * @class Point2D
 * @param {Number=} x - The X coordinate of this point.
 * @param {Number=} y - The Y coordinate of this point.
 * @constructor
 */
function Point2D (x, y) {
    /* member variables */
    this.mX = (x || 0);
    this.mY = (y || 0);
    this.mChangedCallback = null;
}

/**
 * The X coordinate of this point.
 *
 * @property x
 * @type {Number}
 */
Object.defineProperty(Point2D.prototype, 'x', {
    get: function () {
        return this.mX;
    },
    set: function (val) {
        this.mX = val;
        if (this.mChangedCallback) {
            this.mChangedCallback(val, this.mY);
        }
    },
});

/**
 * The Y coordinate of this point.
 *
 * @property y
 * @type {Number}
 */
Object.defineProperty(Point2D.prototype, 'y', {
    get: function () {
        return this.mY;
    },
    set: function (val) {
        this.mY = val;
        if (this.mChangedCallback) {
            this.mChangedCallback(this.mX, val);
        }
    },
});

/**
 * A callback function that gets called every time this point is modified through its external interface.
 *
 * @property changedCallback
 * @type {Function}
 */
Object.defineProperty(Point2D.prototype, 'changedCallback', {
    get: function () {
        return this.mChangedCallback;
    },
    set: function (val) {
        if (typeof val === 'function') {
            this.mChangedCallback = val;
        } else {
            this.mChangedCallback = null;
        }
    },
});

/**
 * Sets the X and Y coordinates of this point.
 *
 * @method set
 * @param {Number} x - The new X coordinate for this point.
 * @param {Number} y - The new Y coordinate for this point.
 */
Point2D.prototype.set = function (x, y) {
    this.mX = x;
    this.mY = y;
    if (this.mChangedCallback) {
        this.mChangedCallback(x, y);
    }
};

/**
 * Adds the passed point to this point. The result is saved in this point.
 *
 * @method add
 * @param {Point2D} point - The point to add.
 */
Point2D.prototype.add = function (point) {
    this.mX += point.mX;
    this.mY += point.mY;
    if (this.mChangedCallback) {
        this.mChangedCallback(this.mX, this.mY);
    }
};

/**
 * Subtracts the passed point from this point. The result is saved in this point.
 *
 * @method subtract
 * @param {Point2D} point - The point to subtract.
 */
Point2D.prototype.subtract = function (point) {
    this.mX -= point.mX;
    this.mY -= point.mY;
    if (this.mChangedCallback) {
        this.mChangedCallback(this.mX, this.mY);
    }
};

/**
 * Clones this point and returns the copied point.
 *
 * @method clone
 * @returns {Point2D}
 */
Point2D.prototype.clone = function() {
    var ret = new this.constructor(this.mX, this.mY);
    ret.mChangedCallback = this.mChangedCallback;
    return ret;
};

/**
 * @export
 * @type {Point2D}
 */
module.exports = Point2D;

},{}],11:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* imports */
var Point2D = require('./personas.core.point2d');

/**
 * Utility class that represents a 2D vector.
 *
 * @param {Number} x - The X coordinate of this point.
 * @param {Number} y - The Y coordinate of this point.
 * @constructor
 */
function Vector2D (x, y) {
    /* inheritance */
    Point2D.call(this, x, y);
}

/* inheritance */
Vector2D.prototype = Object.create(Point2D.prototype);
Vector2D.prototype.constructor = Vector2D;

/**
 * Creates the vector described between the two passed points.
 *
 * @static
 * @method fromPoints
 * @param {Point2D} from - The point representing the origin of the new vector.
 * @param {Point2D} to - The point representing the destination of the new vector.
 * @returns {Vector2D}
 */
Vector2D.fromPoints = function (from, to) {
    return new Vector2D(to.x - from.x, to.y - from.y);
};

/**
 * Returns the length squared (to the power of 2) of this vector.
 *
 * @property lengthSQ
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Vector2D.prototype, 'lengthSQ', {
    get: function () {
        return ((this.mX * this.mX) + (this.mY * this.mY));
    },
});

/**
 * Returns the length of this vector.
 *
 * @property length
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Vector2D.prototype, 'length', {
    get: function () {
        return Math.sqrt(this.lengthSQ);
    },
});

/**
 * Returns a new vector with length of 1 unit pointing in the same direction as this vector.
 *
 * @property unit
 * @type {Vector2D}
 * @readonly
 */
Object.defineProperty(Vector2D.prototype, 'unit', {
    get: function () {
        var length = this.length;
        return new Vector2D(this.mX / length, this.mY / length);
    },
});

/**
 * Returns the dot product between this vector and the passed vector.
 *
 * @param {Vector2D} vector - The vector to use to compute the dot product.
 * @returns {number}
 */
Vector2D.prototype.dot = function (vector) {
    return (this.mX * vector.mX) + (this.mY * vector.mY);
};

/**
 * Returns the cross product between this vector and the passed vector.
 *
 * @param {Vector2D} vector - The vector to use to compute the dot product.
 * @returns {number}
 */
Vector2D.prototype.cross = function (vector) {
    return (this.mX * vector.mY) - (this.mY * vector.mX);
};

/**
 * @export
 * @type {Vector2D}
 */
module.exports = Vector2D;

},{"./personas.core.point2d":10}],12:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var Defaults = {
    hooks: {
        onSelectPersona: null,
        onHoverPersona: null,
        onMergePersona: null,
        onSelectionCleared: null,
        onZoomUpdateFromUser: null,
        onClickEmptySpace: null,
    },
};

module.exports = Defaults;

module.exports.Persona = {
    classes: {
        container: 'prsnas_container',
        persona: 'prsnas_persona',
        content: 'prsnas_main',
        name: 'prsnas_name',
        namecontainer: 'prsnas_namecontainer',
        count: 'prsnas_count',
        totalcount: 'prsnas_totalcount',
        counttext: 'prsnas_counttext',
        seedcount: 'seed_count',
        seedname: 'seed_value',
        unselectable: 'unselectable',
        zoomcontrols: 'prsnas_zoom_controls',
        zoomcontrolslabel: 'control_label',
    },
    layout: {
        systemtype: 'cola',
        textpadding: 2,
        progressHeight: 9,
        minSize: 130,
        maxSize: 250,
        selectedBorder: 8,
    },
    pie: {
        baseColor: '#F6F1EE',
        defaultColor: '#9EC731',
        minimumDisplayRatio: 0.025,
    },
    events: {
        select: '[Persona::PersonaSelect]',
        deselectAll: '[Persona::PersonaDeselectAll]',
        hover: '[Persona::PersonaHover]',
        enableBlur: '[Persona::PersonaEnableBlur]',
        repel: '[Persona::PersonaRepel]',
        dragStarted: '[Persona::PersonaDragStarted]',
        dragMoved: '[Persona::PersonaDragged]',
        dragEnded: '[Persona::PersonaDragEnded]',
        merged: '[Persona::PersonaMerged]',
        expandSeed: '[Persona::expandSeed]',
        closeSeed: '[Persona::closeSeed]',
        zoomUpdateFromUser: '[Persona::zoomUpdateFromUser]',
    },
    config: {
        animationsDurationBase: 100,
        transitionsDuration: 500,
        moveEnabled: false,
        mergeEnabled: true,
        mergeOverlapRatio: 0.3,
        mergeScaleRatio: 1.05,
        drawOrbits: true,
        seedAnimationDurationBase: 400,
        autoGenerateFallbackColors: true,
        autoColorClampMin: 40,
        autoColorClampMax: 220,
        forceGreyscaleBackgroundColor: true,
        fallbackBackgroundColor: '#444444',
        subSelectEffectEnabled: true,
        subSelectEffectCompatibilityMode: true,
        registerWindowResize: true,
        displayTotalCountLabel: true,
        displayLabelsAtOneCount: true,
        renderSubSelectionBackground: true,
        renderGaugeSeparators: false,
        gaugeSeparatorWidth: 0.003,
    },
};

},{}],13:[function(require,module,exports){
(function (global){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var Snap = require('snapsvg');
var Defaults = require('./personas.defaults');
var Viewport = require('./personas.layout.viewport.js');
var ZoomControls = require('./personas.layout.zoomControls.js');
var OrbitSystem = require('./personas.layout.orbitSystem.js');
var ColaSystem = require('./personas.layout.colaSystem.js');
var Persona = require('./personas.persona.js');
var Seed = require('./personas.persona.seed.js');
var Events = Defaults.Persona.events;
var EventTracker = require('./personas.core.eventTracker');
var EventCenter = require('./personas.core.eventCenter.js');
var Point2D = require('./personas.core.point2d.js');
var Node = require('./personas.core.node');

/**
 * Personas class used to create a personas view.
 *
 * @class Personas
 * @param { HTMLElement } element - SVG element where the personas will be drawn.
 * @param { Object | null } options - Optional configuration parameters contained in an object.
 * @constructor
 */
function Personas(element, options) {
    /* member variables */
    this.mConfig = $.extend(true, {}, Defaults, options, {eventCenter: new EventCenter()});
    this.mEventCenter = this.mConfig.eventCenter;
    this.mEventTracker = new EventTracker(this.mEventCenter);
    this.mElement = null;
    this.mPaper = null;
    this.mViewport = null;
    this.mLayoutSystemFactory = null;
    this.mLayoutSystemType = null;
    this.mLayoutSystem = null;
    this.mSortedData = null;
    this.mIconMap = this.processIconMap(this.mConfig);
    this.mOwnsSVG = false;
    this.mJQElement = $(element);
    this.mOtherPersona = null;
    this.mOtherPersonaFill = null;

    /* initialization */
    if (element instanceof SVGElement) {
        this.mElement = element;
        var elementClasses = element.getAttribute('class');
        // If personas class is not specified
        if (elementClasses && elementClasses.split(' ').indexOf('personas') < 0) {
            this.mElement.setAttribute('class', elementClasses + ' personas');
        } else if (!elementClasses) {
            this.mElement.setAttribute('class', 'personas');
        }
    } else {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttributeNS(null, 'version', '1.1');
        svg.setAttribute('width', element.getAttribute('width'));
        svg.setAttribute('height', element.getAttribute('height'));
        svg.setAttribute('class', 'personas');
        element.appendChild(svg);

        this.mElement = svg;
        this.mOwnsSVG = true;
    }

    /* eslint-disable */
    this.mPaper = Node.mixinTouch(Snap(this.mElement));
    /* eslint-enable */

    this.mViewport = new Viewport(this.mPaper, this.mConfig);
    this.mPaper.append(this.mViewport);

    this.mZoomControls = new ZoomControls(
        this.mConfig,
        function() {
            this.mViewport.zoom((this.mViewport.zoomAmount * 0.3), this.mViewport.center, true);
        }.bind(this),
        function() {
            this.mViewport.zoom(-(this.mViewport.zoomAmount * 0.3), this.mViewport.center, true);
        }.bind(this),
        function() {
            this.autoZoom();
            /* publish that there was a zoom update from user interaction for any handlers hooked in */
            this.mEventCenter.publish(Events.zoomUpdateFromUser, this.zoom);
        }.bind(this)
    );
    this.mZoomControls.position.set(this.mJQElement.width() - this.mZoomControls.width - 20, 20);
    this.mPaper.append(this.mZoomControls);

    this.registerEvents();

    /* after all has been created, hook up the resizing event */
    this.mElementWidth = this.mJQElement.width();
    this.mElementHeight = this.mJQElement.height();

    /* initialize the layout system factory based on the configuration */
    this.layoutSystemType = this.mConfig.Persona.layout.systemtype;

    if (this.mConfig.Persona.config.registerWindowResize) {
        /* the resize event could occur too often, so throttle it */
        var resizeFunction = (function() {
            var timeout = null;
            return function() {
                if (!timeout) {
                    timeout = setTimeout(function() {
                        this.resize();
                        timeout = null;
                    }.bind(this), 100); // 10 times per second
                }
            }.bind(this);
        }.bind(this))();

        window.addEventListener('resize', resizeFunction, false);
    }
}

/**
 * The current zoom amount of the component.
 *
 * @property zoom
 * @type {Number}
 */
Object.defineProperty(Personas.prototype, 'zoom', {
    get: function() {
        return this.mViewport.zoomAmount;
    },
    set: function(amount) {
        var animated = true;
        var useActualAmount = true;
        this.mViewport.zoom(amount, this.mViewport.center, animated, useActualAmount);
    },
});

/**
 * Returns the internal layout system used in this personas instance.
 *
 * @property layoutSystem
 * @type {LayoutSystem}
 * @readonly
 */
Object.defineProperty(Personas.prototype, 'layoutSystem', {
    get: function() {
        return this.mLayoutSystem;
    },
});

/**
 * Property to define the layout system type that Personas will use.
 *
 * @property layoutSystemType
 * @type {String}
 */
Object.defineProperty(Personas.prototype, 'layoutSystemType', {
    get: function() {
        return this.mLayoutSystemType;
    },

    set: function(value) {
        var type;
        switch (value) {
            case Personas.COLA_LAYOUT_SYSTEM:
                type = value;
                break;

            case Personas.ORBITAL_LAYOUT_SYSTEM:
            default:
                type = Personas.ORBITAL_LAYOUT_SYSTEM;
        }
        this._setLayoutSystemType(type);
    },
});

/**
 * Sets the layout system that Personas will use to position its objects.
 *
 * @method _setLayoutSystemType
 * @param {String} type - The name of the layout system type to use.
 * @private
 */
Personas.prototype._setLayoutSystemType = function(type) {
    if (type !== this.mLayoutSystemType) {
        this.mLayoutSystemType = type;

        switch (type) {
            case Personas.COLA_LAYOUT_SYSTEM:
                this.mLayoutSystemFactory = function() {
                    return new ColaSystem(this.mJQElement);
                }.bind(this);
                break;

            case Personas.ORBITAL_LAYOUT_SYSTEM:
            default:
                this.mLayoutSystemFactory = function() {
                    return new OrbitSystem(20);
                };
        }

        if (this.mLayoutSystem) {
            if (this.mOtherPersona) {
                this.mLayoutSystem.removeObject(this.mOtherPersona);
            }
            var oldLayoutSystem = this.mLayoutSystem;
            oldLayoutSystem.removeAllObjects();
            oldLayoutSystem.remove();
            this.mLayoutSystem = this.mLayoutSystemFactory();
            this.mLayoutSystem.position.set(oldLayoutSystem.position.x, oldLayoutSystem.position.y);
            this.mViewport.append(this.mLayoutSystem);

            /* add all the objects in order to the layout system, but not adjusting their position */
            this.mSortedData.array.forEach(function(info) {
                if (info.graphicalPersona) {
                    this._addPersonaAndSeeds(this.mLayoutSystem, info);
                }
            }.bind(this));

            /* animate the objects' positions */
            this.mLayoutSystem.positionObjects(true);

            /* try to fit all the contents in the view */
            setTimeout(function() {
                /* create the other persona if needed */
                this._appendAndPositionOtherPersona(false);
                this.autoZoom();
            }.bind(this), 500);
        }
    }
};

/**
 * Extracts the relevant colors from the passed configuration and saves them to the returned object.
 *
 * @method processIconMap
 * @param {Object} config - The configuration object passed to this instance during initialization.
 * @returns {{icons: {}, defaults: {}, fallbackColor: string}}
 */
Personas.prototype.processIconMap = function(config) {
    var iconMap = {
        icons: {},
        defaults: {},
        fallbackColor: config.Persona.pie.defaultColor,
    };

    if (!config.autoGenerateIconMap && config.entityIcons) {
        var icons = config.entityIcons;
        for (var i = 0, n = icons.length; i < n; ++i) {
            var icon = icons[i];
            if (icon.color) {
                if (icon.entityRefId) {
                    iconMap.icons[icon.entityRefId] = icon.color;
                } else if (icon.isDefault) {
                    iconMap.defaults[icon.type] = icon.color;
                }
            }
        }
    }

    return iconMap;
};

/**
 * Loads the passed data into the widget and creates the personas needed to represent such data.
 *
 * @method loadData
 * @param {Object} data - The data to load.
 * @param {Boolean=} append = Flag used to describe if the new data should replace or update and append itself to the old data.
 * @param {Object=} options - an object to store any options needed to modify function workflow
 */
Personas.prototype.loadData = function(data, append, options) {
    var dataCopy = JSON.parse(JSON.stringify(data));

    if (this.mOtherPersona) {
        this.mLayoutSystem.removeObject(this.mOtherPersona);
    }

    if (!this.mSortedData || !append) {
        if (this.mLayoutSystem) {
            this.mLayoutSystem.invalidate();
            this.mLayoutSystem.removeAllObjects();
            this.mLayoutSystem.remove();
            this.mLayoutSystem = null;
        }

        /* sort the data before creating the personas */
        this.mSortedData = this.sortData(dataCopy);

        /* create a layout system to use */
        this.mLayoutSystem = this.mLayoutSystemFactory();

        /* create the personas */
        this.createPersonas(this.mSortedData, this.mLayoutSystem);

        /* position the objects */
        this.mLayoutSystem.positionObjects(false);

        /* create the other persona if needed */
        this._createOtherPersona(this.mSortedData.original.aggregates.other);

        /* try to fit all the contents in the view */
        if (!options || !options.deferZoom) { this.autoZoom(); }
    } else {
        this.updateData(dataCopy);
        /* try to fit all the contents in the view */
        setTimeout(function() {
            /* create the other persona if needed */
            this._updateOtherPersona(this.mSortedData.original.aggregates.other, false);
            if (!options || !options.deferZoom) { this.autoZoom(); }
        }.bind(this), 500);
    }
};

/**
 * Updates the existing data set to be merged with the data passed to this function.
 * NOTE: The new data set overwrites the old data with the new data if both sets contain the same objects but this
 * function does not delete entries from the old data set.
 *
 * @method updateData
 * @param {Object} data - The new data to load.
 */
Personas.prototype.updateData = function(data) {
    var mergedData = this.mergeData(this.mSortedData.original, data);
    var sortedData = this.sortData(mergedData);
    var minSize = this.mConfig.Persona.layout.minSize;
    var maxSize = this.mConfig.Persona.layout.maxSize;
    var minCount = sortedData.minCount;
    var sizeRange = ((sortedData.maxCount - minCount) || 1);
    var entityRefs = mergedData.entityRefs;
    var iconMap = this.mIconMap;

    /* create a fake layout system to put the newly created objects in, if any */
    var fakeSystem = this.mLayoutSystemFactory();

    /* got through the personas that already have a graphical persona and ask them to update */
    sortedData.array.forEach(function(info) {
        if (info.graphicalPersona) {
            var sizeCount = info.hasOwnProperty('customSize') ? info.customSize : info.relevantCount;
            info.size = (((sizeCount - minCount) / sizeRange) * (maxSize - minSize)) + minSize;
            info.graphicalPersona.updateData(info.size, info, iconMap, entityRefs);
        } else {
            this._createPersonaAndSeeds(fakeSystem, mergedData, info, minCount, minSize, maxSize, sizeRange);
        }
    }.bind(this));

    /* iterate through the newly created objects and set them up for 'popping' into place */
    fakeSystem.forEach(function(object) {
        /* reset the object's position */
        var oldCallback = object.position.changedCallback;
        object.position.changedCallback = null;
        object.position.set(0, 0);
        object.position.changedCallback = oldCallback;
        object.transform('t0,0');
        /* if the object supports it, call the popIn method */
        if (object.popIn) {
            object.popIn();
        }
    });

    /* remove all objects from the systems */
    fakeSystem.removeAllObjects();
    this.mLayoutSystem.removeAllObjects();

    /* add all the objects in order to the layout system, but not adjusting their position */
    sortedData.array.forEach(function(info) {
        this._addPersonaAndSeeds(this.mLayoutSystem, info);
    }.bind(this));

    /* animate the objects' positions */
    this.mLayoutSystem.positionObjects(true, true); // second parameter is specific to the cola layout system.

    /* save the sorted data */
    this.mSortedData = sortedData;
};

/**
 * Utility function to merge two sets of data.
 *
 * @method mergeData
 * @param {Object} data - The base data into which the new data will be merged.
 * @param {Object} newData - The new data to merge into the base data.
 * @returns {Object}
 */
Personas.prototype.mergeData = function(data, newData) {
    return $.extend(true, {}, data, newData);
};

/**
 * Function to create the other persona if needed.
 *
 * @method _createOtherPersona
 * @param {Object} otherPersonaData - The data to process, can be null  or undefined.
 * @private
 */
Personas.prototype._createOtherPersona = function(otherPersonaData) {
    if (this.mOtherPersona) {
        this.mLayoutSystem.removeObject(this.mOtherPersona);
        this.mOtherPersona = null;
    }

    if (otherPersonaData && otherPersonaData.count) {
        var data = {
            id: Personas.OTHER_PERSONA_DEFAULT_ID,
            totalCount: otherPersonaData.count,
            relevantName: 'Other',
            relevantCount: otherPersonaData.count,
            properties: [{
                'count': 0,
                'isPrimary': false,
                'color': '#000000',
            }],
        };

        if (otherPersonaData.metadata) {
            data.metadata = otherPersonaData.metadata;
        }

        this.mOtherPersona = new Persona(this.mConfig.Persona.layout.minSize, data, this.mIconMap, this.mConfig);
        if (this.mOtherPersona.mLabel.mTotalCountText) {
            this.mOtherPersona.mLabel.mTotalCountText.remove();
        }

        /* add a single gauge for selection purposes */
        this.mOtherPersona.mGauge.addBar('__selection_bar_id__', 0, this.mConfig.Persona.pie.defaultColor);

        if (!this.mOtherPersonaFill) {
            var patternGroup = this.mPaper.g();

            var rect = patternGroup.rect(0, 0, 10, 10);
            rect.attr({'fill': '#eee'});

            var line = patternGroup.line(-2, 2, 1, -1);
            line.attr({'stroke': '#ddd', 'stroke-width': '4px'});

            line = patternGroup.line(0, 10, 10, 0);
            line.attr({'stroke': '#ddd', 'stroke-width': '4px'});

            line = patternGroup.line(8, 12, 11, 9);
            line.attr({'stroke': '#ddd', 'stroke-width': '4px'});

            this.mOtherPersonaFill = patternGroup.toPattern(0, 0, 10, 10);
        }

        this.mOtherPersona.mAvatar.mBackground.attr({'fill': this.mOtherPersonaFill});

        this._appendAndPositionOtherPersona(false);
    }
};

/**
 * Checks if the specified id pertains to the other persona.
 *
 * @method isOtherPersona
 * @param {string} id - The id of te persona to check.
 * @returns {boolean}
 */
Personas.prototype.isOtherPersona = function(id) {
    return (this.mOtherPersona && id === Personas.OTHER_PERSONA_DEFAULT_ID);
};

/**
 * Function to update the other persona data if needed.
 *
 * @method _updateOtherPersona
 * @param {Object} otherPersonaData - The data to process, can be null  or undefined.
 * @param {boolean} animated - Should the position of the other persona be animated.
 * @private
 */
Personas.prototype._updateOtherPersona = function(otherPersonaData, animated) {
    if (this.mOtherPersona && otherPersonaData && otherPersonaData.count) {
        // make sure the other persona is added to the layout system before updating
        if (this.mOtherPersona.mParent !== this.mLayoutSystem) {
            this.mLayoutSystem.addObject(this.mOtherPersona, true);
        }
        this.mOtherPersona.mLabel.count = otherPersonaData.count;
        this._appendAndPositionOtherPersona(animated);
    } else if (this.mOtherPersona) {
        this.mLayoutSystem.removeObject(this.mOtherPersona);
        this.mOtherPersona = null;
    }
};

/**
 * Function to add and position the other persona if needed.
 *
 * @method _appendAndPositionOtherPersona
 * @param {boolean} animated - Should the position of the other persona be animated.
 * @private
 */
Personas.prototype._appendAndPositionOtherPersona = function(animated) {
    if (this.mOtherPersona) {
        this.mLayoutSystem.removeObject(this.mOtherPersona);
        var systemBox = this.mLayoutSystem.getBBox();
        this.mLayoutSystem.addObject(this.mOtherPersona, true);

        var right = systemBox.x2 - this.mLayoutSystem.position.x;
        var bottom = systemBox.y2 - this.mLayoutSystem.position.y;

        var position = new Point2D(right + this.mOtherPersona.radius, bottom + this.mOtherPersona.radius);
        if (animated) {
            this.mOtherPersona.animatePosition(this.mOtherPersona.position, position, 100, mina.backout);
        } else {
            this.mOtherPersona.position.set(position.x, position.y);
        }
    }
};

/**
 * Utility function to compare the information data of two personas.
 *
 * @method _personaComparison
 * @param {Object} a - The first persona info to compare.
 * @param {Object} b - The second persona info to compare
 * @returns {number} Represents which persona is larger or if they are equal.
 * @private
 */
Personas.prototype._personaComparison = function(a, b) {
    var aVal = a.hasOwnProperty('customSize') ? a.customSize : a.relevantCount;
    var bVal = b.hasOwnProperty('customSize') ? b.customSize : b.relevantCount;
    return bVal - aVal; // reverse sorting, from high to low
};

/**
 * Sorts the persona information instances passed in the `data` structure. Sorting is based on the size of the
 * persona, where the biggest persona appears at the beginning of the array and the smallest at the end.
 * NOTE: This function also adds the `relevantCount`, `relevantName`, `seeds`, `links` and `graphicalPersona` fields to
 * the persona information object.
 *
 * @method sortData
 * @param {Object} data - An object containing the persona information objects to sort.
 * @returns {{original: Object, array: Array, minCount: Number, maxCount: Number}}
 */
Personas.prototype.sortData = function(data) {
    var maxCount = Number.MIN_VALUE;
    var minCount = Number.MAX_VALUE;

    var sortedPersonaInfo = [];

    var entityRefs = data.entityRefs;
    var personas = data.aggregates.personas;
    for (var key in personas) {
        if (personas.hasOwnProperty(key)) {
            var personaInfo = personas[key];
            var name = '';
            var count = 0;
            var primaryProperty = this.findPrimaryProperty(personaInfo.properties);
            if (primaryProperty) {
                count = primaryProperty.count;
                if (primaryProperty.entityRefId) {
                    name = entityRefs[primaryProperty.entityRefId].name;
                    personaInfo.imageUrl = entityRefs[primaryProperty.entityRefId].imageUrl;
                    if (entityRefs[primaryProperty.entityRefId].backgroundColor) {
                        primaryProperty.backgroundColor = entityRefs[primaryProperty.entityRefId].backgroundColor;
                    }
                } else {
                    name = primaryProperty.value;
                }
            }

            var sizeCount = personaInfo.hasOwnProperty('customSize') ? personaInfo.customSize : count;
            maxCount = (sizeCount > maxCount) ? sizeCount : maxCount;
            minCount = (sizeCount < minCount) ? sizeCount : minCount;
            personaInfo.primaryProperty = primaryProperty;
            personaInfo.relevantCount = count;
            personaInfo.formattedRelevantCount = (primaryProperty && primaryProperty.formattedCount) ? primaryProperty.formattedCount : null;
            /* data doesn't have this property */
            personaInfo.relevantName = name;

            /* find the seeds for this persona */
            personaInfo.seeds = this.getSeedsForPersona(data.aggregates.seeds, personaInfo.id);

            /* find the links for this persona */
            personaInfo.links = this.getLinksForPersona(data.aggregates.links, personaInfo.id);

            /* add the seeds to the links, so they get rendered close to their owner */
            personaInfo.links.push.apply(personaInfo.links, personaInfo.seeds);

            /* when the personas are placed, they will have their graphical representations linked here */
            if (!personaInfo.graphicalPersona) {
                personaInfo.graphicalPersona = null;
            }

            /* finally add the persona to the array */
            sortedPersonaInfo.push(personaInfo);
        }
    }

    /* sort the persona array */
    sortedPersonaInfo.sort(this._personaComparison);

    return {
        original: data,
        array: sortedPersonaInfo,
        minCount: minCount,
        maxCount: maxCount,
    };
};

/**
 * Creates graphical representations of the persona information objects contained in the `sortedData` object.
 *
 * @method createPersonas
 * @param {Object} sortedData - An object containing information about the personas to create. Must contain an `array` property.
 * @param {LayoutSystem=} system - The layout system to which the personas should be added.
 */
Personas.prototype.createPersonas = function(sortedData, system) {
    var data = sortedData.original;
    var sortedPersonaInfo = sortedData.array;

    var pageCenterX = $(this.mElement).width() * 0.5;
    var pageCenterY = $(this.mElement).height() * 0.5;
    var personaMinSize = this.mConfig.Persona.layout.minSize;
    var personaMaxSize = this.mConfig.Persona.layout.maxSize;
    var minCount = sortedData.minCount;
    var sizeRange = ((sortedData.maxCount - minCount) || 1);
    sortedPersonaInfo.forEach(function(info) {
        /* if the persona hasn't been added yet */
        this._createPersonaAndSeeds(system, data, info, minCount, personaMinSize, personaMaxSize, sizeRange);
    }.bind(this));

    if (system) {
        this.mViewport.append(system);
        system.position.set(pageCenterX, pageCenterY);
    }
};

/**
 * Adds the passed persona, their seed personas and related personas in order based to the specified `system`
 *
 * @param {LayoutSystem} system - The layout system to which the created personas and seeds should be added to.
 * @param {Object} info - The information of the persona that should be created with its seeds.
 * @private
 */
Personas.prototype._addPersonaAndSeeds = function(system, info) {
    var persona = info.graphicalPersona;
    if (!system.containsObject(persona)) {
        system.addObject(persona, true);

        /* add the seed personas */
        var seeds = info.seeds;
        seeds.forEach(function(seed) {
            system.addObject(seed.info.graphicalSeed, true);
        });
    }
};

/**
 * Creates the persona for the passed 'info' and checks if it has seeds to create, if it does, it creates the seeds,
 * their personas and nested seeds recursively.
 *
 * @method _createPersonaAndSeeds
 * @param {LayoutSystem} system - The layout system to which the created personas and seeds should be added to.
 * @param {Object} data - A sorted array containing the information of all the personas to process.
 * @param {Object} info - The information of the persona that should be created with its seeds.
 * @param {Number} minCount - The minimum count of hits for all the available personas.
 * @param {Number} minSize - Minimum size that a persona should be spawned with.
 * @param {Number} maxSize - Maximum size that a persona should be spawned with.
 * @param {Number} sizeRange - The size range scalar to compute the final size of a persona.
 * @private
 */
Personas.prototype._createPersonaAndSeeds = function(system, data, info, minCount, minSize, maxSize, sizeRange) {
    if (!info.graphicalPersona) {
        var entityRefs = data.entityRefs;
        var sizeCount = info.hasOwnProperty('customSize') ? info.customSize : info.relevantCount;
        info.size = (((sizeCount - minCount) / sizeRange) * (maxSize - minSize)) + minSize;
        var persona = new Persona(info.size, info, this.mIconMap, this.mConfig, entityRefs);
        info.graphicalPersona = persona;
        if (system) {
            system.addObject(persona, true);
        }

        /* create the seed personas */
        var seeds = info.seeds;
        var globalConfig = this.mConfig;
        seeds.forEach(function(seedInfo) {
            if (!seedInfo.info.graphicalSeed) {
                /* create and add the seed to the system */
                var seed = new Seed(minSize, seedInfo.property, globalConfig);
                seedInfo.info.graphicalSeed = seed;
                if (system) {
                    system.addObject(seed, true);
                }
            }
        });
    }
};

/**
 * Utility function to sort seeds based on their strength.
 *
 * @method _seedComparison
 * @param {Object} a - The first seed to compare.
 * @param {Object} b - The second seed to compare
 * @returns {number} Represents which seed is stronger or if they are equal.
 * @private
 */
Personas.prototype._seedComparison = function(a, b) {
    return a.strength - b.strength;
};

/**
 * Traverses the provided `seeds` array searching for the seeds related to the persona with the specified `id` and returns
 * the found seeds, if any, in an `Array` structure.
 *
 * @method getSeedsForPersona
 * @param {Object} seeds - An array of the seeds to traverse looking for the specified persona id.
 * @param {String} id - The persona id to find the seeds for.
 * @returns {Array}
 */
Personas.prototype.getSeedsForPersona = function(seeds, id) {
    var ret = [];

    if (seeds) {
        for (var key in seeds) {
            if (seeds.hasOwnProperty(key)) {
                var seed = seeds[key];
                if (seed.relatedTo === id) {
                    var linkStrength = 0;
                    var primaryProperty = this.findPrimaryProperty(seed.properties);
                    if (primaryProperty) {
                        linkStrength = primaryProperty.count;
                    }

                    if (linkStrength) {
                        ret.push({
                            strength: linkStrength,
                            seedId: key,
                            info: seed,
                            property: primaryProperty,
                        });
                    }
                }
            }
        }
    }

    /* sort the array */
    ret.sort(this._seedComparison);

    return ret;
};

/**
 * Utility function to sort links based on their weight.
 *
 * @method _linkComparison
 * @param {Object} a - The first link to compare.
 * @param {Object} b - The second link to compare
 * @returns {number} Represents which link is stronger or if they are equal.
 * @private
 */
Personas.prototype._linkComparison = function(a, b) {
    return (a.weight || 0) - (b.weight || 0);
};

/**
 * Traverses the provided `links` array searching for the links related to the persona with the specified `id` and returns
 * the found links, if any, in an `Array` structure.
 *
 * @method getSeedsForPersona
 * @param {Array} links - An array of the links to traverse looking for the specified persona id.
 * @param {String} id - The persona id to find the links for.
 * @returns {Array}
 */
Personas.prototype.getLinksForPersona = function(links, id) {
    var ret = [];

    if (links) {
        links.forEach(function(link) {
            if (link.target === id && link.source) {
                ret.push(link);
            }
        });
    }

    /* sort the array */
    ret.sort(this._linkComparison);

    return ret;
};

/**
 * Traverses the provided `properties` array and finds the property marked as primary. Returns the primary property
 * if found, the first property in the array if no primary property is specified or null in any other case.
 *
 * @method findPrimaryProperty
 * @param {Array} properties - The array of properties to traverse.
 * @returns {Object}
 */
Personas.prototype.findPrimaryProperty = function(properties) {
    if (properties && properties.length) {
        for (var i = 0, n = properties.length; i < n; ++i) {
            if (properties[i].isPrimary) {
                return properties[i];
            }
        }
        return properties[0];
    }
    return null;
};

/**
 * Finds the persona with the specified `id`
 * @param {String} id - The id of the persona to find.
 * @returns {Persona}
 */
Personas.prototype.findPersona = function(id) {
    var sortedArray = this.mSortedData.array;
    for (var i = 0, n = sortedArray.length; i < n; ++i) {
        var info = sortedArray[i];
        if (info.graphicalPersona && info.graphicalPersona.personaId === id) {
            return info.graphicalPersona;
        }
    }

    return null;
};

/**
 * Automatically zooms and repositions the viewport so all its contents fit in the view while respecting the configured
 * min and max scale values of the viewport.
 *
 * @method autoZoom
 */
Personas.prototype.autoZoom = function() {
    var pageWidth = this.mJQElement.width();
    var pageHeight = this.mJQElement.height();
    var systemBox = this.mLayoutSystem.getBBox();

    var newScale = Math.min(pageWidth / systemBox.width, pageHeight / systemBox.height);
    if (newScale < this.mViewport.minZoomScale) {
        newScale = this.mViewport.minZoomScale;
    } else if (newScale > this.mViewport.maxZoomScale) {
        newScale = this.mViewport.maxZoomScale;
    }

    /* persist the current zoom level */
    this.mViewport.zoomAmount = newScale;

    var matrix = Snap.matrix();
    matrix.translate(pageWidth * 0.5, pageHeight * 0.5);
    matrix.scale(newScale);
    matrix.translate(-systemBox.cx, -systemBox.cy);
    this.mViewport.animate({transform: matrix}, 250, mina.easeinout);
};

/**
 * Resizes the component to fit within its container.
 *
 * @method resize
 */
Personas.prototype.resize = function() {
    var newWidth = this.mJQElement.width();
    var newHeight = this.mJQElement.height();
    var matrix = this.mViewport.transform().localMatrix;

    if (newWidth !== this.mElementWidth) {
        var widthOffset = newWidth - this.mElementWidth;
        this.mElementWidth = newWidth;
        matrix.e += (widthOffset * 0.5);
        if (this.mOwnsSVG) {
            this.mElement.setAttribute('width', newWidth);
        }
    }

    if (newHeight !== this.mElementHeight) {
        var heightOffset = newHeight - this.mElementHeight;
        this.mElementHeight = newHeight;
        matrix.f += (heightOffset * 0.5);
        if (this.mOwnsSVG) {
            this.mElement.setAttribute('height', newHeight);
        }
    }
    this.mViewport.transform(matrix);
    this.mZoomControls.position.set(this.mJQElement.width() - this.mZoomControls.width - 20, 20);
};

/**
 * Removes the specified persona completely from the system.
 *
 * @param {Persona | string} toRemove - The persona or persona id to remove
 */
Personas.prototype.removePersona = function(toRemove) {
    var persona = toRemove;
    if (!persona.personaId) {
        persona = this.findPersona(toRemove);
    }

    /* remove the persona from the payout system */
    this.mLayoutSystem.removeObject(persona);

    /* delete the merged persona from the data */
    var id = persona.personaId;
    var personas = this.mSortedData.original.aggregates.personas;
    if (personas.hasOwnProperty(id)) {
        var info = personas[id];
        delete personas[id];
        var index = this.mSortedData.array.indexOf(info);
        if (index >= 0) {
            this.mSortedData.array.splice(index, 1);
        }
    }
};

/**
 * Registers this instance to listen for events.
 *
 * @method registerEvents
 */
Personas.prototype.registerEvents = function() {
    var eventTracker = this.mEventTracker;
    eventTracker.registerEvent(Events.select, this.handlePersonaSelect.bind(this));
    eventTracker.registerEvent(Events.hover, this.handlePersonaHover.bind(this));
    eventTracker.registerEvent(Events.merged, this.handlePersonaMerged.bind(this));
    eventTracker.registerEvent(Events.deselectAll, this.handlePersonaDeselectAll.bind(this));
    eventTracker.registerEvent(Events.zoomUpdateFromUser, this.handlePersonaZoomUpdate.bind(this));
};

/**
 * Unregisters all the events registered in the `registerEvents` function.
 *
 * @method unregisterEvents
 */
Personas.prototype.unregisterEvents = function() {
    this.mEventTracker.unregisterAllEvents();
};

/**
 * Handles the event triggered when a persona is selected.
 *
 * @method handlePersonaSelect
 * @param {Object} data - The data generated by the event.
 */
Personas.prototype.handlePersonaSelect = function(data) {
    if (this.mLayoutSystem) {
        var selectionStates = [];
        var iconMap = this.mIconMap;

        this.mLayoutSystem.forEach(function(object) {
            if (object instanceof Persona) {
                object.removeAllAppendedGauges();
                object.replaceGaugeBars(object.data, iconMap);
                object.inVisualFocus = true;
                selectionStates.push({id: object.personaId, selected: object.isSelected});
            }
        });

        if (typeof this.mConfig.hooks.onSelectPersona === 'function') {
            data.personaSelectionStates = selectionStates;
            this.mConfig.hooks.onSelectPersona(data);
        }
    }
};

/**
 * Handles the event triggered when a all personas should be deselected.
 *
 * @method handlePersonaDeselectAll
 */
Personas.prototype.handlePersonaDeselectAll = function() {
    if (this.mLayoutSystem) {
        var iconMap = this.mIconMap;

        /* deselect all the personas */
        this.mLayoutSystem.forEach(function(object) {
            if (object instanceof Persona) {
                object.isSelected = false;
                object.removeAllAppendedGauges();
                object.replaceGaugeBars(object.data, iconMap);
                object.inVisualFocus = true;
            }
        });

        if (typeof this.mConfig.hooks.onSelectPersona === 'function') {
            var selectionStates = [];
            var data = {};
            this.mLayoutSystem.forEach(function(object) {
                if (object instanceof Persona) {
                    selectionStates.push({id: object.personaId, selected: object.isSelected});
                }
            });

            /* simulate a persona select event */
            if (selectionStates.length) {
                data.id = selectionStates[0].id;
                data.selected = selectionStates[0].selected;
                data.personaSelectionStates = selectionStates;
                this.mConfig.hooks.onSelectPersona(data);
            }
        }

        if (typeof this.mConfig.hooks.onSelectionCleared === 'function') {
            this.mConfig.hooks.onSelectionCleared();
        }
    }
};

/**
 * Handles the event triggered when the zoom for the personas has been changed.
 *
 * @method handlePersonaZoomUpdate
 * @param {Object} newZoom - the new zoom level after update.
 */
Personas.prototype.handlePersonaZoomUpdate = function(newZoom) {
    if (typeof this.mConfig.hooks.onZoomUpdateFromUser === 'function') {
        this.mConfig.hooks.onZoomUpdateFromUser(newZoom);
    }
};

/**
 * Handles the event triggered when the mouse hovers a persona.
 *
 * @method handlePersonaHover
 * @param {Object} data - The data generated by the event.
 */
Personas.prototype.handlePersonaHover = function(data) {
    if (typeof this.mConfig.hooks.onHoverPersona === 'function') {
        this.mConfig.hooks.onHoverPersona(data);
    }
};

/**
 * Handles the event triggered when a persona is merged into another persona.
 *
 * @method handlePersonaMerged
 * @param {Persona} merged - The persona that was merged.
 * @param {Persona} mergedTo - The persona receiving the merged persona.
 */
Personas.prototype.handlePersonaMerged = function(merged, mergedTo) {
    if (typeof this.mConfig.hooks.onMergePersona === 'function') {
        this.mConfig.hooks.onMergePersona({
            merged: merged,
            mergedTo: mergedTo,
        });
    }

    /* delete the merged persona from the data */
    var id = merged.personaId;
    var personas = this.mSortedData.original.aggregates.personas;
    if (personas.hasOwnProperty(id)) {
        var info = personas[id];
        delete personas[id];
        var index = this.mSortedData.array.indexOf(info);
        if (index >= 0) {
            this.mSortedData.array.splice(index, 1);
        }
    }
};

/**
 * Utility function to enable of disable the blur effect of personas.
 *
 * @method enableBlur
 * @param {boolean} enabled - Flag describing if the blur effect should be enabled or disabled.
 */
Personas.prototype.enableBlur = function(enabled) {
    this.mEventCenter.publish(Events.enableBlur, enabled);
};

/**
 * Select a subset of personas while the rest of the personas are set visually out of focus, and
 * display subselection data and outer query data in a single gauge.
 *
 * @method subSelectPersonas
 * @param {Object} subSelectContext - An object containing the ids of the personas to be selected and their counts.
 * @param {Boolean=} keepSubSelection - If set to `true` and there was a previous sub selection, the sub-selection is merged with the new one.
 */
Personas.prototype.subSelectPersonas = function (subSelectContext, keepSubSelection) {
    var iconMap = this.mIconMap;

    if (subSelectContext) {
        this.layoutSystem.forEach(function (persona) {
            if (persona instanceof Persona) {
                /* deselect any selected personas */
                persona.isSelected = false;

                var personaData = persona.data;

                /* data for the new gauge bars */
                var gaugeData = {
                    properties: [],
                    totalCount: personaData.totalCount,
                };
                var appendGaugeProp = function(name, count, color) {
                    gaugeData.properties.push({
                        value: name,
                        count: count,
                        color: color,
                    });
                };

                var personaName = persona.personaId;
                var queryPortion = personaData.relevantCount;
                var subSelectData = subSelectContext[persona.personaId];
                var subSelectNameBase = personaName + '-subselect';
                var subSelectCount = 0;
                var gaugeBars = persona.gauge.mBars;
                var hasSubSelection = Boolean(gaugeBars[subSelectNameBase + '-0']);

                if (subSelectData && subSelectData.bars.length) {
                    var newBars = subSelectData.bars;
                    for (var i = 0, n = newBars.length; i < n; ++i) {
                        var newBar = newBars[i];
                        var subSelectName = subSelectNameBase + '-' + i;
                        subSelectCount += newBar.count;
                        appendGaugeProp(subSelectName, newBar.count, newBar.color);
                    }
                    persona.inVisualFocus = true;
                    hasSubSelection = false;
                }

                if (!keepSubSelection || !hasSubSelection) {
                    persona.inVisualFocus = Boolean(gaugeData.properties.length);
                    if (!this.isOtherPersona(personaName) && this.mConfig.Persona.config.renderSubSelectionBackground) {
                        queryPortion = queryPortion - subSelectCount;
                        appendGaugeProp(subSelectNameBase + '-back', queryPortion, '#c5c1be');
                    }
                    persona.replaceGaugeBars(gaugeData, iconMap);
                }
            }
        }.bind(this));
    } else {
        this.mEventCenter.publish(Events.deselectAll);
    }
};

/**
 * This function selects a subset of personas while the rest of the personas are set visually out of focus.
 * Optionally, selected personas can be appended a new gauge.
 *
 * @param {Object} selectionData - An object containing the ids of the personas to be selected and a description of the gauges to be added, if any.
 * @param {Boolean=} keepSubSelection - If set to `true` and there was a previous sub selection, the sub-selection is merged with the new one.
 */
Personas.prototype.subSelectPersonasMultiGauge = function(selectionData, keepSubSelection) {
    if (selectionData) {
        this.mLayoutSystem.forEach(function(object) {
            if (object instanceof Persona) {
                /* deselect any selected personas */
                object.isSelected = false;

                /* get the data */
                var data = selectionData[object.personaId];

                /* if not keeping the selection, remove all previous selection states */
                if (!keepSubSelection) {
                    object.removeAllAppendedGauges();
                }

                /* if the data is found, process it */
                if (data) {
                    /* compute the bar percentages if needed */
                    if (data.computePercentages) {
                        var totalCount = (data.totalCount || object.mData.totalCount);
                        var bars = data.bars;
                        for (var i = 0, n = bars.length; i < n; ++i) {
                            var bar = bars[i];
                            bar.percent = bar.count / totalCount;
                        }
                    }

                    object.appendGauge(data.bars);
                    object.bringToFront();
                    object.inVisualFocus = true;
                } else if (!keepSubSelection || !object.hasAppendedGauges) { /* if not data is found visually unfocus the persona */
                    object.inVisualFocus = false;
                }
            }
        });
    } else {
        this.mEventCenter.publish(Events.deselectAll);
    }
};

/**
 * Orbital layout system name.
 *
 * @static
 * @type {string}
 */
Personas.ORBITAL_LAYOUT_SYSTEM = 'orbital';

/**
 * Cola layout system name.
 *
 * @static
 * @type {string}
 */
Personas.COLA_LAYOUT_SYSTEM = 'cola';

/**
 * Default id for the "Other" persona.
 *
 * @static
 * @type {string}
 */
Personas.OTHER_PERSONA_DEFAULT_ID = '__Personas_Other_Persona_ID__';

/**
 * @export
 * @type {Personas}
 */
module.exports = Personas;
module.exports.asJQueryPlugin = /* istanbul ignore next: Jquery Plugin Registration */ function() {
    $.fn.personas = function(command) {
        var t = this;
        var commands = {
            initialize: function(options) {
                this._personas = new Personas(this, options);
            },
            loaddata: function(data, append, options) {
                this._personas.loadData(data, append, options);
            },
            enableblur: function(enabled) {
                this._personas.enableBlur(enabled);
            },
            subselect: function(data, keepSubSelection) {
                if (data) {
                    /* convert the data to the internal format */
                    var selectionData = {};
                    for (var i = 0, n = data.length; i < n; ++i) {
                        var personaData = data[i];
                        selectionData[personaData.personaId] = {
                            computePercentages: true,
                            bars: [{
                                color: personaData.color,
                                count: personaData.count,
                            }],
                        };
                    }
                    this._personas.subSelectPersonas(selectionData, keepSubSelection);
                } else {
                    this._personas.subSelectPersonas(null, keepSubSelection);
                }
            },
            clearSubselections: function() {
                this._personas.mEventCenter.publish(Events.deselectAll);
            },
            unregisterHandlers: function() {
                this._personas.unregisterEvents();
            },
            setlayouttype: function(type) {
                this._personas.layoutSystemType = type;
            },
            findpersona: function(id, cb) {
                cb(this._personas.findPersona(id));
            },
            getZoom: function(cb) {
                cb(this._personas.zoom);
            },
            setZoom: function(amount) {
                this._personas.zoom = amount;
            },
            dispose: function() {
                t.each(function(index, element) {
                    element._personas = null;
                    element.remove();
                });
            },
        };
        // define argument variable here as arguments get overloaded in the each call below.
        var args = arguments;
        return t.each(function(index, element) {
            if (command === undefined) {
                commands.initialize.apply(element, null);
            } else if (commands[command]) {
                commands[command].apply(element, Array.prototype.slice.call(args, 1));
            } else if (typeof command === 'object' || !command) {
                commands.initialize.apply(element, args);
            } else {
                $.error('Command: ' + command + 'does not exist.');
            }
        });
    };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./personas.core.eventCenter.js":6,"./personas.core.eventTracker":7,"./personas.core.node":8,"./personas.core.point2d.js":10,"./personas.defaults":12,"./personas.layout.colaSystem.js":14,"./personas.layout.orbitSystem.js":17,"./personas.layout.viewport.js":18,"./personas.layout.zoomControls.js":19,"./personas.persona.js":22,"./personas.persona.seed.js":24,"snapsvg":4}],14:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var LayoutSystem = require('./personas.layout.layoutSystem.js');
var Cola = require('webcola');
var Point2D = require('./personas.core.point2d.js');

/**
 * Layout system based on WebCola:
 * http://marvl.infotech.monash.edu/webcola/
 *
 * @class ColaSystem
 * @param {jQuery} container - The element to which system will be added. Used to calculate the size of the layout.
 * @constructor
 */
function ColaSystem(container) {
    /* inheritance */
    LayoutSystem.call(this);

    /* member variables */
    this.mObjects = [];
    this.mContainer = container;

    /* initialization */
}

/**
 * @inheritance
 * @type {LayoutSystem}
 */
ColaSystem.prototype = Object.create(LayoutSystem.prototype);
ColaSystem.prototype.constructor = ColaSystem;

/**
 * Returns the total count of objects in this system.
 *
 * @property objectCount
 * @type {Number}
 * @readonly
 */
Object.defineProperty(ColaSystem.prototype, 'objectCount', {
    get: function () {
        return this.mObjects.length;
    },
});

/* eslint-disable */
/**
 * Adds an object to this system. If the object wouldn't fit in the outmost orbit a new orbit is created and added to the system.
 *
 * @method addObject
 * @param {Object} object - The object to be added to the system
 * @param {Boolean=} skipPositionCalculation - If set to true the added objects do not re-calculate their positions. Ignored in this system.
 */
ColaSystem.prototype.addObject = function (object, skipPositionCalculation) {
    this.mObjects.push(object);
    this.append(object);
};
/* eslint-enable */

/**
 * If the object exists in this orbit system, it is removed. Return true if the object was removed successfully, false otherwise.
 *
 * @method removeObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to remove.
 * @returns {boolean}
 */
ColaSystem.prototype.removeObject = function (object) {
    var objects = this.mObjects;
    var index = objects.indexOf(object);
    if (index >= 0) {
        objects[index].mParent = null;
        objects[index].remove();
        objects.splice(index, 1);
        return true;
    }

    return false;
};

/**
 * Removes all objects from the orbit system.
 *
 * @method removeAllObjects
 */
ColaSystem.prototype.removeAllObjects = function () {
    var objects = this.mObjects;
    while (objects.length) {
        var object = objects.pop();
        object.remove();
        object.mParent = null;
    }
};

/**
 * Checks if this system contains the specified `object`.
 *
 * @method containsObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to look for.
 * @returns {boolean}
 */
ColaSystem.prototype.containsObject = function (object) {
    return (this.mObjects.indexOf(object) >= 0);
};

/**
 * Iterates through all the objects in this orbit system recursively and calls the callback with each object as
 * its sole argument.
 *
 * @method forEach
 * @param {Function} callback - The function to call for every object.
 */
ColaSystem.prototype.forEach = function (callback) {
    this.mObjects.forEach(callback);
};

/**
 * Goes through all the objects in this system and moves them to their most updated position.
 *
 * @method positionObjects
 * @param {Boolean=} animated - Should the objects be animated to their new position.
 * @param {Boolean=} skipFit - Specific to this layout system, should the fit function be skipped.
 */
ColaSystem.prototype.positionObjects = function(animated, skipFit) {
    var nodes = [];
    var links = [];
    var width = this.mContainer.width();
    var height = this.mContainer.height();

    this.mObjects.forEach(function(object) {
        var node = this._createNodeData(object);
        if (node) {
            if (!node.id) {
                node.id = 'unknown_' + nodes.length;
            }
            nodes.push(node);
            links.push.apply(links, this._processLinksData(object, node));
        }
    }.bind(this));

    for (var i = 0; i < links.length; ++i) {
        var link = links[i];
        link.source = this._findNode(nodes, link.seed || link.source);
        if (!link.target || !link.source) {
            links.splice(i--, 1);
        }
    }

    var layout = new Cola.Layout();
    layout.nodes(nodes);
    layout.links(links);
    layout.size([width, height]);
    layout.avoidOverlaps(true);
    layout.linkDistance(function(l) { return (l.source.width * 0.4 + l.target.width * 0.4); });
    layout.start(25, 0, 10, 0, false);
    if (!skipFit) {
        this._fit(nodes, width, height);
    }

    var xOffset = width * 0.5;
    var yOffset = height * 0.5;
    nodes.forEach(function(node) {
        node.x -= xOffset;
        node.y -= yOffset;
        if (animated && node.object.animatePosition) {
            var position = node.object.position;
            if (node.x !== position.x || node.y !== position.y) {
                var newPosition = new Point2D(node.x, node.y);
                node.object.animatePosition(position, newPosition, 500, mina.backout);
            }
        } else {
            node.object.position.set(node.x, node.y);
        }
    });
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
ColaSystem.prototype.invalidate = function () {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var object = objects[i];
        if (typeof object.invalidate === 'function') {
            object.invalidate();
        }
    }
};

/**
 * Creates graph node data from a persona in the layout.
 *
 * @method _createNodeData
 * @param {Persona} object - The persona from which the data will be extracted.
 * @returns {{object: *, id: String, x: number, y: number, width: number, height: number}}
 * @private
 */
ColaSystem.prototype._createNodeData = function(object) {
    return {
        object: object,
        id: object.personaId,
        x: object.position.x,
        y: object.position.y,
        width: object.size,
        height: object.size,
    };
};

/**
 * Extracts the links data from a persona in the layout.
 *
 * @method _processLinksData
 * @param {Persona} object - The persona from which the data will be extracted.
 * @param {Object} node - The graph node associated with the persona object.
 * @returns {Array}
 * @private
 */
ColaSystem.prototype._processLinksData = function(object, node) {
    var links = [];
    if (object.data && object.data.links) {
        object.data.links.forEach(function(link) {
            var newLink = {
                source: link.source,
                target: node,
            };

            if (!newLink.source && link.info && link.info.graphicalSeed) {
                newLink.source = null;
                newLink.seed = link.info.graphicalSeed;
            }

            if (link.length) {
                newLink.length = link.length;
            }

            if (link.weight) {
                newLink.weight = link.weight;
            }

            links.push(newLink);
        });
    }

    return links;
};

/**
 * Given a `nodes` array it finds the needle by comparing it to the id or the object in each node.
 *
 * @method _findNode
 * @param {Array} nodes - An array of graph nodes.
 * @param {String|Object} needle - An object id as a string or the actual object to look for.
 * @returns {Object|null}
 * @private
 */
ColaSystem.prototype._findNode = function(nodes, needle) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
        if (nodes[i].id === needle || nodes[i].object === needle) {
            return nodes[i];
        }
    }
    return null;
};

/**
 * Rotates the given nodes to better fit in the given space.
 * NOTE: Updates nodes in place.
 *
 * @param {Array<{x: number, y: number, width: number, height: number}>} nodes - The nodes to fit in the given space.
 * @param {number} width - The width to fit into.
 * @param {number} height - The height to fit into.
 * @private
 */
ColaSystem.prototype._fit = function (nodes, width, height) {
    if (!nodes || !nodes.length) return;

    // rotation function.
    function rotate(cx, cy, x, y, radians) {
        var ry = -y;
        var rcy = -cy; // switch from browser space to cartesian space
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var nx = (cos * (x - cx)) + (sin * (ry - rcy)) + cx;
        var ny = (cos * (ry - rcy)) - (sin * (x - cx)) + rcy;
        return {x: nx, y: -ny};
    }

    var e = {
        x0: Number.MAX_VALUE,
        x1: -Number.MAX_VALUE,
        y0: Number.MAX_VALUE,
        y1: -Number.MAX_VALUE,
    };

    // find extents of locations.
    nodes.forEach( function(n) {
        e.x0 = Math.min(e.x0, n.x);
        e.x1 = Math.max(e.x1, n.x);
        e.y0 = Math.min(e.y0, n.y);
        e.y1 = Math.max(e.y1, n.y);
    });

    var center = {
        x: e.x1 - e.x0,
        y: e.y1 - e.y0,
    };

    var farthest = {
        distance: 0,
        node: null,
    };

    // find farthest node
    nodes.forEach( function(n) {
        var xd = n.x - center.x;
        var yd = n.y - center.y;
        var len = Math.sqrt(xd * xd + yd * yd);

        if (farthest.distance < len) {
            farthest.distance = len;
            farthest.node = n;
        }
    });

    // calculate angle difference to put farthest node in bottom right
    var angle =
        Math.atan2(-farthest.node.y + center.y, farthest.node.x - center.x) -
        Math.atan2(-height, width);

    // rotate
    nodes.forEach( function(n) {
        var newxy = rotate(center.x, center.y, n.x, n.y, angle);

        n.x = newxy.x;
        n.y = newxy.y;
    });

    e = {
        x0: Number.MAX_VALUE,
        x1: -Number.MAX_VALUE,
        y0: Number.MAX_VALUE,
        y1: -Number.MAX_VALUE,
    };

    // find extents of geometry.
    nodes.forEach( function(n) {
        e.x0 = Math.min(e.x0, n.x - 0.5 * n.width);
        e.x1 = Math.max(e.x1, n.x + 0.5 * n.width);
        e.y0 = Math.min(e.y0, n.y - 0.5 * n.height);
        e.y1 = Math.max(e.y1, n.y + 0.5 * n.height);
    });

    // translate
    nodes.forEach( function(n) {
        n.x = (n.x - e.x0);
        n.y = (n.y - e.y0);
    });

    // DEBUG
    // farthest.node.group = 'far';
};

/**
 * @export
 * @type {ColaSystem}
 */
module.exports = ColaSystem;

},{"./personas.core.point2d.js":10,"./personas.layout.layoutSystem.js":15,"webcola":5}],15:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Node = require('./personas.core.node.js');

/**
 *
 * @class LayoutSystem
 * @constructor
 */
function LayoutSystem() {
    /* inheritance */
    Node.call(this);

    /* member variables */

    /* initialization */
}

/**
 * @inheritance
 * @type {Node}
 */
LayoutSystem.prototype = Object.create(Node.prototype);
LayoutSystem.prototype.constructor = LayoutSystem;

/* eslint-disable */

/**
 * Returns the total count of objects in this system.
 *
 * @property objectCount
 * @type {Number}
 * @readonly
 */
Object.defineProperty(LayoutSystem.prototype, 'objectCount', {
    get: function () {
        throw new Error('not implemented');
    },
});

/**
 * Adds an object to this system. If the object wouldn't fit in the outmost orbit a new orbit is created and added to the system.
 *
 * @method addObject
 * @param {Object} object - The object to be added to the system
 * @param {Boolean=} skipPositionCalculation - If set to true the added objects do not re-calculate their positions.
 */
LayoutSystem.prototype.addObject = function (object, skipPositionCalculation) {
    throw new Error('not implemented');
};

/**
 * If the object exists in this orbit system, it is removed. Return true if the object was removed successfully, false otherwise.
 *
 * @method removeObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to remove.
 * @returns {boolean}
 */
LayoutSystem.prototype.removeObject = function (object) {
    throw new Error('not implemented');
};

/**
 * Removes all objects from the orbit system.
 *
 * @method removeAllObjects
 */
LayoutSystem.prototype.removeAllObjects = function () {
    throw new Error('not implemented');
};

/**
 * Checks if this system contains the specified `object`.
 *
 * @method containsObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to look for.
 * @returns {boolean}
 */
LayoutSystem.prototype.containsObject = function (object) {
    throw new Error('not implemented');
};

/**
 * Iterates through all the objects in this orbit system recursively and calls the callback with each object as
 * its sole argument.
 *
 * @method forEach
 * @param {Function} callback - The function to call for every object.
 */
LayoutSystem.prototype.forEach = function (callback) {
    throw new Error('not implemented');
};

/**
 * Goes through all the objects in this system and moves them to their most updated position.
 *
 * @method positionObjects
 * @param {Boolean=} animated - Should the objects be animated to their new position.
 */
LayoutSystem.prototype.positionObjects = function(animated) {
    throw new Error('not implemented');
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
LayoutSystem.prototype.invalidate = function () {
    throw new Error('not implemented');
};

/* eslint-enable */

/**
 * @export
 * @type {LayoutSystem}
 */
module.exports = LayoutSystem;

},{"./personas.core.node.js":8}],16:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var Node = require('./personas.core.node.js');
var Point2D = require('./personas.core.point2d.js');

/**
 * This class represents an "orbit" in the personas space.
 * When positioning personas a radial system is used, think of orbits as radial layers of personas.
 *
 * @class Orbit
 * @param { Number= } radius - the radius at which to create the orbit.
 * @constructor
 */
function Orbit(radius) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mInnerRadius = (radius || 0);
    this.mOuterRadiusOffset = 0;
    this.mFilledAngle = 0;
    this.mObjects = [];
    this.mParent = null;

    this.mDistributeEvenly = true;
    this.mAngleOffset = 0;

    /* initialization */
}

/* inheritance */
Orbit.prototype = Object.create(Node.prototype);
Orbit.prototype.constructor = Orbit;

/**
 * Returns the inner radius of this orbit.
 *
 * @property innerRadius
 * @type { Number }
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'innerRadius', {
    get: function () {
        return this.mInnerRadius;
    },

    set: function (val) {
        if (val !== this.mInnerRadius) {
            this.mInnerRadius = val;
            this._positionObjects();
        }
    },
});

/**
 * Returns the radius of this orbit. The radius represents the outermost part of the orbit.
 *
 * @property radius
 * @type { Number }
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'radius', {
    get: function () {
        return this.mInnerRadius + this.mOuterRadiusOffset;
    },
});

/**
 * Defines if the objects in this orbit should be distributed evenly or if they should be stacked as closely as possible.
 *
 * @property distributeEvenly
 * @type {Boolean}
 */
Object.defineProperty(Orbit.prototype, 'distributeEvenly', {
    get: function () {
        return this.mDistributeEvenly;
    },

    set: function (val) {
        if (this.mDistributeEvenly !== val) {
            this.mDistributeEvenly = val;
            this._positionObjects();
        }
    },
});

/**
 * Returns the radius at which the orbit would go through the center of all the objects in it.
 *
 * @property centerRadius
 * @type { Number }
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'centerRadius', {
    get: function () {
        return this.mInnerRadius + (this.mOuterRadiusOffset * 0.5);
    },
});

/**
 * If this object was added to an `OrbitSystem` or another 'Orbit' this property will return such object.
 *
 * @property parentNode
 * @type {Orbit|OrbitSystem}
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'parentNode', {
    get: function () {
        return this.mParent;
    },
});

/**
 * Returns the total count of objects in this orbit, including the ones in any sub orbits or systems it may contain.
 *
 * @property objectCount
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Orbit.prototype, 'objectCount', {
    get: function () {
        var objects = this.mObjects;
        var count = 0;
        for (var i = 0, n = objects.length; i < n; ++i) {
            var object = objects[i];
            if (object.hasOwnProperty('objectCount')) {
                count += object.objectCount;
            } else {
                ++count;
            }
        }
        return count;
    },
});

/**
 * Adds an object to this orbit. Returns true on success or false if object wouldn't fit in the orbit.
 *
 * @method addObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to add to the orbit.
 * @param {Boolean=} skipPositionCalculation - If set to true the added objects do not re-calculate their positions.
 * @returns {boolean} True on success or false if the new object wouldn't fit in the orbit.
 */
Orbit.prototype.addObject = function (object, skipPositionCalculation) {
    var objects = this.mObjects;
    var innerRadius = this.mInnerRadius;
    var objectRadius = object.radius;

    /* if there are no objects added to the orbit, just add the new one */
    if (!objects.length) {
        this.mOuterRadiusOffset = objectRadius * (innerRadius ? 2 : 1);
        this.mFilledAngle = this.calculateObjectAngle(objectRadius, this.centerRadius);
        this._wrapAndAddObject(object, this.mFilledAngle);
        if (!skipPositionCalculation && innerRadius > 0) {
            this._positionObjects();
        }
        return true;
    } else if (innerRadius !== 0) {
        var filledAngle = this.mFilledAngle;
        var radiusOffset = this.mOuterRadiusOffset;
        var halfRadiusOffset = radiusOffset * 0.5;
        var objectSize = objectRadius * 2;

        /* if the new object radius is higher than the orbit's radius offset, recalculate the filled angle */
        if (objectSize > radiusOffset) {
            var PI2 = Math.PI * 2;
            filledAngle *= (PI2 * (innerRadius + halfRadiusOffset)) / (PI2 * (innerRadius + (objectRadius)));
            radiusOffset = objectSize;
            halfRadiusOffset = objectRadius;
        }

        /* calculate if the new object would fit in the orbit */
        var objectAngle = this.calculateObjectAngle(objectRadius, innerRadius + halfRadiusOffset);
        if ((filledAngle + objectAngle) <= (Math.PI * 2)) {
            /* add the new object to the orbit */
            this._wrapAndAddObject(object, objectAngle);

            /* if the radiusOffset is different than the previously defined one, update the angles of all the objects */
            if (this.mOuterRadiusOffset !== radiusOffset) {
                this._recalculateFilledAngle(innerRadius + halfRadiusOffset);
                this.mOuterRadiusOffset = radiusOffset;
            } else {
                /* just add the new object angle to the filled angle count */
                this.mFilledAngle += objectAngle;
            }

            if (!skipPositionCalculation) {
                this._positionObjects();
            }

            return true;
        }
    }

    return false;
};

/**
 * If the object exists in this orbit is removed. Return true if the object was removed successfully, false otherwise.
 *
 * @method removeObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to remove.
 * @returns {boolean}
 */
Orbit.prototype.removeObject = function (object) {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var unwrappedObject = objects[i].object;
        if (unwrappedObject === object) {
            unwrappedObject.remove();
            unwrappedObject.mParent = null;
            objects.splice(i, 1);
            return true;
        } else if (unwrappedObject.removeObject && unwrappedObject.removeObject(object)) {
            return true;
        }
    }

    return false;
};

/**
 * Removes all objects from the orbit and its sub orbits.
 *
 * @method removeAllObjects
 */
Orbit.prototype.removeAllObjects = function () {
    var objects = this.mObjects;
    while (objects.length) {
        var unwrappedObject = objects.pop().object;
        if (unwrappedObject.removeAllObjects) {
            unwrappedObject.removeAllObjects();
        }
        unwrappedObject.remove();
        unwrappedObject.mParent = null;
    }
};

/**
 * Checks if this orbit or any of its sub-objects contain the specified `object`.
 *
 * @method containsObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to look for.
 * @returns {boolean}
 */
Orbit.prototype.containsObject = function (object) {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var unwrappedObject = objects[i].object;
        if (unwrappedObject === object || (unwrappedObject.containsObject && unwrappedObject.containsObject(object))) {
            return true;
        }
    }

    return false;
};

/**
 * Iterates through all the objects and its sub-objects in this orbit and calls the callback with each object as
 * its sole argument.
 *
 * @method forEach
 * @param {Function} callback - The function to call for every object.
 */
Orbit.prototype.forEach = function (callback) {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var object = objects[i].object;
        if (object.forEach) {
            object.forEach(callback);
        }
        /* eslint-disable */
        callback(object);
        /* eslint-enable */
    }
};

/**
 * Calculates the angle that a given object would take to fit in an orbit of the given radius.
 *
 * @method calculateObjectAngle
 * @param { Number } objectRadius - The radius of the object for which to calculate the angle.
 * @param { Number } centerRadius - Center radius of the orbit.
 * @returns {number}
 */
Orbit.prototype.calculateObjectAngle = function (objectRadius, centerRadius) {
    if (objectRadius > centerRadius) {
        return Math.PI * 2;
    }
    return Math.asin(objectRadius / centerRadius) * 2;
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
Orbit.prototype.invalidate = function () {
    var objects = this.mObjects;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var object = objects[i].object;
        if (typeof object.invalidate === 'function') {
            object.invalidate();
        }
    }
};

/**
 * Wraps the passed object, adds it to the internal data and appends it to the orbit.
 *
 * @method _wrapAndAddObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to be added to the orbit.
 * @param {Number} objectAngle - Number representing how bit of an angle will be taken up by the object.
 * @private
 */
Orbit.prototype._wrapAndAddObject = function (object, objectAngle) {
    this.mObjects.push({
        object: object,
        angle: objectAngle,
    });
    this.append(object);
    object.mParent = this;
};

/**
 * Recalculates the filled angle of this orbit and the angle all objects take up within it.
 *
 * @method _recalculateFilledAngle
 * @param {Number} centerRadius - The center radius of the orbit, used to calculate the new filled angle
 * @private
 */
Orbit.prototype._recalculateFilledAngle = function (centerRadius) {
    var objects = this.mObjects;
    var filledAngle = 0;
    for (var i = 0, n = objects.length; i < n; ++i) {
        var addedObject = objects[i];
        var addedObjectRadius = addedObject.object.radius;
        addedObject.angle = this.calculateObjectAngle(addedObjectRadius, centerRadius);
        filledAngle += addedObject.angle;
    }
    this.mFilledAngle = filledAngle;
};

/**
 * Internal function to position the objects contained in this orbit.
 *
 * @method _positionObjects
 * @param {Boolean=} animated - If this flag is set to true, the objects will have their change to a new position animated.
 * @private
 */
Orbit.prototype._positionObjects = function (animated) {
    if (this.mInnerRadius === 0) {
        /* there should always be one object when the radius is 0 */
        var object = this.mObjects[0].object;
        if (animated && object.animatePosition) {
            if (object.position.x !== 0 || object.position.y !== 0) {
                object.animatePosition(object.position, new Point2D(0, 0), 500, mina.backout);
            }
        }
    } else {
        var objects = this.mObjects;
        var objectsLength = objects.length;
        var currentAngle = this.mAngleOffset;
        var step = 0;
        var orbitCenterRadius = this.centerRadius;
        var lastPersonaIndex = objectsLength - 1;
        if (this.mDistributeEvenly) {
            step = ((Math.PI * 2) - this.mFilledAngle) / objectsLength;
        } else {
            currentAngle -= (this.mFilledAngle * 0.5) - (objects[0].angle * 0.5);
        }

        for (var i = 0; i < objectsLength; ++i) {
            var objectNode = objects[i];
            var x = Math.cos(currentAngle) * orbitCenterRadius;
            var y = Math.sin(currentAngle) * orbitCenterRadius;
            if (animated && objectNode.object.animatePosition) {
                var position = objectNode.object.position;
                if (x !== position.x || y !== position.y) {
                    var newPosition = new Point2D(x, y);
                    objectNode.object.animatePosition(position, newPosition, 500, mina.backout);
                }
            } else {
                objectNode.object.position.set(x, y);
            }
            if (i < lastPersonaIndex) {
                currentAngle += step + (objectNode.angle * 0.5) + (objects[i + 1].angle * 0.5);
            }
        }
    }
};

/**
 * @export
 * @type {Orbit}
 */
module.exports = Orbit;

},{"./personas.core.node.js":8,"./personas.core.point2d.js":10}],17:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Node = require('./personas.core.node.js');
var LayoutSystem = require('./personas.layout.layoutSystem.js');
var Orbit = require('./personas.layout.orbit.js');

/**
 * An orbit system can create and hold many orbits stacking them around the smaller orbit.
 *
 * @class OrbitSystem
 * @param {Number=} orbitPadding - The number of pixels to add as padding between orbits.
 * @constructor
 */
function OrbitSystem(orbitPadding) {
    /* inheritance */
    LayoutSystem.call(this);

    /* member variables */
    this.mPadding = (orbitPadding || 0);
    this.mOrbits = [];

    /* DEBIGGING */
    this.mDrawInnerOrbits = false;
    this.mDrawCenterOrbits = false;
    this.mDrawOuterOrbits = false;
    this.mInnerOrbits = [];
    this.mCenterOrbits = [];
    this.mOuterOrbits = [];
    this.mInnerOrbitsGroup = new Node();
    this.mCenterOrbitsGroup = new Node();
    this.mOuterOrbitsGroup = new Node();
    this.append(this.mInnerOrbitsGroup);
    this.append(this.mCenterOrbitsGroup);
    this.append(this.mOuterOrbitsGroup);

    /* initialization */
    var orbit = new Orbit();
    this.mOrbits.push(orbit);
    this.append(orbit);
    orbit.mParent = this;
}

/* inheritance */
OrbitSystem.prototype = Object.create(LayoutSystem.prototype);
OrbitSystem.prototype.constructor = OrbitSystem;

/**
 * Return the current radius of this system.
 *
 * @property radius
 * @type { Number }
 * @readonly
 */
Object.defineProperty(OrbitSystem.prototype, 'radius', {
    get: function () {
        return this.mOrbits[this.mOrbits.length - 1].radius;
    },
});

/**
 * The padding that should be added between orbits.
 *
 * @property orbitPadding
 * @type {Number}
 */
Object.defineProperty(OrbitSystem.prototype, 'orbitPadding', {
    get: function () {
        return this.mPadding;
    },

    set: function (val) {
        if (val !== this.mPadding) {
            this.mPadding = val;
            for (var i = 1, n = this.mOrbits.length; i < n; ++i) {
                this.mOrbits[i].innerRadius = this.mOrbits[i - 1].radius + val;
            }
        }
    },
});

/**
 * Returns the total count of objects in this system.
 *
 * @property objectCount
 * @type {Number}
 * @readonly
 */
Object.defineProperty(OrbitSystem.prototype, 'objectCount', {
    get: function () {
        var orbits = this.mOrbits;
        var count = 0;
        for (var i = 0, n = orbits.length; i < n; ++i) {
            var orbit = orbits[i];
            count += orbit.objectCount;
        }
        return count;
    },
});

/**
 * DEBUG: Property to define if inner orbits should be drawn.
 *
 * @property drawInnerOrbits
 * @type {Boolean}
 * @debug
 */
Object.defineProperty(OrbitSystem.prototype, 'drawInnerOrbits', {
    get: function () {
        return this.mDrawInnerOrbits;
    },

    set: function (val) {
        if (val !== this.mDrawInnerOrbits) {
            this.mDrawInnerOrbits = val;
            if (!val) {
                this._removeDrawnOrbits(this.mInnerOrbits);
            } else {
                this._drawOrbits('innerRadius', this.mInnerOrbitsGroup, this.mInnerOrbits, '#FF0000');
            }
        }
    },
});

/**
 * DEBUG: Property to define if center orbits should be drawn.
 *
 * @property drawCenterOrbits
 * @type {Boolean}
 * @debug
 */
Object.defineProperty(OrbitSystem.prototype, 'drawCenterOrbits', {
    get: function () {
        return this.mDrawCenterOrbits;
    },

    set: function (val) {
        if (val !== this.mDrawCenterOrbits) {
            this.mDrawCenterOrbits = val;
            if (!val) {
                this._removeDrawnOrbits(this.mCenterOrbits);
            } else {
                this._drawOrbits('centerRadius', this.mCenterOrbitsGroup, this.mCenterOrbits, '#00FF00');
            }
        }
    },
});

/**
 * DEBUG: Property to define if outer orbits should be drawn.
 *
 * @property drawOuterOrbits
 * @type {Boolean}
 * @debug
 */
Object.defineProperty(OrbitSystem.prototype, 'drawOuterOrbits', {
    get: function () {
        return this.mDrawOuterOrbits;
    },

    set: function (val) {
        if (val !== this.mDrawOuterOrbits) {
            this.mDrawOuterOrbits = val;
            if (!val) {
                this._removeDrawnOrbits(this.mOuterOrbits);
            } else {
                this._drawOrbits('radius', this.mOuterOrbitsGroup, this.mOuterOrbits, '#0000FF');
            }
        }
    },
});

/**
 * Adds an object to this system. If the object wouldn't fit in the outmost orbit a new orbit is created and added to the system.
 *
 * @method addObject
 * @param {Object} object - The object to be added to the system
 * @param {Boolean=} skipPositionCalculation - If set to true the added objects do not re-calculate their positions.
 */
OrbitSystem.prototype.addObject = function (object, skipPositionCalculation) {
    var orbits = this.mOrbits;
    var orbit = orbits[orbits.length - 1];
    while (!orbit.addObject(object, skipPositionCalculation)) {
        orbit = new Orbit(orbit.radius + this.mPadding);
        orbits.push(orbit);
        this.append(orbit);
        orbit.mParent = this;
    }

    if (this.drawInnerOrbits) {
        this.drawInnerOrbits = false;
        this.drawInnerOrbits = true;
    }

    if (this.drawCenterOrbits) {
        this.drawCenterOrbits = false;
        this.drawCenterOrbits = true;
    }

    if (this.drawOuterOrbits) {
        this.drawOuterOrbits = false;
        this.drawOuterOrbits = true;
    }
};

/**
 * If the object exists in this orbit system, it is removed. Return true if the object was removed successfully, false otherwise.
 *
 * @method removeObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to remove.
 * @returns {boolean}
 */
OrbitSystem.prototype.removeObject = function (object) {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        if (orbits[i].removeObject(object)) {
            return true;
        }
    }

    return false;
};

/**
 * Removes all objects from the orbit system.
 *
 * @method removeAllObjects
 */
OrbitSystem.prototype.removeAllObjects = function () {
    var orbits = this.mOrbits;
    var orbit = null;
    while (orbits.length) {
        orbit = orbits.pop();
        orbit.removeAllObjects();
        orbit.remove();
    }

    /* create a new orbit that will be the center orbit */
    orbit = new Orbit();
    this.mOrbits.push(orbit);
    this.append(orbit);
    orbit.mParent = this;
};

/**
 * Checks if this system contains the specified `object`.
 *
 * @method containsObject
 * @param {Persona|Orbit|OrbitSystem} object - The object to look for.
 * @returns {boolean}
 */
OrbitSystem.prototype.containsObject = function (object) {
    var ret = false;
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        ret = orbits[i].containsObject(object);
        if (ret) {
            break;
        }
    }

    return ret;
};

/**
 * Iterates through all the objects in this orbit system recursively and calls the callback with each object as
 * its sole argument.
 *
 * @method forEach
 * @param {Function} callback - The function to call for every object.
 */
OrbitSystem.prototype.forEach = function (callback) {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        orbits[i].forEach(callback);
    }
};

/**
 * Goes through all the objects in this system and moves them to their most updated position.
 *
 * @method positionObjects
 * @param {Boolean=} animated - Should the objects be animated to their new position.
 */
OrbitSystem.prototype.positionObjects = function(animated) {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        orbits[i]._positionObjects(animated || false);
    }
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
OrbitSystem.prototype.invalidate = function () {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        orbits[i].invalidate();
    }
};

/**
 * DEBUG: Utility function to draw all the orbits using the specified property,
 *
 * @param {String} property - The property name of the orbit to use as a radius.
 * @param {Node} group - A node to draw the orbits.
 * @param {Array} array - An array where the drawn orbits will be saved.
 * @param {String} color - The color for the orbits.
 * @private
 * @debug
 */
OrbitSystem.prototype._drawOrbits = function (property, group, array, color) {
    var orbits = this.mOrbits;
    for (var i = 0, n = orbits.length; i < n; ++i) {
        this._drawOrbit(orbits[i][property], group, array, color);
    }
};

/**
 * DEBUG: Utility function to draw a single orbit with the specified radius.
 *
 * @param {Number} radius - The radius of the orbit to draw.
 * @param {Node} group - A node to draw the orbit.
 * @param {Array} array - An array where the drawn orbit will be saved.
 * @param {String} color - The color for the orbit.
 * @private
 * @debug
 */
OrbitSystem.prototype._drawOrbit = function (radius, group, array, color) {
    var circle = group.circle(0, 0, radius);

    circle.attr({
        'fill': 'transparent',
        'stroke': color,
        'stroke-width': 2,
    });

    array.push(circle);
};

/**
 * DEBUG: Utility function to removed all drawn orbits contained in the passed array.
 *
 * @param {Array} array - An array containing the orbits to remove.
 * @private
 * @debug
 */
OrbitSystem.prototype._removeDrawnOrbits = function (array) {
    for (var i = 0, n = array.length; i < n; ++i) {
        array[i].remove();
    }
    array.length = 0;
};

/**
 * @export
 * @type {OrbitSystem}
 */
module.exports = OrbitSystem;

},{"./personas.core.node.js":8,"./personas.layout.layoutSystem.js":15,"./personas.layout.orbit.js":16}],18:[function(require,module,exports){
(function (global){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */
var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var Node = require('./personas.core.node');
var Events = require('./personas.defaults').Persona.events;
var Point2D = require('./personas.core.point2d');
/**
 * Class that represents a viewport where personas will be created.
 *
 * @class Viewport
 * @param {Snap.paper} paper - The paper where this viewport will be created.
 * @param {Object} globalConfig - Global configuration object.
 * @param {Number=} minZoomScale - The minimum scale this viewport will zoom to.
 * @param {Number=} maxZoomScale - The maximum scale this viewport will zoom to.
 * @constructor
 */
function Viewport(paper, globalConfig, minZoomScale, maxZoomScale) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mConfig = globalConfig;
    this.mMinScale = minZoomScale || 0.5;
    this.mMaxScale = maxZoomScale || 2.0;
    this.mWheelZoomStep = 0.05;
    this.mPaper = paper;
    this.mCanDrag = false;
    this.mDragging = false;
    this.mMutationObserver = null;
    this.mEventCenter = globalConfig.eventCenter;

    this.mHandleClickBound = this.handleClick.bind(this);
    this.mHandleWheelBound = this.handleWheel.bind(this);
    this.mHandlePinchBound = this.handlePinch.bind(this);
    this.mHandleMouseLeaveBound = this.handleMouseLeave.bind(this);

    /* initialization */
    this.m$Paper = $(this.mPaper.node);
    this._updateMeasurements();
    /* initialize current zoom level */
    var matrix = this.transform().localMatrix;
    this.mCurrentZoom = Math.sqrt((matrix.a * matrix.a) + (matrix.c * matrix.c));
    this.registerEvents();
}

/* inheritance */
Viewport.prototype = Object.create(Node.prototype);
Viewport.prototype.constructor = Viewport;

/**
 * Returns the minimum scale that this viewport can be set to.
 *
 * @property minZoomScale
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Viewport.prototype, 'minZoomScale', {
    get: function() {
        return this.mMinScale;
    },
});

/**
 * Returns the maximum scale that this viewport can be set to.
 *
 * @property maxZoomScale
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Viewport.prototype, 'maxZoomScale', {
    get: function() {
        return this.mMaxScale;
    },
});

/**
 * Returns a `Point2D` instance that represents the static center of this viewport.
 *
 * @property center
 * @type {Point2D}
 * @readonly
 */
Object.defineProperty(Viewport.prototype, 'center', {
    get: function() {
        var $svg = $(this.mPaper.node);
        return new Point2D($svg.width() * 0.5, $svg.height() * 0.5);
    },
});

/**
 * Property to keep track of the zoom amount aplied to this viewport.
 *
 * @property zoomAmount
 * @type {number}
 */
Object.defineProperty(Viewport.prototype, 'zoomAmount', {
    get: function() {
        return this.mCurrentZoom;
    },
    set: function(amount) {
        this.mCurrentZoom = amount;
    },
});

/**
 * Registers the events this instance should listen to.
 *
 * @method registerEvents
 */
Viewport.prototype.registerEvents = function() {
    /* click */
    this.mPaper.click(this.mHandleClickBound);

    /* wheel (zoom) */
    this.mPaper.node.addEventListener('wheel', this.mHandleWheelBound);

    /* pinch (zoom) */
    this.mPaper.pinch(this.mHandlePinchBound);

    /* panning */
    var matrix = null;
    var startX = 0;
    var startY = 0;
    var currentX = 0;
    var currentY = 0;
    this.mCanDrag = false;
    this.mPaper.drag(
        function(dx, dy) { // drag moved
            if (this.mCanDrag) {
                currentX = startX + dx;
                currentY = startY + dy;
                matrix.e = currentX;
                matrix.f = currentY;
                this.transform(matrix);
                this.mDragging = true;
            }
        }.bind(this),
        function() { // drag started
            if (!arguments[2] || arguments[2].button === 0) {
                this.mCanDrag = true;
                matrix = this.transform().localMatrix.clone();
                startX = matrix.e;
                startY = matrix.f;
            }
        }.bind(this),
        function(event) { // drag end
            this.mCanDrag = false;
            if (!event || event.button === 0) {
                setTimeout(function () {
                    this.mDragging = false;
                }.bind(this), 0);
            }
        }.bind(this)
    );

    this.mPaper.node.addEventListener('mouseleave', this.mHandleMouseLeaveBound);

    this.mPaper.mousedown(this.handleMouseDown);

    if (typeof MutationObserver !== 'undefined') {
        /* eslint-disable */
        /* This is a horrible hack to fix edge SVG rendering issues */
        /* TODO: Remove once edge fixes its renderer. */
        /* eslint-enable */
        var timeout = null;
        this.mMutationObserver = new MutationObserver(function () {
            if ('msAnimationDelay' in document.body.style) {
                if (timeout !== null) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(function () {
                    this.remove();
                    this.mPaper.prepend(this);
                    timeout = null;
                }.bind(this), 50);
            } else {
                this.remove();
                this.mPaper.prepend(this);
            }
        }.bind(this));
        this.mMutationObserver.observe(this.node, {attributes: true});
    }
};

/**
 * Unregisters all the events registered in the `registerEvents` function.
 *
 * @method unregisterEvents
 */
Viewport.prototype.unregisterEvents = function() {
    this.mPaper.unclick(this.mHandleClickBound);
    this.mPaper.unpinch(this.mHandlePinchBound);
    this.mPaper.unmousedown(this.handleMouseDown);
    this.mPaper.undrag();

    this.mPaper.node.removeEventListener('wheel', this.mHandleWheelBound);
    this.mPaper.node.removeEventListener('mouseleave', this.mHandleMouseLeaveBound);

    if (this.mMutationObserver) {
        this.mMutationObserver.disconnect();
        this.mMutationObserver = null;
    }
};

/**
 * Zooms this viewport by the desired amount using the origin as the center point for the zoom.
 * NOTE: This method respects the maximum and minimum zoom levels configured in the constructor.
 *
 * @method zoom
 * @param {number} amount - The scale to apply where 1 means 100%
 * @param {Point2D} origin - The origin point of the zoom
 * @param {boolean=} animated - Should the zoom be animated
 * @param {boolean=} useActualAmout - If true, will zoom to amount, otherwise zooms to current scale plus amount
 */
Viewport.prototype.zoom = function(amount, origin, animated, useActualAmout) {
    /* get the local matrix and current scale of the viewport */
    var matrix = this.transform().localMatrix;
    var scale = Math.sqrt((matrix.a * matrix.a) + (matrix.c * matrix.c));

    /* create a mew matrix to perform the transformations on */
    var newMatrix = Snap.matrix();

    /* calculate mouse coordinates within the original viewport */
    var localX = (origin.x - matrix.e) / scale;
    var localY = (origin.y - matrix.f) / scale;

    /* new scale to be zoomed to */
    var newScale;
    if (useActualAmout) {
        newScale = amount;
    } else {
        newScale = scale + amount;
    }

    if (newScale > this.mMaxScale) {
        newScale = this.mMaxScale;
    } else if (newScale < this.mMinScale) {
        newScale = this.mMinScale;
    }

    if (newScale === scale) {
        return;
    }

    /* persist the current zoom level */
    this.mCurrentZoom = newScale;

    /* transform the matrix */
    newMatrix.translate(origin.x, origin.y);
    newMatrix.scale(newScale);
    newMatrix.translate(-localX, -localY);

    /* apply the matrix */
    if (animated) {
        this.stop();
        this.animate({ transform: newMatrix }, 150);
    } else {
        this.transform(newMatrix.toString());
    }

    /* publish that there was a zoom update from user interaction for any handlers hooked in */
    this.mEventCenter.publish(Events.zoomUpdateFromUser, this.mCurrentZoom);
};

/**
 * Function to handle a mouse click on the persona.
 *
 * @method handleClick
 * @param {Event} event - The event that triggered this interaction.
 */
Viewport.prototype.handleClick = function(event) {
    if (!this.mDragging) {
        if (typeof this.mConfig.hooks.onClickEmptySpace === 'function') {
            this.mConfig.hooks.onClickEmptySpace(event);
        } else {
            this.mEventCenter.publish(Events.deselectAll);
        }
    }
};

/**
 * Function to handle the mouse wheel event.
 *
 * @method handleWheel
 * @param {Event} event - The event that triggered this interaction.
 */
Viewport.prototype.handleWheel = function(event) {
    if (event.deltaY !== 0) {
        event.preventDefault();

        this._updateMeasurements();

        var delta = event.deltaY > 0 ? 1 : -1;

        /* calculate the zoom step to perform */
        var localStep = (this.mWheelZoomStep * delta);

        /* calculate the mouse coordinates relative to the container */
        var mouseX = (event.pageX - this.mSvgOffsetX) / this.mSvgScaleX;
        var mouseY = (event.pageY - this.mSvgOffsetY) / this.mSvgScaleY;

        /* perform the zoom */
        this.zoom(-localStep, new Point2D(mouseX, mouseY));
    }
};

/**
 * Function to handle the pinch event.
 *
 * @method handlePinch
 * @param {Object} origin - The origin point in page coordinates where the gesture originated.
 * @param {number} distanceDelta -
 */
Viewport.prototype.handlePinch = function(origin, distanceDelta) {
    var size = this._.bboxwt;
    var zoom = distanceDelta / ((size.width + size.height) * 0.125);
    this._updateMeasurements();
    this.zoom(zoom, new Point2D((origin.x - this.mSvgOffsetX) / this.mSvgScaleX,
                                (origin.y - this.mSvgOffsetY) / this.mSvgScaleY));
};

/**
 * Function to handle the mouse leave event.
 *
 * @method handleMouseLeave
 */
Viewport.prototype.handleMouseLeave = function() {
    this.mCanDrag = false;
    this.mDragging = false;
};

/**
 * Function to handle the mouse down event.
 *
 * @method handleMouseDown
 * @param {Event} event - The event that triggered this interaction.
 */
Viewport.prototype.handleMouseDown = function(event) {
    event.preventDefault();
    event.stopPropagation();
};

/**
 * Function to update the internal state of the viewport measures.
 *
 * @method _updateMeasurements
 * @private
 */
Viewport.prototype._updateMeasurements = function() {
    var paperBox = this.mPaper.node.getBoundingClientRect();
    this.mSvgOffsetX = this.m$Paper.offset().left;
    this.mSvgOffsetY = this.m$Paper.offset().top;
    this.mSvgScaleX = paperBox.width / this.m$Paper.width();
    this.mSvgScaleY = paperBox.height / this.m$Paper.height();
};


/**
 * @export
 * @type {Viewport}
 */
module.exports = Viewport;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./personas.core.node":8,"./personas.core.point2d":10,"./personas.defaults":12}],19:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Node = require('./personas.core.node');

/**
 * Simple class that creates and handles graphical zoom controls.
 *
 * @class ZoomControls
 * @param {Object} globalConfig - Global configuration object.
 * @param {Function=} zoomIn - A callback to be called when the user clicks the zoom in button.
 * @param {Function=} zoomOut - A callback to be called when the user clicks the zoom out button.
 * @param {Function=} home - A callback to be called when the user clicks the home button.
 * @constructor
 */
function ZoomControls(globalConfig, zoomIn, zoomOut, home) {
    /* inheritance */
    Node.apply(this);

    /* member variables */
    this.mConfig = globalConfig.Persona;
    this.mButtonSide = 24;
    this.mHalfButtonSide = this.mButtonSide * 0.5;
    this.mSymbolsOffset = 5;
    this.mZoomInCallback = zoomIn;
    this.mZoomOutCallback = zoomOut;
    this.mHomeCallback = home;
    this.$node = $(this.node);

    /* initialization */
    this.addClass(this.mConfig.classes.zoomcontrols);

    /* create the background */
    this.mBackground = new Node('rect');
    this.mBackground.attr({
        x: 0,
        y: 0,
        width: this.mButtonSide,
        height: this.mButtonSide * 3,
    });
    this.append(this.mBackground);

    /* dividers */
    this.mDivider01 = new Node('line', {
        'x1': 0,
        'y1': this.mButtonSide,
        'x2': this.mButtonSide,
        'y2': this.mButtonSide,
    });
    this.append(this.mDivider01);

    this.mDivider02 = new Node('line', {
        'x1': 0,
        'y1': this.mButtonSide * 2,
        'x2': this.mButtonSide,
        'y2': this.mButtonSide * 2,
    });
    this.append(this.mDivider02);

    /* plus */
    this.mPlus = new Node('text', {x: this.mHalfButtonSide, y: this.mHalfButtonSide + this.mSymbolsOffset});
    this.mPlus.attr({
        'text': '\uf067',
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mPlus.addClass(this.mConfig.classes.zoomcontrolslabel);
    this.mPlus.addClass(this.mConfig.classes.unselectable);
    this.append(this.mPlus);

    /* collapse */
    this.mFit = new Node('text', {x: this.mHalfButtonSide, y: this.mButtonSide + this.mHalfButtonSide + this.mSymbolsOffset});
    this.mFit.attr({
        'text': '\uf066',
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mFit.addClass(this.mConfig.classes.zoomcontrolslabel);
    this.mFit.addClass(this.mConfig.classes.unselectable);
    this.append(this.mFit);

    /* minus */
    this.mMinus = new Node('text', {x: this.mHalfButtonSide, y: (this.mButtonSide * 2) + this.mHalfButtonSide + this.mSymbolsOffset});
    this.mMinus.attr({
        'text': '\uf068',
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mMinus.addClass(this.mConfig.classes.zoomcontrolslabel);
    this.mMinus.addClass(this.mConfig.classes.unselectable);
    this.append(this.mMinus);

    /* finally, register the events */
    this.registerEvents();
}

/**
 * @inheritance
 * @type {Node}
 */
ZoomControls.prototype = Object.create(Node.prototype);
ZoomControls.prototype.constructor = ZoomControls;

/**
 * Returns the width of this object.
 *
 * @property width
 * @type {Number}
 * @readonly
 */
Object.defineProperty(ZoomControls.prototype, 'width', {
    get: function () {
        return this.mButtonSide;
    },
});

/**
 * Returns the height of this object.
 *
 * @property height
 * @type {Number}
 * @readonly
 */
Object.defineProperty(ZoomControls.prototype, 'height', {
    get: function () {
        return this.mButtonSide * 3;
    },
});

/**
 * Registers this object to listen for the events that it needs to function.
 *
 * @method registerEvents
 */
ZoomControls.prototype.registerEvents = function() {
    /* click */
    this.mBackground.click(this.handleClick.bind(this));
};

/**
 * Unregisters all the events registered in the `registerEvents` function.
 *
 * @method unregisterEvents
 */
ZoomControls.prototype.unregisterEvents = function() {
    this.mBackground.unclick();
};

/**
 * Function to handle a mouse click.
 *
 * @method handleClick
 * @param {MouseEvent} event - The event that was triggered.
 * @param {number} x - The x coordinate of the event.
 * @param {number} y - The y coordinate of the event.
 */
ZoomControls.prototype.handleClick = function (event, x, y) {
    if (event) {
        event.stopPropagation();
    }

    var localY = y - this.$node.offset().top;
    var size = this.$node[0].getBoundingClientRect();
    var buttonHeight = size.height / 3;

    if (localY <= buttonHeight) {
        // plus
        if (this.mZoomInCallback) {
            this.mZoomInCallback();
        }
    } else if (localY <= buttonHeight * 2) {
        // home
        if (this.mHomeCallback) {
            this.mHomeCallback();
        }
    } else {
        // minus
        if (this.mZoomOutCallback) {
            this.mZoomOutCallback();
        }
    }
};

/**
 * @export
 * @type {ZoomControls}
 */
module.exports = ZoomControls;

},{"./personas.core.node":8}],20:[function(require,module,exports){
(function (global){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var Snap = require('snapsvg');
var Node = require('./personas.core.node.js');
var $ = (typeof window !== "undefined" ? window['$'] : typeof global !== "undefined" ? global['$'] : null);
var Promise = require('bluebird');

/**
 * This class represents the background image used as an "avatar" for personas.
 *
 * @class Avatar
 * @param {Array|String} imageURLs - The URLs of the images to load as the avatar, it can be any number of images from 1 to 4.
 * @param {Number} radius - The radius for this avatar.
 * @param {String=} color - The color to use for the background in CSS style notation.
 * @param {Boolean=} forceGreyscale - Should the background color always be converted to greyscale.
 * @constructor
 */
function Avatar(imageURLs, radius, color, forceGreyscale) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mRadius = radius;
    this.mFilter = null;
    this.mImages = null;
    this.mBlurEnabled = true;
    this.mImageURLs = [];
    this.mBlurStrength = 5;
    this.mImageRadius = 0;

    /* initialization */
    var backgroundColor;
    if (!color) {
        backgroundColor = '#333';
    } else if (forceGreyscale === undefined || forceGreyscale) {
        var color32bit = parseInt(color.substr(1), 16);
        var r = (color32bit >> 16) & 255;
        var g = (color32bit >> 8) & 255;
        var b = color32bit & 255;

        var gray8bit = Math.floor(((r + g + b) / 3) * 0.7);
        var grayHex = gray8bit.toString(16);

        backgroundColor = '#' + grayHex + grayHex + grayHex;
    } else {
        backgroundColor = color;
    }
    this.mBackground = new Node('circle', { 'cx': 0, 'cy': 0, 'r': radius });
    this.mBackground.attr({ 'fill': backgroundColor, 'stroke': '#fff', 'stroke-width': 3 });
    this.append(this.mBackground);

    /* populate the URLs array */
    if (imageURLs instanceof Array) {
        Array.prototype.push.apply(this.mImageURLs, imageURLs);
    } else {
        this.mImageURLs.push(imageURLs);
    }

    /* images container */
    this.mContainer = new Node();
    this.mContainer.addClass('prsnas_nopointer');
    this.append(this.mContainer);

    /* blur filter */
    var blurStrength = this.mBlurStrength;
    var blur = Snap.parse(Snap.filter.blur(blurStrength, blurStrength));
    blur.node.firstChild.setAttribute('color-interpolation-filters', 'sRGB'); // safari fix
    var filter = new Node('filter');
    filter.append(blur);
    this.mContainer.append(filter);
    this.mContainer.attr({filter: filter});
    this.mFilter = filter;

    /* mask */
    this.mMask = new Node('circle', { 'cx': 0, 'cy': 0, 'r': radius });
    this.mMask.attr('fill', '#fff');
    this.mContainer.attr({ mask: this.mMask });

    /* load the images */
    var imageRadius = radius + (blurStrength * 2); // consider the blur to avoid displaying semi-transparent edges
    this.mImageRadius = imageRadius;
    this.mContainer.attr({ display: 'none' });
    this.loadImages(this.mContainer, imageRadius, imageURLs).then(function (loadedImages) {
        this.mImages = loadedImages;
        this.mContainer.attr({ display: 'block' });
    }.bind(this));
}

/* inheritance */
Avatar.prototype = Object.create(Node.prototype);
Avatar.prototype.constructor = Avatar;

/**
 * Enables or disables the blur effect of this avatar.
 *
 * @property blurEnabled
 * @type {Boolean}
 */
Object.defineProperty(Avatar.prototype, 'blurEnabled', {
    get: function() {
        return this.mBlurEnabled;
    },

    set: function(val) {
        if (val !== this.mBlurEnabled) {
            this.mBlurEnabled = val;
            this.mContainer.attr({ filter: (val ? this.mFilter : null) });
        }
    },
});

/**
 * Returns an array containing the Snap.svg representations of the images loaded by this avatar.
 *
 * @property images
 * @type {Array}
 * @readonly
 */
Object.defineProperty(Avatar.prototype, 'images', {
    get: function () {
        return this.mImages;
    },
});

/**
 * Returns an array containing the URLs of the images loaded by this avatar.
 *
 * @property imageURLs
 * @type {Array}
 * @readonly
 */
Object.defineProperty(Avatar.prototype, 'imageURLs', {
    get: function () {
        return this.mImageURLs;
    },
});

/**
 * The radius of this avatar.
 *
 * @property radius
 * @type {Number}
 */
Object.defineProperty(Avatar.prototype, 'radius', {
    get: function () {
        return this.mRadius;
    },

    set: function (value) {
        this.setRadius(value, false);
    },
});

/**
 * The radius of the images in this avatar.
 *
 * @property radius
 * @type {Number}
 * @readonly
 */
Object.defineProperty(Avatar.prototype, 'imageRadius', {
    get: function () {
        return this.mImageRadius;
    },
});

/**
 * Returns the SVG group that contains the images in this avatar.
 *
 * @property imageContainer
 * @type {Element}
 * @readonly
 */
Object.defineProperty(Avatar.prototype, 'imageContainer', {
    get: function () {
        return this.mContainer;
    },
});

/**
 * Utility function to change the radius. Can be animated.
 *
 * @method setRadius
 * @param {Number} newRadius - The new radius for this persona.
 * @param {Boolean} animated - Should the radius change be animated.
 */
Avatar.prototype.setRadius = function (newRadius, animated) {
    if (newRadius !== this.mRadius) {
        var scale = newRadius / this.mRadius;
        this.mRadius = newRadius;
        this.mImageRadius = this.mRadius + (this.mBlurStrength * 2);

        if (animated) {
            this.mBackground.animate({ r: newRadius }, 500, mina.easeinout);
            this.mMask.animate({ r: newRadius }, 500, mina.easeinout);
        } else {
            this.mBackground.attr({ r: newRadius });
            this.mMask.attr({ r: newRadius });
        }

        var images = this.mImages;
        if (images) {
            for (var i = 0, n = images.length; i < n; ++i) {
                var image = images[i];
                var x = parseFloat(image.attr('x'));
                var y = parseFloat(image.attr('y'));
                var width = parseFloat(image.attr('width'));
                var height = parseFloat(image.attr('height'));
                if (animated) {
                    image.animate({
                        x: x * scale,
                        y: y * scale,
                        width: width * scale,
                        height: height * scale,
                    }, 500, mina.easeinout);
                } else {
                    image.attr({
                        x: x * scale,
                        y: y * scale,
                        width: width * scale,
                        height: height * scale,
                    });
                }
            }
        }
    }
};

/**
 * Preloads the image at the specified URL. Useful to get image attributes before it is loaded in SVG.
 *
 * @method preloadImage
 * @param {String} url - The URL of the image to load.
 * @returns {Promise}
 */
Avatar.prototype.preloadImage = function (url) {
    return new Promise(function(resolve) {
        var img = $('<img />');

        img.on('load', function() {
            resolve(img[0]);
        });

        img.on('error', function() {
            resolve(null);
        });

        img.attr('src', url);
    });
};

/**
 * Loads an image and places it in the container at the specified coordinates while filling the passed `fitWidth` and `fitHeight`
 *
 * @method loadImage
 * @param {Node} container - The container for the loaded image.
 * @param {String} url - The URL of the image to load.
 * @param {Number} x - X coordinate where to place the image within the container.
 * @param {Number} y - Y coordinate where to place the image within the container.
 * @param {Number} fitWidth - The desired width that this image should fit.
 * @param {Number} fitHeight - The desired height that this image should fit.
 * @returns {Promise}
 */
Avatar.prototype.loadImage = function (container, url, x, y, fitWidth, fitHeight) {
    var preloadImageFunc = this.preloadImage;
    return new Promise(function (resolve) {
        preloadImageFunc(url).then(function (img) {
            if (img) {
                var scale = Math.max(fitWidth / img.width, fitHeight / img.height);
                var image = container.image(url, x, y, img.width * scale, img.height * scale);
                resolve(image);
            } else {
                resolve(null);
            }
        });
    });
};

/**
 * Loads all the images passed in the `imageURLs` array and places them in the `container` provided.
 *
 * @method loadImages
 * @param {Node} container - The container where the images will be placed. NOTE: The container is treated as a circle.
 * @param {Number} radius - The radius of the container.
 * @param {Array} imageURLs - An array containing the URLs of the images to load.
 * @returns {Promise}
 */
Avatar.prototype.loadImages = function (container, radius, imageURLs) {
    var urls = [];
    /* make a copy of the array since we are going to be modifying it */
    if (imageURLs instanceof Array) {
        Array.prototype.push.apply(urls, imageURLs);
    } else {
        urls.push(imageURLs);
    }

    var containerSize = radius * 2;
    var url = urls.shift();
    var imagesLoaded = [];
    var loadImageFunc = this.loadImage.bind(this);

    var promiseFunction = function (resolve) {
        loadImageFunc(container, url, -radius, -radius, containerSize, containerSize).then(function(image) {
            if (image) {
                imagesLoaded.push(image);

                var xPosition = -radius;
                var yPosition = radius * 0.4;
                var widthSize = containerSize / (urls.length || 1);
                var heightSize = containerSize * 0.3;

                var expectedSubImages = urls.length;
                var subImages = [];

                var loadSubImage = function () {
                    if (urls.length) {
                        url = urls.shift();
                        loadImageFunc(container, url, xPosition, yPosition, widthSize, heightSize).then(function (img) {
                            if (img) {
                                imagesLoaded.push(img);
                                subImages.push(img);
                                xPosition += widthSize;
                            }
                            loadSubImage();
                        });
                    } else {
                        if (subImages.length && subImages.length !== expectedSubImages) {
                            xPosition = -radius;
                            widthSize = containerSize / subImages.length;
                            heightSize = containerSize * 0.3;
                            for (var i = 0, n = subImages.length; i < n; ++i) {
                                var subImage = subImages[i];
                                var imgWidth = parseInt(subImage.attr('width'), 10);
                                var imgHeight = parseInt(subImage.attr('height'), 10);
                                var scale = Math.max(widthSize / imgWidth, heightSize / imgHeight);
                                subImage.attr({
                                    x: xPosition,
                                    width: imgWidth * scale,
                                    height: imgHeight * scale,
                                });
                                xPosition += widthSize;
                            }
                        }
                        resolve(imagesLoaded);
                    }
                };

                loadSubImage();
            } else {
                if (urls.length) {
                    url = urls.shift();
                    promiseFunction(resolve);
                }
            }
        });
    };

    return new Promise(promiseFunction);
};

/**
 * @export
 * @type {Avatar}
 */
module.exports = Avatar;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./personas.core.node.js":8,"bluebird":1,"snapsvg":4}],21:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var Snap = require('snapsvg');
var Node = require('./personas.core.node.js');
var Promise = require('bluebird');

/**
 * Creates and maintains the circular gauges that represent the different properties in personas.
 *
 * @class Gauge
 * @param {Number} radius - The radius of the gauge.
 * @param {Number} thickness - How thick should the bar be.
 * @param {string} baseColor - The color used for the gauge background (or the empty parts).
 * @param {Object} options - An object containing the configuration options for the persona tat owns this instance.
 * @constructor
 */
function DataGauge(radius, thickness, baseColor, options) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mOptions = options;
    this.mRadius = radius;
    this.mThickness = thickness;
    this.mGaugeRadius = radius - Math.ceil(thickness * 0.5);
    this.mBackground = null;
    this.mCircumference = Math.PI * this.mGaugeRadius * 2;
    this.mBars = {};
    this.mBarsArray = [];
    this.mBarsContainer = new Node();
    this.mBaseColor = baseColor;

    /* initialization */
    var background = new Node('circle', {cx: 0, cy: 0, r: this.mGaugeRadius - 1});
    background.attr({
        'pointer-events': 'none',
        'fill': 'transparent',
        'stroke': baseColor,
        'stroke-width': thickness + 2,
    });
    this.append(background);
    this.mBackground = background;

    /* append the bars container */
    this.append(this.mBarsContainer);

    /* draw the start line */
    var attr = {
        'x1': 0,
        'y1': -radius - thickness,
        'x2': 0,
        'y2': -radius + thickness,
        'stroke': '#283100',
        'stroke-width': 2,
        'pointer-events': 'none',
    };
    this.mStartLine = new Node('line', attr);
    this.append(this.mStartLine);
}

/* inheritance */
DataGauge.prototype = Object.create(Node.prototype);
DataGauge.prototype.constructor = DataGauge;

/**
 * The radius of this gauge.
 *
 * @property radius
 * @type {Number}
 */
Object.defineProperty(DataGauge.prototype, 'radius', {
    get: function () {
        return this.mRadius;
    },

    set: function (value) {
        this.setRadius(value, false);
    },
});

/**
 * The current progress of this gauge (how much of it is filled)
 *
 * @property progress
 * @type {number}
 * @readonly
 */
Object.defineProperty(DataGauge.prototype, 'progress', {
    get: function() {
        return this.progressToBar(-1); // all bars
    },
});

/**
 * Utility function to change the radius. Can be animated.
 *
 * @method setRadius
 * @param {Number} newRadius - The new radius for this persona.
 * @param {Boolean} animated - Should the radius change be animated.
 * @param {Object=} options - [OPTIONAL] If animated, and object can be passed to configure the animation.
 * @returns {Promise}
 */
DataGauge.prototype.setRadius = function (newRadius, animated, options) {
    if (newRadius !== this.mRadius) {
        var promises = [];
        var oldCircumference = this.mCircumference;
        this.mRadius = newRadius;
        this.mGaugeRadius = newRadius - Math.ceil(this.mThickness * 0.5);
        var newCircumference = Math.PI * this.mGaugeRadius * 2;
        var separatorWidth = this.mOptions.config.gaugeSeparatorWidth;

        /* update the bars to the new circumference */
        var circumference = this.mCircumference;
        var bars = this.mBars;

        /* animation options, if any */
        var animationDuration = this.mOptions.config.transitionsDuration;
        var animationEasing = mina.easeinout;
        if (animated && options) {
            animationDuration = (options.duration || animationDuration);
            animationEasing = (options.easing || animationEasing);
        }

        if (animated) {
            // this.animate({ transform: matrix }, time, ease
            promises.push(new Promise(function(resolve) {
                this.mBackground.animate({r: this.mGaugeRadius - 1}, animationDuration, animationEasing, resolve);
            }.bind(this)));

            promises.push(new Promise(function(resolve) {
                this.mStartLine.animate({
                    'y1': -newRadius - this.mThickness,
                    'y2': -newRadius + this.mThickness,
                }, animationDuration, animationEasing, resolve);
            }.bind(this)));
        } else {
            this.mBackground.attr({ r: this.mGaugeRadius - 1 });
            this.mStartLine.attr({
                'y1': -newRadius - this.mThickness,
                'y2': -newRadius + this.mThickness,
            });
            promises.push(Promise.resolve(true));
        }

        var gaugeRadiusFunction = function(barInfo, resolve) {
            barInfo.bar.animate({ r: this.mGaugeRadius }, animationDuration, animationEasing, resolve);
            if (barInfo.separator) {
                barInfo.separator.animate({ r: this.mGaugeRadius }, animationDuration, animationEasing);
            }
        };

        var gaugeBarAnimationFunction = function(barInfo, resolve, value) {
            this.mCircumference = value;
            barInfo.bar.attr({'stroke-dashoffset': (value * 0.25), 'stroke-dasharray': value * barInfo.currentValue + ' ' + value * (1.0 - barInfo.currentValue)});
            if (barInfo.separator) {
                var offset = barInfo.currentValue + (barInfo.currentValue > 0 ? separatorWidth : 0);
                barInfo.separator.attr({'stroke-dashoffset': (value * 0.25), 'stroke-dasharray': value * (barInfo.currentValue + offset) + ' ' + value * (1.0 - (barInfo.currentValue + offset))});
            }
            resolve();
        };

        var gaugeBarsFunction = function(barInfo, resolve) {
            Snap.animate(oldCircumference, newCircumference, gaugeBarAnimationFunction.bind(this, barInfo, resolve), animationDuration, animationEasing);
        };

        for (var key in bars) {
            if (bars.hasOwnProperty(key)) {
                var barInfo = bars[key];
                if (animated) {
                    promises.push(new Promise(gaugeRadiusFunction.bind(this, barInfo)));

                    promises.push(new Promise(gaugeBarsFunction.bind(this, barInfo)));
                } else {
                    this.mCircumference = newCircumference;
                    barInfo.bar.attr({
                        r: this.mGaugeRadius,
                        'stroke-dashoffset': (circumference * 0.25),
                        'stroke-dasharray': circumference * barInfo.currentValue + ' ' + circumference * (1.0 - barInfo.currentValue),
                    });
                    if (barInfo.separator) {
                        var offset = barInfo.currentValue + (barInfo.currentValue > 0 ? separatorWidth : 0);
                        barInfo.separator.attr({
                            r: this.mGaugeRadius,
                            'stroke-dashoffset': (circumference * 0.25),
                            'stroke-dasharray': circumference * (barInfo.currentValue + offset) + ' ' + circumference * (1.0 - (barInfo.currentValue + offset)),
                        });
                    }
                }
            }
        }

        return Promise.all(promises);
    }

    return Promise.resolve(true);
};

/**
 * Computes the progress of this gauge up to the bar specified by its id or index in the bars array.
 *
 * @method progressToBar
 * @param {String|Number} idOrIndex - The id or index of the bar to compute the progress.
 * @returns {Number}
 */
DataGauge.prototype.progressToBar = function (idOrIndex) {
    var barIndex = parseInt(idOrIndex, 10);
    if (isNaN(barIndex)) {
        if (!this.hasBarWithId(idOrIndex)) {
            return 0;
        }
        barIndex = this.mBars[idOrIndex].index;
    }

    var barsArray = this.mBarsArray;
    var progress = 0;
    for (var i = barsArray.length - 1; i > barIndex; --i) {
        var otherBarInfo = barsArray[i];
        if (otherBarInfo) {
            progress += otherBarInfo.progress;
        }
    }

    return progress;
};

/**
 * Creates and adds a bar to this gauge using the specified parameters.
 *
 * @method addBar
 * @param {String} id - A unique string to identify this bar.
 * @param {Number} progress - A number between 0 and 1 describing the percentage this bar should fill the gauge.
 * @param {String} color - The color of this bar.
 * @param {Number=} animationStart - If defined, the new bar starts animating from the given point in the gauge.
 */
DataGauge.prototype.addBar = function (id, progress, color, animationStart) {
    var circumference = this.mCircumference;

    var separator = null;

    if (this.mOptions.config.renderGaugeSeparators) {
        separator = new Node('circle', {cx: 0, cy: 0, r: this.mGaugeRadius});
        separator.attr({
            'pointer-events': 'none',
            'fill': 'transparent',
            'stroke': this.mBaseColor,
            'stroke-width': this.mThickness - 2,
            'stroke-dasharray': '0 ' + circumference,
            'stroke-dashoffset': (circumference * 0.25),
        });
    }

    var bar = new Node('circle', {cx: 0, cy: 0, r: this.mGaugeRadius});
    bar.attr({
        'pointer-events': 'none',
        'fill': 'transparent',
        'stroke': color,
        'stroke-width': this.mThickness - 2,
        'stroke-dasharray': '0 ' + circumference,
        'stroke-dashoffset': (circumference * 0.25),
    });

    var barsContainer = this.mBarsContainer;
    if (separator) {
        barsContainer.append(separator);
    }
    barsContainer.append(bar);

    var barsArray = this.mBarsArray;
    var progressOffset = 0;
    for (var i = 0, n = barsArray.length; i < n; ++i) {
        var otherBarInfo = barsArray[i];
        if (otherBarInfo) {
            otherBarInfo.index = i + 1;
            progressOffset += otherBarInfo.progress;
            if (otherBarInfo.separator) {
                barsContainer.append(otherBarInfo.separator);
            }
            barsContainer.append(otherBarInfo.bar);
        }
    }

    var barInfo = {
        id: id,
        index: 0,
        color: color,
        progress: progress,
        progressOffset: progressOffset,
        currentValue: 0,
        bar: bar,
        separator: separator,
        animation: null,
    };

    this.mBars[id] = barInfo;
    this.mBarsArray.unshift(barInfo);

    var separatorWidth = this.mOptions.config.gaugeSeparatorWidth;
    var startProgress = parseFloat(animationStart);
    startProgress = isNaN(startProgress) ? 0 : startProgress;
    barInfo.animation = Snap.animate(startProgress, progress + progressOffset,
        function(value) {
            barInfo.currentValue = value;
            bar.attr({'stroke-dasharray': circumference * value + ' ' + circumference * (1.0 - value)});
            if (separator) {
                var offset = value + (value > 0 ? separatorWidth : 0);
                separator.attr({'stroke-dasharray': (circumference * offset) + ' ' + circumference * (1.0 - offset)});
            }
        },
        this.mOptions.config.transitionsDuration, mina.linear, function () {
            barInfo.animation = null;
        });
};

/**
 * Modifies the progress of the bar at the specified `id`
 *
 * @method updateBar
 * @param {String} id - The id of the bar to update
 * @param {Number} progress - A number between 0 and 1 describing the new progress of this bar.
 * @param {String} color - The color of this bar.
 * @param {Boolean=} animated - Describes if the value change should be animated or not.
 * @param {Function=} callback - A function to be called when the update has completed.
 */
DataGauge.prototype.updateBar = function (id, progress, color, animated, callback) {
    var barInfo = this.mBars[id];
    if (barInfo) {
        var i;
        var barsArray = this.mBarsArray;
        var progressOffset = this.progressToBar(barInfo.index);

        /* get the current color and new color's components */
        var currentColor = this._parseColor(getComputedStyle(barInfo.bar.node).stroke);
        var newColor = this._parseColor(color);

        if (progress !== barInfo.progress ||
            progressOffset !== barInfo.progressOffset ||
            currentColor.r !== newColor.r ||
            currentColor.g !== newColor.g ||
            currentColor.b !== newColor.b ||
            currentColor.a !== newColor.a) {
            var bar = barInfo.bar;
            if (barInfo.animation) {
                barInfo.animation.stop();
            }

            var separator = barInfo.separator;
            var separatorWidth = this.mOptions.config.gaugeSeparatorWidth;

            if (animated) {
                /* compute the color difference */
                var colorDifference = {
                    r: newColor.r - currentColor.r,
                    g: newColor.g - currentColor.g,
                    b: newColor.b - currentColor.b,
                    a: newColor.a - currentColor.a,
                };

                /* save the current value and compute the value change */
                var currentValue = barInfo.currentValue;
                var valueChange = (progress + progressOffset) - currentValue;

                barInfo.animation = Snap.animate(0, 1,
                    function (delta) {
                        var animatedColor = 'rgba(' +
                                            (currentColor.r + (colorDifference.r * delta)) + ',' +
                                            (currentColor.g + (colorDifference.g * delta)) + ',' +
                                            (currentColor.b + (colorDifference.b * delta)) + ',' +
                                            (currentColor.a + (colorDifference.a * delta)) + ')';
                        var value = currentValue + (valueChange * delta);
                        barInfo.currentValue = value;
                        bar.attr({'stroke-dasharray': this.mCircumference * value + ' ' + this.mCircumference * (1.0 - value), 'stroke': animatedColor});
                        if (separator) {
                            value += value > 0 ? separatorWidth : 0;
                            separator.attr({'stroke-dasharray': (this.mCircumference * value) + ' ' + this.mCircumference * (1.0 - value)});
                        }
                    }.bind(this),
                    this.mOptions.config.transitionsDuration, mina.linear, function () {
                        barInfo.animation = null;
                        if (callback) {
                            /* eslint-disable */
                            callback();
                            /* eslint-enable */
                        }
                    });
            } else {
                barInfo.progress = progress;
                barInfo.progressOffset = progressOffset;
                barInfo.currentValue = progress + progressOffset;
                bar.attr({'stroke-dasharray': this.mCircumference * barInfo.currentValue + ' ' + this.mCircumference * (1.0 - barInfo.currentValue), 'stroke': color});
                if (separator) {
                    var offset = barInfo.currentValue + (barInfo.currentValue > 0 ? separatorWidth : 0);
                    separator.attr({'stroke-dasharray': this.mCircumference * (barInfo.currentValue + offset) + ' ' + this.mCircumference * (1.0 - (barInfo.currentValue + offset))});
                }
                if (callback) {
                    /* eslint-disable */
                    callback();
                    /* eslint-enable */
                }
            }

            barInfo.progress = progress;
            barInfo.progressOffset = progressOffset;
            barInfo.color = color;
        }

        if (barInfo.index > 0) {
            for (i = barInfo.index - 1; i >= 0; --i) {
                if (barsArray[i]) {
                    this.updateBar(barsArray[i].id, barsArray[i].progress, barsArray[i].color, animated);
                    break;
                }
            }
        }
    }
};

/**
 * Removes the bar with the given id from the gauge.
 *
 * @method removeBar
 * @param {String} id - The id of the bar to remove.
 * @param {boolean=} animated - Should the bar be animated while it is being removed.
 */
DataGauge.prototype.removeBar = function (id, animated) {
    var barInfo = this.mBars[id];
    if (barInfo) {
        var i;
        var n;
        var barsArray = this.mBarsArray;

        if (animated) {
            var progressOffset = this.progressToBar(barInfo.index);
            this.updateBar(id, -progressOffset, barInfo.color, true, function() {
                barInfo.bar.remove();
                if (barInfo.separator) {
                    barInfo.separator.remove();
                }
            });
        } else {
            barInfo.bar.remove();
            if (barInfo.separator) {
                barInfo.separator.remove();
            }
        }

        for (i = barInfo.index + 1, n = barsArray.length; i < n; ++i) {
            barsArray[i].index = i - 1;
        }
        barsArray.splice(barInfo.index, 1);
        delete this.mBars[id];
    }
};

/**
 * Removes all bars from the gauge.
 *
 * @method removeAllBars
 */
DataGauge.prototype.removeAllBars = function () {
    var bars = this.mBars;
    for (var key in bars) {
        if (bars.hasOwnProperty(key)) {
            bars[key].bar.remove();
            bars[key] = null;
            delete bars[key];
        }
    }
    this.mBarsArray.length = 0;
};

/**
 * Changes the ID of the specified bar. Returns true if the ID was successfully changed, false otherwise.
 *
 * @param {String} oldId - The current ID of the bar.
 * @param {String} newId - The new ID of the bar.
 * @param {boolean} force - If there's a bar holding the new ID, such bar's ID get's changed to a random ID to accomodate the change.
 * @returns {boolean}
 */
DataGauge.prototype.changeBarId = function (oldId, newId, force) {
    if (this.hasBarWithId(oldId)) {
        if (this.hasBarWithId(newId)) {
            if (force) {
                var forcedId = newId + '_old';
                while (!this.changeBarId(newId, forcedId, false)) {
                    forcedId += '_old';
                }
            } else {
                return false;
            }
        }

        this.mBars[newId] = this.mBars[oldId];
        this.mBars[newId].id = newId;
        delete this.mBars[oldId];
        return true;
    }
    return false;
};

/**
 * Checks if the gauge currently contains a bar with the given Id.
 *
 * @method hasBarWithId
 * @param {String} id - The id of the bar to look for.
 * @returns {boolean}
 */
DataGauge.prototype.hasBarWithId = function (id) {
    return Boolean(this.mBars.hasOwnProperty(id) && this.mBars[id].bar);
};

/**
 * Parses a color string into an object containing the rgba color components as number properties.
 * NOTE: Requires a modern browser that can convert a color style to rgb format.
 *
 * @method _parseColor
 * @param {String} color - The color string to parse.
 * @returns {{r: Number, g: Number, b: Number, a: Number}}
 * @private
 */
DataGauge.prototype._parseColor = function (color) {
    /* first try the `rgb` or `rgba` variants */
    if (color.indexOf('rgb(') === 0) {
        return this._parseRGBAComponents(color.substr(4, color.indexOf(')')));
    } else if (color.indexOf('rgba(') === 0) {
        return this._parseRGBAComponents(color.substr(5, color.indexOf(')')));
    }
    /* if not an rgb formatted string, convert it to one using the browser */
    var div = document.createElement('div');
    div.style.color = color;
    if (div.style.color.indexOf('rgb') === 0) {
        return this._parseColor(div.style.color);
    }

    var computedColor = getComputedStyle(div).color;
    if (computedColor.indexOf('rgb') === 0) {
        return this._parseColor(computedColor);
    }

    /* modern browsers should never get here */
    /* console.log('WARNING (personas.persona.gauge): Cannot parse color ' + color); */
    return {
        r: 255,
        g: 255,
        b: 0,
        a: 1,
    };
};

/**
 * Parses the color components of a comma separated string assuming the order 'R, G, B, A'
 *
 * @method _parseRGBAComponents
 * @param {String} color - The color component string to parse in format 'R, G, B, A' (the alpha channel is optional)
 * @returns {{r: Number, g: Number, b: Number, a: Number}}
 * @private
 */
DataGauge.prototype._parseRGBAComponents = function (color) {
    var components = color.split(',');
    return {
        r: parseInt(components[0], 10),
        g: parseInt(components[1], 10),
        b: parseInt(components[2], 10),
        a: (components.length >= 4) ? parseFloat(components[3]) : 1.0,
    };
};

/**
 * @export
 * @type {Gauge}
 */
module.exports = DataGauge;

},{"./personas.core.node.js":8,"bluebird":1,"snapsvg":4}],22:[function(require,module,exports){
(function (global){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* global mina */

/* enable strict mode */
'use strict';

/* import modules */
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);
var Snap = require('snapsvg');
var Node = require('./personas.core.node.js');
var Avatar = require('./personas.persona.avatar.js');
var Gauge = require('./personas.persona.gauge.js');
var Label = require('./personas.persona.label.js');
var Events = require('./personas.defaults').Persona.events;
var EventTracker = require('./personas.core.eventTracker');
var Point2D = require('./personas.core.point2d.js');
var Vector2D = require('./personas.core.vector2d.js');
var Promise = require('bluebird');

/**
 * This class represents a persona graphically.
 *
 * @class Persona
 * @param {Number} size - The size, in pixels, of this persona.
 * @param {Object} data - An object containing the data that this persona should present.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 * @param {Object} globalConfig - Global configuration object.
 * @param {Object=} entityRefs - An object containing the entity references table.
 * @constructor
 */
function Persona(size, data, iconMap, globalConfig, entityRefs) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mConfig = globalConfig;
    this.mPersonaOptions = this.mConfig.Persona;
    this.mParent = null;
    this.mEventCenter = globalConfig.eventCenter;
    this.mEventTracker = new EventTracker(this.mEventCenter);
    this.mSize = size;
    this.mRadius = size * 0.5;
    this.mBorder = this.mPersonaOptions.layout.selectedBorder;
    this.mRadiusNoBorder = this.mRadius - this.mBorder;
    this.mData = data;
    this.mIsSelected = false;
    this.mDrag = new Point2D();
    this.mDragging = false;
    this.mCanDrag = false;
    this.mMergeEnabled = this.mPersonaOptions.config.mergeEnabled;
    this.mMoveEnabled = this.mPersonaOptions.config.moveEnabled;
    this.mMergeCandidates = [];
    this.mAnimationDurationBase = this.mPersonaOptions.config.animationsDurationBase;
    this.mMergeOverlapRatio = this.mPersonaOptions.config.mergeOverlapRatio;
    this.mMergeScaleRatio = this.mPersonaOptions.config.mergeScaleRatio;
    this.mShouldPopIn = false;
    this.mAppendedGauges = [];
    this.mInVisualFocus = true;
    this.mVisualFocusFilter = null;
    this.mVisualFocusAnimation = null;
    this.mMutationObserver = null;
    this.mEntityRefs = entityRefs;

    /* sub selection visual effects */
    this.mVisualFocusEffectEnabled = this.mPersonaOptions.config.subSelectEffectEnabled;
    /* backwards compatibility */
    if ('subSelect' in this.mPersonaOptions.config) {
        this.mVisualFocusEffectEnabled = Boolean(this.mPersonaOptions.config.subSelect.blur) || Boolean(this.mPersonaOptions.config.subSelect.gray);
    }
    this.mVisualFocusEffectCompatibilityMode = this.mPersonaOptions.config.subSelectEffectCompatibilityMode;
    this.mVisualFocusGrayScaleAmount = 0.85;
    this.mVisualFocusOpacityAmount = 0.3;

    /* horrible Edge hack */
    /* eslint-disable */
    /* TODO: remove once Edge fixes its `innerHTML` implementation */
    /* eslint-enable */
    this.mIsEdge = ('msTouchSelect' in document.body.style) && !('msTouchAction' in document.body.style);

    /* initialization */
    this.mContainer = new Node();
    this.append(this.mContainer);

    this.mBackground = new Node('circle', {x: 0, y: 0, r: this.mRadiusNoBorder});
    this.mContainer.append(this.mBackground);
    this.isSelected = this.mIsSelected;

    /* extra gauges should be added behind existing gauges */
    this.mAppendedGaugesContainer = new Node();
    this.mContainer.append(this.mAppendedGaugesContainer);

    /* create the gauge */
    this.mGauge = new Gauge(this.mRadiusNoBorder, this.mPersonaOptions.layout.progressHeight, this.mPersonaOptions.pie.baseColor, this.mPersonaOptions);
    this.initializeGauge(this.mGauge, data.properties, data.totalCount, iconMap, entityRefs);
    this.mContainer.append(this.mGauge);

    /* create the avatar */
    var backgroundColor;
    if (data.primaryProperty && data.primaryProperty.backgroundColor) {
        backgroundColor = data.primaryProperty.backgroundColor;
    } else if (this.mPersonaOptions.config.autoGenerateFallbackColors && data.primaryProperty && data.primaryProperty.color) {
        backgroundColor = data.primaryProperty.color;
    } else {
        backgroundColor = this.mPersonaOptions.config.fallbackBackgroundColor;
    }
    this.mAvatar = new Avatar(data.imageUrl, Math.ceil(this.mRadiusNoBorder - this.mPersonaOptions.layout.progressHeight), backgroundColor, this.mPersonaOptions.config.forceGreyscaleBackgroundColor);
    this.mContainer.append(this.mAvatar);

    /* create the label */
    this.mLabel = new Label(data.relevantName, data.formattedRelevantCount || data.relevantCount, data.formattedTotalCount || data.totalCount, this.mPersonaOptions, size * 1.1);
    this.mContainer.append(this.mLabel);

    /* create an invisible circle on top of everything wich will receive all the mouse events */
    this.mEventReceiver = new Node('circle', {x: 0, y: 0, r: this.mRadius});
    this.mEventReceiver.attr({
        'fill': 'transparent',
    });
    this.append(this.mEventReceiver);

    /* finally, register the events */
    this.registerEvents();
}

/* inheritance */
Persona.prototype = Object.create(Node.prototype);
Persona.prototype.constructor = Persona;

/**
 * If this object was added to an 'Orbit' this property will return such object.
 *
 * @property parent
 * @type {Orbit}
 * @readonly
 */
Object.defineProperty(Persona.prototype, 'parentNode', {
    get: function() {
        return this.mParent;
    },
});

/**
 * The radius of this persona.
 *
 * @property radius
 * @type {Number}
 */
Object.defineProperty(Persona.prototype, 'radius', {
    get: function() {
        return this.mRadius;
    },

    set: function(val) {
        this.setRadius(val, false);
    },
});

/**
 * The size (or diameter) of this persona.
 *
 * @property size
 * @type {Number}
 */
Object.defineProperty(Persona.prototype, 'size', {
    get: function() {
        return this.mSize;
    },

    set: function(val) {
        this.setRadius(val * 0.5, false);
    },
});

/**
 * Describes if this persona has been selected.
 *
 * @property isSelected
 * @type {Boolean}
 */
Object.defineProperty(Persona.prototype, 'isSelected', {
    get: function() {
        return this.mIsSelected;
    },

    set: function(value) {
        this.mIsSelected = value;
        this.mBackground.toggleClass('selected', value);
        this.mBackground.toggleClass('unselected', !value);
    },
});

/**
 * Returns this persona's data if it was set.
 *
 * @property data
 * @type {Object}
 * @readonly
 */
Object.defineProperty(Persona.prototype, 'data', {
    get: function() {
        return this.mData;
    },
});

/**
 * Returns this persona's id if it has been set.
 *
 * @property personaId
 * @type {String}
 * @readonly
 */
Object.defineProperty(Persona.prototype, 'personaId', {
    get: function() {
        if (this.mData) {
            return this.mData.id;
        }
        return null;
    },
});

/**
 * Returns if this persona has appended gauges.
 *
 * @property hasAppendedGauges
 * @type {Boolean}
 * @readonly
 */
Object.defineProperty(Persona.prototype, 'hasAppendedGauges', {
    get: function() {
        return Boolean(this.mAppendedGauges.length);
    },
});

Object.defineProperty(Persona.prototype, 'gauge', {
    get: function() {
        return this.mGauge;
    },
});

/**
 * Sets the visual focus of this persona.
 *
 * @property inVisualFocus
 * @type {Boolean}
 */
Object.defineProperty(Persona.prototype, 'inVisualFocus', {
    get: function() {
        return this.mInVisualFocus;
    },

    set: function(value) {
        if (value !== this.mInVisualFocus) {
            this.mInVisualFocus = value;

            if (this.mVisualFocusAnimation) {
                this.mVisualFocusAnimation.stop();
                this.mVisualFocusAnimation = null;
            }

            if (value) {
                this._applyVisualFilter(1);
                this.mVisualFocusAnimation = Snap.animate(1, 0, function(currentValue) {
                    this._applyVisualFilter(currentValue);
                }.bind(this), this.mPersonaOptions.config.transitionsDuration, mina.easeinout, function() {
                    this._applyVisualFilter(0);
                    this.mVisualFocusAnimation = null;
                }.bind(this));
            } else {
                this._applyVisualFilter(0);
                this.mVisualFocusAnimation = Snap.animate(0, 1, function(currentValue) {
                    this._applyVisualFilter(currentValue);
                }.bind(this), this.mPersonaOptions.config.transitionsDuration, mina.easeinout, function() {
                    this.mVisualFocusAnimation = null;
                }.bind(this));
            }
        }
    },
});

/**
 * Utility function to change the radius of this persona. Can be animated.
 *
 * @method setRadius
 * @param {Number} newRadius - The new radius for this persona.
 * @param {Boolean} animated - Should the radius change be animated.
 */
Persona.prototype.setRadius = function(newRadius, animated) {
    if (newRadius !== this.mRadius) {
        this.mRadius = newRadius;
        this.mSize = (newRadius * 2);
        this.mRadiusNoBorder = this.mRadius - this.mBorder;
        this.mEventReceiver.attr({r: newRadius});
        if (animated) {
            this.mBackground.animate({r: this.mRadiusNoBorder}, this.mPersonaOptions.config.transitionsDuration, mina.easeinout);
        } else {
            this.mBackground.attr({r: this.mRadiusNoBorder});
        }

        this.mGauge.setRadius(this.mRadiusNoBorder, animated);
        this.mAvatar.setRadius(Math.ceil(this.mRadiusNoBorder - this.mPersonaOptions.layout.progressHeight), animated);

        var appendedGauges = this.mAppendedGauges;
        for (var i = 0, n = appendedGauges.length; i < n; ++i) {
            appendedGauges[i].setRadius(this.mRadiusNoBorder + (this.mPersonaOptions.layout.progressHeight * (i + 1)), animated);
        }
    }
};

/**
 * Computes a number hash from any string.
 *
 * @param {String} string - The string to compute the hash from.
 * @returns {number}
 */
Persona.prototype.simpleStringHash = function(string) {
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};

/**
 * Generates a color from the passed string. Can clamp the resulting numbers for more control.
 *
 * @param {String} string - The string to generate the color from.
 * @param {Number=} min - (0 - 255 or 0x00 to 0xff) If passed, the red, green and blue values will be at least this number.
 * @param {Number=} max - (0 - 255 or 0x00 to 0xff) If passed, the red, green and blue values will be at most this number.
 * @returns {string}
 */
Persona.prototype.colorFromName = function(string, min, max) {
    var hash = this.simpleStringHash(string);
    var color32bit = (hash & 0xFFFFFF);
    var r = (color32bit >> 16) & 255;
    var g = (color32bit >> 8) & 255;
    var b = color32bit & 255;

    /* clamp the colors */
    if (min !== undefined) {
        r = Math.max(r, min);
        g = Math.max(g, min);
        b = Math.max(b, min);
    }

    if (max !== undefined) {
        r = Math.min(r, max);
        g = Math.min(g, max);
        b = Math.min(b, max);
    }

    return '#' + r.toString(16) + g.toString(16) + b.toString(16);
};

/**
 * Utility function to initialize the given `gauge` with the given `properties` in respect to the `totalCount`
 *
 * @method initializeGauge
 * @param {Gauge} gauge - The gauge to initialize.
 * @param {Object} properties - An object containing the properties to add to the gauge.
 * @param {Number} totalCount - The total count of documents of the persona that owns the gauge.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 * @param {Object} entityRefs - An object containing all the entities that could be referenced in the iconMap.
 */
Persona.prototype.initializeGauge = function(gauge, properties, totalCount, iconMap, entityRefs) {
    // add a bar to the gauge for each property
    for (var i = 0, n = properties.length; i < n; ++i) {
        var property = properties[i];
        if (property.isPrimary || (property.count / totalCount) >= this.mPersonaOptions.pie.minimumDisplayRatio) {
            var propertyId = (property.entityRefId || property.value).toString();
            var color = null;
            if (property.entityRefId) {
                if (iconMap.icons[property.entityRefId]) {
                    color = iconMap.icons[property.entityRefId];
                } else if (iconMap.defaults[entityRefs[property.entityRefId].type]) {
                    color = iconMap.defaults[entityRefs[property.entityRefId].type];
                }
            }

            if (!color) {
                if (property.color) {
                    color = property.color;
                } else {
                    if (this.mPersonaOptions.config.autoGenerateFallbackColors) {
                        var colorString = entityRefs[property.entityRefId].type + entityRefs[property.entityRefId].name + propertyId;
                        color = this.colorFromName(colorString, this.mPersonaOptions.config.autoColorClampMin, this.mPersonaOptions.config.autoColorClampMax);
                    } else {
                        color = iconMap.fallbackColor;
                    }
                    property.color = color;
                }
            }

            gauge.addBar(propertyId, property.count / totalCount, color);
        }
    }
};

/**
 * Appends an extra gauge at the outside of the persona with the specified bars.
 * NOTE: Gauges can be stacked.
 *
 * @method appendGauge
 * @param {Array} bars - An array containing objects in the format { color:String, percent:Number }.
 */
Persona.prototype.appendGauge = function(bars) {
    var i;
    var n;
    var gauge = new Gauge(this.mRadiusNoBorder + (this.mPersonaOptions.layout.progressHeight * this.mAppendedGauges.length), this.mPersonaOptions.layout.progressHeight, this.mPersonaOptions.pie.baseColor, this.mPersonaOptions);

    for (i = 0, n = bars.length; i < n; ++i) {
        var bar = bars[i];
        var barId = gauge.mBarsArray.length.toString();
        gauge.addBar(barId, 0, bar.color);
        gauge.updateBar(barId, bar.percent, bar.color, true);
    }

    this.mAppendedGaugesContainer.append(gauge);
    var appendedGauges = this.mAppendedGauges;
    for (i = appendedGauges.length - 1; i >= 0; --i) {
        this.mAppendedGaugesContainer.append(appendedGauges[i]);
    }

    this.mAppendedGauges.push(gauge);

    gauge.setRadius(this.mRadiusNoBorder + (this.mPersonaOptions.layout.progressHeight * this.mAppendedGauges.length), true, {
        duration: this.mPersonaOptions.config.transitionsDuration * 0.8,
        easing: mina.backout,
    });
};

/**
 * Removes all the currently appended gauges.
 *
 * @method removeAllAppendedGauges
 */
Persona.prototype.removeAllAppendedGauges = function() {
    var promises = [];
    var removedGauges = [];
    var appendedGauges = this.mAppendedGauges;
    while (appendedGauges.length) {
        var gauge = appendedGauges.pop();
        promises.push(gauge.setRadius(this.mRadiusNoBorder, true, {
            duration: this.mPersonaOptions.config.transitionsDuration * 0.6,
            easing: mina.backin,
        }));
        removedGauges.push(gauge);
    }

    Promise.all(promises).then(function() {
        while (removedGauges.length) {
            removedGauges.pop().remove();
        }
    });
};

/**
 * Updates the data of this persona, each of its graphical elements gets updated to reflect the new data passed.
 *
 * @method updateData
 * @param {Number} size - The new size of this persona.
 * @param {Object} data - The new data to update this persona with.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 * @param {Object} entityRefs - An object containing the entity references table.
 */
Persona.prototype.updateData = function(size, data, iconMap, entityRefs) {
    this.updateGauge(data, iconMap, entityRefs);
    this.updateLabel(data, size);

    if (size !== this.mSize) {
        this.setRadius(size * 0.5, true);
    }

    this.updateAvatar(data.imageUrl);
};

/**
 * Updates the gauge of this persona.
 *
 * @method updateGauge
 * @param {Object} data - The new data.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 * @param {Object} entityRefs - An object containing the entity references table.
 */
Persona.prototype.updateGauge = function(data, iconMap, entityRefs) {
    var gauge = this.mGauge;
    if (gauge) {
        var properties = data.properties;
        var totalCount = data.totalCount;
        var currentProgress = gauge.progress;

        // add a bar to the gauge for each property
        for (var i = 0, n = properties.length; i < n; ++i) {
            var property = properties[i];
            var propertyId = (property.entityRefId || property.value);

            var color = null;
            if (property.entityRefId) {
                if (iconMap.icons[property.entityRefId]) {
                    color = iconMap.icons[property.entityRefId];
                } else if (iconMap.defaults[entityRefs[property.entityRefId].type]) {
                    color = iconMap.defaults[entityRefs[property.entityRefId].type];
                }
            }

            if (!color) {
                if (property.color) {
                    color = property.color;
                } else {
                    if (this.mPersonaOptions.config.autoGenerateFallbackColors) {
                        var colorString = entityRefs[property.entityRefId].type + entityRefs[property.entityRefId].name + propertyId;
                        color = this.colorFromName(colorString, this.mPersonaOptions.config.autoColorClampMin, this.mPersonaOptions.config.autoColorClampMax);
                    } else {
                        color = iconMap.fallbackColor;
                    }
                    property.color = color;
                }
            }

            if (gauge.hasBarWithId(propertyId)) {
                gauge.updateBar(propertyId, property.count / totalCount, color, true);
            } else {
                gauge.addBar(propertyId, property.count / totalCount, color, currentProgress);
            }
        }
    }
};

/**
 * Replaces this persona's gauge bars with new bars.
 *
 * @method replaceGaugeBars
 * @param {Object} data - The new data.
 * @param {Object} iconMap - The processed icon map to look for colors in.
 */
Persona.prototype.replaceGaugeBars = function(data, iconMap) {
    var gauge = this.gauge;
    var properties = data.properties;
    var barsArray = gauge.mBarsArray;

    while (barsArray.length > properties.length) {
        gauge.removeBar(barsArray[barsArray.length - 1].id, true);
    }

    var barsIndices = barsArray.length - 1;
    for (var i = barsIndices; i >= 0; --i) {
        var property = properties[barsIndices - i];
        var propertyId = (property.entityRefId || property.value);
        gauge.changeBarId(barsArray[i].id, propertyId);
    }

    this.updateGauge(data, iconMap, this.mEntityRefs);
};

/**
 * Updates this persona's avatar.
 *
 * @method updateAvatar
 * @param {String|Array} imageUrl - The URL or an array of URLs to load the avatar images from.
 */
Persona.prototype.updateAvatar = function(imageUrl) {
    var avatar = this.mAvatar;
    var loadedURLs = avatar.imageURLs;
    var urls = [];
    var i;
    var n;

    /* populate the URLs array */
    if (imageUrl instanceof Array) {
        Array.prototype.push.apply(urls, imageUrl);
    } else {
        urls.push(imageUrl);
    }

    var needsReload = (urls.length !== loadedURLs.length);
    if (!needsReload) {
        for (i = 0, n = urls.length; i < n; ++i) {
            if (!_.contains(loadedURLs, urls[i])) {
                needsReload = true;
                break;
            }
        }
    }

    if (needsReload) {
        /* do the reload */
        var loadedImages = avatar.images;
        if (loadedImages) {
            for (i = 0, n = loadedImages.length; i < n; ++i) {
                loadedImages[i].remove();
            }
            loadedImages.length = 0;
        }

        loadedURLs.length = 0;

        Array.prototype.push.apply(loadedURLs, urls);

        avatar.loadImages(avatar.imageContainer, avatar.imageRadius, urls);
    }
};

/**
 * Updates this persona's label with the specified `data`.
 *
 * @method updateLabel
 * @param {Object} data - The new data.
 * @param {Number} size - The nwe size of this persona.
 */
Persona.prototype.updateLabel = function(data, size) {
    if (this.mLabel) {
        var label = this.mLabel;
        if (data.relevantName !== label.name) {
            label.name = data.relevantName;
        }

        if (data.relevantCount.toString() !== label.count) {
            label.count = data.relevantCount;
        }

        if (data.totalCount.toString() !== label.totalCount) {
            label.totalCount = data.totalCount;
        }

        if (label.maxNameWidth !== (size * 1.1)) {
            label.maxNameWidth = (size * 1.1);
        }
    } else {
        this.mLabel = new Label(data.relevantName, data.relevantCount, data.totalCount, this.mPersonaOptions, size * 1.1);
        this.mContainer.append(this.mLabel);
    }
};

/**
 * Animates this persona's position to the new position usind the time and eased specified.
 *
 * @method animatePosition
 * @param {Point2D} position - The initial position of the persona.
 * @param {Point2D} newPosition - The final position of the persona after the animation.
 * @param {Number} time - The duration of the animation.
 * @param {Function} ease - An easing function to be used during the animation.
 */
Persona.prototype.animatePosition = function(position, newPosition, time, ease) {
    var matrix = this.transform().localMatrix;
    matrix.e = newPosition.x;
    matrix.f = newPosition.y;

    this.stop();
    this.animate({transform: matrix}, time, ease, function() {
        /* WARNING: HACK! */
        var oldCallback = position.changedCallback;
        position.changedCallback = null;
        position.set(newPosition.x, newPosition.y);
        position.changedCallback = oldCallback;
    });
};

/**
 * Brings this persona to the front of the rendering graph, so it seems to be on top of all the other personas.
 *
 * @method bringToFront
 */
Persona.prototype.bringToFront = function() {
    var parent = this.parentNode;
    if (parent) {
        parent.append(this);
        var parentParent = parent.parentNode;
        while (parentParent) {
            parentParent.append(parent);
            parent = parentParent;
            parentParent = parent.parentNode;
        }
    } else {
        this.parent().append(this);
    }
};

/**
 * Utility function used to create a `pop in` animation for this persona.
 * NOTE: This function should always be called before the persona is added to the paper for the very first time.
 * Otherwise behaviour is undefined.
 *
 * @method popIn
 */
Persona.prototype.popIn = function() {
    this.mContainer.attr({display: 'none'});
    this.mShouldPopIn = true;
};

/**
 * This function is called the first time the node is added to a paper. Used to initialize the layout because actual text
 * sizes are not computed until the text has been added to the paper.
 *
 * @method onEnter
 */
Persona.prototype.onEnter = function() {
    if (this.mShouldPopIn) {
        this.mShouldPopIn = false;
        this.mContainer.attr({display: 'block'});
        this.mContainer.scale = 0.1;
        this.mContainer.animate({transform: new Snap.Matrix()}, this.mPersonaOptions.config.transitionsDuration, mina.backout);
    }

    /* if this persona was set to be out of visual focus before it was added to the paper, apply the filter */
    if (!this.mInVisualFocus) {
        this._applyVisualFilter(1);
    }
};

/**
 * Registers this persona to listen for the events that it needs to function.
 *
 * @method registerEvents
 */
Persona.prototype.registerEvents = function() {
    /* bind event handlers */
    var eventTracker = this.mEventTracker;
    eventTracker.registerEvent(Events.enableBlur, this.handleEnableBlur.bind(this));
    eventTracker.registerEvent(Events.repel, this.handleRepel.bind(this));
    if (this.mMergeEnabled) {
        eventTracker.registerEvent(Events.dragMoved, this.handleDragMovedMerge.bind(this));
    }

    /* mpuse down event */
    if (this.mMoveEnabled || this.mMergeEnabled) {
        this.mEventReceiver.mousedown(function (event) {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    /* click */
    this.mEventReceiver.click(this.handleClick.bind(this));

    var publishHover = function(eventCenter, isHover, id) {
        return function() {
            eventCenter.publish(Events.hover, {
                id: id,
                hovered: isHover,
            });
        };
    };

    this.mEventReceiver.hover(
        publishHover(this.mEventCenter, true, this.mData.id),
        publishHover(this.mEventCenter, false, this.mData.id)
    );

    /* setup dragging */
    var t = this;
    if (this.mMoveEnabled || this.mMergeEnabled) {
        this.mEventReceiver.drag(this.handleDragMoved.bind(this),
            this.handleDragStarted.bind(this),
            function() {
                /* we just want to flush the event cache */
                setTimeout(function() {
                    t.handleDragEnded();
                }, 0);
            }
        );
    }

    if (typeof MutationObserver !== 'undefined') {
        /* eslint-disable */
        /* This is a horrible hack to fix edge SVG rendering issues */
        /* TODO: Remove once edge fixes its renderer. */
        /* eslint-enable */
        this.mMutationObserver = new MutationObserver(function () {
            this.mContainer.remove();
            this.prepend(this.mContainer);
        }.bind(this));
        this.mMutationObserver.observe(this.node, {attributes: true});
    }
};

/**
 * Unregisters all the events registered in the `registerEvents` function.
 *
 * @method unregisterEvents
 */
Persona.prototype.unregisterEvents = function() {
    this.mEventTracker.unregisterAllEvents();
    this.mEventReceiver.unmousedown();
    this.mEventReceiver.unclick();
    this.mEventReceiver.unhover();
    this.mEventReceiver.undrag();

    /* eslint-disable */
    /* Unregister the horrible hack to fix edge SVG rendering issues */
    /* TODO: Remove once edge fixes its renderer. */
    /* eslint-enable */
    if (this.mMutationObserver) {
        this.mMutationObserver.disconnect();
        this.mMutationObserver = null;
    }
};

/**
 * Function to handle a mouse click on the persona.
 *
 * @method handleClick
 * @param {MouseEvent} event - The event that was triggered.
 */
Persona.prototype.handleClick = function(event) {
    if (event) {
        event.stopPropagation();
    }

    if (!this.mDragging && (!event || event.button === 0)) {
        var selected = !this.isSelected;
        this.isSelected = selected;
        /* bring to front */
        this.bringToFront();
        this.mEventCenter.publish(Events.select, {
            id: this.mData.id,
            selected: selected,
        });
    }
};

/**
 * Function to handle the `enableBlur` event.
 *
 * @param {Boolean} enabled - Should the blur effect be enabled.
 */
Persona.prototype.handleEnableBlur = function(enabled) {
    this.mAvatar.blurEnabled = enabled;
};

/**
 * Function to repel a persona based on a center point and a radius.
 * NOTE: It triggers the repel event to let other personas reposition themselves once this persona has moved.
 *
 * @method handleRepel
 * @param {Array} affected - an array containing the personas already processed by this method. Avoid infinite recursion.
 * @param {Point2D} repulsionCenter - The center point from which to calculate repulsion.
 * @param {Number} radius - The radius of the repulsion field.
 */
Persona.prototype.handleRepel = function(affected, repulsionCenter, radius) {
    /* eslint-disable */
    /* TODO: this solver is incredibly naive, if this functionality is needed, replace with a more robust solution */
    /* eslint-enable */
    if (affected.indexOf(this) < 0) {
        var vector = Vector2D.fromPoints(repulsionCenter, this.position);
        var minDistance = radius + this.radius;
        var minDistanceSQ = (minDistance * minDistance);
        var distanceSQ = vector.lengthSQ;
        if (distanceSQ < minDistanceSQ) {
            affected.push(this);
            var distance = vector.length;
            var offsetDistance = (minDistance - distance);
            var unitVector = new Vector2D(vector.x / distance, vector.y / distance);
            var finalOffsetX = offsetDistance * unitVector.x;
            var finalOffsetY = offsetDistance * unitVector.y;
            this.position.x += finalOffsetX;
            this.position.y += finalOffsetY;
            var thisCenter = this.position;
            var thisRadius = this.radius;
            var eventCenter = this.mEventCenter;
            setTimeout(function() {
                eventCenter.publish(Events.repel, affected, thisCenter, thisRadius);
            }, 0);
        }
    }
};

/**
 * Utility function to handle event when a drag is started.
 *
 * @method handleDragStarted
 */
Persona.prototype.handleDragStarted = function() {
    if (!arguments[2] || arguments[2].button === 0) {
        this.mCanDrag = true;
        this.mDragging = false;
        this.mDrag.set(this.position.x, this.position.y);

        /* trigger the drag started event */
        this.mEventCenter.publish(Events.dragStarted, this, {x: this.mDrag.x, y: this.mDrag.y}, this.radius);
    }
};

/**
 * Utility function to handle event when a drag is moved.
 *
 * @method handleDragMoved
 * @param {Number} dx - How far was the drag in the X axis.
 * @param {Number} dy - How far was the drag in the Y axis.
 */
Persona.prototype.handleDragMoved = function(dx, dy) {
    if (this.mCanDrag) {
        var transformation = this.transform().globalMatrix.split();
        var newX = this.mDrag.x + (dx / transformation.scalex);
        var newY = this.mDrag.y + (dy / transformation.scaley);
        if (!this.mDragging) {
            this.mDragging = true;
            this.mMergeCandidates.length = 0;
            /* bring to front */
            this.bringToFront();
        }

        var center = this.position;
        center.x = newX;
        center.y = newY;

        if (!this.mMergeEnabled && this.mMoveEnabled) {
            this.mEventCenter.publish(Events.repel, [this], center, this.radius);
        }

        /* trigger the drag moved event */
        this.mEventCenter.publish(Events.dragMoved, this, center, this.radius);
    }
};

/**
 * Utility function to handle event when a drag is ended.
 *
 * @method handleDragEnded
 */
Persona.prototype.handleDragEnded = function() {
    if (this.mDragging) {
        /* calculate the center */
        var center = this.position;

        if (this.mMergeCandidates.length) {
            this.merge(this.mMergeCandidates[0]);
        } else if (this.mMoveEnabled) {
            this.mEventCenter.publish(Events.repel, [this], center, this.radius);
        } else {
            this.animatePosition(this.position, this.mDrag, this.mAnimationDurationBase * 0.7, mina.easein);
        }

        this.mDragging = false;
        this.mMergeCandidates.length = 0;

        /* trigger the drag ended event */
        this.mEventCenter.publish(Events.dragEnded, this, center, this.radius);
    }

    this.mCanDrag = false;
};

/**
 * Utility function used to process the drag moved event triggered by other personas.
 *
 * @param {Persona} sender - The persona that triggered the event.
 * @param {Point2D} center - The center of the sender.
 * @param {Number} radius - Radius of the sender.
 */
Persona.prototype.handleDragMovedMerge = function(sender, center, radius) {
    if (this !== sender) {
        var candidates = sender.mMergeCandidates;
        var canMerge = this.canMerge(center, radius);
        var candidatesLength = candidates.length;
        if (!candidatesLength && canMerge) {
            candidates.push(this);
            this.highlightForMerge();
        } else if (candidatesLength && !canMerge && candidates[0] === this) {
            candidates.pop();
            this.unhiglightForMerge();
        }
    }
};

/**
 * Checks if a merge is available with a theoretical persona located at the specified center with the specified radius.
 *
 * @method canMerge
 * @param {Point2D} center - The x and y coordinates of the persona to be merged with.
 * @param {Number} radius - The radius of the persona to be merged with.
 * @returns {boolean}
 */
Persona.prototype.canMerge = function(center, radius) {
    /* calculate the distance between the personas */
    var position = this.position;
    var vector = Vector2D.fromPoints(center, position);
    var distanceSQ = vector.lengthSQ;
    var minDistance = radius + this.radius;
    var minDistanceSQ = Math.pow(minDistance, 2);

    if (distanceSQ < minDistanceSQ) {
        var mergeDistance = minDistance - (Math.min(radius, this.radius) * (1.0 - this.mMergeOverlapRatio));
        var distance = Math.sqrt(distanceSQ);
        return (distance < mergeDistance);
    }

    return false;
};

/**
 * Merges the current persona to the target.
 *
 * @method merge
 * @param {Persona} target - The target persona to which this persona will be merged with.
 */
Persona.prototype.merge = function(target) {
    /* unregister all events */
    this.invalidate();
    /* unhighlight the target */
    target.unhiglightForMerge();
    /* animate the merge */
    var matrix = Snap.matrix();
    matrix.e = target.position.x;
    matrix.f = target.position.y;
    matrix.scale(0);
    this.animate({transform: matrix}, this.mAnimationDurationBase * 2, mina.easein, function() {
        /* since a persona handles its own container, remove it from the DOM */
        this.remove();
        /* if the parent of this persona is set and it has an objects array, remove this persona from it */
        var parent = this.parentNode;
        if (parent && parent.removeObject) {
            parent.removeObject(this);
        }
        /* remove this graphical persona from the data */
        this.mData.graphicalPersona = null;
        /* trigger the merged event */
        this.mEventCenter.publish(Events.merged, this, target);
    }.bind(this));
};

/**
 * Highlights this persona as a possible target for a merge.
 *
 * @method highlightForMerge
 */
Persona.prototype.highlightForMerge = function() {
    if (!this.isSelected) {
        this.mBackground.toggleClass('selected', true);
        this.mBackground.toggleClass('unselected', false);
    }
    this.stop();
    var matrix = Snap.matrix();
    matrix.e = this.position.x;
    matrix.f = this.position.y;
    matrix.scale(this.mMergeScaleRatio);
    this.animate({transform: matrix}, this.mAnimationDurationBase * 1.5, mina.easein);
};

/**
 * Un-highlights this persona as a possible target for a merge.
 *
 * @method unhiglightForMerge
 */
Persona.prototype.unhiglightForMerge = function() {
    this.mBackground.toggleClass('selected', this.isSelected);
    this.mBackground.toggleClass('unselected', !this.isSelected);
    this.stop();
    var matrix = Snap.matrix();
    matrix.e = this.position.x;
    matrix.f = this.position.y;
    this.animate({transform: matrix}, this.mAnimationDurationBase, mina.easeout);
};

/**
 * Invalidates this object, once invalidated the object will no longer respond to interactions.
 *
 * @method invalidate
 */
Persona.prototype.invalidate = function() {
    this.unregisterEvents();
};

/**
 * Applies the visual focus filter to this persona.
 *
 * @method _applyVisualFilter
 * @param {Number} amount - A number between 0 and 1 representing the strength of the filter.
 * @private
 */
Persona.prototype._applyVisualFilter = function(amount) {
    if (this.mVisualFocusEffectEnabled) {
        if (!this.mVisualFocusFilter) {
            this.mVisualFocusFilter = this.paper.filter(Snap.filter.grayscale(this.mVisualFocusGrayScaleAmount));
            this.mVisualFocusFilter.attr({filterUnits: 'objectBoundingBox', x: '-0.1', y: '-0.1', width: '1.2', height: '1.2'});
        }

        if (!amount) {
            this.attr({opacity: 1, filter: null });
        } else {
            /* horrible Edge hack */
            /* eslint-disable */
            /* TODO: remove once Edge fixes its `innerHTML` implementation */
            /* eslint-enable */
            if (!this.mIsEdge) {
                this.mVisualFocusFilter.node.innerHTML = Snap.filter.grayscale(this.mVisualFocusGrayScaleAmount * amount);
            }
            var attributes = {
                opacity: 1.0 - ((1.0 - this.mVisualFocusOpacityAmount) * amount),
            };
            if (!this.mVisualFocusEffectCompatibilityMode) { /* snap svg filters like the grayscale are not compatible with Firefox/IE */
                attributes.filter = this.mVisualFocusFilter;
            }

            this.attr(attributes);
        }
    }
};

/**
 * @export
 * @type {Persona}
 */
module.exports = Persona;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./personas.core.eventTracker":7,"./personas.core.node.js":8,"./personas.core.point2d.js":10,"./personas.core.vector2d.js":11,"./personas.defaults":12,"./personas.persona.avatar.js":20,"./personas.persona.gauge.js":21,"./personas.persona.label.js":23,"bluebird":1,"snapsvg":4}],23:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Snap = require('snapsvg');
var Node = require('./personas.core.node.js');

/**
 * Class that creates a label with the info required for a persona.
 *
 * @class Label
 * @param {String} name - The mane of this persona.
 * @param {Number|String} count - The number of hits for this persona.
 * @param {Number|String} totalCount - The total number of documents for this persona.
 * @param {Object} options - An object containing the configuration options for the persona that owns this instance.
 * @param {Number=} maxNameWidth - If passed, the maximum width in pixels for the name. If the name is truncated the class automatically adds ellipses at the end of the string.
 * @constructor
 */
function Label(name, count, totalCount, options, maxNameWidth) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mOptions = options;
    this.mShadowFilter = null;
    this.mNameBackground = null;
    this.mName = name;
    this.mCountGroup = null;
    this.mNameText = null;
    this.mCountText = null;
    this.mTotalCount = totalCount.toString();
    this.mTotalCountText = null;
    this.mPaper = null;
    this.mMaxNameWidth = maxNameWidth;

    /* initialization */
    var shadow = Snap.parse(Snap.filter.shadow(0, 0, 2, '#000000'));
    this.mShadowFilter = new Node('filter');
    this.mShadowFilter.append(shadow);
    this.append(this.mShadowFilter);

    /* create the name background */
    this.mNameBackground = new Node('rect');
    this.mNameBackground.attr({'pointer-events': 'none'});
    this.mNameBackground.addClass(this.mOptions.classes.namecontainer);
    this.append(this.mNameBackground);

    /* create the name text */
    this.mNameText = new Node('text', {x: 0, y: 0});
    this.mNameText.attr({
        'text': name,
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mNameText.addClass(this.mOptions.classes.name);
    this.mNameText.addClass(this.mOptions.classes.unselectable);
    this.append(this.mNameText);

    /* create the count text, a group is needed to fix a rendering bug in EDGE */
    this.mCountGroup = new Node();
    this.mCountGroup.attr({
        'filter': this.mShadowFilter,
    });
    this.append(this.mCountGroup);

    this.mCountText = new Node('text');
    this.mCountText.attr({
        'text': this.mOptions.config.displayTotalCountLabel ? count.toString() : totalCount.toString(),
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mCountText.addClass(this.mOptions.classes.count);
    this.mCountText.addClass(this.mOptions.classes.unselectable);
    this.mCountGroup.append(this.mCountText);

    /* create the total count text */
    if (this.mOptions.config.displayTotalCountLabel) {
        this.mTotalCountText = new Node('text');
        this.mTotalCountText.attr({
            'text': ' / ' + totalCount.toString(),
            'filter': this.mShadowFilter,
            'pointer-events': 'none',
        });
        this.mTotalCountText.addClass(this.mOptions.classes.totalcount);
        this.mTotalCountText.addClass(this.mOptions.classes.unselectable);
        this.mTotalCountText.node.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        this.append(this.mTotalCountText);
    }
}

/* inheritance */
Label.prototype = Object.create(Node.prototype);
Label.prototype.constructor = Label;

/**
 * The name text of this label.
 *
 * @property name
 * @type {String}
 */
Object.defineProperty(Label.prototype, 'name', {
    get: function () {
        return this.mName;
    },

    set: function (value) {
        this.mName = value;
        this.mNameText.node.textContent = value;
        if (this.mMaxNameWidth) {
            this.trimTextToFit(this.mNameText.node, this.mMaxNameWidth);
            /* set the name background size and position */
            var nameBB = this.mNameText.getBBox();
            this.mNameBackground.attr({
                x: nameBB.x - this.mOptions.layout.textpadding,
                y: nameBB.y - this.mOptions.layout.textpadding,
                width: nameBB.width + this.mOptions.layout.textpadding * 2,
                height: nameBB.height + this.mOptions.layout.textpadding * 2,
            });
        }
    },
});

/**
 * The count text of this label.
 *
 * @property count
 * @type {String}
 */
Object.defineProperty(Label.prototype, 'count', {
    get: function () {
        return this.mCountText.node.textContent;
    },

    set: function (value) {
        this.mCountText.node.textContent = value;

        if (!this.mOptions.config.displayLabelsAtOneCount) {
            var valueInt = parseInt(value, 10);
            if (valueInt > 1 && this.mCountGroup.parent() !== this) {
                this.append(this.mCountGroup);
            } else if (valueInt <= 1) {
                this.mCountGroup.remove();
            }
        }
        /* set the count text position */
        var nameBB = this.mNameText.getBBox();
        this.mCountText.attr({
            x: 0,
            y: this.mOptions.layout.textpadding + (nameBB.y2 - nameBB.y) - nameBB.y,
        });
        /* trigger a repositioning of the total count text */
        this.totalCount = this.mTotalCount;
    },
});

/**
 * The total count text of this label.
 *
 * @property totalCount
 * @type {String}
 */
Object.defineProperty(Label.prototype, 'totalCount', {
    get: function () {
        return this.mTotalCount;
    },

    set: function (value) {
        this.mTotalCount = value.toString();
        if (this.mOptions.config.displayTotalCountLabel) {
            this.mTotalCountText.node.textContent = ' / ' + value;
            /* set the total count text position */
            var countBB = this.mCountText.getBBox();
            this.mTotalCountText.attr({
                x: countBB.x2,
                y: countBB.y2 - (this.mTotalCountText.getBBox().height * 0.5),
            });
        }
    },
});

/**
 * The maximum width that this label's name can spawn. If `0`, `null`, `false` or `undefined` are set, the width
 * of the name is not constrained.
 *
 * @property maxNameWidth
 * @type {Number}
 */
Object.defineProperty(Label.prototype, 'maxNameWidth', {
    get: function () {
        return this.mMaxNameWidth;
    },

    set: function (value) {
        this.mMaxNameWidth = value;
        if (this.mMaxNameWidth) {
            this.mNameText.node.textContent = this.mName;
            this.trimTextToFit(this.mNameText.node, this.mMaxNameWidth);
            /* set the name background size and position */
            var nameBB = this.mNameText.getBBox();
            this.mNameBackground.attr({
                x: nameBB.x - this.mOptions.layout.textpadding,
                y: nameBB.y - this.mOptions.layout.textpadding,
                width: nameBB.width + this.mOptions.layout.textpadding * 2,
                height: nameBB.height + this.mOptions.layout.textpadding * 2,
            });
        }
    },
});

/**
 * This function is called the first time the node is added to a paper. Used to initialize the layout because actual text
 * sizes are not computed until the text has been added to the paper.
 *
 * @method onEnter
 */
Label.prototype.onEnter = function() {
    if (this.mMaxNameWidth) {
        this.trimTextToFit(this.mNameText.node, this.mMaxNameWidth);
    }

    /* set the name background size and position */
    var nameBB = this.mNameText.getBBox();
    this.mNameBackground.attr({
        x: nameBB.x - this.mOptions.layout.textpadding,
        y: nameBB.y - this.mOptions.layout.textpadding,
        width: nameBB.width + this.mOptions.layout.textpadding * 2,
        height: nameBB.height + this.mOptions.layout.textpadding * 2,
    });

    /* if configured to skip the text count label when the count is 1, return */
    var countInt = parseInt(this.count, 10);
    if (!this.mOptions.config.displayLabelsAtOneCount && countInt <= 1) {
        this.mCountGroup.remove();
        return;
    }

    /* set the count text position */
    this.mCountText.attr({
        x: 0,
        y: this.mOptions.layout.textpadding + (nameBB.y2 - nameBB.y) - nameBB.y,
    });

    /* set the total count text position */
    if (this.mOptions.config.displayTotalCountLabel) {
        var countBB = this.mCountText.getBBox();
        this.mTotalCountText.attr({
            x: countBB.x2,
            y: countBB.y2 - (this.mTotalCountText.getBBox().height * 0.5),
        });
    }
};

/**
 * Utility function used to trim the text in the given text `element` to the desired `width` in pixels.
 *
 * @method trimTextToFit
 * @param {Element} element - The SVG text element containing the string to truncate.
 * @param {Number} width - The desired with of the text in pixels.
 */
Label.prototype.trimTextToFit = function (element, width) {
    var text = element.textContent;
    try {
        /* Start off with ComputedTextLength to get the length of string. The result will always be >=0.
         *  Use GetSubStringLength for calculating elipsis if needed. Solves for case where getComputedTextLength == 0.
         *  (element has not been rendered yet but we're trying to calculate the text value) */
        var x;
        if (element.getComputedTextLength() >= width) {
            for (x = text.length - 3; x > 0; x -= 3) {
                if (element.getSubStringLength(0, x) <= width) {
                    element.textContent = text.substring(0, x) + '...';
                    return;
                }
            }
            element.textContent = '...'; // can't place at all
        }
    } catch (e) {
        var bbox = element.getBBox();
        var y;
        if (bbox.width > width) {
            for (y = text.length - 3; y > 0; y -= 3) {
                element.textContent = text.substring(0, y) + '...';
                bbox = element.getBBox();
                if (bbox.width <= width) {
                    return;
                }
            }
            element.textContent = '...'; // can't place at all
        }
    }
};


/**
 * @export
 * @type {Label}
 */
module.exports = Label;

},{"./personas.core.node.js":8,"snapsvg":4}],24:[function(require,module,exports){
/**
 * Copyright (c) 2016 Uncharted Software Inc.
 * http://www.uncharted.software/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* enable strict mode */
'use strict';

/* import modules */
var Node = require('./personas.core.node.js');

/**
 * Class that represents a persona seed graphically.
 *
 * @class Seed
 * @param {Number} size - The size (diameter) of the persona seed.
 * @param {Object} info - Information about the seed persona.
 * @param {Object} globalConfig - Global configuration object.
 * @constructor
 */
function Seed(size, info, globalConfig) {
    /* inheritance */
    Node.call(this);

    /* member variables */
    this.mConfig = globalConfig;
    this.mPersonaOptions = this.mConfig.Persona;
    this.mSize = size;
    this.mRadius = size * 0.5;
    this.mParent = null;

    /* initialization */

    /* create the name text */
    this.mNameText = new Node('text', {x: 0, y: 0});
    this.mNameText.attr({
        'text-anchor': 'middle',
        'pointer-events': 'none',
    });
    this.mNameText.addClass(this.mPersonaOptions.classes.unselectable);
    this.append(this.mNameText);

    var countSpan = new Node('tspan');
    countSpan.addClass(this.mPersonaOptions.classes.seedcount);
    countSpan.node.textContent = '☍' + info.count + ' • ';
    this.mNameText.append(countSpan);

    var nameSpan = new Node('tspan');
    nameSpan.addClass(this.mPersonaOptions.classes.seedname);
    nameSpan.node.textContent = info.value || 'Related';
    this.mNameText.append(nameSpan);
}

/* inheritance */
Seed.prototype = Object.create(Node.prototype);
Seed.prototype.constructor = Seed;

/**
 * If this object was added to an 'Orbit' this property will return such object.
 *
 * @property parent
 * @type {Orbit}
 * @readonly
 */
Object.defineProperty(Seed.prototype, 'parentNode', {
    get: function () {
        return this.mParent;
    },
});

/**
 * The radius of this persona.
 *
 * @property radius
 * @type {Number}
 */
Object.defineProperty(Seed.prototype, 'radius', {
    get: function () {
        return this.mRadius;
    },

    set: function (val) {
        this.setRadius(val, false);
    },
});

/**
 * The size (or diameter) of this persona.
 *
 * @property size
 * @type {Number}
 */
Object.defineProperty(Seed.prototype, 'size', {
    get: function () {
        return this.mSize;
    },

    set: function (val) {
        this.setRadius(val * 0.5, false);
    },
});

/**
 * Utility function to change the radius of this persona. Can be animated.
 *
 * @method setRadius
 * @param {Number} newRadius - The new radius for this persona.
 * @param {Boolean} animated - Should the radius change be animated.
 */
Seed.prototype.setRadius = function (newRadius, animated) {
    if (newRadius !== this.mRadius) {
        if (!animated) {
            this.mRadius = newRadius;
            this.mSize = (newRadius * 2);
        }
    }
};

/**
 * Animates this persona's position to the new position usind the time and eased specified.
 *
 * @method animatePosition
 * @param {Point2D} position - The initial position of the persona.
 * @param {Point2D} newPosition - The final position of the persona after the animation.
 * @param {Number} time - The duration of the animation.
 * @param {Function} ease - An easing function to be used during the animation.
 */
Seed.prototype.animatePosition = function (position, newPosition, time, ease) {
    var matrix = this.transform().localMatrix;
    matrix.e = newPosition.x;
    matrix.f = newPosition.y;

    this.stop();
    this.animate({ transform: matrix }, time, ease, function() {
        /* WARNING: HACK! */
        var oldCallback = position.changedCallback;
        position.changedCallback = null;
        position.x = newPosition.x;
        position.y = newPosition.y;
        position.changedCallback = oldCallback;
    });
};

/**
 * @export
 * @type {Seed}
 */
module.exports = Seed;

},{"./personas.core.node.js":8}]},{},[13])(13)
});