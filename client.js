const id = (eid) => {
    return document.getElementById(eid);
};
id("startmirror").onclick = async () => {
    let api = new TI_USB();
    let deviceManager = new TI_DeviceManager();
    deviceManager.addDevice(await api.getDevices());
    let device = deviceManager.getDevice();
    device = await api.openDevice(device);
    window.gdevice = device;
    window.gmanager = deviceManager;
    window.gapi = api;
    console.log(device);
    // let webcon = new TIWebConnApi(console.log);
};