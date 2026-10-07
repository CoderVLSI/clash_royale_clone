#!/usr/bin/env python3
"""Adds the 2026 cards found by research: Ronin (Jul 2026), Minion Giant (Sep 2026) and the evolutions missing from the 2D app:
Evo Princess, Evo Minion Horde, Evo Elite Barbarians, Evo Electro Giant (Oct 2026). Idempotent.
Numbers: Ronin 1779 HP / 337 dmg / 1.4 s, Parry every 3.5 s (RoyaleAPI / gamelevate); Minion Giant 1817 HP / 189 dmg / 1.7 s / range 4 (rare, 4 elixir).
Evolution effects are approximations where the sources gave no numbers (marked ~)."""
import json, copy, os
P = os.path.join(os.path.dirname(__file__), '..', '..', 'godot', 'data', 'cards.json')
cards = json.load(open(P))
by = {}
for c in cards:
    by.setdefault(c['id'], c)

def add(card):
    if card['id'] in by:
        cards[cards.index(by[card['id']])] = card
    else:
        cards.append(card)
    by[card['id']] = card

add(dict(id='ronin', name='Ronin', cost=5, color='#c0392b', hp=1779, speed=2, type='ground', range=25, damage=337, attackSpeed=1400, projectile=None, count=1, rarity='legendary',
         parryAbility=True, parryCooldown=3500))
add(dict(id='minion_giant', name='Minion Giant', cost=4, color='#16a085', hp=1817, speed=1.5, type='flying', range=85, damage=189, attackSpeed=1700, projectile='toxin_spit', count=1,
         targetType='buildings', rarity='rare', noKnockback=True))

def evo(base_id, evo_id, cycles, aura, **fields):
    b = by[base_id]
    b['evolvesTo'] = evo_id
    b['evolutionCycles'] = cycles
    e = copy.deepcopy(b)
    for k in ('evolvesTo', 'evolutionCycles', 'heroVariantId'):
        e.pop(k, None)
    e.update(id=evo_id, name='Evolved ' + b['name'], isToken=True, evolution=True, evolutionAuraColor=aura)
    e.update(fields)
    add(e)

evo('princess', 'evolved_princess', 2, '#7fd6ff', icyArrowEvery=3)                                                                  # icy arrow on the first attack and every 3rd (~slow 35%)
evo('minion_horde', 'evolved_minion_horde', 1, '#c06bff', swarmBonus=0.05)                                                           # ~ minions attack faster the bigger the swarm
evo('elite_barbarians', 'evolved_elite_barbarians', 1, '#ff5a3c', range=110, damage=284, projectile='spear', rageSpear=True)         # rage-tipped spears leave an enraging path
evo('electro_giant', 'evolved_electro_giant', 1, '#46c8ff', chainEvery=3000, chainTargets=3, chainDamage=150, chainStun=0.5)        # ~ periodic chain lightning
json.dump(cards, open(P, 'w'), indent=2)
print('ok', len(cards))
