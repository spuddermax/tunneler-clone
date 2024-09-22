const startBtn = document.getElementById('start-btn');
const instructionsBtn = document.getElementById('instructions-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const instructionsModal = document.getElementById('instructions-modal');
const gameContainer = document.getElementById('game-container');
const healthBars = document.getElementById('health-bars');
const tank1HealthEl = document.getElementById('tank1-health');
const tank2HealthEl = document.getElementById('tank2-health');

startBtn.onclick = () => {
  welcomeScreen.style.display = 'none';
  gameContainer.style.display = 'block';
  healthBars.style.display = 'block';
  startGame();
};

instructionsBtn.onclick = () => {
  instructionsModal.style.display = 'block';
};

closeModalBtn.onclick = () => {
  instructionsModal.style.display = 'none';
};

function startGame() {
  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 2400,
    height: 1200,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    scene: [BootScene],
  };

  // Create the game instance
  const game = new Phaser.Game(config);

  // Set the bushWidth, tankWidth, bulletWidth, and baseWidth in the game config after the game instance is created
  game.config.bushWidth = 12; // Set bush width in config
  game.config.tankWidth = 32; // Set tank width in config
  game.config.bulletWidth = 4; // Set bullet width in config
  game.config.baseWidth = 100; // Set base width in config (adjust as needed)
  game.config.tankDamage = 10; // Set tank damage percentage when hit
}

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
    this.canFireTank1 = true; // Flag for tank1 firing
    this.canFireTank2 = true; // Flag for tank2 firing
    this.fireRate = 400; // Fire rate in milliseconds
    this.bushSlowdownFactor = 0.5; // Factor to slow down tanks when hitting bush
    this.camera1 = null; // Camera for tank1
    this.camera2 = null; // Camera for tank2
	this.base1 = null; // Base for tank1
	this.base2 = null; // Base for tank2
  }

  preload() {
    // Load assets here
	this.load.image('bush1', 'images/bush1.png');
	this.load.image('bush2', 'images/bush2.png');
	this.load.image('bush3', 'images/bush3.png');
	this.load.image('bush4', 'images/bush4.png');
    this.load.image('tank1', 'images/tank_grey.png');
    this.load.image('tank2', 'images/tank_red.png');
    this.load.image('bullet', 'images/bullet.png');
    this.load.image('base', 'images/base.png');
    this.load.image('explosion', 'images/explosion2.gif');
	this.load.image('world_floor', 'images/world_floor.png');
  }

  create() {
    // Set the tiled background
    this.add.tileSprite(832, 326, 2400, 1200, 'world_floor'); // Center the tiled background

    // Create bases first
    this.createBases();

    // Create the game world
    this.createWorld();

    // Create tanks
    this.createTanks();

    // Set up controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysWASD = this.input.keyboard.addKeys('W,A,S,D');
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Initialize variables
    this.tank1Health = 100;
    this.tank2Health = 100;
    this.tank1Kills = 0;
    this.tank2Kills = 0;

	console.log(this.cameras);
    // Create cameras for each tank's viewport. This should be base on the visible view of the browser.
	this.camera1 = this.cameras.add(0, 0, this.cameras.scene.scale.parentSize._width / 2, this.cameras.scene.scale.parentSize._height); // Left viewport
    this.camera2 = this.cameras.add(this.cameras.scene.scale.parentSize._width / 2, 0, this.cameras.scene.scale.parentSize._width / 2, this.cameras.scene.scale.parentSize._height); // Right viewport

    // Set the bounds for the cameras
    this.camera1.setBounds(0, 0, this.game.config.width, this.game.config.height);
    this.camera2.setBounds(0, 0, this.game.config.width, this.game.config.height);
    
    // Follow the tanks with their respective cameras
    this.camera1.startFollow(this.tank1, true, 0.1, 0.1); // Smooth follow for tank1
    this.camera2.startFollow(this.tank2, true, 0.1, 0.1); // Smooth follow for tank2

    // Center the cameras on their respective tanks
    //this.camera1.setScroll(0, 0); // Reset scroll for camera1
    //this.camera2.setScroll(0, 0); // Reset scroll for camera2
  }

  createWorld() {
    // Create a group for bush blocks
    this.bushGroup = this.physics.add.staticGroup();

    const bushWidth = this.sys.game.config.bushWidth; // Access bush width from config
    const baseWidth = this.sys.game.config.baseWidth; // Access base width from config

    // Calculate the total number of bush blocks based on the game area
    const totalbushBlocks = Math.floor((this.game.config.width * this.game.config.height) / (bushWidth * bushWidth));
    const reducedbushBlocks = Math.floor(totalbushBlocks * 0.95); // Reduce by 5%

    const positions = new Set(); // To track occupied positions

    // Fill the world with bush blocks using the configured width
    while (positions.size < reducedbushBlocks) {
        const x = Phaser.Math.Between(0, this.game.config.width - bushWidth);
        const y = Phaser.Math.Between(0, this.game.config.height - bushWidth);

        // Check if the bush block is within the boundaries of the bases
        const isInBase1 = (x >= this.base1.x - baseWidth / 2 && x <= this.base1.x + baseWidth / 2) &&
                          (y >= this.base1.y - baseWidth / 2 && y <= this.base1.y + baseWidth / 2);
        const isInBase2 = (x >= this.base2.x - baseWidth / 2 && x <= this.base2.x + baseWidth / 2) &&
                          (y >= this.base2.y - baseWidth / 2 && y <= this.base2.y + baseWidth / 2);

        // Only create bush if it's not within the base boundaries and not overlapping
        if (!isInBase1 && !isInBase2) {
            const positionKey = `${Math.floor(x / bushWidth)},${Math.floor(y / bushWidth)}`; // Create a unique key for the position
            if (!positions.has(positionKey)) {
                positions.add(positionKey); // Add the position to the set
                const bushImage = `bush${Phaser.Math.Between(1, 4)}`; // Randomly select bush image
                const bush = this.bushGroup.create(x, y, bushImage);
                bush.setDisplaySize(bushWidth, bushWidth); // Set the size of the bush block
                bush.rotation = Phaser.Math.Between(0, 3) * (Math.PI / 2); // Random rotation at 90-degree intervals
            }
        }
    }

    // Remove bush blocks directly under the bases
    this.bushGroup.children.iterate((bush) => {
      if (bush.x === this.base1.x && bush.y === this.base1.y) {
        bush.destroy();
      }
      if (bush.x === this.base2.x && bush.y === this.base2.y) {
        bush.destroy();
      }
    });
  }

  createBases() {
    const baseWidth = this.sys.game.config.baseWidth; // Access base width from config

    // Create bases at fixed positions within the specified areas
	// Set base 1 at a random position within the left 25% of the screen
	const randomX1 = Phaser.Math.Between(0, this.game.config.width / 4);
	const randomY1 = Phaser.Math.Between(0, this.game.config.height);
    this.base1 = this.physics.add.staticSprite(randomX1, randomY1, 'base');
	
	// Set base 2 at a random position within the right 25% of the screen
	const randomX2 = Phaser.Math.Between(this.game.config.width * 3 / 4, this.game.config.width);
	const randomY2 = Phaser.Math.Between(0, this.game.config.height);
    this.base2 = this.physics.add.staticSprite(randomX2, randomY2, 'base');

    // Set the display size of the bases
    this.base1.setDisplaySize(baseWidth, baseWidth); // Set the size of base1
    this.base2.setDisplaySize(baseWidth, baseWidth); // Set the size of base2
  }

  createTanks() {
    const tankWidth = this.sys.game.config.tankWidth; // Access tank width from config
    const halfViewportWidth = this.game.config.width / 4; // Half of the left viewport width

    // Create tank1 in the center of its base
    this.tank1 = this.physics.add.sprite(this.base1.x, this.base1.y, 'tank1'); // Centered vertically
    this.tank1.setCollideWorldBounds(true);
    this.tank1.setDisplaySize(tankWidth, tankWidth); // Set the size of tank1
    this.tank1.rotation = Math.PI / 2; // Rotate tank1 to face up
    this.tank1.setDepth(1);

    // Create tank2 in the center of its base
    this.tank2 = this.physics.add.sprite(this.base2.x, this.base2.y, 'tank2'); // Centered vertically
    this.tank2.setCollideWorldBounds(true);
    this.tank2.setDisplaySize(tankWidth, tankWidth); // Set the size of tank2
    this.tank2.rotation = Math.PI / 2; // Rotate tank2 to face up
    this.tank2.setDepth(1);

    // Add collision with bush
    this.physics.add.collider(this.tank1, this.bushGroup, this.clearbush, null, this);
    this.physics.add.collider(this.tank2, this.bushGroup, this.clearbush, null, this);

    // Add collision between tanks
    this.physics.add.collider(this.tank1, this.tank2);
  }

  clearbush(tank, bush) {
    bush.destroy();
    // Apply slowdown effect to the tank
    tank.setVelocity(tank.body.velocity.x * this.bushSlowdownFactor, tank.body.velocity.y * this.bushSlowdownFactor);
  }

  update() {
    // Update tank1 movement
    this.tank1.setVelocity(0);
    if (this.keysWASD.W.isDown) {
        this.tank1.setVelocityY(-100);
    } else if (this.keysWASD.S.isDown) {
        this.tank1.setVelocityY(100);
    }
    if (this.keysWASD.A.isDown) {
        this.tank1.setVelocityX(-100);
    } else if (this.keysWASD.D.isDown) {
        this.tank1.setVelocityX(100);
    }

    // Update tank1 rotation based on velocity
    if (this.tank1.body.velocity.x !== 0 || this.tank1.body.velocity.y !== 0) {
        this.tank1.rotation = Math.atan2(this.tank1.body.velocity.y, this.tank1.body.velocity.x);
    }

    // Tank2 movement
    this.tank2.setVelocity(0);
    if (this.cursors.up.isDown) {
        this.tank2.setVelocityY(-100);
    } else if (this.cursors.down.isDown) {
        this.tank2.setVelocityY(100);
    }
    if (this.cursors.left.isDown) {
        this.tank2.setVelocityX(-100);
    } else if (this.cursors.right.isDown) {
        this.tank2.setVelocityX(100);
    }

    // Update tank2 rotation based on velocity
    if (this.tank2.body.velocity.x !== 0 || this.tank2.body.velocity.y !== 0) {
        this.tank2.rotation = Math.atan2(this.tank2.body.velocity.y, this.tank2.body.velocity.x);
    }

    // Tank1 shooting
    if (this.spaceBar.isDown && this.canFireTank1) {
        this.shootBullet(this.tank1, 'tank1');
        this.canFireTank1 = false; // Prevent firing until cooldown
        this.time.delayedCall(this.fireRate, () => {
            this.canFireTank1 = true; // Allow firing again after cooldown
        });
    }

    // Tank2 shooting
    if (this.enterKey.isDown && this.canFireTank2) {
        this.shootBullet(this.tank2, 'tank2');
        this.canFireTank2 = false; // Prevent firing until cooldown
        this.time.delayedCall(this.fireRate, () => {
            this.canFireTank2 = true; // Allow firing again after cooldown
        });
    }

    // Health regeneration in base
    this.regenerateHealth();
  }

  shootBullet(tank, tankName) {
    const bulletWidth = this.sys.game.config.bulletWidth; // Access bullet width from config
    const bullet = this.physics.add.sprite(tank.x, tank.y, 'bullet');
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.setDisplaySize(bulletWidth, bulletWidth); // Set the size of the bullet

    // Set a circular hitbox for the bullet
    bullet.setCircle(bulletWidth / 2); // Use half the width for the radius

    // Set the depth of the bullet to be below the tanks
    bullet.setDepth(0); // Set bullet depth to 0

    // Calculate bullet velocity based on tank rotation
    const bulletSpeed = 300; // Set bullet speed
    bullet.setVelocity(
        Math.cos(tank.rotation) * bulletSpeed,
        Math.sin(tank.rotation) * bulletSpeed
    );

    // Add overlap detection for hitting tanks
    if (tankName === 'tank1') {
        this.physics.add.overlap(bullet, this.tank2, this.hitTank2, null, this);
    } else {
        this.physics.add.overlap(bullet, this.tank1, this.hitTank1, null, this);
    }

    // Bullet collides with bush
    this.physics.add.collider(bullet, this.bushGroup, (bullet, bush) => {
        const impactX = bush.x;
        const impactY = bush.y;
        const range = Phaser.Math.Between(1, 3); // Random range between 2 and 4 blocks

        // Remove bush in a starburst pattern
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                // Check if the distance from the impact point is within the range
                if (Math.abs(dx) + Math.abs(dy) <= range) {
                    const targetX = impactX + dx * this.sys.game.config.bushWidth;
                    const targetY = impactY + dy * this.sys.game.config.bushWidth;

                    // Find the bush block at the target position
                    const targetbush = this.bushGroup.getChildren().find(d => d.x === targetX && d.y === targetY);
                    if (targetbush) {
                        targetbush.destroy(); // Remove the bush block
                    }
                }
            }
        }

        bush.destroy(); // Also destroy the original bush block
        bullet.destroy(); // Destroy the bullet
    });

    // Destroy bullet after it goes out of bounds
    bullet.body.world.on('worldbounds', () => {
        bullet.destroy();
    });
  }

  hitTank1(bullet, tank) {
    bullet.destroy();
    this.tank1Health -= this.sys.game.config.tankDamage; // Use the tankDamage from config
    tank1HealthEl.innerText = `${this.tank1Health}%`;
    this.checkTank1Health();
  }

  hitTank2(bullet, tank) {
    bullet.destroy();
    this.tank2Health -= this.sys.game.config.tankDamage; // Use the tankDamage from config
    tank2HealthEl.innerText = `${this.tank2Health}%`;
    this.checkTank2Health();
  }

  checkTank1Health() {
    if (this.tank1Health <= 0) {
        if (this.tank1) { // Check if tank1 exists
            this.explodeTank(this.tank1);
            this.tank2Kills += 1;
            this.resetTank(this.tank1, 'tank1');
            this.tank1Health = 100;
            tank1HealthEl.innerText = `${this.tank1Health}%`;
            this.checkWinCondition('tank2');
        }
    }
  }

  checkTank2Health() {
    if (this.tank2Health <= 0) {
        if (this.tank2) { // Check if tank2 exists
            this.explodeTank(this.tank2);
            this.tank1Kills += 1;
            this.resetTank(this.tank2, 'tank2');
            this.tank2Health = 100;
            tank2HealthEl.innerText = `${this.tank2Health}%`;
            this.checkWinCondition('tank1');
        }
    }
  }

  explodeTank(tank) {
    // Create the explosion at the tank's position
    const explosion = this.add.sprite(tank.x, tank.y, 'explosion');
    explosion.setScale(2);
    
    // Delay before destroying the explosion to allow the animation to play
    this.time.delayedCall(1000, () => { // Adjust the delay as needed
        explosion.destroy();
    });

    // Clear surrounding bush
    this.bushGroup.children.iterate((bush) => {
      if (bush && Phaser.Math.Distance.Between(tank.x, tank.y, bush.x, bush.y) < 100) {
        bush.destroy(); // Ensure bush exists before trying to destroy it
      }
    });

    tank.disableBody(true, true);
  }

  resetTank(tank, tankName) {
    if (tankName === 'tank1') {
      tank.enableBody(true, 50, 300, true, true);
    } else {
      tank.enableBody(true, 750, 300, true, true);
    }
  }

  regenerateHealth() {
    const baseWidth = this.sys.game.config.baseWidth; // Access base width from config

    // Tank1 in own base
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.tank1.getBounds(), this.base1.getBounds())) {
        if (this.tank1Health < 100) {
            // Check if tank1 is fully within the base
            if (this.tank1.getBounds().x >= this.base1.x - baseWidth / 2 &&
                this.tank1.getBounds().x + this.tank1.getBounds().width <= this.base1.x + baseWidth / 2 &&
                this.tank1.getBounds().y >= this.base1.y - baseWidth / 2 &&
                this.tank1.getBounds().y + this.tank1.getBounds().height <= this.base1.y + baseWidth / 2) {
                this.tank1Health += 0.5; // Faster regeneration
                tank1HealthEl.innerText = `${Math.floor(this.tank1Health)}%`;
            }
        }
    }
    // Tank1 in enemy base
    else if (Phaser.Geom.Intersects.RectangleToRectangle(this.tank1.getBounds(), this.base2.getBounds())) {
        if (this.tank1Health < 100) {
            // Check if tank1 is fully within the enemy base
            if (this.tank1.getBounds().x >= this.base2.x - baseWidth / 2 &&
                this.tank1.getBounds().x + this.tank1.getBounds().width <= this.base2.x + baseWidth / 2 &&
                this.tank1.getBounds().y >= this.base2.y - baseWidth / 2 &&
                this.tank1.getBounds().y + this.tank1.getBounds().height <= this.base2.y + baseWidth / 2) {
                this.tank1Health += 0.125; // Slower regeneration
                tank1HealthEl.innerText = `${Math.floor(this.tank1Health)}%`;
            }
        }
    }

    // Tank2 in own base
    if (Phaser.Geom.Intersects.RectangleToRectangle(this.tank2.getBounds(), this.base2.getBounds())) {
        if (this.tank2Health < 100) {
            // Check if tank2 is fully within the base
            if (this.tank2.getBounds().x >= this.base2.x - baseWidth / 2 &&
                this.tank2.getBounds().x + this.tank2.getBounds().width <= this.base2.x + baseWidth / 2 &&
                this.tank2.getBounds().y >= this.base2.y - baseWidth / 2 &&
                this.tank2.getBounds().y + this.tank2.getBounds().height <= this.base2.y + baseWidth / 2) {
                this.tank2Health += 0.5; // Faster regeneration
                tank2HealthEl.innerText = `${Math.floor(this.tank2Health)}%`;
            }
        }
    }
    // Tank2 in enemy base
    else if (Phaser.Geom.Intersects.RectangleToRectangle(this.tank2.getBounds(), this.base1.getBounds())) {
        if (this.tank2Health < 100) {
            // Check if tank2 is fully within the enemy base
            if (this.tank2.getBounds().x >= this.base1.x - baseWidth / 2 &&
                this.tank2.getBounds().x + this.tank2.getBounds().width <= this.base1.x + baseWidth / 2 &&
                this.tank2.getBounds().y >= this.base1.y - baseWidth / 2 &&
                this.tank2.getBounds().y + this.tank2.getBounds().height <= this.base1.y + baseWidth / 2) {
                this.tank2Health += 0.125; // Slower regeneration
                tank2HealthEl.innerText = `${Math.floor(this.tank2Health)}%`;
            }
        }
    }
  }

  checkWinCondition(tankName) {
    if (this.tank1Kills >= 5) {
      alert('Tank 1 Wins!');
      this.scene.restart();
      this.resetScores();
    } else if (this.tank2Kills >= 5) {
      alert('Tank 2 Wins!');
      this.scene.restart();
      this.resetScores();
    }
  }

  resetScores() {
    this.tank1Kills = 0;
    this.tank2Kills = 0;
  }
}
