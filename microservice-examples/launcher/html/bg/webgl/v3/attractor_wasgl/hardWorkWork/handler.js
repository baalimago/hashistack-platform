export class WorkerHandler {

    constructor(am) {
        this.constructWorkers(am);
    }
    workers = new Array();
    sharedBuffer;

    constructWorkersReadyResolver;
    constructWorkersReady = new Promise(r => {
        this.constructWorkersReadyResolver = r;
    });

    bufferReadyResolver;
    bufferReady = new Promise(r => {
        this.bufferReadyResolver = r;
    });

    intersectionBufferReadyResolver;
    intersectionBufferReady = new Promise(r => {
        this.intersectionBufferReadyResolver = r;
    })

    configReadyResolver;
    configReady = new Promise(r => {
        this.configReadyResolver = r;
    });

    workerWasmResolver;
    workerWasm = new Promise(r => {
        this.workerWasmResolver = r;
    });

    isReady() {
        return new Promise(async resolve => {
            await this.configReady;
            await this.workerWasmReady;
            await this.bufferReady;
            await this.intersectionBufferReady;
            resolve();
        })
    }

    allDoneArr = [];
    checkIfAllDone(id) {
        this.allDoneArr[id] = true;
        for (let i = 0; i < this.conf.amWorkers; i++) {
            if (!this.allDoneArr[i]) return false;
        }
        return true;
    }

    checkIfAllDone2(adArr, id, amWorkers) {
        adArr[id] = true;
        for (let i = 0; i < amWorkers; i++) {
            if (!adArr[i]) return false
        }
        return true;
    }

    destroy() {
        for (let i = 0; i < this.workers.length; i++) {
            this.workers[i].terminate();
        }
    }

    async constructWorkers(am) {
        for (let i = 0; i < am; i++) {
            const name = i;
            const w = new Worker("bg/webgl/v3/attractor_wasgl/hardWorkWork/yesMilord.js", { "name": name });
            // One name inside the worker scope, one outside
            w.name = name;
            w.onerror = _ => {
                console.error(`Worker ${w.name} got error: `);
            }
            w.postMessage({
                "wasmSetup": true,
            })
            this.workers.push(w);
        }

        this.constructWorkersReadyResolver();
    }

    async updateConfig(conf) {
        await this.constructWorkersReady;
        this.conf = conf;
        // Make copy to not have isConfig property on original. isConfig is only used to flag for workers that the data is a config
        const confCopy = JSON.parse(JSON.stringify(conf));
        confCopy.isConfig = true;
        let updateDoneResolver;
        this.allDoneArr = [this.conf.amWorkers];
        const updateDone = new Promise(r => {
            updateDoneResolver = r;
        });
        this.workers.forEach(w => {
            w.postMessage(confCopy);
            if (this.checkIfAllDone(w.name)) {
                updateDoneResolver();
            }
        });
        await updateDone;
        this.configReadyResolver();
    }

    async bindSharedBuffer(sharedBuffer) {
        await this.configReady
        this.sharedBuffer = sharedBuffer;
        let updateDoneResolver;
        this.allDoneArr = [this.conf.amWorkers];
        const updateDone = new Promise(r => {
            updateDoneResolver = r;
        });
        this.workers.forEach(w => {
            w.postMessage(sharedBuffer);
            if (this.checkIfAllDone(w.name)) {
                updateDoneResolver();
            }
        });
        await updateDone;
        this.bufferReadyResolver();
    }

    async bindSharedIntersectionBuffer(sharedBuffer) {
        await this.configReady;
        this.sharedIntersectionBuffer = sharedBuffer;
        let updateDoneResolver;
        const allDoneArr = [this.conf.amWorkers]
        const updateDone = new Promise(r => {
            updateDoneResolver = r;
        });
        this.workers.forEach(w => {
            w.postMessage({
                isSharedIntersectionBuffer: true,
                maxWidth: window.innerWidth,
                maxHeight: window.innerHeight,
                buffer: sharedBuffer
            });
            if (this.checkIfAllDone2(allDoneArr, w.name, this.conf.amWorkers)) {
                updateDoneResolver()
            }
        });
        await updateDone;
        this.intersectionBufferReadyResolver();
    }

    async updateSharedBuffer(resolveUpdateDone) {
        await this.configReady;
        const t0 = performance.now();
        const iterator = this.indexUpdator(0, this.conf.runtime.amParticles / this.conf.amWorkers);
        let updateDoneResolver;
        this.allDoneArr = [this.conf.amWorkers];
        const updateDone = new Promise(r => {
            updateDoneResolver = r;
        });
        this.workers.forEach(w => {
            w.onmessage = _ => {
                const nextIndex = iterator.next().value;
                if (nextIndex !== undefined) {
                    w.postMessage(nextIndex);
                } else {
                    if (this.checkIfAllDone(w.name)) {
                        updateDoneResolver();
                    }
                }
            }

            w.postMessage(iterator.next().value);
        });

        await updateDone;
        if (this.conf.logs.updatePerformance) {
            console.log(`Update done, it took: ${performance.now() - t0}ms`);
        }
        resolveUpdateDone();
    }

    *
    indexUpdator(index, batchSize) {
        while (index < this.conf.amWorkers) {
            const start = Math.floor(index * batchSize);
            const end = Math.floor(index * batchSize + batchSize);
            if (end > this.conf.runtime.amParticles) end = this.conf.runtime.amParticles;
            yield { "start": start, "end": end };
            index++;
        }
    }
}