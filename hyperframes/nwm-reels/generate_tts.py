"""
NWM Reels - TTS Audio Generator
Uses kokoro-onnx (Python 3.11) to generate voiceover WAV files.
Run with: "C:\Program Files\Python311\python" generate_tts.py
"""
import os
import sys
import urllib.request
import pathlib

SCRIPT_DIR = pathlib.Path(__file__).parent
TTS_DIR = SCRIPT_DIR / "assets" / "tts"
MODELS_DIR = pathlib.Path.home() / ".cache" / "hyperframes" / "tts" / "models"
VOICES_DIR = pathlib.Path.home() / ".cache" / "hyperframes" / "tts" / "voices"

MODEL_PATH = MODELS_DIR / "kokoro-v1.0.onnx"
VOICES_PATH = VOICES_DIR / "voices-v1.0.bin"

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

VOICE = "am_adam"
SPEED = 1.05

REELS = [
    "reel-01-ai-sdr",
    "reel-02-seo-dead",
    "reel-03-80-hours",
    "reel-04-roas-playbook",
    "reel-05-2m-teardown",
    "reel-06-aeo-audit",
    "reel-07-agency-freelancer",
    "reel-08-340k-pipeline",
    "reel-09-cac-62",
    "reel-10-apollo-teardown",
]

def download_with_progress(url, dest):
    dest = pathlib.Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  Downloading {dest.name} ...", end="", flush=True)
    tmp = dest.with_suffix(".tmp")

    def reporthook(count, block_size, total_size):
        if total_size > 0:
            pct = count * block_size * 100 // total_size
            print(f"\r  Downloading {dest.name} ... {pct}%", end="", flush=True)

    urllib.request.urlretrieve(url, tmp, reporthook=reporthook)
    tmp.rename(dest)
    print(f"\r  Downloaded  {dest.name} ({dest.stat().st_size // 1024 // 1024} MB)")

def ensure_models():
    if not MODEL_PATH.exists():
        print(f"Model file not found. Downloading (~310 MB)...")
        download_with_progress(MODEL_URL, MODEL_PATH)
    else:
        print(f"  Model: {MODEL_PATH} ({MODEL_PATH.stat().st_size // 1024 // 1024} MB)")

    if not VOICES_PATH.exists():
        print(f"Voices file not found. Downloading (~68 MB)...")
        download_with_progress(VOICES_URL, VOICES_PATH)
    else:
        print(f"  Voices: {VOICES_PATH} ({VOICES_PATH.stat().st_size // 1024 // 1024} MB)")

def generate_audio(kokoro, reel_id):
    txt_path = TTS_DIR / f"{reel_id}.txt"
    wav_path = TTS_DIR / f"{reel_id}.wav"

    if wav_path.exists():
        print(f"  SKIP  {reel_id}.wav (already exists)")
        return True

    if not txt_path.exists():
        print(f"  ERROR {reel_id}.txt not found")
        return False

    text = txt_path.read_text(encoding="utf-8").strip()
    print(f"  GEN   {reel_id}.wav ({len(text)} chars) ...", end="", flush=True)

    try:
        import soundfile as sf
        samples, sample_rate = kokoro.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        sf.write(str(wav_path), samples, sample_rate)
        size_kb = wav_path.stat().st_size // 1024
        print(f" {size_kb} KB  ✓")
        return True
    except Exception as e:
        print(f" ERROR: {e}")
        return False

def main():
    print("=== NWM Reels TTS Generator ===")
    print(f"Python: {sys.version}")
    print(f"Models dir: {MODELS_DIR}")
    print()

    # Ensure model files exist
    print("Checking model files...")
    ensure_models()
    print()

    # Load kokoro
    print("Loading Kokoro model...")
    try:
        import kokoro_onnx
        kokoro = kokoro_onnx.Kokoro(str(MODEL_PATH), str(VOICES_PATH))
        print(f"  Loaded kokoro-onnx {kokoro_onnx.__version__ if hasattr(kokoro_onnx, '__version__') else '(version unknown)'}")
    except Exception as e:
        print(f"  ERROR loading Kokoro: {e}")
        sys.exit(1)
    print()

    # Generate audio for each reel
    print("Generating audio files...")
    ok = 0
    fail = 0
    for reel_id in REELS:
        if generate_audio(kokoro, reel_id):
            ok += 1
        else:
            fail += 1

    print()
    print(f"Done: {ok} generated, {fail} failed")
    if fail:
        sys.exit(1)

if __name__ == "__main__":
    main()
