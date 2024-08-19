const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const screenWidth = 512;
const screenHeight = 600;
canvas.width = screenWidth;
canvas.height = screenHeight;
let score = 0; // 初始化分数
let escorts = null; // 在全局范围内定义 escorts 变量

// 加载背景图片
const backgrounds = [
    'img/bg.jpg',
    'img/bg0.jpg',
    'img/bg1.jpg',
    'img/bg2.jpg'
  ].map((src) => {
    const img = new Image();
    img.src = src;
    img.onerror = () => console.error(`Failed to load background image: ${src}`);
    return img;
  });

  

// 引入两个背景变量和相关变量
let currentBackgroundIndex = 0;
let backgroundImage = backgrounds[currentBackgroundIndex]; 
let targetBackgroundImage = null;
let transitionAlpha = 0;
let isTransitioning = false;
let backgroundY = 0; // 背景图片的y坐标
let backgroundChanged = false; 

function drawBackground() {
    // 如果正在渐变过程
    if (isTransitioning && targetBackgroundImage) {
        // 绘制当前背景
        ctx.globalAlpha = 1 - transitionAlpha;
        ctx.drawImage(backgroundImage, 0, backgroundY, screenWidth, screenHeight);
        ctx.drawImage(backgroundImage, 0, backgroundY - screenHeight, screenWidth, screenHeight);
        
        // 绘制目标背景
        ctx.globalAlpha = transitionAlpha;
        ctx.drawImage(targetBackgroundImage, 0, backgroundY, screenWidth, screenHeight);
        ctx.drawImage(targetBackgroundImage, 0, backgroundY - screenHeight, screenWidth, screenHeight);
        
        // 还原 alpha 值
        ctx.globalAlpha = 1;
    } else {
        // 只绘制当前背景
        ctx.drawImage(backgroundImage, 0, backgroundY, screenWidth, screenHeight);
        ctx.drawImage(backgroundImage, 0, backgroundY - screenHeight, screenWidth, screenHeight);
    }
}

function transitionBackground() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * backgrounds.length);
    } while (newIndex === currentBackgroundIndex); // 确保新选择的背景与当前背景不同

    targetBackgroundImage = backgrounds[newIndex];
    currentBackgroundIndex = newIndex; // 更新当前背景索引
    transitionAlpha = 0; // 重置透明度
    isTransitioning = true; // 开始渐变
}


function updateTransition() {
    if (isTransitioning) {
        transitionAlpha += 0.01; // 调整渐变速度
        if (transitionAlpha >= 1) {
            transitionAlpha = 1;
            isTransitioning = false;
            backgroundImage = targetBackgroundImage; // 完成渐变，更新当前背景为目标背景
            targetBackgroundImage = null;
        }
    }
}

// 更新背景位置
function updateBackground() {
    backgroundY += 1; // 背景滚动速度
    if (backgroundY >= screenHeight) {
        backgroundY = 0;
    }
}

// 绘制计分板
function drawScoreboard() {
    ctx.font = '20px 微软雅黑,bold';
    ctx.fillStyle = 'white';
    
    // 计算分数文本的宽度
    const textWidth = ctx.measureText(`Score: ${score}`).width;
    
    // 动态调整显示位置，确保不会溢出画面
    const xPosition = screenWidth - textWidth - 10; // 留出一些边距
    ctx.fillText(`Score: ${score}`, xPosition, 30); // 显示在右上角
}

// 更新分数
function updateScore(enemyType) {
    const scoreValues = {
        'e01': 200,
        'e02': 300,
        'e03': 400,
        'e04': 500,
        'e05': 600,
    };
    score += scoreValues[enemyType] || 0;
}

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 30,
    height: 40,
    speed: 5,
    shooting: false,
    bullets: [],
    health: 100 // 玩家生命值
};

// 定义道具类型
const ITEM_TYPES = {
    SHIELD: 'shield',
    HEALTH: 'health',
    WEAPON_UPGRADE: 'weapon_upgrade'
};

// 加载道具图片
const itemImages = {
    [ITEM_TYPES.SHIELD]: new Image(),
    [ITEM_TYPES.HEALTH]: new Image(),
    [ITEM_TYPES.WEAPON_UPGRADE]: new Image()
};

itemImages[ITEM_TYPES.SHIELD].src = 'img/article1.png'; // 替换为你的防护盾道具图片路径
itemImages[ITEM_TYPES.HEALTH].src = 'img/hero_blood.png'; // 替换为你的恢复血量道具图片路径
itemImages[ITEM_TYPES.WEAPON_UPGRADE].src = 'img/article2.png'; // 替换为你的升级武器道具图片路径

// 加载防护盾图片
const shieldImage = new Image();
shieldImage.src = 'img/safe.png'; // 替换为你的防护盾图片路径

// 道具类
class Item {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.active = true;
        this.speed = 2; // 道具移动速度
        this.enteredScreen = false; // 标记道具是否进入屏幕
    }

    update() {
        if (this.y >= 0) {
            this.enteredScreen = true; // 道具进入屏幕
        }
        if (this.enteredScreen) {
            this.y += this.speed; // 道具从上往下移动
            if (this.y > screenHeight) {
                this.active = false; // 如果道具移出屏幕，设置为不活跃
            }
        } else {
            this.y += this.speed; // 道具从上往下移动，直到进入屏幕
        }
    }

    draw() {
        ctx.drawImage(itemImages[this.type], this.x, this.y, this.width, this.height);
    }
}




// 道具数组
let items = [];



// 生成道具
function spawnItem(x, y) {
    const types = Object.values(ITEM_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const item = new Item(type, x, y);
    items.push(item);
}

// 在地图随机位置生成道具
function spawnRandomItem() {
    const x = Math.random() * screenWidth;
    const y = -30; // 道具从屏幕顶部之外生成
    spawnItem(x, y);
}

// 更新道具
function updateItems() {
    items = items.filter(item => {
        item.update();
        if (!item.active) return false;
        if (checkItemCollision(item, player)) {
            collectItem(item);
            return false;
        }
        return true;
    });
}


// 绘制道具
function drawItems() {
    items.forEach(item => item.draw());
}


// 收集道具
function collectItem(item) {
    switch (item.type) {
        case ITEM_TYPES.SHIELD:
            activateShield();
            break;
        case ITEM_TYPES.HEALTH:
            restoreHealth();
            break;
        case ITEM_TYPES.WEAPON_UPGRADE:
            upgradeWeapon();
            // 检查武器阶段和等级
            if (currentStage === WEAPON_STAGES.length - 1 && currentLevel === 0) {
                spawnAllyShip();
            }
            break;
    }
}


// 激活防护盾
function activateShield() {
    player.shield = { active: true, duration: 5000, startTime: Date.now() };
}

// 恢复血量
function restoreHealth() {
    player.health = Math.min(player.health + player.health * 0.25, 100);
}

// 升级武器
function upgradeWeapon() {
    player.weaponLevel = (player.weaponLevel || 1) + 1;
}

// 更新防护盾
function updateShield() {
    if (player.shield && player.shield.active) {
        if (Date.now() - player.shield.startTime > player.shield.duration) {
            player.shield.active = false;
        }
    }
}

// 绘制防护盾
function drawShield() {
    if (player.shield && player.shield.active) {
        ctx.drawImage(shieldImage, player.x - player.width / 2 -8 , player.y - player.height / 2 - 27, player.width + 16, player.height + 20);
    }
}

const WEAPON_STAGES = [
    // 第一阶段：单个子弹发射口
    [{ x: 0, y: -player.height / 2, angle: -90}],
    // 第二阶段：左右两边各增加一个子弹发射口
    [{ x: -30, y: -player.height / 2 , angle: -90}, { x: 0, y: -player.height / 2 , angle: -90}, { x: 30, y: -player.height / 2, angle: -90 }],
    // 第三阶段：左右两边各增加一个倾斜15°的发射口
    [{ x: 20, y: -player.height / 2, angle: -75 }, { x: -35, y: -player.height / 2, angle: -90 }, { x: 0, y: -player.height / 2, angle: -90 }, { x: 35, y: -player.height / 2, angle: -90 }, { x: -20, y: -player.height / 2, angle: -105 }],
];

let currentStage = 0; // 当前武器阶段
let currentLevel = 0; // 当前武器等级
let shotInterval = 500; // 子弹生成间隔时间（毫秒）

// 升级武器
function upgradeWeapon() {
    currentLevel++;
    if (currentLevel >= 9) {
        currentLevel = 0;
        currentStage++;
        if (currentStage >= WEAPON_STAGES.length) {
            console.log("已满级，无法升级");
            currentStage = WEAPON_STAGES.length - 1; // 确保不会超出阶段数
        }
    }
    updateShotInterval();
}

// 更新子弹生成间隔时间
function updateShotInterval() {
    shotInterval = 500 - (currentLevel * 50); // 每级减少100毫秒
    if (shotInterval < 50) {
        shotInterval = 50; // 确保最小间隔时间为20毫秒
    }
}


let enemies = [];
let boss = null;
const bossSpawnThreshold = 2; // 击杀10个普通敌人后出现Boss
let enemiesKilled = 0;
let stopSpawningEnemies = false; // 停止生成新的敌人

let explosions = []; // 存储爆炸特效的数组

let playerImage = new Image();
playerImage.src = 'img/plane0left.png'; // 替换为你的图片路径
playerImage.onerror = () => console.error('Failed to load player image');

let mirroredImage = new Image();
mirroredImage.src = 'img/plane0right.png'; // 替换为你的镜像图片路径
mirroredImage.onerror = () => console.error('Failed to load mirrored image');

let playerFrame = 0; // 当前播放的帧
let lastMoveTime = Date.now(); // 上次移动的时间
let lastMoveDirection = 0; // 上次移动的方向，0表示无方向，-1表示左，1表示右
let moveThreshold = 4; // 移动阈值
let fastMoveThreshold = 7; // 快速移动阈值
let moveResetTime = 500; // 移动重置时间（毫秒）

// 更新玩家位置的逻辑
function updatePlayerPosition() {
    // 更新玩家位置的逻辑
    lastMoveTime = Date.now();
}

// 绘制玩家
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    let frameWidth = playerImage.width / 4;
    let frameHeight = playerImage.height;

    // 根据移动方向和速度选择合适的帧
    if (Math.abs(player.x - player.lastX) < moveThreshold && Math.abs(player.y - player.lastY) < moveThreshold) {
        playerFrame = (playerFrame + 1) % 2; // 水平飞行状态1和2交替播放
        lastMoveDirection = 0;
    } else if (player.x - player.lastX < -moveThreshold) { // 向左移动
        playerFrame = Math.abs(player.x - player.lastX) > fastMoveThreshold ? 3 : 2; // 左偏转30°或15°
        lastMoveDirection = -1;
    } else if (player.x - player.lastX > moveThreshold) { // 向右移动
        playerFrame = Math.abs(player.x - player.lastX) > fastMoveThreshold ? 1 : 0; // 右偏转30°或15°
        lastMoveDirection = 1;
    }

    // 如果移动停止或方向改变，重置帧
    if (Date.now() - lastMoveTime > moveResetTime) {
        playerFrame = 0;
        lastMoveDirection = 0;
    }

    // 绘制图片
    let frameX = playerFrame * frameWidth;
    if (lastMoveDirection == 1) {
        // 使用镜像过的plane0right文件
        ctx.drawImage(mirroredImage, frameX, 0, frameWidth, frameHeight, -player.width / 2, -player.height, player.width, player.height);
    } else {
        ctx.drawImage(playerImage, frameX, 0, frameWidth, frameHeight, -player.width / 2, -player.height, player.width, player.height);
    }

    ctx.restore();
}

// 更新玩家位置历史
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    player.lastX = player.x;
    player.lastY = player.y;
    player.x = Math.max(player.width / 2, Math.min(screenWidth - player.width / 2, (event.clientX - rect.left) * scaleX));
    player.y = Math.max(player.height / 2, Math.min(screenHeight - player.height / 2, (event.clientY - rect.top) * scaleY));
    lastMoveTime = Date.now();
});




// 加载子弹图片
const bulletImage = new Image();
bulletImage.src = 'img/bomb9.png'; // 替换为你的子弹图片路径
bulletImage.onerror = () => console.error('Failed to load bullet image');


// 创建玩家子弹
function createPlayerBullet(x, y, angle = 0) {
    return { x: x + player.x, y: y + player.y, speed: 6, angle: angle, frame: 0, switchCounter: 0, rotation: angle + 90 }; // 调整 rotation 属性
}

// 更新玩家子弹位置和碰撞检测
function updatePlayerBullets() {
    player.bullets = player.bullets.filter(bullet => {
        if (!bullet) return false; // 检查 bullet 是否存在

        if (bullet.angle !== 0) {
            bullet.x += Math.cos(bullet.angle * Math.PI / 180) * bullet.speed;
            bullet.y += Math.sin(bullet.angle * Math.PI / 180) * bullet.speed;
        } else {
            bullet.y -= bullet.speed;
        }
        if (bullet.y < 0) return false;

        if (boss && checkBulletCollision(bullet, boss)) {
            boss.health -= 10;
            if (boss.health <= 0) {
                score += 1200;
                boss = null;
            }
            explosions.push(createExplosion(bullet.x, bullet.y));
            return false;
        }

        for (let i = 0; i < enemies.length; i++) {
            if (checkBulletCollision(bullet, enemies[i])) {
                enemies[i].health -= 10;
                if (enemies[i].health <= 0) {
                    updateScore(enemies[i].type);
                    enemies.splice(i, 1);
                    enemiesKilled++;
                    if (enemiesKilled >= bossSpawnThreshold) spawnBoss();
                    explosions.push(createExplosion(bullet.x, bullet.y));

                    // 有概率生成道具
                    if (Math.random() < 0.2) {
                        spawnItem(enemies[i].x, enemies[i].y);
                    }
                }
                return false;
            }
        }
        return true;
    });
}


// 绘制子弹
function drawBullets() {
    player.bullets.forEach(bullet => {
        const frameWidth = bulletImage.width / 2;
        const frameHeight = bulletImage.height;
        const frameX = bullet.frame % 2 === 0 ? 0 : frameWidth;

        ctx.save();
        ctx.translate(bullet.x, bullet.y); // 平移到子弹中心
        ctx.rotate(bullet.rotation * Math.PI / 180); // 根据子弹的旋转角度旋转画布
        ctx.drawImage(bulletImage, frameX, 0, frameWidth, frameHeight, -15, -40, 30, 80); // 调整子弹的宽度和高度，并确保图片中心对齐
        ctx.restore();

        // 每5帧切换一次图片
        bullet.switchCounter++;
        if (bullet.switchCounter % 5 === 0) {
            bullet.frame = (bullet.frame + 1) % 2; // 更新帧计数器并限制范围
        }
    });
}


// 道具碰撞检测
function checkItemCollision(item, target) {
    return item.x > target.x - target.width / 2 -10&& item.x < target.x + target.width / 2 -10&&
               item.y > target.y - target.height / 2 -27&& item.y < target.y + target.height / 2 -27;
}

// 碰撞检测
function checkBulletCollision(bullet, target) {
    const offset = 10; // 增加的偏移量，可以根据需要调整
    return bullet.x > target.x - target.width / 2 - offset && bullet.x < target.x + target.width / 2 + offset &&
           bullet.y > target.y - target.height / 2 - offset && bullet.y < target.y + target.height / 2 + offset;
}




// 绘制生命值条
function drawHealthBar() {
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = 'green';
    ctx.fillRect(10, 10, Math.max(player.health * 2, 2), 20);
}

// 创建敌对AI
function createEnemy() {
    const types = ['e01', 'e02', 'e03', 'e04', 'e05'];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
        x: Math.random() * (screenWidth - 30),
        y: -50,
        width: 30,
        height: 30,
        type: type,
        bullets: [],
        lastShot: 0,
        health: 30
    };
}

let playerPositionHistory = []; // 记录玩家过去10帧的位置
const historyLength = 10; // 记录的历史长度

// 在玩家移动时更新位置历史
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    player.x = Math.max(player.width / 2, Math.min(screenWidth - player.width / 2, (event.clientX - rect.left) * scaleX));
    player.y = Math.max(player.height / 2, Math.min(screenHeight - player.height / 2, (event.clientY - rect.top) * scaleY));

    // 更新位置历史
    playerPositionHistory.push({ x: player.x, y: player.y });
    if (playerPositionHistory.length > historyLength) {
        playerPositionHistory.shift(); // 移除最早的位置
    }
});

// 加载火箭图片
const rocketImage = new Image();
rocketImage.src = 'img/bomb10.png'; // 替换为你的火箭图片路径
rocketImage.onerror = () => console.error('Failed to load rocket image');
const enemyBulletImage = new Image();
enemyBulletImage.src = 'img/AI_bullet.png'; // 替换为你的敌对AI子弹图片路径
enemyBulletImage.onerror = () => console.error('Failed to load enemy bullet image');

// 创建敌对AI子弹
function createEnemyBullet(x, y) {
    const bullets = [];
    const random2 = Math.random() * 3 + 1;
    for (let i = 0; i < random2; i++) {
        const random1 = Math.random() * 9 + 1;
        bullets.push({ x: x + i * random1, y: y + i * 25 - 25, width: 2, height: 10, speed: 5, image: enemyBulletImage });
    }

    if (Math.random() < 0.2 && playerPositionHistory.length > 0) { // 确保 playerPositionHistory 不为空
        const targetPosition = playerPositionHistory[0]; // 使用前10帧的位置
        bullets.push({
            x: x,
            y: y,
            width: 20,
            height: 40,
            speed: 5,
            maxSpeed: 5,
            acceleration: 0,
            tracking: true,
            image: rocketImage, // 使用加载的火箭图片
            target: targetPosition, // 使用前10帧的位置作为目标
            startTime: Date.now(),
            turnRate: 2,
            trackingAngle: 30,
            frame: 0, // 添加帧计数器
            switchCounter: 0, // 添加切换计数器
            rotation: 0, // 添加旋转角度属性
            reachedTarget: false // 标记是否到达目标位置
        });
    }

    return bullets;
}

// 更新敌对AI位置和射击
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        const closestBullet = findClosestBullet(enemy, player.bullets);
        if (closestBullet) {
            const distance = Math.sqrt((closestBullet.x - enemy.x) ** 2 + (closestBullet.y - enemy.y) ** 2);
            if (distance < 100) {
                enemy.x += Math.sign(enemy.x - closestBullet.x) * 2;
            }
        }
        enemy.y += 2;
        if (enemy.y > screenHeight) {
            enemies.splice(index, 1);
        }
        if (Date.now() - enemy.lastShot > 3000) {
            enemy.bullets.push(...createEnemyBullet(enemy.x, enemy.y + enemy.height / 2));
            enemy.lastShot = Date.now();
        }
    });
}

// 找到离敌对AI最近的玩家子弹
function findClosestBullet(enemy, bullets) {
    let closestBullet = null;
    let closestDistance = Infinity;
    bullets.forEach(bullet => {
        const distance = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestBullet = bullet;
        }
    });
    return closestBullet;
}

// 加载敌对AI图片
const enemyImages = {
    'e01': new Image(),
    'e02': new Image(),
    'e03': new Image(),
    'e04': new Image(),
    'e05': new Image()
};

enemyImages['e01'].src = 'img/e-01.png';
enemyImages['e02'].src = 'img/e-02.png';
enemyImages['e03'].src = 'img/e-03.png';
enemyImages['e04'].src = 'img/e-04.png';
enemyImages['e05'].src = 'img/e-05.png';

enemyImages['e01'].onerror = () => console.error('Failed to load e01 image');
enemyImages['e02'].onerror = () => console.error('Failed to load e02 image');
enemyImages['e03'].onerror = () => console.error('Failed to load e03 image');
enemyImages['e04'].onerror = () => console.error('Failed to load e04 image');
enemyImages['e05'].onerror = () => console.error('Failed to load e05 image');

// 绘制敌对AI
function drawEnemy(enemy) {
    ctx.drawImage(enemyImages[enemy.type], enemy.x, enemy.y, enemy.width, enemy.height);
}

// 绘制敌对AI子弹
function drawEnemyBullets() {
    ctx.fillStyle = 'lightgreen';
    enemies.forEach(enemy => {
        enemy.bullets.forEach(bullet => {
            if (bullet.image) {
                // 根据切换计数器交替显示左右两部分
                const frameWidth = bullet.image.width / 2;
                const frameHeight = bullet.image.height;
                const frameX = bullet.frame % 2 === 0 ? 0 : frameWidth;

                // 保存当前绘图状态
                ctx.save();

                // 平移到子弹位置
                ctx.translate(bullet.x, bullet.y);

                // 旋转画布
                ctx.rotate(bullet.rotation * Math.PI / 180);

                // 绘制图片
                if (bullet.image === rocketImage) {
                    // 如果是导弹，保持原始大小
                    ctx.drawImage(bullet.image, frameX, 0, frameWidth, frameHeight, -bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
                } else {
                    // 否则放大3倍
                    ctx.drawImage(bullet.image, frameX, 0, frameWidth, frameHeight, -bullet.width * 1.5, -bullet.height * 1.5, bullet.width * 3, bullet.height * 3);
                }

                // 恢复绘图状态
                ctx.restore();

                // 每5帧切换一次图片
                bullet.switchCounter++;
                if (bullet.switchCounter % 5 === 0) {
                    bullet.frame++; // 更新帧计数器
                }
            } else {
                // 如果没有image属性，则绘制默认的子弹样式（例如，一个小矩形）
                ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            }
        });
    });
}

// 更新敌对AI子弹位置和碰撞检测
function updateEnemyBullets() {
    enemies.forEach(enemy => {
        enemy.bullets.forEach((bullet, index) => {
            if (bullet.tracking && !bullet.reachedTarget && bullet.target) { // 确保 bullet.target 存在
                const dx = bullet.target.x - bullet.x;
                const dy = bullet.target.y - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < bullet.speed) {
                    bullet.reachedTarget = true; // 到达目标位置
                    bullet.originalAngle = Math.atan2(dy, dx); // 记录原始飞行角度
                } else {
                    const angle = Math.atan2(dy, dx);
                    bullet.x += Math.cos(angle) * bullet.speed;
                    bullet.y += Math.sin(angle) * bullet.speed;
                    bullet.rotation = angle * (180 / Math.PI) + 90; // 计算旋转角度
                    if (bullet.rotation >= 360) bullet.rotation -= 360;
                }
            } else if (bullet.reachedTarget) {
                // 解除瞄准，直线飞行
                bullet.x += Math.cos(bullet.originalAngle) * bullet.speed;
                bullet.y += Math.sin(bullet.originalAngle) * bullet.speed;
            } else {
                bullet.y += bullet.speed;
            }

            if (bullet.y > screenHeight) {
                enemy.bullets.splice(index, 1);
            } else if (checkBulletCollision(bullet, player)) {
                if (player.shield && player.shield.active) {
                    // 护盾激活时，忽略子弹碰撞
                    enemy.bullets.splice(index, 1);
                } else {
                    player.health -= 5;
                    score -= 100;
                    enemy.bullets.splice(index, 1);
                    explosions.push(createExplosion(bullet.x, bullet.y));
                }
            }
        });
    });
}


// 收集道具
function collectItem(item) {
    switch (item.type) {
        case ITEM_TYPES.SHIELD:
            activateShield();
            break;
        case ITEM_TYPES.HEALTH:
            restoreHealth();
            break;
        case ITEM_TYPES.WEAPON_UPGRADE:
            upgradeWeapon();
            // 检查武器阶段和等级
            if (currentStage === WEAPON_STAGES.length - 1 && currentLevel === 0) {
                spawnAllyShip();
            }
            break;
    }
}

let allyShips = []; // 在全局范围内初始化 allyShips 变量为一个空数组

// 加载友方战机图片
const allyShipImages = [
    new Image(),
    new Image(),
    new Image()
];

allyShipImages[0].src = 'img/VF25.png'; // 替换为你的第一张友方战机图片路径
allyShipImages[1].src = 'img/VF31.png'; // 替换为你的第二张友方战机图片路径
allyShipImages[2].src = 'img/VF37.png'; // 替换为你的第三张友方战机图片路径
// 加载友方战机子弹图片
const allyBulletImage = new Image();
allyBulletImage.src = 'img/you_bullet.png'; // 替换为你的友方战机子弹图片路径
allyBulletImage.onerror = () => console.error('Failed to load ally bullet image');

// 友方战机类
class AllyShip {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 3;
        this.health = 100;
        this.bullets = [];
        this.lastShot = 0;
        this.image = allyShipImages[Math.floor(Math.random() * allyShipImages.length)]; // 随机选择一张图片
    }

    update() {
        // 寻找并追击最近的敌方目标
        if (!this.target || !enemies.includes(this.target) || (boss && this.target === boss)) {
            this.target = this.findClosestUnassignedEnemy();
        }

        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // 如果距离目标大于最小距离，则朝着目标移动
            const minDistance = 100; // 设置最小距离
            if (distance > minDistance) {
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            }

            // 在距离目标200像素以内时发射子弹
            if (distance < 200) {
                const now = Date.now();
                if (now - this.lastShot > 500) { // 每500毫秒发射一次
                    const bullet = { x: this.x, y: this.y, speed: 5, width: 2, height: 10 };
                    this.bullets.push(bullet);
                    this.lastShot = now;
                }
            }
        }

        // 躲避逻辑
        this.avoidBullets();

        // 更新子弹位置
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            if (bullet.y < 0) return false;
            return true;
        });

        // 确保友方战机始终保持在画面内部
        this.x = Math.max(0, Math.min(screenWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(screenHeight - this.height, this.y));
    }



    draw() {
        ctx.save(); // 保存当前绘图状态
        ctx.translate(this.x + this.width / 2 - 16, this.y + this.height / 2); // 平移到友方战机中心
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height); // 绘制图片
        ctx.restore(); // 恢复之前的绘图状态

        this.bullets.forEach(bullet => {
            ctx.drawImage(allyBulletImage, bullet.x, bullet.y, bullet.width * 3, bullet.height * 3);
        });
    }


    avoidBullets() {
        // 躲避逻辑，可以根据实际情况调整
        const dangerZone = 50;
        const allBullets = [...enemies.flatMap(enemy => enemy.bullets), ...(boss ? boss.bullets : [])];
        allBullets.forEach(bullet => {
            const dx = this.x - bullet.x;
            const dy = this.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < dangerZone) {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            }
        });
    }

    
    aimAndShoot() {
        const target = this.findClosestEnemy();
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) { // 在距离目标200像素以内时发射子弹
                const now = Date.now();
                if (now - this.lastShot > 500) { // 每500毫秒发射一次
                    const bullet = { x: this.x, y: this.y, speed: 5, width: 2, height: 10 };
                    this.bullets.push(bullet);
                    this.lastShot = now;
                }
            }
        }
    }

    findClosestUnassignedEnemy() {
        let closestEnemy = null;
        let closestDistance = Infinity;
        const allEnemies = [...enemies, ...(boss ? [boss] : [])];
        allEnemies.forEach(enemy => {
            if (!allyShips.some(ally => ally.target === enemy)) {
                const distance = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
        });
        return closestEnemy;
    }
}

// 召唤友方战机
function spawnAllyShip() {
    const x = Math.random() * screenWidth;
    const y = screenHeight; // 从画面底部进入
    const allyShip = new AllyShip(x, y);
    allyShips.push(allyShip);
    console.log("召唤了新的友方战机");
}

// 更新友方战机
function updateAllyShips() {
    allyShips.forEach(allyShip => {
        allyShip.update();
    });
}

// 绘制友方战机
function drawAllyShips() {
    allyShips.forEach(allyShip => {
        allyShip.draw();
    });
}

// 生成Boss
function spawnBoss() {
    stopSpawningEnemies = true;
    boss = {
        x: screenWidth / 2 - 50, // 确保 Boss 生成在屏幕中央
        y: -100, // 确保 Boss 从屏幕上方进入
        width: 100,
        height: 100,
        health: 2000,
        bullets: [],
        lastShot: Date.now(),
        entering: true,
        pattern: 0,
        maxHealth: 2000, // 添加最大血量
        canShootTwoPatterns: false,
        isEscaping: false,
        lastMoveTime: 0,
        moveStartTime: 0,
        moveDuration: 2000,
        moveStartX: 0,
        moveEndX: 0
    };
}

// 加载 Boss 图片
const bossImage = new Image();
bossImage.src = 'img/boss.png'; // 替换为你的图片路径
bossImage.onload = () => console.log('Boss image loaded successfully');
bossImage.onerror = () => console.error('Failed to load boss image');

// 绘制Boss
function drawBoss() {
    if (boss) {
        // 计算图片的中心位置
        const imageWidth = boss.width * 2;
        const imageHeight = boss.height * 2;
        const centerX = boss.x - imageWidth / 2;
        const centerY = boss.y;

        // 绘制 Boss 图片
        ctx.drawImage(bossImage, centerX+50, centerY, imageWidth, imageHeight);

        // 绘制 Boss 血条
        ctx.fillStyle = 'yellow';
        ctx.fillRect(boss.x , boss.y - 20, (boss.health / 2000) * boss.width, 10);
    }
}



// 生成随机形状
function generateRandomShape(numPoints) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50;
        points.push({ angle, distance });
    }
    return points;
}


// 碰撞检测（Boss专用）
function checkBossCollision(bullet, boss) {
    console.log(`Bullet: x=${bullet.x}, y=${bullet.y}`);
    console.log(`Boss: x=${boss.x}, y=${boss.y}, width=${boss.width}, height=${boss.height}`);

    // 调整碰撞检测的边界，使其与Boss图片的实际显示位置相匹配，并整体下移50px
    const collision = bullet.x > boss.x - boss.width / 2 && bullet.x < boss.x + boss.width / 2 &&
                      bullet.y > boss.y - boss.height / 2 - 50 && bullet.y < boss.y + boss.height / 2 - 50;

    console.log(`Collision detected: ${collision}`);
    return collision;
}




// 创建Boss子弹
function createBossBullet(x, y, angle) {
    return { x, y: y + 30, angle, speed: 3, color: 'red', rotation: 0 };
}

let shootingInterval = null;

// 缓动函数（二次缓动）
function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}

// 加载护卫舰队图片
const escortImage = new Image();
escortImage.src = 'img/enemy2.png'; // 替换为你的图片路径
escortImage.onerror = () => console.error('Failed to load escort image');

// 生成护卫舰队
function spawnEscortFleet() {
    console.log('护卫队已生成');
    const numEscorts = 25; // 护卫舰队数量
    escorts = [];

    for (let i = 0; i < numEscorts; i++) {
        const x = -50; // 从画面左边缘进入
        const y = screenHeight / 2; // 从画面中心垂直位置进入

        const targetX = screenWidth + 50; // 目标位置为画面右边缘
        const targetY = screenHeight / 2; // 目标位置为画面中心垂直位置

        const a = (targetY - y) / ((targetX - x) ** 2);

        escorts.push({
            x: x,
            y: y,
            width: 30,
            height: 30,
            image: escortImage,
            side: 'left', // 固定从左边进入
            targetX: targetX,
            targetY: targetY,
            a: a,
            t: 0,
            speed: 2,
            bullets: [],
            enterTime: Date.now(), // 记录进入画面的时间
            stayDuration: 5000 // 停留时间（毫秒）
        });

        console.log(`护卫舰队 ${i} 初始位置: x=${x}, y=${y}`);
    }

    return escorts;
}

// 更新护卫舰队位置
function updateEscorts() {
    const currentTime = Date.now();
    escorts.forEach(escort => {
        if (currentTime - escort.enterTime < escort.stayDuration) {
            // 护卫舰队还在停留时间内，更新位置
            escort.x += escort.speed;

            escort.t += escort.speed;
            escort.y = escort.a * (escort.x - escort.targetX) ** 2 + escort.targetY;

            console.log(`护卫舰队位置: x=${escort.x}, y=${escort.y}`);

            if (Math.abs(escort.x - escort.targetX) < 10 && Math.abs(escort.y - escort.targetY) < 10) {
                escort.bullets.push(...createEscortBullets(escort.x, escort.y));
            }
        } else {
            // 护卫舰队停留时间已过，让它们离开画面
            escort.x += escort.speed * 2; // 加速离开

            // 如果护卫舰队已经离开画面，将其移除
            if (escort.x > screenWidth) {
                const index = escorts.indexOf(escort);
                if (index > -1) {
                    escorts.splice(index, 1);
                }
            }
        }
    });
}


// 创建护卫舰队子弹
function createEscortBullets(x, y) {
    const bullets = [];
    const numBullets = 20;

    for (let i = 0; i < numBullets; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        bullets.push({
            x: x,
            y: y,
            angle: angle,
            speed: speed,
            color: 'red'
        });
    }

    return bullets;
}

// 绘制护卫舰队
function drawEscorts() {
    escorts.forEach(escort => {
        ctx.drawImage(escort.image, escort.x, escort.y, escort.width, escort.height);
    });
}

// 绘制护卫舰队子弹
function drawEscortBullets() {
    escorts.forEach(escort => {
        escort.bullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        });
    });
}

// 更新护卫舰队子弹位置和碰撞检测
function updateEscortBullets() {
    escorts.forEach(escort => {
        escort.bullets.forEach((bullet, index) => {
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;

            if (bullet.x < 0 || bullet.x > screenWidth || bullet.y < 0 || bullet.y > screenHeight) {
                escort.bullets.splice(index, 1);
            } else if (player && checkCollision(bullet, player)) { // 检查 player 是否存在
                player.health -= 5;
                score -= 100;
                escort.bullets.splice(index, 1);
                explosions.push(createExplosion(bullet.x, bullet.y));
            }
        });
    });
}


// 更新Boss行为和射击模式
function updateBoss() {
    if (!boss) return;

    if (boss.entering) {
        boss.y += 2;
        if (boss.y >= 50) {
            boss.entering = false;
            boss.lastMoveTime = Date.now();
            boss.moveStartTime = Date.now();
            boss.moveDuration = 2000;
            boss.moveStartX = boss.x;
            boss.moveEndX = boss.x + (Math.random() < 0.5 ? -100 : 100);
        }
    } else {
        if (Date.now() - boss.lastShot > 4000) {
            if (shootingInterval) clearInterval(shootingInterval);
            let intervalTime = 1000;
            if (boss.health <= boss.maxHealth * 0.6 && boss.health > boss.maxHealth * 0.2) {
                intervalTime = 2000 - (boss.maxHealth * 0.4 - (boss.maxHealth - boss.health)) * 5;
            } else if (boss.health <= boss.maxHealth * 0.05) {
                intervalTime = 0;
            }

            shootingInterval = setInterval(() => {
                const pattern1 = generateRandomPattern(boss.health);
                if (boss.health <= boss.maxHealth * 0.4 && !boss.canShootTwoPatterns) {
                    boss.canShootTwoPatterns = true;
                }

                if (boss.canShootTwoPatterns) {
                    const pattern2 = generateRandomPattern(boss.health);
                    setTimeout(() => {
                        pattern1.forEach(({ x, y, angle }, i) => {
                            if (boss) {
                                const bullet = createBossBullet(boss.x + boss.width / 2 + x, boss.y + boss.height / 2 + y, angle);
                                bullet.color = generateGradientColor(i, pattern1.length);
                                boss.bullets.push(bullet);
                            }
                        });
                    }, 0);
                    setTimeout(() => {
                        pattern2.forEach(({ x, y, angle }, i) => {
                            if (boss) {
                                const bullet = createBossBullet(boss.x + boss.width / 2 + x, boss.y + boss.height / 2 + y, angle);
                                bullet.color = generateGradientColor(i, pattern2.length);
                                boss.bullets.push(bullet);
                            }
                        });
                    }, 300);
                } else {
                    pattern1.forEach(({ x, y, angle }, i) => {
                        if (boss) {
                            const bullet = createBossBullet(boss.x + boss.width / 2 + x, boss.y + boss.height / 2 + y, angle);
                            bullet.color = generateGradientColor(i, pattern1.length);
                            boss.bullets.push(bullet);
                        }
                    });
                }
            }, intervalTime);
            boss.lastShot = Date.now();
        }

        if (Date.now() - boss.lastMoveTime > boss.moveDuration) {
            boss.lastMoveTime = Date.now();
            boss.moveStartTime = Date.now();
            boss.moveStartX = boss.x;
            boss.moveEndX = boss.x + (Math.random() < 0.5 ? -100 : 100);
        }

        const t = Date.now() - boss.moveStartTime;
        const d = boss.moveDuration;
        const b = boss.moveStartX;
        const c = boss.moveEndX - boss.moveStartX;
        boss.x = easeInOutQuad(t, b, c, d);

        // 仅在Boss未撤离时限制其位置
        if (!boss.isEscaping) {
            boss.x = Math.max(0, Math.min(screenWidth - boss.width, boss.x));
            boss.y = Math.max(0, Math.min(screenHeight - boss.height, boss.y));
        }

        if (boss.health <= boss.maxHealth * 0.05 && !boss.isEscaping) {
            boss.isEscaping = true;
            boss.escapeStartTime = Date.now();
            spawnEscortFleet(); // 生成护卫舰队
            clearInterval(shootingInterval); // 停止Boss的攻击
        }

        if (boss?.isEscaping) {
            boss.y -= 10; // 高速撤离
            if (boss.y < -boss.height) {
                score += 1200; // 让Boss撤离得分
                enemiesKilled = 0; // 重置击杀计数器
                stopSpawningEnemies = false; // 恢复普通AI的敌人生成
                boss.isEscaping = false; // 重置 `isEscaping` 标志，表示撤离完成
                boss = null; // 完全撤离战场
    }
}

    }
}

// 生成随机的几何图形
const patterns = [
    // 圆形
    (numBullets) => {
        const pattern = [];
        for (let i = 0; i < numBullets; i++) {
            const angle = i * (Math.PI * 2 / numBullets);
            const radius = 50;
            pattern.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle });
        }
        return pattern;
    },
    // 方形
    (numBullets) => {
        const pattern = [];
        const bossX = 0; // 假设boss的x坐标为0
        const bossY = 0; // 假设boss的y坐标为0
    
        for (let i = 0; i < numBullets; i++) {
            const side = i % 4;
            const offset = Math.floor(i / 4) * 20;
            let x = 0, y = 0, angle = 0;
            if (side === 0) { x = offset; y = -50; angle = Math.PI / 2; }
            if (side === 1) { x = 50; y = offset; angle = 0; }
            if (side === 2) { x = -offset; y = 50; angle = -Math.PI / 2; }
            if (side === 3) { x = -50; y = -offset; angle = Math.PI; }
            pattern.push({ x, y, angle });
        }
    
        // 将对称图形添加到pattern中
        const symmetricPattern = pattern.map(bullet => {
            const symmetricX = 2 * bossX - bullet.x; // 对称变换
            const symmetricY = bullet.y; // y坐标不变
            return { x: symmetricX, y: symmetricY, angle: bullet.angle };
        });
    
        // 合并原图形和对称图形
        pattern.push(...symmetricPattern);
    
        return pattern;
    },
    
    // 椭圆
    (numBullets) => {
        const pattern = [];
        const a = 50, b = 30;
        for (let i = 0; i < numBullets; i++) {
            const angle = i * (Math.PI * 2 / numBullets);
            const x = a * Math.cos(angle);
            const y = b * Math.sin(angle);
            pattern.push({ x, y, angle });
        }
        return pattern;
    },
    // 抛物线
    (numBullets) => {
        const pattern = [];
        const a = 0.01;
        const groupSize = 6; // 每组子弹的数量
        const totalGroups = Math.ceil(numBullets / groupSize); // 总组数
        const bossX = 0; // 假设boss的x坐标为0
        const bossY = 0; // 假设boss的y坐标为0
        const rotationAngle = 30 * (Math.PI / 180); // 顺时针旋转30°，转换为弧度

        for (let groupIndex = 0; groupIndex < totalGroups; groupIndex++) {
            const baseAngle = groupIndex * (Math.PI / 3); // 每组的基础角度，间隔60°
            for (let i = 0; i < groupSize; i++) {
                if (pattern.length >= numBullets) break; // 如果已经生成了足够数量的子弹，则停止
                const angle = baseAngle + i * (Math.PI / 18); // 每组内子弹间隔20°
                const x = Math.cos(angle) * 100; // 假设100是某个合适的半径
                const y = Math.sin(angle) * 100;
                pattern.push({ x, y, angle });
            }

            // 复制并旋转60°，直到完成一周
            for (let rotation = 1; rotation < 6; rotation++) {
                const rotationAngle = rotation * (Math.PI / 3); // 旋转角度
                for (let i = 0; i < groupSize; i++) {
                    if (pattern.length >= numBullets) break; // 如果已经生成了足够数量的子弹，则停止
                    const originalAngle = baseAngle + i * (Math.PI / 18);
                    const rotatedAngle = originalAngle + rotationAngle;
                    const x = Math.cos(rotatedAngle) * 100;
                    const y = Math.sin(rotatedAngle) * 100;
                    pattern.push({ x, y, angle: rotatedAngle });
                }
            }
        }

        // 将对称图形添加到pattern中
        const symmetricPattern = pattern.map(bullet => {
            const symmetricX = 2 * bossX - bullet.x; // 对称变换
            const symmetricY = bullet.y; // y坐标不变
            return { x: symmetricX, y: symmetricY, angle: bullet.angle };
        });

        // 合并原图形和对称图形
        pattern.push(...symmetricPattern);

        // 整体顺时针旋转30°
        const rotatedPattern = pattern.map(bullet => {
            const cosAngle = Math.cos(rotationAngle);
            const sinAngle = Math.sin(rotationAngle);
            const rotatedX = bullet.x * cosAngle - bullet.y * sinAngle;
            const rotatedY = bullet.x * sinAngle + bullet.y * cosAngle;
            return { x: rotatedX, y: rotatedY, angle: bullet.angle + rotationAngle };
        });

        return rotatedPattern;
    },
    
    // 心形
    (numBullets) => {
        const pattern = [];
        const a = 50;
        for (let i = 0; i < numBullets; i++) {
            const angle = i * (Math.PI * 2 / numBullets);
            const x = a * (2 * Math.cos(angle) - Math.cos(2 * angle));
            const y = a * (2 * Math.sin(angle) - Math.sin(2 * angle));
            pattern.push({ x, y, angle });
        }
        return pattern;
    },
    
];

function generateRandomPattern(bossHealth) {
    const numPatterns = bossHealth <= 60 ? 2 : 1;
    const selectedPatterns = [];
    while (selectedPatterns.length < numPatterns) {
        const randomIndex = Math.floor(Math.random() * patterns.length);
        if (!selectedPatterns.includes(randomIndex)) {
            selectedPatterns.push(randomIndex);
        }
    }

    let pattern = [];
    selectedPatterns.forEach(index => {
        pattern = pattern.concat(patterns[index](10)); // 假设每次发射10颗子弹
    });

    // 强制对称
    const symmetricPattern = [];
    for (let i = 0; i < pattern.length; i++) {
        const bullet = pattern[i];
        symmetricPattern.push(bullet);
        symmetricPattern.push({ x: bullet.x, y: -bullet.y, angle: bullet.angle });
    }

    return symmetricPattern;
}

/// 颜色数组，包含至少7种不同的颜色
const colors = [
    [255, 0, 0],   // 红色
    [0, 255, 0],   // 绿色
    [0, 0, 255],   // 蓝色
    [255, 255, 0], // 黄色
    [255, 0, 255], // 品红色
    [0, 255, 255], // 青色
    [255, 165, 0]  // 橙色
];

// 生成渐变色
function generateGradientColor(index, total) {
    const startColor = colors[Math.floor(index / (total / colors.length)) % colors.length];
    const endColor = colors[(Math.floor(index / (total / colors.length)) + 1) % colors.length];

    const r = startColor[0] + (endColor[0] - startColor[0]) * ((index % (total / colors.length)) / (total / colors.length));
    const g = startColor[1] + (endColor[1] - startColor[1]) * ((index % (total / colors.length)) / (total / colors.length));
    const b = startColor[2] + (endColor[2] - startColor[2]) * ((index % (total / colors.length)) / (total / colors.length));

    return `rgb(${r}, ${g}, ${b})`;
}

// 绘制Boss子弹
function drawBossBullets() {
    if (boss) {
        const maxDistance = 200; // 你可以根据需要调整这个值
        boss.bullets.forEach((bullet, index) => {
            // 计算子弹与boss的距离
            const distance = Math.sqrt(Math.pow(bullet.x - boss.x, 2) + Math.pow(bullet.y - boss.y, 2));
            
            // 计算颜色索引
            const colorIndex = Math.floor((distance / maxDistance) * (colors.length - 1));
            
            // 设置子弹颜色
            ctx.fillStyle = generateGradientColor(colorIndex, colors.length);
            ctx.shadowColor = ctx.fillStyle; // 设置阴影颜色与子弹颜色相同
            ctx.shadowBlur = 10; // 设置阴影模糊半径
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0; // 重置阴影模糊半径，避免影响其他绘制
        });
    }
}



// 更新Boss子弹位置和碰撞检测
function updateBossBullets() {
    if (boss) {
        boss.bullets = boss.bullets.filter(bullet => {
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            bullet.rotation += 5; // 缓慢旋转

            if (bullet.x < 0 || bullet.x > screenWidth || bullet.y < 0 || bullet.y > screenHeight) return false;

            if (checkBulletCollision(bullet, player)) {
                player.health -= 10;
                explosions.push(createExplosion(bullet.x, bullet.y)); // 添加爆炸特效
                return false;
            }
            return true;
        });
    }
}

let lastShotTime = 0;

let lastEnemySpawnTime = 0;
const enemySpawnInterval = 1000; // 敌人生成间隔时间（毫秒）

// 创建爆炸特效
function createExplosion(x, y) {
    return { x, y, duration: 20, emoji: '💥' }; // 持续30帧
}

// 更新爆炸特效
function updateExplosions() {
    explosions = explosions.filter(explosion => {
        explosion.duration--;
        return explosion.duration > 0;
    });
}

// 绘制爆炸特效
function drawExplosions() {
    explosions.forEach(explosion => {
        ctx.font = '30px Arial';
        ctx.fillText(explosion.emoji, explosion.x, explosion.y);
    });
}


function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 检查玩家生命值
    if (player.health <= 0) {
        ctx.font = '40px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', screenWidth / 2, screenHeight / 2);
        ctx.fillText(`得分: ${score}`, screenWidth / 2, screenHeight / 2 + 40);
        return; // 停止游戏循环
    }

    // 绘制背景并更新背景位置
    drawBackground();
    updateBackground();
    updateTransition(); // 更新渐变状态

    // 绘制其他游戏元素
    drawPlayer();
    if (player.shooting && Date.now() - lastShotTime > shotInterval) {
        WEAPON_STAGES[currentStage].forEach(port => {
            player.bullets.push(createPlayerBullet(port.x, port.y, port.angle));
        });
        lastShotTime = Date.now();
    }
    drawBullets();
    updatePlayerBullets();

    if (!boss && !stopSpawningEnemies && Date.now() - lastEnemySpawnTime > enemySpawnInterval) {
        enemies.push(createEnemy());
        lastEnemySpawnTime = Date.now();
    }

    enemies.forEach(enemy => drawEnemy(enemy));
    updateEnemies();
    drawEnemyBullets();
    updateEnemyBullets();

    if (!boss && enemies.length === 0 && stopSpawningEnemies && !boss?.isEscaping) {
        spawnBoss();
    }

    drawBoss();
    updateBoss();
    drawBossBullets();
    updateBossBullets();

    if (boss && boss.isEscaping) {
        transitionBackground(); // 每次boss撤退时都调用背景变换函数
        if (!escorts) {
            escorts = spawnEscortFleet();
        }
        updateEscorts();
        drawEscorts();
        drawEscortBullets();
        updateEscortBullets();

        if (boss.y < -boss.height) {
            score += 1200; // 让Boss撤离得分
            boss = null; // 完全撤离战场
            enemiesKilled = 0; // 重置击杀计数器
            stopSpawningEnemies = false; // 恢复普通AI的敌人生成
            escorts = null; // 重置护卫舰队
        }
    }

    updateExplosions();
    drawExplosions();

    // 随机生成道具
    if (Math.random() < 0.01) {
        spawnRandomItem();
    }

    // 更新和绘制道具
    updateItems();
    drawItems();

    // 更新和绘制防护盾
    updateShield();
    drawShield();

    // 更新和绘制友方战机
    updateAllyShips();
    drawAllyShips();

    drawScoreboard(); // 绘制计分板
    drawHealthBar(); // 绘制生命值条，确保在最上层

    requestAnimationFrame(gameLoop);
}




    // 鼠标移动事件处理
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        player.x = Math.max(player.width / 2, Math.min(screenWidth - player.width / 2, (event.clientX - rect.left) * scaleX));
        player.y = Math.max(player.height / 2, Math.min(screenHeight - player.height / 2, (event.clientY - rect.top) * scaleY));
    });
    
    // 鼠标按下事件处理
    canvas.addEventListener('mousedown', () => {
        player.shooting = true;
    });
    
    // 鼠标松开事件处理
    canvas.addEventListener('mouseup', () => {
        player.shooting = false;
    });
    
    gameLoop();
    


