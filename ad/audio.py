#!/usr/bin/env python3
"""Sound design for the ~31s Boat Yard Sauna ad.

Everything is synthesised from scratch with numpy — no samples, no licensing to
worry about — and every event is placed against the same beat map the picture
cuts on, so the audio lands with the edit rather than under it.

The arc mirrors the film: sea and a cold low drone, wood fire creeping in as
the sauna appears, a splash on the plunge cut, a soft pulse lifting through the
offer, and a warm bell resolving on the logo.

Writes ad/out/audio.wav (48kHz stereo, float -> 24-bit PCM).
"""

from __future__ import annotations

import os
import numpy as np

SR = 48_000
DUR = 30.8
N = int(SR * DUR)
T = np.arange(N) / SR

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")

rng = np.random.default_rng(20260805)


# ----------------------------------------------------------------- helpers

def seconds(t: float) -> int:
    return int(round(t * SR))


def env_ad(length: int, attack: float, decay: float, curve: float = 2.5) -> np.ndarray:
    """Attack/decay envelope in seconds, exponential release."""
    a = max(1, seconds(attack))
    e = np.empty(length)
    a = min(a, length)
    e[:a] = np.linspace(0.0, 1.0, a) ** 1.4
    rest = length - a
    if rest > 0:
        e[a:] = np.exp(-curve * np.arange(rest) / max(1, seconds(decay)))
    return e


def place(bus: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.0) -> None:
    """Mix a mono signal into a stereo bus at time `at`, equal-power panned."""
    i = seconds(at)
    if i >= N:
        return
    n = min(len(sig), N - i)
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    bus[i:i + n, 0] += sig[:n] * gain * l
    bus[i:i + n, 1] += sig[:n] * gain * r


def onepole_lp(x: np.ndarray, cutoff: float) -> np.ndarray:
    """Cheap but smooth 1-pole low pass — used for shaping noise beds."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = a * acc + (1 - a) * x[i]
        y[i] = acc
    return y


def biquad(x: np.ndarray, b: tuple[float, float, float], a: tuple[float, float, float]) -> np.ndarray:
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    b0, b1, b2 = b
    a0, a1, a2 = a
    for i in range(len(x)):
        xi = x[i]
        yi = (b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1 = x1, xi
        y2, y1 = y1, yi
        y[i] = yi
    return y


def bandpass(x: np.ndarray, f0: float, q: float = 1.2) -> np.ndarray:
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    return biquad(x, (alpha, 0.0, -alpha), (1 + alpha, -2 * cw, 1 - alpha))


def lowpass(x: np.ndarray, f0: float, q: float = 0.707) -> np.ndarray:
    w0 = 2 * np.pi * min(f0, SR * 0.45) / SR
    alpha = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    b = ((1 - cw) / 2, 1 - cw, (1 - cw) / 2)
    return biquad(x, b, (1 + alpha, -2 * cw, 1 - alpha))


def highpass(x: np.ndarray, f0: float, q: float = 0.707) -> np.ndarray:
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    b = ((1 + cw) / 2, -(1 + cw), (1 + cw) / 2)
    return biquad(x, b, (1 + alpha, -2 * cw, 1 - alpha))


def noise(length: int) -> np.ndarray:
    return rng.standard_normal(length)


def ramp(keys: list[tuple[float, float]]) -> np.ndarray:
    """Piecewise-linear automation curve sampled at audio rate."""
    ts = np.array([k[0] for k in keys])
    vs = np.array([k[1] for k in keys])
    return np.interp(T, ts, vs)


# -------------------------------------------------------------- the beat map
# Kept in sync with BEATS/SHOTS in timeline.js.

CUTS_SOFT = [2.50, 5.00, 11.05, 13.60, 18.30, 21.40]   # dissolves and wipes
CUTS_HARD = [7.30, 8.55, 9.80]                          # the ritual smash cuts
END = 24.76


# ------------------------------------------------------------------- layers

def sea_bed() -> np.ndarray:
    """Wash of surf: filtered noise with a slow swell, wide but not hissy."""
    out = np.zeros((N, 2))
    for ch, cut in enumerate((520.0, 610.0)):
        n = onepole_lp(noise(N), cut)
        n = onepole_lp(n, cut * 1.4)
        # two swells at different rates so the surf never loops audibly
        swell = (
            0.55
            + 0.30 * np.sin(2 * np.pi * T / 7.3 + ch * 1.1)
            + 0.15 * np.sin(2 * np.pi * T / 4.1 + ch * 2.4)
        )
        out[:, ch] = n * swell
    out /= np.max(np.abs(out)) + 1e-9
    # sits under everything; pulls back once the panels take over
    return out * ramp(
        [(0, 0.0), (1.2, 1.0), (13.0, 0.9), (18.2, 0.45), (23.7, 0.3), (24.76, 0.22), (30.8, 0.16)]
    )[:, None]


def pad() -> np.ndarray:
    """Slow string-ish drone. Chord changes are crossfaded, never cut."""
    chords = [
        (0.00, [110.00, 164.81, 261.63]),          # Am — cold, open
        (8.40, [87.31, 174.61, 261.63]),           # F  — the heat arrives
        (13.60, [98.00, 196.00, 293.66]),          # G  — lift
        (18.30, [87.31, 174.61, 261.63]),          # F
        (21.40, [98.00, 196.00, 246.94]),          # G  — tension into the end
        (24.76, [130.81, 196.00, 329.63]),         # C  — resolve on the logo
    ]
    out = np.zeros((N, 2))
    fade = 0.75
    for i, (start, freqs) in enumerate(chords):
        end = chords[i + 1][0] if i + 1 < len(chords) else DUR
        i0 = seconds(max(0.0, start - fade))
        i1 = min(N, seconds(end + fade))
        seg = np.arange(i1 - i0) / SR
        voice = np.zeros(i1 - i0)
        for k, f in enumerate(freqs):
            for h, amp in ((1, 1.0), (2, 0.26), (3, 0.11), (4, 0.05)):
                det = 1.0 + (0.0016 * ((k + h) % 3 - 1))
                voice += amp * np.sin(2 * np.pi * f * h * det * seg + k * 1.7 + h) / (k + 1.6)
        # gentle chorus movement
        voice *= 1.0 + 0.05 * np.sin(2 * np.pi * seg / 3.7 + i)
        g = np.ones(i1 - i0)
        f_in = min(seconds(fade * 2), len(g) // 2)
        g[:f_in] = np.linspace(0, 1, f_in) ** 1.6
        g[-f_in:] = np.linspace(1, 0, f_in) ** 1.6
        v = lowpass(voice * g, 1500, 0.8)
        out[i0:i1, 0] += v
        out[i0:i1, 1] += np.concatenate([np.zeros(11), v[:-11]])  # tiny Haas spread
    out /= np.max(np.abs(out)) + 1e-9
    return out * ramp(
        [(0, 0.0), (1.6, 0.72), (7.2, 0.8), (13.5, 0.9), (21.4, 1.0), (24.76, 0.95), (29.8, 0.75)]
    )[:, None]


def fire() -> np.ndarray:
    """Sparse stove crackle — individual pops, not a hiss."""
    out = np.zeros((N, 2))
    t = 2.3
    while t < 13.0:
        length = seconds(0.05)
        pop = noise(length) * env_ad(length, 0.0006, 0.012, 4.0)
        pop = bandpass(pop, float(rng.uniform(1400, 3800)), 1.1)
        density = 1.0 if 6.8 < t < 9.0 else 0.55
        place(out, pop, t, gain=float(rng.uniform(0.12, 0.4)) * density, pan=float(rng.uniform(-0.6, 0.6)))
        t += float(rng.uniform(0.06, 0.34))
    return out


def steam() -> np.ndarray:
    """Löyly — water hitting the stones just before the HEAT card lands."""
    length = seconds(1.5)
    s = noise(length)
    s = bandpass(s, 5200, 0.7) * 0.7 + bandpass(s, 2600, 0.9) * 0.5
    e = env_ad(length, 0.10, 0.42, 3.0)
    out = np.zeros((N, 2))
    place(out, s * e, 7.14, gain=0.30, pan=-0.15)
    place(out, s * e * 0.6, 7.20, gain=0.22, pan=0.35)
    return out


def splash() -> np.ndarray:
    """The plunge: a body of water, not a cymbal."""
    out = np.zeros((N, 2))
    length = seconds(1.4)
    body = noise(length)
    body = highpass(body, 400) * env_ad(length, 0.004, 0.20, 3.2)
    fizz = highpass(noise(length), 4200) * env_ad(length, 0.010, 0.55, 2.2) * 0.5
    thud = np.sin(2 * np.pi * 92 * np.arange(length) / SR) * env_ad(length, 0.002, 0.09, 5.0)
    hit = body * 0.8 + fizz + thud * 0.9
    place(out, hit, 8.55, gain=0.62, pan=-0.1)
    place(out, fizz, 8.62, gain=0.34, pan=0.4)
    # a second, smaller one as the swimmers cut arrives
    place(out, hit * 0.45, 9.80, gain=0.34, pan=0.2)
    return out


def hits() -> np.ndarray:
    """Sub thumps on the cuts — felt more than heard."""
    out = np.zeros((N, 2))

    def thump(f0: float, f1: float, dur: float, click: float = 0.0) -> np.ndarray:
        length = seconds(dur)
        s = np.arange(length) / SR
        sweep = f1 + (f0 - f1) * np.exp(-s * 26)
        phase = 2 * np.pi * np.cumsum(sweep) / SR
        sig = np.sin(phase) * env_ad(length, 0.001, dur * 0.34, 3.0)
        if click:
            sig += highpass(noise(length), 2000) * env_ad(length, 0.0005, 0.02, 6.0) * click
        return sig

    place(out, thump(120, 42, 1.1), 0.02, gain=0.75)
    for t in CUTS_SOFT:
        place(out, thump(96, 46, 0.8), t - 0.02, gain=0.34)
    for t in CUTS_HARD:
        place(out, thump(150, 52, 0.7, click=0.25), t - 0.015, gain=0.52)
    place(out, thump(140, 48, 1.3, click=0.2), END, gain=0.62)
    return out


def whooshes() -> np.ndarray:
    """Air moving through each transition — swept noise, alternating sides."""
    out = np.zeros((N, 2))
    marks = sorted(CUTS_SOFT + CUTS_HARD + [END])
    for i, t in enumerate(marks):
        hard = t in CUTS_HARD
        dur = 0.42 if hard else 0.78
        length = seconds(dur)
        s = np.arange(length) / SR
        n = noise(length)
        # sweep the band up into the cut, then let it fall away
        band = np.concatenate([
            bandpass(n[: length // 2], 700, 0.9),
            bandpass(n[length // 2:], 2600, 0.9),
        ])
        shape = np.sin(np.pi * np.linspace(0, 1, length)) ** 1.6
        pre = 0.5 * np.exp(-4 * (1 - np.linspace(0, 1, length)))
        sig = band * (shape + pre)
        place(out, sig, t - dur * 0.72, gain=0.20 if hard else 0.15,
              pan=-0.55 if i % 2 else 0.55)
    return out


def pulse() -> np.ndarray:
    """A soft heartbeat under the offer and locations — lift, not a dance beat."""
    out = np.zeros((N, 2))
    bpm = 100.0
    step = 60.0 / bpm
    t = 13.62
    i = 0
    while t < 24.6:
        length = seconds(0.42)
        s = np.arange(length) / SR
        f = 58 + 62 * np.exp(-s * 30)
        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(length, 0.001, 0.10, 4.0)
        level = np.interp(t, [13.6, 14.6, 23.7, 24.6], [0.0, 0.34, 0.34, 0.0])
        place(out, kick, t, gain=level)
        if i % 2 == 1:
            hl = seconds(0.10)
            hat = highpass(noise(hl), 7000) * env_ad(hl, 0.0008, 0.022, 6.0)
            place(out, hat, t, gain=level * 0.22, pan=0.3)
        # off-beat ghost note keeps it breathing
        gl = seconds(0.16)
        ghost = np.sin(2 * np.pi * 70 * np.arange(gl) / SR) * env_ad(gl, 0.002, 0.05, 4.0)
        place(out, ghost, t + step * 0.5, gain=level * 0.3)
        t += step
        i += 1
    return out


def riser() -> np.ndarray:
    """Noise swell lifting into the end card, cut dead on the logo."""
    length = seconds(1.7)
    s = np.arange(length) / SR
    n = noise(length)
    sweep = np.linspace(0, 1, length) ** 2.2
    body = bandpass(n, 900, 0.6) * 0.5 + bandpass(n, 3200, 0.8) * 0.5
    sig = body * sweep
    # a rising tone hidden inside the noise
    tone = np.sin(2 * np.pi * np.cumsum(np.linspace(180, 620, length)) / SR) * sweep * 0.22
    out = np.zeros((N, 2))
    place(out, sig + tone, END - 1.7, gain=0.34, pan=-0.2)
    place(out, sig * 0.7, END - 1.66, gain=0.24, pan=0.4)
    return out


def bell() -> np.ndarray:
    """Warm FM bell on the logo, plus its fifth — the last thing you hear."""
    out = np.zeros((N, 2))
    for f, g, delay, pan in ((523.25, 1.0, 0.0, -0.12), (784.0, 0.5, 0.09, 0.22), (1046.5, 0.3, 0.17, 0.0)):
        length = seconds(2.6)
        s = np.arange(length) / SR
        mod = np.sin(2 * np.pi * f * 1.41 * s) * np.exp(-s * 3.4) * 2.2
        sig = np.sin(2 * np.pi * f * s + mod) * env_ad(length, 0.004, 0.72, 2.4)
        place(out, sig, END + delay, gain=0.30 * g, pan=pan)
    return out


# ------------------------------------------------------------------ reverb

def reverb_ir(seconds_len: float = 1.9) -> np.ndarray:
    """Synthetic hall: decaying noise with a short pre-delay, stereo-decorrelated."""
    length = seconds(seconds_len)
    s = np.arange(length) / SR
    ir = np.zeros((length, 2))
    for ch in range(2):
        n = noise(length) * np.exp(-s * 3.1)
        n = lowpass(n, 5200 - ch * 400)
        n = highpass(n, 160)
        pre = seconds(0.021 + ch * 0.004)
        ir[pre:, ch] = n[: length - pre]
    ir /= np.max(np.abs(ir)) + 1e-9
    return ir


def convolve(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    size = 1
    while size < len(x) + len(ir):
        size *= 2
    out = np.zeros_like(x)
    for ch in range(2):
        y = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir[:, ch], size), size)
        out[:, ch] = y[: len(x)]
    return out


# ------------------------------------------------------------------ master

def compress(x: np.ndarray, thresh: float = 0.32, ratio: float = 3.0,
             attack: float = 0.010, release: float = 0.22) -> np.ndarray:
    """Gentle glue: one envelope follower across the stereo bus."""
    det = np.max(np.abs(x), axis=1)
    a = np.exp(-1.0 / (SR * attack))
    r = np.exp(-1.0 / (SR * release))
    env = np.empty_like(det)
    acc = 0.0
    for i, v in enumerate(det):
        coef = a if v > acc else r
        acc = coef * acc + (1 - coef) * v
        env[i] = acc
    gain = np.ones_like(env)
    over = env > thresh
    gain[over] = (thresh + (env[over] - thresh) / ratio) / env[over]
    return x * gain[:, None]


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    dry = np.zeros((N, 2))
    dry += sea_bed() * 0.22
    dry += pad() * 0.34
    dry += fire() * 0.26
    dry += steam() * 0.55
    dry += splash() * 0.85
    dry += hits() * 0.95
    dry += whooshes() * 0.75
    dry += pulse() * 0.85
    dry += riser() * 0.70
    dry += bell() * 0.95

    # send the tuned material to the hall, keep the surf and the subs dry
    send = np.zeros((N, 2))
    send += pad() * 0.34
    send += steam() * 0.55
    send += splash() * 0.5
    send += whooshes() * 0.4
    send += bell() * 0.95
    wet = convolve(send, reverb_ir())
    wet /= np.max(np.abs(wet)) + 1e-9

    mix = dry + wet * 0.26

    # a touch of air, then glue and a soft ceiling
    mix = mix + highpass(mix[:, 0], 8000)[:, None] * np.array([0.06, 0.06]) * 0.5
    mix = compress(mix)
    # push into the soft clipper so the bed sits near the ~-16 LUFS the
    # platforms normalise to, rather than arriving thin next to other ads
    mix = np.tanh(mix * 2.1) / 1.35

    # top and tail
    fi, fo = seconds(0.25), seconds(1.1)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None] ** 1.5
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.7

    peak = np.max(np.abs(mix))
    mix *= (10 ** (-1.0 / 20)) / peak
    rms = np.sqrt(np.mean(mix ** 2))
    print(f"peak {20 * np.log10(peak):.1f} dBFS pre-norm, rms {20 * np.log10(rms):.1f} dBFS")

    data = (np.clip(mix, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
    raw = np.zeros((N, 2, 4), dtype=np.uint8)
    for ch in range(2):
        raw[:, ch, 0] = (data[:, ch] >> 0) & 0xFF
        raw[:, ch, 1] = (data[:, ch] >> 8) & 0xFF
        raw[:, ch, 2] = (data[:, ch] >> 16) & 0xFF
    body = raw[:, :, :3].tobytes()

    path = os.path.join(OUT, "audio.wav")
    with open(path, "wb") as f:
        block = 2 * 3
        f.write(b"RIFF" + (36 + len(body)).to_bytes(4, "little") + b"WAVE")
        f.write(b"fmt " + (16).to_bytes(4, "little"))
        f.write((1).to_bytes(2, "little") + (2).to_bytes(2, "little"))
        f.write(SR.to_bytes(4, "little") + (SR * block).to_bytes(4, "little"))
        f.write(block.to_bytes(2, "little") + (24).to_bytes(2, "little"))
        f.write(b"data" + len(body).to_bytes(4, "little") + body)
    print("wrote", path, f"{len(body) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
