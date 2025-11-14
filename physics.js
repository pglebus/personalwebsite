// Matter.js module aliases
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Events = Matter.Events;

// Configuration - CHANGE YOUR NAME HERE
const YOUR_NAME = "PATRICK GLEBUS"; // Change this to your actual name

// Create engine
const engine = Engine.create();
const world = engine.world;

// Get container dimensions
const container = document.getElementById('physics-container');
const width = container.offsetWidth;
const height = container.offsetHeight;

// Create renderer
const render = Render.create({
    element: container,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: 'transparent'
    }
});

// Create walls (boundaries)
const wallOptions = {
    isStatic: true,
    render: {
        fillStyle: 'transparent',
        strokeStyle: 'transparent'
    }
};

const walls = [
    Bodies.rectangle(width / 2, 0, width, 10, wallOptions), // top
    Bodies.rectangle(width / 2, height, width, 10, wallOptions), // bottom
    Bodies.rectangle(0, height / 2, 10, height, wallOptions), // left
    Bodies.rectangle(width, height / 2, 10, height, wallOptions) // right
];

Composite.add(world, walls);

// Function to create letter blocks
function createLetterBlock(letter, x, y) {
    const blockWidth = 80;
    const blockHeight = 90;

    // Darker galaxy colors - deep space theme
    const galaxyColors = [
        { primary: '#0a0015', secondary: '#1a0033', accent: '#2d0052' }, // Deep purple
        { primary: '#000a1a', secondary: '#001433', accent: '#002966' }, // Deep blue
        { primary: '#0f0015', secondary: '#1f0033', accent: '#3d0066' }, // Deep magenta
        { primary: '#000d1a', secondary: '#001a33', accent: '#003d66' }, // Dark cyan
        { primary: '#0d0500', secondary: '#1a0f00', accent: '#332200' }, // Dark amber
        { primary: '#050d0d', secondary: '#0a1a1a', accent: '#143333' }  // Dark teal
    ];

    const galaxyTheme = galaxyColors[Math.floor(Math.random() * galaxyColors.length)];

    const block = Bodies.rectangle(x, y, blockWidth, blockHeight, {
        render: {
            fillStyle: galaxyTheme.primary,
            strokeStyle: '#FFFFFF',
            lineWidth: 3
        },
        restitution: 0.4,
        friction: 0.7,
        density: 0.001
    });

    // Store letter and galaxy theme for custom rendering
    block.label = letter;
    block.galaxyTheme = galaxyTheme;

    // Generate random stardust particles for this block
    block.stardust = [];
    const numStars = 15 + Math.floor(Math.random() * 10);
    for (let i = 0; i < numStars; i++) {
        block.stardust.push({
            x: (Math.random() - 0.5) * blockWidth * 0.8,
            y: (Math.random() - 0.5) * blockHeight * 0.8,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random()
        });
    }

    return block;
}

// Function to initialize blocks
let letterBlocks = [];

function initializeBlocks() {
    // Remove existing blocks
    letterBlocks.forEach(block => {
        Composite.remove(world, block);
    });
    letterBlocks = [];

    // Create new blocks - filter out spaces
    const letters = YOUR_NAME.split('').filter(letter => letter !== ' ');
    const startX = width / 2 - (letters.length * 45);
    const startY = height / 3;

    letters.forEach((letter, index) => {
        const x = startX + (index * 90);
        const y = startY + Math.random() * 30; // slight random offset
        const block = createLetterBlock(letter, x, y);
        letterBlocks.push(block);
        Composite.add(world, block);
    });
}

// Initialize blocks on load
initializeBlocks();

// Add mouse control for dragging
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});

Composite.add(world, mouseConstraint);

// Keep the mouse in sync with rendering
render.mouse = mouse;

// Run the engine
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

// Custom rendering to draw galaxy blocks with stardust
Events.on(render, 'afterRender', function() {
    const context = render.context;
    const time = Date.now() * 0.001; // For animation

    letterBlocks.forEach(block => {
        const pos = block.position;
        const angle = block.angle;
        const blockWidth = 80;
        const blockHeight = 90;

        context.save();
        context.translate(pos.x, pos.y);
        context.rotate(angle);

        // Draw galaxy gradient background
        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, blockWidth * 0.7);
        gradient.addColorStop(0, block.galaxyTheme.accent + '40'); // Center glow
        gradient.addColorStop(0.4, block.galaxyTheme.secondary + '60');
        gradient.addColorStop(1, block.galaxyTheme.primary + 'ff'); // Edge dark

        context.fillStyle = gradient;
        context.fillRect(-blockWidth / 2, -blockHeight / 2, blockWidth, blockHeight);

        // Draw stardust particles
        block.stardust.forEach((star, index) => {
            // Twinkling effect
            const twinkle = Math.sin(time * 2 + index) * 0.5 + 0.5;
            const alpha = star.brightness * twinkle;

            context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            context.beginPath();
            context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            context.fill();

            // Add glow to bigger stars
            if (star.size > 1.5) {
                context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
                context.beginPath();
                context.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                context.fill();
            }
        });

        // Draw white outline
        context.strokeStyle = '#FFFFFF';
        context.lineWidth = 3;
        context.strokeRect(-blockWidth / 2, -blockHeight / 2, blockWidth, blockHeight);

        // Draw letter in white with glow
        context.shadowColor = 'rgba(255, 255, 255, 0.9)';
        context.shadowBlur = 15;
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(block.label, 0, 0);

        context.restore();
    });
});

// Reset button functionality
document.getElementById('reset-btn').addEventListener('click', function() {
    initializeBlocks();
});

// Handle window resize
window.addEventListener('resize', function() {
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight;

    render.canvas.width = newWidth;
    render.canvas.height = newHeight;
    render.options.width = newWidth;
    render.options.height = newHeight;

    // Update walls
    Composite.remove(world, walls[0]);
    Composite.remove(world, walls[1]);
    Composite.remove(world, walls[2]);
    Composite.remove(world, walls[3]);

    walls[0] = Bodies.rectangle(newWidth / 2, 0, newWidth, 10, wallOptions);
    walls[1] = Bodies.rectangle(newWidth / 2, newHeight, newWidth, 10, wallOptions);
    walls[2] = Bodies.rectangle(0, newHeight / 2, 10, newHeight, wallOptions);
    walls[3] = Bodies.rectangle(newWidth, newHeight / 2, 10, newHeight, wallOptions);

    Composite.add(world, walls);

    initializeBlocks();
});
