#!/usr/bin/env python3
"""Chaos-mode power icons -> godot/assets/art/powers/<id>.jpg (one 3x3 sheet)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import gen_ability_icons as A
A.OUT = os.path.join(A.ROOT, 'godot', 'assets', 'art', 'powers')
A.ICONS = {
 'meteor': "Meteor Shower: three flaming meteors streaking down from a dark sky with fiery trails",
 'surge': "Elixir Surge: a big glowing pink-purple elixir drop erupting with sparkles and a burst of energy",
 'freeze': "Deep Freeze: a large jagged ice crystal burst with frost swirls on an icy blue background",
 'rally': "Rally Cry: a golden battle horn blasting out shockwave rings with tiny swords raised",
 'aegis': "Aegis: a glowing golden-and-blue energy shield bubble with a crown emblem",
 'overclock': "Overclock: a lightning bolt through a spinning clockwork gear with a purple energy glow",
}
A.main()
