#!/usr/bin/env python3
"""Fill the colour of fully transparent pixels from their nearest visible neighbours (alpha stays 0), so a texture
sampled with linear filtering in the game no longer pulls black into its edges (dark fringes on dropped items).
Usage: tools/alpha-bleed.py file.png ..."""
import sys
from PIL import Image

def bleed(path, passes=12):
    im = Image.open(path).convert('RGBA'); w, h = im.size; px = im.load()
    known = [[px[x, y][3] > 0 for y in range(h)] for x in range(w)]
    for _ in range(passes):
        new = []
        for x in range(w):
            for y in range(h):
                if known[x][y]: continue
                r = g = b = n = 0
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        X, Y = x + dx, y + dy
                        if 0 <= X < w and 0 <= Y < h and known[X][Y]:
                            c = px[X, Y]; r += c[0]; g += c[1]; b += c[2]; n += 1
                if n: new.append((x, y, (r // n, g // n, b // n, 0)))
        if not new: break
        for x, y, c in new: px[x, y] = c; known[x][y] = True
    im.save(path, optimize=True)

for p in sys.argv[1:]: bleed(p); print('bled', p)
