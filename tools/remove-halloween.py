#!/usr/bin/env python3
"""Take SankoQuest's Halloween ruin out of the ground tiles (owner 3 Nov: "by light house u can remove the halloween zone
from the game"). The event left its floor (haunted flagstone, overlay class 12, x 296-307 z 96-112), a dark purple paint
with a grey stone ring round it (x 291-311, z 92-116), and the ruin's walls in the walk map, but the ruin itself is not in
our world: a spooky patch with invisible walls. This repaints it with the surrounding grass and opens the walls.
Run on public/assets/world/tiles (build-world-tiles.py runs it too). Idempotent."""
import os, random, sys
from PIL import Image

BOX = (291, 92, 311, 116)          # x0, z0, x1, z1 (inclusive): the painted ground
RUIN = (296, 96, 307, 112)         # the ruin's floor and walls
HALLOWEEN = {(43, 35, 47), (57, 54, 48)}
GRASS = [(80, 106, 56), (65, 82, 48), (74, 98, 52)]

def run(d):
    dif = Image.open(os.path.join(d, 'diffuse.png')).convert('RGBA'); ov = Image.open(os.path.join(d, 'overlay.png')).convert('RGBA'); nav = Image.open(os.path.join(d, 'nav.png')).convert('RGBA')
    D, O, N = dif.load(), ov.load(), nav.load(); rnd = random.Random(1031); n = 0
    for z in range(BOX[1], BOX[3] + 1):
        for x in range(BOX[0], BOX[2] + 1):
            if D[x, z][:3] in HALLOWEEN: D[x, z] = GRASS[rnd.randrange(len(GRASS))] + (255,); n += 1
            if O[x, z][0] == 12: O[x, z] = (0, 0, 0, 255)
            if RUIN[0] <= x <= RUIN[2] and RUIN[1] <= z <= RUIN[3] and (N[x, z][1] & 64) and N[x, z][1] != 255: N[x, z] = (0, 0, 0, 255)
    dif.save(os.path.join(d, 'diffuse.png')); ov.save(os.path.join(d, 'overlay.png')); nav.save(os.path.join(d, 'nav.png'))
    return n

if __name__ == '__main__':
    d = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public/assets/world/tiles')
    print('Halloween ruin removed:', run(d), 'ground cells repainted')
