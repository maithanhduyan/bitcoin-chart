# Cấu trúc Dự án như sau:

```
├── bot.js
├── chart.js
├── css
│   └── style.css
├── index.html
├── indicators
└── main.js
```

# Danh sách Các Tệp Dự án:

## ../public\bot.js

```
// Bot giao dịch

class Bot {

    constructor(genome, balance, trainingData = [{ "time": "2014-09-17", "open": 465.864014, "high": 468.174011, "low": 452.421997, "close": 457.334015 }]) {
        this.id = crypto.randomUUID();
        this.genome = genome; // Mạng NEAT cho bot
        this.balance = balance; // Số dư ban đầu
        this.holdings = 0; // Số lượng Bitcoin mà bot đang giữ
        this.transactionHistory = []; // Lịch sử giao dịch
        this.isRunning = false; // Trạng thái của bot
        this.timer = null; // Lưu timer để có thể dừng khi cần
        this.trainingData = trainingData;
        this.isLive = true;
        this.score = balance; // Tổng tài sản
        this.currentPrice = trainingData[0];
        this.tradingSpeed = 10; // Tốc độ giao dịch
        this.maxDay = trainingData.length;
        this.continueTrading = 0;
        this.check();
    }

    check() {
        console.log(`Bot ID: ${this.id}`);
        console.log(`Bot check data.`);
        console.log(`Bot balance: ${this.balance}`);

        if (!this.genome) {
            console.error("Lỗi: Genome không hợp lệ.");
            return;
        }
        if (this.maxDay > 0) {
            console.log(`Max day: ${this.maxDay}`);

        }
        console.log(`OK.`);

    }
    // Cập nhật giá Bitcoin hiện tại
    updatePrice(price) {
        this.currentPrice = price;
    }

    // Đánh giá fitness của mỗi bot
    evaluateFitness() {
        return 0;
    }

    // Chuẩn bị dữ liệu đầu vào
    prepareData(data) {
        return [data.open, data.high, data.low, data.close, this.balance, this.holdings];
    }

    // Giao dịch theo giá hiện tại
    trading() {
        if (this.continueTrading < this.maxDay) {
            // console.log('trading');
            // Lấy dữ liệu giao dịch từ lịch sử giá
            this.currentPrice = this.trainingData[this.continueTrading];

            const inputs = this.prepareData(this.currentPrice); // Chuẩn bị dữ liệu đầu vào từ dữ liệu giá

            // NEAT genome xử lý input và đưa ra output
            const output = this.genome.activate(inputs); // Output sẽ là một mảng kết quả từ mạng nơ-ron NEAT
            // Xử lý output để đưa ra quyết định
            const decision = this.processOutput(output);
            // Ra quyết định: BUY, SELL, HOLD, STAND-OUT
            switch (decision) {
                case 'buy':
                    this.buy();
                    break;
                case 'sell':
                    this.sell();
                    break;
                case 'hold':
                    this.hold();
                    break;
                case 'stand-out':
                    this.standOut();
                    break;
                default:
                    console.log('Quyết định không hợp lệ.');
                    break;
            }

            this.score = this.scoreCalculate(this.currentPrice);
            this.genome.score = this.score;
            this.continueTrading++;
        } else {
            this.isLive = false;
        }
    }

    // Hành động mua Bitcoin
    buy() {
        if (this.balance > 0) {
            // Tính toán số tiền để mua 1% số dư hiện tại
            const investmentAmount = this.balance * 0.01; // 1% của số dư
            let bitcoinAmount = investmentAmount / this.currentPrice.close; // Số lượng Bitcoin sẽ mua
            this.holdings += bitcoinAmount; // Cộng số Bitcoin mua được vào số lượng holdings
            this.balance -= investmentAmount; // Trừ số tiền đầu tư khỏi số dư hiện tại
            this.purchasePrice = this.currentPrice.close;
            console.log(`Bot đã mua ${bitcoinAmount} BTC với giá ${this.currentPrice.close}.`);
        } else {
            console.log('Không đủ tiền để mua.');
        }
        this.scoreCalculate(this.currentPrice);
    }

    // Hành động bán Bitcoin
    sell() {
        if (this.holdings > 0) {
            let profit = this.holdings * this.currentPrice;
            this.balance += profit;
            console.log(`Bot đã bán ${this.holdings} BTC với giá ${this.currentPrice}. Thu về ${profit}.`);
            this.holdings = 0;
        } else {
            console.log('Không có Bitcoin để bán.');
        }
        this.scoreCalculate(this.currentPrice);
    }

    // Hành động giữ (hold)
    hold() {
        console.log('Giữ BTC, không có hành động.');
        this.scoreCalculate(this.currentPrice);
    }

    // Hành động đứng ngoài thị trường (stand-out)
    standOut() {
        console.log('Không giao dịch, đứng ngoài.');
        this.scoreCalculate(this.currentPrice);
    }

    scoreCalculate(price) {
        const totalAssets = this.balance + (this.holdings * price.close);
        console.log(`Tổng tài sản: ${totalAssets}`);
        return totalAssets;
    }

    // Xử lý output của mạng nơ-ron NEAT
    processOutput(output) {
        // Output của mạng nơ-ron có thể là một mảng 4 giá trị, tương ứng với các hành động
        const maxIndex = output.indexOf(Math.max(...output));
        switch (maxIndex) {
            case 0:
                return 'buy';      // Mua nếu chỉ số đầu tiên là lớn nhất
            case 1:
                return 'sell';     // Bán nếu chỉ số thứ hai là lớn nhất
            case 2:
                return 'hold';     // Giữ nếu chỉ số thứ ba là lớn nhất
            case 3:
                return 'stand-out';// Đứng ngoài nếu chỉ số thứ tư là lớn nhất
            default:
                return 'stand-out';// Mặc định đứng ngoài nếu không có kết quả rõ ràng
        }
    }

    run() {
        if (this.isRunning) return; // Kiểm tra nếu bot đã chạy thì không chạy lại
        this.isRunning = true;

        // Bắt đầu giao dịch tự động với chu kỳ cố định
        this.timer = setInterval(() => {
            this.trading();
        }, this.tradingSpeed);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer); // Dừng timer
            this.isRunning = false;
        }
    }
}
```

 ## ../public\chart.js

```
// Class Chart
// Hiển thị biểu đồ candlestick
// Hiển thị các giao dịch mua bán của bot
//

class Chart{
    constructor(container){

    }
    
    // Tạo biểu đồ Lightweight Charts
    create(){

    }

    
}
```

 ## ../public\index.html

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bitcoin Candlestick Chart with NEAT AI Optimized Trading Bot</title>
    <script src="lib/lightweight-charts.standalone.production.js"></script>
    <script src="lib/neataptic.min.js"></script>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="main"></div>
    <script src="bot.js"></script>
    <script src="chart.js"></script>
    <script src="main.js"></script>
</body>
</html>

```

 ## ../public\main.js

```

/**
 * 
 * Tạo 10 bot
 * Mỗi bot điều có AI riêng sử dụng thuật toán NEAT
 * Cho các bot giao dịch tự động
 * Tìm genome tốt nhất sau khi tất cả các bot thực hiện giao dịch trong 1 thế hệ
 * Sau mỗi thế hệ (khi tất cả các bot đã giao dịch), thực hiện quá trình đột biến và tạo thế hệ mới
 * Tiếp tục cho các thế hệ mới giao dịch để tìm kiếm genome nào tối ưu nhất.
 * 
 */

// Dữ liệu lịch sử giá của Bitcoin
let trainingData;

fetch('data/data.json') // dữ liệu giá nằm trong data/data.json
    .then(response => response.json())
    .then(data => {
        trainingData = data;
        console.log(`Đã tải xong training data với độ dài: ${trainingData.length}`);
        console.log(`Check dữ liệu ${trainingData[0].open}`);

        // Kiểm tra xem trainingData đã có dữ liệu chưa trước khi gọi startGeneration
        if (trainingData && trainingData.length > 0) {

            // Bắt đầu tạo các thế hệ giao dịch
            startGeneration();

        } else {
            console.error("Lỗi: Dữ liệu trainingData không hợp lệ.");
        }
    });

// Bot size
const BOT_NUM = 10;
const BOT_SPEED = 1000; // 1 second

const { Neat, architect } = window.neataptic;

const neat = new Neat(6, 4, null, { // Đảm bảo neat được khởi tạo trước khi gọi endGeneration
    mutation: neataptic.methods.mutation.ALL,
    popsize: BOT_NUM,
    elitism: 1,
    mutationRate: 0.3,
    network: new neataptic.architect.Perceptron(6, 12, 4) // 6 input, 12 hidden, 4 output
});

const bots = []; // Mảng chứa các bot
const START_BALANCE = 10000;
function startGeneration() {
    console.log(` Thế hệ thứ: ${neat.generation}`);
    // let genome = neat.population[0];
    // const bot = new Bot(genome, START_BALANCE, trainingData);
    // bots.push(bot);
    // bot.run();
    // Xóa tất cả node trong document.body trừ các phần tử cần giữ lại
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
    const botInfo = document.createElement('botInfo');
    botInfo.innerText = 'BOT';
    document.body.appendChild(botInfo);
    
    for (let i = 0; i < BOT_NUM; i++) {
        const genome = neat.population[i];
        const bot = new Bot(genome, START_BALANCE, trainingData);
        bot.run(); // Bắt đầu quá trình giao dịch tự động của bot
        bots.push(bot);
    }

    // Kiểm tra trạng thái của các bot định kỳ
    const statusCheckInterval = setInterval(() => {
        if (checkAllBotsStatus()) {
            clearInterval(statusCheckInterval); // Dừng kiểm tra khi tất cả bots đã ngừng
            endGeneration(); // Gọi hàm endGeneration nếu tất cả các bot đã ngừng hoạt động
        }
    }, 1000); // Kiểm tra mỗi giây

}

// Hàm kiểm tra xem tất cả bots đã có isLive = false chưa
function checkAllBotsStatus() {
    return bots.every(bot => !bot.isLive); // Trả về true nếu tất cả bots có isLive = false
}

function endGeneration() {
    neat.sort();
    const bestGenome = neat.population[0]; // Lấy genome tốt nhất
    console.log("Genome tốt nhất của thế hệ này:");
    console.log("Nơ-ron:", bestGenome.nodes); // Hiển thị danh sách các nơ-ron
    console.log("Kết nối:", bestGenome.connections); // Hiển thị danh sách các kết nối

    // Hoặc hiển thị toàn bộ cấu trúc genome dưới dạng JSON
    const genomeStructure = JSON.stringify(bestGenome, null, 2); // Chuyển thành chuỗi JSON có định dạng
    console.log("Cấu trúc genome tốt nhất:\n", genomeStructure);

    // Thế hệ mới
    const newGeneration = [];

    // Lấy các genome tinh hoa từ thế hệ cũ đưa vào thế hệ mới
    for (let i = 0; i < neat.elitism; i++) {
        newGeneration.push(neat.population[i])
    }

    // Tạo các genome con cháu mới (offspring) cho thế hệ tiếp theo
    for (let i = 0; i < neat.popsize - neat.elitism; i++) {
        newGeneration.push(neat.getOffspring())
    }

    neat.population = newGeneration
    neat.mutate()
    neat.generation++
       
    startGeneration()
}

```

 