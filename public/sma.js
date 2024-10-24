 // Hàm tính SMA
 function calculateSMA(data, window_size) {
    let smaValues = [];
    for (let i = 0; i < data.length; i++) {
        if (i < window_size - 1) {
            smaValues.push({ time: data[i].time, value: null });
        } else {
            let sum = 0;
            for (let j = 0; j < window_size; j++) {
                sum += data[i - j].value;
            }
            smaValues.push({ time: data[i].time, value: sum / window_size });
        }
    }
    return smaValues;
}