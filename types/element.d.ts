// WAI-ARIA 1.3 shim; remove once TypeScript's DOM declarations include ariaNotify.
type AriaNotifyPriority = "normal" | "high";

interface AriaNotificationOptions {
  priority?: AriaNotifyPriority;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Document/ariaNotify
// https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaNotify
interface ARIANotifyMixin {
  ariaNotify?(announcement: string, options?: AriaNotificationOptions): void;
}

interface Document extends ARIANotifyMixin {}

// https://developer.mozilla.org/en-US/docs/Web/API/Element/startViewTransition

interface ElementViewTransitionMixin {
  startViewTransition?: Document["startViewTransition"];
}

interface Element extends ARIANotifyMixin, ElementViewTransitionMixin {}
