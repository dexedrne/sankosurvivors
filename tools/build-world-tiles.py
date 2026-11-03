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
# SankoQuest keeps its underground areas off the edge of the overworld (the Hidden Oasis under Apache town is tiles
# 0-10 and 1-10, z 640-704). Our world is 512 across, so the oasis takes the place of two empty sea tiles in the far
# south-west corner (no props, nothing in sight of any map): world z 448-512, the same x. Its scene shifts by OASIS_DZ.
PLACE = {(0, 7): (0, 10), (1, 7): (1, 10)}
OASIS_DZ = -192
def tile(tx, tz, kind):
    tx, tz = PLACE.get((tx, tz), (tx, tz))
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
# The oasis as one arena: SankoQuest joins its rooms with a locked door and a way up to the factory floor that our game
# does not have, so the door into the entrance room stays open (OPEN_CELLS) and a ramp climbs from the cave (height ~1)
# to the factory (~5.5) where the two are a single cell apart (vertex rows RAMP_Z, x RAMP_X).
OPEN_CELLS = [(17, z) for z in range(468, 471)] + [(68, z) for z in range(472, 475)]
RAMP_X, RAMP_Z = (60, 70), range(472, 476)
for j in RAMP_Z:
    h0, h1 = H[j * 513 + RAMP_X[0]], H[j * 513 + RAMP_X[1]]
    for i in range(RAMP_X[0], RAMP_X[1] + 1):
        t = (i - RAMP_X[0]) / (RAMP_X[1] - RAMP_X[0]); H[j * 513 + i] = h0 + (h1 - h0) * t * t * (3 - 2 * t)
# Outside its walls an underground area is nothing (black, blocked cells): in SankoQuest you see darkness there, so our
# copy drops into a deep pit the fog swallows. Only vertices whose four cells are all nothing go down; the floor's edge stays.
VOID_Y = -40
PX = {k: (tile(*k, 'diffuse').load(), tile(*k, 'nav').load()) for k in PLACE}
def void(i, j):  # world cell (i, j): nothing there? (cells outside the placed tiles count as nothing)
    k = (i // 64, j // 64)
    if i < 0 or j < 0 or k not in PX: return True
    dif, nav = PX[k]; a, b = i % 64, j % 64
    return dif[a, b][:3] == (0, 0, 0) and nav[a, b][0] > 127
for (tx, tz) in PLACE:
    for j in range(64 * tz, 64 * tz + 65):
        for i in range(64 * tx, 64 * tx + 65):
            if all(void(i + di, j + dj) for di in (-1, 0) for dj in (-1, 0)): H[j * 513 + i] = VOID_Y
open(os.path.join(OUT, 'height.bin'), 'wb').write(struct.pack('<%df' % len(H), *H))
for kind in ('diffuse', 'overlay', 'nav'):
    big = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    for tx in range(8):
        for tz in range(8):
            im = tile(tx, tz, kind)
            if im: big.paste(im, (64 * tx, 64 * tz))
    if kind == 'nav':
        for c in OPEN_CELLS: big.putpixel(c, (0, 0, 0, 255))
    big.save(os.path.join(OUT, f'{kind}.png'))
print('heights from', len(grids), 'tiles; maps written to', OUT)
