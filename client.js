const id = (eid) => {
    return document.getElementById(eid);
};
id("startmirror").onclick = async () => {
    id("card-body").innerText = "Connecting to calculator...";
    let api = new TIWebConnApi();
    let scr = document.createElement("script");
    scr.src = "tiusb-1.js";
    document.body.appendChild(scr);
    await new Promise(async (resolveall) => {
        await new Promise((resolve) => {
            scr.onload = async () => {
                await api.init(resolveall, console.log, console.log, console.log, console.log);
                resolve();
            };
        });
        await api.getDevices();
    });
    console.log(await api.getDeviceInfo());
    window.tiapi = api;
    const setCtxToScreen = async (ctx) => {
        let screendata = await api.getScreen();
        let imagedata = new ImageData(320, 240);
        imagedata.data.set(screendata, 0);
        ctx.putImageData(imagedata, 0, 0);
    };
    let canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    id("card-body").innerText = "";
    id("card-body").appendChild(canvas);
    let mirror = async () => {
        await setCtxToScreen(canvas.getContext("2d"));
        window.requestAnimationFrame(mirror);
    };
    mirror();
};