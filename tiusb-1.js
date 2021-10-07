var Module = typeof Module !== "undefined" ? Module : {};
var moduleOverrides = {};
var key;
for (key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function (status, toThrow) {
    throw toThrow
};
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === "object";
ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_PTHREAD = Module["ENVIRONMENT_IS_PTHREAD"] || false;
if (ENVIRONMENT_IS_PTHREAD) {
    buffer = Module["buffer"]
}
var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : undefined;
if (ENVIRONMENT_IS_WORKER) {
    _scriptDir = self.location.href
} else if (ENVIRONMENT_IS_NODE) {
    _scriptDir = __filename
}
var scriptDirectory = "";

function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle;
var nodeFS;
var nodePath;
if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require("path").dirname(scriptDirectory) + "/"
    } else {
        scriptDirectory = __dirname + "/"
    }
    read_ = function shell_read(filename, binary) {
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        return nodeFS["readFileSync"](filename, binary ? null : "utf8")
    };
    readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        assert(ret.buffer);
        return ret
    };
    if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/")
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException", function (ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex
        }
    });
    process["on"]("unhandledRejection", abort);
    quit_ = function (status) {
        process["exit"](status)
    };
    Module["inspect"] = function () {
        return "[Emscripten Module object]"
    };
    var nodeWorkerThreads;
    try {
        nodeWorkerThreads = require("worker_threads")
    } catch (e) {
        console.error('The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?');
        throw e
    }
    global.Worker = nodeWorkerThreads.Worker
} else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
        read_ = function shell_read(f) {
            return read(f)
        }
    }
    readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f))
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data
    };
    if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs
    } else if (typeof arguments != "undefined") {
        arguments_ = arguments
    }
    if (typeof quit === "function") {
        quit_ = function (status) {
            quit(status)
        }
    }
    if (typeof print !== "undefined") {
        if (typeof console === "undefined") console = {};
        console.log = print;
        console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (typeof document !== "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
    } else {
        scriptDirectory = ""
    }
    if (ENVIRONMENT_IS_NODE) {
        read_ = function shell_read(filename, binary) {
            if (!nodeFS) nodeFS = require("fs");
            if (!nodePath) nodePath = require("path");
            filename = nodePath["normalize"](filename);
            return nodeFS["readFileSync"](filename, binary ? null : "utf8")
        };
        readBinary = function readBinary(filename) {
            var ret = read_(filename, true);
            if (!ret.buffer) {
                ret = new Uint8Array(ret)
            }
            assert(ret.buffer);
            return ret
        }
    } else {
        read_ = function (url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText
        };
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = function (url) {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
            }
        }
        readAsync = function (url, onload, onerror) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function () {
                if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return
                }
                onerror()
            };
            xhr.onerror = onerror;
            xhr.send(null)
        }
    }
    setWindowTitle = function (title) {
        document.title = title
    }
} else { }
if (ENVIRONMENT_IS_NODE) {
    if (typeof performance === "undefined") {
        global.performance = require("perf_hooks").performance
    }
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];
var STACK_ALIGN = 16;

function alignMemory(size, factor) {
    if (!factor) factor = STACK_ALIGN;
    return Math.ceil(size / factor) * factor
}

function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text)
    }
}
var tempRet0 = 0;
var setTempRet0 = function (value) {
    tempRet0 = value
};
var getTempRet0 = function () {
    return tempRet0
};
var Atomics_load = Atomics.load;
var Atomics_store = Atomics.store;
var Atomics_compareExchange = Atomics.compareExchange;
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime = Module["noExitRuntime"] || true;
if (typeof WebAssembly !== "object") {
    abort("no native wasm support detected")
}

function getValue(ptr, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            return HEAP8[ptr >> 0];
        case "i8":
            return HEAP8[ptr >> 0];
        case "i16":
            return HEAP16[ptr >> 1];
        case "i32":
            return HEAP32[ptr >> 2];
        case "i64":
            return HEAP32[ptr >> 2];
        case "float":
            return HEAPF32[ptr >> 2];
        case "double":
            return HEAPF64[ptr >> 3];
        default:
            abort("invalid type for getValue: " + type)
    }
    return null
}
var wasmMemory;
var wasmModule;
var ABORT = false;
var EXITSTATUS;

function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}

function getCFunc(ident) {
    var func = Module["_" + ident];
    assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
    return func
}

function ccall(ident, returnType, argTypes, args, opts) {
    var toC = {
        "string": function (str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                var len = (str.length << 2) + 1;
                ret = stackAlloc(len);
                stringToUTF8(str, ret, len)
            }
            return ret
        },
        "array": function (arr) {
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }
    };

    function convertReturnValue(ret) {
        if (returnType === "string") return UTF8ToString(ret);
        if (returnType === "boolean") return Boolean(ret);
        return ret
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0) stack = stackSave();
                cArgs[i] = converter(args[i])
            } else {
                cArgs[i] = args[i]
            }
        }
    }
    var ret = func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack !== 0) stackRestore(stack);
    return ret
}

function cwrap(ident, returnType, argTypes, opts) {
    argTypes = argTypes || [];
    var numericArgs = argTypes.every(function (type) {
        return type === "number"
    });
    var numericRet = returnType !== "string";
    if (numericRet && numericArgs && !opts) {
        return getCFunc(ident)
    }
    return function () {
        return ccall(ident, returnType, argTypes, arguments, opts)
    }
}
var ALLOC_NORMAL = 0;

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var str = "";
    while (!(idx >= endIdx)) {
        var u0 = heap[idx++];
        if (!u0) return str;
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue
        }
        var u1 = heap[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue
        }
        var u2 = heap[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2
        } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0)
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
        }
    }
    return str
}

function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++] = 192 | u >> 6;
            heap[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++] = 224 | u >> 12;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx) break;
            heap[outIdx++] = 240 | u >> 18;
            heap[outIdx++] = 128 | u >> 12 & 63;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}

function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) ++len;
        else if (u <= 2047) len += 2;
        else if (u <= 65535) len += 3;
        else len += 4
    }
    return len
}

function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}

function allocateUTF8OnStack(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}

function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
}
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 50331648;
if (ENVIRONMENT_IS_PTHREAD) {
    wasmMemory = Module["wasmMemory"];
    buffer = Module["buffer"]
} else {
    if (Module["wasmMemory"]) {
        wasmMemory = Module["wasmMemory"]
    } else {
        wasmMemory = new WebAssembly.Memory({
            "initial": INITIAL_MEMORY / 65536,
            "maximum": INITIAL_MEMORY / 65536,
            "shared": true
        });
        if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
            err("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag");
            if (ENVIRONMENT_IS_NODE) {
                console.log("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and also use a recent version)")
            }
            throw Error("bad memory")
        }
    }
}
if (wasmMemory) {
    buffer = wasmMemory.buffer
}
INITIAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
    if (ENVIRONMENT_IS_PTHREAD) return;
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}

function initRuntime() {
    runtimeInitialized = true;
    if (ENVIRONMENT_IS_PTHREAD) return;
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
    TTY.init();
    callRuntimeCallbacks(__ATINIT__)
}

function preMain() {
    if (ENVIRONMENT_IS_PTHREAD) return;
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__)
}

function exitRuntime() {
    if (ENVIRONMENT_IS_PTHREAD) return;
    runtimeExited = true
}

function postRun() {
    if (ENVIRONMENT_IS_PTHREAD) return;
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}

function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}

function addOnInit(cb) {
    __ATINIT__.unshift(cb)
}

function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
    return id
}

function addRunDependency(id) {
    assert(!ENVIRONMENT_IS_PTHREAD, "addRunDependency cannot be used in a pthread worker");
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}

function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};

function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what)
    }
    if (ENVIRONMENT_IS_PTHREAD) console.error("Pthread aborting at " + (new Error).stack);
    what += "";
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e
}

function hasPrefix(str, prefix) {
    return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0
}
var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
    return hasPrefix(filename, dataURIPrefix)
}
var fileURIPrefix = "file://";

function isFileURI(filename) {
    return hasPrefix(filename, fileURIPrefix)
}
var wasmBinaryFile = "webconn.wasm?v=5.3.4.253";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile)
}

function getBinary(file) {
    try {
        if (file == wasmBinaryFile && wasmBinary) {
            return new Uint8Array(wasmBinary)
        }
        if (readBinary) {
            return readBinary(file)
        } else {
            throw "both async and sync fetching of the wasm failed"
        }
    } catch (err) {
        abort(err)
    }
}

function getBinaryPromise() {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function (response) {
                if (!response["ok"]) {
                    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                }
                return response["arrayBuffer"]()
            }).catch(function () {
                return getBinary(wasmBinaryFile)
            })
        } else {
            if (readAsync) {
                return new Promise(function (resolve, reject) {
                    readAsync(wasmBinaryFile, function (response) {
                        resolve(new Uint8Array(response))
                    }, reject)
                })
            }
        }
    }
    return Promise.resolve().then(function () {
        return getBinary(wasmBinaryFile)
    })
}

function createWasm() {
    var info = {
        "a": asmLibraryArg
    };

    function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        wasmTable = Module["asm"]["pa"];
        addOnInit(Module["asm"]["la"]);
        PThread.tlsInitFunctions.push(Module["asm"]["La"]);
        wasmModule = module;
        if (!ENVIRONMENT_IS_PTHREAD) {
            var numWorkersToLoad = PThread.unusedWorkers.length;
            PThread.unusedWorkers.forEach(function (w) {
                PThread.loadWasmModuleToWorker(w, function () {
                    if (!--numWorkersToLoad) removeRunDependency("wasm-instantiate")
                })
            })
        }
    }
    if (!ENVIRONMENT_IS_PTHREAD) {
        addRunDependency("wasm-instantiate")
    }

    function receiveInstantiatedSource(output) {
        receiveInstance(output["instance"], output["module"])
    }

    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function (binary) {
            var result = WebAssembly.instantiate(binary, info);
            return result
        }).then(receiver, function (reason) {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason)
        })
    }

    function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function (response) {
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(receiveInstantiatedSource, function (reason) {
                    err("wasm streaming compile failed: " + reason);
                    err("falling back to ArrayBuffer instantiation");
                    return instantiateArrayBuffer(receiveInstantiatedSource)
                })
            })
        } else {
            return instantiateArrayBuffer(receiveInstantiatedSource)
        }
    }
    if (Module["instantiateWasm"]) {
        try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            return exports
        } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false
        }
    }
    instantiateAsync();
    return {}
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
    39380: function () {
        throw "Canceled!"
    },
    39398: function ($0, $1) {
        setTimeout(function () {
            __emscripten_do_dispatch_to_thread($0, $1)
        }, 0)
    }
};

function initPthreadsJS() {
    PThread.initRuntime()
}

function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback(Module);
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                wasmTable.get(func)()
            } else {
                wasmTable.get(func)(callback.arg)
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg)
        }
    }
}
var ERRNO_CODES = {
    EPERM: 63,
    ENOENT: 44,
    ESRCH: 71,
    EINTR: 27,
    EIO: 29,
    ENXIO: 60,
    E2BIG: 1,
    ENOEXEC: 45,
    EBADF: 8,
    ECHILD: 12,
    EAGAIN: 6,
    EWOULDBLOCK: 6,
    ENOMEM: 48,
    EACCES: 2,
    EFAULT: 21,
    ENOTBLK: 105,
    EBUSY: 10,
    EEXIST: 20,
    EXDEV: 75,
    ENODEV: 43,
    ENOTDIR: 54,
    EISDIR: 31,
    EINVAL: 28,
    ENFILE: 41,
    EMFILE: 33,
    ENOTTY: 59,
    ETXTBSY: 74,
    EFBIG: 22,
    ENOSPC: 51,
    ESPIPE: 70,
    EROFS: 69,
    EMLINK: 34,
    EPIPE: 64,
    EDOM: 18,
    ERANGE: 68,
    ENOMSG: 49,
    EIDRM: 24,
    ECHRNG: 106,
    EL2NSYNC: 156,
    EL3HLT: 107,
    EL3RST: 108,
    ELNRNG: 109,
    EUNATCH: 110,
    ENOCSI: 111,
    EL2HLT: 112,
    EDEADLK: 16,
    ENOLCK: 46,
    EBADE: 113,
    EBADR: 114,
    EXFULL: 115,
    ENOANO: 104,
    EBADRQC: 103,
    EBADSLT: 102,
    EDEADLOCK: 16,
    EBFONT: 101,
    ENOSTR: 100,
    ENODATA: 116,
    ETIME: 117,
    ENOSR: 118,
    ENONET: 119,
    ENOPKG: 120,
    EREMOTE: 121,
    ENOLINK: 47,
    EADV: 122,
    ESRMNT: 123,
    ECOMM: 124,
    EPROTO: 65,
    EMULTIHOP: 36,
    EDOTDOT: 125,
    EBADMSG: 9,
    ENOTUNIQ: 126,
    EBADFD: 127,
    EREMCHG: 128,
    ELIBACC: 129,
    ELIBBAD: 130,
    ELIBSCN: 131,
    ELIBMAX: 132,
    ELIBEXEC: 133,
    ENOSYS: 52,
    ENOTEMPTY: 55,
    ENAMETOOLONG: 37,
    ELOOP: 32,
    EOPNOTSUPP: 138,
    EPFNOSUPPORT: 139,
    ECONNRESET: 15,
    ENOBUFS: 42,
    EAFNOSUPPORT: 5,
    EPROTOTYPE: 67,
    ENOTSOCK: 57,
    ENOPROTOOPT: 50,
    ESHUTDOWN: 140,
    ECONNREFUSED: 14,
    EADDRINUSE: 3,
    ECONNABORTED: 13,
    ENETUNREACH: 40,
    ENETDOWN: 38,
    ETIMEDOUT: 73,
    EHOSTDOWN: 142,
    EHOSTUNREACH: 23,
    EINPROGRESS: 26,
    EALREADY: 7,
    EDESTADDRREQ: 17,
    EMSGSIZE: 35,
    EPROTONOSUPPORT: 66,
    ESOCKTNOSUPPORT: 137,
    EADDRNOTAVAIL: 4,
    ENETRESET: 39,
    EISCONN: 30,
    ENOTCONN: 53,
    ETOOMANYREFS: 141,
    EUSERS: 136,
    EDQUOT: 19,
    ESTALE: 72,
    ENOTSUP: 138,
    ENOMEDIUM: 148,
    EILSEQ: 25,
    EOVERFLOW: 61,
    ECANCELED: 11,
    ENOTRECOVERABLE: 56,
    EOWNERDEAD: 62,
    ESTRPIPE: 135
};

function _emscripten_futex_wake(addr, count) {
    if (addr <= 0 || addr > HEAP8.length || addr & 3 != 0 || count < 0) return -28;
    if (count == 0) return 0;
    if (count >= 2147483647) count = Infinity;
    var mainThreadWaitAddress = Atomics.load(HEAP32, __emscripten_main_thread_futex >> 2);
    var mainThreadWoken = 0;
    if (mainThreadWaitAddress == addr) {
        var loadedAddr = Atomics.compareExchange(HEAP32, __emscripten_main_thread_futex >> 2, mainThreadWaitAddress, 0);
        if (loadedAddr == mainThreadWaitAddress) {
            --count;
            mainThreadWoken = 1;
            if (count <= 0) return 1
        }
    }
    var ret = Atomics.notify(HEAP32, addr >> 2, count);
    if (ret >= 0) return ret + mainThreadWoken;
    throw "Atomics.notify returned an unexpected value " + ret
}
Module["_emscripten_futex_wake"] = _emscripten_futex_wake;

function killThread(pthread_ptr) {
    if (ENVIRONMENT_IS_PTHREAD) throw "Internal Error! killThread() can only ever be called from main application thread!";
    if (!pthread_ptr) throw "Internal Error! Null pthread_ptr in killThread!";
    HEAP32[pthread_ptr + 12 >> 2] = 0;
    var pthread = PThread.pthreads[pthread_ptr];
    pthread.worker.terminate();
    PThread.freeThreadData(pthread);
    PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(pthread.worker), 1);
    pthread.worker.pthread = undefined
}

function cancelThread(pthread_ptr) {
    if (ENVIRONMENT_IS_PTHREAD) throw "Internal Error! cancelThread() can only ever be called from main application thread!";
    if (!pthread_ptr) throw "Internal Error! Null pthread_ptr in cancelThread!";
    var pthread = PThread.pthreads[pthread_ptr];
    pthread.worker.postMessage({
        "cmd": "cancel"
    })
}

function cleanupThread(pthread_ptr) {
    if (ENVIRONMENT_IS_PTHREAD) throw "Internal Error! cleanupThread() can only ever be called from main application thread!";
    if (!pthread_ptr) throw "Internal Error! Null pthread_ptr in cleanupThread!";
    var pthread = PThread.pthreads[pthread_ptr];
    if (pthread) {
        HEAP32[pthread_ptr + 12 >> 2] = 0;
        var worker = pthread.worker;
        PThread.returnWorkerToPool(worker)
    }
}
var PThread = {
    unusedWorkers: [],
    runningWorkers: [],
    tlsInitFunctions: [],
    initMainThreadBlock: function () {
        var pthreadPoolSize = 3;
        for (var i = 0; i < pthreadPoolSize; ++i) {
            PThread.allocateUnusedWorker()
        }
    },
    initRuntime: function () {
        var tb = _malloc(228);
        for (var i = 0; i < 228 / 4; ++i) HEAPU32[tb / 4 + i] = 0;
        HEAP32[tb + 12 >> 2] = tb;
        var headPtr = tb + 152;
        HEAP32[headPtr >> 2] = headPtr;
        var tlsMemory = _malloc(512);
        for (var i = 0; i < 128; ++i) HEAPU32[tlsMemory / 4 + i] = 0;
        Atomics.store(HEAPU32, tb + 100 >> 2, tlsMemory);
        Atomics.store(HEAPU32, tb + 40 >> 2, tb);
        __emscripten_thread_init(tb, !ENVIRONMENT_IS_WORKER, 1);
        _emscripten_register_main_browser_thread_id(tb)
    },
    initWorker: function () { },
    pthreads: {},
    threadExitHandlers: [],
    setThreadStatus: function () { },
    runExitHandlers: function () {
        while (PThread.threadExitHandlers.length > 0) {
            PThread.threadExitHandlers.pop()()
        }
        if (ENVIRONMENT_IS_PTHREAD && _pthread_self()) ___pthread_tsd_run_dtors()
    },
    runExitHandlersAndDeinitThread: function (tb, exitCode) {
        Atomics.store(HEAPU32, tb + 56 >> 2, 1);
        Atomics.store(HEAPU32, tb + 60 >> 2, 0);
        PThread.runExitHandlers();
        Atomics.store(HEAPU32, tb + 4 >> 2, exitCode);
        Atomics.store(HEAPU32, tb + 0 >> 2, 1);
        _emscripten_futex_wake(tb + 0, 2147483647);
        __emscripten_thread_init(0, 0, 0)
    },
    setExitStatus: function (status) {
        EXITSTATUS = status
    },
    threadExit: function (exitCode) {
        var tb = _pthread_self();
        if (tb) {
            PThread.runExitHandlersAndDeinitThread(tb, exitCode);
            if (ENVIRONMENT_IS_PTHREAD) {
                postMessage({
                    "cmd": "exit"
                })
            }
        }
    },
    threadCancel: function () {
        PThread.runExitHandlersAndDeinitThread(_pthread_self(), -1);
        postMessage({
            "cmd": "cancelDone"
        })
    },
    terminateAllThreads: function () {
        for (var t in PThread.pthreads) {
            var pthread = PThread.pthreads[t];
            if (pthread && pthread.worker) {
                PThread.returnWorkerToPool(pthread.worker)
            }
        }
        PThread.pthreads = {};
        for (var i = 0; i < PThread.unusedWorkers.length; ++i) {
            var worker = PThread.unusedWorkers[i];
            worker.terminate()
        }
        PThread.unusedWorkers = [];
        for (var i = 0; i < PThread.runningWorkers.length; ++i) {
            var worker = PThread.runningWorkers[i];
            var pthread = worker.pthread;
            PThread.freeThreadData(pthread);
            worker.terminate()
        }
        PThread.runningWorkers = []
    },
    freeThreadData: function (pthread) {
        if (!pthread) return;
        if (pthread.threadInfoStruct) {
            var tlsMemory = HEAP32[pthread.threadInfoStruct + 100 >> 2];
            HEAP32[pthread.threadInfoStruct + 100 >> 2] = 0;
            _free(tlsMemory);
            _free(pthread.threadInfoStruct)
        }
        pthread.threadInfoStruct = 0;
        if (pthread.allocatedOwnStack && pthread.stackBase) _free(pthread.stackBase);
        pthread.stackBase = 0;
        if (pthread.worker) pthread.worker.pthread = null
    },
    returnWorkerToPool: function (worker) {
        PThread.runWithoutMainThreadQueuedCalls(function () {
            delete PThread.pthreads[worker.pthread.threadInfoStruct];
            PThread.unusedWorkers.push(worker);
            PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
            PThread.freeThreadData(worker.pthread);
            worker.pthread = undefined
        })
    },
    runWithoutMainThreadQueuedCalls: function (func) {
        HEAP32[__emscripten_allow_main_runtime_queued_calls >> 2] = 0;
        try {
            func()
        } finally {
            HEAP32[__emscripten_allow_main_runtime_queued_calls >> 2] = 1
        }
    },
    receiveObjectTransfer: function (data) { },
    threadInit: function () {
        PThread.setThreadStatus(_pthread_self(), 1);
        for (var i in PThread.tlsInitFunctions) {
            PThread.tlsInitFunctions[i]()
        }
    },
    loadWasmModuleToWorker: function (worker, onFinishedLoading) {
        worker.onmessage = function (e) {
            var d = e["data"];
            var cmd = d["cmd"];
            if (worker.pthread) PThread.currentProxiedOperationCallerThread = worker.pthread.threadInfoStruct;
            if (d["targetThread"] && d["targetThread"] != _pthread_self()) {
                var thread = PThread.pthreads[d.targetThread];
                if (thread) {
                    thread.worker.postMessage(e.data, d["transferList"])
                } else {
                    console.error('Internal error! Worker sent a message "' + cmd + '" to target pthread ' + d["targetThread"] + ", but that thread no longer exists!")
                }
                PThread.currentProxiedOperationCallerThread = undefined;
                return
            }
            if (cmd === "processQueuedMainThreadWork") {
                _emscripten_main_thread_process_queued_calls()
            } else if (cmd === "spawnThread") {
                spawnThread(e.data)
            } else if (cmd === "cleanupThread") {
                cleanupThread(d["thread"])
            } else if (cmd === "killThread") {
                killThread(d["thread"])
            } else if (cmd === "cancelThread") {
                cancelThread(d["thread"])
            } else if (cmd === "loaded") {
                worker.loaded = true;
                if (onFinishedLoading) onFinishedLoading(worker);
                if (worker.runPthread) {
                    worker.runPthread();
                    delete worker.runPthread
                }
            } else if (cmd === "print") {
                out("Thread " + d["threadId"] + ": " + d["text"])
            } else if (cmd === "printErr") {
                err("Thread " + d["threadId"] + ": " + d["text"])
            } else if (cmd === "alert") {
                alert("Thread " + d["threadId"] + ": " + d["text"])
            } else if (cmd === "exit") {
                var detached = worker.pthread && Atomics.load(HEAPU32, worker.pthread.threadInfoStruct + 64 >> 2);
                if (detached) {
                    PThread.returnWorkerToPool(worker)
                }
            } else if (cmd === "exitProcess") {
                try {
                    exit(d["returnCode"])
                } catch (e) {
                    if (e instanceof ExitStatus) return;
                    throw e
                }
            } else if (cmd === "cancelDone") {
                PThread.returnWorkerToPool(worker)
            } else if (cmd === "objectTransfer") {
                PThread.receiveObjectTransfer(e.data)
            } else if (e.data.target === "setimmediate") {
                worker.postMessage(e.data)
            } else {
                err("worker sent an unknown command " + cmd)
            }
            PThread.currentProxiedOperationCallerThread = undefined
        };
        worker.onerror = function (e) {
            err("pthread sent an error! " + e.filename + ":" + e.lineno + ": " + e.message)
        };
        if (ENVIRONMENT_IS_NODE) {
            worker.on("message", function (data) {
                worker.onmessage({
                    data: data
                })
            });
            worker.on("error", function (data) {
                worker.onerror(data)
            });
            worker.on("exit", function (data) { })
        }
        worker.postMessage({
            "cmd": "load",
            "urlOrBlob": Module["mainScriptUrlOrBlob"] || _scriptDir,
            "wasmMemory": wasmMemory,
            "wasmModule": wasmModule
        })
    },
    allocateUnusedWorker: function () {
        var pthreadMainJs = locateFile("webconn.worker.js");
        PThread.unusedWorkers.push(new Worker(pthreadMainJs))
    },
    getNewWorker: function () {
        if (PThread.unusedWorkers.length == 0) {
            PThread.allocateUnusedWorker();
            PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0])
        }
        return PThread.unusedWorkers.pop()
    },
    busySpinWait: function (msecs) {
        var t = performance.now() + msecs;
        while (performance.now() < t) { }
    }
};

function establishStackSpace(stackTop, stackMax) {
    _emscripten_stack_set_limits(stackTop, stackMax);
    stackRestore(stackTop)
}
Module["establishStackSpace"] = establishStackSpace;

function invokeEntryPoint(ptr, arg) {
    return wasmTable.get(ptr)(arg)
}
Module["invokeEntryPoint"] = invokeEntryPoint;
var runtimeKeepaliveCounter = 0;

function keepRuntimeAlive() {
    return noExitRuntime || runtimeKeepaliveCounter > 0
}
Module["keepRuntimeAlive"] = keepRuntimeAlive;

function _JSPAL_Loaded() {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(1, 1);
    Module.resolveInitialization()
}

function _TI_JSPAL_eventCallback(event) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(2, 1, event);
    TICalculatorCCode.getInstance().eventCallback(event)
}

function _TI_WEBUSBJS_Init() {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(3, 1);
    TI_USB.getInstance().addOnDeviceAddedListener(webUSBDevice => {
        let tiDeviceIndex = TI_DeviceManager.getInstance().addDevice(webUSBDevice);
        TICalculatorCCode.getInstance().deviceAdded(tiDeviceIndex)
    });
    TI_USB.getInstance().addOnDeviceRemovedListener(webUSBDevice => {
        if (TI_DeviceManager.getInstance().removeDevice(webUSBDevice)) {
            TICalculatorCCode.getInstance().deviceRemoved(0)
        }
    })
}

function _TI_WEBUSBJS_IsOpen(deviceId) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(4, 1, deviceId);
    if (deviceId >= 0) {
        let device = TI_DeviceManager.getInstance().getDevice(deviceId);
        return device && device.open
    } else {
        return false
    }
}

function _TI_WEBUSBJS_Open(deviceId) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(5, 1, deviceId);
    if (deviceId >= 0) {
        let tidevice = TI_DeviceManager.getInstance().getDevice(deviceId);
        TI_USB.getInstance().openDevice(tidevice).then(d => {
            return true
        }).catch(error => {
            console.error(`couldn't open device ${deviceId}, ${error}`);
            tidevice.webUSBDevice.close();
            TICalculatorCCode.getInstance().connectionFailedCallback();
            return false
        })
    } else {
        console.error(`couldn't open device ${deviceId}, not connected?`);
        return false
    }
}

function _TI_WEBUSBJS_ReadAsync(deviceId, reader, buffer) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(6, 0, deviceId, reader, buffer);
    if (deviceId >= 0) {
        let device = TI_DeviceManager.getInstance().getDevice(deviceId);
        TI_USB.getInstance().read(device).then(result => {
            TICalculatorCCode.getInstance().setArrayInModule(result, buffer);
            TICalculatorCCode.getInstance().readCallback(reader, result.length);
            return true
        }).catch(error => {
            console.error(`couldn't read from device ${deviceId}, ${error}`);
            TICalculatorCCode.getInstance().readCallback(reader, 0);
            TICalculatorCCode.getInstance().deviceRemoved(0);
            return false
        })
    } else {
        console.error(`couldn't read from device ${deviceId}, not connected?`);
        return false
    }
}

function _TI_WEBUSBJS_RequestDevices() {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(7, 0);
    TI_USB.getInstance().getDevices().then(webUSBDevice => {
        let tiDeviceIndex = TI_DeviceManager.getInstance().addDevice(webUSBDevice);
        TICalculatorCCode.getInstance().deviceAdded(tiDeviceIndex);
        TICalculatorCCode.getInstance().connectingCallback()
    }).catch(error => {
        TICalculatorCCode.getInstance().noDeviceSelectionCallback();
        console.log(`${error}`)
    })
}

function _TI_WEBUSBJS_Write(deviceId, pBuf, iLen) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(8, 1, deviceId, pBuf, iLen);
    let data = TICalculatorCCode.getInstance().getUint8ArrayFromCbuffer(pBuf, pBuf + iLen);
    let device = TI_DeviceManager.getInstance().getDevice(deviceId);
    TI_USB.getInstance().write(device, data).then(() => {
        return true
    }).catch(error => {
        console.error("TI_WEBUSBJS_WRITE: " + error);
        return false
    })
}

function _tzset() {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(9, 1);
    if (_tzset.called) return;
    _tzset.called = true;
    var currentYear = (new Date).getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAP32[__get_timezone() >> 2] = stdTimezoneOffset * 60;
    HEAP32[__get_daylight() >> 2] = Number(winterOffset != summerOffset);

    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT"
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = allocateUTF8(winterName);
    var summerNamePtr = allocateUTF8(summerName);
    if (summerOffset < winterOffset) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
    } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
    }
}

function _asctime_r(tmPtr, buf) {
    var date = {
        tm_sec: HEAP32[tmPtr >> 2],
        tm_min: HEAP32[tmPtr + 4 >> 2],
        tm_hour: HEAP32[tmPtr + 8 >> 2],
        tm_mday: HEAP32[tmPtr + 12 >> 2],
        tm_mon: HEAP32[tmPtr + 16 >> 2],
        tm_year: HEAP32[tmPtr + 20 >> 2],
        tm_wday: HEAP32[tmPtr + 24 >> 2]
    };
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var s = days[date.tm_wday] + " " + months[date.tm_mon] + (date.tm_mday < 10 ? "  " : " ") + date.tm_mday + (date.tm_hour < 10 ? " 0" : " ") + date.tm_hour + (date.tm_min < 10 ? ":0" : ":") + date.tm_min + (date.tm_sec < 10 ? ":0" : ":") + date.tm_sec + " " + (1900 + date.tm_year) + "\n";
    stringToUTF8(s, buf, 26);
    return buf
}

function ___asctime_r(a0, a1) {
    return _asctime_r(a0, a1)
}

function ___assert_fail(condition, filename, line, func) {
    abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
}

function ___call_main(argc, argv) {
    var returnCode = _main(argc, argv)
}
var _emscripten_get_now;
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function () {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6
    }
} else if (ENVIRONMENT_IS_PTHREAD) {
    _emscripten_get_now = function () {
        return performance.now() - Module["__performance_now_clock_drift"]
    }
} else if (typeof dateNow !== "undefined") {
    _emscripten_get_now = dateNow
} else _emscripten_get_now = function () {
    return performance.now()
};
var _emscripten_get_now_is_monotonic = true;

function setErrNo(value) {
    HEAP32[___errno_location() >> 2] = value;
    return value
}

function _clock_gettime(clk_id, tp) {
    var now;
    if (clk_id === 0) {
        now = Date.now()
    } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
        now = _emscripten_get_now()
    } else {
        setErrNo(28);
        return -1
    }
    HEAP32[tp >> 2] = now / 1e3 | 0;
    HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
    return 0
}

function ___clock_gettime(a0, a1) {
    return _clock_gettime(a0, a1)
}
var ExceptionInfoAttrs = {
    DESTRUCTOR_OFFSET: 0,
    REFCOUNT_OFFSET: 4,
    TYPE_OFFSET: 8,
    CAUGHT_OFFSET: 12,
    RETHROWN_OFFSET: 13,
    SIZE: 16
};

function ___cxa_allocate_exception(size) {
    return _malloc(size + ExceptionInfoAttrs.SIZE) + ExceptionInfoAttrs.SIZE
}

function _atexit(func, arg) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(10, 1, func, arg)
}

function ExceptionInfo(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - ExceptionInfoAttrs.SIZE;
    this.set_type = function (type) {
        HEAP32[this.ptr + ExceptionInfoAttrs.TYPE_OFFSET >> 2] = type
    };
    this.get_type = function () {
        return HEAP32[this.ptr + ExceptionInfoAttrs.TYPE_OFFSET >> 2]
    };
    this.set_destructor = function (destructor) {
        HEAP32[this.ptr + ExceptionInfoAttrs.DESTRUCTOR_OFFSET >> 2] = destructor
    };
    this.get_destructor = function () {
        return HEAP32[this.ptr + ExceptionInfoAttrs.DESTRUCTOR_OFFSET >> 2]
    };
    this.set_refcount = function (refcount) {
        HEAP32[this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2] = refcount
    };
    this.set_caught = function (caught) {
        caught = caught ? 1 : 0;
        HEAP8[this.ptr + ExceptionInfoAttrs.CAUGHT_OFFSET >> 0] = caught
    };
    this.get_caught = function () {
        return HEAP8[this.ptr + ExceptionInfoAttrs.CAUGHT_OFFSET >> 0] != 0
    };
    this.set_rethrown = function (rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[this.ptr + ExceptionInfoAttrs.RETHROWN_OFFSET >> 0] = rethrown
    };
    this.get_rethrown = function () {
        return HEAP8[this.ptr + ExceptionInfoAttrs.RETHROWN_OFFSET >> 0] != 0
    };
    this.init = function (type, destructor) {
        this.set_type(type);
        this.set_destructor(destructor);
        this.set_refcount(0);
        this.set_caught(false);
        this.set_rethrown(false)
    };
    this.add_ref = function () {
        Atomics.add(HEAP32, this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2, 1)
    };
    this.release_ref = function () {
        var prev = Atomics.sub(HEAP32, this.ptr + ExceptionInfoAttrs.REFCOUNT_OFFSET >> 2, 1);
        return prev === 1
    }
}

function CatchInfo(ptr) {
    this.free = function () {
        _free(this.ptr);
        this.ptr = 0
    };
    this.set_base_ptr = function (basePtr) {
        HEAP32[this.ptr >> 2] = basePtr
    };
    this.get_base_ptr = function () {
        return HEAP32[this.ptr >> 2]
    };
    this.set_adjusted_ptr = function (adjustedPtr) {
        var ptrSize = 4;
        HEAP32[this.ptr + ptrSize >> 2] = adjustedPtr
    };
    this.get_adjusted_ptr = function () {
        var ptrSize = 4;
        return HEAP32[this.ptr + ptrSize >> 2]
    };
    this.get_exception_ptr = function () {
        var isPointer = ___cxa_is_pointer_type(this.get_exception_info().get_type());
        if (isPointer) {
            return HEAP32[this.get_base_ptr() >> 2]
        }
        var adjusted = this.get_adjusted_ptr();
        if (adjusted !== 0) return adjusted;
        return this.get_base_ptr()
    };
    this.get_exception_info = function () {
        return new ExceptionInfo(this.get_base_ptr())
    };
    if (ptr === undefined) {
        this.ptr = _malloc(8);
        this.set_adjusted_ptr(0)
    } else {
        this.ptr = ptr
    }
}
var exceptionCaught = [];

function exception_addRef(info) {
    info.add_ref()
}
var uncaughtExceptionCount = 0;

function ___cxa_begin_catch(ptr) {
    var catchInfo = new CatchInfo(ptr);
    var info = catchInfo.get_exception_info();
    if (!info.get_caught()) {
        info.set_caught(true);
        uncaughtExceptionCount--
    }
    info.set_rethrown(false);
    exceptionCaught.push(catchInfo);
    exception_addRef(info);
    return catchInfo.get_exception_ptr()
}
var exceptionLast = 0;

function ___cxa_free_exception(ptr) {
    return _free(new ExceptionInfo(ptr).ptr)
}

function exception_decRef(info) {
    if (info.release_ref() && !info.get_rethrown()) {
        var destructor = info.get_destructor();
        if (destructor) {
            wasmTable.get(destructor)(info.excPtr)
        }
        ___cxa_free_exception(info.excPtr)
    }
}

function ___cxa_end_catch() {
    _setThrew(0);
    var catchInfo = exceptionCaught.pop();
    exception_decRef(catchInfo.get_exception_info());
    catchInfo.free();
    exceptionLast = 0
}

function ___resumeException(catchInfoPtr) {
    var catchInfo = new CatchInfo(catchInfoPtr);
    var ptr = catchInfo.get_base_ptr();
    if (!exceptionLast) {
        exceptionLast = ptr
    }
    catchInfo.free();
    throw ptr
}

function ___cxa_find_matching_catch_2() {
    var thrown = exceptionLast;
    if (!thrown) {
        setTempRet0(0 | 0);
        return 0 | 0
    }
    var info = new ExceptionInfo(thrown);
    var thrownType = info.get_type();
    var catchInfo = new CatchInfo;
    catchInfo.set_base_ptr(thrown);
    if (!thrownType) {
        setTempRet0(0 | 0);
        return catchInfo.ptr | 0
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var stackTop = stackSave();
    var exceptionThrowBuf = stackAlloc(4);
    HEAP32[exceptionThrowBuf >> 2] = thrown;
    for (var i = 0; i < typeArray.length; i++) {
        var caughtType = typeArray[i];
        if (caughtType === 0 || caughtType === thrownType) {
            break
        }
        if (___cxa_can_catch(caughtType, thrownType, exceptionThrowBuf)) {
            var adjusted = HEAP32[exceptionThrowBuf >> 2];
            if (thrown !== adjusted) {
                catchInfo.set_adjusted_ptr(adjusted)
            }
            setTempRet0(caughtType | 0);
            return catchInfo.ptr | 0
        }
    }
    stackRestore(stackTop);
    setTempRet0(thrownType | 0);
    return catchInfo.ptr | 0
}

function ___cxa_find_matching_catch_3() {
    var thrown = exceptionLast;
    if (!thrown) {
        setTempRet0(0 | 0);
        return 0 | 0
    }
    var info = new ExceptionInfo(thrown);
    var thrownType = info.get_type();
    var catchInfo = new CatchInfo;
    catchInfo.set_base_ptr(thrown);
    if (!thrownType) {
        setTempRet0(0 | 0);
        return catchInfo.ptr | 0
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var stackTop = stackSave();
    var exceptionThrowBuf = stackAlloc(4);
    HEAP32[exceptionThrowBuf >> 2] = thrown;
    for (var i = 0; i < typeArray.length; i++) {
        var caughtType = typeArray[i];
        if (caughtType === 0 || caughtType === thrownType) {
            break
        }
        if (___cxa_can_catch(caughtType, thrownType, exceptionThrowBuf)) {
            var adjusted = HEAP32[exceptionThrowBuf >> 2];
            if (thrown !== adjusted) {
                catchInfo.set_adjusted_ptr(adjusted)
            }
            setTempRet0(caughtType | 0);
            return catchInfo.ptr | 0
        }
    }
    stackRestore(stackTop);
    setTempRet0(thrownType | 0);
    return catchInfo.ptr | 0
}

function _pthread_cleanup_push(routine, arg) {
    PThread.threadExitHandlers.push(function () {
        wasmTable.get(routine)(arg)
    })
}

function ___cxa_thread_atexit(a0, a1) {
    return _pthread_cleanup_push(a0, a1)
}

function ___cxa_throw(ptr, type, destructor) {
    var info = new ExceptionInfo(ptr);
    info.init(type, destructor);
    exceptionLast = ptr;
    uncaughtExceptionCount++;
    throw ptr
}

function _localtime_r(time, tmPtr) {
    _tzset();
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var start = new Date(date.getFullYear(), 0, 1);
    var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst;
    var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
    HEAP32[tmPtr + 40 >> 2] = zonePtr;
    return tmPtr
}

function ___localtime_r(a0, a1) {
    return _localtime_r(a0, a1)
}
var PATH = {
    splitPath: function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    },
    normalizeArray: function (parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    },
    normalize: function (path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function (p) {
            return !!p
        }), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    },
    dirname: function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    },
    basename: function (path) {
        if (path === "/") return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    },
    extname: function (path) {
        return PATH.splitPath(path)[3]
    },
    join: function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    },
    join2: function (l, r) {
        return PATH.normalize(l + "/" + r)
    }
};

function getRandomDevice() {
    if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
        var randomBuffer = new Uint8Array(1);
        return function () {
            crypto.getRandomValues(randomBuffer);
            return randomBuffer[0]
        }
    } else if (ENVIRONMENT_IS_NODE) {
        try {
            var crypto_module = require("crypto");
            return function () {
                return crypto_module["randomBytes"](1)[0]
            }
        } catch (e) { }
    }
    return function () {
        abort("randomDevice")
    }
}
var PATH_FS = {
    resolve: function () {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function (p) {
            return !!p
        }), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    },
    relative: function (from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    }
};
var TTY = {
    ttys: [],
    init: function () { },
    shutdown: function () { },
    register: function (dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    },
    stream_ops: {
        open: function (stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43)
            }
            stream.tty = tty;
            stream.seekable = false
        },
        close: function (stream) {
            stream.tty.ops.flush(stream.tty)
        },
        flush: function (stream) {
            stream.tty.ops.flush(stream.tty)
        },
        read: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(29)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        },
        write: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60)
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                }
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        }
    },
    default_tty_ops: {
        get_char: function (tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    try {
                        bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null)
                    } catch (e) {
                        if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                        else throw e
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        },
        put_char: function (tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function (tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    },
    default_tty1_ops: {
        put_char: function (tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function (tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    }
};

function mmapAlloc(size) {
    var alignedSize = alignMemory(size, 16384);
    var ptr = _malloc(alignedSize);
    while (size < alignedSize) HEAP8[ptr + size++] = 0;
    return ptr
}
var MEMFS = {
    ops_table: null,
    mount: function (mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    },
    createNode: function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node;
            parent.timestamp = node.timestamp
        }
        return node
    },
    getFileDataAsTypedArray: function (node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    },
    expandFileStorage: function (node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
    },
    resizeFileStorage: function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0
        } else {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize
        }
    },
    node_ops: {
        getattr: function (node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        },
        setattr: function (node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        },
        lookup: function (parent, name) {
            throw FS.genericErrors[44]
        },
        mknod: function (parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        },
        rename: function (old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) { }
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.parent.timestamp = Date.now();
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            new_dir.timestamp = old_node.parent.timestamp;
            old_node.parent = new_dir
        },
        unlink: function (parent, name) {
            delete parent.contents[name];
            parent.timestamp = Date.now()
        },
        rmdir: function (parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55)
            }
            delete parent.contents[name];
            parent.timestamp = Date.now()
        },
        readdir: function (node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        },
        symlink: function (parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        },
        readlink: function (node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28)
            }
            return node.link
        }
    },
    stream_ops: {
        read: function (stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        },
        write: function (stream, buffer, offset, length, position, canOwn) {
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position)
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        },
        llseek: function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        },
        allocate: function (stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        },
        mmap: function (stream, address, length, position, prot, flags) {
            if (address !== 0) {
                throw new FS.ErrnoError(28)
            }
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents.buffer === buffer) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < contents.length) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48)
                }
                HEAP8.set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        },
        msync: function (stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        }
    }
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    lookupPath: function (path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return {
            path: "",
            node: null
        };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32)
        }
        var parts = PATH.normalizeArray(path.split("/").filter(function (p) {
            return !!p
        }), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    },
    getPath: function (node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
        }
    },
    hashName: function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    },
    hashAddNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    },
    hashRemoveNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    },
    lookupNode: function (parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode, parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    },
    createNode: function (parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    },
    destroyNode: function (node) {
        FS.hashRemoveNode(node)
    },
    isRoot: function (node) {
        return node === node.parent
    },
    isMountpoint: function (node) {
        return !!node.mounted
    },
    isFile: function (mode) {
        return (mode & 61440) === 32768
    },
    isDir: function (mode) {
        return (mode & 61440) === 16384
    },
    isLink: function (mode) {
        return (mode & 61440) === 40960
    },
    isChrdev: function (mode) {
        return (mode & 61440) === 8192
    },
    isBlkdev: function (mode) {
        return (mode & 61440) === 24576
    },
    isFIFO: function (mode) {
        return (mode & 61440) === 4096
    },
    isSocket: function (mode) {
        return (mode & 49152) === 49152
    },
    flagModes: {
        "r": 0,
        "r+": 2,
        "w": 577,
        "w+": 578,
        "a": 1089,
        "a+": 1090
    },
    modeStringToFlags: function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    },
    flagsToPermissionString: function (flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    },
    nodePermissions: function (node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return 2
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return 2
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return 2
        }
        return 0
    },
    mayLookup: function (dir) {
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0
    },
    mayCreate: function (dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20
        } catch (e) { }
        return FS.nodePermissions(dir, "wx")
    },
    mayDelete: function (dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31
            }
        }
        return 0
    },
    mayOpen: function (node, flags) {
        if (!node) {
            return 44
        }
        if (FS.isLink(node.mode)) {
            return 32
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(33)
    },
    getStream: function (fd) {
        return FS.streams[fd]
    },
    createStream: function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = function () { };
            FS.FSStream.prototype = {
                object: {
                    get: function () {
                        return this.node
                    },
                    set: function (val) {
                        this.node = val
                    }
                },
                isRead: {
                    get: function () {
                        return (this.flags & 2097155) !== 1
                    }
                },
                isWrite: {
                    get: function () {
                        return (this.flags & 2097155) !== 0
                    }
                },
                isAppend: {
                    get: function () {
                        return this.flags & 1024
                    }
                }
            }
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    },
    closeStream: function (fd) {
        FS.streams[fd] = null
    },
    chrdev_stream_ops: {
        open: function (stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        },
        llseek: function () {
            throw new FS.ErrnoError(70)
        }
    },
    major: function (dev) {
        return dev >> 8
    },
    minor: function (dev) {
        return dev & 255
    },
    makedev: function (ma, mi) {
        return ma << 8 | mi
    },
    registerDevice: function (dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    },
    getDevice: function (dev) {
        return FS.devices[dev]
    },
    getMounts: function (mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    },
    syncfs: function (populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode)
        }

        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach(function (mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        })
    },
    mount: function (type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    },
    unmount: function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function (hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current)
                }
                current = next
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1)
    },
    lookup: function (parent, name) {
        return parent.node_ops.lookup(parent, name)
    },
    mknod: function (path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    },
    create: function (path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    },
    mkdir: function (path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    },
    mkdirTree: function (path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != 20) throw e
            }
        }
    },
    mkdev: function (path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    },
    symlink: function (oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    },
    rename: function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, {
            parent: true
        });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, {
            parent: true
        });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28)
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) { }
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10)
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch (e) {
            err("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    },
    rmdir: function (path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readdir: function (path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54)
        }
        return node.node_ops.readdir(node)
    },
    unlink: function (path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readlink: function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28)
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    },
    stat: function (path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63)
        }
        return node.node_ops.getattr(node)
    },
    lstat: function (path) {
        return FS.stat(path, true)
    },
    chmod: function (path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    },
    lchmod: function (path, mode) {
        FS.chmod(path, mode, true)
    },
    fchmod: function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chmod(stream.node, mode)
    },
    chown: function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    },
    lchown: function (path, uid, gid) {
        FS.chown(path, uid, gid, true)
    },
    fchown: function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chown(stream.node, uid, gid)
    },
    truncate: function (path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    },
    ftruncate: function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28)
        }
        FS.truncate(stream.node, len)
    },
    utime: function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    },
    open: function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(44)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) { }
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54)
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                err("FS.trackingDelegate error on read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch (e) {
            err("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    },
    close: function (stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
        stream.fd = null
    },
    isClosed: function (stream) {
        return stream.fd === null
    },
    llseek: function (stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70)
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    },
    read: function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    },
    write: function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28)
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch (e) {
            err("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    },
    allocate: function (stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138)
        }
        stream.stream_ops.allocate(stream, offset, length)
    },
    mmap: function (stream, address, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43)
        }
        return stream.stream_ops.mmap(stream, address, length, position, prot, flags)
    },
    msync: function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    },
    munmap: function (stream) {
        return 0
    },
    ioctl: function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    },
    readFile: function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    },
    writeFile: function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
        } else {
            throw new Error("Unsupported data type")
        }
        FS.close(stream)
    },
    cwd: function () {
        return FS.currentPath
    },
    chdir: function (path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54)
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        FS.currentPath = lookup.path
    },
    createDefaultDirectories: function () {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    },
    createDefaultDevices: function () {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: function () {
                return 0
            },
            write: function (stream, buffer, offset, length, pos) {
                return length
            }
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device = getRandomDevice();
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    },
    createSpecialDirectories: function () {
        FS.mkdir("/proc");
        var proc_self = FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: function () {
                var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: function (parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream) throw new FS.ErrnoError(8);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: function () {
                                    return stream.path
                                }
                            }
                        };
                        ret.parent = ret;
                        return ret
                    }
                };
                return node
            }
        }, {}, "/proc/self/fd")
    },
    createStandardStreams: function () {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1)
    },
    ensureErrnoError: function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function (errno) {
                this.errno = errno
            };
            this.setErrno(errno);
            this.message = "FS error"
        };
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(function (code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        })
    },
    staticInit: function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS
        }
    },
    init: function (input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    },
    quit: function () {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    },
    getMode: function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode
    },
    findObject: function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            return null
        }
    },
    analyzePath: function (path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) { }
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    },
    createPath: function (parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) { }
            parent = current
        }
        return current
    },
    createFile: function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    },
    createDataFile: function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    },
    createDevice: function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: function (stream) {
                stream.seekable = false
            },
            close: function (stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            },
            read: function (stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            },
            write: function (stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            }
        });
        return FS.mkdev(path, mode, dev)
    },
    forceLoadFile: function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
    },
    createLazyFile: function (parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = function (from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            };
            var lazyArray = this;
            lazyArray.setDataGetter(function (chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: function () {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    }
                },
                chunkSize: {
                    get: function () {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    }
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function () {
                    return this.contents.length
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function (key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                FS.forceLoadFile(node);
                return fn.apply(null, arguments)
            }
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            FS.forceLoadFile(node);
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        };
        node.stream_ops = stream_ops;
        return node
    },
    createPreloadedFile: function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);

        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload) onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach(function (plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, function () {
                        if (onerror) onerror();
                        removeRunDependency(dep)
                    });
                    handled = true
                }
            });
            if (!handled) finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, function (byteArray) {
                processData(byteArray)
            }, onerror)
        } else {
            processData(url)
        }
    },
    indexedDB: function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    },
    DB_NAME: function () {
        return "EM_FS_" + window.location.pathname
    },
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: function (paths, onload, onerror) {
        onload = onload || function () { };
        onerror = onerror || function () { };
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            out("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function (path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish()
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    },
    loadFilesFromDB: function (paths, onload, onerror) {
        onload = onload || function () { };
        onerror = onerror || function () { };
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function (path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish()
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    }
};
var SYSCALLS = {
    mappings: {},
    DEFAULT_POLLMASK: 5,
    umask: 511,
    calculateAt: function (dirfd, path, allowEmpty) {
        if (path[0] === "/") {
            return path
        }
        var dir;
        if (dirfd === -100) {
            dir = FS.cwd()
        } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(8);
            dir = dirstream.path
        }
        if (path.length == 0) {
            if (!allowEmpty) {
                throw new FS.ErrnoError(44)
            }
            return dir
        }
        return PATH.join2(dir, path)
    },
    doStat: function (func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -54
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
        HEAP32[buf + 48 >> 2] = 4096;
        HEAP32[buf + 52 >> 2] = stat.blocks;
        HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 76 >> 2] = 0;
        tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 80 >> 2] = tempI64[0], HEAP32[buf + 84 >> 2] = tempI64[1];
        return 0
    },
    doMsync: function (addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags)
    },
    doMkdir: function (path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    },
    doMknod: function (path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -28
        }
        FS.mknod(path, mode, dev);
        return 0
    },
    doReadlink: function (path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len
    },
    doAccess: function (path, amode) {
        if (amode & ~7) {
            return -28
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        if (!node) {
            return -44
        }
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -2
        }
        return 0
    },
    doDup: function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    },
    doReadv: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break
        }
        return ret
    },
    doWritev: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr
        }
        return ret
    },
    varargs: undefined,
    get: function () {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    },
    getStr: function (ptr) {
        var ret = UTF8ToString(ptr);
        return ret
    },
    getStreamFromFD: function (fd) {
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream
    },
    get64: function (low, high) {
        return low
    }
};

function ___sys_fcntl64(fd, cmd, varargs) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(11, 1, fd, cmd, varargs);
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
            case 0: {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return -28
                }
                var newStream;
                newStream = FS.open(stream.path, stream.flags, 0, arg);
                return newStream.fd
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4: {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0
            }
            case 12: {
                var arg = SYSCALLS.get();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0
            }
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return -28;
            case 9:
                setErrNo(28);
                return -1;
            default: {
                return -28
            }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_ioctl(fd, op, varargs) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(12, 1, fd, op, varargs);
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
            case 21509:
            case 21505: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21510:
            case 21511:
            case 21512:
            case 21506:
            case 21507:
            case 21508: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21519: {
                if (!stream.tty) return -59;
                var argp = SYSCALLS.get();
                HEAP32[argp >> 2] = 0;
                return 0
            }
            case 21520: {
                if (!stream.tty) return -59;
                return -28
            }
            case 21531: {
                var argp = SYSCALLS.get();
                return FS.ioctl(stream, op, argp)
            }
            case 21523: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21524: {
                if (!stream.tty) return -59;
                return 0
            }
            default:
                abort("bad ioctl syscall " + op)
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_open(path, flags, varargs) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(13, 1, path, flags, varargs);
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(path);
        var mode = varargs ? SYSCALLS.get() : 0;
        var stream = FS.open(pathname, flags, mode);
        return stream.fd
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_rename(old_path, new_path) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(14, 1, old_path, new_path);
    try {
        old_path = SYSCALLS.getStr(old_path);
        new_path = SYSCALLS.getStr(new_path);
        FS.rename(old_path, new_path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_rmdir(path) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(15, 1, path);
    try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_unlink(path) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(16, 1, path);
    try {
        path = SYSCALLS.getStr(path);
        FS.unlink(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function __emscripten_notify_thread_queue(targetThreadId, mainThreadId) {
    if (targetThreadId == mainThreadId) {
        postMessage({
            "cmd": "processQueuedMainThreadWork"
        })
    } else if (ENVIRONMENT_IS_PTHREAD) {
        postMessage({
            "targetThread": targetThreadId,
            "cmd": "processThreadQueue"
        })
    } else {
        var pthread = PThread.pthreads[targetThreadId];
        var worker = pthread && pthread.worker;
        if (!worker) {
            return
        }
        worker.postMessage({
            "cmd": "processThreadQueue"
        })
    }
    return 1
}

function _emscripten_asm_const_int(code, sigPtr, argbuf) {
    var args = readAsmConstArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args)
}

function _emscripten_check_blocking_allowed() {
    if (ENVIRONMENT_IS_NODE) return;
    if (ENVIRONMENT_IS_WORKER) return;
    warnOnce("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread")
}

function _emscripten_conditional_set_current_thread_status(expectedStatus, newStatus) { }

function _emscripten_futex_wait(addr, val, timeout) {
    if (addr <= 0 || addr > HEAP8.length || addr & 3 != 0) return -28;
    if (!ENVIRONMENT_IS_WEB) {
        var ret = Atomics.wait(HEAP32, addr >> 2, val, timeout);
        if (ret === "timed-out") return -73;
        if (ret === "not-equal") return -6;
        if (ret === "ok") return 0;
        throw "Atomics.wait returned an unexpected value " + ret
    } else {
        if (Atomics.load(HEAP32, addr >> 2) != val) {
            return -6
        }
        var tNow = performance.now();
        var tEnd = tNow + timeout;
        var lastAddr = Atomics.exchange(HEAP32, __emscripten_main_thread_futex >> 2, addr);
        while (1) {
            tNow = performance.now();
            if (tNow > tEnd) {
                lastAddr = Atomics.exchange(HEAP32, __emscripten_main_thread_futex >> 2, 0);
                return -73
            }
            lastAddr = Atomics.exchange(HEAP32, __emscripten_main_thread_futex >> 2, 0);
            if (lastAddr == 0) {
                break
            }
            _emscripten_main_thread_process_queued_calls();
            if (Atomics.load(HEAP32, addr >> 2) != val) {
                return -6
            }
            lastAddr = Atomics.exchange(HEAP32, __emscripten_main_thread_futex >> 2, addr)
        }
        return 0
    }
}

function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num)
}

function _emscripten_proxy_to_main_thread_js(index, sync) {
    var numCallArgs = arguments.length - 2;
    var stack = stackSave();
    var serializedNumCallArgs = numCallArgs;
    var args = stackAlloc(serializedNumCallArgs * 8);
    var b = args >> 3;
    for (var i = 0; i < numCallArgs; i++) {
        var arg = arguments[2 + i];
        HEAPF64[b + i] = arg
    }
    var ret = _emscripten_run_in_main_runtime_thread_js(index, serializedNumCallArgs, args, sync);
    stackRestore(stack);
    return ret
}
var _emscripten_receive_on_main_thread_js_callArgs = [];
var readAsmConstArgsArray = [];

function readAsmConstArgs(sigPtr, buf) {
    readAsmConstArgsArray.length = 0;
    var ch;
    buf >>= 2;
    while (ch = HEAPU8[sigPtr++]) {
        var double = ch < 105;
        if (double && buf & 1) buf++;
        readAsmConstArgsArray.push(double ? HEAPF64[buf++ >> 1] : HEAP32[buf]);
        ++buf
    }
    return readAsmConstArgsArray
}

function _emscripten_receive_on_main_thread_js(index, numCallArgs, args) {
    _emscripten_receive_on_main_thread_js_callArgs.length = numCallArgs;
    var b = args >> 3;
    for (var i = 0; i < numCallArgs; i++) {
        _emscripten_receive_on_main_thread_js_callArgs[i] = HEAPF64[b + i]
    }
    var isEmAsmConst = index < 0;
    var func = !isEmAsmConst ? proxiedFunctionTable[index] : ASM_CONSTS[-index - 1];
    return func.apply(null, _emscripten_receive_on_main_thread_js_callArgs)
}

function _emscripten_resize_heap(requestedSize) {
    var oldSize = HEAPU8.length;
    return false
}
var JSEvents = {
    inEventHandler: 0,
    removeAllEventListeners: function () {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
            JSEvents._removeHandler(i)
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = []
    },
    registerRemoveEventListeners: function () {
        if (!JSEvents.removeEventListenersRegistered) {
            __ATEXIT__.push(JSEvents.removeAllEventListeners);
            JSEvents.removeEventListenersRegistered = true
        }
    },
    deferredCalls: [],
    deferCall: function (targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length) return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false
            }
            return true
        }
        for (var i in JSEvents.deferredCalls) {
            var call = JSEvents.deferredCalls[i];
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return
            }
        }
        JSEvents.deferredCalls.push({
            targetFunction: targetFunction,
            precedence: precedence,
            argsList: argsList
        });
        JSEvents.deferredCalls.sort(function (x, y) {
            return x.precedence < y.precedence
        })
    },
    removeDeferredCalls: function (targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1);
                --i
            }
        }
    },
    canPerformEventHandlerRequests: function () {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
    },
    runDeferredCalls: function () {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            var call = JSEvents.deferredCalls[i];
            JSEvents.deferredCalls.splice(i, 1);
            --i;
            call.targetFunction.apply(null, call.argsList)
        }
    },
    eventHandlers: [],
    removeAllHandlersOnTarget: function (target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--)
            }
        }
    },
    _removeHandler: function (i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1)
    },
    registerOrRemoveHandler: function (eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            JSEvents.runDeferredCalls();
            eventHandler.handlerFunc(event);
            JSEvents.runDeferredCalls();
            --JSEvents.inEventHandler
        };
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = jsEventHandler;
            eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
            JSEvents.eventHandlers.push(eventHandler);
            JSEvents.registerRemoveEventListeners()
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--)
                }
            }
        }
    },
    queueEventHandlerOnThread_iiii: function (targetThread, eventHandlerFunc, eventTypeId, eventData, userData) {
        var stackTop = stackSave();
        var varargs = stackAlloc(12);
        HEAP32[varargs >> 2] = eventTypeId;
        HEAP32[varargs + 4 >> 2] = eventData;
        HEAP32[varargs + 8 >> 2] = userData;
        __emscripten_call_on_thread(0, targetThread, 637534208, eventHandlerFunc, eventData, varargs);
        stackRestore(stackTop)
    },
    getTargetThreadForEventCallback: function (targetThread) {
        switch (targetThread) {
            case 1:
                return 0;
            case 2:
                return PThread.currentProxiedOperationCallerThread;
            default:
                return targetThread
        }
    },
    getNodeNameForTarget: function (target) {
        if (!target) return "";
        if (target == window) return "#window";
        if (target == screen) return "#screen";
        return target && target.nodeName ? target.nodeName : ""
    },
    fullscreenEnabled: function () {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled
    }
};

function stringToNewUTF8(jsString) {
    var length = lengthBytesUTF8(jsString) + 1;
    var cString = _malloc(length);
    stringToUTF8(jsString, cString, length);
    return cString
}

function _emscripten_set_offscreencanvas_size_on_target_thread_js(targetThread, targetCanvas, width, height) {
    var stackTop = stackSave();
    var varargs = stackAlloc(12);
    var targetCanvasPtr = 0;
    if (targetCanvas) {
        targetCanvasPtr = stringToNewUTF8(targetCanvas)
    }
    HEAP32[varargs >> 2] = targetCanvasPtr;
    HEAP32[varargs + 4 >> 2] = width;
    HEAP32[varargs + 8 >> 2] = height;
    __emscripten_call_on_thread(0, targetThread, 657457152, 0, targetCanvasPtr, varargs);
    stackRestore(stackTop)
}

function _emscripten_set_offscreencanvas_size_on_target_thread(targetThread, targetCanvas, width, height) {
    targetCanvas = targetCanvas ? UTF8ToString(targetCanvas) : "";
    _emscripten_set_offscreencanvas_size_on_target_thread_js(targetThread, targetCanvas, width, height)
}

function maybeCStringToJsString(cString) {
    return cString > 2 ? UTF8ToString(cString) : cString
}
var specialHTMLTargets = [0, typeof document !== "undefined" ? document : 0, typeof window !== "undefined" ? window : 0];

function findEventTarget(target) {
    target = maybeCStringToJsString(target);
    var domElement = specialHTMLTargets[target] || (typeof document !== "undefined" ? document.querySelector(target) : undefined);
    return domElement
}

function findCanvasEventTarget(target) {
    return findEventTarget(target)
}

function _emscripten_set_canvas_element_size_calling_thread(target, width, height) {
    var canvas = findCanvasEventTarget(target);
    if (!canvas) return -4;
    if (canvas.canvasSharedPtr) {
        HEAP32[canvas.canvasSharedPtr >> 2] = width;
        HEAP32[canvas.canvasSharedPtr + 4 >> 2] = height
    }
    if (canvas.offscreenCanvas || !canvas.controlTransferredOffscreen) {
        if (canvas.offscreenCanvas) canvas = canvas.offscreenCanvas;
        var autoResizeViewport = false;
        if (canvas.GLctxObject && canvas.GLctxObject.GLctx) {
            var prevViewport = canvas.GLctxObject.GLctx.getParameter(2978);
            autoResizeViewport = prevViewport[0] === 0 && prevViewport[1] === 0 && prevViewport[2] === canvas.width && prevViewport[3] === canvas.height
        }
        canvas.width = width;
        canvas.height = height;
        if (autoResizeViewport) {
            canvas.GLctxObject.GLctx.viewport(0, 0, width, height)
        }
    } else if (canvas.canvasSharedPtr) {
        var targetThread = HEAP32[canvas.canvasSharedPtr + 8 >> 2];
        _emscripten_set_offscreencanvas_size_on_target_thread(targetThread, target, width, height);
        return 1
    } else {
        return -4
    }
    return 0
}

function _emscripten_set_canvas_element_size_main_thread(target, width, height) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(17, 1, target, width, height);
    return _emscripten_set_canvas_element_size_calling_thread(target, width, height)
}

function _emscripten_set_canvas_element_size(target, width, height) {
    var canvas = findCanvasEventTarget(target);
    if (canvas) {
        return _emscripten_set_canvas_element_size_calling_thread(target, width, height)
    } else {
        return _emscripten_set_canvas_element_size_main_thread(target, width, height)
    }
}

function _emscripten_set_current_thread_status(newStatus) { }

function _emscripten_set_thread_name(threadId, name) { }

function __webgl_enable_ANGLE_instanced_arrays(ctx) {
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
        ctx["vertexAttribDivisor"] = function (index, divisor) {
            ext["vertexAttribDivisorANGLE"](index, divisor)
        };
        ctx["drawArraysInstanced"] = function (mode, first, count, primcount) {
            ext["drawArraysInstancedANGLE"](mode, first, count, primcount)
        };
        ctx["drawElementsInstanced"] = function (mode, count, type, indices, primcount) {
            ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount)
        };
        return 1
    }
}

function __webgl_enable_OES_vertex_array_object(ctx) {
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
        ctx["createVertexArray"] = function () {
            return ext["createVertexArrayOES"]()
        };
        ctx["deleteVertexArray"] = function (vao) {
            ext["deleteVertexArrayOES"](vao)
        };
        ctx["bindVertexArray"] = function (vao) {
            ext["bindVertexArrayOES"](vao)
        };
        ctx["isVertexArray"] = function (vao) {
            return ext["isVertexArrayOES"](vao)
        };
        return 1
    }
}

function __webgl_enable_WEBGL_draw_buffers(ctx) {
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
        ctx["drawBuffers"] = function (n, bufs) {
            ext["drawBuffersWEBGL"](n, bufs)
        };
        return 1
    }
}

function __webgl_enable_WEBGL_multi_draw(ctx) {
    return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"))
}
var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    uniforms: [],
    shaders: [],
    vaos: [],
    contexts: {},
    offscreenCanvases: {},
    timerQueriesEXT: [],
    programInfos: {},
    stringCache: {},
    unpackAlignment: 4,
    recordError: function recordError(errorCode) {
        if (!GL.lastError) {
            GL.lastError = errorCode
        }
    },
    getNewId: function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null
        }
        return ret
    },
    getSource: function (shader, count, string, length) {
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAP32[length + i * 4 >> 2] : -1;
            source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len)
        }
        return source
    },
    createContext: function (canvas, webGLContextAttributes) {
        if (!canvas.getContextSafariWebGL2Fixed) {
            canvas.getContextSafariWebGL2Fixed = canvas.getContext;
            canvas.getContext = function (ver, attrs) {
                var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
                return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null
            }
        }
        var ctx = canvas.getContext("webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle
    },
    registerContext: function (ctx, webGLContextAttributes) {
        var handle = _malloc(8);
        HEAP32[handle + 4 >> 2] = _pthread_self();
        var context = {
            handle: handle,
            attributes: webGLContextAttributes,
            version: webGLContextAttributes.majorVersion,
            GLctx: ctx
        };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context)
        }
        return handle
    },
    makeContextCurrent: function (contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx)
    },
    getContext: function (contextHandle) {
        return GL.contexts[contextHandle]
    },
    deleteContext: function (contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        _free(GL.contexts[contextHandle].handle);
        GL.contexts[contextHandle] = null
    },
    initExtensions: function (context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        __webgl_enable_ANGLE_instanced_arrays(GLctx);
        __webgl_enable_OES_vertex_array_object(GLctx);
        __webgl_enable_WEBGL_draw_buffers(GLctx);
        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        __webgl_enable_WEBGL_multi_draw(GLctx);
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function (ext) {
            if (ext.indexOf("lose_context") < 0 && ext.indexOf("debug") < 0) {
                GLctx.getExtension(ext)
            }
        })
    },
    populateUniformTable: function (program) {
        var p = GL.programs[program];
        var ptable = GL.programInfos[program] = {
            uniforms: {},
            maxUniformLength: 0,
            maxAttributeLength: -1,
            maxUniformBlockNameLength: -1
        };
        var utable = ptable.uniforms;
        var numUniforms = GLctx.getProgramParameter(p, 35718);
        for (var i = 0; i < numUniforms; ++i) {
            var u = GLctx.getActiveUniform(p, i);
            var name = u.name;
            ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
            if (name.slice(-1) == "]") {
                name = name.slice(0, name.lastIndexOf("["))
            }
            var loc = GLctx.getUniformLocation(p, name);
            if (loc) {
                var id = GL.getNewId(GL.uniforms);
                utable[name] = [u.size, id];
                GL.uniforms[id] = loc;
                for (var j = 1; j < u.size; ++j) {
                    var n = name + "[" + j + "]";
                    loc = GLctx.getUniformLocation(p, n);
                    id = GL.getNewId(GL.uniforms);
                    GL.uniforms[id] = loc
                }
            }
        }
    }
};
var __emscripten_webgl_power_preferences = ["default", "low-power", "high-performance"];

function _emscripten_webgl_do_create_context(target, attributes) {
    var a = attributes >> 2;
    var powerPreference = HEAP32[a + (24 >> 2)];
    var contextAttributes = {
        "alpha": !!HEAP32[a + (0 >> 2)],
        "depth": !!HEAP32[a + (4 >> 2)],
        "stencil": !!HEAP32[a + (8 >> 2)],
        "antialias": !!HEAP32[a + (12 >> 2)],
        "premultipliedAlpha": !!HEAP32[a + (16 >> 2)],
        "preserveDrawingBuffer": !!HEAP32[a + (20 >> 2)],
        "powerPreference": __emscripten_webgl_power_preferences[powerPreference],
        "failIfMajorPerformanceCaveat": !!HEAP32[a + (28 >> 2)],
        majorVersion: HEAP32[a + (32 >> 2)],
        minorVersion: HEAP32[a + (36 >> 2)],
        enableExtensionsByDefault: HEAP32[a + (40 >> 2)],
        explicitSwapControl: HEAP32[a + (44 >> 2)],
        proxyContextToMainThread: HEAP32[a + (48 >> 2)],
        renderViaOffscreenBackBuffer: HEAP32[a + (52 >> 2)]
    };
    var canvas = findCanvasEventTarget(target);
    if (!canvas) {
        return 0
    }
    if (contextAttributes.explicitSwapControl) {
        return 0
    }
    var contextHandle = GL.createContext(canvas, contextAttributes);
    return contextHandle
}

function _emscripten_webgl_create_context(a0, a1) {
    return _emscripten_webgl_do_create_context(a0, a1)
}

function _fd_close(fd) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(18, 1, fd);
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_read(fd, iov, iovcnt, pnum) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(19, 1, fd, iov, iovcnt, pnum);
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doReadv(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(20, 1, fd, offset_low, offset_high, whence, newOffset);
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -61
        }
        FS.llseek(stream, offset, whence);
        tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_write(fd, iov, iovcnt, pnum) {
    if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(21, 1, fd, iov, iovcnt, pnum);
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _ftime(p) {
    var millis = Date.now();
    HEAP32[p >> 2] = millis / 1e3 | 0;
    HEAP16[p + 4 >> 1] = millis % 1e3;
    HEAP16[p + 6 >> 1] = 0;
    HEAP16[p + 8 >> 1] = 0;
    return 0
}

function _getTempRet0() {
    return getTempRet0() | 0
}

function _gettimeofday(ptr) {
    var now = Date.now();
    HEAP32[ptr >> 2] = now / 1e3 | 0;
    HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
    return 0
}

function _pthread_cleanup_pop(execute) {
    var routine = PThread.threadExitHandlers.pop();
    if (execute) routine()
}

function spawnThread(threadParams) {
    if (ENVIRONMENT_IS_PTHREAD) throw "Internal Error! spawnThread() can only ever be called from main application thread!";
    var worker = PThread.getNewWorker();
    if (!worker) {
        return 6
    }
    if (worker.pthread !== undefined) throw "Internal error!";
    if (!threadParams.pthread_ptr) throw "Internal error, no pthread ptr!";
    PThread.runningWorkers.push(worker);
    var tlsMemory = _malloc(128 * 4);
    for (var i = 0; i < 128; ++i) {
        HEAP32[tlsMemory + i * 4 >> 2] = 0
    }
    var stackHigh = threadParams.stackBase + threadParams.stackSize;
    var pthread = PThread.pthreads[threadParams.pthread_ptr] = {
        worker: worker,
        stackBase: threadParams.stackBase,
        stackSize: threadParams.stackSize,
        allocatedOwnStack: threadParams.allocatedOwnStack,
        threadInfoStruct: threadParams.pthread_ptr
    };
    var tis = pthread.threadInfoStruct >> 2;
    Atomics.store(HEAPU32, tis + (64 >> 2), threadParams.detached);
    Atomics.store(HEAPU32, tis + (100 >> 2), tlsMemory);
    Atomics.store(HEAPU32, tis + (40 >> 2), pthread.threadInfoStruct);
    Atomics.store(HEAPU32, tis + (80 >> 2), threadParams.stackSize);
    Atomics.store(HEAPU32, tis + (76 >> 2), stackHigh);
    Atomics.store(HEAPU32, tis + (104 >> 2), threadParams.stackSize);
    Atomics.store(HEAPU32, tis + (104 + 8 >> 2), stackHigh);
    Atomics.store(HEAPU32, tis + (104 + 12 >> 2), threadParams.detached);
    var global_libc = _emscripten_get_global_libc();
    var global_locale = global_libc + 40;
    Atomics.store(HEAPU32, tis + (172 >> 2), global_locale);
    worker.pthread = pthread;
    var msg = {
        "cmd": "run",
        "start_routine": threadParams.startRoutine,
        "arg": threadParams.arg,
        "threadInfoStruct": threadParams.pthread_ptr,
        "stackBase": threadParams.stackBase,
        "stackSize": threadParams.stackSize
    };
    worker.runPthread = function () {
        msg.time = performance.now();
        worker.postMessage(msg, threadParams.transferList)
    };
    if (worker.loaded) {
        worker.runPthread();
        delete worker.runPthread
    }
    return 0
}

function _pthread_create(pthread_ptr, attr, start_routine, arg) {
    if (typeof SharedArrayBuffer === "undefined") {
        err("Current environment does not support SharedArrayBuffer, pthreads are not available!");
        return 6
    }
    if (!pthread_ptr) {
        err("pthread_create called with a null thread pointer!");
        return 28
    }
    var transferList = [];
    var error = 0;
    if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
        return _emscripten_sync_run_in_main_thread_4(687865856, pthread_ptr, attr, start_routine, arg)
    }
    if (error) return error;
    var stackSize = 0;
    var stackBase = 0;
    var detached = 0;
    if (attr && attr != -1) {
        stackSize = HEAP32[attr >> 2];
        stackSize += 81920;
        stackBase = HEAP32[attr + 8 >> 2];
        detached = HEAP32[attr + 12 >> 2] !== 0
    } else {
        stackSize = 2097152
    }
    var allocatedOwnStack = stackBase == 0;
    if (allocatedOwnStack) {
        stackBase = _memalign(16, stackSize)
    } else {
        stackBase -= stackSize;
        assert(stackBase > 0)
    }
    var threadInfoStruct = _malloc(228);
    for (var i = 0; i < 228 >> 2; ++i) HEAPU32[(threadInfoStruct >> 2) + i] = 0;
    HEAP32[pthread_ptr >> 2] = threadInfoStruct;
    HEAP32[threadInfoStruct + 12 >> 2] = threadInfoStruct;
    var headPtr = threadInfoStruct + 152;
    HEAP32[headPtr >> 2] = headPtr;
    var threadParams = {
        stackBase: stackBase,
        stackSize: stackSize,
        allocatedOwnStack: allocatedOwnStack,
        detached: detached,
        startRoutine: start_routine,
        pthread_ptr: threadInfoStruct,
        arg: arg,
        transferList: transferList
    };
    if (ENVIRONMENT_IS_PTHREAD) {
        threadParams.cmd = "spawnThread";
        postMessage(threadParams, transferList);
        return 0
    }
    return spawnThread(threadParams)
}

function __pthread_testcancel_js() {
    if (!ENVIRONMENT_IS_PTHREAD) return;
    var tb = _pthread_self();
    if (!tb) return;
    var cancelDisabled = Atomics.load(HEAPU32, tb + 56 >> 2);
    if (cancelDisabled) return;
    var canceled = Atomics.load(HEAPU32, tb + 0 >> 2);
    if (canceled == 2) throw "Canceled!"
}

function __emscripten_do_pthread_join(thread, status, block) {
    if (!thread) {
        err("pthread_join attempted on a null thread pointer!");
        return ERRNO_CODES.ESRCH
    }
    if (ENVIRONMENT_IS_PTHREAD && _pthread_self() == thread) {
        err("PThread " + thread + " is attempting to join to itself!");
        return ERRNO_CODES.EDEADLK
    } else if (!ENVIRONMENT_IS_PTHREAD && _emscripten_main_browser_thread_id() == thread) {
        err("Main thread " + thread + " is attempting to join to itself!");
        return ERRNO_CODES.EDEADLK
    }
    var self = HEAP32[thread + 12 >> 2];
    if (self !== thread) {
        err("pthread_join attempted on thread " + thread + ", which does not point to a valid thread, or does not exist anymore!");
        return ERRNO_CODES.ESRCH
    }
    var detached = Atomics.load(HEAPU32, thread + 64 >> 2);
    if (detached) {
        err("Attempted to join thread " + thread + ", which was already detached!");
        return ERRNO_CODES.EINVAL
    }
    if (block) {
        _emscripten_check_blocking_allowed()
    }
    for (; ;) {
        var threadStatus = Atomics.load(HEAPU32, thread + 0 >> 2);
        if (threadStatus == 1) {
            var threadExitCode = Atomics.load(HEAPU32, thread + 4 >> 2);
            if (status) HEAP32[status >> 2] = threadExitCode;
            Atomics.store(HEAPU32, thread + 64 >> 2, 1);
            if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread);
            else postMessage({
                "cmd": "cleanupThread",
                "thread": thread
            });
            return 0
        }
        if (!block) {
            return ERRNO_CODES.EBUSY
        }
        __pthread_testcancel_js();
        if (!ENVIRONMENT_IS_PTHREAD) _emscripten_main_thread_process_queued_calls();
        _emscripten_futex_wait(thread + 0, threadStatus, ENVIRONMENT_IS_PTHREAD ? 100 : 1)
    }
}

function _pthread_join(thread, status) {
    return __emscripten_do_pthread_join(thread, status, true)
}

function _time(ptr) {
    var ret = Date.now() / 1e3 | 0;
    if (ptr) {
        HEAP32[ptr >> 2] = ret
    }
    return ret
}
if (!ENVIRONMENT_IS_PTHREAD) PThread.initMainThreadBlock();
var FSNode = function (parent, name, mode, rdev) {
    if (!parent) {
        parent = this
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
    read: {
        get: function () {
            return (this.mode & readMode) === readMode
        },
        set: function (val) {
            val ? this.mode |= readMode : this.mode &= ~readMode
        }
    },
    write: {
        get: function () {
            return (this.mode & writeMode) === writeMode
        },
        set: function (val) {
            val ? this.mode |= writeMode : this.mode &= ~writeMode
        }
    },
    isFolder: {
        get: function () {
            return FS.isDir(this.mode)
        }
    },
    isDevice: {
        get: function () {
            return FS.isChrdev(this.mode)
        }
    }
});
FS.FSNode = FSNode;
FS.staticInit();
var GLctx;
var proxiedFunctionTable = [null, _JSPAL_Loaded, _TI_JSPAL_eventCallback, _TI_WEBUSBJS_Init, _TI_WEBUSBJS_IsOpen, _TI_WEBUSBJS_Open, _TI_WEBUSBJS_ReadAsync, _TI_WEBUSBJS_RequestDevices, _TI_WEBUSBJS_Write, _tzset, _atexit, ___sys_fcntl64, ___sys_ioctl, ___sys_open, ___sys_rename, ___sys_rmdir, ___sys_unlink, _emscripten_set_canvas_element_size_main_thread, _fd_close, _fd_read, _fd_seek, _fd_write];

function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}
var asmLibraryArg = {
    "ja": _JSPAL_Loaded,
    "ka": _TI_JSPAL_eventCallback,
    "ga": _TI_WEBUSBJS_Init,
    "E": _TI_WEBUSBJS_IsOpen,
    "fa": _TI_WEBUSBJS_Open,
    "da": _TI_WEBUSBJS_ReadAsync,
    "ea": _TI_WEBUSBJS_RequestDevices,
    "ca": _TI_WEBUSBJS_Write,
    "Y": ___asctime_r,
    "l": ___assert_fail,
    "P": ___call_main,
    "V": ___clock_gettime,
    "O": ___cxa_allocate_exception,
    "M": ___cxa_begin_catch,
    "L": ___cxa_end_catch,
    "c": ___cxa_find_matching_catch_2,
    "i": ___cxa_find_matching_catch_3,
    "ba": ___cxa_thread_atexit,
    "N": ___cxa_throw,
    "X": ___localtime_r,
    "d": ___resumeException,
    "B": ___sys_fcntl64,
    "_": ___sys_ioctl,
    "D": ___sys_open,
    "$": ___sys_rename,
    "aa": ___sys_rmdir,
    "C": ___sys_unlink,
    "U": __emscripten_notify_thread_queue,
    "y": _emscripten_asm_const_int,
    "W": _emscripten_check_blocking_allowed,
    "r": _emscripten_conditional_set_current_thread_status,
    "m": _emscripten_futex_wait,
    "n": _emscripten_futex_wake,
    "j": _emscripten_get_now,
    "J": _emscripten_memcpy_big,
    "R": _emscripten_receive_on_main_thread_js,
    "K": _emscripten_resize_heap,
    "S": _emscripten_set_canvas_element_size,
    "x": _emscripten_set_current_thread_status,
    "Q": _emscripten_set_thread_name,
    "T": _emscripten_webgl_create_context,
    "u": _fd_close,
    "Z": _fd_read,
    "H": _fd_seek,
    "t": _fd_write,
    "ha": _ftime,
    "b": _getTempRet0,
    "o": _gettimeofday,
    "I": initPthreadsJS,
    "p": invoke_i,
    "h": invoke_ii,
    "g": invoke_iii,
    "k": invoke_iiii,
    "s": invoke_iiiii,
    "G": invoke_v,
    "f": invoke_vi,
    "e": invoke_vii,
    "w": invoke_viii,
    "F": invoke_viiii,
    "a": wasmMemory,
    "z": _pthread_cleanup_pop,
    "A": _pthread_cleanup_push,
    "q": _pthread_create,
    "v": _pthread_join,
    "ia": _time
};
var asm = createWasm();
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function () {
    return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["la"]).apply(null, arguments)
};
var _getDevices = Module["_getDevices"] = function () {
    return (_getDevices = Module["_getDevices"] = Module["asm"]["ma"]).apply(null, arguments)
};
var _main = Module["_main"] = function () {
    return (_main = Module["_main"] = Module["asm"]["na"]).apply(null, arguments)
};
var _webapi_init = Module["_webapi_init"] = function () {
    return (_webapi_init = Module["_webapi_init"] = Module["asm"]["oa"]).apply(null, arguments)
};
var _pthread_self = Module["_pthread_self"] = function () {
    return (_pthread_self = Module["_pthread_self"] = Module["asm"]["qa"]).apply(null, arguments)
};
var _free = Module["_free"] = function () {
    return (_free = Module["_free"] = Module["asm"]["ra"]).apply(null, arguments)
};
var _malloc = Module["_malloc"] = function () {
    return (_malloc = Module["_malloc"] = Module["asm"]["sa"]).apply(null, arguments)
};
var ___errno_location = Module["___errno_location"] = function () {
    return (___errno_location = Module["___errno_location"] = Module["asm"]["ta"]).apply(null, arguments)
};
var _webapi_getDeviceInfo = Module["_webapi_getDeviceInfo"] = function () {
    return (_webapi_getDeviceInfo = Module["_webapi_getDeviceInfo"] = Module["asm"]["ua"]).apply(null, arguments)
};
var _webapi_shutdown = Module["_webapi_shutdown"] = function () {
    return (_webapi_shutdown = Module["_webapi_shutdown"] = Module["asm"]["va"]).apply(null, arguments)
};
var _webapi_getResult = Module["_webapi_getResult"] = function () {
    return (_webapi_getResult = Module["_webapi_getResult"] = Module["asm"]["wa"]).apply(null, arguments)
};
var _webapi_setLogLevels = Module["_webapi_setLogLevels"] = function () {
    return (_webapi_setLogLevels = Module["_webapi_setLogLevels"] = Module["asm"]["xa"]).apply(null, arguments)
};
var _webapi_sendFile = Module["_webapi_sendFile"] = function () {
    return (_webapi_sendFile = Module["_webapi_sendFile"] = Module["asm"]["ya"]).apply(null, arguments)
};
var _webapi_getFile = Module["_webapi_getFile"] = function () {
    return (_webapi_getFile = Module["_webapi_getFile"] = Module["asm"]["za"]).apply(null, arguments)
};
var _webapi_getFileSize = Module["_webapi_getFileSize"] = function () {
    return (_webapi_getFileSize = Module["_webapi_getFileSize"] = Module["asm"]["Aa"]).apply(null, arguments)
};
var _webapi_installOS = Module["_webapi_installOS"] = function () {
    return (_webapi_installOS = Module["_webapi_installOS"] = Module["asm"]["Ba"]).apply(null, arguments)
};
var _webapi_getInstallOSProgress = Module["_webapi_getInstallOSProgress"] = function () {
    return (_webapi_getInstallOSProgress = Module["_webapi_getInstallOSProgress"] = Module["asm"]["Ca"]).apply(null, arguments)
};
var _webapi_cancelOperation = Module["_webapi_cancelOperation"] = function () {
    return (_webapi_cancelOperation = Module["_webapi_cancelOperation"] = Module["asm"]["Da"]).apply(null, arguments)
};
var _webapi_getDirList = Module["_webapi_getDirList"] = function () {
    return (_webapi_getDirList = Module["_webapi_getDirList"] = Module["asm"]["Ea"]).apply(null, arguments)
};
var _webapi_cancelDirListing = Module["_webapi_cancelDirListing"] = function () {
    return (_webapi_cancelDirListing = Module["_webapi_cancelDirListing"] = Module["asm"]["Fa"]).apply(null, arguments)
};
var _webapi_getScreen = Module["_webapi_getScreen"] = function () {
    return (_webapi_getScreen = Module["_webapi_getScreen"] = Module["asm"]["Ga"]).apply(null, arguments)
};
var _webapi_echo = Module["_webapi_echo"] = function () {
    return (_webapi_echo = Module["_webapi_echo"] = Module["asm"]["Ha"]).apply(null, arguments)
};
var _deviceAdded = Module["_deviceAdded"] = function () {
    return (_deviceAdded = Module["_deviceAdded"] = Module["asm"]["Ia"]).apply(null, arguments)
};
var _deviceRemoved = Module["_deviceRemoved"] = function () {
    return (_deviceRemoved = Module["_deviceRemoved"] = Module["asm"]["Ja"]).apply(null, arguments)
};
var _readCallback = Module["_readCallback"] = function () {
    return (_readCallback = Module["_readCallback"] = Module["asm"]["Ka"]).apply(null, arguments)
};
var _emscripten_tls_init = Module["_emscripten_tls_init"] = function () {
    return (_emscripten_tls_init = Module["_emscripten_tls_init"] = Module["asm"]["La"]).apply(null, arguments)
};
var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = function () {
    return (_emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = Module["asm"]["Ma"]).apply(null, arguments)
};
var __get_tzname = Module["__get_tzname"] = function () {
    return (__get_tzname = Module["__get_tzname"] = Module["asm"]["Na"]).apply(null, arguments)
};
var __get_daylight = Module["__get_daylight"] = function () {
    return (__get_daylight = Module["__get_daylight"] = Module["asm"]["Oa"]).apply(null, arguments)
};
var __get_timezone = Module["__get_timezone"] = function () {
    return (__get_timezone = Module["__get_timezone"] = Module["asm"]["Pa"]).apply(null, arguments)
};
var _emscripten_main_browser_thread_id = Module["_emscripten_main_browser_thread_id"] = function () {
    return (_emscripten_main_browser_thread_id = Module["_emscripten_main_browser_thread_id"] = Module["asm"]["Qa"]).apply(null, arguments)
};
var ___pthread_tsd_run_dtors = Module["___pthread_tsd_run_dtors"] = function () {
    return (___pthread_tsd_run_dtors = Module["___pthread_tsd_run_dtors"] = Module["asm"]["Ra"]).apply(null, arguments)
};
var _emscripten_main_thread_process_queued_calls = Module["_emscripten_main_thread_process_queued_calls"] = function () {
    return (_emscripten_main_thread_process_queued_calls = Module["_emscripten_main_thread_process_queued_calls"] = Module["asm"]["Sa"]).apply(null, arguments)
};
var _emscripten_current_thread_process_queued_calls = Module["_emscripten_current_thread_process_queued_calls"] = function () {
    return (_emscripten_current_thread_process_queued_calls = Module["_emscripten_current_thread_process_queued_calls"] = Module["asm"]["Ta"]).apply(null, arguments)
};
var _emscripten_register_main_browser_thread_id = Module["_emscripten_register_main_browser_thread_id"] = function () {
    return (_emscripten_register_main_browser_thread_id = Module["_emscripten_register_main_browser_thread_id"] = Module["asm"]["Ua"]).apply(null, arguments)
};
var __emscripten_do_dispatch_to_thread = Module["__emscripten_do_dispatch_to_thread"] = function () {
    return (__emscripten_do_dispatch_to_thread = Module["__emscripten_do_dispatch_to_thread"] = Module["asm"]["Va"]).apply(null, arguments)
};
var _emscripten_sync_run_in_main_thread_4 = Module["_emscripten_sync_run_in_main_thread_4"] = function () {
    return (_emscripten_sync_run_in_main_thread_4 = Module["_emscripten_sync_run_in_main_thread_4"] = Module["asm"]["Wa"]).apply(null, arguments)
};
var _emscripten_run_in_main_runtime_thread_js = Module["_emscripten_run_in_main_runtime_thread_js"] = function () {
    return (_emscripten_run_in_main_runtime_thread_js = Module["_emscripten_run_in_main_runtime_thread_js"] = Module["asm"]["Xa"]).apply(null, arguments)
};
var __emscripten_call_on_thread = Module["__emscripten_call_on_thread"] = function () {
    return (__emscripten_call_on_thread = Module["__emscripten_call_on_thread"] = Module["asm"]["Ya"]).apply(null, arguments)
};
var _emscripten_proxy_main = Module["_emscripten_proxy_main"] = function () {
    return (_emscripten_proxy_main = Module["_emscripten_proxy_main"] = Module["asm"]["Za"]).apply(null, arguments)
};
var __emscripten_thread_init = Module["__emscripten_thread_init"] = function () {
    return (__emscripten_thread_init = Module["__emscripten_thread_init"] = Module["asm"]["_a"]).apply(null, arguments)
};
var stackSave = Module["stackSave"] = function () {
    return (stackSave = Module["stackSave"] = Module["asm"]["$a"]).apply(null, arguments)
};
var stackRestore = Module["stackRestore"] = function () {
    return (stackRestore = Module["stackRestore"] = Module["asm"]["ab"]).apply(null, arguments)
};
var stackAlloc = Module["stackAlloc"] = function () {
    return (stackAlloc = Module["stackAlloc"] = Module["asm"]["bb"]).apply(null, arguments)
};
var _emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = function () {
    return (_emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = Module["asm"]["cb"]).apply(null, arguments)
};
var ___cxa_can_catch = Module["___cxa_can_catch"] = function () {
    return (___cxa_can_catch = Module["___cxa_can_catch"] = Module["asm"]["db"]).apply(null, arguments)
};
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function () {
    return (___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = Module["asm"]["eb"]).apply(null, arguments)
};
var _memalign = Module["_memalign"] = function () {
    return (_memalign = Module["_memalign"] = Module["asm"]["fb"]).apply(null, arguments)
};
var __emscripten_allow_main_runtime_queued_calls = Module["__emscripten_allow_main_runtime_queued_calls"] = 39364;
var __emscripten_main_thread_futex = Module["__emscripten_main_thread_futex"] = 237168;

function invoke_i(index) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)()
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_ii(index, a1) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_vii(index, a1, a2) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_iii(index, a1, a2) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_vi(index, a1) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_viii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_iiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3, a4)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_v(index) {
    var sp = stackSave();
    try {
        wasmTable.get(index)()
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_viiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
Module["cwrap"] = cwrap;
Module["getValue"] = getValue;
Module["UTF8ToString"] = UTF8ToString;
Module["PThread"] = PThread;
Module["PThread"] = PThread;
Module["wasmMemory"] = wasmMemory;
Module["ExitStatus"] = ExitStatus;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
var calledRun;

function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller
};

function callMain(args) {
    var entryFunction = Module["_emscripten_proxy_main"];
    args = args || [];
    var argc = args.length + 1;
    var argv = stackAlloc((argc + 1) * 4);
    HEAP32[argv >> 2] = allocateUTF8OnStack(thisProgram);
    for (var i = 1; i < argc; i++) {
        HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1])
    }
    HEAP32[(argv >> 2) + argc] = 0;
    try {
        var ret = entryFunction(argc, argv)
    } finally {
        calledMain = true
    }
}

function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return
    }
    if (ENVIRONMENT_IS_PTHREAD) {
        initRuntime();
        postMessage({
            "cmd": "loaded"
        });
        return
    }
    preRun();
    if (runDependencies > 0) {
        return
    }

    function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        if (shouldRunNow) callMain(args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function () {
            setTimeout(function () {
                Module["setStatus"]("")
            }, 1);
            doRun()
        }, 1)
    } else {
        doRun()
    }
}
Module["run"] = run;

function exit(status, implicit) {
    EXITSTATUS = status;
    if (implicit && keepRuntimeAlive() && status === 0) {
        return
    }
    if (!implicit) {
        if (ENVIRONMENT_IS_PTHREAD) {
            postMessage({
                "cmd": "exitProcess",
                "returnCode": status
            });
            throw new ExitStatus(status)
        } else { }
    }
    if (keepRuntimeAlive()) { } else {
        PThread.terminateAllThreads();
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status);
        ABORT = true
    }
    quit_(status, new ExitStatus(status))
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) shouldRunNow = false;
if (ENVIRONMENT_IS_PTHREAD) {
    noExitRuntime = false;
    PThread.initWorker()
}
run();