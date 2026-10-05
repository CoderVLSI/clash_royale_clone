#!/usr/bin/env python3
"""Adds every Hero card to godot/data/cards.json (idempotent). Ability names/costs/effects follow the Clash Royale wiki / RoyaleAPI
descriptions; where the public sources gave no exact numbers the values are approximations (marked ~)."""
import json, copy, os
P = os.path.join(os.path.dirname(__file__), '..', '..', 'godot', 'data', 'cards.json')
cards = json.load(open(P))
by = {c['id']: c for c in cards}

# base id -> (hero id, display name, ability fields). Costs are the ability's elixir cost.
H = {
 'knight':      ('hero_knight', 'Hero Knight', dict(heroTauntAbility=True, heroShield=819, heroTauntRadius=163, heroTauntDuration=5000, abilityCost=2)),                       # Triumphant Taunt
 'giant':       ('hero_giant', 'Hero Giant', dict(heroHurlAbility=True, heroHurlRadius=45, heroHurlDamage=250, abilityCost=2)),                                                 # Heroic Hurl
 'mini_pekka':  ('hero_mini_pekka', 'Hero Mini P.E.K.K.A', dict(heroBreakfastAbility=True, heroPancakeInterval=5000, heroBreakfastHeal=0.3, heroLevelBoost=0.1, abilityCost=1)), # Breakfast Boost
 'musketeer':   ('hero_musketeer', 'Hero Musketeer', dict(heroTurretAbility=True, abilityCost=3)),                                                                              # Trusty Turret
 'ice_golem':   ('hero_ice_golem', 'Hero Ice Golem', dict(heroSnowstormAbility=True, heroSnowRadius=95, heroSnowDuration=5000, heroSnowSlow=0.4, heroSnowDps=60, abilityCost=2)),  # Snowstorm (~)
 'sword_goblins': ('hero_goblins', 'Hero Goblins', dict(heroBannerAbility=True, heroBannerCount=4, abilityCost=1)),                                                              # Banner Brigade (~)
 'mega_minion': ('hero_mega_minion', 'Hero Mega Minion', dict(heroWarpAbility=True, heroWarpDamage=468, abilityCost=2)),                                                         # Wounding Warp
 'bowler':      ('hero_bowler', 'Hero Bowler', dict(heroSwishAbility=True, heroSwishRange=250, abilityCost=2)),                                                                  # Stone Swish
 'tombstone':   ('hero_tombstone', 'Hero Tombstone', dict(heroRevivalAbility=True, abilityCost=6)),                                                                              # Regal Revival
 'balloon':     ('hero_balloon', 'Hero Balloon', dict(heroCoffinAbility=True, heroCoffinDamage=300, abilityCost=2)),                                                              # Coffin Cadet (~)
 'dark_prince': ('hero_dark_prince', 'Hero Dark Prince', dict(heroDismountAbility=True, heroDismountDamage=400, heroDismountRadius=70, abilityCost=3)),                           # Destructive Dismount (~)
 'valkyrie':    ('hero_valkyrie', 'Hero Valkyrie', dict(heroWhirlwindAbility=True, heroWhirlDuration=3500, heroWhirlDamage=97, heroWhirlTowerDamage=47, heroWhirlRadius=55, abilityCost=3)),  # Wild Whirlwind
 'berserker':   ('hero_berserker', 'Hero Berserker', dict(heroSavageAbility=True, heroSavageDuration=4000, abilityCost=3)),                                                       # Savage Survival
 'ice_wizard':  ('hero_ice_wizard', 'Hero Ice Wizard', dict(heroFrostyAbility=True, heroFrostyHp=425, heroFrostyRadius=55, heroFrostyDuration=7000, heroFrostyDamage=89, abilityCost=2)),  # Frosty Fella
}
ONCE = dict(abilityOnce=True, abilityCooldown=1000)   # since Aug 2026 every hero ability fires once per deployment

def add(card):
    if card['id'] in by:
        cards[cards.index(by[card['id']])] = card
    else:
        cards.append(card)
    by[card['id']] = card

for base_id, (hid, name, ab) in H.items():
    b = by[base_id]
    b['heroVariantId'] = hid
    h = copy.deepcopy(b)
    for k in ('evolvesTo', 'evolutionCycles', 'heroVariantId'):
        h.pop(k, None)
    h.update(id=hid, name=name, rarity='hero', isToken=True)
    h.update(ab); h.update(ONCE)
    add(h)

# the existing three heroes also become single-use
for hid in ('hero_wizard', 'hero_magic_archer', 'hero_electro_wizard'):
    by[hid].update(ONCE)

# Barbarian Barrel hero: the spell spawns a hero barbarian that can barrel again (Rowdy Reroll, 1 elixir)
bb = by['barb_barrel']; bb['heroVariantId'] = 'hero_barb_barrel'
hb = copy.deepcopy(bb); hb.pop('heroVariantId', None); hb.update(id='hero_barb_barrel', name='Hero Barb Barrel', rarity='hero', isToken=True, spawns='hero_barbarian_single')
add(hb)
hbs = copy.deepcopy(by['barbarian_single']); hbs.update(id='hero_barbarian_single', name='Hero Barbarian', rarity='hero', heroRerollAbility=True, heroRerollDamage=243, abilityCost=1, **ONCE)
add(hbs)

# tokens spawned by hero abilities
add(dict(id='hero_turret', name='Trusty Turret', cost=0, color='#7f8c8d', hp=721, speed=0, type='building', range=75, damage=148, attackSpeed=500, projectile='bullet', count=1, lifetime=10, rarity='common', isToken=True))
add(dict(id='tomb_queen', name='Tomb Queen', cost=0, color='#8e44ad', hp=1600, speed=1.5, type='ground', range=25, damage=190, attackSpeed=1200, projectile=None, count=1, rarity='hero', isToken=True,
         targetType='buildings', spawns='skeletons', spawnRate=4, spawnCount=2))
add(dict(id='frosty_snowman', name='Frosty Fella', cost=0, color='#e8f4f8', hp=425, speed=0, type='ground', range=0, damage=0, attackSpeed=0, projectile=None, count=1, rarity='hero', isToken=True))
json.dump(cards, open(P, 'w'), indent=2)
print('heroes now:', sorted(c['id'] for c in cards if c.get('rarity') == 'hero' and c.get('abilityCost')))
