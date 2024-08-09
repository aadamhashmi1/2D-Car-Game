document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const carImage = new Image();
    carImage.src = 'car.png';
    const jumpSound = document.getElementById('jumpSound');
    const coinSound = document.getElementById('coinSound');
    const startBallsSound = document.getElementById('startBallsSound');
    const coinImage = new Image();
    coinImage.src = 'coin.png';
    class Car {
        constructor(x, y, width, height, image) {
            this.x = x;
            this.y = y;
            this.baseY = y; 
            this.width = width;
            this.height = height;
            this.image = image;
            this.speed = 0; 
            this.maxSpeed = 3000; 
            this.acceleration = 700; 
            this.brakingDeceleration = 170; // Braking speed
            this.normalDeceleration = 70; // Normal deceleration
            this.reverseSpeed = -1500; 
            this.direction = 0; 
            this.angularVelocity = 240; // Degrees per second
            this.isAccelerating = false;
            this.isBraking = false;
            this.isReversing = false;
            this.isJumping = false;
            this.jumpHeight = 30; 
            this.jumpDuration = 500; 
            this.jumpStartTime = null;
            this.shadowSize = 1;
        }
    
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.direction * Math.PI / 180);
            ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        }
    
        moveForward(deltaTime) {
            const radians = this.direction * Math.PI / 180;
            const velocity = this.speed * 1000 / 3600; 
            this.x += velocity * Math.cos(radians) * deltaTime;
            this.y += velocity * Math.sin(radians) * deltaTime;
            const halfWidth = this.width / 2;
            const halfHeight = this.height / 2;
            if (this.x - halfWidth < 0) this.x = halfWidth;
            if (this.x + halfWidth > canvas.width) this.x = canvas.width - halfWidth;
            if (this.y - halfHeight < 0) this.y = halfHeight;
            if (this.y + halfHeight > canvas.height) this.y = canvas.height - halfHeight;
        }
    
        updateSpeed() {
            if (this.isAccelerating) {
                this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
            }
    
            if (this.isBraking) {
                if (this.speed > 0) {
                    this.speed = Math.max(this.speed - this.brakingDeceleration, 0);
                } else if (this.speed < 0) {
                    this.speed = Math.min(this.speed + this.brakingDeceleration, 0);
                }
            } else if (this.isReversing) {
                if (this.speed >= 0) {
                    this.speed = Math.max(this.speed - this.normalDeceleration, this.reverseSpeed);
                } else {
                    this.speed = Math.min(this.speed + this.normalDeceleration, this.reverseSpeed);
                }
            } else {
                if (this.speed > 0) {
                    this.speed = Math.max(this.speed - this.normalDeceleration, 0);
                } else if (this.speed < 0) {
                    this.speed = Math.min(this.speed + this.normalDeceleration, 0);
                }
            }
        }
    
        updateDirection(deltaTime) {
            if (this.isTurningLeft) {
                this.direction -= this.angularVelocity * deltaTime;
            }
            if (this.isTurningRight) {
                this.direction += this.angularVelocity * deltaTime;
            }
            this.direction %= 360; // Ensure direction stays within 0-359 degrees
        }
    
        jump(timestamp) {
            if (!this.isJumping) {
                this.isJumping = true;
                this.jumpStartTime = timestamp;
                jumpSound.play(); 
            }
        }
    
        updateJump(timestamp) {
            if (this.isJumping) {
                const elapsed = timestamp - this.jumpStartTime;
                const halfDuration = this.jumpDuration / 2;
                if (elapsed < this.jumpDuration) {
                    if (elapsed < halfDuration) {
                        this.y -= this.jumpHeight * (elapsed / halfDuration);
                    } else {
                        this.y += this.jumpHeight * ((elapsed - halfDuration) / halfDuration);
                    }
                } else {
                    this.isJumping = false;
                    this.y = this.baseY;
                }
            }
        }
    
        turnLeft() {
            this.isTurningLeft = true;
        }
    
        turnRight() {
            this.isTurningRight = true;
        }
    
        stopTurning() {
            this.isTurningLeft = false;
            this.isTurningRight = false;
        }
    }
    
    
    
    class Coin {
        constructor(x, y, width, height, image) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.image = image;
        }
        draw(ctx) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    class Ball {
        constructor(x, y, radius, dx, dy) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = getRandomColor();
            this.dx = dx; // Velocity in x direction
            this.dy = dy; // Velocity in y direction
            this.originalRadius = radius;
            this.hoverRadius = radius * 2.5; // Enlarge by 50% on hover
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
        update() {
            this.x += this.dx;
            this.y += this.dy;
            if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
                this.dx = -this.dx;
            }
            if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
                this.dy = -this.dy;
            }
        }
        setRadius(newRadius) {
            this.radius = newRadius;
        }
    }
    const balls = [];
    const numBalls = 10;
    const ballRadius = 10;
    for (let i = 0; i < numBalls; i++) {
        balls.push(new Ball(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            ballRadius,
            (Math.random() - 0.5) * 50, 
            (Math.random() - 0.5) * 20 
        ));
    }
    const car = new Car(400, 300, 60, 30, carImage);
    const coins = [];
    let score = 0;
    function generateCoin() {
        const x = Math.random() * (canvas.width - 40) + 20;
        const y = Math.random() * (canvas.height - 40) + 20;
        coins.push(new Coin(x, y, 20, 20, coinImage));
    }
    function checkCollision(car, coin) {
        const distX = Math.abs(car.x - coin.x - coin.width / 2);
        const distY = Math.abs(car.y - coin.y - coin.height / 2);
        if (distX <= (coin.width / 2 + car.width / 2) && distY <= (coin.height / 2 + car.height / 2)) {
            return true;
        }
        return false;
    }
    let lastTime = 0;
    let fps = 0;
    let ballsStarted = false;
    function gameLoop(timestamp) {
        const deltaTime = (timestamp - lastTime) / 1000; 
        lastTime = timestamp;
        fps = Math.round(1 / deltaTime);
        car.updateSpeed();
        car.updateDirection(deltaTime); // Update direction for smooth turning
        car.updateJump();
        car.moveForward(deltaTime);
        if (ballsStarted) {
            balls.forEach(ball => {
                ball.update();
            });
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        car.draw(ctx);
        coins.forEach((coin, index) => {
            if (checkCollision(car, coin)) {
                coins.splice(index, 1);
                score += 1;
                coinSound.play();
                generateCoin();
            } else {
                coin.draw(ctx);
            }
        });
        balls.forEach(ball => {
            ball.draw(ctx);
        });
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(`FPS: ${fps}`, 10, 30);
        ctx.font = '20px Arial';
        ctx.fillText(`Speed: ${Math.round(car.speed)} km/h`, canvas.width - 150, 30);
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, 10, 60);
        ctx.restore();
    
        requestAnimationFrame(gameLoop);
    }
    
    carImage.onload = function() {
        for (let i = 0; i < 5; i++) {
            generateCoin();
        }
        gameLoop(0);
    };
    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case 'ArrowUp':
                car.isAccelerating = true;
                break;
            case 'ArrowDown':
                if (car.speed === 0) {
                    car.isReversing = true;
                } else {
                    car.isBraking = true;
                }
                break;
            case 'ArrowLeft':
                car.turnLeft(30);
                break;
            case 'ArrowRight':
                car.turnRight(30);
                break;
            case ' ':
                car.jump();
                break;
            case 'w':
            case 'W':
                ballsStarted = true;
                startBallsSound.play();
                break;
        }
    });
    
    document.addEventListener('keyup', function(event) {
        switch(event.key) {
            case 'ArrowUp':
                car.isAccelerating = false;
                break;
            case 'ArrowDown':
                car.isBraking = false;
                car.isReversing = false;
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                car.stopTurning();
                break;
        }
    });
    
    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        balls.forEach(ball => {
            const dx = mouseX - ball.x;
            const dy = mouseY - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < ball.originalRadius) {
                ball.setRadius(ball.hoverRadius);
            } else {
                ball.setRadius(ball.originalRadius);
            }
        });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        car.draw(ctx);
        coins.forEach(coin => {
            coin.draw(ctx);
        });
        balls.forEach(ball => {
            ball.draw(ctx);
        });
    });
});
