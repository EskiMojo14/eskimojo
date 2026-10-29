# Tooltips

`Button` and `IconButton` accept `tooltip?: string | RichTooltipProps`,
`tooltipOpts?: { placement?: "top" | "bottom" | "left" | "right"; delay?: number }`, and an optional
`popoverRef`. No extra trigger wrapper is rendered.

```tsx
<IconButton
  aria-label="Favorite"
  icon={<MdSymbol>favorite</MdSymbol>}
  tooltip="Add to your favorites"
/>;

<Button
  tooltip={{
    subhead: "Local storage",
    supporting: "Preferences are remembered only in this browser.",
    actions: <Button variant="text">Learn more</Button>,
  }}
>
  Storage
</Button>;
```

Use `withTooltip(Component, defaults?)` for other button or link components.
They must forward their ref and HTML attributes to the interactive element.
Tooltips are supplemental by default and preserve the trigger's accessible name.
Opt into `tooltipAsLabel` when a non-empty plain tooltip should supply that name
through `aria-labelledby`, as with the sidebar palette toggle. This takes
precedence over other naming attributes, so use text that accurately labels
the action (and includes any visible trigger text). Rich, empty, and absent
tooltips do not change the trigger's name; provide a separate label for them.
The props union rejects `tooltipAsLabel: true` with a rich tooltip.
Disabled native buttons cannot invoke tooltips.

The approach follows [Schema Benchmarks' tooltip wrapper](https://github.com/open-circle/schema-benchmarks/blob/main/website/src/shared/components/tooltip/index.tsx).
Plain hints use MD3 inverse-surface colors, body-small typography, 4px rounded
corners, and 4px/8px padding. Rich hints use surface-container colors, body-medium
text, a title-small subhead, 12px rounded corners, 12px/16px padding, and elevation.
Both inherit the site's Paper Mono font and theme/contrast tokens. Corners
intentionally override the site's bevel shape to match MD3 tooltips.

Native `interestfor` handles hover, keyboard focus, pointer travel into the hint,
long-press on buttons, and accessibility associations. Hover defaults to 500ms;
keyboard focus is immediate. Escape and outside clicks dismiss the hint.
Rich hints use a non-modal dialog role so their actions can be reached with Tab.
Do not put essential instructions or actions exclusively inside a tooltip.

Unlike the reference's custom event timers, native interest invokers manage the
interaction lifecycle. Only browsers missing interest invokers conditionally
load the `interestfor` polyfill: modern Firefox and Safari still need this
interaction fallback. Chrome/Edge with native interest invokers do not load it.
The Popover API is required natively; there is no legacy Popover polyfill.
Positioning uses native CSS anchors,
unique explicit anchor names, and viewport-aware flip fallbacks. This targets
current evergreen browsers (Chrome/Edge 129+, Firefox 147+, Safari 26+);
there is intentionally no anchor-positioning polyfill or Floating UI dependency.
Entry combines a subtle 0.95-to-1 fast spatial-spring scale with a fast
effects-spring fade. Exit only fades, without shrinking. Reduced motion disables
both animations. Discrete display/overlay transitions cover the longer spring
on entry and the effects spring on exit, keeping the hint in the top layer
until its visible animation finishes. There is no typing effect.

Styles load through the application's head-linked global stylesheet and are
also available in Storybook and browser tests.
