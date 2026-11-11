"""Extrai cada plano do 4K HDR (HLG) -> SDR bt709, recortado, 1188x2112 @60fps."""
import subprocess, sys, os
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from timeline import SHOTS, MW, MH

DRIVE = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
TM = ("zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0,"
      "zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
PAD = 0.45  # margem antes/depois p/ transições


def job(s):
    if "foto" in s:
        return
    x, y, l = s["crop"]
    cw, ch = int(2160 * l) // 2 * 2, int(3840 * l) // 2 * 2
    cx, cy = int(2160 * x), int(3840 * y)
    need = s["dur"] * s["spd"] + 2 * PAD
    t0 = max(0, s["t"] - PAD)
    vf = f"crop={cw}:{ch}:{cx}:{cy},scale={MW}:{MH}:flags=lanczos,{TM}"
    out = os.path.join(OUT, s["id"] + ".mp4")
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-t", f"{need:.3f}", "-i",
           os.path.join(DRIVE, s["src"] + ".MOV"), "-an", "-vf", vf, "-r", "60",
           "-c:v", "libx264", "-preset", "fast", "-crf", "11", "-pix_fmt", "yuv420p", out]
    subprocess.run(cmd, check=True)
    print("ok", s["id"], f"pre={s['t'] - t0:.3f}", flush=True)


with ThreadPoolExecutor(4) as ex:
    list(ex.map(job, SHOTS))
