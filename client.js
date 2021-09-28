const id = (eid) => {
    return document.getElementById(eid);
};
id("startmirror").onclick = async () => {
    let api = new TI_USB();
    let device = await api.getDevices();
    device = await api.openDevice();
    let webcon = new TIWebConnApi(window.alert, window.alert, window.alert, window.alert, window.alert);
    window.alert(device);
    window.api = api;
    window.device = device;
    console.log("done");
};