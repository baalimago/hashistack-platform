function getFile(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'text';
    xhr.onload = () => {
        let status = xhr.status;
        if (status == 200) {
            callback(200, xhr.response)
        } else {
            callback(status, xhr.response)
        }
    }
    xhr.send();
}

let hasHandeledUpdate = false;

function loadSubservices() {
    getFile("/api/v1/subServices", (status, res) => {
        if (status === 200) {
            if (res === "" || res === null) {
                setTimeout(() => {
                    loadSubservices();
                }, 200);
            } else {
                if (!hasHandeledUpdate) {
                    handleSubServicesUpdate(res);
                }
            }
        } else {
            console.error(`Failed to load subServices`);
        }
    });
}

function hideFailoverDom() {
    document.getElementById("backup").classList.add("hidden");
    document.getElementById("main").classList.remove("hidden");
}

function handleSubServicesUpdate(subServicesStr) {
    const subServices = JSON.parse(subServicesStr);
    if (subServices === null || subServices.length === 0) return;
    hideFailoverDom()
    hasHandeledUpdate = true;
    for (let i = 0; i < subServices.length; i++) {
        spawnSubServiceLink(subServices[i]);
    }
    dispatchEvent(new CustomEvent("addMouseStuffToLinkClassDoms"))
}

function spawnSubServiceLink(subService) {
    const mainContainer = document.getElementById("main");
    const c = document.createElement('div');
    const h = document.createElement("h2");
    const p = document.createElement("p");
    h.innerHTML = subService.name;
    h.innerHTML[0].toUpperCase();
    p.innerHTML = subService.description;
    if(subService.techDetails !== "") {
      c.appendChild(document.createComment(subService.techDetails));
    }
    c.appendChild(h);
    c.appendChild(p);
    const subd = subService.subdomain ? subService.subdomain : subService.name;
    c.setAttribute("data-subdomain", subd);
    c.id = subService.name;
    c.classList.add("link");
    c.classList.add("particle-aware");
    mainContainer.appendChild(c);
}



loadSubservices();
