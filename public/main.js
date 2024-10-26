
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
