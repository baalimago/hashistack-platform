import {
    BackgroundCore
} from "./bg/bg_core.js";
import {
    ImagoElement
} from "./imago-element/init.js";

let bgCore = new BackgroundCore;
bgCore.init();

let keyDownActions = [],
    keyUpActions = [];

window.customElements.define('imago-element', ImagoElement);

window.DEV = location.hostname === "localhost";

window.registerKeydown = (id, key, cb) => {
    keyDownActions.push({
        id: id,
        key: key,
        action: cb
    });
};

window.registerKeyup = (id, key, cb) => {
    keyUpActions.push({
        id: id,
        key: key,
        action: cb
    });
}

window.removeKeydown = (id, key) => {
    keyDownActions.splice(
        keyDownActions.indexOf(
            keyDownActions.find(x => x.id === id && x.key === key), 1)
    );
}

window.removeKeyup = (id, key) => {
    keyUpActions.splice(
        keyUpActions.indexOf(
            keyUpActions.find(x => x.id === id && x.key === key), 1)
    );

}

document.addEventListener('keydown', (event) => {
    handleKeyDown(event);
}, false);

document.addEventListener('keyup', (event) => {
    handleKeyUp(event);
}, false);


function handleKeyUp(event) {
    const keyName = event.key;

    for (const p of keyUpActions) {
        if (p.key === keyName) {
            p.action();
        }
    }
}

function handleKeyDown(event) {
    const keyName = event.key;
    if (keyName == 'p') {
        plog();
    }

    for (const p of keyDownActions) {
        if (p.key === keyName) {
            p.action();
        }
    }
}

function plog(inp) {
    if (inp === undefined) {
        alert("Paused");
        return;
    }
    console.log(inp);
    alert(JSON.stringify(inp));
}


window.round = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

window.shadows = {}