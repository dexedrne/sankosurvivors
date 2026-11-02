"""Turn the live-scene dumps (reference/entities/dump-*.txt: "kind sig x,y,z,yawDeg,scale;...") into
public/assets/world/entities.json: static resource nodes by model, practice dummies and townsfolk spots.
Models are matched by the merged vertex count the game renders them with."""
import glob, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIG = {'2091': 'tree.glb', '1095': 'oak.glb', '2593': 'pine.glb', '1691': 'cherry.glb', '1255': 'dracaena.glb', '161': 'tree5.glb',
       '874': 'Wheat.glb', '1721': 'flax.glb', '2296': 'furnace.glb', '339': 'anvil.glb', '1009': 'slotmachine.glb', '108': 'ore'}
ORES = ['copper.glb', 'tin.glb', 'iron.glb', 'coal.glb']
nodes, dummies, folk, seen = {}, [], [], set()
for f in sorted(glob.glob(os.path.join(ROOT, 'reference/entities/dump-*.txt'))):
    for line in open(f):
        parts = line.strip().split(' ')
        if len(parts) < 3: continue
        kind, sig, rows = parts[0], parts[1], parts[2]
        for i, r in enumerate(rows.split(';')):
            v = r.split(',')
            if len(v) < 5: continue
            x, y, z, yaw, s = float(v[0]), float(v[1]), float(v[2]), float(v[3]), float(v[4])
            if x == 0 and z == 0: continue
            key = (kind, round(x, 1), round(z, 1))
            if key in seen: continue
            seen.add(key)
            if kind == 'npc_combat_dummy': nodes.setdefault('practice_dummy.glb', []).append([round(x, 2), round(z, 2), yaw, 1.0]); continue
            if re.search(r'guard', kind, re.I): continue  # Greentown's guards just stood about; left out
            if kind.startswith('npc_player') or kind in ('npc_tutorial', 'npc_elder', 'npc_fighting', 'npc_apache', 'npc_paya', 'npc_sphinxguard') or re.match(r'^[0-9a-f]{8}_', kind):
                folk.append([x, z, yaw, kind]); continue
            if kind.startswith('npc_'): continue  # animals and monsters: the game spawns those itself
            m = SIG.get(sig.split('_')[0] if '_' not in sig else sig)
            if not m: continue
            if m == 'ore':
                named = next((o for o in ('coal', 'iron', 'tin', 'copper') if o in kind), None)
                m = f'{named}.glb' if named else ORES[(int(x * 7 + z * 13)) % 2]  # unnamed rocks: tin and copper side by side
            nodes.setdefault(m, []).append([round(x, 2), round(z, 2), yaw, s])
# Tutorial Island's guides, by where they stand (capture walk 11/2): Survival Sankson by the practice dummies, Boaty
# (the Spiky Boatman) by the shore east of them, and Star ("Star's Tutorial") on the hilltop in the middle.
for f in folk:
    if f[3] == 'npc_tutorial': f[3] = 'npc_survival_sankson' if f[0] < 80 else 'npc_star' if f[1] > 240 else 'npc_boatman'
# the dump groups Tutorial Island's trees under one kind; the per-entity capture says tree-tutorial-15 is an oak
for m in ('tree.glb',):
    for row in list(nodes.get(m, [])):
        if abs(row[0] - 76.5) < 0.2 and abs(row[1] - 226.5) < 0.2:
            nodes[m].remove(row); nodes.setdefault('oak.glb', []).append(row)
out = {'note': 'From the live SankoQuest scene: resource nodes (by model), practice dummies, townsfolk spots. x,z world; yaw degrees; s scale.',
       'nodes': nodes, 'dummies': dummies, 'folk': folk}
json.dump(out, open(os.path.join(ROOT, 'public/assets/world/entities.json'), 'w'), separators=(',', ':'))
print({k: len(v) for k, v in nodes.items()}, 'dummies', len(dummies), 'folk', len(folk))
