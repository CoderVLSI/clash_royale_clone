#!/usr/bin/env python3
"""Composites the transparent Blender castle render (/tmp/lobby_fg.png) over a painted dusk sky with stars,
adds glow + vignette, and writes godot/assets/art/ui/lobby_bg.jpg."""
import os, random
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
fg = Image.open('/tmp/lobby_fg.png').convert('RGBA')
W, H = fg.size
# sky gradient: deep indigo at the top -> magenta -> warm orange at the horizon
stops = [(0.0, (14, 12, 48)), (0.35, (44, 28, 96)), (0.55, (128, 52, 120)), (0.68, (232, 112, 84)), (0.78, (255, 176, 96)), (1.0, (80, 40, 70))]
sky = np.zeros((H, W, 3), np.float32)
for y in range(H):
    t = y / (H - 1)
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t0 <= t <= t1:
            f = (t - t0) / (t1 - t0)
            sky[y, :] = [c0[i] + (c1[i] - c0[i]) * f for i in range(3)]
            break
im = Image.fromarray(sky.astype(np.uint8)).convert('RGBA')
d = ImageDraw.Draw(im)
rng = random.Random(3)
for _ in range(120):
    x, y = rng.randrange(W), rng.randrange(0, int(H * 0.42))
    r = rng.choice([1, 1, 1, 2])
    a = rng.randint(120, 255)
    d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, a))
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((W * 0.62, H * 0.07, W * 0.62 + 90, H * 0.07 + 90), fill=(255, 245, 220, 255))   # moon
im = Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(14)))
im = Image.alpha_composite(im, glow)
im = Image.alpha_composite(im, fg)
# bloom from bright pixels
rgb = im.convert('RGB')
a = np.asarray(rgb).astype(np.float32)
bright = np.clip((a - 190) * 2.0, 0, 255).astype(np.uint8)
bloom = Image.fromarray(bright).filter(ImageFilter.GaussianBlur(18))
out = np.clip(a + np.asarray(bloom).astype(np.float32) * 0.9, 0, 255)
# vignette + darken the lower third so UI text stays readable
yy, xx = np.mgrid[0:H, 0:W]
vig = 1.0 - 0.45 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H * 0.45) / (H * 0.62)) ** 2) * 0.55
low = 1.0 - 0.35 * np.clip((yy / H - 0.62) / 0.38, 0, 1)
out = out * np.clip(vig, 0.4, 1)[..., None] * low[..., None]
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(os.path.join(ROOT, 'godot', 'assets', 'art', 'ui', 'lobby_bg.jpg'), quality=84, optimize=True)
print('lobby_bg.jpg written', W, H)
