const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const csv = require('csv-parser'); // Để đọc file CSV

const app = express();
const port = 3000;

// Serve static files (HTML, JS, CSS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Function to read data from CSV
let bitcoinData = [];  // Lưu trữ dữ liệu từ CSV
fs.createReadStream(path.join(__dirname, 'data/BTC-USD.csv'))
    .pipe(csv())
    .on('data', (row) => {
        // Chuyển đổi thời gian và giá từ mỗi dòng CSV
        bitcoinData.push({
            date: row.Date,
            open: parseFloat(row.Open),
            high: parseFloat(row.High),
            low: parseFloat(row.Low),
            close: parseFloat(row.Close),
            volume: parseFloat(row.Volume)
        });
    })
    .on('end', () => {
        console.log('CSV file successfully processed');
    });

// API route to get Bitcoin price by date
app.get('/api/bitcoin/:date', (req, res) => {
    const dateParam = req.params.date;  // Lấy ngày từ URL params

    // Tìm kiếm dữ liệu giá theo ngày
    const result = bitcoinData.find(item => item.date === dateParam);

    if (result) {
        // Nếu tìm thấy dữ liệu, trả về thông tin giá
        res.json({
            date: result.date,
            open: result.open,
            high: result.high,
            low: result.low,
            close: result.close,
            volume: result.volume
        });
    } else {
        // Nếu không tìm thấy dữ liệu cho ngày đó, trả về 404
        res.status(404).json({ error: 'Data not found for the specified date' });
    }
});

// Broadcast candlestick data to all connected clients
let currentIndex = 0;  // Chỉ số hiện tại trong dữ liệu CSV
function broadcastBitcoinCandlestick() {
    if (currentIndex < bitcoinData.length) {
        const candleData = bitcoinData[currentIndex];
        const message = JSON.stringify({
            time: new Date(candleData.date).getTime(),  // Chuyển đổi ngày thành timestamp
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
        });

        // Gửi dữ liệu candlestick cho tất cả các client kết nối với WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });

        currentIndex++;  // Tăng chỉ số để gửi dữ liệu tiếp theo trong lần sau
    } else {
        currentIndex = 0;  // Khi gửi hết dữ liệu 
    }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Gửi giá Bitcoin cho client ngay khi kết nối
    ws.send(JSON.stringify({ message: 'Connected to Bitcoin candlestick feed' }));

    // Định kỳ cập nhật dữ liệu nến mỗi 10 giây
    const interval = setInterval(() => {
        broadcastBitcoinCandlestick();
    }, 50);

    // Khi client đóng kết nối
    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

// Set up server for HTTP and WebSocket connections
const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
