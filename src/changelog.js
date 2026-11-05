// What's new, newest first. Shown from the Updates button on the title screen.
export const CHANGELOG = [
  {
    version: '0.44.30', date: '5 Nov 2026', title: 'Finish interrupted run saves',
    items: ['Completed-run rewards now save together. If browser storage interrupts the save, retry before playing or uploading progress.'],
  },
  {
    version: '0.44.29', date: '5 Nov 2026', title: 'Tumble and build choices',
    items: ['A sole healing reward now continues automatically. Evolutions have alternate passive pairings, listed on upgrade cards.', 'Tumble with Space, controller A or the touch button. It crosses reachable low fences, keeps buildings solid and recharges in five seconds. No added invincibility. Ranked week 0 keeps its original rules and cosmetic jump.'],
  },
  {
    version: '0.44.28', date: '5 Nov 2026', title: 'Half-fold DS layout',
    items: ['Choose Auto, Standard or DS in Settings. DS puts the game above the fold, with movement, the minimap and upgrade choices below.'],
  },
  {
    version: '0.44.27', date: '5 Nov 2026', title: 'Upload completed runs sooner',
    items: ['With cloud save on, finishing a run now requests an upload immediately instead of waiting for the normal save timer.'],
  },
  {
    version: '0.44.26', date: '5 Nov 2026', title: 'Clearer progress-loading messages',
    items: ['Progress imports now distinguish a game that is not ready from an unfinished run or wallet action.'],
  },
  {
    version: '0.44.25', date: '5 Nov 2026', title: 'Imported casket choice, shown correctly',
    items: ['Imports that only change auto-alch now refresh an open Settings panel to show the chosen On or Off option.'],
  },
  {
    version: '0.44.24', date: '5 Nov 2026', title: 'Keep the name you are typing',
    items: ['Background cloud merges now preserve edited leaderboard names when the main menu refreshes.'],
  },
  {
    version: '0.44.23', date: '5 Nov 2026', title: 'Mute every music track',
    items: ['Mute, music volume and pause now apply to outgoing music as well as the current song.'],
  },
  {
    version: '0.44.22', date: '5 Nov 2026', title: 'Imported settings, ready to play',
    items: ['Imported display and sound settings now apply before your next run, even when starting cancels the planned reload.'],
  },
  {
    version: '0.44.21', date: '5 Nov 2026', title: 'Reliable sound controls',
    items: ['Fixed a loading failure when sound settings could not be read. Mute and unmute now work even when preferences cannot be saved.'],
  },
  {
    version: '0.44.20', date: '5 Nov 2026', title: 'Safer progress codes',
    items: ['Invalid progress codes are refused before replacing your save. Damaged saved fields no longer stop the game loading.'],
  },
  {
    version: '0.44.19', date: '5 Nov 2026', title: 'Safe graphics settings',
    items: ['Fixed a loading failure caused by malformed saved graphics settings. Valid display options and saved progress are preserved.'],
  },
  {
    version: '0.44.18', date: '5 Nov 2026', title: 'Hear the action again',
    items: ['Fixed missing hit, pickup and reward sounds. Your sound and music volume settings still work separately.'],
  },
  {
    version: '0.44.17', date: '5 Nov 2026', title: 'Finish wallet prompts safely',
    items: ['Updates, progress imports and save recovery wait for open wallet prompts, even after switching wallets.'],
  },
  {
    version: '0.44.16', date: '5 Nov 2026', title: 'Cloud saves recover cleanly',
    items: ['Cloud saves now stop when browser storage cannot save safely, and keep a recovery backup before merging progress.', 'Progress merged from another device updates your menu without changing a run already in progress.'],
  },
  {
    version: '0.44.15', date: '5 Nov 2026', title: 'Your loaded adventurer and map',
    items: ['Loaded progress now refreshes your adventurer, map and name before the next run, even if you cancel the page reload.'],
  },
  {
    version: '0.44.14', date: '5 Nov 2026', title: 'Update without interrupting a run',
    items: ['Starting a run cancels pending page updates and progress-import reloads. Finish wallet actions before using Update.', 'Progress imports keep a recovery backup until every change has saved.'],
  },
  {
    version: '0.44.13', date: '4 Nov 2026', title: 'Room for menu labels',
    items: ['Mobile menu buttons have more room for Leaderboard and translated labels.'],
  },
  {
    version: '0.44.12', date: '4 Nov 2026', title: 'Keep runs uninterrupted',
    items: ['Cloud progress only loads between runs. Starting a run stops delayed cloud loads and reloads while earned progress keeps saving.'],
  },
  {
    version: '0.44.11', date: '4 Nov 2026', title: 'Connect from this game',
    items: ['WalletConnect keeps your connection in this game while you approve in your wallet app. Return here after approving.'],
  },
  {
    version: '0.44.10', date: '4 Nov 2026', title: 'Cloud saves follow your choice',
    items: ['Cloud sign-in stops when your wallet choice changes. Your existing save stays in place until you choose which progress to keep.'],
  },
  {
    version: '0.44.9', date: '4 Nov 2026', title: 'Keep the quoted minimum',
    items: ['DMT buys refuse a swap that allows less than the minimum shown in your quote.'],
  },
  {
    version: '0.44.8', date: '4 Nov 2026', title: 'Safer DMT buying',
    items: ['Buys stop before sending when your wallet choice changes. Old quotes cannot use another wallet’s Buy button.', 'Known transaction links stay visible when receipt checks fail. Unconfirmed sends ask you to check wallet activity before buying again.'],
  },
  {
    version: '0.44.7', date: '4 Nov 2026', title: 'Reconnect without waiting',
    items: ["Disconnect frees the game's wallet picker while an older reply is pending. Old replies cannot overwrite status or unlock a newer request."],
  },
  {
    version: '0.44.6', date: '4 Nov 2026', title: 'Keep your wallet choice',
    items: ['Delayed wallet responses respect a newer wallet choice or Disconnect. Invalid account responses are refused.'],
  },
  {
    version: '0.44.5', date: '4 Nov 2026', title: 'Wallet menu controls',
    items: ['Keyboard and controller shortcuts stay in the wallet or cloud-save choice panel instead of starting a run behind it. Back from the wallet returns to the previous menu.'],
  },
  {
    version: '0.44.4', date: '4 Nov 2026', title: 'Stronger payment checks',
    items: ['Ranked payments stay saved while inconsistent chain receipts are checked again.'],
  },
  {
    version: '0.44.3', date: '4 Nov 2026', title: 'Keep every character',
    items: ['Casual names and bug reports keep accented letters and emoji when a network request arrives in pieces.'],
  },
  {
    version: '0.44.2', date: '4 Nov 2026', title: 'A smoother Sankson walk',
    items: ["Sankson's right knee bends naturally when he walks."],
  },
  {
    version: '0.44.1', date: '4 Nov 2026', title: 'More reliable bug reports',
    items: ['Bug reports keep your message when optional diagnostic settings cannot be read.'],
  },
  {
    version: '0.44', date: '4 Nov 2026', title: 'Move safely after rewards',
    items: ['On mobile, a held movement drag survives level-up and gear choices. If you lift your thumb to choose, the fight waits until you drag again.', 'Boss warnings stay frozen while you get your movement back. No boss damage or ranked rules changed.'],
  },
  {
    version: '0.43.3', date: '4 Nov 2026', title: 'Clearer request handling',
    items: ['Malformed score and sign-in fields receive a clear refusal. Bug reports keep valid text when optional details are unreadable.'],
  },
  {
    version: '0.43.2', date: '4 Nov 2026', title: 'Wallet security maintenance',
    items: ['Stricter wallet sign-in checks, with existing progress and ranked runs preserved.'],
  },
  {
    version: '0.43.1', date: '4 Nov 2026', title: 'Know your starting bonuses',
    items: ['Skills and Gear show the casual enemy scaling from your saved ranks and starting equipment.', 'The menus explain the existing cap and how gear counts. Ranked keeps its equal starts.'],
  },
  {
    version: '0.43', date: '4 Nov 2026', title: 'Clearer ranked prize estimates',
    items: ['Ranked pools and estimated prizes keep their exact DMT amounts, including the last winner’s rounding dust.', 'Unfilled places show their rollover. Incoming rollover appears when the previous race is settled; pending rollover is labelled separately.', 'Prize displays describe the current standings before review. Unavailable pool data no longer appears as an empty pot.'],
  },
  {
    version: '0.42', date: '4 Nov 2026', title: 'Every level counts',
    items: [
      'Collecting several levels at once keeps every earned upgrade. Choices queue until you pick, skip or time out.',
      'Killed enemies stop moving and dealing contact damage immediately. Forward spawns follow your movement direction.',
      'Cheese joins early food drops, using the native SankoQuest icon. Food feedback shows the health actually restored.',
      'Slimes burst into native blue Slime Blob flecks, with a smaller burst on Reduced effects.',
      'Ranked timestamp ties now preserve the full finish precision. Week 0 gameplay remains unchanged.',
    ],
  },
  {
    version: '0.41.1', date: '4 Nov 2026', title: 'Lighter effects between runs',
    items: ['Spells, thrown weapons and shrine effects now release their temporary graphics resources when they finish or a run resets.'],
  },
  {
    version: '0.41', date: '4 Nov 2026', title: 'Better phone menus and ranked recovery',
    items: [
      'Compact Adventurer and Map rows expand into full-width phone choices, with larger cards and readable names.',
      'The installed app paints the game to the bottom edge, with controls kept clear of the home indicator.',
      'Rabby joins the phone wallet choices. Opening a wallet app returns to the connection panel; tap Connect there to continue.',
      'Interrupted ranked submissions keep your saved run available to retry, including after a server error.',
      'Retries recover the same result without counting a run twice. A server interruption can take up to 15 minutes to recover.',
      'Stronger validation of ranked submissions and more reliable payment checks.',
    ],
  },
  {
    version:'0.40.5', date:'4 Nov 2026', title:'More room to play',
    items:['A compact phone menu gives the adventurer more room. Play and the footer scroll together, clear of the home indicator.', 'The title preview stands in a clear village spot. Phone menu controls have larger touch targets.', 'The installed app uses SankoQuest’s native Air Shard icon.', 'Stronger entry-payment recovery and safer wallet chain checks. Interrupted restart checks keep your saved run.', 'Cloud sign-in ignores superseded sessions.', 'Character resources and visual effects clear between runs. Reduced effects preserve boss attack warnings.'],
  },
  {
    version:'0.40.4', date:'4 Nov 2026', title:'Keep your best runs',
    items:['Personal bests now use victories, whole seconds survived and kill-count ties consistently.', 'Cloud sync keeps the strongest personal record for each map and mode across devices.', 'The new-best message follows the same rules as the saved record.'],
  },
  {
    version:'0.40.3', date:'4 Nov 2026', title:'Clearer ranked targets',
    items:['The ranked chase display now counts kills correctly when equal kills per minute wins on total kills.', 'Chase positions are labelled against the board at run start. KPM runs show the three-minute minimum before estimating a place.'],
  },
  {
    version:'0.40.2', date:'3 Nov 2026', title:'SankoSurvivors',
    items:['The language picker now matches the game buttons, with a visible keyboard focus outline.', 'Updated title branding to SankoSurvivors.'],
  },
  {
    version: '0.40.1', date: '3 Nov 2026', title: 'More languages',
    items: [
      'Choose English, Türkçe, Español or Filipino on the title screen or in Settings. This device remembers your choice.',
      'Turkish, Spanish and Filipino text for menus, upgrades, quests, run results, ranked rules, wallet screens and cloud saves.',
      'Player names, item saves, payment amounts and wallet signature messages stay unchanged.',
      'More reliable payment and server checks during upstream outages.',
    ],
  },
  {
    version: '0.40', date: '3 Nov 2026', title: 'More reliable cloud saves',
    items: [
      'Cloud saves retry temporary upload failures automatically while the game is open. Your progress stays saved on this device.',
      'Save now confirms success only after your progress reaches the server. Failed initial uploads show that the save is still pending.',
      'Open your wallet and turn on cloud save with a free signature on each device to sync your progress after runs.',
    ],
  },
  {
    version: '0.39', date: '3 Nov 2026', title: 'Another security check',
    items: [
      'Casual leaderboards show your best run per name. Repeated attempts no longer fill the board.',
      'Improved validation of leaderboard tickets and wallet cloud-save sessions.',
    ],
  },
  {
    version: '0.38', date: '3 Nov 2026', title: 'Warp Shards and boss slams',
    items: [
      'Warp Shards and Shrines of Magic pull distant experience toward you instead of pushing it away.',
      'Defeating a boss cancels its pending ground slams. Other bosses and meteor showers keep their attacks.',
      'These fixes apply to casual runs and ranked from next week. This week’s ranked gameplay stays the same.',
    ],
  },
  {
    version: '0.37', date: '3 Nov 2026', title: 'Security update',
    items: [
      'A security update: stronger protection for ranked runs, entry payments, prizes, the DMT buy and cloud saves.',
      'If a game update ever cuts a ranked run short, that entry now starts again for free instead of being lost.',
      'Updates that change ranked now wait until nobody is in the middle of a ranked run.',
      'Ranked fair play: runs must be played live by a person. Bot, script or tool-assisted runs, and runs rewound to an earlier save, are disqualified and their prizes held. Resuming after a reload is fine.',
    ],
  },
  {
    version: '0.36', date: '3 Nov 2026', title: 'Ranked is endless, up to two hours',
    items: [
      'Ranked runs are endless from today. Bosses keep coming until you fall, and the hunt is over at 2:00:00.',
      'This week (to Monday 9 Nov) ranks by how long you survive, then kills. Runs already sent this week keep their times.',
      'From Monday 9 Nov your ranked score is kills per minute (kills × 60 ÷ seconds survived). A run must last 3:00 to place. Ties go to more kills, then the earlier finish.',
      'From Monday 9 Nov, a Hard ranked race: the same weekly map on hard rules, 1.5 DMT a run, with its own pot and board. The same top 5 split, and unclaimed places roll over into next week’s Hard pot.',
      'The Ranked panel and the leaderboard get a Normal / Hard switch showing each race’s price, pot, prizes and standings.',
      'Cloud save: open the wallet and turn on cloud save (one free signature per device). Your coins, skills, gear, quests and cleared maps follow your wallet to your laptop, desktop and phone. Playing on two at once? What each one earned is added together.',
      'The Gear panel lists every piece for each slot. Smith a metal piece into the next metal with coins: Bronze Helmet into Iron, up to Runite (400 to 7,000 coins). The new piece is worn if the old one was, and keeps its reinforcement.',
      'No limit on ranked runs: play as many as you like each week. Still one wallet per player.',
      'A long run takes a few minutes to check when you send it: keep the page open until it says accepted.',
      'Past the first hour the clock shows hours too (1:05:30).',
      'Settings, Sound: separate sliders for sound effects and music (arrow keys or a controller move them too).',
      'Dropped items no longer show a dark box around them (ambient occlusion and depth of field now leave sprites out).',
      'Bones on the ground are 10% bigger.',
      'Mushrooms, daisies, grass and path stones are their real size again (the smaller-download change had made mushrooms huge and the rest too small).',
      'The Star Wizard and the Star townsman face the way they walk, shoes and all. The swamp’s dead trees and the old ruins no longer float above the ground.',
      'The baseball is baseball-sized in flight (it was drawn about twice too big; it hits the same).',
      'The Shard Staff casts SankoQuest’s own spells as it levels: Air, Water, Earth and Fire Missile, then Air and Water Blast, and Fire Blast once it evolves. Built from the game’s own spell code: the Blast glow with its white-hot core and pulsing ring, the impact flash and burst, the trail, and the flight height.',
      'The top right shows the GP a run has earned so far, next to monsters slain.',
      'Skills & upgrades: Refund all, or right-click a skill (hold it on a phone) to undo one rank, with the full price back. The panel fits a 1080p screen.',
      'Buy DMT without leaving the game: Wallet, Buy DMT, pick an amount (1, 5 or 10 entries), see the price, confirm once. It swaps ETH for DMT on Arbitrum through KyberSwap; the game takes no fee. In Ranked, Buy DMT here appears when you are short.',
      'Hard mode and Endless are always shown on the map screen (greyed out until you clear that map), so they are easy to find.',
      'The Whole World: the bridge over the strait is open, so you can reach the desert, Apache Village, the Fighting Forum and Payasan Village. Regions now match the land you stand on (no more night falling on the green south tip, or snow on the wrong island), and swarms bring that region’s monsters.',
      'Payasan Village starts in the village itself. Its Payasans are all there (four, as in SankoQuest), the Shape Temple has its Shapey Buns, and the Payasan banners wave their flags.',
      'Townsfolk: as tall as you (they stood a head taller), each at their real spot and height (Remilio behind his own counter at the General Store), no more doubled NPCs, the SankSwap staff and bankers in their own colours, varied Green Town villagers and a white-haired Wise Old Man. Survival Sankson is his normal size again and steps away while his giant self fights you.',
      'Grass grows in proper tufts (each tuft’s blades were stacked on one spot), yellow grass is straw-coloured, and no grass grows on the SankSwap floor.',
      'Spiders are their real size (they were drawn 1.6 times too big). Trees sit on slopes properly, the practice dummies are full size, and the haunted house no longer floats past the edge of the world.',
      'The Rime Colossus and the Pumpkin Reaper throw SankoQuest Blast spells (ice and fire) instead of plain balls.',
      'Staff spells now look like SankoQuest’s own: the glow always faces you (it used to flatten into a sliver), the spell glides instead of stepping, its tail of shards stays even, and it bursts on the monster it hits. Levels 5 and 6 cast Air, Water and Earth Blasts. Boss spells lost their extra sparks, and the staff’s splash is a thin ring in the spell’s colour.',
      'Low graphics: glows, rings and the sky no longer come out too dark.',
      'New item, the Pumpkin Head: a curse you can pick on level-up. Each level brings monsters 15% faster and lets 8% more of them out at once, with 8% more health and 6% more damage: more kills, more experience, more coins, if you can take it. Casual only, and never the first card, so the level-up timer never picks it for you.',
      'Casual leaderboards count every kill again: full 15:00 runs used to tie and list the oldest first, while the end screen said #1. Now the most kills wins the tie, and the end screen shows the place the board does.',
      'Something to chase every run: your best time on each map and mode shows next to the clock, with a banner when you beat it, and the end screen says how close you came. The title screen shows your best for the map and mode you pick. In ranked the clock shows your place on this week’s board as you play and what it takes to pass the next player.',
      'A tidier main menu: Start at the top, Gear, Skills, Quests, Leaderboard, Settings and More in one even grid, maps four across on a computer, a padlock on Hard mode and Endless until you clear the map on a phone. More is down to What’s new, Move progress, Report a bug and Install the app (DMT perks live in the wallet).',
      'Fences are walls: you and the monsters go round them (63 fence pieces across the world). In ranked from the Monday reset.',
      'Fixed a black box that could flash up on screen during a run (one bad pixel from an effect got blown up by the glow).',
      'The Lighter’s ring of fire burns properly: a flickering rim with flames licking inward, heat on the ground and upright flames dancing round the edge.',
      'Shrines: every two minutes or so one of SankoQuest’s altars rises nearby with a pillar of light. Stand in its circle for a few seconds to charge it: Strength (+30% damage), Prayer (full health and protection), Magic (every bone flies to you, +40% experience), Agility (+25% speed), Fortune (a treasure chest) or Wealth (a ring of coins). Unused, it fades. In ranked from the Monday reset.',
      'Hop with Space or A on a controller, just for fun (it does not dodge anything).',
      'Reward caskets are rarer: elites used to drop one every time (about 60 in a full run). Now about 10 a run, bosses still always drop one. Ranked from the Monday reset.',
      'Regular mode is harder: monsters toughen and hit harder faster as a run goes on, and there are more of them. Veterans meet tougher monsters still: every permanent skill rank, and every piece of gear you wear, adds a little, up to +75% for a fully trained, fully geared adventurer. New players play as before. Ranked has no skills or gear, so it is unaffected.',
      'More monsters again: the last update thinned the crowd to about two thirds and you barely got hit by mid-run. The crowd is back to its old size by 8:00, they come faster, and they get tougher and hit harder as the run goes on. The first two minutes stay gentle. Ranked keeps this week’s pace until the Monday reset, so every run this week is on the same difficulty.',
      'Tutorial Island’s final boss is Survival Sankson himself, grown huge, with a slam and a charge. The Lesser Giant still comes at 4:00.',
      'Monsters walk on the ground: scorpions and alligators no longer float, and spiders no longer sink into it.',
      'Casket gear is for that run: it goes into your collection (Gear panel) but no longer stays on your character for the next run. Each run starts with only what you pick in the Gear panel (your worn gear was cleared once for this).',
      'Payasan Village has its Payasans again, drawn with the game’s own Payasan model.',
      'Apache Village has its Buns: Kev, Detec, Orange, Milady and Remilio stand in town as in SankoQuest, with desert villagers around them.',
      'Townsfolk dress for their job: gravediggers by the graveyard and swamp, the priests in pale vestments, the elder in plain clothes, and the Shape Wizards in their own set. Only wizards wear wizard robes now.',
      'Food drops come in SankoQuest’s tiers: Cooked Crawdad (+15 health), Brown Trout (+25), Catfish (+35) and Bubba Bass (+50). Better fish later in a run and from elites; bosses drop a Bubba Bass.',
      'Softer effects: the throwing axe’s spin, elite halos, the fire ring, the DMT aura and enemy bolts glow and fade at the edges instead of hard flat rings.',
      'Level-up cards have a rarity: Common, Rare, Epic or Legendary. Rare gives two levels at once, Epic three, Legendary four and heals you to full. A new weapon or upgrade can start higher, never past its last level. The odds are 70, 22, 7 and 1 in 100; the Luck skill and the Rusty Key raise them a little. In ranked from the Monday reset.',
      'Weapon metals in reward caskets, for a weapon you carry: a Mithril Katana, an Adamantite Axe, an Oak or Cherry Bow, and arrows from Bronze to Adamantite. Wear one and that weapon hits harder and looks the part in your hand and in the air; better arrows also pierce more. They last the run. In ranked from the Monday reset.',
      'More gear: the trimmed (t) Bronze, Iron and Steel pieces (gold trim, a little better), the Minion Robe and Minion Skirt (a set for the Shard Staff and the Lighter), and the Wooden Shield. In ranked caskets from the Monday reset.',
      'Two new slots, Neck and Ring. SankoQuest’s Magician’s, Warrior’s and Power Amulets, and six rings of our own: Ember Band, Tidewater Ring, Featherstep Ring, Lodestone Ring, Quickdraw Ring and Bulwark Band. They drop from reward caskets now and then. In ranked from the Monday reset.',
      'The Gear panel is organised by slot: a tab for each slot (Head, Body, Hands, Legs, Feet, Shield, Back, Neck, Ring) with how many pieces you have found, and inside it the metal ladder in order, then the sets, then the specials.',
    ],
  },
  {
    version: '0.35', date: '2 Nov 2026', title: 'New season: the Hidden Oasis, real casket gear, more slots and balance',
    items: [
      'Move your progress to another computer or phone: More, Move progress, copy the code, paste it on the other device.',
      'Endless runs get their own leaderboard: Leaderboard, Casual, Endless. Clear a map to unlock Endless for it.',
      'After a ranked run, the play-again button takes you back to Ranked (Run it back starts a free casual run).',
      'Caskets that are not better (a piece you already wear, or a weaker one) are high alched for you, with a note. Turn it off in Settings to see every casket.',
      'Phones: pinch zoom only when two fingers land together, so steering and tapping no longer jolt the camera.',
      'Monsters drop bones for experience, like in SankoQuest.',
      'New map: the Hidden Oasis, behind the locked door under Apache town. A dark cave of alligator pools, the old factory rooms and the high ground beyond, lit by its own lamps and the torch you carry.',
      'Jungle spiders, slimers, alligators and mutant slimers live down there, as in SankoQuest. A Lesser Giant, the Pumpkin Reaper and finally the Rime Colossus come for you.',
      'It opens when you clear Apache Desert.',
      'Slimers are their real size now, and easier to hit.',
      'Start with 4 weapon slots and 4 passive slots. Strength and Prayer each unlock two more, for 1,500 then 4,000 coins.',
      'New skills: Projectile speed (+10%, 2 ranks), One more projectile (+1, 3,000 coins), and Area (+5%, 2 ranks). They work with the same attacks as the Feather and Cape.',
      'Luck adds 15% more casket drops and a 15% chance of an extra boss chest per rank, up to 3 ranks.',
      'Coins adds 10% to your end-of-run coins per rank, up to 5 ranks. Rerolls adds one level-up reroll per rank, up to 3 ranks.',
      'Revive costs 5,000 coins. Once per run, return with half your max HP and 2 seconds of protection.',
      'Each skill shows its own ranks and price. The original nine skills keep their effects and prices. Saved ranks above a skill’s limit are clamped.',
      'Base health is now 100. Monsters move 5% slower and their health grows more gently.',
      'Monsters no longer get much faster late in a run: even the quickest (foxes, dogs, wolves) stay a little slower than you, so you can always get away.',
      'Coins fly to you from your pickup range, like experience gems.',
      'The Star is a friendly townsman, as in SankoQuest, and no longer attacks you. The ogre is Fudna the Hoard Keeper.',
      'The crowd grows gradually. Fewer monsters pile up early, with the busiest stretch in the last third around the bosses.',
      'Overlapping chests wait until you finish each choice, so bonus rewards are kept.',
      'Ranked starts equal with 4 slots of each kind. Permanent skills, including Revive, do not apply.',
      'Reward caskets hold real gear: Bronze, Iron, Steel, Mithril, Adamantite and now Runite, as a helmet, chestplate, gauntlets, leggings or boots.',
      'New shield slot: a kiteshield or a round shield in every metal, and the rare Ogre Shield. You carry it in your off hand.',
      'A full Runite set gives +50 max HP, +1.5 armor and +5% damage.',
      'Runite is rare and only shows up late in a run on the later maps.',
      'If the slot is empty, the item goes straight on. If not, the run pauses: Wear it, or High alch it for coins. The card shows every stat that goes up or down and recommends one.',
      'High alch coins are added to the coins you earn at the end of the run.',
      'Every item you open still goes into your collection in the Gear panel.',
      'New setting: Auto high alch caskets that are not better.',
      'Tutorial Island caskets now give early-game gear.',
    ],
  },
  {
    version: '0.34.1', date: '2 Nov 2026', title: 'Your wallet, in one place',
    items: [
      'A wallet button in the top corner: connect Rabby, MetaMask or any other wallet once and the game remembers it next time. It shows your address and DMT.',
      'Tap it for your DMT and ETH on Arbitrum, to turn on DMT perks with one free signature, or to switch or disconnect.',
      'Ranked pays from that wallet and shows your balance first. If you are short on DMT, or on ETH for the network fee, it says so and links where to get some. After you pay, a link shows the payment on Arbiscan.',
    ],
  },
  {
    version: '0.34', date: '2 Nov 2026', title: 'True to SankoQuest',
    items: [
      'Spells look like they do in SankoQuest: the shard staff fires the game\'s own Strike (and, evolved, Blast) projectile in each element\'s colour, at its real size.',
      'Arrows fly as SankoQuest draws them: a dark shaft, a grey head and tan fletching.',
      'Everyone is their real size now: your hero, the townsfolk and the monsters match the live game (spiders and goblins were too big).',
      'New look for boss attack warnings, the leaderboard has Ranked and Casual, and the draw distance reaches further.',
    ],
  },
  {
    version: '0.33', date: '2 Nov 2026', title: 'Sharper swings, clearer goal',
    items: [
      'Sword swings look better: your hero turns smoothly instead of snapping, faces each swing while it lands, and the swing itself is quicker, in time with the slash.',
      'Every run says what it takes to win: last 15:00 (10:00 on Tutorial Island) or slay the final boss. The time to beat shows under the clock, and the final boss is announced as the one to kill.',
    ],
  },
  {
    version: '0.32', date: '2 Nov 2026', title: 'Sturdier walls, top five prizes',
    items: [
      'Walls hold now: you could slip through near the end of a wall, and every wall in the world was tested from both sides. You also stop a little further from walls instead of half inside them.',
      'Ranked prizes now go to the top five wallets: 40%, 25%, 15%, 12% and 8% of the week\'s pot.',
      'Spirit Shard: shields hit again sooner and the Lighter burns faster.',
    ],
  },
  {
    version: '0.31', date: '2 Nov 2026', title: 'Ranked weekly runs',
    items: [
      'Ranked is open: one map a week (Monday to Monday, UTC), 0.5 DMT on Arbitrum per run. The week\'s top wallets share 90% of the entries, paid out after the week ends.',
      'Everyone starts equal: any regular adventurer, no skills, gear or DMT perks. Every run is replayed on the server move by move, so only what you really played counts.',
      'Up to 20 entries per wallet each week, and one wallet per player. Lose your connection or reload mid-run? The game picks your run back up.',
    ],
  },
  {
    version: '0.30', date: '2 Nov 2026', title: 'Walls and trees',
    items: [
      'Building walls are solid now: no more walking through the sides of houses, the tavern or the castle. Use the doors. Monsters go round through the doors too.',
      'Monsters left far behind (or stuck on a cliff) come back into the fight instead of quietly using up a place in the crowd.',
      'Trees no longer vanish when you walk up to them. A tree between you and the camera turns see-through so you can still see yourself, and fades back as you move on.',
    ],
  },
  {
    version: '0.29', date: '2 Nov 2026', title: 'Fixes from a big test sweep',
    items: [
      'Goblin War: beating the Ogre that turns up at 7:00 no longer ends the run. Only the last Ogre, at 13:00, does, so you now see the Colossus and the full fight.',
      'Upgrade cards now say what each level really does (Katana, Bow, Throwing Axe, Kiteshield, Shard Staff and Short Swords had some levels mixed up).',
      'Feather: every level now counts. On top of the extra projectiles, they fly 6% farther per level.',
      'Cape: arrows and thrown swords hit wider too.',
      'On phones, the credit and tip links at the bottom of the title screen are no longer hidden under the start bar.',
      'Leaderboard: wins that could not have happened are refused.',
    ],
  },
  {
    version: '0.28', date: '2 Nov 2026', title: 'New weapons and upgrades',
    items: [
      'Two new weapons: the Baseball ricochets from monster to monster, and the Lighter keeps a ring of fire around you. They evolve into Home Run (with the Feather) and Inferno (with the Amanita).',
      'Five new upgrades: Cape (bigger attacks), Feather (more projectiles), Amanita (critical hits), Scorpion Carapace (monsters that hit you get hurt back) and Rusty Key (more coins and caskets).',
      'Balance: the middle of a run is fairer. Monsters toughen up and crowd in a little more slowly, hit a little softer, and you get a moment longer to break free after each hit. The Pickaxe quakes harder and more often.',
      'Map events start gentler (about half size at 3:30, full size by 7:00), storms slow you less, and Apache Desert and Payasan Village bring in their toughest monsters later.',
      'New lettering: headings and buttons use the RuneScape Quill font.',
      'A tidier title menu: the main screens in a two-by-two grid and the extras in a row of small buttons, so it all fits on a phone.',
      'Tutorial Island now has all fifteen of its trees where SankoQuest has them (trees, oaks and pines), and Star waits on the hilltop path by the fountain.',
      'Fix: in The Wilderness, the ambush\'s alligators and slimers now climb out of the water\'s edge instead of random spots in the grass.',
    ],
  },
  {
    version: '0.27', date: '2 Nov 2026', title: 'DMT holder perks',
    items: [
      'Hold DMT? Open DMT holder perks on the title screen, connect your wallet and sign a free message (no transaction, no gas). Holders get a gold-and-teal aura, +25% coins after every run, and a DMT badge on the leaderboard.',
      'On a phone, the panel opens the game in your wallet app (MetaMask, Coinbase Wallet or Trust Wallet) so you can connect there.',
      'Your own runs are highlighted on the leaderboard.',
    ],
  },
  {
    version: '0.26', date: '2 Nov 2026', title: 'Leaderboard and graphics settings',
    items: [
      'The shared leaderboard is open. Post your run from the end screen and see the top 25 on every map.',
      'More graphics settings: resolution, frame rate cap, anti-aliasing, shadow detail, draw distance, water reflections, reduced effects and damage numbers, sorted into Display, Lighting, World and Game.',
      'The Shard Staff now fires SankoQuest\'s own spell: a glowing missile with a sparkling trail that bursts on impact, in your shard\'s colour, and a bigger Blast once it evolves.',
      'Survival Sankson no longer stands with his legs fused together, and Star faces the right way. Animations now fit models built on a different skeleton.',
      'Tutorial Island: Boaty stands in his own spot, and one of its trees is an oak again.',
      'Air shards on the ground are bigger and easier to see.',
      'An Update button appears next to Install the app when a newer version is out.',
    ],
  },
  {
    version: '0.25', date: '2 Nov 2026', title: 'Share your run',
    items: [
      'Share on X from the end screen: your time, level and monsters slain, with a link to play.',
      'Made by @dexedrne: the credit on the title screen links to X.',
      'Tip in ETH from the title screen: copy the address, or open it in your wallet.',
      'New home: sankosurvivors.quest. Old links still work.',
      'Faster first load: the game downloads about a third less on your first visit, with the same picture.',
      'The adventurer buttons fit their names, and the picked one shows straight away, even before its icons have loaded.',
      'Played on the old address? Your coins, gear and progress come with you to sankosurvivors.quest.',
    ],
  },
  {
    version: '0.24', date: '2 Nov 2026', title: 'Chicken stampede',
    items: [
      'Greentown has its own event: the chickens have had enough. A flock of about 30 charges in from one side, with a few cows along for the ride. Lots of air shards.',
      'On The Whole World, the events match where you are: stampedes in Greentown, sandstorms in the desert, blizzards at Payasan, warbands up north, and so on.',
    ],
  },
  {
    version: '0.23', date: '2 Nov 2026', title: 'The Fighting Forum',
    items: [
      'Duel Town is now the Fighting Forum, its name in SankoQuest.',
      'A champion of the Fighting Forum steps up to duel you. The crowd holds back while you fight, and beating the champion drops a casket and a pile of coins. Champions leave after 30 seconds if you cannot finish them.',
    ],
  },
  {
    version: '0.22', date: '2 Nov 2026', title: 'Sandstorms and ambushes',
    items: [
      'Apache Desert has its own event: a sandstorm sweeps over, the dust closes in, you push through slower, and scorpions come with it.',
      'The Wilderness has its own event: an ambush, with alligators and slimers crawling out of the nearest water.',
      'Five maps now have their own event (Apache Desert, Chapel Graves, The Wilderness, Goblin War and Payasan Village), alongside treasure goblins, swarms and meteor showers.',
    ],
  },
  {
    version: '0.21', date: '2 Nov 2026', title: 'Blizzard',
    items: [
      'Payasan Village has its own event: a blizzard rolls in for a few seconds. The snow closes in, you move a little slower, and snowmen come out of the storm.',
    ],
  },
  {
    version: '0.20', date: '2 Nov 2026', title: 'The dead rise',
    items: [
      'Chapel Graves has its own event: skeletons burst out of the ground in a ring close around you. They take a moment to climb out, which is your chance to get clear.',
    ],
  },
  {
    version: '0.19', date: '2 Nov 2026', title: 'Warbands',
    items: [
      'Goblin War has its own event: a goblin warband charges in two ranks from one side, led by a tough golden warchief. The banner tells you which side it comes from.',
    ],
  },
  {
    version: '0.18', date: '2 Nov 2026', title: 'Snow at Payasan',
    items: [
      'Payatown is now Payasan Village, its name in SankoQuest. Its white squares are snow, so they look like snow instead of glaring, and snowmen and a yeti join its monsters.',
      'The Wilderness starts gentler, with foxes and goblins. Spiders and slimers arrive from 0:40, so runs stop ending in the first minute.',
      'Levelling up shows a slim beam of light that fades upward, instead of a tall pillar that covered the fight.',
      'Goblin Wars is now Goblin War.',
      'Bigger buttons on touch screens, so menus are easier to tap.',
    ],
  },
  {
    version: '0.17', date: '2 Nov 2026', title: 'Lighter on your device',
    items: [
      'Buildings and props that share a look are now drawn together, so each frame draws about 40% fewer things. Smoother on phones and older laptops, with the same picture.',
    ],
  },
  {
    version: '0.16', date: '2 Nov 2026', title: 'In your pocket',
    items: [
      'Install it as an app: tap Install the app on the title screen (on iPhone: Share, then Add to Home Screen). It opens full screen, and the files you have played load from your phone next time.',
      'Made for phones and the iPhone Duo: the menus fit open, folded or turned sideways, folding or turning mid-run keeps your run going, and nothing hides under the Dynamic Island or the home bar.',
      'On a phone the Enter the field button stays at the bottom while you pick your adventurer and map, and keyboard hints are hidden.',
    ],
  },
  {
    version: '0.15', date: '2 Nov 2026', title: 'Leaderboard',
    items: [
      'A shared leaderboard for every map. Type your name on the end screen to post your run, and open Leaderboard on the title screen to see the top 25.',
      'Report a bug from the title screen or the pause menu. It sends your note with your settings and any errors, so problems can be fixed faster.',
      'The Wilderness lies west of Greentown and the new Goblin War map is north of it. The Greentown guards have stepped aside.',
      'Tutorial Island now has Survival Sankson, Star and the Spiky Boatman.',
      'Smoother on most computers: far fewer things drawn at once, small props fade out at a distance, and the resolution adapts to keep the frame rate up. Roofs are off by default.',
      'Gear from caskets goes straight onto your character when the slot is empty or the find is better.',
      'Herblore is now Mixnometry, and the quests have new names.',
      'The version number shows in the corner of the title screen.',
    ],
  },
  {
    version: '0.14', date: '2 Nov 2026', title: 'The Whole World',
    items: [
      'A new map: The Whole World. Thirty minutes across all of SankoQuest, open from the start. The monsters, music and sky change with the region you walk into, and its name shows as you cross over.',
      'More trees, rocks and townsfolk from the live game.',
      'Every menu works with a controller or the arrow keys: move with the d-pad or stick, A or Enter picks, B or Esc goes back, Start begins a run.',
    ],
  },
  {
    version: '0.13', date: '2 Nov 2026', title: 'Sharper and fairer',
    items: [
      'Sword swings sweep across the arc as a bright crescent; quakes crack the ground and throw up dust; monsters flash white when hit.',
      'A boss falling flashes the screen and slows time for a moment.',
      'Colour grading and a soft vignette, with a red pulse at the edges when your health is low. Ambient occlusion in Settings.',
      'Trees right next to you fade away so they never hide your character.',
      'Balance: you level faster, start with 120 health and a wider pickup range, monsters toughen up more gradually, and bosses warn longer before big slams. The first random event waits until 3:30.',
      'The Shard Staff and Bow hit harder; the Staff\'s bolts burst from level 2 and the Bow pierces from level 2.',
    ],
  },
  {
    version: '0.12', date: '2 Nov 2026', title: 'A living world',
    items: [
      'Trees, wheat and flax fields, ore rocks, furnaces, anvils and practice dummies now stand exactly where they are in SankoQuest, read from the live game.',
      'Tutorial Island has its trees, rocks, furnace, anvils and combat dummies.',
      'The pine forest south of Greentown, the desert mine\'s ore rocks, Apache Village\'s furnace and anvil, and the lake palms.',
      'Townsfolk: guards, bankers, farmers and other SankoQuest NPCs stand at their real spots near you.',
    ],
  },
  {
    version: '0.11', date: '2 Nov 2026', title: 'Alex, open maps, real grips',
    items: [
      'Tutorial Island: you play as Alex, in bronze armour with a bronze two-handed sword, winged boots and extra health.',
      'Every map is open: run anywhere in the world. Walls, cliffs and the sea are the only limits.',
      'Weapons are held exactly the way SankoQuest holds them, using the game\'s own hand positions.',
      'Experience drops are the Air Shard itself, in three sizes by value.',
      'Short Swords now fly at the nearest monster.',
      'Sharing the link shows a preview card.',
    ],
  },
  {
    version: '0.10', date: '2 Nov 2026', title: 'Armoury, water and weather',
    items: [
      'The Armoury: reinforce any piece of gear up to +3 with coins, from the Gear screen. Each level adds a quarter of its bonus.',
      'Water shows its depth: turquoise shallows, deep blue further out, and foam where it meets the shore.',
      'Each map has its own air: drifting leaves in Greentown, dust in the desert, snow at Payatown, fireflies in the swamp, the graves and at night.',
      'This updates log.',
    ],
  },
  {
    version: '0.9', date: '2 Nov 2026', title: 'Bosses fight back',
    items: [
      'Bosses telegraph their attacks: a red circle before a slam, a red lane before a charge, and volleys of fire or ice you can dodge.',
      'Golden elite monsters: tougher, and they always carry a reward casket.',
      'Random events every few minutes: a treasure goblin that runs off with loot, monster swarms, and meteor showers.',
      'An item belt: keep beer, pumpkin bombs and warp shards and use them with 1 to 4 (or tap them, or LB, RB, X, Y).',
      'Two new weapons, the Two-handed Sword and thrown Short Swords, with evolutions, and two new adventurers who start with them.',
      'A minimap, a Dusk and Night setting, damage by weapon on the end screen, new spell and arrow effects, and more of the game\'s own sounds.',
    ],
  },
  {
    version: '0.8', date: '2 Nov 2026', title: 'The real ground',
    items: [
      'The whole world now uses SankoQuest\'s own ground: real hills, colours, paths, floors and walls.',
      'Walls, cliffs and the sea block you, and building roofs lift off when you step inside.',
      'Grass, daisies, mushrooms and pebbles grow where they do in the game.',
      'A Settings menu: quality, shadows, glow, depth of field, rain with puddles, grass, roofs, screen shake and sound.',
      'Tutorial Island, a gentler map open from the start.',
    ],
  },
  {
    version: '0.7', date: '1 Nov 2026', title: 'Castle walls',
    items: ['Greentown castle\'s walls, fences and long wall runs are complete.', 'Fountains no longer sit in craters.'],
  },
  {
    version: '0.6', date: '1 Nov 2026', title: 'Loot and quests',
    items: [
      'Reward caskets drop real SankoQuest gear that you keep and wear between runs, with set bonuses.',
      'Ten quests that pay coins and gear, level-up rerolls and skips, and Endless mode on cleared maps.',
      'Phone and tablet support: drag to move, pinch to zoom.',
    ],
  },
  {
    version: '0.5', date: '1 Nov 2026', title: 'SankoQuest look',
    items: [
      'The game\'s own interface: RuneScape fonts, pixel frames, slots, buttons and cursor.',
      'Sun shadows, cliffs and mountains, monsters that walk around obstacles, and experience as Air Shards.',
      'Skeletons and stars stand upright; weapons are held properly.',
    ],
  },
  {
    version: '0.1', date: '1 Nov 2026', title: 'First run',
    items: ['Survive fifteen minutes in Greentown and five more maps of the real SankoQuest world, with six weapons, evolutions and bosses.'],
  },
];
export const LATEST = CHANGELOG[0].version;
