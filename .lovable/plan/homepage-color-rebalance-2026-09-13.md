# Homepage color rebalance

## Goal
Replace the competing gold-on-brown accents with a calmer forest palette while preserving the existing brown pixel panels.

## Changes
- Use pale leaf green for headings, progress, selected navigation, dividers, and playable stage buttons.
- Reserve warm gold only for actual currency, so it remains meaningful and does not dominate the interface.
- Shift general text toward soft ivory and muted sage for stronger contrast and clearer hierarchy.
- Keep the deep forest background and brown framed panels unchanged in structure.
- Check the homepage at desktop and mobile sizes for contrast, balance, and readability.

## Technical details
- Add semantic shell accent and text tokens in the global theme.
- Update homepage and bottom navigation classes to use those tokens.
- Preserve existing game behavior and the in-game experience bar.
