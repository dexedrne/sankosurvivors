"""Stitch SankoQuest's own ground tiles (cdn.sankoquest.com/public/map/tiles/{x}-{z}-{kind}.png, 8x8 tiles of 64x64)
into whole-world maps for the game:
  height.bin   513x513 float32 heights (world units), vertex (i,j) at x=i, z=j
  diffuse.png  512x512 RGBA: rgb ground colour, alpha 255 = colour, 1..12 = one of the game's ground textures
  overlay.png  512x512 RGBA overlay painting (paths, floors) as the game stores it
  nav.png      512x512 walkability as the game stores it
Heights: grey value / 255 * 20; a tile's vertex (a,b) sits at x = 64*tx + a*64/63."""
import os, struct, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'reference/map-tiles'); OUT = os.path.join(ROOT, 'public/assets/world/tiles')
os.makedirs(OUT, exist_ok=True)
def tile(tx, tz, kind):
    p = os.path.join(SRC, f'{tx}-{tz}-{kind}.png')
    return Image.open(p).convert('RGBA') if os.path.exists(p) else None
# heights: bilinear from each tile's 64x64 grid onto the 513x513 world grid
H = [0.0] * (513 * 513)
grids = {}
for tx in range(8):
    for tz in range(8):
        im = tile(tx, tz, 'terrain')
        if im: px = im.load(); grids[(tx, tz)] = [[px[a, b][0] / 255 * 20 for a in range(64)] for b in range(64)]
for j in range(513):
    for i in range(513):
        tx, tz = min(7, i // 64), min(7, j // 64)
        g = grids.get((tx, tz))
        if not g: continue
        u = (i - 64 * tx) * 63 / 64; v = (j - 64 * tz) * 63 / 64
        a, b = int(u), int(v); fu, fv = u - a, v - b; a1, b1 = min(63, a + 1), min(63, b + 1)
        H[j * 513 + i] = (g[b][a] * (1 - fu) + g[b][a1] * fu) * (1 - fv) + (g[b1][a] * (1 - fu) + g[b1][a1] * fu) * fv
open(os.path.join(OUT, 'height.bin'), 'wb').write(struct.pack('<%df' % len(H), *H))
for kind in ('diffuse', 'overlay', 'nav'):
    big = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    for tx in range(8):
        for tz in range(8):
            im = tile(tx, tz, kind)
            if im: big.paste(im, (64 * tx, 64 * tz))
    big.save(os.path.join(OUT, f'{kind}.png'))
print('heights from', len(grids), 'tiles; maps written to', OUT)
