# python3 tools/draw-rings.py public/assets/ui/items
# Draw the six ring icons (original items for SankoQuest Survivors): 64x64 pixel art, doubled to 128x128, transparent,
# dark outline and soft shading like SankoQuest's item icons.
import math, sys
from PIL import Image

OUT = sys.argv[1]
OUTLINE = (26, 18, 12, 255)

def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (255,)

def ring(band, gem=None, studs=False, thick=False, glow=None):
    W = 64
    px = [[None] * W for _ in range(W)]
    cx, cy = 32, 39
    orx, ory = (21, 15) if not thick else (22, 16)
    irx, iry = (13, 8) if not thick else (12, 7)
    for y in range(W):
        for x in range(W):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            o = (dx / orx) ** 2 + (dy / ory) ** 2
            i = (dx / irx) ** 2 + ((dy + 2) / iry) ** 2  # the hole sits a little high: we look down on the ring
            if o <= 1 and i > 1:
                a = math.atan2(dy, dx)
                # light from the top left; the far (top) half shows the band's inside, a shade darker
                k = 0.78 + 0.42 * math.cos(a - math.radians(-135))
                if dy < -1: k *= 0.78
                # a bright rim line along the outer top-left edge
                if o > 0.80 and math.cos(a - math.radians(-135)) > 0.55: k = 1.35
                px[y][x] = shade(band, k)
    if studs:
        for ang in (200, 250, 290, 340):
            sx, sy = cx + 17 * math.cos(math.radians(ang)) * 1.0, cy + 12.5 * math.sin(math.radians(ang)) * -1.0
            for y in range(W):
                for x in range(W):
                    if (x + 0.5 - sx) ** 2 + (y + 0.5 - sy) ** 2 <= 4.2:
                        px[y][x] = shade(band, 1.45 if (x + 0.5 - sx) + (y + 0.5 - sy) < 0 else 0.7)
    if gem:
        gx, gy, gr = cx, cy - 15, 8.2
        # the setting: a darker collar under the stone
        for y in range(W):
            for x in range(W):
                d = math.hypot(x + 0.5 - gx, (y + 0.5 - gy - 2) * 1.15)
                if d <= gr + 1.6: px[y][x] = shade(band, 0.62)
        for y in range(W):
            for x in range(W):
                dx, dy = x + 0.5 - gx, y + 0.5 - gy
                d = math.hypot(dx, dy * 1.1)
                if d <= gr:
                    k = 0.65 + 0.55 * (1 - (dy + gr) / (2 * gr)) + 0.12 * (-dx / gr)
                    px[y][x] = shade(gem, k)
        # facet highlight (top left) and a small spark
        for (hx, hy, r) in ((gx - 3, gy - 3, 2.4), (gx + 3.5, gy + 3, 1.0)):
            for y in range(W):
                for x in range(W):
                    if math.hypot(x + 0.5 - hx, y + 0.5 - hy) <= r:
                        px[y][x] = (255, 255, 255, 235) if r > 1.5 else shade(gem, 1.6)
    # the outline: every empty pixel that touches the item
    out = [row[:] for row in px]
    for y in range(W):
        for x in range(W):
            if px[y][x] is None and any(0 <= x + dx < W and 0 <= y + dy < W and px[y + dy][x + dx] is not None for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                out[y][x] = OUTLINE
    img = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    for y in range(W):
        for x in range(W):
            if out[y][x] is not None: img.putpixel((x, y), out[y][x])
    if glow:  # a faint halo behind the stone (the Ember Band's warmth)
        halo = Image.new('RGBA', (W, W), (0, 0, 0, 0))
        for y in range(W):
            for x in range(W):
                d = math.hypot(x + 0.5 - 32, y + 0.5 - 24)
                if 9 < d < 14 and out[y][x] is None: halo.putpixel((x, y), glow[:3] + (int(90 * (14 - d) / 5),))
        img = Image.alpha_composite(halo, img)
    return img.resize((128, 128), Image.NEAREST)

GOLD, SILVER, BRONZE, IRON = (214, 168, 64), (186, 192, 198), (176, 112, 58), (112, 112, 118)
RINGS = {
    'Ember_Band': dict(band=GOLD, gem=(222, 62, 30), glow=(255, 120, 40)),
    'Tidewater_Ring': dict(band=SILVER, gem=(40, 132, 206)),
    'Featherstep_Ring': dict(band=BRONZE, gem=(70, 178, 82)),
    'Lodestone_Ring': dict(band=IRON, gem=(64, 58, 70)),
    'Quickdraw_Ring': dict(band=SILVER, gem=(236, 196, 44)),
    'Bulwark_Band': dict(band=IRON, studs=True, thick=True),
}
for name, spec in RINGS.items():
    ring(**spec).save(f'{OUT}/item_{name}.png')
    print('wrote', name)
