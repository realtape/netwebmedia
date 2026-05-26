# MVP Expansion v2 — Music Brief

Three music beds, one per package. Each track plays under all 3 reels in that
package so the 9-reel set reads as a series, not nine random posts.

**Storage policy** (CLAUDE.md → "Media storage policy"): music files live at
`D:\hyperframes\netwebmedia\social-reels-mvp-v2\music\` on Carlos's Windows
workstation. `video-factory/public/music/` is a Windows junction (`mklink /J`)
pointing there. Tracks are loaded by `video-factory/src/compositions/MvpReel.tsx`
via `theme.music` and resolved through Remotion's `staticFile()`. **Do NOT
upload music files to Google Drive** — licensed beds belong on the local drive
under the Artlist license file naming.

| Package | Track filename | Brief |
|---|---|---|
| AEO Starter (Reels 1–3) | `aeo-tense-resolve.mp3` | "Tense → resolve." Lo-fi tech / synth beat, ~85 BPM. Minor-key opening (skeptic energy), resolves to major chord on the proof beat. 14–16s loopable. Reference vibes: *Tycho — Awake* intro, *Bonobo — Cirrus* but tighter. No vocals. |
| CMO Growth (Reels 4–6) | `growth-operator.mp3` | "Energetic operator." Upbeat synth-pop / corporate-future, ~110 BPM. Bright but not cheesy — confident, propulsive, mid-day-work energy. Reference vibes: *ODESZA — A Moment Apart* instrumental cut, *RAC — Beautiful Game* but cleaner. No vocals. |
| CMO Scale (Reels 7–9) | `scale-cinematic.mp3` | "Cinematic premium." Orchestral-hybrid, slow build, ~70 BPM. Strings + subtle pad + low piano. Executive-presence energy — "we've already won." Reference vibes: *Hans Zimmer — Time*, *Ramin Djawadi — Light of the Seven* but lower-key. No vocals. |

## License source — pick one

Brand-safe royalty-free options for commercial IG/FB/TT use:

1. **Artlist.io** (recommended) — $9.99/mo unlimited downloads, full commercial license incl. ads + social. Single annual sub covers all 3 tracks indefinitely. Search filters by BPM + mood + genre. License clears for paid promotion (boosted IG/FB posts).
2. **Epidemic Sound** — $15/mo personal, $29/mo commercial. Larger catalog, but the commercial tier is required for NWM use (we're a business, not a creator).
3. **Uppbeat** — free tier exists but requires credit in caption; paid tier $6.99/mo for credit-free. Smaller catalog.
4. **Suno / AI generation** — $10/mo Pro tier covers commercial use of generated tracks. Higher creative control (write a prompt matching the brief above and iterate). Risk: AI-music licensing on Meta/TikTok platforms is still evolving — verify Suno's commercial-use clause is current before publishing.

**Decision:** Artlist is the safe default. Two-search filters that match the briefs above:

- AEO Starter: *Genre: Electronic > Lo-fi · Mood: Contemplative · BPM: 80–95 · Vocals: Instrumental*
- CMO Growth: *Genre: Pop > Indie Pop · Mood: Confident · BPM: 100–120 · Vocals: Instrumental*
- CMO Scale: *Genre: Cinematic > Hybrid Orchestral · Mood: Inspiring · BPM: 60–80 · Vocals: Instrumental*

## Track-prep checklist

For each downloaded source file (run on the Windows workstation, output
directly to the hyperframes drive):

```cmd
:: 1. Trim to reel length + 1s tail (longest reel is 16s, so 17s).
ffmpeg -i source.wav -t 17 -ac 2 -ar 44100 trimmed.wav

:: 2. Normalize loudness to -16 LUFS (IG / TT target). Use loudnorm filter.
ffmpeg -i trimmed.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 normalized.wav

:: 3. Encode to mp3 (Remotion's Audio component handles wav too, but mp3 is
::    smaller and Remotion ships the asset into the rendered mp4).
ffmpeg -i normalized.wav -codec:a libmp3lame -b:a 192k aeo-tense-resolve.mp3

:: 4. Drop straight into the hyperframes music folder.
move aeo-tense-resolve.mp3 D:\hyperframes\netwebmedia\social-reels-mvp-v2\music\
```

Repeat for `growth-operator.mp3` and `scale-cinematic.mp3`. Total: 3 mp3 files,
each ~17s, ~400 KB each.

## Mix levels in MvpReel.tsx

The composition sets:

- Source clip ambient audio: `volume={0.6}`
- Music bed: `volume={0.45}`

That gives the music presence without burying the character's diegetic audio
(phone clicks, marker squeaks, page flips). If a particular reel needs the
music louder (e.g. proof beat where there's no character VO), bump the volume
per-reel by extending `ReelTheme` with `music_volume?: number`.

## Voice-over (separate decision)

The 9 reels currently have no voice-over. Three paths:

1. **Caption-only** (default — what the pipeline ships now): visual captions
   carry the script. Works for muted-play (85% of IG plays). Music + captions
   only on the audio track.
2. **Carlos records VO** (best for trust): 9 EN scripts, 30–45 min total
   recording time, ES dubs after EN locked.
3. **AI VO via ElevenLabs**: ~$5 for all 9 EN + 9 ES at the Starter tier.
   Risk: deepfake-disclosure norms still tightening on Meta. Disclose if used.

Recommend (2) — Carlos's voice is the brand differentiator vs the larger
agencies the reels position against. The CMO Growth + Scale packages
specifically sell "direct line to the founder," so hearing his voice on the
reels reinforces the positioning.

If (1) ships first, the Remotion pipeline already places source-clip ambient
audio under the captions — viewers with sound on still get the music + ambient
character audio. VO can be added later by dropping an `Audio` track per beat.
