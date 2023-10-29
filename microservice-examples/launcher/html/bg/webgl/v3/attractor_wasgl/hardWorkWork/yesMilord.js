onmessage = function(e) {
    const data = e.data;
    if (data instanceof Int16Array) {
        this.setupSharedArrayBuffer(data);
    } else if (data.isSharedIntersectionBuffer) {
        this.setupSharedIntersectionBuffer(data.buffer, data.maxWidth, data.maxHeight);
    } else if (data.isConfig) {
        this.handleConfigUpdate(data);
    } else if (data.wasmSetup) {
        this.setupWasm();
    } else {
        this.handleUpdate(data);
    }
}

function setupSharedArrayBuffer(data) {
    this.sharedBuffer = data;
    postMessage(this.name);
}

function setupSharedIntersectionBuffer(buffer, maxWidth, maxHeight) {
    this.sharedIntersectionBuffer = buffer;
    this.maxX = maxWidth;
    this.maxY = maxHeight;
    postMessage(this.name);
}

function setupWasm() {
    WebAssembly.instantiateStreaming(fetch('../wasm/attractor.wasm'), {})
        .then(results => {
            this.callback = results.instance.exports.int_sqrt
            postMessage(this.name);
        });
}

function intersectsX(newX, y) {
    const realX = Math.round(((newX / this.conf.runtime.zoomFactor + 1) / 2) * this.maxX);
    const realY = Math.round(((y / this.conf.runtime.zoomFactor + 1) / 2) * this.maxY);
    const index = realY * this.maxX + realX;
    if (realX <= 0 || realY <= 0 || index >= (this.maxX * this.maxY)) return 0;
    try {
        return Atomics.load(this.sharedIntersectionBuffer, index);
    } catch (error) {
        console.error(`Checking index, y: ${realY}, maxX: ${this.maxX}, newX: ${realX}, index: ${index}`);
        throw error;
    }
}

function intersectsY(newY, x) {
    const realX = Math.round(((x / this.conf.runtime.zoomFactor + 1) / 2) * this.maxX);
    const realY = Math.round(((newY / this.conf.runtime.zoomFactor + 1) / 2) * this.maxY);
    const index = realY * this.maxX + realX;
    if (realX <= 0 || realY <= 0 || index >= (this.maxX * this.maxY)) return 0;
    try {
        return Atomics.load(this.sharedIntersectionBuffer, index);
    } catch (error) {
        console.error(`Checking index, y: ${ realY }, maxX: ${ this.maxX }, newX: ${ realX }, index: ${ index }`);
        throw error;
    }
}

function calculateAttractor(index) {
    const x = convertToClipSpace(Atomics.load(this.sharedBuffer, index) * this.conf.runtime.zoomFactor);
    const y = convertToClipSpace(Atomics.load(this.sharedBuffer, index + 1) * this.conf.runtime.zoomFactor);
    const z = convertToClipSpace(Atomics.load(this.sharedBuffer, index + 2) * this.conf.runtime.zoomFactor);
    const w = convertToClipSpace(Atomics.load(this.sharedBuffer, index + 3) * this.conf.runtime.zoomFactor);
    const a = this.conf.runtime.a;
    const b = this.conf.runtime.b;
    const c = this.conf.runtime.c;
    const d = this.conf.runtime.d;
    const t = this.conf.runtime.t;
    const dx = t * (a * (w - x) * z);
    const dy = t * (x * z + b * y);
    const dz = t * (x * (w - c) * w);
    const dw = t * (z * x + y - b)
    let newX = (x + dx);
    let newY = (y + dy);
    let newZ = (z + dz);
    let newW = (w + dw);

    const repositionChance = 0.08;
    let xIntersection = intersectsX(newX, y);
    if (xIntersection) {
        newX = x;
    }

    let yIntersection = intersectsY(newY, x);
    if (yIntersection) {
        newY = y;
    }

    while (xIntersection && yIntersection) {
        if (this.conf.allowRandomClear) {
            if (Math.random() > repositionChance) {
                break;
            }
        }
        newX = (Math.random() * 2 - 1) * this.conf.runtime.zoomFactor;
        newY = (Math.random() * 2 - 1) * this.conf.runtime.zoomFactor;
        xIntersection = intersectsX(newX, y);
        yIntersection = intersectsY(newY, x);
    }

    Atomics.store(this.sharedBuffer, index, convertToShort(newX / this.conf.runtime.zoomFactor));
    Atomics.store(this.sharedBuffer, index + 1, convertToShort(newY / this.conf.runtime.zoomFactor));
    Atomics.store(this.sharedBuffer, index + 2, convertToShort(newZ / this.conf.runtime.zoomFactor));
    Atomics.store(this.sharedBuffer, index + 3, convertToShort(newW / this.conf.runtime.zoomFactor));
}

function convertToClipSpace(int16) {
    return int16 / 32768;
}

function convertToShort(clipSpaceFloat) {
    return clipSpaceFloat * 32768;
}

function handleConfigUpdate(conf) {
    this.conf = conf;
    postMessage(this.name);
}

function handleUpdate(updateTask) {
    const t0 = performance.now();
    for (let i = updateTask.start; i < updateTask.end; i++) {
        // 3 dimensions for each index
        this.calculateAttractor(i * 3);
    }
    if (this.conf.logs.workerLogs || (this.conf.logs.representativeWorkerLogs && this.name == 0)) {
        console.log(`
            I am: ${ this.name }.Processed items from: ${updateTask.start }
            to ${ updateTask.end }. It took: ${ performance.now() - t0 }
            ms `);
    }
    postMessage(this.name);
}