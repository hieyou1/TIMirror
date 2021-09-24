const id = (eid) => {
    return document.getElementById(eid);
};
id("startmirror").onclick = async () => {
    let api = new TI_USB();
    window.alert(await api.getDevices());
};