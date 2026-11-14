<p align="center"><img src="public/og.jpg" alt="SankoSurvivors gameplay" width="720"></p>

# SankoSurvivors

Survive the SankoQuest world, build a ridiculous loadout, and take on the weekly ranked board.

Equipped Magician's, Warrior's and Power amulets use their original SankoQuest models on your character. Their existing bonuses are unchanged.

Owned Bun companions use SankoQuest’s original facial expressions while catching up, when your health is low, and in the rotating pet preview. Special head designs retain their original details; pets remain cosmetic.

**[Play SankoSurvivors](https://sankosurvivors.quest)** · **[Enter Grand Theft Sanko](https://gts.sankosurvivors.quest/)** · [Need for Sanko races](https://gts.sankosurvivors.quest/?mode=online) · [@dexedrne](https://x.com/dexedrne)

## Play

Adventure and Endless can offer one rare extra weapon or passive slot from level 10 when a row is full. It adds space for a later item, once per player per run; Strength or Prayer training can bring that row to 7 slots. Each co-op teammate can earn their own, and continuing a victory as Endless retains the same run bonus.

- **Adventure:** choose an adventurer and map, collect experience, pick upgrades and combine weapons with passives to evolve them. Casual upgrades have rarity and quality; weapon metal tiers and casket equipment are explained separately in the in-game Guide.
- **Endless:** keep the same live build after a normal casual victory, or start an Endless run. After normal upgrades are exhausted, level-ups can keep adding small stat boosts. Continuing a finished map requires the same open tab; a reload does not restore the running simulation.
- **Progress:** earn GP, equip gear, improve skills, complete quests and achievements, and bring a cosmetic pet. Connected eligible wallets can load owned Bun companions. Pets do not add ranked power.
- **Co-op:** invite a friend into a shared survival run. Both players use the shared run state; casual progress and rewards remain tied to the local player. Stand near a fallen teammate with a clear path and hold Revive for three seconds (F, controller B or the touch button). Moving, tumbling or taking damage resets progress. A completed revive restores 30% health; yellow markers show fallen teammates.
- **Boss / Raid and Fun:** practice Boss Trials, take on a Survival Raid, or try Slimer Invasion, Wizard Invasion and endless Castle Defence. These modes have their own rules and reward eligibility.
- **Weekly Ranked:** estimated prizes display two decimal places; actual rewards retain full precision. Everyone starts from the week's standard loadout. Paid entries use DMT on Arbitrum; the server replays recorded inputs against the matching archived rules. The Ranked panel shows the current map, fee, scoring, cutoff, pause allowance, prize rules and reward transactions. Read those before paying; historical weeks can use different rules. The developer wallet is excluded from prizes.

Current ranked uses one shared weekly board and pool for optional **1 DMT or 10 DMT** entries. A larger entry changes contribution weight; starting power, scoring and placement are identical. The house fee remains10%;90% enters the pool. Of that pool,80% rewards placement,10% follows eligible paid DMT and10% follows active simulation time. Completed server-accepted runs of at least30seconds earn participation; the top-five placement minimum stays3minutes. Existing eligible entries count, with no run cap. Refunded/rejected/unfinished runs and the developer wallet earn no participation. Old accepted runs whose input logs were already pruned keep their participation share reserved for owner review; placement payments are separate. These rules require the matching frontend, SQL19 and payout-worker activation; this branch is a private candidate, not a live-release announcement.

The eligible first-place wallet in week1Apache Normal has a separate, owner-funded20DMT bonus on top of the normal award. It is excluded from entry fees, the house fee, pool allocation and participation. No eligible winner leaves it reserved for review. The donation transaction is fixed and the worker verifies its canonical finalized funding before sending. Bonus support additionally requires owner-applied SQL20 and the matching API/worker; it remains private pending release.

- **Results:** inspect your full final build and save or copy a native-styled PNG card with item icons and level tracks. If image clipboard access is blocked, save the image to attach it. File sharing appears where the browser supports it; exporting an image does not submit a score or post anything.

The menu's **Guide** explains weapons, evolutions, caskets, gear, skills, food and controls. **Updates** lists changes with copy buttons. Use **More → Report a bug** to send feedback.

From ranked week 2, food stacks hold at most five portions per type. An extra pickup is eaten immediately. Stored food automatically heals before an otherwise fatal hit when enough food can save you, using the belt from left to right; manual eating still works. Beer, Pumpkin and Warp Shard are never used automatically. Earlier ranked weeks, casual and co-op keep their existing food rules.

## Controls and devices

| Action | Desktop |
| --- | --- |
| Move | WASD / arrow keys |
| Tumble | Space; current rules clear eligible low fences, buildings stay solid |
| Use belt item | 1–4 |
| Choose upgrade | 1–3 or arrows and Enter |
| Reroll / skip / banish | R / X / B on the upgrade screen |
| Enlarge map | Hold Tab during play |
| Pause | Escape or the Pause button below the minimap |
| Mute | M |

Touch controls and standard-mapped controllers are supported. Settings includes separate sound/music volume, graphics presets and detailed options. The device’s Reduce Motion preference suppresses camera shake while preserving the saved shake toggle. The installable PWA supports phone layouts and an optional Flex layout. Browser emulation does not guarantee every device's fullscreen, safe-area, audio or controller behavior.

Pause shows your current run's build, stats and active-effect timers. Phone players can zoom the camera with the +/− buttons in Pause, or pinch during play. In co-op, Pause stops your controls while the shared run continues. Quests has a Hide completed toggle and lists unfinished goals by progress.

## Saves and wallets

Casual progress is kept on the device. Optional wallet sign-in enables cloud progress synchronization; a wallet connection alone is not proof of a successful upload. The wallet panel shows cloud status and offers a manual save. Keep the current tab open if the game reports an unconfirmed upload or recoverable ranked submission.

WalletConnect and supported injected wallets connect from the original game page. Ranked payments, the optional DMT holder check, and Buy DMT are explicit separate actions. Buy DMT compares Arbitrum quotes and estimated gas; displayed estimates can change before a transaction. The calculator does not automatically split purchases. An Ethereum-to-Arbitrum bridge service is under investigation and is **not included**.

Grand Theft Sanko adds on-foot copper/tin/iron/coal mining, bronze, iron and steel smelting, craftable Bronze Short Swords, Bronze and Iron Pickaxes, full Bronze/Iron cosmetic armour sets and a Steel Helmet, banker storage and town shops. Bronze mines one ore in 2.5 seconds; Iron takes 2 seconds. Changing tools cancels the current attempt. Workshops show required bars and mining time; crafting quantities, prices and mining speeds are GTS adaptations. Open Backpack / I to equip head, chest, legs and boots; nearby hub players see the native armour, robe and sword. Its bounded inventory saves on the current device and origin, independently of Road Log, Survivors and wallets. Save errors retain the previous inventory. Armour is cosmetic; the bronze sword uses the existing safe-town/Wilderness combat rules.

Grand Theft Sanko and its Need for Sanko racing modes keep their own device-local Road Log and settings. Browser saves belong to each address: existing saves remain available at the [previous Racers link](https://sankosurvivors.quest/racers/); they are not migrated to the GTS subdomain. Its public hub has no ranked prizes and does not share Survivors progression. The separate Wavedash casual edition omits wallets, blockchain features and the website's ranked/cloud systems.

Online GTS players use a short buffer of confirmed server positions for steadier cars, walkers and map markers. Local driving remains predicted immediately. Brief buffering reduces packet jitter. Sustained missing server updates show a waiting warning and hold local movement until valid authority returns; an online race continues on the server during the interruption. Poor connections can still be visible.

## Development

Use Node.js and the pinned npm dependencies. In a development checkout:

```sh
npm ci
npm run dev
```

The public mirror excludes the supplied native asset collection and internal QA tools. A working development game needs those runtime assets and the Draco decoder; installing npm packages alone does not supply the world. Full verification uses a prepared owner checkout.

The owner handoff requires builds, tests and browser rendering on the `alexbl` build host. Follow the private handoff and QA guide, including the disposable database fixtures needed for the complete suite. Never copy secrets into a checkout or test output.

```sh
# On the build host, in a prepared isolated checkout:
nice -n 10 python3 qa-kit/full-tests.py
```

Authorized website releases use the prescribed independent build/verification hosts:

```sh
BUILD_HOST=alexbl VERIFY_HOST=t490 bash tools/deploy.sh
```

Changes to simulation/content/ranked rules or ground data require a new simulation archive. Existing paid runs must keep replaying on their original bundle. Database migrations are applied by the owner; money actions require explicit approval.

| Path | Purpose |
| --- | --- |
| `src/sim.js`, `src/content.js` | Deterministic combat and content |
| `src/render.js`, `src/main.js` | Native world rendering, menus and game loop |
| `src/run-build.js`, `src/run-card.js` | Detached final-build display and PNG drawing |
| `src/ranked.js`, `tools/vercel-api/sims/` | Recording, replay and historical rules |
| `src/game-modes.js` | Special mode definitions |
| `tools/vercel-api/` | Website APIs and admission checks |
| `tools/supabase/` | Owner-applied database functions |
| `tools/wavedash/` | Separate wallet-free casual edition |

## Credits

Made by [@dexedrne](https://x.com/dexedrne) for the Sanko community. SankoQuest art, models, music, sounds and characters belong to their respective creators and Sanko GameCorp; CrashOut kart assets retain their own notices. This repository does not grant ownership of those assets. Use original supplied assets and actual in-engine captures; generated artwork is not permitted in this project.

[Sanko Telegram](https://t.me/sankogamecorp) · [Sanko on X](https://x.com/SankoGameCorp)

Grand Theft Sanko now has more accurate south Greentown fence and house-wall clearance, with the same slightly smaller collision body for every kart. Need for Sanko uses matching server collision rules.

Grand Theft Sanko Garage includes the supplied CrashOut Auto Rifle, Gatling and Heavy Cannon for all fourteen stock karts. The local selection persists; mounted weapons use the existing combat rules and on-foot play keeps the Glock.

Grand Theft Sanko workshops offer **Make max**; the bank offers **Bank max** and **Take max** with the exact quantity that fits. Existing single-item controls remain. Device-local inventory rules and existing recipes/prices are preserved; the new pickaxe and armour recipes extend the same workshop.

## Guides and rendering

How to play includes the complete weapon/passive catalogue with original icons and descriptions, separate from permanent skills and worn gear. Enemy target metadata stays available off-screen while native rigs load on first visibility or death. This reduces hidden spawn allocation without changing combat rules. Ranked share text describes the current80% placing/20% participation prize allocation.

GTS starts world rendering after initial loading and blends its chase framing into reverse. Original kart and weapon assets use the existing bounded native-art cache; mutable world metadata still revalidates.
