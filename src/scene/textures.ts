import * as THREE from 'three';

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, srgb = false) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function cotesDeGeneve() {
  const t = canvasTexture(1024, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    const band = 96;
    for (let x = -band; x < s + band; x += band) {
      g.save();
      g.beginPath();
      g.rect(x, 0, band, s);
      g.clip();
      for (let r = 900; r > 0; r -= 2.2) {
        const v = 110 + (r % 11 < 1 ? 40 : 0) + Math.random() * 20;
        g.strokeStyle = `rgb(${v},${v},${v})`;
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(x + band / 2, s + 700, r + 700, 0, Math.PI * 2);
        g.stroke();
      }
      g.restore();
      const grd = g.createLinearGradient(x, 0, x + band, 0);
      grd.addColorStop(0, 'rgba(0,0,0,.35)');
      grd.addColorStop(0.5, 'rgba(255,255,255,.12)');
      grd.addColorStop(1, 'rgba(0,0,0,.35)');
      g.fillStyle = grd;
      g.fillRect(x, 0, band, s);
    }
  });
  t.repeat.set(0.045, 0.045);
  return t;
}

export function perlage() {
  const t = canvasTexture(1024, (g, s) => {
    g.fillStyle = '#7a7a7a';
    g.fillRect(0, 0, s, s);
    const d = 38;
    for (let y = 0; y < s + d; y += d * 0.62) {
      for (let x = 0; x < s + d; x += d * 0.62) {
        const cx = x + (Math.floor(y / (d * 0.62)) % 2) * d * 0.31;
        for (let r = d * 0.55; r > 1; r -= 1.3) {
          const v = 90 + 110 * Math.abs(Math.sin(r * 0.55 + (cx + y) * 0.01));
          g.strokeStyle = `rgba(${v},${v},${v},.55)`;
          g.lineWidth = 1.2;
          g.beginPath();
          g.arc(cx, y, r, 0, Math.PI * 2);
          g.stroke();
        }
      }
    }
  });
  t.repeat.set(0.08, 0.08);
  return t;
}

export function sunburst() {
  return canvasTexture(512, (g, s) => {
    g.fillStyle = '#888';
    g.fillRect(0, 0, s, s);
    for (let a = 0; a < Math.PI * 2; a += 0.004) {
      const v = 100 + Math.random() * 90;
      g.strokeStyle = `rgba(${v},${v},${v},.35)`;
      g.beginPath();
      g.moveTo(s / 2, s / 2);
      g.lineTo(s / 2 + Math.cos(a) * s, s / 2 + Math.sin(a) * s);
      g.stroke();
    }
  });
}

export function engraving(lines: { ring: string; center: string }) {
  return canvasTexture(1024, (g, s) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    for (let r = 40; r < s / 2; r += 3) {
      const v = (Math.random() * 60 + 100) | 0;
      g.strokeStyle = `rgba(${v},${v},${v},.5)`;
      g.beginPath();
      g.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = '#303030';
    g.textAlign = 'center';
    g.font = '600 38px Inter, sans-serif';
    g.save();
    g.translate(s / 2, s / 2);
    const text = lines.ring;
    for (let i = 0; i < text.length; i++) {
      g.save();
      g.rotate((i / text.length) * Math.PI * 2);
      g.fillText(text[i]!, 0, -400);
      g.restore();
    }
    g.restore();
    g.strokeStyle = '#303030';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(s / 2, s / 2, 350, 0, Math.PI * 2);
    g.stroke();
    g.font = '300 64px Inter, sans-serif';
    g.fillText(lines.center, s / 2, s / 2 + 20);
  });
}

export function flowStripe() {
  const t = canvasTexture(256, (g, s) => {
    const grd = g.createLinearGradient(0, 0, s, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.7, 'rgba(255,220,150,.9)');
    grd.addColorStop(0.78, 'rgba(255,255,255,1)');
    grd.addColorStop(0.8, 'rgba(255,255,255,0)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  });
  return t;
}

// Numbers 1..31 around a circle at 0.87 of the texture radius, mirrored vertically so they read correctly from the dial side.
export function dateNumbers(count = 31) {
  return canvasTexture(2048, (g, s) => {
    g.fillStyle = '#f3f0e8';
    g.fillRect(0, 0, s, s);
    g.translate(s / 2, s / 2);
    g.scale(1, -1);
    g.fillStyle = '#1a1a1a';
    g.font = `600 ${s * 0.05}px Inter, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let d = 1; d <= count; d++) {
      g.save();
      g.rotate(((d - 1) / count) * Math.PI * 2);
      // Each date is printed turned a quarter turn so it reads upright once the ring brings it to 3 o'clock.
      g.translate(0, -(s / 2) * 0.87);
      g.rotate(-Math.PI / 2);
      g.fillText(String(d), 0, 0);
      g.restore();
    }
  }, true);
}
