// WAI-ARIA 1.3 shim; remove once TypeScript's DOM declarations include ariaNotify.
type AriaNotifyPriority = "normal" | "high";

interface AriaNotificationOptions {
  priority?: AriaNotifyPriority;
}

interface ARIANotifyMixin {
  ariaNotify?(announcement: string, options?: AriaNotificationOptions): void;
}

interface Document extends ARIANotifyMixin {}

interface Element extends ARIANotifyMixin {}
