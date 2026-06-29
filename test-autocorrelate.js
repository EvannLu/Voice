function autoCorrelate(buffer, sampleRate) { 
    let sumOfSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
        sumOfSquares += buffer[i] * buffer[i];
    }
    const rootMeanSquare = Math.sqrt(sumOfSquares / buffer.length);
    if (rootMeanSquare < 0.01) return -1;
    let r1 = 0, r2 = buffer.length - 1, thres = 0.2;
    for (let i = 0; i < buffer.length / 2; i++) {
        if (Math.abs(buffer[i]) < thres) {
            r1 = i;
            break;
        }

    }
    for (let i = 1; i < buffer.length / 2; i++) {
        if (Math.abs(buffer[buffer.length - i]) < thres) {
            r2 = buffer.length - i;
            break;
        }
    }
    buffer = buffer.slice(r1, r2);
    let c = new Array(buffer.length).fill(0);
    for (let i = 0; i < buffer.length; i++) {
        for (let j = 0; j < buffer.length - i; j++) {
            c[i] = c[i] + buffer[j] * buffer[j + i];
        }
    }
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buffer.length; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
}

// Generate a dummy buffer with a sine wave of 440 Hz
const sampleRate = 48000;
const bufferSize = 2048;
const buffer = new Float32Array(bufferSize);
for (let i = 0; i < bufferSize; i++) {
    buffer[i] = Math.sin((i * 440 * Math.PI * 2) / sampleRate);
}

// Warm up
for (let i = 0; i < 100; i++) {
    autoCorrelate(buffer, sampleRate);
}

let totalTime = 0;
let iters = 1000;
const start = performance.now();
for (let i = 0; i < iters; i++) {
    autoCorrelate(buffer, sampleRate);
}
const end = performance.now();

console.log("Average time per call: " + ((end - start) / iters).toFixed(3) + " ms");
