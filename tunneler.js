const startBtn = document.getElementById('start-btn');
const instructionsBtn = document.getElementById('instructions-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const instructionsModal = document.getElementById('instructions-modal');
const gameContainer = document.getElementById('game-container');
const debugStats = document.getElementById('debug-stats');
const tank1HealthEl = document.getElementById('tank1-health');
const tank2HealthEl = document.getElementById('tank2-health');

startBtn.onclick = () => {
	welcomeScreen.style.display = 'none';
	gameContainer.style.display = 'block';
	debugStats.style.display = 'block';
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
		width: 3840,
		height: 1080,
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
	game.config.bushWidth = 24; // Set bush width in config
	game.config.tankWidth = 72; // Set tank width in config
	game.config.bulletWidth = 8; // Set bullet width in config
	game.config.baseWidth = 400; // Set base width in config (adjust as needed)
	game.config.tankDamage = 10; // Set tank damage percentage when hit
	game.config.healthBarHeight = 10; // Set health bar height in config
	game.config.healthBarOffset = 12; // Set health bar offset in config
	game.config.healthBarOpacity = 0.75; // Set health bar opacity in config
	game.config.tankBushDamage = 0.25; // Set tank damage percentage when hitting bush
	game.config.speedDropPercentage = 0.5; // Set speed drop percentage (50%)
	game.config.speedDropDuration = 500; // Set speed drop duration in milliseconds
	game.config.tankForwardSpeed = 100; // Set tank forward speed in config
	game.config.tankBackwardSpeed = 50; // Set tank backward speed in config
	game.config.tankTurnSpeed = 0.05; // Set tank turn speed in config
}

class BootScene extends Phaser.Scene {
	constructor() {
		super({ key: 'BootScene' });
		this.canFireTank1 = true; // Flag for tank1 firing
		this.canFireTank2 = true; // Flag for tank2 firing
		this.fireRate = 350; // Fire rate in milliseconds
		this.bushSlowdownFactor = 0.5; // Factor to slow down tanks when hitting bush
		this.camera1 = null; // Camera for tank1
		this.camera2 = null; // Camera for tank2
		this.base1 = null; // Base for tank1
		this.base2 = null; // Base for tank2
		this.healthBar1 = null; // Health bar for tank1
		this.healthBar2 = null; // Health bar for tank2
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
		// Set the tiled background based on the world size
		const worldWidth = this.game.config.width;
		const worldHeight = this.game.config.height;
		this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'world_floor'); // Center the tiled background

		// Create bases first
		this.createBases();

		// Create the game world
		this.createWorld();

		// Create tanks
		this.createTanks();

		// Set up controls
		// use space key for tank1 to shoot
		// use enter key for tank2 to shoot
		// use WASD for tank1 and arrow keys for tank2
		// use I key to toggle debug-stats
		this.tank1Keys = this.input.keyboard.addKeys('W,A,S,D,V');
		this.tank2Keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,ENTER');
		this.toggleKeys = this.input.keyboard.addKeys('I');
		// Toggle debug-stats
		this.toggleKeys.I.on('down', () => {
			debugStats.style.display = debugStats.style.display === 'block' ? 'none' : 'block';
		});

		// Initialize variables
		this.tank1Health = 100;
		this.tank2Health = 100;
		this.tank1Kills = 0;
		this.tank2Kills = 0;

		console.log(this.cameras);
		// Create cameras for each tank's viewport based on the browser's viewport size
		this.camera1 = this.cameras.add(0, 0, window.innerWidth / 2, window.innerHeight); // Left viewport
		this.camera2 = this.cameras.add(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight); // Right viewport

		// Set the bounds for the cameras
		this.camera1.setBounds(0, 0, this.game.config.width, this.game.config.height);
		this.camera2.setBounds(0, 0, this.game.config.width, this.game.config.height);
		
		// Follow the tanks with their respective cameras
		this.camera1.startFollow(this.tank1, true, 0.1, 0.1); // Smooth follow for tank1
		this.camera2.startFollow(this.tank2, true, 0.1, 0.1); // Smooth follow for tank2

		// Ensure the cameras can scroll vertically
		this.camera1.setScroll(0, 0); // Reset scroll position
		this.camera2.setScroll(0, 0); // Reset scroll position

		// Function to update camera sizes
		const updateCameraSizes = () => {
			this.camera1.setSize(window.innerWidth / 2, window.innerHeight);
			this.camera2.setPosition(window.innerWidth / 2, 0);
			this.camera2.setSize(window.innerWidth / 2, window.innerHeight);
		};

		// Initial camera setup
		updateCameraSizes();

		// Add resize event listener
		window.addEventListener('resize', updateCameraSizes);

		// Create health bars
		this.healthBar1 = this.add.graphics();
		this.healthBar2 = this.add.graphics();

		// Initial health bar setup
		this.updateHealthBars();
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
		let attempts = 0; // Counter for attempts to add bushes
		const maxAttempts = 1000; // Maximum attempts to prevent infinite loop

		// Fill the world with bush blocks using the configured width
		while (positions.size < reducedbushBlocks && attempts < maxAttempts) {
				attempts++; // Increment the attempt counter
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

		// Check if we exceeded max attempts
		if (attempts >= maxAttempts) {
				console.warn('Max attempts reached while trying to place bushes. Some bushes may not be placed.');
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
		// Set base 1 at a random position within the left 25% of the screen. Use absolute values to avoid overlap with the edge of the world.
		const randomX1 = Phaser.Math.Between(0, this.game.config.width / 4 - baseWidth);
		const randomY1 = Phaser.Math.Between(0, this.game.config.height - baseWidth);
		this.base1 = this.physics.add.staticSprite(randomX1, randomY1, 'base');
	
	// Set base 2 at a random position within the right 25% of the screen, but not overlapping the edge of the world
		const randomX2 = Phaser.Math.Between(this.game.config.width * 3 / 4, this.game.config.width - baseWidth);
		const randomY2 = Phaser.Math.Between(0, this.game.config.height - baseWidth);
		this.base2 = this.physics.add.staticSprite(randomX2, randomY2, 'base');

		// Set the display size of the bases
		this.base1.setDisplaySize(baseWidth, baseWidth); // Set the size of base1
		this.base2.setDisplaySize(baseWidth, baseWidth); // Set the size of base2
	}

	createTanks() {
		const tankWidth = this.sys.game.config.tankWidth; // Access tank width from config

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
		
		// Apply damage to the tank
		if (tank === this.tank1) {
				this.tank1Health -= this.sys.game.config.tankBushDamage; // Reduce tank1 health by a value set in config
				tank1HealthEl.innerText = `${this.tank1Health}%`; // Update health display
				this.checkTank1Health(); // Check if tank1 is destroyed
		} else if (tank === this.tank2) {
				this.tank2Health -= this.sys.game.config.tankBushDamage; // Reduce tank2 health by a value set in config
				tank2HealthEl.innerText = `${this.tank2Health}%`; // Update health display
				this.checkTank2Health(); // Check if tank2 is destroyed
		}

	}

	update() {
		// Update tank1 movement
		// W key should always move forward, S key should always move backward
		// A key should always turn left, D key should always turn right
		// V key should always shoot

		this.tank1.setVelocity(0);

		if (this.tank1Keys.W.isDown) {
				// tank1 should always move forward
				this.tank1.setVelocityX( Math.cos(this.tank1.rotation) * this.sys.game.config.tankForwardSpeed );
				this.tank1.setVelocityY( Math.sin(this.tank1.rotation) * this.sys.game.config.tankForwardSpeed );
		} else if (this.tank1Keys.S.isDown) {
				this.tank1.setVelocityX( Math.cos(this.tank1.rotation) * -this.sys.game.config.tankBackwardSpeed );
				this.tank1.setVelocityY( Math.sin(this.tank1.rotation) * -this.sys.game.config.tankBackwardSpeed );
		}
		if (this.tank1Keys.A.isDown) {
				this.tank1.rotation -= this.sys.game.config.tankTurnSpeed;
		} else if (this.tank1Keys.D.isDown) {
			this.tank1.rotation += this.sys.game.config.tankTurnSpeed;
		}

		// Update tank1 position display
		const tank1PositionEl = document.getElementById('tank1-position');
		tank1PositionEl.innerText = `(${Math.round(this.tank1.x)}, ${Math.round(this.tank1.y)})`;

		// Tank2 movement
		// up and down keys should always move forward and backward
		// left and right keys should always turn left and right
		// enter key should always shoot

		this.tank2.setVelocity(0);

		if (this.tank2Keys.UP.isDown) {
				// tank2 should always move forward
				this.tank2.setVelocityX( Math.cos(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed );
				this.tank2.setVelocityY( Math.sin(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed );
		} else if (this.tank2Keys.DOWN.isDown) {
				this.tank2.setVelocityX( Math.cos(this.tank2.rotation) * -this.sys.game.config.tankBackwardSpeed );
				this.tank2.setVelocityY( Math.sin(this.tank2.rotation) * -this.sys.game.config.tankBackwardSpeed );
		}
		if (this.tank2Keys.LEFT.isDown) {
				this.tank2.rotation -= this.sys.game.config.tankTurnSpeed;
		} else if (this.tank2Keys.RIGHT.isDown) {
			this.tank2.rotation += this.sys.game.config.tankTurnSpeed;
		}

		// Update tank2 position display
		const tank2PositionEl = document.getElementById('tank2-position');
		tank2PositionEl.innerText = `(${Math.round(this.tank2.x)}, ${Math.round(this.tank2.y)})`;

		// Tank1 shooting
		if (this.tank1Keys.V.isDown && this.canFireTank1) {
				this.shootBullet(this.tank1, 'tank1');
				this.canFireTank1 = false; // Prevent firing until cooldown
				this.time.delayedCall(this.fireRate, () => {
						this.canFireTank1 = true; // Allow firing again after cooldown
				});
		}

		// Tank2 shooting
		if (this.tank2Keys.ENTER.isDown && this.canFireTank2) {
				this.shootBullet(this.tank2, 'tank2');
				this.canFireTank2 = false; // Prevent firing until cooldown
				this.time.delayedCall(this.fireRate, () => {
						this.canFireTank2 = true; // Allow firing again after cooldown
				});
		}

		// Health regeneration in base
		this.regenerateHealth();

		// Update health bars in each frame
		this.updateHealthBars();
	}

	shootBullet(tank, tankName) {
		const bulletWidth = this.sys.game.config.bulletWidth; // Access bullet width from config
		const bullet = this.physics.add.sprite(tank.x, tank.y, 'bullet');
		//bullet.setCollideWorldBounds(true);
		//bullet.body.onWorldBounds = true; // Enable world bounds for the bullet
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

		// Set the bullet's rotation to match the tank's rotation
		bullet.rotation = tank.rotation;

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
		//bullet.body.world.on('worldbounds', () => {
		//    bullet.destroy(); // Only destroy the bullet that goes out of bounds
		//});
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
						this.resetTank(this.tank2, 'tank2');
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
						this.resetTank(this.tank1, 'tank1');
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

	// Reset tank to the center of its base
	resetTank(tank, tankName) {
		if (tankName === 'tank1') {
			tank.enableBody(true, 50, 300, true, true);
			tank.x = this.base1.x;
			tank.y = this.base1.y;
		} else {
			tank.enableBody(true, 750, 300, true, true);
			tank.x = this.base2.x;
			tank.y = this.base2.y;
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

	updateHealthBars() {
		const healthBarHeight = this.sys.game.config.healthBarHeight; // Use health bar height from config
		const healthBarOffset = this.sys.game.config.healthBarOffset; // Use health bar offset from config
		const healthBarOpacity = this.sys.game.config.healthBarOpacity; // Use health bar opacity from config
		const tank1HealthPercentage = this.tank1Health / 100;
		const tank2HealthPercentage = this.tank2Health / 100;

		// Clear previous health bars
		this.healthBar1.clear();
		this.healthBar2.clear();

		// Calculate color for tank1 health bar
		const tank1Color = Phaser.Display.Color.Interpolate.ColorWithColor(
				{ r: 255, g: 0, b: 0 }, // Red
				{ r: 0, g: 255, b: 0 }, // Green
				100, // Total steps
				Math.floor(tank1HealthPercentage * 100) // Current step
		);

		// Draw tank1 health bar at a predetermined location above the tank
		this.healthBar1.fillStyle(Phaser.Display.Color.GetColor(tank1Color.r, tank1Color.g, tank1Color.b), healthBarOpacity);
		this.healthBar1.fillRect(
				this.tank1.x - this.sys.game.config.tankWidth / 2,
				this.tank1.y - this.sys.game.config.tankWidth / 2 - healthBarHeight - healthBarOffset, // Use healthBarOffset for positioning
				this.sys.game.config.tankWidth * tank1HealthPercentage,
				healthBarHeight
		);

		// Draw border for tank1 health bar
		this.healthBar1.lineStyle(1, 0x00ff00, 1); // Green border
		this.healthBar1.strokeRect(
				this.tank1.x - this.sys.game.config.tankWidth / 2,
				this.tank1.y - this.sys.game.config.tankWidth / 2 - healthBarHeight - healthBarOffset, // Use healthBarOffset for positioning
				this.sys.game.config.tankWidth,
				healthBarHeight
		);

		// Calculate color for tank2 health bar
		const tank2Color = Phaser.Display.Color.Interpolate.ColorWithColor(
				{ r: 255, g: 0, b: 0 }, // Red
				{ r: 0, g: 255, b: 0 }, // Green
				100, // Total steps
				Math.floor(tank2HealthPercentage * 100) // Current step
		);

		// Draw tank2 health bar
		this.healthBar2.fillStyle(Phaser.Display.Color.GetColor(tank2Color.r, tank2Color.g, tank2Color.b), healthBarOpacity);
		this.healthBar2.fillRect(
				this.tank2.x - this.sys.game.config.tankWidth / 2,
				this.tank2.y - this.sys.game.config.tankWidth / 2 - healthBarHeight - healthBarOffset, // Use healthBarOffset for positioning
				this.sys.game.config.tankWidth * tank2HealthPercentage,
				healthBarHeight
		);

		// Draw border for tank2 health bar
		this.healthBar2.lineStyle(1, 0x00ff00, 1); // Green border
		this.healthBar2.strokeRect(
				this.tank2.x - this.sys.game.config.tankWidth / 2,
				this.tank2.y - this.sys.game.config.tankWidth / 2 - healthBarHeight - healthBarOffset, // Use healthBarOffset for positioning
				this.sys.game.config.tankWidth,
				healthBarHeight
		);
	}

	shutdown() {
		window.removeEventListener('resize', this.updateCameraSizes);
		// ... any other cleanup code ...
	}
}
