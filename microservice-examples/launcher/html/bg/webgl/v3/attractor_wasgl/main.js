import {
    WorkerHandler
} from "./hardWorkWork/handler.js";
import {
    WebglCore
} from "./webgl/core.js";

export class AttractorWasgl {
    successfullyStoppedResolver;
    successfullyStopped = new Promise(r => {
        this.successfullyStoppedResolver = r;
    });

    async init() {
        if (window.workers) {
            throw new Error("Workers not supported");
        }
        this.conf = await this.getConfig();
        this.addButtons(this.conf)
            // Try to fill all available cores
        if (navigator.hardwareConcurrency !== undefined && !this.conf.forceWorkers) {
            this.conf.amWorkers = navigator.hardwareConcurrency;
            console.log(`Setting amount of workers to: ${navigator.hardwareConcurrency}`);
        }
        this.confCopy = JSON.parse(JSON.stringify(this.conf));
        this.workerHandler = new WorkerHandler(this.conf.amWorkers);
        this.webglCore = new WebglCore;

        this.propagateConfigChanges(this.conf);

        this.sharedBuffer = this.constructSharedBuffer(this.conf.maxParticles);
        this.sharedIntersectionBuffer = this.constructSharedIntersectionBuffer();
        this.workerHandler.bindSharedBuffer(this.sharedBuffer);
        this.workerHandler.bindSharedIntersectionBuffer(this.sharedIntersectionBuffer);
        this.webglCore.bindSharedBuffer(this.sharedBuffer);

        window.addEventListener("resetIntersectionBuffer", () => {
            this.resetIntersectionBuffer(this.sharedIntersectionBuffer);
            this.conf.allowRandomClear = true;
            this.propagateConfigChanges(this.conf);
            setTimeout(() => {
                this.conf.allowRandomClear = false;
                this.propagateConfigChanges(this.conf);
            }, 2000)
        })
        window.addEventListener("updateIntersectionBuffer", () => {
            this.setIntersectionBufferFromDivs(this.sharedIntersectionBuffer);
        });
        this.setIntersectionBufferFromDivs(this.sharedIntersectionBuffer);

        this.start()
    }

    addButtons(conf) {
        conf.runtime.restart = () => {
            this.setInitialValues(this.sharedBuffer);
        }
    }

    async destroy() {
        this.destroyFlag = true;
        await this.successfullyStopped
        clearInterval(this.updatesTrackerInterval);
        this.webglCore.destroy();
        this.workerHandler.destroy();
        this.dynamicParamsHandler.destroy();
        window.dispatchEvent(new CustomEvent("configUpdate"));
    }

    getConfig() {
        return new Promise(resolve => {
            const defaultConf = window.localStorage.getItem("wasgl/defaultConf");
            if (defaultConf !== null) {
                resolve(JSON.parse(defaultConf))
                return;
            }
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'bg/webgl/v3/attractor_wasgl/conf.json', true);
            xhr.responseType = 'json';
            xhr.onload = () => {
                const status = xhr.status;
                if (status === 200) {
                    resolve(xhr.response);
                } else {
                    console.error(`Error when attempting to get json file`);
                    throw new Error(`Error: ${xhr.status}`);
                }
            }

            xhr.send();
        });
    }

    setInitialValues(arr) {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.random() * 65536;
        }
    }

    constructSharedBuffer(amParticles) {
        if (self.crossOriginIsolated) {
            // 4 Dimensions, 2 bytes per pos, amParticles amounts of particles
            const b = new SharedArrayBuffer(amParticles * 2 * 4);
            const int16Arr = new Int16Array(b);
            this.setInitialValues(int16Arr);
            return int16Arr;
        } else {
            throw new Error("Cross origin isn't isolated")
        }
    }

    constructSharedIntersectionBuffer() {
        if (self.crossOriginIsolated) {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            const b = new SharedArrayBuffer(this.width * this.height);
            const int8Arr = new Int8Array(b);
            return int8Arr;
        } else {
            throw new Error("Cross origin isn't isolated")
        }
    }

    resetIntersectionBuffer(b) {
        for (let i = 0; i < b.length; i++) {
            b[i] = 0;
        }
    }

    configLoadedListener() {
        let resolveCallback;
        const p = new Promise(resolve => {
            resolveCallback = resolve;
        });

        window.addEventListener("configLoaded", () => {
            resolveCallback();
        });
        window.dispatchEvent(new CustomEvent('hasConfigLoadedCheck'));
        return p
    }

    // Detects changes in the config and propagates config updates if there's a new one
    // TODO: Make underlying config handling thead safe (too tired now..)
    updateConfigIfNew() {
        const confStr = JSON.stringify(this.conf);
        const confCopyStr = JSON.stringify(this.confCopy);
        if (confCopyStr !== confStr) {
            this.confCopy = JSON.parse(JSON.stringify(this.conf));
            this.workerHandler.updateConfig(this.conf);
            this.webglCore.updateConfig(this.conf);
        }
    }

    // Propagates config changes to workers and config window
    async propagateConfigChanges() {
        await this.configLoadedListener();
        if (this.destroyFlag) return;
        if (window.DEV) {
            window.dispatchEvent(new CustomEvent(
                "configUpdate", {
                    detail: this.conf
                }));
        } else {
            window.dispatchEvent(new CustomEvent("configUpdate"));
        }
        this.workerHandler.updateConfig(this.conf);
        this.webglCore.updateConfig(this.conf);
    }

    setIntersectionBufferFromDivs(sharedIntersectionBuffer) {
        this.resetIntersectionBuffer(sharedIntersectionBuffer);
        const linkDivs = document.getElementsByClassName("particle-aware");
        for (let i = 0; i < linkDivs.length; i++) {
            const ld = linkDivs[i];
            this.setIntersectionBufferFromDiv(sharedIntersectionBuffer, ld);
        }
    }

    setIntersectionBufferFromDiv(b, mDiv) {
        const yFlipped = this.height - Math.round(mDiv.getBoundingClientRect().top);
        const width = mDiv.offsetWidth;
        const height = mDiv.offsetHeight;
        const left = Math.round(mDiv.getBoundingClientRect().left);
        for (let y = yFlipped - height; y < yFlipped; y++) {
            for (let x = left; x < left + width; x++) {
                b[y * this.width + x] = 1;
            }
        }
    }

    // Renders the current shared buffer onto the canvas
    render() {
        this.webglCore.render();
    }

    handleDynamicPerformanceAdjustment() {
        if (this.amUpdates < 50) {
            if (this.prevMove === 'a') {
                this.conf.runtime.dynamic.performanceAdjustment = false;
                this.propagateConfigChanges();
            }
            this.conf.runtime.amParticles = Math.round(this.conf.runtime.amParticles * (this.amUpdates / 50));
            this.prevMove = 'd'
        } else {
            if (this.prevMove === 'm' || this.prevMove === undefined) {
                this.conf.runtime.amParticles = Math.round(this.conf.runtime.amParticles * 1.3);
                this.prevMove = 'm';
            } else if (this.prevMove === 'd' || this.prevMove === 'm') {
                this.prevMove = 'a';
                this.conf.runtime.amParticles += 1000;
            } else {
                this.conf.runtime.amParticles += 1000;
            }
        }
        this.propagateConfigChanges();
    }

    // Starts the module
    amUpdates = 0;
    async start() {
        if (this.startUpdatesTracker === undefined) {
            this.startUpdatesTracker = false;
            this.updatesTrackerInterval = setInterval(() => {
                if (this.conf.logs.fps) console.log(`Updates/sec: ${this.amUpdates}`);
                this.amUpdates = 0;
            }, 1000);
        }
        await this.webglCore.isReady();
        await this.workerHandler.isReady();
        requestAnimationFrame(() => {
            this.step();
        });
    }

    firstUpdate = true;
    async step() {
        if (this.destroyFlag) {
            this.successfullyStoppedResolver();
            return;
        }
        this.updateConfigIfNew();

        let updateDoneResolver;
        const updateDone = new Promise(r => {
            updateDoneResolver = r;
        });
        this.workerHandler.updateSharedBuffer(updateDoneResolver);
        await updateDone;

        this.render();
        this.amUpdates++;
        if (this.firstUpdate) this.firstUpdate = false;
        requestAnimationFrame(() => {
            this.step();
        });
    }
}