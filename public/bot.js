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