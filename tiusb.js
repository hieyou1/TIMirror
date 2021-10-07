const SCREEN_SIZE = 320 * 240 * 2;
const BIT_5_FACTOR = 255 / 31;
const BIT_6_FACTOR = 255 / 63;
const TI_Event = {
    "TI_DEVICE_CONNECTED": 0,
    "TI_DEVICE_DISCONNECTED": 1,
    "TI_DEVICE_INFO": 2,
    "TI_DEVICE_SEND": 3,
    "TI_DEVICE_GET": 4,
    "TI_DEVICE_DIR": 5,
    "TI_DEVICE_FILESIZE": 6,
    "TI_DEVICE_SCREEN": 7,
    "TI_DEVICE_INSTALLOS": 8,
    "TI_DEVICE_ECHOTEST": 9,
    "TI_DEVICE_ECHOUPDATE": 10
};
class TICalculatorCCode {
    constructor() {
        this.buffer8888 = new Uint8Array(SCREEN_SIZE * 2);
        this.t
    }
    init(connectCallback, disconnectCallback,
        connectingCallback, noDeviceSelectionCallback, connectionFailedCallback) {
        this.connectCallback = connectCallback;
        this.disconnectCallback = disconnectCallback;
        this.connectingCallback = connectingCallback;
        this.noDeviceSelectionCallback = noDeviceSelectionCallback;
        this.connectionFailedCallback = connectionFailedCallback;
        const self = this;
        return new Promise((resolve, reject) => {
            const createModuleCallback = () => {
                Module.resolveInitialization = () => {
                    if (self.t) clearTimeout(self.t);
                    Module.print = function () {
                        return function (text) {
                            if (arguments.length >
                                1) text = Array.prototype.slice.call(arguments).join(" ");
                            if (text.indexOf("DEBUG:") === 0) console.debug(text);
                            else if (text.indexOf("ERROR:") === 0) console.error(text);
                            else console.log(text)
                        }
                    };
                    Module.printErr = function (text) {
                        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(" ");
                        console.error(text)
                    };
                    const getModuleMethod = (m, r, p) => {
                        if (Module[`_${m}`]) return Module.cwrap(m, r, p);
                        else {
                            console.error(`Couldn't find ${m} in the module!!!`);
                            return undefined
                        }
                    };
                    self._getDevices = getModuleMethod("getDevices",
                        "", [""]);
                    self.deviceAdded = getModuleMethod("deviceAdded", "", ["number"]);
                    self.deviceRemoved = getModuleMethod("deviceRemoved", "", ["number"]);
                    self.readCallback = getModuleMethod("readCallback", "", ["number", "number", "number"]);
                    self._getFile = getModuleMethod("webapi_getFile", "number", ["number"]);
                    self._getDirectory = getModuleMethod("webapi_getDirList", "number", ["number", "number", "number"]);
                    self._getScreen = getModuleMethod("webapi_getScreen", "number", ["number", "number"]);
                    self._getDeviceInfo = getModuleMethod("webapi_getDeviceInfo",
                        "number", ["number"]);
                    self.sendFile = getModuleMethod("webapi_sendFile", "number", ["number", "number", "number"]);
                    self._installOS = getModuleMethod("webapi_installOS", "number", ["number", "number", "number"]);
                    self._getFileSize = getModuleMethod("webapi_getFileSize", "number", ["number", "number"]);
                    self.shutdown = getModuleMethod("webapi_shutdown", "number", [""]);
                    self.getLastResult = getModuleMethod("webapi_getResult", "number", [""]);
                    self.getInstallOSProgress = getModuleMethod("webapi_getInstallOSProgress", "number", [""]);
                    self.cancelOperation = getModuleMethod("webapi_cancelOperation", "", [""]);
                    self.cancelDirListing = getModuleMethod("webapi_cancelDirListing", "", [""]);
                    self._setLogLevels = getModuleMethod("webapi_setLogLevels", "number", ["number", "number"]);
                    self._echoTest = getModuleMethod("webapi_echo", "number", ["number", "number", "number", "number", "number"]);
                    self.buffer8888 = new Uint8Array(SCREEN_SIZE * 2);
                    resolve()
                };
                self.t = setTimeout(() => {
                    reject("WASM Load timed out")
                }, 2E3)
            };
            if (typeof Module !== "undefined") createModuleCallback();
            else {
                console.log("waiting for connectivity module to load");
                setTimeout(() => {
                    createModuleCallback()
                }, 3E3)
            }
        })
    }
    async getDevices() {
        this._getDevices()
    }
    async getFileSize(deviceFileName) {
        TICalculatorCCode.instance.sizeptr = this.allocateMemory(4);
        TICalculatorCCode.instance.nameptr = this.allocateAndSet(intArrayFromString(deviceFileName), "i8", ALLOC_NORMAL);
        let result = await this.getFileSizeInternal();
        let fileSize = getValue(TICalculatorCCode.instance.sizeptr, "i32");
        this.freeMem(TICalculatorCCode.instance.sizeptr);
        this.freeMem(TICalculatorCCode.instance.nameptr);
        return result < 0 ? result : fileSize
    }
    getFileSizeInternal() {
        return new Promise(resolve => {
            TICalculatorCCode.instance.resolve = resolve;
            this._getFileSize(TICalculatorCCode.instance.nameptr, TICalculatorCCode.instance.sizeptr)
        })
    }
    async putFile(buffer, devicefilename) {
        TICalculatorCCode.instance.bufferptr = this.allocateAndSet(buffer, "i8", ALLOC_NORMAL);
        TICalculatorCCode.instance.nameptr = this.allocateAndSet(intArrayFromString(devicefilename), "i8", ALLOC_NORMAL);
        TICalculatorCCode.instance.bufferlength =
            buffer.length;
        let result = await this.putFileInternal();
        this.freeMem(TICalculatorCCode.instance.bufferptr);
        this.freeMem(TICalculatorCCode.instance.nameptr);
        return result
    }
    putFileInternal() {
        return new Promise(resolve => {
            TICalculatorCCode.instance.resolve = resolve;
            this.sendFile(TICalculatorCCode.instance.bufferptr, TICalculatorCCode.instance.bufferlength, TICalculatorCCode.instance.nameptr)
        })
    }
    async getFile(deviceFileName) {
        TICalculatorCCode.instance.nameptr = this.allocateAndSet(intArrayFromString(deviceFileName),
            "i8", ALLOC_NORMAL);
        let result = await this.getFileInternal();
        this.freeMem(TICalculatorCCode.instance.nameptr);
        return result
    }
    getFileInternal() {
        return new Promise(resolve => {
            TICalculatorCCode.instance.resolve = resolve;
            this._getFile(TICalculatorCCode.instance.nameptr)
        })
    }
    getFileContents() {
        const fileContents = FS.root.contents["getfile.tns"];
        const size = fileContents.usedBytes;
        if (fileContents != null && size > 0) {
            const buffer = new Uint8Array(size);
            for (let i = 0; i < size; i++) buffer[i] = fileContents.contents[i];
            return buffer
        } else return null
    }
    async getDirectory() {
        TICalculatorCCode.instance.bufferptr =
            this.allocateMemory(100 * 1024);
        TICalculatorCCode.instance.bufferlength = 100 * 1024;
        TICalculatorCCode.instance.nameptr = this.allocateAndSet(intArrayFromString("/"), "i8", ALLOC_NORMAL);
        let dirString = await this.getDirectoryInternal();
        this.freeMem(TICalculatorCCode.instance.nameptr);
        this.freeMem(TICalculatorCCode.instance.bufferptr);
        return dirString
    }
    getDirectoryInternal() {
        return new Promise(resolve => {
            TICalculatorCCode.instance.resolve = resolve;
            this._getDirectory(TICalculatorCCode.instance.bufferptr, TICalculatorCCode.instance.bufferlength,
                TICalculatorCCode.instance.nameptr)
        })
    }
    async getScreen() {
        TICalculatorCCode.instance.bufferptr = this.allocateMemory(SCREEN_SIZE);
        let buffer565 = await this.getScreenInternal();
        for (let i = 0, j = 0; i < SCREEN_SIZE; i += 2, j += 4) {
            const color565 = buffer565[i] + (buffer565[i + 1] << 8);
            this.buffer8888[j] = Math.round((color565 >> 11) * BIT_5_FACTOR) & 255;
            this.buffer8888[j + 1] = Math.round((color565 >> 5 & 63) * BIT_6_FACTOR) & 255;
            this.buffer8888[j + 2] = Math.round((color565 & 31) * BIT_5_FACTOR) & 255;
            this.buffer8888[j + 3] = 255
        }
        this.freeMem(TICalculatorCCode.instance.bufferptr);
        return this.buffer8888
    }
    getScreenInternal() {
        return new Promise(resolve => {
            TICalculatorCCode.instance.resolve = resolve;
            this._getScreen(TICalculatorCCode.instance.bufferptr, SCREEN_SIZE)
        })
    }
    async getDeviceInfo() {
        const SIZE = 8 + 8 + 8 + 16;
        TICalculatorCCode.instance.bufferptr = this.allocateMemory(SIZE);
        TICalculatorCCode.instance.bufferlength = SIZE;
        const arr = await this.getDeviceInfoInternal();
        const dival = {};
        dival.deviceCode = arr[0];
        dival.major = arr[1];
        dival.minor = arr[2];
        dival.build = arr[3] | arr[4] << 8;
        this.freeMem(TICalculatorCCode.instance.bufferptr);
        return dival
    }
    getDeviceInfoInternal() {
        return new Promise(resolve => {
            TICalculatorCCode.instance.resolve = resolve;
            this._getDeviceInfo(TICalculatorCCode.instance.bufferptr)
        })
    }
    async installOS(buffer) {
        TICalculatorCCode.instance.bufferptr = this.allocateAndSet(buffer, "i8", ALLOC_NORMAL);
        TICalculatorCCode.instance.bufferlength = buffer.length;
        TICalculatorCCode.instance.installSpaceDeficitPtr = this.allocateMemory(4);
        let result = await this.installOSInternal();
        this.freeMem(TICalculatorCCode.instance.bufferptr);
        this.freeMem(TICalculatorCCode.instance.installSpaceDeficitPtr);
        return result
    }
    installOSInternal() {
        return new Promise(resolve => {
            TICalculatorCCode.instance.resolve = resolve;
            this._installOS(TICalculatorCCode.instance.bufferptr, TICalculatorCCode.instance.bufferlength, TICalculatorCCode.instance.installSpaceDeficitPtr)
        })
    }
    async echoTest(buffer, min, max, step, iterations) {
        TICalculatorCCode.instance.bufferptr = this.allocateAndSet(buffer, "i8", ALLOC_NORMAL);
        TICalculatorCCode.instance.min = min;
        TICalculatorCCode.instance.max = max;
        TICalculatorCCode.instance.step = step;
        TICalculatorCCode.instance.iterations =
            iterations;
        let result = await this.echoTestInternal();
        this.freeMem(TICalculatorCCode.instance.bufferptr);
        return result
    }
    echoTestInternal() {
        return new Promise(resolve => {
            TICalculatorCCode.instance.resolve = resolve;
            this._echoTest(TICalculatorCCode.instance.bufferptr, TICalculatorCCode.instance.min, TICalculatorCCode.instance.max, TICalculatorCCode.instance.step, TICalculatorCCode.instance.iterations)
        })
    }
    getContentsOfLogFile(logFileName) {
        return FS.root.contents[logFileName].contents
    }
    setLogLevels(consoleLevel,
        fileLevel) {
        this._setLogLevels(consoleLevel, fileLevel)
    }
    getUint8ArrayFromCbuffer(begin, end) {
        return new Uint8Array(Module.HEAPU8.subarray(begin, end))
    }
    getJSStringFromCString(p) {
        return Module.UTF8ToString(p)
    }
    allocateMemory(size) {
        return Module._malloc(size)
    }
    setArrayInModule(s, buf) {
        Module.HEAPU8.set(s, buf);
        return buf
    }
    allocateAndSet(a, t, m) {
        const p = this.allocateMemory(a.length);
        Module.HEAPU8.set(a, p);
        return p
    }
    setStringInModule(s) {
        var buffer = this.allocateMemory(s.length + 1);
        Module.stringToUTF8(s, buffer, s.length +
            1);
        return buffer
    }
    freeMem(p) {
        Module["_free"](p)
    }
    setContent(text) {
        let b = document.getElementById("content");
        if (b.value === "") b.value = text;
        else b.value += "\n" + text
    }
    eventCallback(event) {
        let dirString, fileSize, installSpaceDeficit, saddr;
        switch (event) {
            case TI_Event["TI_DEVICE_CONNECTED"]:
                this.connectCallback();
                break;
            case TI_Event["TI_DEVICE_DISCONNECTED"]:
                this.disconnectCallback();
                break;
            case TI_Event["TI_DEVICE_INFO"]:
                saddr = TICalculatorCCode.instance.bufferptr;
                const BUFFERLN = TICalculatorCCode.instance.bufferptr;
                TICalculatorCCode.instance.resolve(this.getUint8ArrayFromCbuffer(saddr, saddr + BUFFERLN));
                break;
            case TI_Event["TI_DEVICE_SEND"]:
                TICalculatorCCode.instance.resolve(this.getLastResult());
                break;
            case TI_Event["TI_DEVICE_GET"]:
                TICalculatorCCode.instance.resolve(this.getLastResult());
                break;
            case TI_Event["TI_DEVICE_DIR"]:
                dirString = this.getJSStringFromCString(TICalculatorCCode.instance.bufferptr);
                TICalculatorCCode.instance.resolve(dirString);
                break;
            case TI_Event["TI_DEVICE_FILESIZE"]:
                TICalculatorCCode.instance.resolve(this.getLastResult());
                break;
            case TI_Event["TI_DEVICE_INSTALLOS"]:
                installSpaceDeficit = getValue(TICalculatorCCode.instance.installSpaceDeficitPtr, "i32");
                TICalculatorCCode.instance.resolve({
                    statusResult: this.getLastResult(),
                    spaceDeficit: installSpaceDeficit
                });
                break;
            case TI_Event["TI_DEVICE_SCREEN"]:
                saddr = TICalculatorCCode.instance.bufferptr;
                TICalculatorCCode.instance.resolve(this.getUint8ArrayFromCbuffer(saddr, saddr + SCREEN_SIZE));
                break;
            case TI_Event["TI_DEVICE_ECHOTEST"]:
                TICalculatorCCode.instance.resolve(this.getLastResult());
                break;
            case TI_Event["TI_DEVICE_ECHOUPDATE"]:
                console.log("echo update\n");
                break;
            default:
                break
        }
    }
}
TICalculatorCCode.getInstance = () => {
    if (!TICalculatorCCode.instance) TICalculatorCCode.instance = new TICalculatorCCode;
    return TICalculatorCCode.instance
};
class TIWebConnApi {
    constructor() { }
    init(connectCallback, disconnectCallback, connectingCallback, noDeviceSelectionCallback, connectionFailedCallback) {
        return TICalculatorCCode.getInstance().init(connectCallback, disconnectCallback, connectingCallback, noDeviceSelectionCallback, connectionFailedCallback)
    }
    getFileSize(deviceFileName) {
        return TICalculatorCCode.getInstance().getFileSize(deviceFileName)
    }
    putFile(buffer, deviceFileName) {
        return TICalculatorCCode.getInstance().putFile(buffer, deviceFileName)
    }
    getFile(deviceFileName) {
        return TICalculatorCCode.getInstance().getFile(deviceFileName)
    }
    getFileContents() {
        return TICalculatorCCode.getInstance().getFileContents()
    }
    getDirectory() {
        return TICalculatorCCode.getInstance().getDirectory()
    }
    getScreen() {
        return TICalculatorCCode.getInstance().getScreen()
    }
    getDeviceInfo() {
        return TICalculatorCCode.getInstance().getDeviceInfo()
    }
    installOS(deviceFileName) {
        return TICalculatorCCode.getInstance().installOS(deviceFileName)
    }
    getContentsOfLogFile(logFileName) {
        return TICalculatorCCode.getInstance().getContentsOfLogFile(logFileName)
    }
    setLogLevels(consoleLevel,
        fileLevel) {
        return TICalculatorCCode.getInstance().setLogLevels(consoleLevel, fileLevel)
    }
    getDevices() {
        return TICalculatorCCode.getInstance().getDevices()
    }
    getInstallOSProgress() {
        return TICalculatorCCode.getInstance().getInstallOSProgress()
    }
    cancelOperation() {
        return TICalculatorCCode.getInstance().cancelOperation()
    }
    cancelDirListing() {
        return TICalculatorCCode.getInstance().cancelDirListing()
    }
    echoTest(buffer, min, max, step, iterations) {
        return TICalculatorCCode.getInstance().echoTest(buffer, min, max, step, iterations)
    }
}
function TI_DeviceManager() {
    TI_DeviceManager.instance = this;
    this.device
}
TI_DeviceManager.getInstance = () => {
    if (!TI_DeviceManager.instance) TI_DeviceManager.instance = new TI_DeviceManager;
    return TI_DeviceManager.instance
};
TI_DeviceManager.prototype.addDevice = webUSBdevice => {
    const currentDevice = {
        webUSBDevice: webUSBdevice,
        open: false,
        vendorId: webUSBdevice.vendorId,
        productId: webUSBdevice.productId,
        name: "CX-II (not from device)"
    };
    TI_DeviceManager.instance.tiDevice = currentDevice;
    return 0
};
TI_DeviceManager.prototype.removeDevice =
    webUSBDevice => {
        if (TI_DeviceManager.instance.tiDevice.webUSBDevice === webUSBDevice.device) {
            console.log("--- removing device ");
            TI_DeviceManager.instance.tiDevice = null;
            return true
        } else {
            console.log("NOT removing device ");
            return false
        }
    };
TI_DeviceManager.prototype.getDevice = () => {
    return TI_DeviceManager.instance.tiDevice
};
const VID = 1105;
const PID = 57378;
const filter = {
    "vendorId": VID,
    "productId": PID
};

function TI_USB() {
    TI_USB.instance = this
}
TI_USB.getInstance = () => {
    if (!TI_USB.instance) TI_USB.instance = new TI_USB;
    return TI_USB.instance
};
TI_USB.prototype.openDevice = tidevice => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                await tidevice.webUSBDevice.open();
                const configValue = tidevice.webUSBDevice.configurations[0].configurationValue;
                await tidevice.webUSBDevice.selectConfiguration(configValue);
                for (let iFace =
                    0; iFace < tidevice.webUSBDevice.configurations.length; iFace += 1)
                    for (let i = 0; i < tidevice.webUSBDevice.configurations[iFace].interfaces[0].alternates[0].endpoints.length; i += 1) {
                        const endpoint = tidevice.webUSBDevice.configurations[0].interfaces[0].alternates[0].endpoints[i];
                        if (endpoint.direction === "out") tidevice.outputEndpoint = endpoint.endpointNumber;
                        if (endpoint.direction === "in") tidevice.inputEndpoint = endpoint.endpointNumber
                    }
                tidevice.name = tidevice.webUSBDevice.productName;
                tidevice.open = true;
                await tidevice.webUSBDevice.claimInterface(0);
                console.log("opened device + " + JSON.stringify(tidevice));
                resolve(tidevice)
            } catch (error) {
                reject(error)
            }
        })()
    })
};
TI_USB.prototype.getDevices = () => {
    return new Promise((resolve, reject) => {
        (async () => {
            console.log("Calling requestDevice");
            try {
                var usbDevice = await navigator.usb.requestDevice({
                    filters: [filter]
                });
                resolve(usbDevice)
            } catch (error) {
                reject(error)
            }
        })()
    })
};
TI_USB.prototype.write = (tidevice, data) => {
    return new Promise((resolve, reject) => {
        (async function () {
            try {
                const oe = tidevice.outputEndpoint;
                let transferResult =
                    await tidevice.webUSBDevice.transferOut(oe, data);
                let result = transferResult.status === "ok" ? 0 : 1;
                if (result === 0) resolve(result);
                else reject(result)
            } catch (error) {
                reject(error)
            }
        })()
    })
};
TI_USB.prototype.read = tidevice => {
    const MAX_DATA_SIZE = 4 * 1024;
    return new Promise((resolve, reject) => {
        (async function () {
            try {
                const inEndpoint = tidevice.inputEndpoint;
                let result = await tidevice.webUSBDevice.transferIn(inEndpoint, MAX_DATA_SIZE);
                if (result.status === "ok") resolve(new Uint8Array(result.data.buffer));
                else reject(result.status)
            } catch (error) {
                reject(error)
            }
        })()
    })
};
TI_USB.prototype.addOnDeviceAddedListener = function (callback) {
    navigator.usb.onconnect = async function (webUSBDevice) {
        callback(webUSBDevice)
    }
};
TI_USB.prototype.addOnDeviceRemovedListener = function (callback) {
    navigator.usb.ondisconnect = function (webUSBDevice) {
        callback(webUSBDevice)
    }
};