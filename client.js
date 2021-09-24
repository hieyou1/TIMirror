const id = (eid) => {
    return document.getElementById(eid);
};
id("startmirror").onclick = async () => {
    let api = new TI_USB();
    let device = await api.getDevices();
    device = await api.openDevice();
    window.alert(device);
};