# Blog covers

Every cover shares one frame (`../templates/cover.html`): black starfield, brand pill, mono
eyebrow, the title on the left with rainbow-tinted key words, the URL. That's what makes them a
family. **The right half must be different every time.** By 2026-11 six of seven covers had
turned into the same tilted glass card holding a list of rows with tag pills, a copy of the old
template's example. They didn't say anything about their posts, and the blog index looked like
one image repeated. This folder exists so that doesn't happen again.

## Making a cover

1. Read the registry below, and look at the last 3 covers in `docs/public/blog/*/cover.webp`.
2. Find the post's **one idea**: the picture a reader would draw on a napkin to explain it. Not
   a summary of the post's sections.
3. Pick an archetype that fits that idea and isn't used by either of the 2 most recent covers.
   Pick a hue at least ~40 degrees from the previous cover's hue.
4. Write `covers/{slug}.html` (format below), starting from scratch or from the fragment of the
   closest earlier cover with that archetype. Never from a different archetype's fragment.
5. Build and look at it:
   `"$PY" -I ../scripts/build_cover.py {slug} --png <scratchpad>/cover.png --webp ../../../../docs/public/blog/{slug}/cover.webp`
   Check it at full size and imagine it at thumbnail size: headline readable, nothing clipped,
   the visual not crowding the title, readable at a glance.
6. Tile it next to the other covers (ffmpeg `xstack`) and check it doesn't read as a sibling of
   any of them. Then add its row to the registry, and set the post's `imageAlt` to describe the
   visual.

## Fragment format

```html
<!-- Idea: one sentence - what the visual says about the post. -->
<cover category="Explainers" hue="185" tilt="false" archetype="dial">
  <title>How Steam <span class="hl">tracks playtime</span></title>
  <style> /* this cover's CSS only */ </style>
  <visual> <!-- markup placed inside .visual__inner (about 440x560 px) --> </visual>
</cover>
```

- `category`: the post's frontmatter category. `title`: 3-8 words, 1-3 key words in
  `<span class="hl">`. The frame sizes and wraps it.
- `hue`: 0-360. Drives the background tint, the glow behind the visual, and the CSS variables
  `--accent`, `--accent-soft`, `--accent-deep` for the visual to use. Muted tokens from the frame
  (`--muted`, `--border`, `--blue`, `--purple`, `--green`, `--amber`, `.glass`, `.tag`, `.orb`)
  are available too.
- `tilt`: `true` tilts the visual toward the title, `false` keeps it flat. Mix them.

## Archetypes

Each is a different *shape* on the page. Combine or invent new ones (add them here), but never
fall back to "a card with a list of rows".

| Archetype | Shape | Good for |
|---|---|---|
| `dial` | One big circular gauge, clock or meter, with a short label set under it | Time, progress, counters |
| `orbit` | A central object with satellites around it | One thing fed by several sources |
| `sequence` | 2-4 big objects in a row with connectors, staggered | Before/after, states, steps |
| `chart` | A real-looking chart (bars, line, distribution) with one callout | Numbers, distributions, rankings |
| `mosaic` | Clusters of tiles grouped by meaning | Collections split into parts |
| `ticket` | A physical object: ticket, tag, receipt, stamp | Prices, ownership, offers |
| `fan` | A fanned stack of objects with one accent | Collectibles (cards, badges) |
| `hero` | One large illustrated object, nothing else | A single striking concept |
| `split` | Two contrasting halves with a divider | X vs Y comparisons |
| `timeline` | A horizontal track with marked events | Dates, events, histories |

## Rules

- **One idea per cover.** The visual should make sense without reading the post. If it needs
  more than ~6 words of in-visual text, it's a list, not a picture.
- **No list cards.** A glass card with rows and tag pills is banned as the main visual. A
  `.glass` surface is fine as a background for something else.
- **No repeats:** don't use the same archetype as either of the 2 most recent covers, and don't
  reuse the previous cover's hue.
- Never real game art, never a fake screenshot of Steam or SGI UI, never Steam/Valve logos.
  Numbers in a visual are illustrative, but keep them plausible and consistent with the post.
- US English in any visual text.
- The glow behind the visual stays subtle (the frame sets it to 10% opacity, user call
  2026-11-06). Don't add extra glows or bright color washes to compensate; let the visual itself
  carry the color.

## Registry (newest first)

| Post | Archetype | Hue | Tilt | Idea |
|---|---|---|---|---|
| steam-free-to-keep | ticket | 145 | yes | A $0.00 ticket you keep, stamped "no card drops", over a Free Weekend ticket |
| steam-achievement-percentages | chart | 280 | no | Unlock rates falling to a rare 2.4% tail |
| how-steam-tracks-playtime | dial | 185 | no | A stopwatch that keeps running through AFK, Minimized, Invisible |
| remove-steam-achievements | sequence | 350 | yes | One achievement: unlocked, reset, hidden |
| how-to-level-up-on-steam | orbit | 40 | no | Level ring orbited by XP badges |
| how-steam-trading-cards-work | fan | 320 | yes | Fanned cards and a badge's +100 XP (rebuilt as a fragment 2026-11-06) |
| steam-achievement-sets | mosaic | 215 | yes | Base game, DLC and archived sets as tile clusters |
