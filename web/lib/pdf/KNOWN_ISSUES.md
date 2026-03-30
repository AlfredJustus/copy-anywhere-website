# PDF Generation — Known Issues

## Emoji not rendering in output PDF

**Status:** Unresolved
**Attempts made:**
1. Added `\newfontface{\EmojiFont}{TwemojiMozilla}[Renderer=HarfBuzz]` to XeLaTeX preamble + wrapped emoji in `escapeLatex` via `{\EmojiFont <emoji>}` — failed because `Renderer=HarfBuzz` is LuaLaTeX-only; fontspec errors out in XeLaTeX, leaving `\EmojiFont` undefined.
2. Removed `[Renderer=HarfBuzz]`, kept bare `\newfontface{\EmojiFont}{TwemojiMozilla}` — still does not render emoji.

**Suspected remaining causes:**
- `TwemojiMozilla` font may not be discoverable by fontspec on texlive.net's installation (wrong font name, missing from kpsewhich, or not in a path fontspec searches).
- COLR/color emoji rendering may require additional XeLaTeX configuration not yet tried.

**Next steps to investigate:**
- Verify whether `TwemojiMozilla` is found: add a deliberate compile test with just `\newfontface{\EmojiFont}{TwemojiMozilla}` and a single emoji, check the raw TeX log for font-not-found errors.
- Try alternate font names: `Twemoji Mozilla`, or specify the full `.ttf` path via `kpsewhich TwemojiMozilla.ttf`.
- Consider falling back to the `emoji` LaTeX package (named emoji only) or stripping emoji gracefully with a user-visible note rather than silently dropping them.
- If texlive.net doesn't have the font, self-hosting the compilation service (Azure Container Apps) would give full control over installed fonts.
