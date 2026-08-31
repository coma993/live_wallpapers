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

  function isOnItachi(x, y) {
    return x > width * 0.53 && x < width && y > height * 0.06 && y < height;
  }

  function source() {
    return { x: width * 0.538, y: height * 0.575 };
  }

  function launch(pointerX, pointerY, isQuickClick = false) {
    const start = source();
    let dx = pointerX - start.x;
    let dy = pointerY - start.y;
    let length = Math.hypot(dx, dy);
    if (isQuickClick || length < 24) {
      dx = -1;
      dy = 0;
      length = 1;
    }
    const distance = Math.max(width, height) * 1.25;
    shots.push({
      startX: start.x,
      startY: start.y,
      targetX: start.x + (dx / length) * distance,
      targetY: start.y + (dy / length) * distance,
      age: 0.3,
      life: 0.86,
      seed: Math.random() * Math.PI * 2,
    });
    hint.style.opacity = '0';
  }

  function bolt(fromX, fromY, toX, toY, widthPx, alpha, seed, forks = 0) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const segments = Math.max(4, Math.round(length / 34));
    const points = [[fromX, fromY]];
    for (let i = 1; i < segments; i += 1) {
      const progress = i / segments;
      const wobble = Math.sin(seed * 7 + i * 8.91) * Math.min(length * 0.075, 24) * (0.45 + Math.sin(progress * Math.PI));
      points.push([fromX + dx * progress + normalX * wobble, fromY + dy * progress + normalY * wobble]);
    }
    points.push([toX, toY]);
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => context.lineTo(x, y));
    context.strokeStyle = `rgba(86, 157, 255, ${alpha})`;
    context.lineWidth = widthPx * 2.8;
    context.shadowBlur = widthPx * 7;
    context.shadowColor = 'rgba(56, 128, 255, 0.95)';
    context.stroke();
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => context.lineTo(x, y));
    context.strokeStyle = `rgba(238, 251, 255, ${Math.min(1, alpha + 0.15)})`;
    context.lineWidth = widthPx;
    context.shadowBlur = 0;
    context.stroke();
    for (let i = 1; i < points.length - 1 && i <= forks; i += 1) {
      const [x, y] = points[(i * 3) % (points.length - 1)];
      const branchLength = length * (0.08 + ((i * 17) % 10) / 180);
      const angle = seed + i * 2.41;
      bolt(x, y, x + Math.cos(angle) * branchLength, y + Math.sin(angle) * branchLength, widthPx * 0.5, alpha * 0.68, seed + i * 1.73);
    }
  }

  function drawChidori(shot) {
    const chargeTime = 0.3;
    const charge = Math.min(shot.age / chargeTime, 1);
    const release = Math.max(0, Math.min((shot.age - chargeTime) / (shot.life - chargeTime), 1));
    const movement = 1 - Math.pow(1 - release, 3);
    const x = shot.startX + (shot.targetX - shot.startX) * movement;
    const y = shot.startY + (shot.targetY - shot.startY) * movement;
    const radius = Math.max(18, Math.min(width, height) * (0.018 + charge * 0.025) * (1 - release * 0.32));
    const fade = 1 - release * 0.78;
    const glow = context.createRadialGradient(x, y, 0, x, y, radius * 5);
    glow.addColorStop(0, `rgba(255,255,255,${fade})`);
    glow.addColorStop(0.12, `rgba(176,224,255,${fade * 0.96})`);
    glow.addColorStop(0.38, `rgba(55,125,255,${fade * 0.48})`);
    glow.addColorStop(1, 'rgba(12,68,255,0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, radius * 5, 0, Math.PI * 2);
    context.fill();
    context.save();
    context.lineCap = 'round';
    for (let i = 0; i < 11; i += 1) {
      const angle = shot.seed + i * 2.399 + shot.age * (13 + i * 0.2);
      const reach = radius * (1.2 + (i % 4) * 0.64);
      bolt(x, y, x + Math.cos(angle) * reach, y + Math.sin(angle) * reach, Math.max(0.8, radius * 0.045), fade * 0.92, shot.seed + i * 0.91);
    }
    if (release > 0.01) bolt(shot.startX, shot.startY, x, y, Math.max(1.1, radius * 0.065), fade * 0.83, shot.seed + shot.age * 3, 3);
    context.restore();
    if (release > 0.72) {
      const impact = (release - 0.72) / 0.28;
      for (let i = 0; i < 14; i += 1) {
        const angle = shot.seed + (i * Math.PI * 2) / 14;
        const inner = radius * (0.5 + impact);
        const outer = radius * (2.3 + impact * 5 + (i % 3));
        bolt(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner, x + Math.cos(angle) * outer, y + Math.sin(angle) * outer, Math.max(0.7, radius * 0.03), (1 - impact) * 0.8, shot.seed + i);
      }
    }
  }

  function drawCharging(charge) {
    const start = source();
    drawChidori({ startX: start.x, startY: start.y, targetX: start.x, targetY: start.y, age: Math.min(charge.age, 0.3), life: 0.86, seed: charge.seed });
    const dx = charge.x - start.x;
    const dy = charge.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 22) return;
    const guideLength = Math.min(length, Math.max(width, height) * 0.24);
    context.save();
    context.strokeStyle = 'rgba(105, 175, 255, 0.46)';
    context.lineWidth = 1.5;
    context.setLineDash([7, 10]);
    context.lineDashOffset = -charge.age * 70;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(start.x + (dx / length) * guideLength, start.y + (dy / length) * guideLength);
    context.stroke();
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
      if (shot.age < shot.life) drawChidori(shot);
      return shot.age < shot.life;
    });
    context.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  wallpaper.addEventListener('pointerdown', (event) => {
    const bounds = wallpaper.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (!isOnItachi(x, y)) return;
    charging = { x, y, pressX: x, pressY: y, age: 0, seed: Math.random() * Math.PI * 2, pointerId: event.pointerId };
    wallpaper.setPointerCapture?.(event.pointerId);
    hint.style.opacity = '0';
  });

  wallpaper.addEventListener('pointermove', (event) => {
    if (!charging || event.pointerId !== charging.pointerId) return;
    const bounds = wallpaper.getBoundingClientRect();
    charging.x = event.clientX - bounds.left;
    charging.y = event.clientY - bounds.top;
  });

  function releaseChidori(event) {
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

  wallpaper.addEventListener('pointerup', releaseChidori);
  wallpaper.addEventListener('pointercancel', (event) => {
    if (charging && event.pointerId === charging.pointerId) charging = null;
  });
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
