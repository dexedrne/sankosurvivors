"""Merge ground captures saved from the live game (Downloads/sankoquest-terrain-*.json) into
public/assets/world/terrain-tiles.json, keeping a copy of each raw capture in reference/terrain-captures/."""
import glob, json, os, shutil, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'reference/terrain-captures/terrain-tiles.json')
KEEP = os.path.join(ROOT, 'reference/terrain-captures')
files = sys.argv[1:] or sorted(glob.glob(os.path.expanduser('~/Downloads/**/sankoquest-terrain-*.json'), recursive=True))
cur = json.load(open(OUT))
tiles = {(t['cx'], t['cz']): t['h'] for t in cur['tiles']}
before = set(tiles)
os.makedirs(KEEP, exist_ok=True)
for f in files:
    d = json.load(open(f))
    for t in d['tiles']:
        if len(t['h']) == 4096: tiles[(t['cx'], t['cz'])] = t['h']
    dst = os.path.join(KEEP, os.path.basename(f))
    if not os.path.exists(dst): shutil.copy(f, dst)
cur['tiles'] = [{'cx': k[0], 'cz': k[1], 'h': v} for k, v in sorted(tiles.items())]
json.dump(cur, open(OUT, 'w'), separators=(',', ':'))
new = sorted(set(tiles) - before)
print(f'{len(tiles)} tiles total ({len(tiles)}/64 of the world), {len(new)} new: {new}')
