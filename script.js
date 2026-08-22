const scratchCard = document.getElementById('scratch');
const doorContainer = document.getElementById('door-container');
const canvas = scratchCard.querySelector('canvas');

let isDoorOpen = false;
let textOpacity = 0;

// Door logic
doorContainer.addEventListener('click', function () {
    doorContainer.classList.add('open');
    
    // Hide the top image smoothly
    const topLogo = document.getElementById('top-logo');
    if (topLogo) {
        topLogo.classList.add('hidden');
    }

    setTimeout(() => {
        isDoorOpen = true; // Start text fade-in AFTER door finishes opening
        doorContainer.classList.add('hidden');
        
        // Show progress indicator
        const progress = document.getElementById('scratch-progress');
        if (progress) progress.classList.add('show');
    }, 1000); // Wait for the 1s curtain draw transition
});
const ctx = canvas.getContext('2d');

let offscreenCanvas = document.createElement('canvas');
let offCtx = offscreenCanvas.getContext('2d');
let animationId;
let gradientOffset = 0;
let isRevealed = false;
let scratchCount = 0;
let isDrawing = false;
let isMouseDown = false;

function initCanvas() {
    canvas.width = scratchCard.offsetWidth;
    canvas.height = scratchCard.offsetHeight;
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    // Clear offscreen (scratches)
    offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Reset revealed state
    isRevealed = false;
    scratchCount = 0;
    scratchCard.classList.remove('revealed', 'scratching');
    canvas.classList.remove('fade-out');

    if (animationId) cancelAnimationFrame(animationId);
    animateFoil();
}

function animateFoil() {
    if (isRevealed) {
        return; // Stop animation when revealed
    }

    // Clear main canvas
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw animated golden gradient
    gradientOffset += 1.5;
    if (gradientOffset > canvas.width * 2) gradientOffset = 0;

    const gradient = ctx.createLinearGradient(
        -canvas.width + gradientOffset, 0,
        canvas.width + gradientOffset, canvas.height
    );
    gradient.addColorStop(0, '#bf953f');
    gradient.addColorStop(0.25, '#d4af37');
    gradient.addColorStop(0.5, '#fcf6ba'); // Shiny streak passing by
    gradient.addColorStop(0.75, '#dcb662');
    gradient.addColorStop(1, '#aa771c');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text with fade-in
    if (isDoorOpen && textOpacity < 1) {
        textOpacity += 0.005; // Extremely slow fade in (about 3 seconds at 60fps)
        if (textOpacity > 1) textOpacity = 1;
    }

    // #4a3300 is rgb(74, 51, 0)
    ctx.fillStyle = `rgba(74, 51, 0, ${textOpacity})`;
    const fontSize = Math.max(16, canvas.width / 15);
    ctx.font = `${fontSize}px Arial`; // removed bold as unicode characters are inherently bold
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝑺𝒄𝒓𝒂𝒕𝒄𝒉 𝒉𝒆𝒓𝒆', canvas.width / 2, canvas.height / 2);

    // Apply scratches from offscreen canvas
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(offscreenCanvas, 0, 0);

    animationId = requestAnimationFrame(animateFoil);
}

initCanvas();

let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
        if (!isRevealed) {
            initCanvas();
        }
    }, 200);
});

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
        x: (touch.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (touch.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

canvas.addEventListener('mousedown', function (e) {
    isDrawing = true;
    isMouseDown = true;
    scratchCard.classList.add('scratching');
    const pos = getMousePos(e);
    scratch(pos.x, pos.y);
});
canvas.addEventListener('mousemove', function (e) {
    if (isDrawing && isMouseDown) {
        const pos = getMousePos(e);
        scratch(pos.x, pos.y);
    }
});
canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (isDrawing) {
        const pos = getTouchPos(e);
        scratch(pos.x, pos.y);
    }
});
canvas.addEventListener('mouseup', function (e) {
    isDrawing = false;
    isMouseDown = false;
    scratchCard.classList.remove('scratching');
    checkReveal(true);
});
canvas.addEventListener('mouseleave', function (e) {
    isDrawing = false;
    scratchCard.classList.remove('scratching');
});
canvas.addEventListener('mouseenter', function (e) {
    if (isMouseDown) {
        isDrawing = true;
        scratchCard.classList.add('scratching');
    }
});
document.addEventListener('mouseup', function (e) {
    isMouseDown = false;
    scratchCard.classList.remove('scratching');
});
canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    isDrawing = true;
    scratchCard.classList.add('scratching');
    const pos = getTouchPos(e);
    scratch(pos.x, pos.y);
});
canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    isDrawing = false;
    scratchCard.classList.remove('scratching');
    checkReveal(true);
});

function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    const vx = (Math.random() - 0.5) * 8;
    const vy = Math.random() * -5 - 2;
    scratchCard.appendChild(particle);

    let currentX = x;
    let currentY = y;
    let currentVy = vy;
    let opacity = 1;

    function animate() {
        currentVy += 0.5; // gravity
        currentX += vx;
        currentY += currentVy;
        opacity -= 0.03;

        particle.style.left = `${currentX}px`;
        particle.style.top = `${currentY}px`;
        particle.style.opacity = opacity;

        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            particle.remove();
        }
    }
    requestAnimationFrame(animate);
}

let lastRevealTime = 0;

function checkReveal(force = false) {
    const now = Date.now();
    if (!force && now - lastRevealTime < 150) return;
    lastRevealTime = now;

    const imageData = offCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    const pixels = imageData.data;
    let scratchedPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 0) scratchedPixels++;
    }

    const percentage = (scratchedPixels / (pixels.length / 4)) * 100;

    // Update progress text and visual bar
    const progressEl = document.getElementById('scratch-progress');
    if (progressEl) {
        let displayPercent = Math.min(100, Math.floor((percentage / 50) * 100));
        
        const textEl = document.getElementById('progress-text');
        if (textEl) textEl.textContent = `Scratched: ${displayPercent}%`;
        
        const fillEl = document.getElementById('progress-bar-fill');
        if (fillEl) fillEl.style.width = `${displayPercent}%`;
    }

    if (percentage > 50) {
        isRevealed = true;
        cancelAnimationFrame(animationId);

        if (progressEl) {
            progressEl.classList.remove('show');
        }

        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(offscreenCanvas, 0, 0);

        canvas.classList.add('fade-out');
        scratchCard.classList.add('revealed');
        scratchCard.classList.remove('scratching');

        const actionsContainer = document.getElementById('actions-container');
        if (actionsContainer) {
            actionsContainer.classList.add('visible');
        }

        const topLogo = document.getElementById('top-logo');
        if (topLogo) {
            topLogo.classList.add('hidden');
        }

        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335']
            });
        }

        // Play celebration music
        const music = document.getElementById('celebration-music');
        if (music) {
            music.play().catch(e => console.log("Audio play failed (browser might require interaction):", e));
        }
    }
}

let lastParticlePos = { x: -100, y: -100 };

function scratch(x, y) {
    if (isRevealed) return;

    offCtx.globalCompositeOperation = 'source-over';
    offCtx.beginPath();
    offCtx.arc(x, y, 40, 0, 2 * Math.PI);
    offCtx.fill();

    const dist = Math.hypot(x - lastParticlePos.x, y - lastParticlePos.y);
    if (dist > 15) {
        createParticle(x, y);
        lastParticlePos = { x, y };
    }

    checkReveal();
}
