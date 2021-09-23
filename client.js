const id = (eid) => {
    return document.getElementById(eid);
};
id("startmirror").onclick = async () => {
    let api = new TICalculatorCCode();
    api.init(window.alert, window.alert, window.alert, window.alert, window.alert);
    window.alert(await api.getDeviceInfo());
};