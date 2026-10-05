#!/usr/bin/env bash
# Builds a signed debug APK of the Godot 3D port.
# Works in the sandboxed container (no dl.google.com): assembles a minimal Android SDK layout from Ubuntu's
# apksigner/zipalign/adb/android-sdk-build-tools packages. Godot's non-gradle export only needs those tools,
# a JDK, the export templates and a debug keystore.
set -euo pipefail
GODOT_VERSION=4.3-stable
SDK=${ANDROID_SDK_DIR:-/opt/android-sdk}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

command -v godot >/dev/null || { echo "godot 4.3 not on PATH"; exit 1; }
if [ ! -d "$HOME/.local/share/godot/export_templates/4.3.stable" ]; then
  echo "Installing export templates..."
  curl -sSL -o /tmp/templates.tpz "https://github.com/godotengine/godot/releases/download/$GODOT_VERSION/Godot_v${GODOT_VERSION}_export_templates.tpz"
  mkdir -p /tmp/tpl "$HOME/.local/share/godot/export_templates/4.3.stable"
  unzip -oq /tmp/templates.tpz -d /tmp/tpl && cp -r /tmp/tpl/templates/* "$HOME/.local/share/godot/export_templates/4.3.stable/"
fi
if [ ! -x "$SDK/build-tools/34.0.0/apksigner" ]; then
  apt-get install -y -qq apksigner zipalign adb android-sdk-build-tools android-sdk-platform-tools
  mkdir -p "$SDK/build-tools/34.0.0" "$SDK/platforms/android-34" "$SDK/cmdline-tools/latest/bin"
  ln -sfn /usr/lib/android-sdk/platform-tools "$SDK/platform-tools"
  for f in /usr/lib/android-sdk/build-tools/29.0.3/*; do ln -sf "$f" "$SDK/build-tools/34.0.0/$(basename "$f")"; done
  for t in apksigner zipalign; do ln -sf "/usr/bin/$t" "$SDK/build-tools/34.0.0/$t"; done
  printf '#!/bin/sh\necho stub\n' > "$SDK/cmdline-tools/latest/bin/sdkmanager"; chmod +x "$SDK/cmdline-tools/latest/bin/sdkmanager"
fi
mkdir -p "$HOME/.android"
[ -f "$HOME/.android/debug.keystore" ] || keytool -genkeypair -keystore "$HOME/.android/debug.keystore" -storepass android -alias androiddebugkey \
  -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
SETTINGS="$HOME/.config/godot/editor_settings-4.3.tres"
mkdir -p "$(dirname "$SETTINGS")"; [ -f "$SETTINGS" ] || printf '[gd_resource type="EditorSettings" format=3]\n\n[resource]\n' > "$SETTINGS"
python3 - "$SETTINGS" "$SDK" <<'PY'
import re, sys
p, sdk = sys.argv[1], sys.argv[2]
s = open(p).read()
kv = {'export/android/android_sdk_path': f'"{sdk}"', 'export/android/java_sdk_path': '"/usr/lib/jvm/java-21-openjdk-amd64"',
      'export/android/debug_keystore': '"/root/.android/debug.keystore"', 'export/android/debug_keystore_user': '"androiddebugkey"',
      'export/android/debug_keystore_pass': '"android"'}
for k, v in kv.items():
    if re.search(r'^' + re.escape(k) + r' =', s, re.M): s = re.sub(r'^' + re.escape(k) + r' =.*$', f'{k} = {v}', s, flags=re.M)
    else: s = s.rstrip('\n') + f'\n{k} = {v}\n'
open(p, 'w').write(s)
PY
cd "$ROOT/godot"
godot --headless --path . --import
mkdir -p ../build ../release
godot --headless --path . --export-debug Android ../build/clash-royale-3d-debug.apk
# Godot stores imported resources uncompressed; deflate them (keeps native libs/resources.arsc as-is), re-align and re-sign.
python3 - ../build/clash-royale-3d-debug.apk ../build/recompressed.apk <<'PY'
import sys, zipfile
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, 'w') as zo:
    for info in zi.infolist():
        data = zi.read(info.filename)
        if info.filename.startswith('META-INF/'):
            continue   # signatures are recreated below
        comp = zipfile.ZIP_DEFLATED if info.filename.startswith('assets/') or info.filename.endswith('.dex') else info.compress_type
        zo.writestr(zipfile.ZipInfo(info.filename, info.date_time), data, compress_type=comp, compresslevel=9 if comp == zipfile.ZIP_DEFLATED else None)
PY
"$SDK/build-tools/34.0.0/zipalign" -f -p 4 ../build/recompressed.apk ../build/aligned.apk
"$SDK/build-tools/34.0.0/apksigner" sign --ks "$HOME/.android/debug.keystore" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey \
  --out ../release/clash-royale-3d-debug.apk ../build/aligned.apk
rm -f ../release/clash-royale-3d-debug.apk.idsig
apksigner verify --verbose ../release/clash-royale-3d-debug.apk | head -4
echo "APK: $ROOT/release/clash-royale-3d-debug.apk"
