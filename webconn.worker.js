var Module = {};

function threadPrintErr() {
    var text = Array.prototype.slice.call(arguments).join(" ");
    console.error(text)
}

function threadAlert() {
    var text = Array.prototype.slice.call(arguments).join(" ");
    postMessage({
        cmd: "alert",
        text: text,
        threadId: Module["_pthread_self"]()
    })
}
var err = threadPrintErr;
this.alert = threadAlert;
Module["instantiateWasm"] = function (info, receiveInstance) {
    var instance = new WebAssembly.Instance(Module["wasmModule"], info);
    receiveInstance(instance);
    Module["wasmModule"] = null;
    return instance.exports
};

function moduleLoaded() { }
this.onmessage = function (e) {
    try {
        if (e.data.cmd === "load") {
            Module["wasmModule"] = e.data.wasmModule;
            Module["wasmMemory"] = e.data.wasmMemory;
            Module["buffer"] = Module["wasmMemory"].buffer;
            Module["ENVIRONMENT_IS_PTHREAD"] = true;
            if (typeof e.data.urlOrBlob === "string") {
                importScripts(e.data.urlOrBlob)
            } else {
                var objectUrl = URL.createObjectURL(e.data.urlOrBlob);
                importScripts(objectUrl);
                URL.revokeObjectURL(objectUrl)
            }
            moduleLoaded()
        } else if (e.data.cmd === "objectTransfer") {
            Module["PThread"].receiveObjectTransfer(e.data)
        } else if (e.data.cmd === "run") {
            Module["__performance_now_clock_drift"] = performance.now() - e.data.time;
            Module["__emscripten_thread_init"](e.data.threadInfoStruct, 0, 0);
            var max = e.data.stackBase;
            var top = e.data.stackBase + e.data.stackSize;
            Module["establishStackSpace"](top, max);
            Module["PThread"].receiveObjectTransfer(e.data);
            Module["PThread"].threadInit();
            try {
                var result = Module["invokeEntryPoint"](e.data.start_routine, e.data.arg);
                if (Module["keepRuntimeAlive"]()) {
                    Module["PThread"].setExitStatus(result)
                } else {
                    Module["PThread"].threadExit(result)
                }
            } catch (ex) {
                if (ex === "Canceled!") {
                    Module["PThread"].threadCancel()
                } else if (ex != "unwind") {
                    if (ex instanceof Module["ExitStatus"]) {
                        if (Module["keepRuntimeAlive"]()) { } else {
                            Module["PThread"].threadExit(ex.status)
                        }
                    } else {
                        Module["PThread"].threadExit(-2);
                        throw ex
                    }
                }
            }
        } else if (e.data.cmd === "cancel") {
            if (Module["_pthread_self"]()) {
                Module["PThread"].threadCancel()
            }
        } else if (e.data.target === "setimmediate") { } else if (e.data.cmd === "processThreadQueue") {
            if (Module["_pthread_self"]()) {
                Module["_emscripten_current_thread_process_queued_calls"]()
            }
        } else {
            err("worker.js received unknown command " + e.data.cmd);
            err(e.data)
        }
    } catch (ex) {
        err("worker.js onmessage() captured an uncaught exception: " + ex);
        if (ex && ex.stack) err(ex.stack);
        throw ex
    }
};
if (typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string") {
    self = {
        location: {
            href: __filename
        }
    };
    var onmessage = this.onmessage;
    var nodeWorkerThreads = require("worker_threads");
    global.Worker = nodeWorkerThreads.Worker;
    var parentPort = nodeWorkerThreads.parentPort;
    parentPort.on("message", function (data) {
        onmessage({
            data: data
        })
    });
    var nodeFS = require("fs");
    var nodeRead = function (filename) {
        return nodeFS.readFileSync(filename, "utf8")
    };

    function globalEval(x) {
        global.require = require;
        global.Module = Module;
        eval.call(null, x)
    }
    importScripts = function (f) {
        globalEval(nodeRead(f))
    };
    postMessage = function (msg) {
        parentPort.postMessage(msg)
    };
    if (typeof performance === "undefined") {
        performance = {
            now: function () {
                return Date.now()
            }
        }
    }
}