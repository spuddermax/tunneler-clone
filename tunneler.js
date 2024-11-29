const startBtn = document.getElementById('start-btn');
const instructionsBtn = document.getElementById('instructions-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const instructionsModal = document.getElementById('instructions-modal');
const gameContainer = document.getElementById('game-container');
const debugStats = document.getElementById('debug-stats');
const tank1HealthEl = document.getElementById('tank1-health');
const tank2HealthEl = document.getElementById('tank2-health');
const tank1KillsEl = document.getElementById('tank1-kills');
const tank2KillsEl = document.getElementById('tank2-kills');
const gameTally = document.getElementById('game-tally');
const loadingScreen = document.getElementById('loading-screen');
const entryScreen = document.getElementById('entry-screen');
const volumeSlider = document.getElementById('volume-slider');
const playPauseBtn = document.getElementById('play-pause-btn');

let musicPlaylist = [
    'sfx/music/GalacticWhimsyExtv2.2.mp3',
    'sfx/music/BattlefieldJoyExtv2.1.mp3'
];
shuffleArray(musicPlaylist);

let currentTrackIndex = 0;
const backgroundMusic = new Audio(musicPlaylist[currentTrackIndex]);

// Set up playlist functionality
backgroundMusic.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % musicPlaylist.length;
    backgroundMusic.src = musicPlaylist[currentTrackIndex];
    backgroundMusic.play();
});


// Set the background music to loop through the playlist

backgroundMusic.loop = true;

// Set the initial volume of the background music
backgroundMusic.volume = volumeSlider.value;

// Event listener for volume slider
volumeSlider.addEventListener('input', (event) => {
    const volume = event.target.value; // Get the current value of the slider
    backgroundMusic.volume = volume; // Set the background music volume
});

// Event listener for play/pause button
playPauseBtn.onclick = () => {
    if (backgroundMusic.paused) {
        backgroundMusic.play(); // Play the music
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; // Change to pause icon
    } else {
        backgroundMusic.pause(); // Pause the music
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; // Change to play icon
    }
};

// Event listener for when the music starts
backgroundMusic.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; // Change to pause icon when music starts
});

// Event listener for when the music ends
backgroundMusic.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; // Change to play icon when music ends
});

startBtn.onclick = () => {
	loadingScreen.style.display = 'flex';
	welcomeScreen.style.display = 'none';
	gameContainer.style.display = 'block';
	gameTally.style.display = 'block';
	startGame();
	fadeOutMusic();	
};

instructionsBtn.onclick = () => {
	instructionsModal.style.display = 'block';
};

closeModalBtn.onclick = () => {
	instructionsModal.style.display = 'none';
};

document.getElementById('roll-btn').addEventListener('click', () => {
    entryScreen.style.display = 'none';
    welcomeScreen.style.display = 'block';
    backgroundMusic.play();
});

// Fade out the music to 10% volume
function fadeOutMusic() {
	const fadeDuration = 2000; // Duration of fade-out in milliseconds
	const fadeInterval = 100; // Interval for volume reduction in milliseconds
	const fadeSteps = fadeDuration / fadeInterval; // Number of steps for fading
	let currentStep = 0;
	const targetVolume = 0.05; // Target volume of 10%
	const volumeStep = (1 - targetVolume) / fadeSteps; // Step size to reach target

	const fadeOut = setInterval(() => {
		currentStep++;
		const volume = Math.max(targetVolume, backgroundMusic.volume - volumeStep); // Decrease volume
		backgroundMusic.volume = volume;
		volumeSlider.value = volume; // Update slider value to match music volume

		if (currentStep >= fadeSteps) {
			clearInterval(fadeOut);
			backgroundMusic.volume = targetVolume; // Set final volume to 10%
			volumeSlider.value = targetVolume; // Set slider to final volume
		}
	}, fadeInterval);
}

function startGame() {
	gameContainer.style.display = 'block';

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

	game.config.borderSize = 10; // Set border size
	game.config.borderColor = 0x336699; // Set border color to blue
	game.config.bushWidth = 24; // Set bush width
	game.config.trunkWidth = 10; // Set trunk width
	game.config.tankWidth = 72; // Set tank width
	game.config.bulletWidth = 8; // Set bullet width
	game.config.baseWidth = 400; // Set base width
	game.config.tankDamage = 10; // Set tank damage percentage when hit
	game.config.healthBarHeight = 10; // Set health bar height
	game.config.healthBarOffset = 12; // Set health bar offset
	game.config.healthBarOpacity = 0.75; // Set health bar opacity
	game.config.tankBushDamage = 0.25; // Set tank damage percentage when hitting bush
	game.config.speedDropPercentage = 0.5; // Set speed drop percentage (50%)
	game.config.speedDropDuration = 500; // Set speed drop duration in milliseconds
	game.config.tankForwardSpeed = 150; // Set tank forward speed
	game.config.tankBackwardSpeed = 75; // Set tank backward speed
	game.config.tankTurnSpeed = 0.05; // Set tank turn speed
	game.config.treeWidth = 172; // Set tree width
	game.config.treeHeight = 335; // Set tree height
	game.config.treeTrunkWidth = 10; // Set tree trunk width
	game.config.treeTrunkXoffset = 86; // Set tree trunk x offset
	game.config.treeTrunkYoffset = 86; // Set tree trunk y offset
	game.config.treeDensity = 3; // Set tree density
	game.config.homeBaseRegenRate = 0.125;    // Set home base regeneration rate
	game.config.enemyBaseRegenRate = game.config.homeBaseRegenRate/2;  // Set enemy base regeneration rate

	game.events.on('ready', () => {
		loadingScreen.style.display = 'none';
		gameContainer.style.display = 'block';
		gameTally.style.display = 'block';
	});
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
		this.aiUpdateInterval = 10; // How often to update AI decisions (ms)
		this.aiLastUpdate = 0;
		this.aiState = 'chase'; // States: chase, retreat, attack
		this.aiMinAttackDistance = 300; // Minimum distance to start attacking
		this.aiMaxAttackDistance = 500; // Maximum distance to chase before shooting
		this.aiRetreatHealth = 30; // Health threshold to retreat
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
		this.load.image('trunk', 'images/trunk.png');
		this.load.image('base', 'images/base.png');
		this.load.image('explosion', 'images/explosion2.gif');
		this.load.image('world_floor_1', 'images/world_floor_1.png');
		this.load.image('world_floor_2', 'images/world_floor_2.png');
		this.load.image('tree1', 'images/tree_1.png');
		this.load.image('tree2', 'images/tree_2.png');
		this.load.image('tree3', 'images/tree_3.png');
		this.load.image('tree4', 'images/tree_4.png');
		this.load.image('tree5', 'images/tree_5.png');
		this.load.image('tree6', 'images/tree_6.png');
		this.load.image('tree7', 'images/tree_7.png');
		
		// Load sounds
		this.load.audio('fireSound', ['sfx/pew.mp3']);
		this.load.audio('tankHit', ['sfx/impact.mp3']);
		this.load.audio('bushHit', ['sfx/impact_light.mp3']);
		this.load.audio('vroom', ['sfx/vroom.mp3']);
		this.load.audio('vroom2', ['sfx/vroom_lower.mp3']);
	}

	create() {
		// Set the tiled background based on the world size
		const worldWidth = this.game.config.width;
		const worldHeight = this.game.config.height;

		this.fireSound = this.sound.add('fireSound', { loop: false, volume: 0.5 });
		this.tankHit = this.sound.add('tankHit', { loop: false, volume: 0.5 });
		this.bushHit = this.sound.add('bushHit', { loop: false, volume: 0.5 });
		this.vroom = this.sound.add('vroom', { loop: true, volume: 0.75 });
		this.vroom2 = this.sound.add('vroom2', { loop: true, volume: 0.75 });
		// Add a border to the game
		const borderTop = this.add.rectangle(worldWidth/2, this.game.config.borderSize / 2, worldWidth, this.game.config.borderSize, this.game.config.borderColor, 1);
		const borderBottom = this.add.rectangle(worldWidth/2, worldHeight - this.game.config.borderSize/2, worldWidth, this.game.config.borderSize, this.game.config.borderColor, 1);
		const borderLeft = this.add.rectangle(this.game.config.borderSize/2, worldHeight/2, this.game.config.borderSize, worldHeight, this.game.config.borderColor, 1);
		const borderRight = this.add.rectangle(worldWidth - this.game.config.borderSize/2, worldHeight/2, this.game.config.borderSize, worldHeight, this.game.config.borderColor, 1);

		borderTop.setDepth(100);
		borderBottom.setDepth(100);
		borderLeft.setDepth(100);
		borderRight.setDepth(100);

		// Pick a random tiled background
		const tiledBackground = Phaser.Math.Between(1, 2);
		this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, `world_floor_${tiledBackground}`); // Center the tiled background

		// Create bases first
		this.createBases();

		// Create bushes
		this.createBushes();

		// Create trees
		this.createTrees();

		// Create tanks
		this.createTanks();

		// Set up controls
		this.tank1Keys = this.input.keyboard.addKeys('W,A,S,D,V');
		this.tank2Keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,ENTER');
		this.toggleKeys = this.input.keyboard.addKeys('I');

		// Toggle debug-stats
		this.toggleKeys.I.on('down', () => {
			debugStats.style.display = debugStats.style.display === 'block' ? 'none' : 'block';
			this.toggleTrunkVisibility(); // Toggle trunk visibility based on debug state
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
		this.healthBar1 = new HealthBar(this, { x: this.tank1.x, y: this.tank1.y, health: this.tank1Health });
		this.healthBar2 = new HealthBar(this, { x: this.tank2.x, y: this.tank2.y, health: this.tank2Health });

		// Initial health bar setup
		this.updateHealthBars();

		this.game.events.emit('ready');
	}

	toggleTrunkVisibility() {
		const isDebugVisible = debugStats.style.display === 'block';
		this.trunkGroup.children.iterate((trunk) => {
			trunk.setVisible(isDebugVisible); // Set visibility based on debug state
		});
	}

	createBushes() {
		// Create a group for bush blocks
		this.bushGroup = this.physics.add.staticGroup();

		const bushWidth = this.sys.game.config.bushWidth; // Access bush width from config
		const baseWidth = this.sys.game.config.baseWidth; // Access base width from config

		// Calculate the total number of bush blocks based on the game area
		const totalBushBlocks = Math.floor((this.game.config.width * this.game.config.height) / (bushWidth * bushWidth));
		//const reducedBushBlocks = Math.floor(totalBushBlocks * 0.95); // Reduce by 5%

		const positions = new Set(); // To track occupied positions
		let attempts = 0; // Counter for attempts to add bushes
		const maxAttempts = 2000; // Maximum attempts to prevent infinite loop

		// Initialize total bushes count
		this.totalBushesCount = 0; // New variable to track total bushes

		// Fill the world with bush blocks using the configured width
		while (attempts < totalBushBlocks) {
			attempts++; // Increment the attempt counter
			if(attempts > maxAttempts) {
				break;
			}
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

					// Increment the total bushes count and update the display
					this.totalBushesCount++;
					document.getElementById('total-bushes').innerText = this.totalBushesCount; // Update the total bushes display
				}
			}
		}
	}

	// Create trees similar to bushes but with a different image

	createTrees() {
		// Create a group for tree blocks
		this.treeGroup = this.physics.add.staticGroup();

		// Create a group for tree trunks
		this.trunkGroup = this.physics.add.staticGroup();
		const trunkWidth = this.sys.game.config.trunkWidth;

		const treeWidth = this.sys.game.config.treeWidth; // Access tree width from config
		const treeHeight = this.sys.game.config.treeHeight; // Access tree height from config
		const baseWidth = this.sys.game.config.baseWidth; // Access base width from config

		// Calculate the total number of tree blocks based on the game area
		const totalTreeBlocks = Math.floor((this.game.config.width * this.game.config.height) / (treeWidth * treeHeight)) * this.game.config.treeDensity;
		console.log('totalTreeBlocks: ', totalTreeBlocks);

		const positions = new Set(); // To track occupied positions
		let attempts = 0; // Counter for attempts to add trees
		const maxAttempts = 60; // Maximum attempts to prevent infinite loop
		// Initialize total trees count
		this.totalTreesCount = 0; // New variable to track total trees

		// Fill the world with tree blocks using the configured width
		while (attempts < totalTreeBlocks) {
			attempts++; // Increment the attempt counter
			if(attempts > maxAttempts) {
				break;
			}
			const x = Phaser.Math.Between(0, this.game.config.width - treeWidth);
			const y = Phaser.Math.Between(0, this.game.config.height - treeHeight);

			// Check if the tree block is within the boundaries of the bases
			const isInBase1 = (x >= this.base1.x - baseWidth / 2 && x <= this.base1.x + baseWidth / 2) &&
				(y >= this.base1.y - baseWidth / 2 && y <= this.base1.y + baseWidth / 2);
			const isInBase2 = (x >= this.base2.x - baseWidth / 2 && x <= this.base2.x + baseWidth / 2) &&
				(y >= this.base2.y - baseWidth / 2 && y <= this.base2.y + baseWidth / 2);

			// Only create tree if it's not within the base boundaries and not overlapping
			if (!isInBase1 && !isInBase2) {
				const positionKey = `${Math.floor(x / treeWidth)},${Math.floor(y / treeHeight)}`; // Create a unique key for the position
				if (!positions.has(positionKey)) {
					positions.add(positionKey); // Add the position to the set
					const treeImage = `tree${Phaser.Math.Between(1, 7)}`; // Randomly select tree image
					const tree = this.treeGroup.create(x, y, treeImage);
					tree.setDisplaySize(treeWidth, treeHeight); // Set the size of the tree block
					// Set tree so it's always above everything else except the health bars
					tree.setDepth(3);

					// Define trunk position relative to the tree's location
					const trunkX = x; // 86 pixels from the left of the tree
					const trunkY = y + 86; // 86 pixels from the bottom of the tree

					// Create a green trunk block as a static collider
					const trunk = this.trunkGroup.create(trunkX, trunkY, 'trunk'); // Use trunk sprite as base
					trunk.setTint(0x00ff00); // Tint the sprite green
					trunk.setDisplaySize(trunkWidth, trunkWidth); // Set the size of the trunk collider
					trunk.setDepth(4); // Set the depth of the trunk to be above the tree
					trunk.setVisible(false); // Make the trunk invisible initially

					// Increment the total trees count and update the display
					this.totalTreesCount++;
					document.getElementById('total-trees').innerText = this.totalTreesCount; // Update the total trees display
				}
			}
		}
	}

	createBases() {
		const baseWidth = this.sys.game.config.baseWidth; // Access base width from config

		// Set base 1 at a random position within the left 25% of the screen.
		let randomX1 = Math.abs(Phaser.Math.Between(0, this.game.config.width / 4 - baseWidth));
		let randomY1 = Math.abs(Phaser.Math.Between(0, this.game.config.height - baseWidth));
		randomX1 = randomX1 <= baseWidth / 2 ? baseWidth / 2 : randomX1;
		randomY1 = randomY1 <= baseWidth / 2 ? baseWidth / 2 : randomY1;
		randomY1 = randomY1 >= this.game.config.height - baseWidth / 2 ? this.game.config.height - baseWidth / 2 : randomY1;
		this.base1 = this.physics.add.staticSprite(randomX1, randomY1, 'base');
		document.getElementById('base1-position').innerText = `(${randomX1}, ${randomY1})`;

		// Set base 2 at a random position within the right 25% of the screen
		let randomX2 = Math.abs(Phaser.Math.Between(this.game.config.width * 3 / 4, this.game.config.width - baseWidth));
		let randomY2 = Math.abs(Phaser.Math.Between(baseWidth / 2, this.game.config.height - baseWidth));
		randomX2 = randomX2 >= this.game.config.width - baseWidth / 2 ? this.game.config.width - baseWidth / 2 : randomX2;
		randomY2 = randomY2 <= baseWidth / 2 ? baseWidth / 2 : randomY2;
		randomY2 = randomY2 >= this.game.config.height - baseWidth ? this.game.config.height - baseWidth : randomY2;
		this.base2 = this.physics.add.staticSprite(randomX2, randomY2, 'base');
		document.getElementById('base2-position').innerText = `(${randomX2}, ${randomY2})`;

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
		// Rotate tank1 left 90 degrees in radians
		this.tank1.rotation = -90 * (Math.PI / 180);
		this.tank1.setDepth(1);
		console.log(this.tank1);

		// Create tank2 in the center of its base
		this.tank2 = this.physics.add.sprite(this.base2.x, this.base2.y, 'tank2'); // Centered vertically
		this.tank2.setCollideWorldBounds(true);
		this.tank2.setDisplaySize(tankWidth, tankWidth); // Set the size of tank2
		// Rotate tank2 left 90 degrees in radians
		this.tank2.rotation = -90 * (Math.PI / 180);
		this.tank2.setDepth(1);
		console.log(this.tank2);
		// Add collision with bush
		this.physics.add.collider(this.tank1, this.bushGroup, this.clearbush, null, this);
		this.physics.add.collider(this.tank2, this.bushGroup, this.clearbush, null, this);

		// Add collision between tanks and trunks
		this.physics.add.collider(this.tank1, this.trunkGroup);
		this.physics.add.collider(this.tank2, this.trunkGroup);

		// Add collision between tanks
		this.physics.add.collider(this.tank1, this.tank2);
	}

	clearbush(tank, bush) {
		bush.destroy();
		this.bushHit.play();

		this.totalBushesCount--;
		document.getElementById('total-bushes').innerText = this.totalBushesCount; // Update the total bushes display

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

	update(time) {
		// Update tank1 movement
		// W key should always move forward, S key should always move backward
		// A key should always turn left, D key should always turn right
		// V key should always shoot

		this.tank1.setVelocity(0);
		let tank1Moving = false;
		let tank2Moving = false;

		if (this.tank1Keys.W.isDown) {
				// tank1 should always move forward
				this.tank1.setVelocityX( Math.cos(this.tank1.rotation) * this.sys.game.config.tankForwardSpeed );
				this.tank1.setVelocityY( Math.sin(this.tank1.rotation) * this.sys.game.config.tankForwardSpeed );
				tank1Moving = true;
		} else if (this.tank1Keys.S.isDown) {
				this.tank1.setVelocityX( Math.cos(this.tank1.rotation) * -this.sys.game.config.tankBackwardSpeed );
				this.tank1.setVelocityY( Math.sin(this.tank1.rotation) * -this.sys.game.config.tankBackwardSpeed );
				tank1Moving = true;
		}
		if (this.tank1Keys.A.isDown) {
				this.tank1.rotation -= this.sys.game.config.tankTurnSpeed;
		} else if (this.tank1Keys.D.isDown) {
			this.tank1.rotation += this.sys.game.config.tankTurnSpeed;
		}

		// Update tank1 position display
		const tank1PositionEl = document.getElementById('tank1-position');
		tank1PositionEl.innerText = `(${Math.round(this.tank1.x)}, ${Math.round(this.tank1.y)})`;

		this.healthBar1.x = this.tank1.x;
		this.healthBar1.y = this.tank1.y;
		document.getElementById('tank1-health-bar-position').innerText = `(${Math.floor(this.healthBar1.x)}, ${Math.floor(this.healthBar1.y)})`;

		// If the tank is at the top edge of the screen, move its health bar to the bottom edge of the tank
		if (this.tank1.y < (this.tank1.height / 2) + this.sys.game.config.healthBarOffset + this.sys.game.config.healthBarHeight ) {
			this.healthBar1.offset = (this.sys.game.config.healthBarOffset * -1) - this.tank1.height - this.sys.game.config.healthBarHeight;
		} else {
			this.healthBar1.offset = this.sys.game.config.healthBarOffset;
		}


		// Tank2 movement
		// up and down keys should always move forward and backward
		// left and right keys should always turn left and right
		// enter key should always shoot

		this.tank2.setVelocity(0);

		if (this.tank2Keys.UP.isDown) {
				// tank2 should always move forward
				this.tank2.setVelocityX( Math.cos(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed );
				this.tank2.setVelocityY( Math.sin(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed );
				tank2Moving = true;
		} else if (this.tank2Keys.DOWN.isDown) {
				this.tank2.setVelocityX( Math.cos(this.tank2.rotation) * -this.sys.game.config.tankBackwardSpeed );
				this.tank2.setVelocityY( Math.sin(this.tank2.rotation) * -this.sys.game.config.tankBackwardSpeed );
				tank2Moving = true;
		}
		if (this.tank2Keys.LEFT.isDown) {
				this.tank2.rotation -= this.sys.game.config.tankTurnSpeed;
		} else if (this.tank2Keys.RIGHT.isDown) {
			this.tank2.rotation += this.sys.game.config.tankTurnSpeed;
		}

		if (tank1Moving) {
			this.vroom.play();
		} else {
			this.vroom.stop();
		}
		if (tank2Moving) {
			this.vroom2.play();
		} else {
			this.vroom2.stop();
		}

		// Update tank2 position display
		const tank2PositionEl = document.getElementById('tank2-position');
		tank2PositionEl.innerText = `(${Math.round(this.tank2.x)}, ${Math.round(this.tank2.y)})`;

		this.healthBar2.x = this.tank2.x;
		this.healthBar2.y = this.tank2.y;
		document.getElementById('tank2-health-bar-position').innerText = `(${Math.floor(this.healthBar2.x)}, ${Math.floor(this.healthBar2.y)})`;

		// If the tank is at the top edge of the screen, move its health bar to the bottom edge of the tank
		if (this.tank2.y < (this.tank2.height / 2) + this.sys.game.config.healthBarOffset + this.sys.game.config.healthBarHeight ) {
			this.healthBar2.offset = (this.sys.game.config.healthBarOffset * -1) - this.tank2.height - this.sys.game.config.healthBarHeight;
		} else {
			this.healthBar2.offset = this.sys.game.config.healthBarOffset;
		}

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

		// Handle AI updates on interval
		if (time > this.aiLastUpdate + this.aiUpdateInterval) {
			this.updateAI();
			this.aiLastUpdate = time;
		}
	}

	shootBullet(tank, tankName) {
		const bulletWidth = this.sys.game.config.bulletWidth; // Access bullet width from config
		const bullet = this.physics.add.sprite(tank.x, tank.y, 'bullet');
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

		// Play firing sound
		this.fireSound.play();

		// Add overlap detection for hitting tanks
		if (tankName === 'tank1') {
				this.physics.add.overlap(bullet, this.tank2, this.hitTank2, null, this);
		} else {
				this.physics.add.overlap(bullet, this.tank1, this.hitTank1, null, this);
		}

		// Bullet collides with bush
		this.physics.add.collider(bullet, this.bushGroup, (bullet, bush) => {
				// Play bushHit sound
				this.bushHit.play();
				bush.destroy(); // Also destroy the original bush block
				bullet.destroy(); // Destroy the bullet
		});

		// Bullet collides with trunk
		this.physics.add.collider(bullet, this.trunkGroup, (bullet, trunk) => {
			// Play bushHit sound
			this.bushHit.play();
			bullet.destroy();
		});
	}

	hitTank1(bullet, tank) {
		bullet.destroy();
		this.tankHit.play();
		this.tank1Health -= this.sys.game.config.tankDamage; // Use the tankDamage from config
		tank1HealthEl.innerText = `${this.tank1Health}%`;
		this.checkTank1Health();

		// Play impact sound
		this.tankHit.play();
	}

	hitTank2(bullet, tank) {
		bullet.destroy();
		this.tankHit.play();
		this.tank2Health -= this.sys.game.config.tankDamage; // Use the tankDamage from config
		tank2HealthEl.innerText = `${this.tank2Health}%`;
		this.checkTank2Health();
	}

	checkTank1Health() {
		if (this.tank1Health <= 0) {
				if (this.tank1) { // Check if tank1 exists
						this.explodeTank(this.tank1);
						this.tank2Kills += 1;
						tank2KillsEl.innerText = `${this.tank2Kills}`;
						this.resetTank(this.tank1, 'tank1');
						//this.resetTank(this.tank2, 'tank2');
						this.tank1Health = 100;
						tank1HealthEl.innerText = `${this.tank1Health}%`;
						this.checkWinCondition('tank2');

						// Fade out the tank1 camera then fade back in
						this.camera1.fadeOut(500, 0, 0, 0);
						this.camera1.fadeIn(5000, 0, 0, 0);
				}
		}
	}

	checkTank2Health() {
		if (this.tank2Health <= 0) {
				if (this.tank2) { // Check if tank2 exists
						this.explodeTank(this.tank2);
						this.tank1Kills += 1;
						tank1KillsEl.innerText = `${this.tank1Kills}`;
						this.resetTank(this.tank2, 'tank2');
						//this.resetTank(this.tank1, 'tank1');
						this.tank2Health = 100;
						tank2HealthEl.innerText = `${this.tank2Health}%`;
						this.checkWinCondition('tank1');

						// Fade out the tank2 camera then fade back in
						this.camera2.fadeOut(500, 0, 0, 0);
						this.camera2.fadeIn(5000, 0, 0, 0);
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
			if (bush && Phaser.Math.Distance.Between(tank.x, tank.y, bush.x, bush.y) < 200) {
				bush.destroy(); // Ensure bush exists before trying to destroy it
			}
		});

		tank.disableBody(true, true);
	}

	// Reset tank to the center of its base with rotation set to 0
	resetTank(tank, tankName) {
		if (tankName === 'tank1') {
			tank.enableBody(true, 50, 300, true, true);
			tank.x = this.base1.x;
			tank.y = this.base1.y;
			tank.rotation = -90 * (Math.PI / 180);
		} else {
			tank.enableBody(true, 750, 300, true, true);
			tank.x = this.base2.x;
			tank.y = this.base2.y;
			tank.rotation = -90 * (Math.PI / 180);
		}
	}

	regenerateHealth() {
		const baseWidth = this.sys.game.config.baseWidth;

		// Tank1 in own base
		if (Phaser.Geom.Intersects.RectangleToRectangle(this.tank1.getBounds(), this.base1.getBounds())) {
			if (this.tank1Health < 100) {
				if (this.tank1.getBounds().x >= this.base1.x - baseWidth / 2 &&
					this.tank1.getBounds().x + this.tank1.getBounds().width <= this.base1.x + baseWidth / 2 &&
					this.tank1.getBounds().y >= this.base1.y - baseWidth / 2 &&
					this.tank1.getBounds().y + this.tank1.getBounds().height <= this.base1.y + baseWidth / 2) {
					this.tank1Health += this.sys.game.config.homeBaseRegenRate;
					tank1HealthEl.innerText = `${Math.floor(this.tank1Health)}%`;
				}
			}
		}
		// Tank1 in enemy base
		else if (Phaser.Geom.Intersects.RectangleToRectangle(this.tank1.getBounds(), this.base2.getBounds())) {
			if (this.tank1Health < 100) {
				if (this.tank1.getBounds().x >= this.base2.x - baseWidth / 2 &&
					this.tank1.getBounds().x + this.tank1.getBounds().width <= this.base2.x + baseWidth / 2 &&
					this.tank1.getBounds().y >= this.base2.y - baseWidth / 2 &&
					this.tank1.getBounds().y + this.tank1.getBounds().height <= this.base2.y + baseWidth / 2) {
					this.tank1Health += this.sys.game.config.enemyBaseRegenRate;
					tank1HealthEl.innerText = `${Math.floor(this.tank1Health)}%`;
				}
			}
		}

		// Tank2 in own base
		if (Phaser.Geom.Intersects.RectangleToRectangle(this.tank2.getBounds(), this.base2.getBounds())) {
			if (this.tank2Health < 100) {
				if (this.tank2.getBounds().x >= this.base2.x - baseWidth / 2 &&
					this.tank2.getBounds().x + this.tank2.getBounds().width <= this.base2.x + baseWidth / 2 &&
					this.tank2.getBounds().y >= this.base2.y - baseWidth / 2 &&
					this.tank2.getBounds().y + this.tank2.getBounds().height <= this.base2.y + baseWidth / 2) {
					this.tank2Health += this.sys.game.config.homeBaseRegenRate;
					tank2HealthEl.innerText = `${Math.floor(this.tank2Health)}%`;
				}
			}
		}
		// Tank2 in enemy base
		else if (Phaser.Geom.Intersects.RectangleToRectangle(this.tank2.getBounds(), this.base1.getBounds())) {
			if (this.tank2Health < 100) {
				if (this.tank2.getBounds().x >= this.base1.x - baseWidth / 2 &&
					this.tank2.getBounds().x + this.tank2.getBounds().width <= this.base1.x + baseWidth / 2 &&
					this.tank2.getBounds().y >= this.base1.y - baseWidth / 2 &&
					this.tank2.getBounds().y + this.tank2.getBounds().height <= this.base1.y + baseWidth / 2) {
					this.tank2Health += this.sys.game.config.enemyBaseRegenRate;
					tank2HealthEl.innerText = `${Math.floor(this.tank2Health)}%`;
				}
			}
		}
	}

	checkWinCondition(tankName) {
		if (this.tank1Kills >= 5) {
			// Stop all sounds playing
			this.vroom.stop();
			this.vroom2.stop();
			this.fireSound.stop();
			this.tankHit.stop();
			this.bushHit.stop();
			
			// Use a setTimeout to ensure all sounds have stopped before showing the alert
			setTimeout(() => {
				alert('Tank 1 Wins!');
				this.scene.restart();
				this.resetScores();
			}, 100);
		} else if (this.tank2Kills >= 5) {
			this.vroom.stop();
			this.vroom2.stop();
			this.fireSound.stop();
			this.tankHit.stop();
			this.bushHit.stop();
			
			// Use a setTimeout to ensure all sounds have stopped before showing the alert
			setTimeout(() => {
				alert('Tank 2 Wins!');
				this.scene.restart();
				this.resetScores();
			}, 100);
		}
	}

	resetScores() {
		this.tank1Kills = 0;
		this.tank2Kills = 0;
		// update the kills display
		tank1KillsEl.innerText = `${this.tank1Kills}`;
		tank2KillsEl.innerText = `${this.tank2Kills}`;
	}

	updateHealthBars() {
		// Set health bar health to tank health
		this.healthBar1.health = this.tank1Health / 100;
		this.healthBar2.health = this.tank2Health / 100;
		this.healthBar1.update();
		this.healthBar2.update();
	}

	shutdown() {
		window.removeEventListener('resize', this.updateCameraSizes);
		// ... any other cleanup code ...
	}

	updateAI() {
		// Skip if tank2 doesn't exist
		if (!this.tank2) return;

		// Calculate distance to player
		const distanceToPlayer = Phaser.Math.Distance.Between(
			this.tank1.x, this.tank1.y,
			this.tank2.x, this.tank2.y
		);

		// Determine AI state
		if (this.tank2Health <= this.aiRetreatHealth) {
			this.aiState = 'retreat';
		} else if (distanceToPlayer <= this.aiMaxAttackDistance && 
				   distanceToPlayer >= this.aiMinAttackDistance) {
			this.aiState = 'attack';
		} else if (this.shouldAvoidTrunks()) { // Check if it should avoid trunks
			this.aiState = 'avoid';
		} else {
			this.aiState = 'chase';
		}

		// Execute AI behavior based on state
		switch (this.aiState) {
			case 'retreat':
				console.log('retreat');
				this.aiRetreat();
				break;
			case 'attack':
				console.log('attack');
				this.aiAttack();
				break;
			case 'chase':
				console.log('chase');
				this.aiChase();
				break;
			case 'avoid':
				console.log('avoid');
				this.aiAvoidTrunks();
				break;
		}
	}

	shouldAvoidTrunks() {
		// Check if there are any trunks nearby
		let shouldAvoid = false;
		this.trunkGroup.children.iterate((trunk) => {
			const distanceToTrunk = Phaser.Math.Distance.Between(this.tank2.x, this.tank2.y, trunk.x, trunk.y);
			if (distanceToTrunk < 100) { // Adjust this distance as needed
				shouldAvoid = true;
			}
		});
		return shouldAvoid;
	}

	aiRetreat() {
		// Constants
		const avoidDistance = 100; // Distance to start avoiding trunks
		const avoidStrength = 200; // Strength of avoidance force
		const stopDistance = 50; // Distance to base to stop moving
	
		// Calculate distance to base
		const distanceToBase = Phaser.Math.Distance.Between(
			this.tank2.x, this.tank2.y,
			this.base2.x, this.base2.y
		);
	
		if (distanceToBase > stopDistance) {
			// Initialize cumulative avoidance vector
			let avoidanceX = 0;
			let avoidanceY = 0;
	
			// Iterate over all trunks
			this.trunkGroup.children.iterate((trunk) => {
				const distanceToTrunk = Phaser.Math.Distance.Between(
					this.tank2.x, this.tank2.y,
					trunk.x, trunk.y
				);
	
				if (distanceToTrunk < avoidDistance && distanceToTrunk > 0) { // Avoid division by zero
					// Calculate vector pointing away from the trunk, inversely proportional to the distance squared
					const dx = this.tank2.x - trunk.x;
					const dy = this.tank2.y - trunk.y;
					const distanceSquared = distanceToTrunk * distanceToTrunk;
	
					// Accumulate the avoidance vector
					avoidanceX += (dx / distanceSquared);
					avoidanceY += (dy / distanceSquared);
				}
			});
	
			// Determine the tank's desired movement towards the base
			const targetVector = new Phaser.Math.Vector2(
				this.base2.x - this.tank2.x,
				this.base2.y - this.tank2.y
			).normalize();
	
			// Apply avoidance if necessary
			let movementVector = targetVector.clone(); // Start with the target vector
	
			if (avoidanceX !== 0 || avoidanceY !== 0) {
				// Normalize the avoidance vector
				const avoidanceVector = new Phaser.Math.Vector2(avoidanceX, avoidanceY).normalize();
	
				// Scale the avoidance vector
				avoidanceVector.scale(avoidStrength);
	
				// Combine the target direction and avoidance vector
				movementVector.add(avoidanceVector).normalize();
			}
	
			// Adjust the tank's rotation to face the movement direction smoothly
			const desiredAngle = movementVector.angle();
			let currentRotation = this.tank2.rotation;
	
			// Custom function to wrap angles between -π and π
			function wrapAngle(angle) {
				return Math.atan2(Math.sin(angle), Math.cos(angle));
			}
	
			// Calculate the shortest rotation direction
			let rotationDiff = wrapAngle(desiredAngle - currentRotation);
	
			// Determine turn direction and rotate
			const rotationSpeed = this.sys.game.config.tankTurnSpeed;
			if (rotationDiff > 0.05) {
				this.tank2.rotation += Math.min(rotationSpeed, rotationDiff);
			} else if (rotationDiff < -0.05) {
				this.tank2.rotation -= Math.min(rotationSpeed, -rotationDiff);
			}
	
			// Move the tank forward in the direction it's facing
			this.tank2.setVelocityX(Math.cos(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed);
			this.tank2.setVelocityY(Math.sin(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed);
		} else {
			// Stop moving when close to the base
			this.tank2.setVelocity(0);
		}
	}
	

	aiAttack() {
		// Calculate angle to player
		const angleToPlayer = Phaser.Math.Angle.Between(
			this.tank2.x, this.tank2.y,
			this.tank1.x, this.tank1.y
		);

		this.aiRotateTowards(angleToPlayer);

		// If facing roughly towards player, shoot
		if (Math.abs(this.tank2.rotation - angleToPlayer) < 0.1) {
			if (this.canFireTank2) {
				this.shootBullet(this.tank2, 'tank2');
				this.canFireTank2 = false;
				this.time.delayedCall(this.fireRate, () => {
					this.canFireTank2 = true;
				});
			}
		}
	}

	aiChase() {
		// Calculate angle to player
		const angleToPlayer = Phaser.Math.Angle.Between(
			this.tank2.x, this.tank2.y,
			this.tank1.x, this.tank1.y
		);

		this.aiRotateTowards(angleToPlayer);

		// Move towards player if too far
		const distance = Phaser.Math.Distance.Between(
			this.tank2.x, this.tank2.y,
			this.tank1.x, this.tank1.y
		);

		if (distance > this.aiMaxAttackDistance) {
			this.tank2.setVelocityX(Math.cos(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed);
			this.tank2.setVelocityY(Math.sin(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed);
		} else if (distance < this.aiMinAttackDistance) {
			// Back up if too close
			this.tank2.setVelocityX(Math.cos(this.tank2.rotation) * -this.sys.game.config.tankBackwardSpeed);
			this.tank2.setVelocityY(Math.sin(this.tank2.rotation) * -this.sys.game.config.tankBackwardSpeed);
		}

		// Avoid trees
		this.aiAvoidTrunks();
	}

	aiRotateTowards(targetAngle) {
		// Normalize current rotation to be between -PI and PI
		let currentRotation = this.tank2.rotation;
		while (currentRotation < -Math.PI) currentRotation += 2 * Math.PI;
		while (currentRotation > Math.PI) currentRotation -= 2 * Math.PI;

		// Calculate shortest rotation direction
		let diff = targetAngle - currentRotation;
		while (diff < -Math.PI) diff += 2 * Math.PI;
		while (diff > Math.PI) diff -= 2 * Math.PI;

		// Rotate towards target
		if (diff > 0.1) {
			this.tank2.rotation += this.sys.game.config.tankTurnSpeed;
		} else if (diff < -0.1) {
			this.tank2.rotation -= this.sys.game.config.tankTurnSpeed;
		}
	}

	aiAvoidTrunks() {
		// Initialize cumulative avoidance vector
		let avoidanceX = 0;
		let avoidanceY = 0;
	
		// Constants
		const avoidDistance = 100; // Distance to start avoiding trunks
		const avoidStrength = 200; // Strength of avoidance force
	
		// Iterate over all trunks
		this.trunkGroup.children.iterate((trunk) => {
			const distanceToTrunk = Phaser.Math.Distance.Between(
				this.tank2.x, this.tank2.y,
				trunk.x, trunk.y
			);
	
			if (distanceToTrunk < avoidDistance && distanceToTrunk > 0) { // Avoid division by zero
				// Calculate vector pointing away from the trunk, inversely proportional to the distance squared
				const dx = this.tank2.x - trunk.x;
				const dy = this.tank2.y - trunk.y;
				const distanceSquared = distanceToTrunk * distanceToTrunk;
	
				// Accumulate the avoidance vector
				avoidanceX += (dx / distanceSquared);
				avoidanceY += (dy / distanceSquared);
			}
		});
	
		// Determine the tank's desired movement towards the player
		const targetVector = new Phaser.Math.Vector2(
			this.tank1.x - this.tank2.x,
			this.tank1.y - this.tank2.y
		).normalize();
	
		// Apply avoidance if necessary
		let movementVector = targetVector.clone(); // Start with the target vector
	
		if (avoidanceX !== 0 || avoidanceY !== 0) {
			// Normalize the avoidance vector
			const avoidanceVector = new Phaser.Math.Vector2(avoidanceX, avoidanceY).normalize();
	
			// Scale the avoidance vector
			avoidanceVector.scale(avoidStrength);
	
			// Combine the target direction and avoidance vector
			movementVector.add(avoidanceVector).normalize();
		}
	
		// Adjust the tank's rotation to face the movement direction smoothly
		const desiredAngle = movementVector.angle();
		let currentRotation = this.tank2.rotation;
	
		// Custom function to wrap angles between -π and π
		function wrapAngle(angle) {
			return Math.atan2(Math.sin(angle), Math.cos(angle));
		}
	
		// Calculate the shortest rotation direction
		let rotationDiff = wrapAngle(desiredAngle - currentRotation);
	
		// Determine turn direction and rotate
		const rotationSpeed = this.sys.game.config.tankTurnSpeed;
		if (rotationDiff > 0.05) {
			this.tank2.rotation += Math.min(rotationSpeed, rotationDiff);
		} else if (rotationDiff < -0.05) {
			this.tank2.rotation -= Math.min(rotationSpeed, -rotationDiff);
		}
	
		// Move the tank forward in the direction it's facing
		this.tank2.setVelocityX(Math.cos(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed);
		this.tank2.setVelocityY(Math.sin(this.tank2.rotation) * this.sys.game.config.tankForwardSpeed);
	}
	

}

class HealthBar {
	constructor(scene, tank) {
		this.scene = scene;
		this.tank = tank;
		this.graphics = this.scene.add.graphics();
		this.height = this.scene.sys.game.config.healthBarHeight;
		this.offset = this.scene.sys.game.config.healthBarOffset;
		this.health = tank.health / 100;
		this.opacity = this.scene.sys.game.config.healthBarOpacity;
		this.x = this.tank.x;
		this.y = this.tank.y;
	}

	update() {
		this.graphics.clear();

		// Calculate color for health bar
		const color = Phaser.Display.Color.Interpolate.ColorWithColor(
			{ r: 255, g: 0, b: 0 }, // Red
			{ r: 0, g: 255, b: 0 }, // Green
			100, // Total steps
			Math.floor(this.health * 100) // Current step
		);

		// Set health bar depth to 4 so it's above the trees
		this.graphics.setDepth(4);

		// Draw health bar
		this.graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), this.opacity);
		this.graphics.fillRect(
			this.x - this.scene.sys.game.config.tankWidth / 2,
			this.y - this.scene.sys.game.config.tankWidth / 2 - this.height - this.offset,
			this.scene.sys.game.config.tankWidth * this.health,
			this.height
		);

		// Draw border for health bar
		this.graphics.lineStyle(1, 0x00ff00, 1); // Green border
		this.graphics.strokeRect(
			this.x - this.scene.sys.game.config.tankWidth / 2,
			this.y - this.scene.sys.game.config.tankWidth / 2 - this.height - this.offset,
			this.scene.sys.game.config.tankWidth,
			this.height
		);
	}
}

class Tree {
	constructor(scene, x, y, imageKey) {
		this.scene = scene;
		this.x = x;
		this.y = y;
		this.width = this.scene.sys.game.config.treeWidth;
		this.height = this.scene.sys.game.config.treeHeight;
		this.image = this.scene.add.image(this.x, this.y, imageKey);
		this.image.setDisplaySize(this.width, this.height);
	}
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}