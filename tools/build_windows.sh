#!/usr/bin/env bash
# Exports the Windows build (exe + pck) and zips it into release/.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT/godot"
godot --headless --path . --import
mkdir -p ../build/windows ../release
godot --headless --path . --export-release "Windows Desktop" ../build/windows/ClashRoyale3D.exe
cd ../build/windows && cp ../../release/WINDOWS-README.txt . && rm -f ../../release/ClashRoyale3D-windows.zip && zip -9 -q ../../release/ClashRoyale3D-windows.zip ClashRoyale3D.exe ClashRoyale3D.pck WINDOWS-README.txt
ls -l ../../release/ClashRoyale3D-windows.zip
