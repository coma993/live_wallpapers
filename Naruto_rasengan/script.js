(() => {
  const wallpaper = document.querySelector('#wallpaper');
  const canvas = document.querySelector('#effects');
  const context = canvas.getContext('2d');
  const hint = document.querySelector('#hint');
  let scale = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let shots = [];
  let charging = null;
  let lastTime = 0;

  function resize() {
    const bounds = wallpaper.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function isOnNaruto(x, y) {
    // Lik je na desnoj strani slike. Zona je namerno šira od siluete,
    // kako bi klik radio i kada Lively prilagodi sliku drugoj rezoluciji.
    return x > width * 0.53 && x < width * 0.91 && y > height * 0.06 && y < height * 0.99;
  }

  function launch(pointerX, pointerY, isQuickClick = false) {
    const startX = width * 0.785;
    const startY = height * 0.46;
    if (isQuickClick) {
      shots.push({
        startX,
        startY,
        targetX: width * 0.12,
        targetY: Math.max(height * 0.16, Math.min(height * 0.82, pointerY)),
        age: 0.42,
        life: 1.14,
        seed: Math.random() * Math.PI * 2,
      });
      hint.style.opacity = '0';
      return;
    }
    let dx = pointerX - startX;
    let dy = pointerY - startY;
    let length = Math.hypot(dx, dy);
    if (length < 24) {
      dx = -1;
      dy = 0;
      length = 1;
    }
    const distance = Math.max(width, height) * 1.25;
    shots.push({
      startX,
      startY,
      targetX: startX + (dx / length) * distance,
      targetY: startY + (dy / length) * distance,
      // Počinje već napunjen, zato se ispali istog trenutka po puštanju klika.
      age: 0.42,
      life: 1.14,
      seed: Math.random() * Math.PI * 2,
    });
    hint.style.opacity = '0';
  }

  function drawRasengan(shot) {
    const chargeTime = 0.42;
    const releaseTime = 0.56;
    const charge = Math.min(shot.age / chargeTime, 1);
    const release = Math.max(0, Math.min((shot.age - chargeTime) / releaseTime, 1));
    const easedRelease = 1 - Math.pow(1 - release, 4);
    const x = shot.startX + (shot.targetX - shot.startX) * easedRelease;
    const y = shot.startY + (shot.targetY - shot.startY) * easedRelease;
    const base = Math.min(width, height);
    const radius = Math.max(24, base * (0.016 + charge * 0.04) * (1 - release * 0.18));
    const pulse = 1 + Math.sin(shot.age * 28) * 0.09;
    const glow = context.createRadialGradient(x, y, 0, x, y, radius * 4.2 * pulse);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.1, 'rgba(220,253,255,1)');
    glow.addColorStop(0.25, 'rgba(88,218,255,0.95)');
    glow.addColorStop(0.53, 'rgba(24,129,255,0.54)');
    glow.addColorStop(1, 'rgba(0,72,255,0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, radius * 4.2 * pulse, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.translate(x, y);
    context.lineCap = 'round';
    context.globalAlpha = 0.86;
    for (let i = 0; i < 15; i += 1) {
      const angle = shot.seed + shot.age * (18 + i * 0.18) + (i * Math.PI * 2) / 15;
      const ring = radius * (0.28 + (i % 5) * 0.14);
      context.lineWidth = Math.max(1.15, radius * (i % 3 === 0 ? 0.07 : 0.038));
      context.strokeStyle = i % 3 === 0 ? 'rgba(244,255,255,0.98)' : 'rgba(70,202,255,0.75)';
      context.beginPath();
      context.ellipse(0, 0, ring, ring * (0.45 + (i % 4) * 0.12), angle, 0, Math.PI * 1.55);
      context.stroke();
    }
    context.globalAlpha = 1;

    // Sitne svetleće iskre stvaraju utisak da se energija neprekidno sabija.
    for (let i = 0; i < 18; i += 1) {
      const angle = shot.seed * 2 + i * 2.399 + shot.age * 9;
      const distance = radius * (0.9 + ((i * 17) % 10) / 10);
      const sparkle = Math.max(1.5, radius * 0.065);
      context.fillStyle = i % 2 ? 'rgba(219,252,255,0.95)' : 'rgba(87,193,255,0.8)';
      context.beginPath();
      context.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, sparkle, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();

    if (release > 0) {
      const dx = shot.targetX - shot.startX;
      const dy = shot.targetY - shot.startY;
      const length = Math.hypot(dx, dy);
      const unitX = dx / length;
      const unitY = dy / length;
      const normalX = -unitY;
      const normalY = unitX;
      const trailLength = Math.min(length * 0.34, radius * 11);
      for (let i = 0; i < 5; i += 1) {
        const side = (i - 2) * radius * 0.38;
        const gradient = context.createLinearGradient(
          x,
          y,
          x - unitX * trailLength + normalX * side,
          y - unitY * trailLength + normalY * side,
        );
        gradient.addColorStop(0, i % 2 ? 'rgba(235,253,255,0.84)' : 'rgba(87,211,255,0.74)');
        gradient.addColorStop(1, 'rgba(6,94,255,0)');
        context.strokeStyle = gradient;
        context.lineWidth = Math.max(1.3, radius * (0.16 - Math.abs(i - 2) * 0.022));
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(x + normalX * side * 0.18, y + normalY * side * 0.18);
        context.quadraticCurveTo(
          x - unitX * trailLength * 0.42 + normalX * side * 1.8,
          y - unitY * trailLength * 0.42 + normalY * side * 1.8,
          x - unitX * trailLength + normalX * side * 0.12,
          y - unitY * trailLength + normalY * side * 0.12,
        );
        context.stroke();
      }
    }

    if (release > 0.82) {
      const impact = (release - 0.82) / 0.18;
      const impactRadius = radius * (1.6 + impact * 4.6);
      context.strokeStyle = `rgba(174, 243, 255, ${1 - impact})`;
      context.lineWidth = Math.max(1.5, radius * 0.075 * (1 - impact));
      context.beginPath();
      context.arc(x, y, impactRadius, 0, Math.PI * 2);
      context.stroke();
      for (let i = 0; i < 12; i += 1) {
        const angle = shot.seed + (i * Math.PI * 2) / 12;
        const inner = impactRadius * 0.35;
        const outer = impactRadius * (0.8 + (i % 3) * 0.22);
        context.strokeStyle = `rgba(134, 227, 255, ${(1 - impact) * 0.75})`;
        context.lineWidth = Math.max(1, radius * 0.035);
        context.beginPath();
        context.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        context.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        context.stroke();
      }
    }
  }

  function drawCharging(charge) {
    const startX = width * 0.785;
    const startY = height * 0.46;
    const age = Math.min(charge.age, 0.42);
    drawRasengan({
      startX,
      startY,
      targetX: startX,
      targetY: startY,
      age,
      seed: charge.seed,
    });

    const dx = charge.x - startX;
    const dy = charge.y - startY;
    const length = Math.hypot(dx, dy);
    if (length < 22) return;
    const guideLength = Math.min(length, Math.max(width, height) * 0.24);
    const guideX = startX + (dx / length) * guideLength;
    const guideY = startY + (dy / length) * guideLength;
    context.save();
    context.strokeStyle = 'rgba(139, 232, 255, 0.5)';
    context.lineWidth = 1.6;
    context.setLineDash([7, 10]);
    context.lineDashOffset = -charge.age * 70;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(guideX, guideY);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = 'rgba(217, 253, 255, 0.8)';
    context.beginPath();
    context.arc(guideX, guideY, 3.5, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function frame(time) {
    const delta = Math.min((time - lastTime) / 1000 || 0, 0.05);
    lastTime = time;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';
    if (charging) {
      charging.age += delta;
      drawCharging(charging);
    }
    shots = shots.filter((shot) => {
      shot.age += delta;
      if (shot.age < shot.life) drawRasengan(shot);
      return shot.age < shot.life;
    });
    context.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  wallpaper.addEventListener('pointerdown', (event) => {
    const bounds = wallpaper.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (!isOnNaruto(x, y)) return;
    charging = {
      x,
      y,
      pressX: x,
      pressY: y,
      age: 0,
      seed: Math.random() * Math.PI * 2,
      pointerId: event.pointerId,
    };
    wallpaper.setPointerCapture?.(event.pointerId);
    hint.style.opacity = '0';
  });

  wallpaper.addEventListener('pointermove', (event) => {
    if (!charging || event.pointerId !== charging.pointerId) return;
    const bounds = wallpaper.getBoundingClientRect();
    charging.x = event.clientX - bounds.left;
    charging.y = event.clientY - bounds.top;
  });

  function releaseRasengan(event) {
    if (!charging || event.pointerId !== charging.pointerId) return;
    const bounds = wallpaper.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const moved = Math.hypot(x - charging.pressX, y - charging.pressY);
    const isQuickClick = charging.age < 0.24 && moved < 18;
    wallpaper.releasePointerCapture?.(event.pointerId);
    charging = null;
    launch(x, y, isQuickClick);
  }

  wallpaper.addEventListener('pointerup', releaseRasengan);
  wallpaper.addEventListener('pointercancel', (event) => {
    if (charging && event.pointerId === charging.pointerId) charging = null;
  });

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
