document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const restartButton = document.getElementById('restart-button');
    const musicToggleButton = document.getElementById('music-toggle');
    const currentMusicDisplay = document.getElementById('current-music');
    const backgroundSound1 = document.getElementById('background-sound-1');
    const backgroundSound3 = document.getElementById('background-sound-3');
    const eatSound = document.getElementById('eat-sound');

    // Estado de audio
    let currentBackgroundMusic = backgroundSound1;
    let musicTrack = 1;

    // Tamaño de la cuadrícula
    const gridSize = 20;
    const gridWidth = canvas.width / gridSize;
    const gridHeight = canvas.height / gridSize;

    // Estado del juego
    let snake = [];
    let food = {};
    let direction = '';
    let nextDirection = '';
    let score = 0;
    let gameInterval;
    let gameSpeed = 150;
    let gameRunning = false;
    let gamePaused = false;
    let foodImages = [];
    let currentFoodImage = 0;
    let snakeColorIndex = 0;
    
    // Colores para la culebrita
    const snakeColors = [
        '#00ff00', // Verde brillante
        '#00ffff', // Cian
        '#ff00ff', // Magenta
        '#ffff00', // Amarillo
        '#ff0000', // Rojo
        '#0000ff', // Azul
        '#ff8800'  // Naranja
    ];

    // Cargar imágenes de comida
    function loadFoodImages() {
        for(let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `../img/${i}.png`;
            foodImages.push(img);
        }
    }

    // Inicializar el juego
    function initGame() {
        snake = [
            {x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2)},
            {x: Math.floor(gridWidth / 2) - 1, y: Math.floor(gridHeight / 2)},
            {x: Math.floor(gridWidth / 2) - 2, y: Math.floor(gridHeight / 2)}
        ];
        
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        scoreElement.textContent = '0';
        snakeColorIndex = 0;
        gamePaused = false;
        pauseButton.textContent = 'Pausar';
        pauseButton.classList.remove('paused');
        
        generateFood();
        
        if (gameInterval) {
            clearInterval(gameInterval);
        }
    }

    // Generar comida en posición aleatoria
    function generateFood() {
        currentFoodImage = Math.floor(Math.random() * foodImages.length);
        
        food = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // Comprobar que la comida no aparezca sobre la serpiente
        for (const segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                generateFood();
                return;
            }
        }
    }

    // Dibujar la serpiente mejorada
    function drawSnake() {
        // Crear copia del snake para manipular las posiciones al dibujar
        const snakeSegments = [...snake];
        
        // Dibujar cada segmento de la serpiente
        snakeSegments.forEach((segment, index) => {
            const currentColor = snakeColors[snakeColorIndex];
            const segmentX = segment.x * gridSize;
            const segmentY = segment.y * gridSize;
            
            // Diferentes estilos según la posición en la serpiente
            if (index === 0) {
                // Cabeza de la serpiente
                drawSnakeHead(segmentX, segmentY, currentColor);
            } else {
                // Cuerpo de la serpiente
                drawSnakeBody(segmentX, segmentY, index, currentColor, snakeSegments);
            }
        });
    }
    
    // Dibujar la cabeza de la serpiente
    function drawSnakeHead(x, y, color) {
        const headRadius = gridSize / 2;
        
        // Base de la cabeza ligeramente más grande que el cuerpo
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + headRadius, y + headRadius, headRadius * 1.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde de la cabeza
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Determinar la dirección de la cabeza para orientar los ojos
        let eyeOffsetX = 0;
        let eyeOffsetY = 0;
        
        switch (direction) {
            case 'up':
                eyeOffsetY = -headRadius / 4;
                break;
            case 'down':
                eyeOffsetY = headRadius / 4;
                break;
            case 'left':
                eyeOffsetX = -headRadius / 4;
                break;
            case 'right':
                eyeOffsetX = headRadius / 4;
                break;
        }
        
        // Ojos en espiral
        const eyeSize = gridSize / 4;
        const spiralStrength = 1 + (score / 10);
        
        // Ojo izquierdo
        drawSpiralEye(
            x + headRadius - headRadius / 2 + eyeOffsetX, 
            y + headRadius - headRadius / 3 + eyeOffsetY, 
            eyeSize, 
            spiralStrength
        );
        
        // Ojo derecho
        drawSpiralEye(
            x + headRadius + headRadius / 2 + eyeOffsetX, 
            y + headRadius - headRadius / 3 + eyeOffsetY, 
            eyeSize, 
            spiralStrength
        );
        
        // Lengua (solo visible cuando va a la izquierda o derecha)
        if (direction === 'left' || direction === 'right') {
            ctx.fillStyle = '#ff0066';
            ctx.beginPath();
            
            const tongueX = direction === 'right' ? x + gridSize + 5 : x - 5;
            const tongueY = y + headRadius;
            
            ctx.moveTo(direction === 'right' ? x + gridSize : x, tongueY);
            ctx.lineTo(tongueX, tongueY - 3);
            ctx.lineTo(tongueX, tongueY + 3);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Dibujar el cuerpo de la serpiente
    function drawSnakeBody(x, y, index, color, segments) {
        const segmentRadius = gridSize / 2 * (1 - (index * 0.01)); // Ligeramente más pequeño hacia la cola
        
        // Calcular el centro del segmento
        const centerX = x + segmentRadius;
        const centerY = y + segmentRadius;
        
        // Dibujar segmento redondeado
        ctx.fillStyle = color;
        
        // Añadir un ligero desplazamiento aleatorio pero consistente para cada segmento
        const seed = index * 10; // Seed para pseudoaleatoriedad
        const offsetX = Math.sin(seed) * 2;
        const offsetY = Math.cos(seed) * 2;
        
        // Dibujar el segmento como un círculo
        ctx.beginPath();
        ctx.arc(centerX + offsetX, centerY + offsetY, segmentRadius * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar las escamas en el cuerpo (patrones)
        if (index % 2 === 0) {
            ctx.fillStyle = lightenColor(color, 20);
            
            // Patrones de escamas
            const scaleSize = segmentRadius * 0.5;
            ctx.beginPath();
            ctx.arc(centerX + offsetX, centerY + offsetY, scaleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dibujar la conexión con el segmento anterior si existe
        if (index > 0) {
            const prevSegment = segments[index - 1];
            const prevX = prevSegment.x * gridSize + segmentRadius;
            const prevY = prevSegment.y * gridSize + segmentRadius;
            
            // Dibujar una línea gruesa para conectar segmentos
            ctx.strokeStyle = color;
            ctx.lineWidth = segmentRadius * 1.5;
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(centerX + offsetX, centerY + offsetY);
            ctx.stroke();
        }
    }
    
    // Función para aclarar un color
    function lightenColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    // Dibujar ojo en espiral
    function drawSpiralEye(x, y, size, strength) {
        // Base del ojo
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Espiral
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const maxSpirals = 2 + Math.min(5, Math.floor(strength));
        const spiralRadius = size * 0.8;
        
        for (let i = 0; i < maxSpirals * 10; i++) {
            const angle = 0.8 * i * (Math.PI / 5);
            const radius = spiralRadius * (i / (maxSpirals * 10));
            const spiralX = x + radius * Math.cos(angle);
            const spiralY = y + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(spiralX, spiralY);
            } else {
                ctx.lineTo(spiralX, spiralY);
            }
        }
        
        ctx.stroke();
    }

    // Dibujar comida
    function drawFood() {
        if (foodImages[currentFoodImage].complete) {
            ctx.drawImage(
                foodImages[currentFoodImage], 
                food.x * gridSize, 
                food.y * gridSize, 
                gridSize, 
                gridSize
            );
        } else {
            // Fallback si la imagen no está cargada
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        }
    }

    // Actualizar juego
    function updateGame() {
        // Actualizar dirección
        direction = nextDirection;
        
        // Calcular nueva posición de la cabeza
        const head = {...snake[0]};
        
        switch (direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // Verificar colisión con paredes
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            gameOver();
            return;
        }
        
        // Verificar colisión con la propia serpiente
        for (const segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                gameOver();
                return;
            }
        }
        
        // Añadir nueva cabeza
        snake.unshift(head);
        
        // Verificar si come
        if (head.x === food.x && head.y === food.y) {
            // Incrementar puntuación
            score++;
            scoreElement.textContent = score;
            
            // Cambiar color de la serpiente cada 5 puntos
            if (score % 5 === 0) {
                snakeColorIndex = (snakeColorIndex + 1) % snakeColors.length;
            }
            
            // Reproducir sonido de comer
            eatSound.currentTime = 0;
            eatSound.play();
            
            // Generar nueva comida
            generateFood();
            
            // Aumentar velocidad del juego
            if (score % 5 === 0 && gameSpeed > 60) {
                gameSpeed -= 10;
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, gameSpeed);
            }
        } else {
            // Si no come, quitar el último segmento
            snake.pop();
        }
    }

    // Bucle principal del juego
    function gameLoop() {
        if (!gamePaused) {
            // Limpiar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Actualizar y dibujar
            updateGame();
            drawFood();
            drawSnake();
        }
    }
    
    // Pausar/Reanudar juego
    function togglePause() {
        if (gameRunning) {
            gamePaused = !gamePaused;
            
            if (gamePaused) {
                pauseButton.textContent = 'Reanudar';
                pauseButton.classList.add('paused');
                currentBackgroundMusic.pause();
                
                // Mensaje de pausa en el canvas
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('JUEGO PAUSADO', canvas.width / 2, canvas.height / 2);
            } else {
                pauseButton.textContent = 'Pausar';
                pauseButton.classList.remove('paused');
                currentBackgroundMusic.play();
            }
        }
    }
    
    // Cambiar música de fondo
    function toggleBackgroundMusic() {
        // Pausar música actual
        currentBackgroundMusic.pause();
        currentBackgroundMusic.currentTime = 0;
        
        // Cambiar a la otra pista
        musicTrack = musicTrack === 1 ? 3 : 1;
        currentBackgroundMusic = musicTrack === 1 ? backgroundSound1 : backgroundSound3;
        currentMusicDisplay.textContent = `Música ${musicTrack}`;
        
        // Si el juego está en marcha y no pausado, reproducir la nueva música
        if (gameRunning && !gamePaused) {
            currentBackgroundMusic.play();
        }
    }

    // Game Over
    function gameOver() {
        clearInterval(gameInterval);
        currentBackgroundMusic.pause();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff0000';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡GAME OVER!', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`Puntuación: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        
        gameRunning = false;
    }

    // Iniciar juego
    function startGame() {
        if (!gameRunning) {
            initGame();
            gameInterval = setInterval(gameLoop, gameSpeed);
            currentBackgroundMusic.play();
            gameRunning = true;
        }
    }

    // Eventos de teclado
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                if (direction !== 'down') {
                    nextDirection = 'up';
                }
                break;
            case 'ArrowDown':
                if (direction !== 'up') {
                    nextDirection = 'down';
                }
                break;
            case 'ArrowLeft':
                if (direction !== 'right') {
                    nextDirection = 'left';
                }
                break;
            case 'ArrowRight':
                if (direction !== 'left') {
                    nextDirection = 'right';
                }
                break;
            case ' ': // Barra espaciadora para pausar
                togglePause();
                break;
        }
    });

    // Eventos de botones
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    musicToggleButton.addEventListener('click', toggleBackgroundMusic);
    restartButton.addEventListener('click', () => {
        clearInterval(gameInterval);
        initGame();
        startGame();
    });

    // Inicializar el juego
    loadFoodImages();
    initGame();
    
    // Canvas dibujado inicial
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0f0';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Presiona "Iniciar Juego"', canvas.width / 2, canvas.height / 2);
});