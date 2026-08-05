#!/usr/bin/env bash
# Build the social ad end to end: plates -> frames -> sound -> mp4.
#
#   ./build.sh            full 60fps master
#   ./build.sh 30         cheaper 30fps pass while iterating
set -euo pipefail

cd "$(dirname "$0")"

FPS="${1:-60}"
OUT="out/boatyard-sauna-${FPS}fps.mp4"

# ffmpeg: system build if there is one, otherwise the static binary pip ships
# with imageio-ffmpeg (that is what the render environment has).
FF="$(command -v ffmpeg || true)"
if [ -z "$FF" ]; then
  FF="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"
fi

echo "==> plates"
python3 prep-images.py > /dev/null

echo "==> frames (${FPS}fps)"
node render.mjs --fps "$FPS"

echo "==> sound"
python3 audio.py

echo "==> encode"
mkdir -p out
"$FF" -y -hide_banner -loglevel error \
  -framerate "$FPS" -i frames/f%05d.jpg \
  -i out/audio.wav \
  -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 18 \
  -profile:v high -level 4.2 -pix_fmt yuv420p \
  -x264-params "keyint=$((FPS * 2)):min-keyint=$FPS:scenecut=0" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest \
  "$OUT"

echo "==> $OUT"
"$FF" -hide_banner -i "$OUT" 2>&1 | sed -n '/Duration/,/Stream/p'
ls -lh "$OUT"
