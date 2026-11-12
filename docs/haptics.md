# Haptic feedback

Haptics are optional confirmation of an intentional interaction, not a response
to every tap. Use Material Design 3 as the site's design foundation and
[Android's haptics design principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles)
for haptic decisions: "less is more," keep similar interactions consistent,
and match feedback strength to the event's importance and frequency.

## Choosing interactions and patterns

| Pattern     | Use                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `selection` | Subtle feedback for a selection or toggle, such as a preference change or pausing/resuming the role animation. |
| `light`     | A slightly stronger tap for an intentional discrete action, such as advancing to the next role.                |

Prefer the existing short presets over custom vibration sequences. These are
web-library presets, not Android's native `HapticFeedbackConstants`, and their
physical feel varies with the device.

- Attach feedback to the interaction that owns the change. The generic
  `Button` and `IconButton` components intentionally do not add haptics.
- Confirm committed menu choices, not opening the menu, exploring options, or
  canceling it. Skip feedback when the selected value has not changed.
- Keep ordinary links, dialog opening/closing, notification dismissal, hover,
  focus, page loading, and automatic animation changes quiet.
- Use one feedback event per interaction. A shared selection component may
  already provide it; inspect that component before adding feedback in its
  caller.
- Trigger feedback from pointer or keyboard activation, alongside the visible
  response. Keep effects out of reducers and render functions. For operations
  that can fail, distinguish acknowledging input from confirming completion;
  a tap is not a success signal.
- Preserve visual state, accessible names, and keyboard behavior. Haptics must
  never be the only way to understand a change or an error.

The current shared selection components provide feedback for filter-chip
activation, changed button-tab selections, and committed select-menu changes.
`InternalLinkChip` and `TabLink` also provide selection feedback when activated
to change the current URL, including query-string filters. They compare the
destination with the router's current URL rather than relying on active styling,
which may match only part of the destination. Clicking an unchanged destination,
canceling the click, downloading, or opening another browsing context produces
no feedback. Keyboard activation works like an ordinary primary click.
`ExternalLinkChip` and ordinary navigation links remain quiet.

## Using the shared helper

Import `triggerHapticFeedback` from
[haptics.ts](../src/shared/lib/haptics.ts). Its default pattern is `selection`;
pass a pattern explicitly when that makes the interaction's intent clearer.

```tsx
import { triggerHapticFeedback } from "#/shared/lib/haptics";

function selectTheme(nextTheme: Theme) {
  if (nextTheme === theme) return;
  setTheme(nextTheme);
  triggerHapticFeedback("selection");
}
```

This example belongs in the component that owns `theme` and `setTheme`, with
`Theme` matching that component's preference type.

The helper uses a client-only `WebHaptics` instance and checks
`WebHaptics.isSupported` before triggering it. Server calls and browsers
without the Vibration API do not produce feedback. The support check also
deliberately bypasses the library's hidden-switch fallback on browsers without
that API.

API availability does not guarantee a vibration motor or successful playback.
Browser policies and device settings can suppress vibration. The helper does
not read Android's touch-feedback setting or provide a site-level haptics
preference, so do not claim native preference integration. Keep the entire
interaction usable when no vibration occurs.

## Verification

Exercise the actual control in a browser test and check both its visible state
and the feedback request. Spy on the existing instance rather than replacing
the module, which may already be imported by browser-test setup:

```ts
import { expect, vi } from "vite-plus/test";

import { haptics } from "#/shared/lib/haptics";

if (!haptics) throw new Error("Haptics should be initialized in a browser test.");
using triggerHaptic = vi.spyOn(haptics, "trigger").mockResolvedValue();

await control.click();

expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection");
```

Use this inside an async browser test with its rendered `control`. Disposable
spies restore themselves when the test scope exits. Include meaningful negative
cases such as an unchanged choice, canceled menu, or disabled action, and verify
keyboard activation where applicable.

Automated tests verify requests, not the physical sensation. Check the changed
flow on a supported physical device for timing, strength, and repetition, and
in a browser without vibration support to confirm that behavior remains intact.
