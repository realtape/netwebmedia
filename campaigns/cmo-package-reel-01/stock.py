"""Download free CC0 stock footage (talking head + b-roll) to assets/stock/."""
from pathlib import Path
import requests

ROOT = Path(__file__).parent
STOCK = ROOT / "assets" / "stock"
STOCK.mkdir(parents=True, exist_ok=True)

# Curated free-use stock footage. Mix of Pexels + Pixabay CDN URLs.
CLIPS = {
    # Talking head — confident man direct-to-camera
    "talking_head.mp4":
        "https://cdn.pixabay.com/video/2024/03/15/204332-923909579_large.mp4",
    # B-roll — cluttered desk w/ multiple monitors (problem)
    "problem_desk.mp4":
        "https://cdn.pixabay.com/video/2024/01/11/195834-903040559_large.mp4",
    # B-roll — modern office with skyline (proof)
    "office_skyline.mp4":
        "https://videos.pexels.com/video-files/3209828/3209828-uhd_3840_2160_25fps.mp4",
}

# Fallbacks per clip — tried in order if primary fails
FALLBACKS = {
    "talking_head.mp4": [
        # Pixabay businessman talking
        "https://cdn.pixabay.com/video/2023/10/03/183405-869610874_large.mp4",
        "https://cdn.pixabay.com/video/2022/03/03/109220-685492415_large.mp4",
        "https://cdn.pixabay.com/video/2020/04/03/34610-405226030_large.mp4",
        # Pexels
        "https://videos.pexels.com/video-files/6953870/6953870-hd_1920_1080_25fps.mp4",
        "https://videos.pexels.com/video-files/4065900/4065900-uhd_2560_1440_25fps.mp4",
    ],
    "problem_desk.mp4": [
        "https://cdn.pixabay.com/video/2023/11/13/188847-884049884_large.mp4",
        "https://cdn.pixabay.com/video/2022/08/05/127748-738583655_large.mp4",
        "https://cdn.pixabay.com/video/2019/03/20/22205-324762055_large.mp4",
        "https://videos.pexels.com/video-files/7989744/7989744-uhd_2732_1440_25fps.mp4",
        "https://videos.pexels.com/video-files/5495875/5495875-hd_1366_720_30fps.mp4",
    ],
    "office_skyline.mp4": [
        "https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_25fps.mp4",
        "https://cdn.pixabay.com/video/2019/05/12/23673-337005235_large.mp4",
    ],
}


def download(url: str, dest: Path) -> bool:
    try:
        print(f"  GET {url[:90]}...")
        r = requests.get(url, stream=True, timeout=30, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        if r.status_code != 200:
            print(f"    HTTP {r.status_code}")
            return False
        total = 0
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 16):
                if chunk:
                    f.write(chunk)
                    total += len(chunk)
        print(f"    OK {total / 1024 / 1024:.1f} MB -> {dest.name}")
        return total > 50_000  # sanity: at least 50KB
    except Exception as e:
        print(f"    ERR {e}")
        return False


def fetch_clip(name: str, primary: str, fallbacks: list[str]) -> Path | None:
    dest = STOCK / name
    if dest.exists() and dest.stat().st_size > 200_000:
        print(f"[cache] {name} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
        return dest
    urls = [primary] + fallbacks
    for url in urls:
        if download(url, dest):
            return dest
    return None


def main():
    print("== stock footage download ==")
    results = {}
    for name, primary in CLIPS.items():
        print(f"\n[{name}]")
        path = fetch_clip(name, primary, FALLBACKS.get(name, []))
        results[name] = path
    print("\n== results ==")
    for name, path in results.items():
        print(f"  {name}: {'OK' if path else 'FAIL'}")
    return results


if __name__ == "__main__":
    main()
