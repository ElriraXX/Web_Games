// 获取canvas元素和绘图上下文
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    throw new Error('Canvas element not found');
}
const ctx = canvas.getContext('2d');
if (!ctx) {
    throw new Error('2D context not supported');
}

// 玩家类
class Player {
    constructor(x, y) {
        this.x = x; // 玩家x坐标
        this.y = y - 50; // 玩家y坐标，抬高至马路上面
        this.width = 50; // 玩家宽度
        this.height = 50; // 玩家高度
        this.gravity = 0.5; // 重力加速度
        this.velocity = 0; // 垂直速度
        this.jumpVelocity = -10; // 跳跃初速度
        this.isGrounded = true; // 是否在地面上
        this.jumpStartTime = null; // 跳跃开始时间
        this.maxJumpTime = 500; // 最大跳跃时间（毫秒）
        this.minJumpVelocity = -10; // 最小跳跃速度
        this.maxJumpVelocity = -20; // 最大跳跃速度
        this.health = 100; // 生命值
        this.rotation = 0; // 旋转角度
        this.lastObstaclePassed = null; // 上次跳过的障碍物
    }

    // 跳跃方法
    jump(currentTime) {
        if (this.isGrounded && !this.jumpStartTime) {
            this.jumpStartTime = currentTime; // 记录跳跃开始时间
        }
    }

    // 释放跳跃方法
    releaseJump(currentTime) {
        if (this.jumpStartTime !== null) {
            const jumpDuration = currentTime - this.jumpStartTime; // 计算跳跃持续时间
            this.velocity = this.minJumpVelocity + (this.maxJumpVelocity - this.minJumpVelocity) * Math.min(1, jumpDuration / this.maxJumpTime); // 计算跳跃速度
            this.isGrounded = false; // 设置为不在地面上
            this.jumpStartTime = null; // 重置跳跃开始时间
        }
    }

    // 更新玩家状态方法
    update() {
        this.velocity += this.gravity; // 更新速度
        this.y += this.velocity; // 更新位置

        if (this.y > canvas.height - this.height - 50) { // 检查是否落地
            this.y = canvas.height - this.height - 50; // 设置落地位置
            this.velocity = 0; // 重置速度
            this.isGrounded = true; // 设置为在地面上
            this.rotation = 0; // 重置旋转角度
        }

        if (!this.isGrounded) { // 如果不在地面上
            const maxHeight = canvas.height - this.height + Math.abs(this.maxJumpVelocity) / this.gravity * 0.6 - 50; // 计算最大跳跃高度
            const currentHeight = maxHeight - this.y; // 计算当前跳跃高度
            const heightPercentage = currentHeight / (maxHeight - (canvas.height - this.height - 50)); // 计算跳跃高度百分比

            if (heightPercentage <= 0.3) { // 根据跳跃高度百分比调整旋转角度
                this.rotation = -15;
            } else if (heightPercentage <= 0.6) {
                this.rotation = -15;
            } else if (heightPercentage <= 1) {
                this.rotation = 0;
            }

            if (this.velocity < 0) { // 如果正在下落
                if (heightPercentage >= 0.6) {
                    this.rotation = 15;
                } else if (heightPercentage >= 0.3) {
                    this.rotation = 15;
                } else {
                    this.rotation = 0;
                }
            }
        }
    }

    // 绘制玩家方法
    draw() {
        ctx.save(); // 保存当前绘图状态
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2); // 移动坐标原点到玩家中心
        ctx.rotate(this.rotation * Math.PI / 180); // 旋转画布
        ctx.strokeStyle = 'blue'; // 设置描边颜色
        ctx.lineWidth = 5; // 设置线宽
        ctx.beginPath(); // 开始绘制路径
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10); // 绘制圆角矩形
        ctx.stroke(); // 描边
        ctx.restore(); // 恢复之前的绘图状态
    }
}

// 绘制马路地面方法
function drawRoad() {
    ctx.fillStyle = 'gray'; // 设置马路颜色
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // 绘制马路地面
    ctx.fillStyle = '#F4F5F0'; // 设置路面颜色
    ctx.fillRect(0, canvas.height - 150, canvas.width, 50); // 绘制路面
}

// 绘制背景方法
function drawBackground() {
    ctx.fillStyle = backgroundColor; // 设置背景颜色
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 绘制背景
}

// 绘制马路地面方法
function drawRoad() {
    ctx.fillStyle = 'gray'; // 设置马路颜色
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // 绘制马路地面
    ctx.fillStyle = '#EADAB8'; // 设置路面颜色
    ctx.fillRect(0, canvas.height - 180, canvas.width, 130); // 绘制路面
}

// 背景元素类
class BackgroundElement {
    constructor(x, y, emoji, speed) {
        this.x = x + 50; // 背景元素x坐标向右移动50px
        this.y = y; // 背景元素y坐标
        this.emoji = emoji; // 背景元素emoji
        this.speed = speed; // 背景元素移动速度
        this.size = 20 * 3; // 固定大小为原来的3倍
    }

    // 更新背景元素状态方法
    update() {
        this.x -= this.speed; // 更新位置
        if (this.x + this.size < 0) { // 如果背景元素移出屏幕
            this.x = canvas.width + 50; // 重置位置并向右移动50px
            if (this.emoji === '☁️') {
                this.y = Math.random() * 200; // 云朵始终保持在上面
            } else {
                this.y = canvas.height - 100 - Math.random() * 100; // 其他元素随机密集排列
            }
        }
    }

    // 绘制背景元素方法
    draw() {
        ctx.font = `${this.size}px Arial`; // 设置字体大小
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // 设置填充颜色和透明度
        ctx.fillText(this.emoji, this.x, this.y); // 绘制背景元素emoji
    }
}

// 初始化背景元素
let backgroundElements = [];
const backgroundSpeed = 1; // 背景元素移动速度

// 添加密集排列的背景元素
for (let i = 0; i < 25; i++) {
    const emoji = ['🏠', '🏪', '🏢', '🌳','🏟️','🏩','🏘️','🏣','🏥','🏦','💒','🗼','🏙️','🏬','🏯','🏭'][Math.floor(Math.random() * 16)]; // 随机选择emoji
    const x = Math.random() * canvas.width; // 随机生成x坐标
    const y = canvas.height - 100 - Math.random() * 100; // 随机生成y坐标

    // 创建新的背景元素
    const newElement = new BackgroundElement(x, y, emoji, backgroundSpeed);

    // 根据y坐标找到合适的插入位置
    let insertIndex = 0;
    while (insertIndex < backgroundElements.length && backgroundElements[insertIndex].y > y) {
        insertIndex++;
    }

    // 在合适的位置插入新元素
    backgroundElements.splice(insertIndex, 0, newElement);
}


// 添加天上的云
for (let i = 0; i < 5; i++) {
    const x = Math.random() * canvas.width; // 随机生成x坐标
    const y = Math.random() * 200; // 随机生成y坐标
    backgroundElements.push(new BackgroundElement(x, y, '☁️', backgroundSpeed));
}

// 确保背景元素始终在页面的最下层
backgroundElements.sort((a, b) => a.y - b.y);


// 障碍物类
class Obstacle {
    constructor(x, width, height, speed) {
        this.x = x; // 障碍物x坐标
        this.y = canvas.height - height - 50; // 障碍物y坐标，抬高至马路上面
        this.width = width; // 障碍物宽度
        this.height = height; // 障碍物高度
        this.speed = speed; // 障碍物移动速度
        this.color = this.getRandomColor(); // 随机颜色
        this.busNumber = Math.floor(Math.random() * 1000); // 随机生成巴士号码
    }

    // 更新障碍物状态方法
    update() {
        this.x -= this.speed; // 更新位置
    }

    // 获取随机颜色方法
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        // 确保颜色不是浅色且不是黑色
        while (this.isLightColor(color) || color === '#000000') {
            color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
        }
        return color;
    }

    // 判断颜色是否为浅色方法
    isLightColor(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness > 155;
    }

    // 绘制障碍物方法
    draw() {
        ctx.fillStyle = this.color; // 设置填充颜色
        ctx.beginPath(); // 开始绘制路径

        if (this.height < player.height * 0.45) {
            // 绘制卡车
            this.drawTruck(this.x, this.y, this.width, this.height);
            this.drawWheels(this.x, this.y + this.height);
        } else if (this.height > player.height * 0.7) {
            // 绘制双层巴士
            this.drawDoubleDeckerBus(this.x, this.y, this.width, this.height);
            this.drawWheels(this.x, this.y + this.height);
        } else {
            // 绘制单层巴士
            this.drawSingleDeckerBus(this.x, this.y, this.width, this.height);
            this.drawWheels(this.x, this.y + this.height);
        }

        ctx.closePath(); // 闭合路径
        ctx.fill(); // 填充
    }

    // 绘制卡车方法
    drawTruck(x, y, width, height) {
        const cabinWidth = width * 0.3;
        const cabinHeight = height * 0.4;
        const bedWidth = width * 0.7;
        const bedHeight = height * 0.3;

        // 绘制驾驶室
        ctx.beginPath();
        ctx.moveTo(x, y + cabinHeight);
        ctx.lineTo(x + cabinWidth * 0.2, y + cabinHeight);
        ctx.lineTo(x + cabinWidth, y);
        ctx.lineTo(x + cabinWidth, y + cabinHeight);
        // 绘制车斗
        ctx.fillRect(x + cabinWidth - 18, y + cabinHeight - bedHeight + 6, bedWidth + 12, bedHeight + 2);
        ctx.closePath();
        ctx.fill();

        // 绘制驾驶室窗户
        ctx.fillStyle = 'white'; // 设置车窗颜色
        ctx.fillRect(x + cabinWidth * 0.05 + 10, y + cabinHeight * 0.1 + 5, cabinWidth * 0.2, cabinHeight * 0.1);

        // 绘制车轮
        this.drawWheels(x, y + height);
    }

    // 绘制单层巴士方法
    drawSingleDeckerBus(x, y, width, height) {
        ctx.fillRect(x, y, width, height);
        this.drawWindows(x, y, width, height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px Arial';
        ctx.fillText('BUS', x + 8 + width * 0.1, y - 5 + height - 5);
        this.drawBusNumber(x + 10, y + 5, width, height);
    }

    // 绘制双层巴士方法
    drawDoubleDeckerBus(x, y, width, height) {
        const halfHeight = height / 2;
        ctx.fillRect(x, y, width, halfHeight);
        ctx.fillRect(x, y + halfHeight, width, halfHeight);
        this.drawWindows(x, y, width, halfHeight);
        this.drawWindows(x, y + halfHeight, width, halfHeight);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('BUS', x + 25 + width * 0.1, y - 5 + height - 5);
        this.drawBusNumber(x + 17, y - 7, width, height);
    }

    // 绘制车窗方法
    drawWindows(x, y, width, height) {
        ctx.fillStyle = 'white'; // 设置车窗颜色
        ctx.fillRect(x + width * 0.1, y + height * 0.1, width * 0.2, height * 0.2);
        ctx.fillRect(x + width * 0.4, y + height * 0.1, width * 0.2, height * 0.2);
        ctx.fillRect(x + width * 0.7, y + height * 0.1, width * 0.2, height * 0.2);
    }

    // 绘制巴士号码方法
    drawBusNumber(x, y, width, height) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 15px Arial';
        ctx.fillText(this.busNumber.toString(), x + width * 0.4, y + height * 0.5);
    }

    // 绘制车轮方法
    drawWheels(x, y) {
        ctx.fillStyle = 'black'; // 设置车轮颜色
        ctx.beginPath();
        ctx.arc(x + this.width * 0.2, y, this.width * 0.1, 0, Math.PI * 2);
        ctx.arc(x + this.width * 0.8, y, this.width * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 移动障碍物类
class MovingObstacle extends Obstacle {
    constructor(x, width, height, speed) {
        super(x, width, height, speed); // 调用父类构造函数
        this.direction = 1; // 移动方向，1表示向上，-1表示向下
    }

    // 更新移动障碍物状态方法
    update() {
        super.update(); // 调用父类更新方法
        this.y += this.speed * this.direction; // 更新位置
        if (this.y < 0 || this.y > canvas.height - this.height - 50) { // 检查是否到达边界
            this.direction *= -1; // 改变方向
        }
    }

    // 绘制移动障碍物方法
    draw() {
        ctx.fillStyle = 'red'; // 设置填充颜色
        ctx.fillRect(this.x, this.y, this.width, this.height); // 绘制矩形
    }
}

// 金币类
class Coin {
    constructor(x, y, radius, speed) {
        this.x = x; // 金币x坐标
        this.y = y - 50; // 金币y坐标，抬高至马路上面
        this.radius = radius; // 金币半径
        this.speed = speed; // 金币移动速度
        this.coinEmoji = '💸'; // 金币emoji
    }

    // 更新金币状态方法
    update() {
        this.x -= this.speed; // 更新位置
    }

    // 绘制金币方法
    draw() {
        ctx.font = '20px Arial'; // 设置字体大小
        ctx.fillText(this.coinEmoji, this.x, this.y); // 绘制金币emoji
    }
}

// 道具类
class PowerUp {
    constructor(x, y, type, speed) {
        this.x = x; // 道具x坐标
        this.y = y -50; // 道具y坐标，抬高至马路上面
        this.type = type; // 道具类型
        this.speed = speed; // 道具移动速度
        this.radius = 15; // 道具半径
    }

    // 更新道具状态方法
    update() {
        this.x -= this.speed; // 更新位置
    }

    // 绘制道具方法
    draw() {
        ctx.fillStyle = 'purple'; // 设置填充颜色
        ctx.beginPath(); // 开始绘制路径
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // 绘制圆形
        ctx.fill(); // 填充
    }
}

// 导弹类
// 导弹类
class Missile {
    constructor(x, y, speed, angle = Math.PI / -1.35) {
        this.x = x; // 导弹x坐标
        this.y = y - 50; // 导弹y坐标，抬高至马路上面
        this.speed = speed; // 导弹移动速度
        this.missileEmoji = '🚀'; // 导弹emoji
        this.angle = angle; // 导弹旋转角度
    }

    // 更新导弹状态方法
    update() {
        this.x -= this.speed; // 更新位置
    }

    // 绘制导弹方法
    draw() {
        ctx.save(); // 保存当前绘图状态
        ctx.translate(this.x, this.y); // 移动坐标原点到导弹位置
        ctx.rotate(this.angle); // 旋转画布

        ctx.font = '20px Arial'; // 设置字体大小
        ctx.fillText(this.missileEmoji, 0, 0); // 绘制导弹emoji

        ctx.restore(); // 恢复之前的绘图状态
    }
}


// 警告标识类
class WarningSign {
    constructor(x, y) {
        this.x = x; // 警告标识x坐标
        this.y = y - 50; // 警告标识y坐标，抬高至马路上面
        this.width = 20; // 警告标识宽度
        this.height = 20; // 警告标识高度
    }

    // 绘制警告标识方法
    draw() {
        // 绘制感叹号
        ctx.beginPath(); // 开始绘制路径
        ctx.font = 'bold 25px Arial'; // 设置字体样式
        ctx.textAlign = 'center'; // 设置文本对齐方式
        ctx.textBaseline = 'middle'; // 设置文本基线
        ctx.fillText('⚠️', this.x, this.y + 13); // 绘制文本
        ctx.fill(); // 填充
    }
}

// 创建玩家实例
const player = new Player(canvas.width / 2 - 25, canvas.height - 50);
let obstacles = []; // 障碍物数组
let coins = []; // 金币数组
let powerUps = []; // 道具数组
let missiles = []; // 导弹数组
let warningSigns = []; // 警告标识数组
let obstacleSpeed = 5; // 障碍物移动速度
let lastObstacleTime = 0; // 上次生成障碍物的时间
let lastCoinTime = 0; // 上次生成金币的时间
let lastPowerUpTime = 0; // 上次生成道具的时间
let lastMissileTime = 0; // 上次生成导弹的时间
const obstacleInterval = 1000; // 生成障碍物的间隔时间
const coinInterval = 2000; // 生成金币的间隔时间
const powerUpInterval = 3000; // 生成道具的间隔时间
const missileInterval = 5000; // 生成导弹的间隔时间
let score = 0; // 分数
let backgroundColor = 'lightblue'; // 背景颜色
const missileProbability = 0.05; // 导弹出现概率
const missileMinHeight = 600; // 导弹最低高度
const missileMaxHeight = 400; // 导弹最高高度

// 计算障碍物的最大高度
const maxObstacleHeight = Math.abs(player.maxJumpVelocity) / player.gravity * 0.6;

// 初始生成两个障碍物
for (let i = 0; i < 2; i++) {
    const height = Math.random() * maxObstacleHeight + 20; // 随机生成高度
    obstacles.push(new Obstacle(canvas.width + i * 400, Math.random() * 50 + 50, height, obstacleSpeed));
}

// 监听鼠标按下事件
canvas.addEventListener('mousedown', () => player.jump(Date.now()));

// 监听鼠标释放事件
canvas.addEventListener('mouseup', () => player.releaseJump(Date.now()));

// 绘制跳跃进度条方法
function drawProgress(currentTime) {
    const progress = player.jumpStartTime ? Math.min(1, (currentTime - player.jumpStartTime) / player.maxJumpTime) : 0; // 计算跳跃进度
    const progressBarWidth = 200; // 进度条宽度
    const progressBarHeight = 20; // 进度条高度
    const progressBarX = 20; // 进度条x坐标
    const progressBarY = 20; // 进度条y坐标

    ctx.fillStyle = 'gray'; // 设置进度条背景颜色
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight); // 绘制进度条背景
    ctx.fillStyle = 'lightgreen'; // 设置进度条填充颜色
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight); // 绘制进度条填充
}

// 绘制生命值条方法
function drawHealth() {
    const healthBarWidth = 200; // 生命值条宽度
    const healthBarHeight = 20; // 生命值条高度
    const healthBarX = 20; // 生命值条x坐标
    const healthBarY = 50; // 生命值条y坐标

    ctx.fillStyle = 'gray'; // 设置生命值条背景颜色
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight); // 绘制生命值条背景
    ctx.fillStyle = 'red'; // 设置生命值条填充颜色
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * (player.health / 100), healthBarHeight); // 绘制生命值条填充
}

// 绘制分数方法
function drawScore() {
    const scoreX = canvas.width - 120; // 分数x坐标
    const scoreY = 20; // 分数y坐标

    ctx.fillStyle = 'black'; // 设置文本颜色
    ctx.font = '20px Arial'; // 设置字体样式
    ctx.fillText(`Score: ${score}`, scoreX, scoreY); // 绘制分数文本
}

// 绘制背景方法
function drawBackground() {
    ctx.fillStyle = backgroundColor; // 设置背景颜色
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 绘制背景
}

let scorePopups = []; // 存储分数弹窗的数组

function checkCollision() {
    obstacles.forEach((obstacle, index) => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) { // 检查玩家与障碍物是否碰撞
            player.health -= 10; // 减少生命值
            if (player.health <= 0) { // 如果生命值为0
                alert('Game Over!'); // 弹出游戏结束提示
                resetGame(); // 重置游戏
            }
        } else if (player.y + player.height < obstacle.y && obstacle.x + obstacle.width < player.x && obstacle !== player.lastObstaclePassed) { // 检查玩家是否成功跳过障碍物
            score += 1; // 增加分数
            player.lastObstaclePassed = obstacle; // 记录已跳过的障碍物
            scorePopups.push({ x: player.x + player.width / 2, y: player.y - 10, text: '+1', color: 'black', time: Date.now() }); // 显示加分提示
        }
    });

    coins.forEach((coin, index) => {
        const distance = Math.hypot(player.x + player.width / 2 - coin.x, player.y + player.height / 2 - coin.y); // 计算玩家与金币的距离
        if (distance < player.width / 2 + coin.radius) { // 检查是否拾取金币
            score += 5; // 增加分数
            coins.splice(index, 1); // 移除已拾取的金币
            scorePopups.push({ x: player.x + player.width / 2, y: player.y - 10, text: '+5', color: 'black', time: Date.now() }); // 显示加分提示
        }
    });

    powerUps.forEach((powerUp, index) => {
        const distance = Math.hypot(player.x + player.width / 2 - powerUp.x, player.y + player.height / 2 - powerUp.y); // 计算玩家与道具的距离
        if (distance < player.width / 2 + powerUp.radius) { // 检查是否拾取道具
            applyPowerUpEffect(powerUp.type); // 应用道具效果
            powerUps.splice(index, 1); // 移除已拾取的道具
            if (powerUp.type === 'invincible') {
                scorePopups.push({ x: player.x + player.width / 2, y: player.y - 10, text: '生命恢复', color: 'red', time: Date.now() }); // 显示生命恢复提示
            } else if (powerUp.type === 'speed') {
                scorePopups.push({ x: player.x + player.width / 2, y: player.y - 10, text: '加速', color: 'purple', time: Date.now() }); // 显示加速提示
            }
        }
    });

    // 检查玩家与导弹是否碰撞
    missiles.forEach((missile, index) => {
        if (player.x < missile.x + missile.width &&
            player.x + player.width > missile.x &&
            player.y < missile.y + missile.height &&
            player.y + player.height > missile.y) { // 检查玩家与导弹是否碰撞
            player.health -= 20; // 减少生命值
            if (player.health <= 0) { // 如果生命值为0
                alert('Game Over!'); // 弹出游戏结束提示
                resetGame(); // 重置游戏
            }
            missiles.splice(index, 1); // 移除已碰撞的导弹
        }
    });
}

function drawScorePopups() {
    const currentTime = Date.now();
    scorePopups.forEach((popup, index) => {
        if (currentTime - popup.time > 1000) { // 如果显示时间超过1秒
            scorePopups.splice(index, 1); // 移除该弹窗
        } else {
            ctx.fillStyle = popup.color;
            ctx.strokeStyle = 'white'; // 设置描边颜色为白色
            ctx.lineWidth = 2; // 设置描边宽度
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(popup.text, player.x + player.width / 2, player.y - 10 - (scorePopups.length - index - 1) * 20); // 绘制描边
            ctx.fillText(popup.text, player.x + player.width / 2, player.y - 10 - (scorePopups.length - index - 1) * 20); // 绘制文本
        }
    });
}


// 应用道具效果方法
function applyPowerUpEffect(type) {
    switch (type) {
        case 'speed': // 加速道具
            obstacleSpeed += 0.1; // 增加障碍物速度
            break;
        case 'invincible': // 无敌道具
            player.health = 100; // 恢复生命值
            break;
    }
}

// 重置游戏方法
function resetGame() {
    score = 0; // 重置分数
    obstacles = []; // 清除所有障碍物
    coins = []; // 清除所有金币
    powerUps = []; // 清除所有道具
    missiles = []; // 清除所有导弹
    warningSigns = []; // 清除所有警告标识
    obstacleSpeed = 5; // 恢复初始速度
    lastObstacleTime = 0; // 重置上次生成障碍物的时间
    lastCoinTime = 0; // 重置上次生成金币的时间
    lastPowerUpTime = 0; // 重置上次生成道具的时间
    lastMissileTime = 0; // 重置上次生成导弹的时间

    for (let i = 0; i < 2; i++) { // 重新生成两个障碍物
        const height = Math.random() * maxObstacleHeight + 25; // 随机生成高度
        obstacles.push(new Obstacle(canvas.width + i * 400, Math.random() * 50 + 50, height, obstacleSpeed));
    }

    player.health = 100; // 恢复玩家生命值
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 50;
    player.velocity = 0;
    player.isGrounded = true;
    player.jumpStartTime = null;
    player.rotation = 0;
    player.lastObstaclePassed = null;
}


// 游戏循环
function gameLoop() {
    const currentTime = Date.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(); // 绘制背景
    drawRoad(); // 绘制马路地面

    // 更新和绘制背景元素
    backgroundElements.forEach(element => {
        element.update();
        element.draw();
    });

    player.update();
    player.draw();

    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });

    coins.forEach((coin, index) => {
        coin.update();
        coin.draw();
        if (coin.x + coin.radius < 0) {
            coins.splice(index, 1);
        }
    });

    powerUps.forEach((powerUp, index) => {
        powerUp.update();
        if (powerUp.type === 'invincible') {
            ctx.font = `${powerUp.radius}px Arial`; // 设置字体大小
            ctx.fillStyle = 'black'; // 设置文本颜色
            ctx.fillText('❤️', powerUp.x - powerUp.radius, powerUp.y + powerUp.radius); // 绘制爱心emoji
        } else if (powerUp.type === 'speed') {
            ctx.font = `${powerUp.radius}px Arial`; // 设置字体大小
            ctx.fillStyle = 'black'; // 设置文本颜色
            ctx.fillText('⚡', powerUp.x - powerUp.radius, powerUp.y + powerUp.radius); // 绘制⚡emoji
        } else {
            powerUp.draw();
        }
        if (powerUp.x + powerUp.radius < 0) {
            powerUps.splice(index, 1);
        }
    });

    if (currentTime - lastObstacleTime > obstacleInterval && obstacles.length < 2) {
        const height = Math.random() * maxObstacleHeight + 20;
        obstacles.push(new Obstacle(canvas.width, Math.random() * 50 + 50, height, obstacleSpeed));
        lastObstacleTime = currentTime;
    }

    if (currentTime - lastCoinTime > coinInterval && Math.random() < 0.4) {
        const coinCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < coinCount; i++) {
            const coinX = canvas.width + i * 100;
            const minHeight = canvas.height - Math.abs(player.maxJumpVelocity) / player.gravity * 1.5 - 50;
            const maxHeight = canvas.height - Math.abs(player.maxJumpVelocity) / player.gravity * 3 - 50;
            const coinY = Math.random() * (maxHeight - minHeight) + minHeight;
            coins.push(new Coin(coinX, coinY, 10, 5));
        }
        lastCoinTime = currentTime;
    }

    if (currentTime - lastPowerUpTime > powerUpInterval) {
        const powerUpX = canvas.width;
        const minHeight = canvas.height - Math.abs(player.maxJumpVelocity) / player.gravity * 1.5 - 50; // 计算最小高度
        const maxHeight = canvas.height - Math.abs(player.maxJumpVelocity) / player.gravity * 3 - 50; // 计算最大高度
        const powerUpY = Math.random() * (maxHeight - minHeight) + minHeight; // 随机生成高度
        const powerUpType = Math.random() < 0.5 ? 'speed' : 'invincible'; // 随机选择道具类型
        powerUps.push(new PowerUp(powerUpX, powerUpY, powerUpType, 5));
        lastPowerUpTime = currentTime;
    }

    // 生成导弹障碍物
    if (currentTime - lastMissileTime > missileInterval && Math.random() < missileProbability) {
        const missileY = Math.random() * (missileMaxHeight - missileMinHeight) + missileMinHeight - 50;
        warningSigns.push(new WarningSign(canvas.width - 50, missileY));
        setTimeout(() => {
            missiles.push(new Missile(canvas.width, missileY, obstacleSpeed*2));
        }, 2000); // 警告标识显示2秒后生成导弹
        lastMissileTime = currentTime;
    }

    // 更新和绘制导弹
    missiles.forEach((missile, index) => {
        missile.update();
        missile.draw();
        if (missile.x + missile.width < 0) {
            missiles.splice(index, 1);
        }
    });

    // 绘制警告标识
    warningSigns.forEach((warningSign, index) => {
        warningSign.draw();
        if (currentTime - lastMissileTime > 2000) {
            warningSigns.splice(index, 1);
        }
    });

    drawProgress(currentTime);
    drawHealth();
    drawScore();
    checkCollision();
    drawScorePopups(); // 绘制分数弹窗

    requestAnimationFrame(gameLoop);
}

gameLoop();
