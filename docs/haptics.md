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
activation, checkbox and switch changes, changed button-tab selections, and committed select-menu changes.
Checkbox and switch callers should not add duplicate feedback; use `hapticFeedback={false}`
only when the caller must own the feedback.
`InternalLinkChip` and `TabLink` also provide selection feedback when activated
to change the current URL, including query-string filters. They compare the
destination with the router's current URL rather than relying on active styling,
which may match only part of the destination. Clicking an unchanged destination,
canceling the click, downloading, or opening another browsing context produces
no feedback. Keyboard activation works like an ordinary primary click.
`ExternalLinkChip` and ordinary navigation links remain quiet.

## Using the shared hook

Call `useHapticFeedback` from
[haptics.ts](../src/shared/lib/haptics.ts) inside components or hooks. Its
`triggerHapticFeedback` callback defaults to `selection`; pass a pattern
explicitly when that makes the interaction's intent clearer.

```tsx
import { useHapticFeedback } from "#/shared/lib/haptics";

const { triggerHapticFeedback } = useHapticFeedback();

function selectTheme(nextTheme: Theme) {
  if (nextTheme === theme) return;
  setTheme(nextTheme);
  triggerHapticFeedback("selection");
}
```

This example belongs in the component that owns `theme` and `setTheme`, with
`Theme` matching that component's preference type.

The hook uses `useWebHaptics` from `web-haptics/react`, which creates and
destroys its instance with the component lifecycle. It only triggers when
the saved preference is on and the Vibration API is supported. Server renders
and unsupported browsers do not produce feedback; the support check also
deliberately bypasses the library's hidden-switch fallback.

Existing callers of the exported `triggerHapticFeedback` function should
obtain the callback from `useHapticFeedback()` instead. Selection-link
components use `useSelectionLinkHaptic()` to retain their activation guards.

The **Haptic feedback** switch in Preferences defaults to on, preserving
existing behavior. It appears after hydration on browsers with Vibration
API support. Like the appearance preferences, changes are optimistic and
saved in a cookie (`eskimojo::haptics`, `on` or `off`); failed saves roll back
and show a snackbar. Disabling feedback is silent; enabling it gives one
selection confirmation. This switch opts out of automatic feedback and uses
`useWebHaptics` directly with the new value and support check, rather than the
previous saved value still in context during its change handler.
The preference applies to all feedback consumers
without changing their interactions.

API availability does not guarantee a vibration motor or successful playback.
Browser policies and device settings can suppress vibration. The hook does
not read Android's touch-feedback setting; the site preference is independent,
so do not claim native preference integration. Keep the entire
interaction usable when no vibration occurs.

## Verification

Exercise the actual control in a browser test and check both its visible state
and the feedback request. Spy on the library prototype rather than replacing
internal hooks or modules, so component-owned instances are covered:

```ts
import { expect, vi } from "vite-plus/test";
import { WebHaptics } from "web-haptics";

using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();

await control.click();

expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection", undefined);
```

Use this inside an async browser test with its rendered `control`. The library's
React hook forwards the optional trigger options as `undefined`. Disposable
spies restore themselves when the test scope exits. Include meaningful negative
cases such as an unchanged choice, canceled menu, disabled action, or saved
`haptics: "off"` preference, and verify
keyboard activation where applicable.

Automated tests verify requests, not the physical sensation. Check the changed
flow on a supported physical device for timing, strength, and repetition, and
in a browser without vibration support to confirm that behavior remains intact.
