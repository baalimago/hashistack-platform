/**
 * Simple class which supports entering html and css components when loading into a shadow dom. 
 * Use eventListeners for communcation cross components.
 *  */
export class ImagoElement extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'closed' });
        const path = this.getAttribute("path");
        if (window.shadows === undefined) window.shadows = {};
        setTimeout(() => {
            // Allow for internal functions to find the shadow by using the path
            window.shadows[path] = shadow;
        }, 1);
        const externalFunction = this.getAttribute("externalFunction");
        this.loadHtml(shadow, `${path}.html`);
        this.loadCss(shadow, `${path}.css`);
        // Lazy way to ensure that javascript runs always last
        this.loadJs(shadow, path, externalFunction);
    }

    async loadHtml(shadow, relativePath) {
        this.getFile(relativePath, (status, res) => {
            if (status === 200) {
                const tmp = document.createElement("template");
                tmp.innerHTML = res;
                shadow.appendChild(tmp.content.cloneNode(true));
            } else {
                console.error(`Failed to load imago-element html.`);
            }
        });
    }

    async loadCss(shadow, relativePath) {
        this.getFile(relativePath, (status, res) => {
            if (status === 200) {
                const style = document.createElement('style');
                style.textContent = res;
                shadow.appendChild(style);
            } else {
                console.error(`Failed to load imago-element css.`);
            }
        });
    }

    async loadJs(shadow, path, externalFunction) {
        this.getFile(`${path}.js`, (status, res) => {
            if (status === 200) {
                const js = document.createElement('script');
                let jsCode = `(()=>{ const selfPath = "${path}";`
                jsCode += res;
                jsCode += `})()`;
                js.innerHTML = jsCode;
                shadow.appendChild(js);
                eval(js);
            } else {
                console.error(`Failed to load imago-element js`);
            }
        });

        if (externalFunction) {
            this.getFile(`${path}external.js`, (status, res) => {
                if (status === 200) {
                    const js = document.createElement('script');
                    js.innerHTML = res;
                    shadow.appendChild(js);
                    eval(js);
                } else {
                    console.error(`Failed to load external functions for imago-element`);
                }
            });
        }
    }

    getFile(url, callback) {
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
}