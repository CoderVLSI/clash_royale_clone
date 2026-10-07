"""Second batch of unique card models (the ~90 cards not covered by make_card_models.py), spec driven.
Run directly:  /opt/blenv/bin/python tools/blender/make_card_models2.py [id ...]
Each model is ONE unit (the sim spawns `count` of them) facing Blender +Y, origin at the feet,
material TEAM stays recolourable in Godot. Designs follow the generated portraits in godot/assets/art/cards."""
import os, sys, math
ONLY = []   # silence make_card_models' own build list
exec(open('/home/user/clash_royale_clone/tools/blender/make_card_models.py').read())

reg(PURPLE_H=(0.45, 0.25, 0.72), PINK_H=(0.9, 0.35, 0.7), ORANGE_H=(0.85, 0.35, 0.12), RED_H=(0.75, 0.22, 0.1), BLACK_H=(0.1, 0.1, 0.13),
    GREEN_C=(0.2, 0.5, 0.2), GREEN_D=(0.12, 0.34, 0.14), BLUE_G=(0.35, 0.5, 0.75), BLUE_S=(0.38, 0.52, 0.72), BLUE_D=(0.2, 0.3, 0.55), GREY_B=(0.35, 0.38, 0.45),
    YELLOW=(0.98, 0.82, 0.15), PLAID=(0.7, 0.12, 0.12), FURW=(0.9, 0.85, 0.72), SKIN_O=(0.88, 0.5, 0.2), SKIN_P=(0.6, 0.55, 0.85), SKIN_B=(0.38, 0.45, 0.85),
    LAVA=(0.3, 0.12, 0.08), LAVA_G=(1.0, 0.45, 0.08), PINKW=(1.0, 0.8, 0.88), WHITE_S=(0.93, 0.95, 1.0), TAN=(0.78, 0.6, 0.4), SKIN_T=(0.85, 0.65, 0.5),
    ICE_W=(0.82, 0.93, 1.0), BARREL=(0.55, 0.33, 0.14), MET=(0.6, 0.62, 0.68), PURP_D=(0.2, 0.1, 0.3), VOID=(0.08, 0.02, 0.15), E_RED=(1.0, 0.3, 0.2),
    E_PINK=(1.0, 0.6, 0.8), G_ICE=(0.7, 0.9, 1.0), G_WHITE=(0.9, 0.95, 1.0), SKIN_G2=(0.5, 0.78, 0.3), BLUE_L=(0.4, 0.55, 0.95), BROWN_R=(0.55, 0.32, 0.18))

# ------------------------------------------------------------------ building blocks
HZ = 1.98     # head centre height for a standard person

def person(top='BLUE_M', pants='DARK', skin='SKIN', boots='LEATHER', bulk=1.0, sleeves=None, head=0.3, teambelt=True, eyes=True, legh=0.88, hz=None):
    """Standard low-poly human: legs, torso, belt, arms and head with eyes. Returns a part list."""
    hz = hz or legh + 1.1
    p = []
    for sx in (-0.19 * bulk, 0.19 * bulk):
        p += [B(pants, 0.28 * bulk, 0.3, legh - 0.15, sx, 0, (legh - 0.15) / 2 + 0.17), B(boots, 0.3 * bulk, 0.44, 0.2, sx, 0.05, 0.1)]
    p += [B(top, 0.8 * bulk, 0.46, 0.85, 0, 0, legh + 0.42)]
    if teambelt:
        p += [B('TEAM', 0.84 * bulk, 0.5, 0.12, 0, 0, legh + 0.02)]
    sl = sleeves or skin
    p += [B(sl, 0.17 * bulk, 0.17, 0.62, -0.5 * bulk, 0.08, legh + 0.45, -0.2), B(sl, 0.17 * bulk, 0.17, 0.62, 0.5 * bulk, 0.3, legh + 0.55, -0.8)]
    p += [S(skin, head, 0, 0, hz)]
    if eyes:
        p += [S('WHITE', head * 0.2, -head * 0.36, head * 0.86, hz + 0.04, 0.8, 0.5, 1), S('WHITE', head * 0.2, head * 0.36, head * 0.86, hz + 0.04, 0.8, 0.5, 1),
              S('DARK', head * 0.11, -head * 0.36, head * 0.95, hz + 0.04), S('DARK', head * 0.11, head * 0.36, head * 0.95, hz + 0.04)]
    return p

def mustache(col, hz=HZ, w=0.34, head=0.3):
    return [B(col, w, 0.08, 0.1, 0, head * 0.92, hz - 0.1, -0.15), K(col, 0.05, 0.14, -w / 2, head * 0.9, hz - 0.12, 0, 0, 0.9), K(col, 0.05, 0.14, w / 2, head * 0.9, hz - 0.12, 0, 0, -0.9)]

def beard(col, hz=HZ, head=0.3, w=0.4, l=0.45):
    return [B(col, w, 0.16, l, 0, head * 0.7, hz - 0.28, -0.1), K(col, 0.15, 0.3, 0, head * 0.75, hz - 0.58, Z * 2, 0, 0, 6)]

def hair_long(col, hz=HZ, head=0.3, l=0.7):
    return [S(col, head * 1.1, 0, -0.02, hz + 0.05, 1, 1, 0.9), B(col, head * 1.9, 0.16, l, 0, -head * 0.75, hz - l / 2 + 0.1), B(col, 0.08, 0.1, 0.4, -head, 0.1, hz - 0.15), B(col, 0.08, 0.1, 0.4, head, 0.1, hz - 0.15)]

def hair_short(col, hz=HZ, head=0.3):
    return [S(col, head * 1.08, 0, -0.04, hz + 0.05, 1, 1, 0.82), B(col, head * 1.2, 0.08, 0.14, 0, head * 0.9, hz + 0.2)]

def pigtails(col, hz=HZ, head=0.3):
    return [S(col, head * 1.1, 0, -0.03, hz + 0.05, 1, 1, 0.85), S(col, 0.13, -head * 1.0, -0.1, hz - 0.1), S(col, 0.13, head * 1.0, -0.1, hz - 0.1), K(col, 0.1, 0.45, -head * 1.1, -0.1, hz - 0.45, Z * 2, 0, 0.1),
            K(col, 0.1, 0.45, head * 1.1, -0.1, hz - 0.45, Z * 2, 0, -0.1)]

def helm_horned(col='STEEL', horn='CREAM', hz=HZ, head=0.3, nose=False):
    p = [S(col, head * 1.12, 0, 0, hz + 0.08, 1, 1, 0.85), B(col, head * 2.2, 0.06, 0.1, 0, head * 0.6, hz + 0.12), K(horn, 0.09, 0.4, -head * 1.15, 0, hz + 0.25, 0, 0, 0.9), K(horn, 0.09, 0.4, head * 1.15, 0, hz + 0.25, 0, 0, -0.9)]
    if nose:
        p.append(B(col, 0.06, 0.06, 0.3, 0, head * 1.05, hz - 0.05))
    return p

def helm_knight(col='STEEL', plume='TEAM', hz=HZ, head=0.3, visor=True):
    p = [S(col, head * 1.12, 0, 0, hz + 0.02), B('DARK', head * 1.4, 0.07, 0.1, 0, head * 1.0, hz + 0.0), B(plume, 0.08, 0.5, 0.2, 0, -0.02, hz + head * 1.15)]
    if visor:
        p.append(B(col, 0.05, 0.05, 0.35, 0, head * 1.05, hz - 0.1))
    return p

def hat_tricorn(col='PURPLE_H', hz=HZ, head=0.3):
    return [Y(col, 0.46, 0.07, 0, 0, hz + 0.3), Y(col, 0.28, 0.26, 0, 0, hz + 0.45), B('CREAM', 0.04, 0.04, 0.4, 0.26, 0.1, hz + 0.6, 0, 0, -0.3)]

def hat_pointy(col='ROBE_P', hz=HZ, head=0.3, h=0.9):
    return [Y(col, head * 1.45, 0.06, 0, 0, hz + 0.2), K(col, head * 1.0, h, 0, 0, hz + 0.2 + h / 2, 0, 0, 0, 10)]

def hood(col='ROBE_P', hz=HZ, head=0.3, tall=0.55):
    return [S(col, head * 1.2, 0, -0.06, hz + 0.02, 1, 1, 1.0), K(col, head * 0.9, tall, 0, -0.08, hz + head + 0.15, -0.15, 0, 0, 10), B(col, head * 2.4, 0.25, 0.6, 0, -head * 0.5, hz - 0.5)]

def hardhat(col='YELLOW', hz=HZ, head=0.3):
    return [S(col, head * 1.15, 0, 0, hz + 0.1, 1, 1, 0.8), Y(col, head * 1.45, 0.06, 0, 0.02, hz + 0.1), B('E_YELLOW', 0.16, 0.08, 0.12, 0, head * 1.1, hz + 0.28)]

def ushanka(hz=HZ, head=0.3):
    return [S('FURW', head * 1.25, 0, -0.02, hz + 0.1, 1, 1, 0.85), B('FURW', 0.14, 0.2, 0.3, -head * 1.1, 0, hz - 0.1), B('FURW', 0.14, 0.2, 0.3, head * 1.1, 0, hz - 0.1)]

def cowboy(col='BROWN', hz=HZ, head=0.3, feather=False):
    p = [Y(col, 0.46, 0.06, 0, 0, hz + 0.3), Y(col, 0.27, 0.26, 0, 0, hz + 0.44)]
    if feather:
        p.append(B('GREEN', 0.04, 0.04, 0.45, 0.25, 0, hz + 0.65, 0, 0.3, -0.3))
    return p

def crown(hz=HZ, head=0.3, col='GOLD'):
    p = [Y(col, head * 1.0, 0.16, 0, 0, hz + head * 0.95)]
    for i in range(5):
        a = math.tau * i / 5
        p.append(K(col, 0.07, 0.24, math.cos(a) * head * 0.85, math.sin(a) * head * 0.85, hz + head * 0.95 + 0.2))
    return p

def bandana(col='BLUE_M', hz=HZ, head=0.3):
    return [S(col, head * 1.1, 0, -0.02, hz + 0.1, 1, 1, 0.7), B(col, 0.12, 0.16, 0.34, 0, -head * 1.0, hz + 0.0, 0, 0, 0)]

def goblin_head(skin='SKIN_G', hz=1.6, head=0.34, hat=None):
    p = [S(skin, head, 0, 0.04, hz, 1.05, 1, 0.9), K(skin, 0.1, 0.55, -head * 1.35, 0, hz + 0.08, 0, 0, Z * 0.9), K(skin, 0.1, 0.55, head * 1.35, 0, hz + 0.08, 0, 0, -Z * 0.9),
         S('SKIN_G', 0.1, 0, head * 1.0, hz - 0.05, 1, 1, 0.9), S('WHITE', 0.09, -0.14, 0.3, hz + 0.08), S('WHITE', 0.09, 0.14, 0.3, hz + 0.08), S('DARK', 0.045, -0.14, 0.37, hz + 0.08), S('DARK', 0.045, 0.14, 0.37, hz + 0.08),
         B('WHITE', 0.24, 0.04, 0.06, 0, 0.32, hz - 0.2)]
    return p

# --- hand items.  (hx, hy, hz) is the right hand
def item_sword(c='STEEL', L=1.2, hx=0.55, hy=0.5, hz=1.55, rx=0.3, tint=None):
    return [B(c, 0.12, 0.04, L, hx, hy + 0.1, hz + L / 2 + 0.1, rx), B('GOLD', 0.34, 0.08, 0.08, hx, hy, hz + 0.05, rx), Y('LEATHER', 0.05, 0.3, hx, hy - 0.04, hz - 0.12, rx)]

def item_axe(L=1.4, hx=0.55, hy=0.45, hz=1.5, head='STEEL', double=False):
    p = [Y('WOOD', 0.06, L, hx, hy, hz + L / 2 - 0.2, 0.15), B(head, 0.08, 0.5, 0.5, hx, hy + 0.1, hz + L - 0.35, 0.15)]
    if double:
        p.append(B(head, 0.08, 0.5, 0.5, hx, hy - 0.1, hz + L - 0.35, 0.15))
    p.append(K(head, 0.1, 0.25, hx, hy + 0.3, hz + L - 0.35, -Z, 0, 0))
    return p

def item_hammer(L=1.3, hx=0.55, hy=0.5, hz=1.5, head='GOLD'):
    return [Y('WOOD', 0.06, L, hx, hy, hz + L / 2 - 0.2, 0.2), B(head, 0.5, 0.42, 0.42, hx, hy + 0.12, hz + L - 0.1, 0.2), B('STEEL', 0.54, 0.12, 0.45, hx, hy + 0.12, hz + L - 0.1, 0.2)]

def item_bow(hx=0.55, hy=0.55, hz=1.45, col='WOOD', L=1.3):
    return [Y(col, 0.04, L, hx, hy, hz, 0.0, 0, 0), B('BONE', 0.02, 0.02, L * 0.95, hx - 0.1, hy - 0.15, hz), B(col, 0.08, 0.3, 0.1, hx, hy + 0.1, hz + L / 2), B(col, 0.08, 0.3, 0.1, hx, hy + 0.1, hz - L / 2),
            B('STEEL', 0.03, 0.5, 0.03, hx, hy + 0.3, hz, 0, 0, 0)]

def item_staff(orb='E_CYAN', L=2.3, hx=0.6, hy=0.4, hz=1.0, skull=False, r=0.17):
    p = [Y('WOOD', 0.05, L, hx, hy, hz + L / 2 - 0.5, 0.1)]
    if skull:
        p += [S('BONE', 0.2, hx, hy + 0.04, hz + L - 0.35), B('DARK', 0.1, 0.06, 0.08, hx, hy + 0.2, hz + L - 0.33)]
    else:
        p += [S(orb, r, hx, hy + 0.04, hz + L - 0.4), T('GOLD', r * 0.9, 0.03, hx, hy + 0.04, hz + L - 0.4, Z, 0.1)]
    return p

def item_spear(L=2.2, hx=0.6, hy=0.45, hz=1.1, tip='STEEL'):
    return [Y('WOOD', 0.04, L, hx, hy, hz + L / 2 - 0.5, 0.05), K(tip, 0.1, 0.4, hx, hy, hz + L - 0.3)]

def item_gun(L=1.7, hx=0.5, hy=0.5, hz=1.45, col='STEEL', double=False):
    p = [Y(col, 0.06, L, hx, hy + L * 0.25, hz, -Z * 1.0 + 0.0, 0, 0), B('WOOD', 0.14, 0.7, 0.2, hx, hy - 0.25, hz - 0.12, 0.2)]
    p[0] = Y(col, 0.06, L, hx, hy + L * 0.25, hz, -Z, 0, 0)
    if double:
        p.append(Y(col, 0.06, L, hx + 0.12, hy + L * 0.25, hz, -Z, 0, 0))
    p.append(S('DARK', 0.09, hx, hy + L * 0.75, hz))
    return p

def item_shovel(hx=0.55, hy=0.4, hz=1.5):
    return [Y('WOOD', 0.05, 1.5, hx, hy, hz + 0.45, 0.2), B('STEEL', 0.4, 0.06, 0.5, hx, hy + 0.15, hz + 1.3, 0.2), B('STEEL', 0.4, 0.06, 0.5, hx, hy + 0.15, hz + 1.3, 0.2)]

def item_bomb(hx=0.4, hy=0.5, hz=1.6, r=0.38):
    return [S('DARK', r, hx, hy, hz), Y('WOOD', 0.04, 0.2, hx, hy, hz + r + 0.05), S('E_ORANGE', 0.08, hx, hy, hz + r + 0.18)]

def item_mace(hx=0.55, hy=0.45, hz=1.5, L=1.0, r=0.3):
    p = [Y('WOOD', 0.06, L, hx, hy, hz + L / 2 - 0.2, 0.15), S('DSTEEL', r, hx, hy + 0.1, hz + L, 1, 1, 1)]
    for a in range(6):
        ang = math.tau * a / 6
        p.append(K('DSTEEL', 0.07, 0.2, hx + math.cos(ang) * r, hy + 0.1 + math.sin(ang) * r, hz + L, 0, 0, 0, 5))
    return p

def shield_round(col='WOOD', hx=-0.62, hy=0.3, hz=1.35, r=0.42):
    return [Y(col, r, 0.1, hx, hy, hz, 0, Z, 0, seg=14), T('STEEL', r, 0.04, hx - 0.05, hy, hz, 0, Z, 0), S('STEEL', 0.09, hx - 0.07, hy, hz, 0.5, 1, 1)]

def shield_rect(col='WOOD', hx=-0.62, hy=0.35, hz=1.3, w=0.55, h=0.8):
    return [B(col, 0.1, w, h, hx, hy, hz), B('STEEL', 0.13, w + 0.06, 0.07, hx, hy, hz + h / 2), B('STEEL', 0.13, w + 0.06, 0.07, hx, hy, hz - h / 2), B('STEEL', 0.13, 0.07, h, hx, hy, hz)]

def cape(col='RED', top=1.8, L=1.3, bulk=1.0):
    return [B(col, 0.9 * bulk, 0.06, L, 0, -0.34, top - L / 2, 0.12)]

def wings_bat(col, spread=1.3, z=1.2, y=-0.1, tilt=0.3):
    return [B(col, spread, 0.04, 0.55, -spread / 2 - 0.3, y, z, 0, 0, tilt), B(col, spread, 0.04, 0.55, spread / 2 + 0.3, y, z, 0, 0, -tilt)]

def spirit(body, eye_big=True, hz=0.7, flame=None, bolt=None, hearts=False, size=0.5):
    p = [S(body, size, 0, 0, hz, 1, 0.95, 1.05)]
    for sx in (-1, 1):
        p += [S('WHITE', size * 0.28, sx * size * 0.33, size * 0.82, hz + 0.1, 0.9, 0.6, 1.1), S('DARK', size * 0.14, sx * size * 0.33, size * 0.98, hz + 0.1),
              S(body, size * 0.22, sx * size * 0.95, 0, hz - 0.1), S(body, size * 0.26, sx * size * 0.4, 0.02, hz - size * 0.9)]
    p += [B('DARK', size * 0.4, 0.05, 0.07, 0, size * 0.92, hz - 0.15)]
    if flame:
        p += [K(flame, size * 0.4, size * 1.0, 0, 0, hz + size * 1.2), K('E_YELLOW', size * 0.2, size * 0.6, 0, 0, hz + size * 1.1)]
    if bolt:
        for a in (-0.7, 0.7):
            p.append(K(bolt, 0.07, 0.5, a * size, 0, hz + size * 1.0, 0, 0, a))
    if hearts:
        p += [S('E_PINK', 0.1, -0.4, 0.2, hz + size + 0.2), S('E_PINK', 0.08, 0.4, 0.1, hz + size + 0.3)]
    return p

def dragon(body, belly, wing, horn='CREAM', fire=False, bone=False, sz=1.0, hz=0.9, spikes=None, eyec='E_YELLOW'):
    p = [S(body, 0.55, 0, 0, hz, 0.95, 1.5, 0.95), S(belly, 0.45, 0, 0.12, hz - 0.12, 0.8, 1.2, 0.85),
         S(body, 0.38, 0, 0.9, hz + 0.28, 1, 1.1, 0.95), B(body, 0.34, 0.5, 0.26, 0, 1.28, hz + 0.18), B('DARK', 0.2, 0.05, 0.05, 0, 1.54, hz + 0.18),
         S(eyec, 0.07, -0.18, 1.12, hz + 0.45), S(eyec, 0.07, 0.18, 1.12, hz + 0.45), S('DARK', 0.035, -0.19, 1.17, hz + 0.45), S('DARK', 0.035, 0.19, 1.17, hz + 0.45),
         K(horn, 0.07, 0.3, -0.18, 0.78, hz + 0.65, -0.3, 0, 0.3), K(horn, 0.07, 0.3, 0.18, 0.78, hz + 0.65, -0.3, 0, -0.3),
         K(body, 0.2, 1.0, 0, -1.2, hz - 0.1, Z, 0, 0, 7), K(body, 0.08, 0.3, 0, -1.8, hz - 0.2, Z, 0, 0, 5)]
    for sx in (-1, 1):
        p += [B(wing, 1.5, 0.05, 0.9, sx * 1.15, -0.15, hz + 0.55, 0, 0, -sx * 0.35), B(body, 1.4, 0.07, 0.07, sx * 1.15, 0.05, hz + 0.75, 0, 0, -sx * 0.35),
              S(body, 0.2, sx * 0.4, 0.5, hz - 0.45), S(body, 0.2, sx * 0.4, -0.45, hz - 0.45)]
    if spikes:
        for i in range(4):
            p.append(K(spikes, 0.08, 0.25, 0, -0.3 - i * 0.25, hz + 0.55 - i * 0.04))
    if fire:
        p += [K('E_ORANGE', 0.16, 0.5, 0, 1.75, hz + 0.18, -Z, 0, 0), K('E_YELLOW', 0.08, 0.3, 0, 1.85, hz + 0.18, -Z, 0, 0)]
    return p

def ogre(skin, top=None, pants='BROWN', bulk=1.0, belt='LEATHER', hair=None, brow=True, head=0.46):
    """Huge brute (giant / rune giant / electro giant ...). ~3 units tall."""
    p = []
    for sx in (-0.38 * bulk, 0.38 * bulk):
        p += [B(pants, 0.55 * bulk, 0.55, 1.0, sx, 0, 0.6), S(skin, 0.3, sx, 0.2, 0.15, 1, 1.5, 0.7)]
    p += [B(top or skin, 1.5 * bulk, 0.9, 1.3, 0, 0, 1.75), B(belt, 1.56 * bulk, 0.96, 0.22, 0, 0, 1.1), B('GOLD', 0.3, 0.04, 0.2, 0, 0.49, 1.1)]
    for sx in (-1, 1):
        p += [S(skin, 0.45, sx * 0.98 * bulk, 0, 2.25, 1, 1, 0.9), B(skin, 0.42, 0.42, 1.2, sx * 1.1 * bulk, 0.18, 1.5, -0.3), S(skin, 0.38, sx * 1.1 * bulk, 0.45, 0.9)]
    p += [S(skin, head, 0, 0.05, 2.75, 1, 1, 0.95), S(skin, 0.12, 0, head * 1.0, 2.7, 1, 0.8, 1)]
    if brow:
        p += [B('DARK', 0.5, 0.1, 0.12, 0, head * 0.85, 2.85, 0.1), S('DARK', 0.05, -0.16, head * 0.9, 2.78), S('DARK', 0.05, 0.16, head * 0.9, 2.78)]
    if hair:
        p += beard(hair, 2.75, head, 0.55, 0.5)
    return p

def barrel(hx=0, hy=0, hz=0.5, r=0.5, L=1.0, rot=(0, 0, 0)):
    return [Y('BARREL', r, L, hx, hy, hz, *rot), Y('BARREL', r * 1.12, L * 0.5, hx, hy, hz, *rot), T('STEEL', r * 1.02, 0.05, hx, hy, hz + L * 0.38, *rot), T('STEEL', r * 1.02, 0.05, hx, hy, hz - L * 0.38, *rot)]

def wheels(y=0, x=0.55, r=0.38, z=0.38):
    out = []
    for sx in (-x, x):
        out += [Y('WOOD', r, 0.14, sx, y, z, 0, Z, 0, seg=12), T('STEEL', r, 0.04, sx, y, z, 0, Z, 0), S('STEEL', 0.1, sx + (0.08 if sx > 0 else -0.08), y, z)]
    return out

def cannon_body(L=1.5, r=0.4, z=1.0, y=0.0, col='DSTEEL'):
    return [Y(col, r, L, 0, y + L * 0.1, z, -Z, 0, 0, seg=12), Y(col, r * 1.2, 0.15, 0, y + L * 0.6, z, -Z, 0, 0, seg=12), Y('DARK', r * 0.7, 0.1, 0, y + L * 0.62, z, -Z, 0, 0, seg=12), S(col, r * 0.9, 0, y - L * 0.4, z)]

def stone_base(w=2.0, h=0.9, col='STONE_D'):
    p = []
    for i in range(3):
        p.append(B(col if i % 2 == 0 else 'STONE', w - i * 0.15, w - i * 0.15, h / 3, 0, 0, h / 6 + i * h / 3))
    return p

def skeleton_person(helm=None, shield=False, item=None, bomb=False, size=1.0):
    """Skeleton frame used by guards / bomber / giant skeleton / wall breaker ..."""
    p = []
    for sx in (-0.13, 0.13):
        p += [Y('BONE', 0.05, 0.75, sx, 0, 0.45), B('BONE', 0.16, 0.3, 0.07, sx, 0.08, 0.07)]
    p += [B('BONE', 0.4, 0.22, 0.12, 0, 0, 0.95)]
    for i in range(4):
        p.append(B('BONE', 0.5 - i * 0.04, 0.24, 0.05, 0, 0, 1.1 + i * 0.1))
    p += [B('BONE', 0.06, 0.2, 0.6, 0, -0.02, 1.2), S('BONE', 0.27, 0, 0.02, 1.85), B('DARK', 0.11, 0.06, 0.11, -0.1, 0.23, 1.9), B('DARK', 0.11, 0.06, 0.11, 0.1, 0.23, 1.9), B('BONE', 0.17, 0.1, 0.07, 0, 0.21, 1.7)]
    p += [Y('BONE', 0.045, 0.55, -0.34, 0.1, 1.2, 0, 0, 0.5), Y('BONE', 0.045, 0.55, 0.34, 0.15, 1.35, -0.8, 0, -0.3), B('TEAM', 0.55, 0.3, 0.1, 0, 0, 0.9)]
    if helm == 'steel':
        p += [S('BROWN_R', 0.3, 0, 0.02, 1.95, 1, 1, 0.8), B('STEEL', 0.55, 0.06, 0.12, 0, 0.0, 1.95)]
    if helm == 'bandana':
        p += bandana('BLUE_L', 1.88, 0.27)
    if helm == 'aviator':
        p += [S('BROWN', 0.3, 0, 0.0, 1.95, 1, 1, 0.8), B('BROWN', 0.1, 0.1, 0.3, -0.28, 0.1, 1.8), B('BROWN', 0.1, 0.1, 0.3, 0.28, 0.1, 1.8)]
    if shield:
        p += shield_round('WOOD', -0.5, 0.25, 1.15, 0.38)
    if item == 'spear':
        p += item_spear(1.8, 0.45, 0.4, 1.1)
    if bomb:
        p += item_bomb(0.35, 0.5, 1.45, 0.34)
    return p

# ------------------------------------------------------------------ cards
M = {}
def card(fn):
    M[fn.__name__] = (fn, 1.0)
    return fn
def sized(sz):
    def deco(fn):
        M[fn.__name__] = (fn, sz)
        return fn
    return deco

@card
def archers():
    return person('GREEN_C', 'GREEN_D', boots='LEATHER', sleeves='GREEN_C') + hair_short('PINK_H') + [B('PINK_H', 0.5, 0.2, 0.3, 0, -0.2, HZ + 0.15)] + hood('GREEN_C', HZ, 0.3, 0.3) + item_bow() + [B('LEATHER', 0.2, 0.3, 0.5, 0.2, -0.3, 1.3)]

@sized(1.0)
def giant():
    p = ogre('SKIN_O', 'SKIN_O', 'BROWN', hair='ORANGE_H')
    p += [B('LEATHER', 0.2, 0.05, 1.5, -0.4, 0.46, 1.8, 0, 0, 0.5), B('LEATHER', 0.2, 0.05, 1.5, 0.4, 0.46, 1.8, 0, 0, -0.5), B('BROWN', 0.5, 0.3, 0.4, 0, 0.1, 0.8)]
    for sx in (-1.1, 1.1):
        p.append(Y('LEATHER', 0.26, 0.2, sx, 0.18, 1.15, 0, 0, 0.0, seg=8))
    return p
M['giant'] = (giant, 1.0)

@card
def mini_pekka():
    p = []
    for sx in (-0.24, 0.24):
        p += [B('DSTEEL', 0.34, 0.36, 0.6, sx, 0, 0.45), B('DSTEEL_L', 0.38, 0.5, 0.18, sx, 0.06, 0.1)]
    p += [B('DSTEEL', 0.9, 0.55, 0.85, 0, 0, 1.2), B('DSTEEL_L', 0.6, 0.06, 0.5, 0, 0.3, 1.25), B('TEAM', 0.94, 0.58, 0.1, 0, 0, 0.82),
          S('DSTEEL_L', 0.28, -0.6, 0, 1.55, 1, 1, 0.8), S('DSTEEL_L', 0.28, 0.6, 0, 1.55, 1, 1, 0.8), B('DSTEEL', 0.24, 0.24, 0.7, -0.68, 0.15, 1.2, -0.2), B('DSTEEL', 0.24, 0.24, 0.7, 0.7, 0.3, 1.25, -0.7)]
    p += [S('DSTEEL', 0.4, 0, 0, 1.95), B('DARK', 0.5, 0.08, 0.16, 0, 0.36, 1.95), S('E_CYAN', 0.07, -0.13, 0.4, 1.96), S('E_CYAN', 0.07, 0.13, 0.4, 1.96),
          K('CREAM', 0.1, 0.5, -0.46, 0, 2.2, 0, 0, 0.8), K('CREAM', 0.1, 0.5, 0.46, 0, 2.2, 0, 0, -0.8)] + item_sword('STEEL', 1.5, 0.7, 0.6, 1.4, 0.3)
    return p

def _goblin_body(top='LEATHER', hz=1.35):
    p = []
    for sx in (-0.12, 0.12):
        p += [Y('SKIN_G', 0.09, 0.5, sx, 0, 0.35), B('LEATHER', 0.2, 0.34, 0.12, sx, 0.08, 0.08)]
    p += [B(top, 0.5, 0.32, 0.55, 0, 0, 0.85), B('TEAM', 0.54, 0.36, 0.07, 0, 0, 0.62), B('SKIN_G', 0.12, 0.12, 0.5, -0.3, 0.1, 0.95, -0.4), B('SKIN_G', 0.12, 0.12, 0.5, 0.32, 0.18, 1.05, -0.9)]
    return p + goblin_head('SKIN_G', hz)

@card
def spear_goblins():
    return _goblin_body() + item_spear(1.9, 0.42, 0.45, 1.0)

@card
def musketeer():
    return person('BROWN', 'DARK', boots='LEATHER', bulk=1.0, sleeves='BROWN') + [B('PURPLE_H', 0.7, 0.08, 0.5, 0, 0.24, 1.3), B('CREAM', 0.3, 0.06, 0.5, 0, 0.25, 1.35)] + hair_long('PINK_H', HZ, 0.3, 0.45) + hat_tricorn() + item_gun(1.9)

@card
def baby_dragon():
    return dragon('GREEN', 'CREAM', 'GREEN_C', 'CREAM', fire=False, sz=1.0)

@card
def the_log():
    p = [Y('WOOD_L', 0.55, 2.4, 0, 0, 0.6, Z, 0, 0, seg=14), Y('BARK', 0.58, 2.2, 0, 0, 0.6, Z, 0, 0, seg=14), S('WOOD_L', 0.5, 0, 1.15, 0.6, 1, 0.3, 1), S('WOOD_L', 0.5, 0, -1.15, 0.6, 1, 0.3, 1),
         S('WHITE', 0.1, -0.2, 0.6, 0.75), S('WHITE', 0.1, 0.2, 0.6, 0.75), S('DARK', 0.05, -0.2, 0.67, 0.75), S('DARK', 0.05, 0.2, 0.67, 0.75), B('DARK', 0.3, 0.06, 0.06, 0, 0.6, 0.45),
         B('TEAM', 0.1, 0.7, 0.08, 0, 0.3, 1.18)]
    for i in (-0.8, 0, 0.8):
        p += [K('STEEL', 0.12, 0.3, 0.45, i, 0.7, 0, 0, -Z), K('STEEL', 0.12, 0.3, -0.45, i, 0.7, 0, 0, Z)]
    return p

@card
def cannon():
    return stone_base(1.9, 0.5) + cannon_body(1.6, 0.4, 1.2) + wheels(0.0, 0.6, 0.4, 0.7) + [B('TEAM', 0.7, 0.2, 0.2, 0, -0.3, 1.7)]

def _barbarian(helm_col='GOLD', hair_col='BLOND', skin='SKIN', brawny=1.0, horns=False):
    p = person('SKIN', 'BROWN', skin=skin, boots='SKIN', bulk=1.1 * brawny, sleeves=skin, teambelt=True)
    p += [B('RED', 0.84, 0.5, 0.26, 0, 0, 0.92), B('LEATHER', 0.84, 0.5, 0.1, 0, 0, 1.0), B('BROWN', 0.2, 0.2, 0.14, -0.55, 0.08, 1.2), B('BROWN', 0.2, 0.2, 0.14, 0.58, 0.28, 1.5, -0.8)]
    p += [S(helm_col, 0.34, 0, 0, HZ + 0.1, 1, 1, 0.85), B(helm_col, 0.74, 0.1, 0.12, 0, 0.3, HZ + 0.1)] + mustache(hair_col, HZ - 0.02, 0.5) + [B(hair_col, 0.5, 0.06, 0.12, 0, 0.3, HZ + 0.2)]
    p += [B('DARK', 0.2, 0.05, 0.05, 0, 0.3, HZ + 0.12)]
    if horns:
        p += [K('CREAM', 0.09, 0.4, -0.38, 0, HZ + 0.3, 0, 0, 0.9), K('CREAM', 0.09, 0.4, 0.38, 0, HZ + 0.3, 0, 0, -0.9)]
    return p

@card
def barbarians():
    return _barbarian() + item_sword('STEEL', 1.0, 0.7, 0.55, 1.5, 0.3)

@card
def minions():
    p = [S('SKIN_B', 0.42, 0, 0, 1.0, 1, 0.9, 1.05), S('SKIN_B', 0.34, 0, 0.3, 1.5), K('SKIN_B', 0.08, 0.35, -0.2, 0.3, 1.9, 0, 0, 0.3), K('SKIN_B', 0.08, 0.35, 0.2, 0.3, 1.9, 0, 0, -0.3),
         S('WHITE', 0.08, -0.14, 0.58, 1.55), S('WHITE', 0.08, 0.14, 0.58, 1.55), S('DARK', 0.04, -0.14, 0.64, 1.55), S('DARK', 0.04, 0.14, 0.64, 1.55), B('WHITE', 0.22, 0.04, 0.06, 0, 0.6, 1.35),
         K('BLUE_D', 0.08, 0.3, -0.26, 0.5, 1.25, -Z * 0.9, 0, 0), K('BLUE_D', 0.08, 0.3, 0.26, 0.5, 1.25, -Z * 0.9, 0, 0), B('TEAM', 0.3, 0.3, 0.1, 0, 0.0, 1.0)]
    p += [K('BLUE_D', 0.12, 0.5, 0, -0.5, 0.5, Z, 0, 0), B('BLUE_D', 0.8, 0.05, 0.45, -0.75, -0.2, 1.2, 0, 0, 0.5), B('BLUE_D', 0.8, 0.05, 0.45, 0.75, -0.2, 1.2, 0, 0, -0.5)]
    for sx in (-0.5, 0.5):
        p += [S('SKIN_B', 0.14, sx, 0.2, 0.9), K('DARK', 0.05, 0.2, sx, 0.3, 0.7, -Z, 0, 0)]
    return p

@card
def valkyrie():
    p = person('GREEN_C', 'ORANGE_D', skin='SKIN', boots='SKIN', sleeves='SKIN', bulk=0.95)
    p += [Y('ORANGE_D', 0.55, 0.6, 0, 0, 0.75, r2=0.38, seg=10), B('RED', 0.6, 0.06, 0.4, 0, 0.3, 0.85)] + hair_long('ORANGE_H', HZ, 0.3, 0.7) + helm_horned('STEEL', 'CREAM', HZ, 0.3) + item_axe(1.7, 0.65, 0.45, 1.3, 'STEEL', True)
    return p

@card
def witch():
    p = []
    p += [Y('PURP_D', 0.5, 1.3, 0, 0, 0.75, r2=0.3, seg=10), Y('ROBE_P', 0.55, 0.6, 0, 0, 0.3, r2=0.5, seg=10), B('TEAM', 0.5, 0.3, 0.1, 0, 0, 1.15), B('PURP_D', 0.15, 0.15, 0.6, -0.4, 0.1, 1.2, -0.3), B('PURP_D', 0.15, 0.15, 0.6, 0.4, 0.3, 1.3, -0.8)]
    p += [S('BONE', 0.26, 0, 0.04, 1.85), B('DARK', 0.1, 0.06, 0.1, -0.1, 0.24, 1.9), B('DARK', 0.1, 0.06, 0.1, 0.1, 0.24, 1.9), S('E_MAGENTA', 0.04, -0.1, 0.28, 1.9), S('E_MAGENTA', 0.04, 0.1, 0.28, 1.9)] + hood('ROBE_P', 1.88, 0.3, 0.6)
    return p + item_staff(skull=True, hx=0.65, hy=0.5, hz=0.8, L=2.4)

@card
def prince():
    horse = []
    for sx in (-0.3, 0.3):
        for sy in (-0.7, 0.7):
            horse += [Y('BROWN', 0.12, 0.8, sx, sy, 0.6), B('DARK', 0.2, 0.22, 0.12, sx, sy, 0.12)]
    horse += [S('BROWN', 0.55, 0, 0, 1.15, 0.9, 1.5, 0.9), S('BROWN', 0.38, 0, 1.15, 1.45, 1, 1.2, 1), B('BROWN', 0.28, 0.55, 0.28, 0, 1.5, 1.5, -0.3), B('TEAM', 0.1, 0.2, 0.5, 0, 0.6, 1.55, 0.5),
              B('DARK', 0.12, 0.06, 0.08, -0.2, 1.38, 1.58), B('DARK', 0.12, 0.06, 0.08, 0.2, 1.38, 1.58), B('BLUE_M', 0.9, 0.9, 0.1, 0, -0.1, 1.7), K('BROWN', 0.09, 0.35, -0.14, 1.1, 1.9, 0, 0, 0.2), K('BROWN', 0.09, 0.35, 0.14, 1.1, 1.9, 0, 0, -0.2), K('DARK', 0.12, 0.6, 0, -1.0, 1.1, Z, 0, 0)]
    rider = []
    for sx in (-0.3, 0.3):
        rider += [B('BLUE_D', 0.2, 0.24, 0.55, sx, 0.05, 1.95, 0, 0, sx)]
    rider += [B('GOLD', 0.7, 0.4, 0.7, 0, -0.12, 2.5), B('SKIN', 0.14, 0.14, 0.55, -0.45, 0.0, 2.45, -0.3), B('SKIN', 0.14, 0.14, 0.55, 0.45, 0.2, 2.6, -0.9), S('SKIN', 0.27, 0, -0.1, 3.0)]
    rider += helm_knight('GOLD', 'BLUE_L', 3.0, 0.27)
    rider += mustache('BROWN', 2.95, 0.34, 0.27)
    rider += [Y('WOOD', 0.05, 2.2, 0.55, 0.9, 2.7, -Z * 0.8), Y('TEAM', 0.07, 0.5, 0.55, 1.6, 2.65, -Z * 0.8), K('STEEL', 0.1, 0.3, 0.55, 2.2, 2.6, -Z * 0.8)]
    return horse + rider

@card
def ice_wizard():
    p = person('BLUE_G', 'BLUE_D', boots='DARK', sleeves='BLUE_G', bulk=0.95) + [B('FURW', 0.9, 0.5, 0.14, 0, 0, 1.7), B('FURW', 0.1, 0.5, 0.8, -0.38, 0, 1.3), B('FURW', 0.1, 0.5, 0.8, 0.38, 0, 1.3), B('BROWN', 0.84, 0.5, 0.12, 0, 0, 0.9)]
    p += [S('WHITE_S', 0.34, 0, -0.02, HZ + 0.12, 1, 1, 0.9), K('WHITE_S', 0.1, 0.5, 0, 0.1, HZ + 0.5, 0, 0, 0, 5), K('WHITE_S', 0.08, 0.4, -0.2, 0.05, HZ + 0.45, 0, 0, 0.5, 5), K('WHITE_S', 0.08, 0.4, 0.2, 0.05, HZ + 0.45, 0, 0, -0.5, 5)] + beard('WHITE_S', HZ, 0.3, 0.3, 0.3)
    p += item_staff('E_CYAN', 2.0, 0.65, 0.5, 1.0, r=0.2)
    return p

@sized(1.1)
def lava_hound():
    p = [S('LAVA', 0.8, 0, 0, 1.0, 1, 1.3, 0.95), S('LAVA', 0.55, 0, 1.0, 1.1), B('LAVA_G', 0.7, 0.05, 0.12, 0, 1.45, 1.1), B('E_ORANGE', 0.3, 0.1, 0.2, 0, 1.45, 0.9)]
    p += [K('LAVA', 0.2, 0.5, -0.4, 1.0, 1.7, 0, 0, 0.4), K('LAVA', 0.2, 0.5, 0.4, 1.0, 1.7, 0, 0, -0.4), S('E_ORANGE', 0.14, -0.28, 1.4, 1.35), S('E_ORANGE', 0.14, 0.28, 1.4, 1.35)]
    for i in range(5):
        p.append(S('LAVA_G', 0.12, ((i * 37) % 7 - 3) * 0.18, 0.4 - i * 0.2, 1.6, 1, 1, 0.6))
    for sx in (-1, 1):
        p += [B('LAVA', 1.2, 0.07, 0.8, sx * 1.35, -0.2, 1.5, 0, 0, -sx * 0.4), B('LAVA_G', 1.0, 0.08, 0.6, sx * 1.3, -0.2, 1.5, 0, 0, -sx * 0.4), S('LAVA', 0.3, sx * 0.55, 0.5, 0.35), S('LAVA', 0.3, sx * 0.55, -0.5, 0.35)]
    p += [K('LAVA', 0.2, 0.9, 0, -1.3, 1.0, Z, 0, 0), B('TEAM', 0.3, 0.3, 0.1, 0, 0, 1.75)]
    return p

@card
def royal_hogs():
    p = []
    for sx in (-0.3, 0.3):
        for sy in (-0.45, 0.5):
            p += [Y('PINK_D', 0.13, 0.55, sx, sy, 0.35), B('DARK', 0.22, 0.24, 0.12, sx, sy, 0.07)]
    p += [S('PINK', 0.55, 0, 0, 0.9, 0.95, 1.5, 0.9), S('PINK', 0.46, 0, 0.85, 1.0, 1, 0.95, 0.95), Y('PINK_D', 0.28, 0.3, 0, 1.28, 0.92, -Z, 0, 0), S('DARK', 0.05, -0.09, 1.42, 0.95), S('DARK', 0.05, 0.09, 1.42, 0.95),
          S('WHITE', 0.09, -0.25, 1.2, 1.28), S('WHITE', 0.09, 0.25, 1.2, 1.28), S('DARK', 0.045, -0.25, 1.28, 1.28), S('DARK', 0.045, 0.25, 1.28, 1.28), K('CREAM', 0.07, 0.3, -0.2, 1.3, 0.75, 0, 0, 0.5), K('CREAM', 0.07, 0.3, 0.2, 1.3, 0.75, 0, 0, -0.5),
          K('PINK_D', 0.14, 0.3, -0.3, 0.8, 1.5, 0, 0, 0.5), K('PINK_D', 0.14, 0.3, 0.3, 0.8, 1.5, 0, 0, -0.5), B('RED', 0.95, 1.1, 0.1, 0, -0.1, 1.5), B('GOLD', 1.0, 0.14, 0.14, 0, 0.4, 1.52), B('GOLD', 0.1, 1.1, 0.14, 0, -0.1, 1.54),
          B('TEAM', 1.0, 0.1, 0.1, 0, -0.65, 1.5), T('PINK_D', 0.08, 0.03, 0, -0.85, 1.0)]
    return p

@card
def miner():
    p = person('BLUE_L', 'BROWN', boots='LEATHER', bulk=1.15, sleeves='SKIN', head=0.34) + [B('LEATHER', 0.12, 0.5, 0.9, -0.28, 0.01, 1.3), B('LEATHER', 0.12, 0.5, 0.9, 0.28, 0.01, 1.3), B('GOLD', 0.1, 0.06, 0.1, -0.28, 0.27, 1.0), B('GOLD', 0.1, 0.06, 0.1, 0.28, 0.27, 1.0)]
    p += hardhat('GREY', 1.98, 0.34) + mustache('BROWN', 1.98, 0.3, 0.34) + beard('BROWN', 1.98, 0.34, 0.3, 0.2) + item_shovel(0.6, 0.45, 1.5)
    return p

@card
def goblin_cage():
    p = [B('STONE_D', 2.2, 2.2, 0.25, 0, 0, 0.12), B('WOOD', 0.18, 0.18, 2.0, -1.0, -1.0, 1.15), B('WOOD', 0.18, 0.18, 2.0, 1.0, -1.0, 1.15), B('WOOD', 0.18, 0.18, 2.0, -1.0, 1.0, 1.15), B('WOOD', 0.18, 0.18, 2.0, 1.0, 1.0, 1.15),
         B('WOOD', 2.2, 0.2, 0.2, 0, -1.0, 2.2), B('WOOD', 2.2, 0.2, 0.2, 0, 1.0, 2.2), B('WOOD', 0.2, 2.2, 0.2, -1.0, 0, 2.2), B('WOOD', 0.2, 2.2, 0.2, 1.0, 0, 2.2), B('STEEL_D', 2.3, 2.3, 0.1, 0, 0, 2.35), B('TEAM', 0.7, 0.1, 0.5, 0, 1.05, 1.9)]
    for i in range(5):
        p.append(Y('STEEL', 0.04, 2.0, -0.7 + i * 0.35, 1.0, 1.2))
    for sx in (-1.0, 1.0):
        p.append(B('STEEL', 0.2, 0.2, 0.3, sx, 1.05, 2.0))
    p += [S('SKIN_G', 0.32, 0, 0.1, 1.2), B('LEATHER', 0.6, 0.4, 0.5, 0, 0.1, 0.7), K('SKIN_G', 0.09, 0.5, -0.4, 0.1, 1.25, 0, 0, Z * 0.9), K('SKIN_G', 0.09, 0.5, 0.4, 0.1, 1.25, 0, 0, -Z * 0.9), S('WHITE', 0.08, -0.12, 0.38, 1.28), S('WHITE', 0.08, 0.12, 0.38, 1.28),
          S('DARK', 0.04, -0.12, 0.44, 1.28), S('DARK', 0.04, 0.12, 0.44, 1.28)]
    return p

@sized(1.1)
def goblin_giant():
    p = ogre('SKIN_G2', 'SKIN_G2', 'BROWN', belt='LEATHER', head=0.5)
    p += [B('LEATHER', 0.22, 0.05, 1.7, 0, 0.47, 1.8, 0, 0, 0.7), S('SKIN_P', 0.14, 0, 0.62, 2.6, 1, 1, 0.7)]
    for sx in (-0.4, 0.4):
        p += [S('SKIN_G', 0.18, sx, -0.5, 3.0), S('LEATHER', 0.2, sx, -0.5, 2.75, 1, 0.8, 1.2), K('SKIN_G', 0.05, 0.25, sx - 0.2, -0.5, 3.0, 0, 0, 1.2)]
    p += item_spear(1.5, -0.4, -0.5, 2.9)
    return p

@card
def three_musketeers():
    return musketeer() + hair_long('PURPLE_H', HZ, 0.3, 0.35)

@sized(1.2)
def royal_giant():
    p = person('RED', 'BONE', boots='GOLD', bulk=1.25, sleeves='WHITE', head=0.34) + [B('RED', 1.0, 0.1, 1.5, 0, -0.34, 1.7, 0.1), B('WHITE', 1.0, 0.1, 0.2, 0, -0.33, 2.3, 0.1)]
    p += crown(2.0, 0.34) + beard('BROWN', 2.0, 0.34, 0.5, 0.4) + mustache('BROWN', 2.0, 0.55, 0.34)
    p += [Y('DSTEEL', 0.25, 1.4, 0.45, 0.65, 1.55, -Z, 0, 0), Y('DSTEEL', 0.32, 0.2, 0.45, 1.3, 1.55, -Z, 0, 0), B('GOLD', 0.4, 0.3, 0.2, 0.2, 0.5, 1.2)]
    return p

@card
def dark_prince():
    p = person('DSTEEL', 'DSTEEL_L', boots='DSTEEL', sleeves='DSTEEL', bulk=1.2) + [B('PURPLE_H', 0.7, 0.05, 0.5, 0, 0.26, 1.35), B('DSTEEL_L', 0.9, 0.52, 0.12, 0, 0, 1.7)]
    p += helm_knight('DSTEEL', 'PURPLE_H', 2.0, 0.32) + [S('DSTEEL_L', 0.3, -0.68, 0, 1.75, 1, 1, 0.8), S('DSTEEL_L', 0.3, 0.68, 0, 1.75, 1, 1, 0.8)]
    p += shield_rect('DSTEEL', -0.75, 0.35, 1.3, 0.6, 0.9) + [S('E_PURPLE', 0.1, -0.83, 0.35, 1.3)] + item_mace(0.7, 0.55, 1.4)
    return p

@sized(1.1)
def elite_barbarians():
    return _barbarian('BLACK_H', 'GOLD', brawny=1.1, horns=True) + item_sword('STEEL', 1.2, 0.75, 0.6, 1.5, 0.3)

@sized(1.35)
def mega_knight():
    p = []
    for sx in (-0.3, 0.3):
        p += [B('STEEL', 0.4, 0.42, 0.9, sx, 0, 0.55), B('STEEL_D', 0.46, 0.6, 0.2, sx, 0.08, 0.12)]
    p += [Y('GREY_B', 0.6, 0.5, 0, 0, 1.0, r2=0.7, seg=12), B('STEEL', 1.3, 0.8, 1.0, 0, 0, 1.75), B('GOLD', 0.4, 0.05, 0.3, 0, 0.42, 1.2), B('TEAM', 1.34, 0.84, 0.18, 0, 0, 1.2), S('STEEL', 0.45, -0.85, 0, 2.2, 1, 1, 0.8), S('STEEL', 0.45, 0.85, 0, 2.2, 1, 1, 0.8),
          B('SKIN', 0.3, 0.3, 0.9, -1.0, 0.2, 1.7, -0.4), B('SKIN', 0.3, 0.3, 0.9, 1.0, 0.2, 1.7, -0.4), B('STEEL', 0.34, 0.34, 0.5, -1.0, 0.2, 1.4), B('STEEL', 0.34, 0.34, 0.5, 1.0, 0.2, 1.4)]
    p += [S('STEEL', 0.4, 0, 0, 2.55), B('DARK', 0.5, 0.08, 0.1, 0, 0.36, 2.5), K('BLUE_G', 0.05, 0.4, 0, 0.15, 3.0)]
    p += item_mace(-1.05, 0.35, 1.9, 1.0, 0.4) + item_mace(1.05, 0.35, 1.9, 1.0, 0.4)
    return p

def _spell_icon(fn_parts):
    return fn_parts

@card
def lightning():
    p = []
    zs = [3.2, 2.4, 1.6, 0.8, 0.0]
    xs = [0.0, 0.3, -0.25, 0.25, 0.0]
    for i in range(4):
        dz = zs[i] - zs[i + 1]
        p.append(B('E_YELLOW', 0.25, 0.25, dz * 1.15, (xs[i] + xs[i + 1]) / 2, 0, (zs[i] + zs[i + 1]) / 2 + 0.3, 0, (xs[i + 1] - xs[i]) * 1.2, 0))
    p += [S('E_WHITE', 0.25, 0, 0, 0.35), S('E_CYAN', 0.5, 0, 0, 3.3, 1.6, 1.2, 0.5)]
    return p

@card
def x_bow():
    p = stone_base(1.9, 0.9) + [B('WOOD', 0.3, 0.3, 1.2, 0, 0, 1.4), B('WOOD', 2.2, 0.28, 0.22, 0, 0.35, 2.0), B('WOOD', 1.6, 0.22, 0.2, -0.95, 0.15, 2.05, 0, 0, 0.0)]
    p += [B('WOOD', 0.18, 0.8, 0.18, -1.05, 0.62, 2.0, 0, 0, 0.5), B('WOOD', 0.18, 0.8, 0.18, 1.05, 0.62, 2.0, 0, 0, -0.5), B('STEEL', 0.06, 1.5, 0.06, 0, 0.9, 2.0), B('STEEL', 0.12, 0.2, 0.3, 0, 0.1, 2.0), B('TEAM', 0.4, 0.1, 0.3, 0, 0, 0.95)]
    p += [Y('STEEL', 0.05, 1.0, 0, 0.65, 2.0, -Z, 0, 0), K('STEEL', 0.1, 0.3, 0, 1.2, 2.0, -Z, 0, 0), B('RED', 0.08, 0.2, 0.08, 0, 0.2, 2.0)]
    return p

@card
def mirror():
    p = [Y('STONE_D', 1.1, 0.25, 0, 0, 0.12, seg=12), Y('STONE', 0.9, 0.2, 0, 0, 0.3, seg=12), B('STEEL', 0.15, 0.2, 0.7, 0, 0, 0.8), Y('STEEL', 0.8, 0.14, 0, 0, 1.9, Z, 0, 0, seg=16), Y('E_PURPLE', 0.66, 0.1, 0, 0.0, 1.9, Z, 0, 0, seg=16),
         Y('G_ICE', 0.62, 0.12, 0, 0.02, 1.9, Z, 0, 0, seg=16), B('E_MAGENTA', 0.3, 0.05, 0.42, 0, 0.1, 1.9, 0, 0, 0.3), T('E_PURPLE', 1.0, 0.04, 0, 0, 0.5, 0.0, 0, 0), B('TEAM', 0.3, 0.1, 0.3, 0, 0.4, 0.55)]
    return p

@card
def fire_spirit():
    return spirit('ORANGE_D', flame='E_ORANGE', size=0.5)

@card
def electro_spirit():
    return spirit('E_YELLOW', bolt='E_CYAN', size=0.5)

@card
def heal_spirit():
    return spirit('PINKW', hearts=True, size=0.5)

@card
def bomber():
    p = skeleton_person('bandana', bomb=True)
    return p

@card
def elixir_collector():
    p = [Y('STEEL_D', 0.9, 0.3, 0, 0, 0.15, seg=10), Y('BROWN', 0.85, 0.3, 0, 0, 0.45, seg=10), Y('G_ICE', 0.75, 1.7, 0, 0, 1.45, seg=12), Y('E_MAGENTA', 0.68, 1.3, 0, 0, 1.25, seg=12), Y('STEEL_D', 0.9, 0.3, 0, 0, 2.4, seg=10), Y('STEEL', 0.4, 0.3, 0, 0, 2.7, seg=10),
         B('TEAM', 0.5, 0.1, 0.4, 0, 0.88, 0.5), Y('STEEL', 0.1, 1.0, 0.85, 0, 1.6), T('STEEL', 0.15, 0.06, 0.85, 0, 2.2, Z, 0, 0)]
    for i in range(5):
        p.append(S('E_PINK', 0.1, ((i * 53) % 9 - 4) * 0.12, ((i * 31) % 7 - 3) * 0.1, 1.0 + i * 0.22))
    return p

@card
def goblin_hut():
    p = [B('WOOD', 1.8, 1.6, 1.0, 0, 0, 0.5), B('STONE_D', 2.0, 1.8, 0.2, 0, 0, 0.1), B('WOOD_L', 2.2, 0.3, 1.0, 0, 0.5, 1.7, 0.6), B('WOOD_L', 2.2, 0.3, 1.0, 0, -0.5, 1.7, -0.6), B('WOOD_L', 2.2, 0.3, 0.3, 0, 0, 2.05),
         B('DARK', 0.7, 0.1, 0.8, 0, 0.82, 0.5), B('TEAM', 0.9, 0.1, 0.2, 0, 0.85, 1.05), B('GREEN_D', 0.3, 0.06, 0.4, 0.8, 0.82, 0.8)]
    p += [S('SKIN_G', 0.25, 0.2, 0.9, 0.45), K('SKIN_G', 0.07, 0.35, 0.0, 0.9, 0.45, 0, 0, Z * 0.9)]
    return p

@card
def furnace():
    p = [S('LAVA', 0.9, 0, 0, 1.0, 1, 1, 1.1), B('LAVA', 1.1, 1.0, 0.9, 0, 0, 0.7), B('STEEL_D', 1.3, 1.2, 0.2, 0, 0, 0.1), S('E_ORANGE', 0.3, -0.35, 0.82, 1.2), S('E_ORANGE', 0.3, 0.35, 0.82, 1.2), S('E_YELLOW', 0.15, -0.35, 0.95, 1.2), S('E_YELLOW', 0.15, 0.35, 0.95, 1.2),
         K('E_ORANGE', 0.5, 1.2, 0, 0, 2.2), K('E_YELLOW', 0.3, 0.9, 0, 0, 2.15), B('TEAM', 0.5, 0.1, 0.3, 0, 0.9, 0.55), B('E_ORANGE', 0.5, 0.05, 0.12, 0, 0.9, 0.45)]
    return p

@card
def spirit_empress():
    p = [Y('PINKW', 0.5, 1.3, 0, 0, 0.75, r2=0.3, seg=10), Y('WHITE', 0.65, 0.5, 0, 0, 0.3, r2=0.5, seg=10), B('E_PINK', 0.2, 0.05, 1.0, 0, 0.3, 1.0), B('TEAM', 0.5, 0.3, 0.1, 0, 0, 1.2), B('WHITE', 0.15, 0.15, 0.9, -0.5, 0.2, 1.2, -0.3, 0, 0.4), B('WHITE', 0.15, 0.15, 0.9, 0.5, 0.2, 1.2, -0.3, 0, -0.4),
         S('SKIN', 0.26, 0, 0.04, 1.85), S('DARK', 0.05, -0.1, 0.24, 1.88), S('DARK', 0.05, 0.1, 0.24, 1.88)] + hair_long('BLACK_H', 1.88, 0.26, 0.9) + crown(1.88, 0.26, 'WHITE')
    for sx in (-1, 1):
        p += [B('G_WHITE', 1.4, 0.05, 1.1, sx * 1.1, -0.35, 1.6, 0, 0, -sx * 0.4)]
    p += [S('E_BLUE', 0.2, -0.9, 0.3, 1.0), K('E_BLUE', 0.15, 0.4, -0.9, 0.3, 1.3), S('E_ORANGE', 0.2, 0.9, 0.3, 1.0), K('E_ORANGE', 0.15, 0.4, 0.9, 0.3, 1.3)]
    return p

@card
def earthquake():
    p = [Y('ROCK_B', 1.1, 0.2, 0, 0, 0.1, seg=12), Y('DARK', 0.7, 0.22, 0, 0, 0.1, seg=12)]
    for i in range(8):
        a = math.tau * i / 8
        p.append(B('ROCK_B', 0.4, 0.3, 0.3 + (i % 3) * 0.2, math.cos(a) * 0.95, math.sin(a) * 0.95, 0.3, 0.2 * i, 0.3, a))
    p += [B('DARK', 0.1, 1.8, 0.08, 0, 0, 0.22, 0, 0, 0.5), B('DARK', 0.1, 1.8, 0.08, 0, 0, 0.22, 0, 0, -0.5), S('ROCK_B', 0.3, 0.2, -0.2, 0.6), S('ROCK_B', 0.22, -0.3, 0.2, 0.9)]
    return p

@card
def graveyard():
    p = [Y('GREEN_D', 1.2, 0.15, 0, 0, 0.07, seg=14)]
    for sx, sy, h in ((-0.7, -0.4, 0.9), (0.7, 0.3, 0.7), (0.0, 0.8, 0.8)):
        p += [B('STONE_D', 0.6, 0.18, h, sx, sy, h / 2 + 0.1), Y('STONE_D', 0.3, 0.18, sx, sy, h + 0.1, Z, 0, 0, seg=8), B('DARK', 0.3, 0.02, 0.04, sx, sy + 0.1, h * 0.5)]
    for sx, sy in ((-0.2, -0.3), (0.3, -0.1), (0.1, 0.3)):
        p += [Y('SKIN_G2', 0.07, 0.8, sx, sy, 0.5, 0.2, 0, 0.2), S('SKIN_G2', 0.14, sx + 0.05, sy, 0.95), B('SKIN_G2', 0.06, 0.06, 0.2, sx - 0.1, sy, 0.9), B('SKIN_G2', 0.06, 0.06, 0.2, sx + 0.1, sy, 0.9)]
    p.append(S('E_GREEN', 0.15, 0, 0, 1.3))
    return p

@card
def lumberjack():
    p = person('PLAID', 'BLUE_D', boots='LEATHER', bulk=1.2, sleeves='PLAID', head=0.34) + [B('DARK', 0.06, 0.06, 0.8, -0.2, 0.25, 1.4), B('DARK', 0.84, 0.06, 0.08, 0, 0.25, 1.35)]
    p += ushanka(1.98, 0.34) + beard('ORANGE_H', 1.98, 0.34, 0.5, 0.45) + mustache('ORANGE_H', 1.98, 0.5, 0.34) + item_axe(1.7, 0.65, 0.45, 1.3, 'STEEL', False)
    return p

@card
def guards():
    return skeleton_person('steel', True, 'spear')

@card
def bats():
    p = [S('PURPLE_H', 0.36, 0, 0, 1.0), K('PINK_H', 0.12, 0.35, -0.22, 0.08, 1.45, 0, 0, 0.2), K('PINK_H', 0.12, 0.35, 0.22, 0.08, 1.45, 0, 0, -0.2), S('WHITE', 0.07, -0.13, 0.28, 1.05),
         S('WHITE', 0.07, 0.13, 0.28, 1.05), S('DARK', 0.035, -0.13, 0.33, 1.05), S('DARK', 0.035, 0.13, 0.33, 1.05), B('WHITE', 0.15, 0.04, 0.05, 0, 0.34, 0.9), B('TEAM', 0.2, 0.1, 0.1, 0, 0, 0.7)]
    p += wings_bat('PURPLE_H', 1.0, 1.1, -0.05, 0.4) + [K('PINK_H', 0.05, 0.25, -0.12, 0.1, 0.55, -Z, 0, 0.2), K('PINK_H', 0.05, 0.25, 0.12, 0.1, 0.55, -Z, 0, -0.2)]
    return p

@sized(1.2)
def ram_rider():
    ram = []
    for sx in (-0.35, 0.35):
        for sy in (-0.6, 0.6):
            ram += [Y('BROWN', 0.14, 0.75, sx, sy, 0.5), B('DARK', 0.24, 0.26, 0.12, sx, sy, 0.08)]
    ram += [S('BROWN', 0.62, 0, 0, 1.1, 1.0, 1.6, 0.95), S('BROWN', 0.42, 0, 1.2, 1.35, 1, 1.1, 1), T('CREAM', 0.35, 0.1, -0.5, 1.25, 1.4, 0, Z, 0), T('CREAM', 0.35, 0.1, 0.5, 1.25, 1.4, 0, Z, 0), T('CREAM', 0.3, 0.09, -0.5, 1.25, 1.4, 0.0, Z, 0.0),
            B('TEAM', 1.0, 0.8, 0.1, 0, -0.1, 1.65), S('DARK', 0.05, -0.18, 1.55, 1.5), S('DARK', 0.05, 0.18, 1.55, 1.5), S('DARK', 0.09, 0, 1.62, 1.2)]
    r = []
    for sx in (-0.3, 0.3):
        r += [B('LEATHER', 0.2, 0.24, 0.5, sx, 0.0, 1.95, 0, 0, sx)]
    r += [B('SKIN', 0.55, 0.32, 0.6, 0, -0.1, 2.4), B('GREEN_C', 0.58, 0.34, 0.2, 0, -0.1, 2.6), S('SKIN', 0.25, 0, -0.1, 2.9)] + hair_long('ORANGE_H', 2.9, 0.25, 0.4) + [B('ORANGE_H', 0.12, 0.12, 0.5, -0.2, -0.3, 2.7, 0.2)]
    r += [S('DARK', 0.035, -0.09, 0.1, 2.93), S('DARK', 0.035, 0.09, 0.1, 2.93), T('BROWN', 0.4, 0.04, 0.5, 0.3, 3.4, 0.2, 0.5, 0), B('SKIN', 0.14, 0.14, 0.55, 0.4, 0.0, 2.9, -0.2)]
    return ram + r

@card
def battle_healer():
    p = person('WHITE', 'STEEL', boots='STEEL', sleeves='STEEL', bulk=1.0) + [B('GOLD', 0.8, 0.5, 0.1, 0, 0, 1.7), B('STEEL', 0.7, 0.04, 0.5, 0, 0.26, 1.35), B('GOLD', 0.25, 0.04, 0.4, 0, 0.27, 1.35), S('STEEL', 0.25, -0.55, 0, 1.75), S('STEEL', 0.25, 0.55, 0, 1.75)]
    p += hair_long('BLOND', HZ, 0.3, 0.8) + [B('GOLD', 0.5, 0.06, 0.08, 0, 0.28, HZ + 0.25)] + item_staff('E_GREEN', 2.0, 0.65, 0.5, 1.0, r=0.2)
    return p

@card
def skeleton_barrel():
    p = barrel(0, 0, 3.0, 0.7, 1.4, (Z, 0, 0)) + [B('BONE', 0.5, 0.08, 0.5, 0, 0.0, 2.9)]
    for sx in (-0.4, 0.4):
        p += [S('BONE', 0.22, sx, 0.0, 3.9), B('BONE', 0.3, 0.2, 0.3, sx, 0.0, 3.55), B('DARK', 0.1, 0.05, 0.1, sx - 0.07, 0.18, 3.95), B('DARK', 0.1, 0.05, 0.1, sx + 0.07, 0.18, 3.95)]
    p += [S('RED', 0.8, 0, 0, 5.6, 1, 1, 1.2), S('RED', 0.5, -0.8, 0, 5.1, 1, 1, 1.1), S('RED', 0.5, 0.8, 0, 5.1, 1, 1, 1.1), S('PINK_D', 0.5, 0, 0.6, 5.0, 1, 1, 1.1)]
    for sx, sy in ((-0.5, 0), (0.5, 0), (0, 0.5), (0, -0.5)):
        p.append(Y('WOOD_L', 0.02, 1.4, sx, sy, 4.2))
    p += [B('TEAM', 0.4, 0.1, 0.4, 0, 0.7, 2.9), S('BONE', 0.25, 0, 0.72, 2.9, 1, 0.3, 1)]
    return p

@sized(1.2)
def mega_minion():
    p = [S('GREY_B', 0.5, 0, 0, 1.2, 1, 0.95, 1.0), B('STONE_T', 0.9, 0.5, 0.6, 0, 0, 1.2), S('SKIN_B', 0.4, 0, 0.35, 1.7), B('STONE_T', 0.8, 0.4, 0.5, 0, 0.3, 2.0),
         K('CREAM', 0.07, 0.3, -0.25, 0.7, 1.55, -0.6, 0, 0.2), K('CREAM', 0.07, 0.3, 0.25, 0.7, 1.55, -0.6, 0, -0.2), S('WHITE', 0.08, -0.15, 0.7, 1.8), S('WHITE', 0.08, 0.15, 0.7, 1.8), S('DARK', 0.04, -0.15, 0.76, 1.8), S('DARK', 0.04, 0.15, 0.76, 1.8),
         B('TEAM', 0.7, 0.4, 0.1, 0, 0, 0.9)]
    for sx in (-1, 1):
        p += [S('STONE_T', 0.4, sx * 0.8, 0.1, 1.5), S('STONE_T', 0.36, sx * 0.9, 0.5, 0.95), B('BLUE_D', 1.2, 0.05, 0.6, sx * 1.2, -0.3, 1.8, 0, 0, -sx * 0.4)]
    return p

@card
def barbarian_hut():
    p = [B('STONE_D', 2.2, 1.8, 0.3, 0, 0, 0.15), B('WOOD', 1.8, 1.5, 1.0, 0, 0, 0.75)]
    for i in range(6):
        p.append(Y('WOOD_L', 0.18, 1.8, -0.95 + i * 0.38, 0, 1.0, 0, Z * 0, 0))
    p += [B('WOOD_L', 2.2, 0.3, 1.0, 0, 0.6, 1.9, 0.7), B('WOOD_L', 2.2, 0.3, 1.0, 0, -0.6, 1.9, -0.7), B('DARK', 0.7, 0.1, 0.8, 0, 0.76, 0.7), B('TEAM', 0.9, 0.1, 0.2, 0, 0.8, 1.2), B('WHITE', 2.2, 0.8, 0.2, 0, 0.9, 2.2, 0.7),
          K('CREAM', 0.15, 0.6, -0.8, 0.8, 2.4, 0, 0, 0.5), K('CREAM', 0.15, 0.6, 0.8, 0.8, 2.4, 0, 0, -0.5), Y('WOOD', 0.05, 0.9, -0.9, 0.9, 0.5), S('E_ORANGE', 0.12, -0.9, 0.9, 1.05), Y('WOOD', 0.05, 0.9, 0.9, 0.9, 0.5), S('E_ORANGE', 0.12, 0.9, 0.9, 1.05)]
    return p

@sized(1.1)
def balloon():
    p = [S('RED', 1.1, 0, 0, 3.6, 1, 1, 1.15), S('WHITE', 0.5, 0, 0.9, 3.7, 1, 0.3, 1), B('DARK', 0.2, 0.1, 0.1, -0.2, 0.95, 3.8), B('DARK', 0.2, 0.1, 0.1, 0.2, 0.95, 3.8), B('DARK', 0.1, 0.1, 0.25, 0, 0.95, 3.5), K('ORANGE_D', 0.25, 0.3, 0, 0, 2.1, Z * 2, 0, 0, 8)]
    for sx, sy in ((-0.5, 0.4), (0.5, 0.4), (0.5, -0.4), (-0.5, -0.4)):
        p.append(Y('WOOD_L', 0.02, 1.2, sx, sy, 1.8, 0, 0, 0))
    p += [B('WOOD', 1.2, 1.0, 0.6, 0, 0, 1.1), B('WOOD_L', 1.3, 1.1, 0.12, 0, 0, 1.45), B('TEAM', 0.5, 0.05, 0.3, 0, 0.52, 1.1), S('BONE', 0.25, 0, 0, 1.75), B('DARK', 0.1, 0.05, 0.1, -0.08, 0.2, 1.8), B('DARK', 0.1, 0.05, 0.1, 0.08, 0.2, 1.8)]
    p += [S('DARK', 0.45, 0.0, 0.0, 0.5), Y('WOOD', 0.04, 0.2, 0, 0, 0.98), S('E_ORANGE', 0.07, 0, 0, 1.1), Y('WOOD_L', 0.02, 0.5, 0, 0.0, 0.8)]
    return p

@card
def hunter():
    p = person('FUR_D', 'BROWN', boots='LEATHER', bulk=1.05, sleeves='GREEN_C', head=0.3) + [B('GREEN_C', 0.9, 0.52, 0.8, 0, 0, 1.3), B('FURW', 0.92, 0.54, 0.14, 0, 0, 1.75), B('GOLD', 0.1, 0.04, 0.1, 0, 0.27, 0.95), B('FURW', 0.14, 0.2, 0.7, 0, 0.27, 1.3)]
    p += hair_short('ORANGE_H') + cowboy('BROWN', HZ, 0.3, True) + item_gun(1.9, 0.45, 0.5, 1.4, 'DSTEEL', True)
    return p

@sized(1.3)
def electro_giant():
    p = ogre('SKIN_P', 'SKIN_P', 'BROWN', belt='LEATHER', head=0.46)
    p += [B('LEATHER', 0.2, 0.05, 1.6, -0.4, 0.46, 1.8, 0, 0, 0.5), B('LEATHER', 0.2, 0.05, 1.6, 0.4, 0.46, 1.8, 0, 0, -0.5), B('STEEL_D', 0.9, 0.4, 1.1, 0, -0.65, 2.0), Y('STEEL', 0.15, 0.7, 0, -0.65, 2.8), S('E_CYAN', 0.2, 0, -0.65, 3.25), T('E_CYAN', 0.4, 0.04, 0, -0.65, 3.0, 0, 0, 0)]
    p += [S('E_CYAN', 0.07, -0.16, 0.45, 2.78), S('E_CYAN', 0.07, 0.16, 0.45, 2.78), K('E_CYAN', 0.06, 0.4, -1.4, 0.4, 2.4, 0, 0, 0.8), K('E_CYAN', 0.06, 0.4, 1.4, 0.4, 2.4, 0, 0, -0.8)]
    return p

@card
def night_witch():
    p = witch()
    return [x for x in p] + [B('BLACK_H', 1.0, 0.06, 1.0, 0, -0.4, 1.2, 0.1), K('PURPLE_H', 0.1, 0.2, 0.3, 0.0, 2.35)]

@card
def inferno_dragon():
    return dragon('ORANGE_D', 'TAN', 'RED_H', 'CREAM', fire=True, spikes='RED_H', eyec='E_YELLOW')

@card
def electro_dragon():
    return dragon('BLUE_L', 'ICE_W', 'BLUE_D', 'WHITE', fire=False, spikes='E_CYAN', eyec='E_CYAN') + [K('E_CYAN', 0.06, 0.5, -0.3, 1.7, 1.3, -Z, 0, 0.4), K('E_CYAN', 0.06, 0.5, 0.3, 1.7, 1.3, -Z, 0, -0.4)]

@card
def firecracker():
    p = person('ORANGE_D', 'BROWN', boots='LEATHER', sleeves='SKIN', bulk=0.9) + hair_long('ORANGE_H', HZ, 0.3, 0.5)
    p += [B('YELLOW', 0.5, 0.2, 0.2, 0, 0.1, HZ + 0.15), T('BLUE_M', 0.18, 0.05, -0.15, 0.2, HZ + 0.1, Z, 0, 0), T('BLUE_M', 0.18, 0.05, 0.15, 0.2, HZ + 0.1, Z, 0, 0), S('E_CYAN', 0.14, -0.15, 0.22, HZ + 0.1, 1, 0.3, 1), S('E_CYAN', 0.14, 0.15, 0.22, HZ + 0.1, 1, 0.3, 1)]
    p += [Y('RED', 0.18, 1.2, 0.35, 0.65, 1.5, -Z, 0, 0), B('YELLOW', 0.36, 0.2, 0.36, 0.35, 0.5, 1.5), B('YELLOW', 0.4, 0.2, 0.4, 0.35, 1.0, 1.5), K('E_ORANGE', 0.2, 0.5, 0.35, 1.45, 1.5, -Z, 0, 0), B('STEEL', 0.2, 0.4, 0.2, 0.35, 0.1, 1.3)]
    return p

@sized(1.3)
def giant_skeleton():
    p = skeleton_person('aviator', False, None, True)
    return p

@card
def sparky():
    p = []
    for sx in (-0.4, 0.4):
        p += [B('STEEL_D', 0.5, 0.5, 0.7, sx, 0, 0.5), B('GOLD', 0.56, 0.6, 0.22, sx, 0.05, 0.12)]
    p += [B('BLUE_S', 1.5, 0.9, 1.2, 0, 0, 1.55), B('GOLD', 1.56, 0.96, 0.2, 0, 0, 1.05), B('TEAM', 0.6, 0.05, 0.5, 0, 0.47, 1.6), S('STEEL', 0.34, -1.0, 0, 2.0), S('STEEL', 0.34, 1.0, 0, 2.0), B('GOLD', 0.4, 0.4, 0.8, -1.05, 0.2, 1.5, -0.3), B('GOLD', 0.4, 0.4, 0.8, 1.05, 0.2, 1.5, -0.3),
          S('BLUE_S', 0.5, 0, 0, 2.5), B('GOLD', 0.8, 0.3, 0.3, 0, 0.35, 2.55), S('E_CYAN', 0.14, -0.2, 0.5, 2.55), S('E_CYAN', 0.14, 0.2, 0.5, 2.55), B('STEEL_D', 0.7, 0.5, 1.0, 0, -0.6, 2.0), Y('STEEL', 0.12, 0.8, 0, -0.6, 2.8), S('E_CYAN', 0.2, 0, -0.6, 3.2)]
    return p

@card
def bomb_tower():
    p = [B('STONE_D', 2.1, 2.1, 0.3, 0, 0, 0.15)] + [Y('STONE', 0.95 - i * 0.04, 0.75, 0, 0, 0.6 + i * 0.7, seg=8) for i in range(3)]
    p += [Y('STONE_D', 1.2, 0.3, 0, 0, 2.7, seg=8), Y('STONE', 0.5, 0.1, 0, 0, 2.9, seg=8)]
    for i in range(8):
        a = math.tau * i / 8
        p.append(B('STONE', 0.4, 0.3, 0.3, math.cos(a) * 1.05, math.sin(a) * 1.05, 2.95, 0, 0, a))
    p += [Y('DSTEEL', 0.4, 1.0, 0, 0.5, 3.3, -0.9, 0, 0), S('DARK', 0.3, 0, 0.9, 3.7), B('TEAM', 0.7, 0.1, 0.4, 0, 0.95, 1.0)]
    for sx, sy in ((1.0, 0.4), (-0.8, 0.9), (0.9, 0.9)):
        p.append(S('DARK', 0.26, sx, sy, 0.45))
    return p

@card
def mortar():
    return [B('STONE_D', 2.1, 2.1, 0.3, 0, 0, 0.15), Y('STONE', 0.95, 0.5, 0, 0, 0.5, seg=8), Y('STONE_D', 0.7, 0.9, 0, 0, 1.0, r2=0.9, seg=10), Y('DARK', 0.55, 0.1, 0, 0, 1.5, seg=10), B('WOOD', 0.3, 1.8, 0.2, 0, 0, 0.45), B('TEAM', 0.6, 0.1, 0.4, 0, 0.9, 0.5)]

@card
def clone():
    p = knight_silhouette = person('G_ICE', 'G_ICE', 'G_ICE', 'G_ICE', 1.0, teambelt=False, eyes=False) + helm_knight('G_ICE', 'G_ICE', HZ, 0.3)
    p += [Y('E_CYAN', 1.1, 0.1, 0, 0, 0.05, seg=16), T('E_CYAN', 1.1, 0.04, 0, 0, 0.1, 0, 0, 0)]
    return p

@card
def freeze():
    p = []
    for i, (x, y, h, r) in enumerate([(0, 0, 2.2, 0.4), (0.7, 0.3, 1.6, 0.3), (-0.7, 0.2, 1.4, 0.3), (0.3, -0.6, 1.2, 0.25), (-0.4, -0.5, 1.0, 0.25), (0.9, -0.3, 0.9, 0.2)]):
        p.append(K('G_ICE', r, h, x, y, h / 2 + 0.05, 0.1 * i - 0.2, 0.1 * i, 0))
    p += [Y('G_WHITE', 1.2, 0.15, 0, 0, 0.07, seg=12), S('E_WHITE', 0.2, 0, 0, 1.0)]
    return p

@card
def rage():
    p = [Y('E_PURPLE', 0.75, 1.4, 0, 0, 0.9, seg=12), Y('G_WHITE', 0.78, 1.45, 0, 0, 0.92, seg=12), Y('G_WHITE', 0.35, 0.7, 0, 0, 2.0, seg=10), Y('WOOD', 0.4, 0.3, 0, 0, 2.5, seg=10), Y('E_MAGENTA', 0.6, 0.2, 0, 0, 0.2, seg=12)]
    for i in range(4):
        p.append(S('E_PINK', 0.08, math.cos(i) * 0.3, math.sin(i) * 0.3, 0.8 + i * 0.25))
    return p

@card
def snowball():
    p = [S('WHITE_S', 0.9, 0, 0, 0.95), S('ICE_W', 0.5, 0.5, 0.4, 1.4), S('ICE_W', 0.4, -0.5, 0.2, 1.2)]
    p += [K('G_ICE', 0.15, 0.5, -0.9, 0.4, 0.5, 0, 0, 0.7), K('G_ICE', 0.15, 0.5, 0.9, 0.0, 0.8, 0, 0, -0.7), K('G_ICE', 0.1, 0.4, 0.2, -0.9, 1.4, 0.7, 0, 0)]
    return p

@card
def barb_barrel():
    p = barrel(0, 0, 0.9, 0.75, 1.5, (0, 0, 0)) + [S('WHITE', 0.13, -0.28, 0.65, 1.15), S('WHITE', 0.13, 0.28, 0.65, 1.15), S('DARK', 0.07, -0.28, 0.75, 1.15), S('DARK', 0.07, 0.28, 0.75, 1.15), B('BROWN', 0.6, 0.1, 0.2, 0, 0.7, 1.3, 0.2), B('DARK', 0.3, 0.08, 0.1, 0, 0.7, 0.85),
                                                  B('TEAM', 0.5, 0.1, 0.2, 0, 0.74, 0.5), K('WOOD_L', 0.1, 0.3, -0.7, 0.2, 1.5, 0, 0, 0.6), K('WOOD_L', 0.1, 0.3, 0.7, 0.2, 0.4, 0, 0, -0.6)]
    return p

@card
def royal_delivery():
    p = [B('WOOD', 1.5, 1.5, 1.0, 0, 0, 0.5), B('STEEL_D', 1.6, 1.6, 0.25, 0, 0, 0.12), B('BLUE_G', 1.6, 1.6, 0.3, 0, 0, 0.6), B('GOLD', 0.5, 0.1, 0.3, 0, 0.78, 0.8), B('TEAM', 0.4, 0.1, 0.3, 0.5, 0.8, 0.6)]
    for sx, sy in ((-0.7, -0.7), (0.7, -0.7), (0.7, 0.7), (-0.7, 0.7)):
        p.append(Y('WOOD_L', 0.02, 2.2, sx * 0.9, sy * 0.9, 2.1, sx * 0.3, sy * 0.3, 0))
    p += [S('WHITE', 1.4, 0, 0, 3.5, 1, 1, 0.5), S('BLUE_G', 0.9, 0, 0, 3.5, 1.5, 1.5, 0.5), S('WHITE_S', 0.6, 0, 0, 3.6, 1, 1, 0.6)]
    return p

@card
def tornado():
    p = []
    for i in range(7):
        p.append(Y('G_WHITE', 0.3 + i * 0.16, 0.5, 0.05 * math.sin(i), 0.05 * math.cos(i), 0.3 + i * 0.5, r2=0.3 + (i - 1) * 0.16 + 0.1, seg=12))
    for i in range(5):
        p.append(B('ROCK_B', 0.2, 0.2, 0.2, math.cos(i * 1.3) * 1.0, math.sin(i * 1.3) * 1.0, 0.7 + i * 0.5, i, i, 0))
    return p

@card
def flying_machine():
    p = [B('WOOD', 1.2, 1.8, 0.7, 0, 0, 1.2), B('WOOD_L', 1.3, 1.9, 0.1, 0, 0, 1.6), B('STEEL', 0.15, 0.2, 0.6, 0.0, 0.0, 0.8), B('WOOD', 2.4, 0.4, 0.12, 0, -0.9, 1.3), B('TEAM', 0.8, 0.1, 0.4, 0, 0.92, 1.2), Y('WOOD', 0.04, 0.8, 0, 0, 2.2), B('WOOD', 3.2, 0.2, 0.05, 0, 0, 2.6, 0, 0, 0.3), B('WOOD', 3.2, 0.2, 0.05, 0, 0, 2.6, 0, 0, 1.8)]
    p += [Y('DSTEEL', 0.25, 1.0, 0, 1.2, 1.2, -Z, 0, 0), Y('DSTEEL', 0.32, 0.15, 0, 1.7, 1.2, -Z, 0, 0), S('DARK', 0.2, 0, 1.78, 1.2)]
    for sx in (-0.5, 0.5):
        p += [B('WOOD', 0.12, 1.4, 0.12, sx, 0, 0.5), B('WOOD', 0.3, 1.4, 0.1, sx, 0, 0.4)]
    p += [S('SKIN_G', 0.3, 0, -0.1, 1.95), K('SKIN_G', 0.08, 0.45, -0.35, -0.1, 2.0, 0, 0, Z * 0.9), K('SKIN_G', 0.08, 0.45, 0.35, -0.1, 2.0, 0, 0, -Z * 0.9), S('WHITE', 0.08, -0.12, 0.15, 2.0), S('WHITE', 0.08, 0.12, 0.15, 2.0), S('DARK', 0.04, -0.12, 0.21, 2.0), S('DARK', 0.04, 0.12, 0.21, 2.0), S('LEATHER', 0.32, 0, -0.12, 2.05, 1, 1, 0.65)]
    return p

@card
def wall_breakers():
    p = skeleton_person('steel', False, None, False) + barrel(0, -0.5, 1.5, 0.45, 0.9, (0, Z * 0 + 0.0, 0)) + [S('E_ORANGE', 0.12, 0, -0.5, 2.1)]
    return p

@card
def skeleton_dragons():
    return dragon('BONE', 'BONE', 'STONE_D', 'STONE_D', fire=True, bone=True, eyec='E_RED') + [B('DARK', 0.1, 0.05, 0.1, -0.16, 1.14, 1.4), B('DARK', 0.1, 0.05, 0.1, 0.16, 1.14, 1.4)]

@sized(1.25)
def bowler():
    p = ogre('SKIN_P', 'SKIN_P', 'BROWN', head=0.5, hair='ORANGE_H')
    p += [S('STONE_T', 0.95, 0.0, 0.9, 1.5, 1, 1, 1), S('STONE', 0.25, 0.3, 1.5, 1.8)]
    return p

@card
def executioner():
    p = person('GREY_B', 'DARK', boots='DARK', sleeves='SKIN', bulk=1.1) + [B('LEATHER', 0.1, 0.5, 0.8, 0.0, 0.0, 1.3, 0, 0, 0.5)]
    p += hood('BLACK_H', HZ, 0.3, 0.3) + [B('DARK', 0.5, 0.06, 0.22, 0, 0.26, HZ - 0.05)]
    p += [Y('WOOD', 0.07, 1.6, 0.6, 0.45, 1.4, 0.15, 0, 0), B('STEEL', 0.08, 1.0, 0.7, 0.6, 0.45, 2.1, 0.15), B('STEEL', 0.08, 1.0, 0.7, 0.6, 0.45, 2.1, 0.15), K('STEEL', 0.1, 0.3, 0.6, 1.1, 2.1, -Z, 0, 0), K('STEEL', 0.1, 0.3, 0.6, -0.1, 2.1, Z, 0, 0)]
    return p

@card
def zappies():
    p = []
    for sx in (-0.15, 0.15):
        p += [B('BLUE_S', 0.28, 0.3, 0.5, sx, 0, 0.35), B('YELLOW', 0.34, 0.4, 0.14, sx, 0.05, 0.08)]
    p += [B('BLUE_S', 0.8, 0.6, 0.65, 0, 0, 0.95), B('YELLOW', 0.84, 0.64, 0.1, 0, 0, 0.7), B('TEAM', 0.4, 0.05, 0.3, 0, 0.32, 0.95), B('BLUE_D', 0.2, 0.2, 0.5, -0.5, 0.1, 0.95, -0.3), B('BLUE_D', 0.2, 0.2, 0.5, 0.5, 0.2, 1.0, -0.6),
          B('BLUE_S', 0.9, 0.7, 0.7, 0, 0, 1.55), Y('YELLOW', 0.2, 0.15, -0.22, 0.38, 1.55, -Z, 0, 0), Y('YELLOW', 0.2, 0.15, 0.22, 0.38, 1.55, -Z, 0, 0), S('WHITE', 0.15, -0.22, 0.45, 1.55), S('WHITE', 0.15, 0.22, 0.45, 1.55), S('E_CYAN', 0.07, -0.22, 0.58, 1.55), S('E_CYAN', 0.07, 0.22, 0.58, 1.55),
          Y('STEEL', 0.08, 0.6, 0.45, 0.4, 1.0, -Z, 0, 0), S('E_CYAN', 0.12, 0.45, 0.75, 1.0), B('STEEL', 0.1, 0.1, 0.25, 0, 0, 1.95), S('E_YELLOW', 0.07, 0, 0, 2.15)]
    return p

@card
def rascals():
    p = person('LEATHER', 'DARK', boots='SKIN', sleeves='SKIN', bulk=0.8, head=0.34, legh=0.7) + hair_short('BLACK_H', 1.8, 0.34)
    p += [B('WOOD', 0.05, 0.5, 0.05, 0.4, 0.55, 1.4), B('WOOD', 0.05, 0.05, 0.4, 0.4, 0.55, 1.2, 0.5), Y('WOOD', 0.03, 0.4, 0.28, 0.55, 1.5, 0, 0.2, 0.0), B('DARK', 0.02, 0.02, 0.4, 0.4, 0.4, 1.4), S('STONE', 0.07, 0.4, 0.3, 1.45)]
    return p

@card
def royal_recruits():
    p = person('BLUE_S', 'BLUE_D', boots='LEATHER', bulk=1.0, sleeves='BLUE_S') + [B('LEATHER', 0.1, 0.5, 0.8, 0, 0, 1.3, 0, 0, 0.5)]
    p += [S('BLUE_G', 0.34, 0, 0, HZ + 0.1, 1, 1, 0.85), B('STEEL', 0.5, 0.06, 0.1, 0, 0.3, HZ + 0.05), B('STEEL', 0.06, 0.4, 0.2, 0, 0.0, HZ + 0.35), B('BLUE_L', 0.08, 0.1, 0.18, 0, 0.0, HZ + 0.5)] + mustache('BROWN', HZ - 0.05, 0.3, 0.3)
    p += shield_rect('WOOD', -0.6, 0.35, 1.25, 0.55, 0.85) + item_spear(1.9, 0.55, 0.5, 1.1)
    return p

@card
def cannon_cart():
    p = [B('WOOD', 1.6, 2.2, 0.35, 0, 0, 0.7), B('WOOD_L', 1.5, 2.1, 0.1, 0, 0, 0.92), B('STEEL', 0.15, 2.2, 0.15, -0.7, 0, 0.9), B('STEEL', 0.15, 2.2, 0.15, 0.7, 0, 0.9)] + wheels(-0.4, 0.85, 0.5, 0.5) + wheels(0.6, 0.85, 0.5, 0.5)
    p += cannon_body(1.8, 0.45, 1.5, 0.3) + [B('WOOD', 0.12, 1.3, 1.2, 0.0, 0.9, 1.5), B('STEEL', 0.14, 1.3, 1.3, 0.0, 0.91, 1.5), B('TEAM', 0.5, 0.1, 0.4, 0, 1.0, 1.5)]
    return p

@card
def goblin_drill():
    p = [K('STEEL', 0.8, 2.0, 0, 0, 0.9, Z * 2, 0, 0, 10), Y('GREEN_C', 0.85, 0.5, 0, 0, 1.95, seg=10), B('TEAM', 0.2, 0.2, 0.4, 0, 0.0, 2.3)]
    for i in range(6):
        a = math.tau * i / 6
        p.append(K('STEEL', 0.15, 0.4, math.cos(a) * 0.95, math.sin(a) * 0.95, 1.95, 0, 0, a + Z))
    p += [S('SKIN_G', 0.3, 0, 0, 2.5), K('SKIN_G', 0.08, 0.45, -0.35, 0, 2.55, 0, 0, Z * 0.9), K('SKIN_G', 0.08, 0.45, 0.35, 0, 2.55, 0, 0, -Z * 0.9), S('GOLD', 0.14, -0.14, 0.25, 2.55), S('GOLD', 0.14, 0.14, 0.25, 2.55), S('DARK', 0.05, -0.14, 0.32, 2.55), S('DARK', 0.05, 0.14, 0.32, 2.55), B('WHITE', 0.22, 0.04, 0.05, 0, 0.3, 2.35),
          B('BROWN', 0.6, 0.2, 0.5, 0, 0, 2.15), B('SKIN_G', 0.12, 0.12, 0.5, -0.35, 0.2, 2.3, -0.5), B('SKIN_G', 0.12, 0.12, 0.5, 0.35, 0.2, 2.3, -0.5)]
    return p

@sized(1.3)
def phoenix():
    p = [S('ORANGE_D', 0.4, 0, 0, 1.0, 1, 1.5, 1), S('E_ORANGE', 0.35, 0, 0.1, 0.95, 0.9, 1.3, 0.9), S('ORANGE_D', 0.25, 0, 0.85, 1.4), K('E_YELLOW', 0.1, 0.35, 0, 1.15, 1.35, -Z, 0, 0), S('DARK', 0.05, -0.12, 1.0, 1.5), S('DARK', 0.05, 0.12, 1.0, 1.5), K('E_ORANGE', 0.1, 0.4, 0, 0.8, 1.75, 0.2, 0, 0)]
    for sx in (-1, 1):
        p += [B('E_ORANGE', 1.6, 0.06, 0.8, sx * 1.2, 0, 1.4, 0, 0, -sx * 0.5), B('E_YELLOW', 1.2, 0.06, 0.5, sx * 1.4, -0.1, 1.6, 0, 0, -sx * 0.5), B('ORANGE_D', 0.9, 0.06, 0.4, sx * 0.9, -0.15, 1.1, 0, 0, sx * 0.1)]
    p += [K('E_ORANGE', 0.15, 1.2, 0, -0.8, 0.8, Z, 0, 0), K('E_YELLOW', 0.1, 0.9, -0.2, -0.9, 0.6, Z, 0, 0.2), K('E_YELLOW', 0.1, 0.9, 0.2, -0.9, 0.6, Z, 0, -0.2), B('TEAM', 0.3, 0.1, 0.1, 0, 0, 1.6)]
    return p

@card
def fisherman():
    p = person('YELLOW', 'BROWN', boots='LEATHER', bulk=1.1, sleeves='YELLOW', head=0.32) + [B('BLUE_M', 0.3, 0.05, 0.6, 0, 0.24, 1.3)]
    p += beard('ORANGE_H', HZ, 0.32, 0.5, 0.5) + mustache('ORANGE_H', HZ, 0.4, 0.32) + [Y('YELLOW', 0.5, 0.06, 0, 0, HZ + 0.18), S('YELLOW', 0.34, 0, 0, HZ + 0.2, 1, 1, 0.9), B('YELLOW', 0.5, 0.3, 0.06, 0, 0.45, HZ + 0.15, 0.2)]
    p += [T('STEEL', 0.4, 0.05, 0.6, 0.55, 1.0, 0.2, Z, 0), B('STEEL', 0.08, 0.08, 1.0, 0.65, 0.5, 1.9), T('STEEL', 0.25, 0.05, 0.65, 0.5, 2.5, Z, 0, 0), Y('WOOD', 0.05, 1.3, 0.55, 0.5, 1.6, 0.2)]
    return p

@card
def goblin_curse():
    p = [S('SKIN_G', 0.6, 0, 0, 1.2, 1, 1, 1.1), K('PURPLE_H', 0.7, 1.1, 0, 0, 1.0, Z * 2, 0, 0, 10), S('E_MAGENTA', 0.1, -0.2, 0.45, 1.3), S('E_MAGENTA', 0.1, 0.2, 0.45, 1.3), K('SKIN_G', 0.1, 0.5, -0.65, 0, 1.3, 0, 0, Z * 0.9), K('SKIN_G', 0.1, 0.5, 0.65, 0, 1.3, 0, 0, -Z * 0.9)]
    for i in range(3):
        a = i * 2.1
        p += [S('BONE', 0.2, math.cos(a) * 1.0, math.sin(a) * 1.0, 0.7 + i * 0.5), S('E_GREEN', 0.28, math.cos(a) * 1.0, math.sin(a) * 1.0, 0.7 + i * 0.5, 1, 1, 1)]
    return p

@card
def void():
    p = [Y('VOID', 1.1, 0.12, 0, 0, 0.06, seg=20), S('VOID', 0.8, 0, 0, 1.0, 1, 1, 1), T('E_PURPLE', 0.9, 0.06, 0, 0, 1.0, 0.0, 0, 0), T('E_MAGENTA', 1.1, 0.04, 0, 0, 1.0, 0.5, 0.0, 0), T('E_PURPLE', 1.3, 0.03, 0, 0, 1.0, 1.0, 0, 0)]
    return p

@card
def vines():
    p = [Y('GREEN_D', 0.9, 0.15, 0, 0, 0.07, seg=12)]
    for i in range(5):
        a = math.tau * i / 5
        r = 0.4 + (i % 2) * 0.2
        h = 1.6 + (i % 3) * 0.4
        p += [Y('GREEN_C', 0.1, h, math.cos(a) * r, math.sin(a) * r, h / 2, 0.15 * math.cos(a), 0.15 * math.sin(a), 0, r2=0.04), S('GREEN', 0.15, math.cos(a) * (r + 0.1), math.sin(a) * (r + 0.1), h, 1, 1, 0.5)]
    return p

@card
def goblin_demolisher():
    p = barrel(0, 0, 1.0, 0.8, 1.6, (Z, 0, 0)) + wheels(0, 0.9, 0.5, 0.5) + [B('TEAM', 0.5, 0.1, 0.4, 0, 0.9, 1.2)]
    p += [S('DARK', 0.5, 0, 0.95, 1.0), S('E_ORANGE', 0.1, 0, 1.4, 1.2)]
    p += [S('SKIN_G', 0.3, 0, -0.1, 2.1), K('SKIN_G', 0.08, 0.45, -0.35, -0.1, 2.15, 0, 0, Z * 0.9), K('SKIN_G', 0.08, 0.45, 0.35, -0.1, 2.15, 0, 0, -Z * 0.9), Y('RED_H', 0.31, 0.2, 0, -0.1, 2.3), S('WHITE', 0.1, -0.12, 0.15, 2.15), S('WHITE', 0.1, 0.12, 0.15, 2.15), S('DARK', 0.05, -0.12, 0.22, 2.15), S('DARK', 0.05, 0.12, 0.22, 2.15), B('LEATHER', 0.5, 0.3, 0.5, 0, -0.1, 1.65)]
    return p

@card
def goblin_machine():
    p = []
    for sx in (-0.4, 0.4):
        p += [B('STEEL_D', 0.3, 0.3, 0.9, sx, 0, 0.6), B('STONE_T', 0.5, 0.7, 0.2, sx, 0.1, 0.1)]
    p += [B('STEEL', 1.5, 1.1, 1.0, 0, 0, 1.55), B('GOLD', 1.55, 1.15, 0.1, 0, 0, 1.0), B('TEAM', 0.5, 0.05, 0.4, 0, 0.56, 1.5), Y('GOLD', 0.2, 0.15, 0, 0.58, 1.6, -Z, 0, 0)]
    p += cannon_body(1.6, 0.25, 1.9, 0.6)[:2] + [B('STEEL_D', 0.3, 0.3, 1.0, 1.0, 0.2, 1.7, -0.3), B('STEEL_D', 0.3, 0.3, 1.0, -1.0, 0.2, 1.7, -0.3), S('STEEL', 0.3, -1.0, 0.2, 1.2), S('STEEL', 0.3, 1.0, 0.2, 1.2)]
    p += [K('RED_H', 0.2, 0.7, 0.75, -0.3, 2.5, 0, 0, 0), K('STEEL', 0.15, 0.4, 0.75, -0.3, 2.95)]
    p += [S('SKIN_G', 0.3, 0, -0.1, 2.5), K('SKIN_G', 0.08, 0.45, -0.35, -0.1, 2.55, 0, 0, Z * 0.9), K('SKIN_G', 0.08, 0.45, 0.35, -0.1, 2.55, 0, 0, -Z * 0.9), S('E_CYAN', 0.1, -0.12, 0.15, 2.55), S('E_CYAN', 0.1, 0.12, 0.15, 2.55), S('DARK', 0.05, -0.12, 0.21, 2.55), S('DARK', 0.05, 0.12, 0.21, 2.55)]
    return p

@sized(1.3)
def rune_giant():
    p = ogre('SKIN', 'SKIN', 'BROWN', head=0.46, hair='BLUE_L', brow=True)
    p += [S('E_CYAN', 0.07, -0.16, 0.45, 2.8), S('E_CYAN', 0.07, 0.16, 0.45, 2.8), B('STONE_T', 0.5, 0.4, 0.6, -0.6, 0.55, 1.5), B('STONE_T', 0.5, 0.4, 0.6, 0.6, 0.55, 1.5), B('E_CYAN', 0.2, 0.05, 0.25, -0.6, 0.76, 1.5), B('E_CYAN', 0.2, 0.05, 0.25, 0.6, 0.76, 1.5)]
    for i in range(4):
        p.append(B('E_CYAN', 0.08, 0.05, 0.3, -0.4 + i * 0.27, 0.48, 1.9))
    return p

@card
def suspicious_bush():
    p = [S('GREEN_C', 0.8, 0, 0, 0.9, 1, 1, 0.95), S('GREEN', 0.55, -0.5, 0.2, 1.3), S('GREEN_D', 0.5, 0.5, 0.1, 1.3), S('GREEN', 0.5, 0.0, -0.3, 1.5), S('GREEN_C', 0.45, 0.0, 0.5, 0.5)]
    p += [S('WHITE', 0.2, -0.28, 0.65, 1.0), S('WHITE', 0.2, 0.28, 0.65, 1.0), S('GREEN_C', 0.05, -0.28, 0.82, 1.0), S('DARK', 0.1, -0.28, 0.82, 1.0), S('DARK', 0.1, 0.28, 0.82, 1.0), B('TEAM', 0.4, 0.1, 0.1, 0, 0.62, 0.5)]
    for i in range(7):
        p.append(K('GREEN', 0.1, 0.3, math.cos(i * 0.9) * 0.55, math.sin(i * 0.9) * 0.4, 1.7 + (i % 2) * 0.1))
    return p

@card
def berserker():
    p = _barbarian('DARK', 'RED_H', skin='SKIN', brawny=1.15)[:]
    p += [S('RED_H', 0.36, 0, -0.02, HZ + 0.08, 1, 1, 0.7)] + item_axe(1.3, 0.62, 0.45, 1.4, 'STEEL', False) + item_axe(1.3, -0.62, 0.35, 1.4, 'STEEL', False)
    return p

@card
def golden_knight():
    p = person('GOLD', 'GOLD', boots='GOLD', sleeves='GOLD', bulk=1.1, teambelt=True) + helm_knight('GOLD', 'RED', HZ, 0.31) + [S('GOLD', 0.3, -0.55, 0, 1.75, 1, 1, 0.8), S('GOLD', 0.3, 0.55, 0, 1.75, 1, 1, 0.8), B('RED', 0.7, 0.05, 0.6, 0, 0.26, 1.3)]
    p += item_sword('E_GOLD', 1.7, 0.7, 0.55, 1.5, 0.3) + [B('RED', 0.9, 0.06, 1.2, 0, -0.33, 1.7, 0.1)]
    return p

@sized(1.25)
def skeleton_king():
    p = skeleton_person(None, False, None, False)
    p = [x for x in p]
    p += [B('DARK', 0.9, 0.55, 0.9, 0, 0, 1.3), B('DSTEEL', 0.95, 0.58, 0.2, 0, 0, 1.78), S('DSTEEL', 0.34, -0.6, 0, 1.8, 1, 1, 0.8), S('DSTEEL', 0.34, 0.6, 0, 1.8, 1, 1, 0.8), B('E_GREEN', 0.3, 0.05, 0.3, 0, 0.3, 1.3)]
    p += crown(1.85, 0.27, 'GOLD') + [S('E_GREEN', 0.04, -0.1, 0.28, 1.9), S('E_GREEN', 0.04, 0.1, 0.28, 1.9)]
    p += item_sword('DSTEEL_L', 1.7, 0.7, 0.55, 1.5, 0.3) + [B('E_GREEN', 0.04, 0.05, 1.5, 0.7, 0.6, 2.4, 0.3)]
    return p

@card
def archer_queen():
    p = person('GREEN_C', 'PURP_D', boots='LEATHER', sleeves='SKIN', bulk=0.9) + hair_long('PURPLE_H', HZ, 0.3, 0.7) + crown(HZ, 0.3, 'GOLD') + [B('PURPLE_H', 1.0, 0.06, 1.3, 0, -0.34, 1.7, 0.15)]
    p += item_bow(0.55, 0.55, 1.45, 'STEEL', 1.3) + [B('LEATHER', 0.2, 0.3, 0.5, 0.2, -0.3, 1.3)]
    return p

@card
def monk():
    p = person('ORANGE_D', 'GREY_B', boots='SKIN', sleeves='SKIN', bulk=1.05) + [S('SKIN', 0.3, 0, 0, HZ), B('BROWN', 0.84, 0.5, 0.12, 0, 0, 0.95)]
    p += [T('BROWN', 0.3, 0.06, 0, 0.1, 1.7, 0, 0, 0)]
    for i in range(6):
        a = math.tau * i / 6
        p.append(S('BROWN', 0.07, math.cos(a) * 0.35, 0.1 + math.sin(a) * 0.15, 1.6))
    p += [T('E_GOLD', 0.8, 0.04, 0, 0.1, 1.5, 0, 0, 0.0), S('E_GOLD', 0.14, 0.7, 0.55, 1.7)]
    return p

@sized(1.1)
def mighty_miner():
    p = person('ORANGE_D', 'BROWN', boots='LEATHER', bulk=1.3, sleeves='SKIN', head=0.34) + hardhat('GOLD', HZ, 0.34) + beard('BROWN', HZ, 0.34, 0.5, 0.4) + mustache('BROWN', HZ, 0.4, 0.34)
    p += [B('LEATHER', 0.12, 0.55, 1.0, -0.3, 0.01, 1.3), B('LEATHER', 0.12, 0.55, 1.0, 0.3, 0.01, 1.3), Y('STEEL', 0.4, 1.3, 0.62, 0.9, 1.4, -Z, 0, 0, r2=0.1), Y('STEEL_D', 0.46, 0.3, 0.62, 0.2, 1.4, -Z, 0, 0), K('E_ORANGE', 0.1, 0.3, 0.62, 1.6, 1.4, -Z, 0, 0)]
    return p

@card
def little_prince():
    p = person('BLUE_M', 'BLUE_D', boots='LEATHER', bulk=0.8, sleeves='BLUE_M', head=0.36, legh=0.7, teambelt=True) + hair_short('BLACK_H', 1.82, 0.36) + crown(1.82, 0.36, 'GOLD') + [B('BLUE_L', 0.8, 0.06, 1.0, 0, -0.3, 1.5, 0.15)]
    p += item_sword('WOOD_L', 1.0, 0.5, 0.45, 1.3, 0.3)
    return p

@card
def boss_bandit():
    p = person('BLACK_H', 'BLACK_H', boots='DARK', bulk=1.3, sleeves='BLACK_H', head=0.32) + [B('RED', 0.5, 0.08, 0.5, 0, 0.26, 1.7), B('LEATHER', 0.9, 0.55, 0.14, 0, 0, 0.98)]
    p += hair_short('BLACK_H', HZ, 0.32) + [B('BLACK_H', 0.74, 0.5, 0.2, 0, 0, 2.1), B('RED', 0.6, 0.1, 0.34, 0, 0.3, HZ - 0.12), B('DARK', 0.5, 0.06, 0.12, 0, 0.3, HZ + 0.05), B('WHITE', 0.1, 0.05, 0.05, -0.1, 0.33, HZ + 0.05), B('WHITE', 0.1, 0.05, 0.05, 0.1, 0.33, HZ + 0.05)]
    p += [Y('STEEL', 0.05, 0.9, -0.55, 0.45, 1.2, 0.4, 0, 0), Y('STEEL', 0.05, 0.9, 0.65, 0.6, 1.5, 0.4, 0, 0)] + [B('E_GOLD', 0.2, 0.2, 0.2, 0.8, 0.2, 0.2), B('E_GOLD', 0.25, 0.25, 0.1, -0.8, 0.2, 0.1)]
    return p

@sized(1.2)
def goblinstein():
    p = ogre('SKIN_G2', 'GREY_B', 'DARK', belt='LEATHER', head=0.5) + [B('GREEN_D', 0.6, 0.1, 0.12, 0, 0.5, 3.15), B('DARK', 0.6, 0.1, 0.1, 0, 0.5, 3.0), Y('STEEL', 0.1, 0.15, -0.5, 0.0, 2.75, 0, Z, 0), Y('STEEL', 0.1, 0.15, 0.5, 0.0, 2.75, 0, Z, 0)]
    p += [B('STEEL', 0.4, 0.3, 0.1, 0, 0.0, 3.2), B('E_CYAN', 0.1, 0.1, 0.5, 0.7, 0.2, 2.9, 0, 0, -0.3)]
    for sx in (-1, 1):
        p.append(K('E_CYAN', 0.06, 0.5, sx * 1.4, 0.4, 2.4, 0, 0, sx * -0.8))
    return p


@card
def hero_wizard():
    p = person('BLUE_M', 'BLUE_D', boots='DARK', sleeves='BLUE_M', bulk=1.0) + [B('FURW', 0.9, 0.5, 0.14, 0, 0, 1.7), B('FURW', 0.1, 0.5, 0.8, -0.38, 0, 1.3), B('FURW', 0.1, 0.5, 0.8, 0.38, 0, 1.3), B('GOLD', 0.84, 0.5, 0.12, 0, 0, 0.9), B('GOLD', 0.1, 0.52, 0.8, -0.2, 0.02, 1.3), B('GOLD', 0.1, 0.52, 0.8, 0.2, 0.02, 1.3)]
    p += [S('GREY_B', 0.34, 0, -0.02, HZ + 0.1, 1, 1, 0.8), S('E_YELLOW', 0.06, -0.1, 0.27, HZ + 0.04), S('E_YELLOW', 0.06, 0.1, 0.27, HZ + 0.04)] + mustache('BLACK_H', HZ - 0.02, 0.4, 0.3) + beard('BLACK_H', HZ, 0.3, 0.3, 0.3)
    for i in range(5):
        p.append(K('YELLOW' if i % 2 else 'GREY_B', 0.09, 0.6, (i - 2) * 0.14, 0.0, HZ + 0.55 + (2 - abs(i - 2)) * 0.08, 0, 0, (i - 2) * 0.25, 5))
    p += [T('GOLD', 0.2, 0.05, -0.55, 0.15, 1.4, Z, 0, 0), T('GOLD', 0.2, 0.05, 0.62, 0.45, 1.5, Z, 0, 0), K('E_YELLOW', 0.07, 0.5, -0.5, 0.35, 1.9, 0, 0, 0.5), K('E_YELLOW', 0.07, 0.5, 0.8, 0.5, 1.9, 0, 0, -0.5)]
    return p

@card
def hero_magic_archer():
    p = person('TEAL_X', 'BLUE_D', boots='GOLD', sleeves='TEAL_X', bulk=1.0) if False else person('CRYS', 'BLUE_D', boots='GOLD', sleeves='CRYS', bulk=1.0)
    p += hood('CRYS', HZ, 0.3, 0.35) + [B('GOLD', 0.5, 0.06, 0.1, 0, 0.26, HZ + 0.18), B('GOLD', 0.84, 0.5, 0.1, 0, 0, 1.75), S('GOLD', 0.2, -0.55, 0, 1.75), S('GOLD', 0.2, 0.55, 0, 1.75)]
    p += [B('CRYS', 0.9, 0.06, 1.2, 0, -0.34, 1.6, 0.12)] + item_bow(0.55, 0.55, 1.45, 'E_CYAN', 1.6) + [K('E_CYAN', 0.08, 0.6, 0.55, 1.0, 1.45, -Z, 0, 0)]
    return p


@card
def ronin():
    p = person('PLAID', 'BLACK_H', boots='DARK', bulk=1.05, sleeves='BLACK_H') + [B('BLACK_H', 0.86, 0.5, 0.2, 0, 0, 1.75), B('RED', 0.14, 0.52, 0.8, 0.1, 0.01, 1.3, 0, 0, 0.5), B('DARK', 0.84, 0.5, 0.12, 0, 0, 0.92)]
    p += [Y('TAN', 0.62, 0.1, 0, 0, HZ + 0.28, seg=14), K('TAN', 0.6, 0.35, 0, 0, HZ + 0.45, 0, 0, 0, 14), B('RED', 0.6, 0.3, 0.14, 0, 0.3, HZ - 0.12), B('DARK', 0.5, 0.06, 0.12, 0, 0.3, HZ + 0.04)]
    p += item_sword('E_SWORD', 1.6, 0.6, 0.55, 1.5, 0.35) + [B('DARK', 0.1, 0.5, 0.1, 0.6, 0.55, 1.5)] + [B('STEEL', 0.06, 0.06, 1.2, -0.5, -0.36, 0.9, 0, 0.4, 0.0)]
    return p

@card
def minion_giant():
    p = [S('GREEN_C', 0.62, 0, 0, 1.1, 1, 0.95, 1.05), S('GREEN', 0.45, 0, 0.45, 1.65), S('SKIN_G2', 0.3, 0, 0.55, 1.4, 1, 1.2, 0.8), K('GREEN_D', 0.1, 0.4, -0.25, 0.45, 2.1, 0, 0, 0.3), K('GREEN_D', 0.1, 0.4, 0.25, 0.45, 2.1, 0, 0, -0.3),
         S('WHITE', 0.1, -0.18, 0.78, 1.72), S('WHITE', 0.1, 0.18, 0.78, 1.72), S('DARK', 0.05, -0.18, 0.86, 1.72), S('DARK', 0.05, 0.18, 0.86, 1.72), S('E_GREEN', 0.16, 0, 0.95, 1.35), B('TEAM', 0.4, 0.3, 0.1, 0, 0, 1.0)]
    for sx in (-1, 1):
        p += [B('GREEN_D', 1.6, 0.06, 0.8, sx * 1.35, -0.2, 1.4, 0, 0, -sx * 0.4), S('GREEN_C', 0.22, sx * 0.55, 0.3, 0.55), K('GREEN_D', 0.12, 0.5, sx * 0.5, -0.35, 0.6, Z, 0, 0)]
    p += [K('GREEN_D', 0.14, 0.8, 0, -0.7, 0.8, Z, 0, 0)]
    return p

@card
def hero_electro_wizard():
    p = person('BLUE_M', 'BLUE_D', boots='DARK', sleeves='BLUE_M', bulk=1.0) + [B('CREAM', 0.9, 0.5, 0.14, 0, 0, 1.72), B('GOLD', 0.84, 0.5, 0.12, 0, 0, 0.9), B('GOLD', 0.1, 0.52, 0.8, -0.22, 0.02, 1.3), B('GOLD', 0.1, 0.52, 0.8, 0.22, 0.02, 1.3), B('FURW', 0.1, 0.5, 0.8, -0.38, 0, 1.3), B('FURW', 0.1, 0.5, 0.8, 0.38, 0, 1.3)]
    p += [S('SKIN', 0.3, 0, 0, HZ), S('E_YELLOW', 0.07, -0.11, 0.26, HZ + 0.04), S('E_YELLOW', 0.07, 0.11, 0.26, HZ + 0.04)] + mustache('BLACK_H', HZ - 0.03, 0.46, 0.3) + beard('BLACK_H', HZ, 0.3, 0.34, 0.34)
    p += [B('BLACK_H', 0.1, 0.1, 0.12, -0.15, 0.27, HZ + 0.17, 0.0, 0, 0.5), B('BLACK_H', 0.1, 0.1, 0.12, 0.15, 0.27, HZ + 0.17, 0.0, 0, -0.5)]
    for i in range(7):
        p.append(K('YELLOW' if i % 2 else 'GOLD', 0.09, 0.75 - abs(i - 3) * 0.1, (i - 3) * 0.1, 0.0, HZ + 0.5, 0, 0, (i - 3) * 0.28, 5))
    p += [K('BLACK_H', 0.1, 0.5, 0, 0.0, HZ + 0.55, 0, 0, 0, 5)]
    p += [T('GOLD', 0.2, 0.05, -0.58, 0.12, 1.35, Z, 0, 0), T('GOLD', 0.22, 0.05, 0.62, 0.45, 1.5, Z, 0, 0), T('GOLD', 0.2, 0.05, -0.6, 0.12, 1.1, Z, 0, 0)]
    p += [K('E_CYAN', 0.07, 0.6, -0.55, 0.45, 1.9, 0, 0, 0.5), K('E_CYAN', 0.07, 0.6, 0.85, 0.6, 2.0, 0, 0, -0.5), S('E_CYAN', 0.1, -0.8, 0.5, 2.15), S('E_CYAN', 0.1, 1.05, 0.65, 2.25)]
    return p

# ------------------------------------------------------------------ build
def finish2(name, parts, sz=1.0):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.scale = (sz, sz, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for poly in obj.data.polygons:
        poly.use_smooth = False
    path = os.path.join(OUT, name + '.glb')
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_materials='EXPORT', export_yup=True)
    tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    d = obj.dimensions
    print('DIM', name, round(d.x, 1), round(d.y, 1), round(d.z, 1))
    bpy.data.objects.remove(obj, do_unlink=True)
    return path, tris

if __name__ == '__main__':
    import json
    SCALE = {k: 1.5 for k in M}
    SCALE.update({k: 1.0 for k in ('cannon', 'bomb_tower', 'mortar', 'x_bow', 'goblin_hut', 'barbarian_hut', 'furnace', 'elixir_collector', 'goblin_cage', 'mirror', 'earthquake', 'graveyard', 'void', 'vines', 'freeze',
                                    'rage', 'tornado', 'lightning', 'royal_delivery', 'snowball', 'barb_barrel', 'goblin_curse', 'clone', 'cannon_cart', 'goblin_drill', 'the_log')})
    SCALE.update({'balloon': 1.1, 'skeleton_barrel': 1.0, 'lava_hound': 1.2, 'phoenix': 1.2, 'goblin_demolisher': 1.2, 'goblin_machine': 1.2, 'flying_machine': 1.3})
    json.dump(SCALE, open(os.path.join(OUT, 'batch2.json'), 'w'))
    todo = sys.argv[1:] or list(M)
    for cid in todo:
        fn, sz = M[cid]
        reset()
        try:
            path, tris = finish2(cid, fn(), sz)
            print(cid, os.path.getsize(path) // 1024, 'KB', tris, 'tris')
        except Exception as e:
            import traceback
            print('FAILED', cid, e)
            traceback.print_exc()
