const id = (eid) => {
    return document.getElementById(eid);
};
id("startmirror").onclick = async () => {
    let api = new TIWebConnApi();
    api.init(window.alert, window.alert, window.alert, window.alert, window.alert);
    window.alert(await api.getDevices());
};