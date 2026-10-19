/* Original Canvas artwork using the user-provided Media.io SVG path as its mask.
   Visual inspiration: ascii.rest/command-city/ and the subtle texture of a Hero. */
(() => {
  const LOGO_PATH = 'M36.0926 30L16.875 90H39.549L46.3128 68.8827L48.2592 90H64.2969L73.3976 69.322L72.7305 90H95.4046L96.6874 50.2326H102.909L103.125 43.5349H96.9035L97.3401 30H74.6661L68.7092 43.5349H84.7453L81.7976 50.2326H65.7615L61.5198 59.8701L58.7666 30H36.0926Z';
  const SIZE = 960;
  const FIELD_SIZE = 64;
  const TAU = Math.PI * 2;
  const hash = (x, y, seed = 0) => {
    let n = Math.imul(x + seed * 53, 374761393) + Math.imul(y + seed * 17, 668265263);
    n = Math.imul(n ^ n >>> 13, 1274126177);
    return ((n ^ n >>> 16) >>> 0) / 4294967296;
  };
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => value * value * (3 - 2 * value);
  const lerp = (a, b, weight) => a + (b - a) * weight;
  const noise = (x, y, seed) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = smooth(x - ix), fy = smooth(y - iy);
    return lerp(
      lerp(hash(ix, iy, seed), hash(ix + 1, iy, seed), fx),
      lerp(hash(ix, iy + 1, seed), hash(ix + 1, iy + 1, seed), fx),
      fy
    );
  };
  const fractal = (x, y, seed, octaves) => {
    let sum = 0, amplitude = .58, total = 0;
    for (let i = 0; i < octaves; i++) {
      sum += noise(x, y, seed + i * 11) * amplitude;
      total += amplitude;
      x *= 2.07;
      y *= 2.03;
      amplitude *= .5;
    }
    return sum / total;
  };
  // The folds are stretched along a diagonal, then bent by two slower fields.
  // Their brightness drifts continuously without a repeating wavefront.
  const silk = (x, y, t, strength) => {
    const along = x * .93 + y * .37;
    const across = -x * .37 + y * .93;
    const bendX = fractal(along * .0017 + t * .052, across * .0021 - t * .022, 11, 2) - .5;
    const bendY = noise(along * .0039 - t * .028 + 29, across * .0018 + t * .018, 37) - .5;
    const warpedAcross = across + (bendX * 170 + bendY * 78) * (.55 + strength * .45);
    const fold = fractal(along * .0014 + t * .034, warpedAcross * .0074 - t * .068, 73, 3);
    const broad = fractal(along * .001 - t * .024 + 17, warpedAcross * .0037 + t * .038, 23, 2);
    const sheen = Math.exp(-Math.pow((fold - .60) / .105, 2));
    const softFold = Math.exp(-Math.pow((fold - .42) / .125, 2));
    return { shade: clamp(.035 + .66 * sheen + .22 * softFold + .23 * broad), bendX, bendY };
  };
  const project = (x, y, z = 0) => {
    const u = (x - 60) / 75;
    const v = (y - 60) / 75;
    return [480 + u * (355 + 52 * v) + 48 * v + z * .23,
            477 + v * 300 - u * 62 - z];
  };
  function dot(ctx, x, y, r, lightness, alpha = 1) {
    ctx.fillStyle = `rgba(${lightness},${lightness},${lightness},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  class MediaIoAscii extends HTMLElement {
    static get observedAttributes() { return ['wave-strength', 'wave-speed', 'highlight', 'contrast']; }

    attributeChangedCallback() {
      this.readSettings();
      if (this.points && this.motion?.matches) this.render(0);
    }

    readSettings() {
      const value = (name, fallback, low, high) => {
        const raw = Number(this.getAttribute(name));
        return this.hasAttribute(name) && Number.isFinite(raw)
          ? Math.max(low, Math.min(high, raw)) : fallback;
      };
      this.waveStrength = value('wave-strength', .2, .2, 3);
      this.waveSpeed = value('wave-speed', 2.4, .3, 8);
      this.highlight = value('highlight', 2, .5, 4);
      this.contrast = value('contrast', 1.5, .3, 2.5);
    }

    connectedCallback() {
      if (this.canvas) {
        this.motion.addEventListener?.('change', this.motionChange);
        document.addEventListener('visibilitychange', this.visibilityChange);
        this.observer.observe(this);
        this.updatePlayback();
        return;
      }
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>:host{display:block;overflow:hidden;background:transparent}canvas{display:block;width:100%;height:100%;}</style><canvas role="img" aria-label="透视方形中由黑白灰点阵组成的 Media.io 标志"></canvas>`;
      this.canvas = shadow.querySelector('canvas');
      this.canvas.width = this.canvas.height = SIZE;
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.base = document.createElement('canvas');
      this.base.width = this.base.height = SIZE;
      this.softField = document.createElement('canvas');
      this.softField.width = this.softField.height = FIELD_SIZE;
      this.softFieldCtx = this.softField.getContext('2d');
      this.softFieldPixels = this.softFieldCtx.createImageData(FIELD_SIZE, FIELD_SIZE);
      this.fieldShade = new Float32Array(FIELD_SIZE * FIELD_SIZE);
      this.fieldBendX = new Float32Array(FIELD_SIZE * FIELD_SIZE);
      this.fieldBendY = new Float32Array(FIELD_SIZE * FIELD_SIZE);
      this.glyphAtlas = this.createGlyphAtlas();
      this.readSettings();
      this.drawBase();
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.motionChange = () => this.updatePlayback();
      this.motion.addEventListener?.('change', this.motionChange);
      this.visibilityChange = () => this.updatePlayback();
      document.addEventListener('visibilitychange', this.visibilityChange);
      this.visible = true;
      this.observer = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        this.updatePlayback();
      });
      this.observer.observe(this);
      this.buildMark();
      this.render(0);
      this.updatePlayback();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.motion?.removeEventListener?.('change', this.motionChange);
      document.removeEventListener('visibilitychange', this.visibilityChange);
      cancelAnimationFrame(this.raf);
    }

    createGlyphAtlas() {
      const glyphs = ' .,:;+=*#@';
      const atlas = document.createElement('canvas');
      atlas.width = glyphs.length * 12;
      atlas.height = 16;
      const ctx = atlas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < glyphs.length; i++) ctx.fillText(glyphs[i], i * 12 + 6, 8);
      return atlas;
    }

    paintSoftField(ctx, t) {
      const pixels = this.softFieldPixels.data;
      for (let y = 0; y < FIELD_SIZE; y++) for (let x = 0; x < FIELD_SIZE; x++) {
        const px = (x + .5) * SIZE / FIELD_SIZE;
        const py = (y + .5) * SIZE / FIELD_SIZE;
        const field = silk(px, py, t, this.waveStrength);
        const shade = clamp((field.shade - .34) * this.contrast * (.75 + this.waveStrength * .25) + .34);
        const radius = Math.hypot((px - 480) / 440, (py - 480) / 440);
        const fade = smooth(clamp((1 - radius) / .32));
        const n = y * FIELD_SIZE + x;
        this.fieldShade[n] = shade;
        this.fieldBendX[n] = field.bendX;
        this.fieldBendY[n] = field.bendY;
        const i = n * 4;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 218;
        pixels[i + 3] = Math.round(clamp(.045 + shade * .75 * this.highlight) * 255 * fade);
      }
      this.softFieldCtx.putImageData(this.softFieldPixels, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = .14;
      ctx.drawImage(this.softField, 0, 0, SIZE, SIZE);
      ctx.restore();
    }

    sampleField(array, x, y) {
      const fx = clamp(x / SIZE) * (FIELD_SIZE - 1);
      const fy = clamp(y / SIZE) * (FIELD_SIZE - 1);
      const ix = Math.min(FIELD_SIZE - 2, Math.floor(fx));
      const iy = Math.min(FIELD_SIZE - 2, Math.floor(fy));
      const sx = fx - ix, sy = fy - iy;
      const i = iy * FIELD_SIZE + ix;
      return lerp(lerp(array[i], array[i + 1], sx),
        lerp(array[i + FIELD_SIZE], array[i + FIELD_SIZE + 1], sx), sy);
    }

    drawBase() {
      const ctx = this.base.getContext('2d');

      // A perspective glyph grid samples the moving grayscale field.
      this.wavePoints = [];
      for (let y = -38; y <= 158; y += 2.4) for (let x = -38; x <= 158; x += 2.4) {
        const h = hash(Math.round(x * 10), Math.round(y * 10), 4);
        const [px, py] = project(x, y);
        if (px < 15 || px > 945 || py < 30 || py > 930) continue;
        const radius = Math.hypot((px - 480) / 440, (py - 480) / 440);
        const fade = smooth(clamp((1 - radius) / .34));
        this.wavePoints.push({ px, py, x, y, h, fade });
      }
    }

    buildMark() {
      const sample = document.createElement('canvas');
      sample.width = sample.height = 120;
      const s = sample.getContext('2d', { willReadFrequently: true });
      s.fillStyle = '#fff';
      s.fill(new Path2D(LOGO_PATH));
      const pixels = s.getImageData(0, 0, 120, 120).data;
      const ink = (x, y) => {
        if (x < 0 || y < 0 || x >= 120 || y >= 120) return false;
        const i = (y * 120 + x) * 4;
        return pixels[i] > 180 && pixels[i + 1] > 180 && pixels[i + 2] > 180;
      };
      this.points = [];
      for (let y = 29; y <= 90; y++) for (let x = 16; x <= 104; x++) {
        if (!ink(x, y)) continue;
        const edge = !ink(x + 1, y) || !ink(x - 1, y) || !ink(x, y + 1) || !ink(x, y - 1);
        const front = !ink(x, y + 1) || !ink(x + 1, y);
        const h = hash(x, y, 2);
        const [px, py] = project(x, y, 21);
        this.points.push({ x, y, px, py, h, edge, front });
      }
      const ctx = this.base.getContext('2d');
      this.mark = document.createElement('canvas');
      this.mark.width = this.mark.height = SIZE;
      const markCtx = this.mark.getContext('2d');
      for (const p of this.points) {
        const [sx, sy] = project(p.x, p.y, 0);
        dot(ctx, sx + 5, sy + 9, 1.1, 130, .1);
        if (!p.front) continue;
        for (let z = 5; z <= 18; z += 5) {
          const [wx, wy] = project(p.x, p.y, z);
          dot(ctx, wx, wy, .74, 137, .14 + z * .004);
        }
      }
      // The logo geometry stays crisp while only the surrounding silk moves.
      for (const p of this.points) {
        if (!p.edge && p.h < .16) continue;
        const lum = Math.round(Math.min(248, 181 + p.h * 43 + (p.edge ? 12 : 0)));
        const radius = p.edge ? 1.34 : 1.02 + p.h * .19;
        dot(markCtx, p.px, p.py, radius, lum, p.edge ? .96 : .78 + p.h * .16);
      }
    }

    render(t) {
      if (!this.points) return;
      const ctx = this.ctx;
      t *= this.waveSpeed;
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(this.base, 0, 0);
      this.paintSoftField(ctx, t);
      // The glyph grid stays almost still; shifting gray folds carry the motion.
      for (const p of this.wavePoints) {
        const shade = this.sampleField(this.fieldShade, p.px, p.py);
        const glyph = Math.min(9, Math.floor(shade * 10));
        const alpha = Math.min(.55, p.fade * (.025 + shade * .43 * this.highlight));
        if (glyph === 0 || alpha < .025) continue;
        const dx = this.sampleField(this.fieldBendY, p.px, p.py) * 6 * this.waveStrength;
        const dy = this.sampleField(this.fieldBendX, p.px, p.py) * 8 * this.waveStrength;
        ctx.globalAlpha = alpha;
        ctx.drawImage(this.glyphAtlas, glyph * 12, 0, 12, 16,
          p.px + dx - 6, p.py + dy - 8, 12, 16);
      }
      ctx.globalAlpha = 1;
      ctx.globalAlpha = .56;
      ctx.drawImage(this.mark, 0, 0);
      ctx.globalAlpha = 1;
    }

    updatePlayback() {
      cancelAnimationFrame(this.raf);
      if (!this.points || !this.visible || this.motion.matches || document.hidden) return;
      this.lastFrame = 0;
      const tick = ms => {
        const frameInterval = 1000 / 30;
        const firstFrame = !this.lastFrame;
        if (firstFrame || ms - this.lastFrame >= frameInterval - 1) {
          const start = performance.now();
          this.render(ms / 1000);
          this.lastRenderMs = performance.now() - start;
          if (this.hasAttribute('debug-perf')) {
            if (!this.perfFrames) this.perfFirstMs = ms;
            this.perfFrames = (this.perfFrames || 0) + 1;
            this.perfTotal = (this.perfTotal || 0) + this.lastRenderMs;
            if (this.perfFrames >= 30) {
              this.dataset.avgFrameMs = (this.perfTotal / this.perfFrames).toFixed(1);
              this.dataset.lastFrameMs = this.lastRenderMs.toFixed(1);
              this.dataset.actualFps = (29000 / (ms - this.perfFirstMs)).toFixed(1);
              this.perfFrames = this.perfTotal = 0;
            }
          }
          this.lastFrame = firstFrame ? ms : Math.max(ms - frameInterval, this.lastFrame + frameInterval);
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
  }
  customElements.define('media-io-ascii', MediaIoAscii);
})();
