let conigItems;
let shadowRoot, containerDom;
async function spawnItems() {
    await setContainerDom();
    let spawnPoint;
    containerDom.childNodes.forEach(el => {
        if (el.className == "config-items") {
            spawnPoint = el;
        }
    });
    // Clear previous items
    while (spawnPoint.childNodes.length > 0) {
        spawnPoint.removeChild(spawnPoint.childNodes[spawnPoint.childNodes.length - 1]);
    }
    // Determine wether to display config menu or no
    if (configItems === null ||
        configItems.runtime === undefined ||
        Object.keys(configItems.runtime).length < 1) {
        containerDom.classList.add("hidden");
        return;
    } else {
        containerDom.classList.remove("hidden");
    }

    // Spawn buttons container (always at bottom)
    let buttonSpawnPoint = document.createElement("div");
    buttonSpawnPoint.classList.add("btn-spawn-point");
    // Add new items
    Object.keys(configItems.runtime).forEach(key => {
        const confItem = constructConfigItem(key, configItems.runtime);
        if (!confItem.classList.contains("btn-container")) {
            spawnPoint.appendChild(confItem);
        } else {
            buttonSpawnPoint.appendChild(confItem);
        }
    });
    spawnPoint.appendChild(buttonSpawnPoint);
}

function constructConfigItem(key, confObj) {
    const itemCont = document.createElement("div");
    let inp = document.createElement("input");
    const label = document.createElement("label");
    label.setAttribute("for", key);
    label.innerText = formatLabel(key);
    inp.name = key;
    inp.id = key;
    switch (typeof confObj[key]) {
        case "object":
            inp = document.createElement("div");
            Object.keys(confObj[key]).forEach(subConfObjKey => {
                const childCont = constructConfigItem(subConfObjKey, confObj[key]);
                inp.classList.add("nested");
                childCont.classList.add("right-col");
                inp.appendChild(childCont);
            });
            break;

        case "number":
            inp.type = "number";
            itemCont.classList.add("config-item");
            inp.value = confObj[key];
            const decimalSplit = inp.value.toString().split(".");
            let amDecimals = 0;
            if (decimalSplit.length === 2) {
                amDecimals = decimalSplit[1].length;
            }
            let amDecimalsStr = "0.";
            for (let i = 0; i < amDecimals; i++) {
                if (i < amDecimals - 1) {
                    amDecimalsStr += "0";
                } else {
                    amDecimalsStr += "1";
                }
            }
            inp.step = amDecimalsStr;
            inp.addEventListener('keydown', e => {
                var key = e.keyCode ? e.keyCode : e.which;

                if (!([8, 9, 13, 27, 46, 110, 190].indexOf(key) !== -1 ||
                        (key == 65 && (e.ctrlKey || e.metaKey)) ||
                        (key >= 35 && key <= 40) ||
                        (key >= 48 && key <= 57 && !(e.shiftKey || e.altKey)) ||
                        (key >= 96 && key <= 105)
                    )) e.preventDefault();
            });
            inp.onchange = () => {
                if (inp.value !== null) {
                    confObj[key] = Number(inp.value);
                }
            };
            break;

        case "boolean":
            inp.type = "checkbox";
            itemCont.classList.add("config-item");
            inp.checked = confObj[key];
            inp.onchange = () => {
                confObj[key] = inp.checked;
            }
            break;

        case "function":
            inp.classList.add("btn");
            itemCont.classList.add("btn-container")
            inp.type = "button";
            inp.value = key;
            inp.onclick = confObj[key];
            label.innerText = ""
            break;

        default:
            console.log(confObj[key]);
            break;
    }
    itemCont.appendChild(label);
    itemCont.appendChild(inp);
    return itemCont;
}

function formatLabel(str) {
    let ret = str;
    ret.toLowerCase();
    ret[0].toUpperCase();
    ret += ": ";
    return ret;
}

async function setContainerDom() {
    return new Promise((resolve) => {
        const stop = setInterval(() => {
            shadowRoot = window.shadows[selfPath];
            if (shadowRoot !== undefined) {
                shadowRoot.childNodes.forEach(el => {
                    if (el.tagName == "DIV") {
                        containerDom = el;
                    }
                });
            }
            if (containerDom !== undefined) {
                clearInterval(stop);
                resolve();
            }
        }, 10);
    });
}

window.dispatchEvent(new CustomEvent("configLoaded"));

window.addEventListener('hasConfigLoadedCheck', () => {
    window.dispatchEvent(new CustomEvent("configLoaded"));
})

window.addEventListener("configUpdate", (event) => {
    configItems = event.detail;
    spawnItems();
});