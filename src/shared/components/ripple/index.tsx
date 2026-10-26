import { useCallback, useEffect, useRef, type DOMAttributes } from "react";

type RippleHandlers<T extends HTMLElement> = Pick<
  DOMAttributes<T>,
  "onPointerDown" | "onPointerLeave" | "onKeyDown" | "onKeyUp" | "onBlur"
> & {
  disabled?: boolean;
  "aria-disabled"?: boolean | "true" | "false";
};

interface ActiveRipple {
  wave: HTMLSpanElement;
  animations: Array<Animation>;
  listeners: AbortController;
  started: number;
  released: boolean;
  reducedMotion: boolean;
  pointerId?: number;
  key?: string;
}

export function useRipple<T extends HTMLElement>(props: RippleHandlers<T>, unbounded = false) {
  const layerRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef<ActiveRipple | null>(null);

  const clear = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    active.listeners.abort();
    for (const animation of active.animations) animation.cancel();
    active.wave.remove();
    layerRef.current?.removeAttribute("data-active");
    activeRef.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  const disabled =
    props.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";
  useEffect(() => {
    if (disabled) clear();
  }, [disabled, clear]);

  function release() {
    const active = activeRef.current;
    const layer = layerRef.current;
    if (!active || !layer || active.released) return;
    active.released = true;
    active.listeners.abort();
    if (active.reducedMotion) {
      clear();
      return;
    }
    const style = getComputedStyle(layer);
    const duration = Number.parseFloat(style.getPropertyValue("--md-comp-ripple-fade-duration"));
    const fade = active.wave.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration,
      delay: Math.max(
        0,
        Number.parseFloat(style.getPropertyValue("--md-comp-ripple-minimum-press-duration")) -
          (performance.now() - active.started),
      ),
      easing: style.getPropertyValue("--md-sys-motion-easing-linear").trim(),
      fill: "forwards",
    });
    active.animations.push(fade);
    fade.onfinish = () => {
      if (activeRef.current === active) clear();
    };
  }

  function start(host: T, point?: { x: number; y: number }, pointerId?: number, key?: string) {
    const layer = layerRef.current;
    if (!layer || host.matches(":disabled, [aria-disabled='true']")) return;
    clear();
    const rect = layer.getBoundingClientRect();
    const x = unbounded || !point ? rect.width / 2 : point.x - rect.left;
    const y = unbounded || !point ? rect.height / 2 : point.y - rect.top;
    const maxDimension = Math.max(rect.width, rect.height);
    const initialSize = Math.max(1, Math.floor(maxDimension * 0.2));
    const softEdgeSize = Math.max(maxDimension * 0.35, 75);
    const scale = (Math.hypot(rect.width, rect.height) + 10 + softEdgeSize) / initialSize;
    const wave = document.createElement("span");
    wave.className = "ripple__wave";
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    const reducedMotion = motionPreference.matches;
    if (!reducedMotion) {
      Object.assign(wave.style, {
        width: `${initialSize}px`,
        height: `${initialSize}px`,
        left: `${x - initialSize / 2}px`,
        top: `${y - initialSize / 2}px`,
      });
    } else {
      wave.style.background = "currentColor";
    }
    layer.append(wave);
    layer.dataset.active = "";
    const active: ActiveRipple = {
      wave,
      animations: [],
      listeners: new AbortController(),
      started: performance.now(),
      released: false,
      reducedMotion,
      pointerId,
      key,
    };
    activeRef.current = active;
    if (!reducedMotion) {
      const style = getComputedStyle(layer);
      active.animations.push(
        wave.animate(
          [
            { transform: "translate(0, 0) scale(1)" },
            {
              transform: `translate(${rect.width / 2 - x}px, ${rect.height / 2 - y}px) scale(${scale})`,
            },
          ],
          {
            duration: Number.parseFloat(style.getPropertyValue("--md-comp-ripple-grow-duration")),
            easing: style.getPropertyValue("--md-sys-motion-easing-standard").trim(),
            fill: "forwards",
          },
        ),
        wave.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: Number.parseFloat(style.getPropertyValue("--md-comp-ripple-fade-in-duration")),
          easing: style.getPropertyValue("--md-sys-motion-easing-linear").trim(),
          fill: "forwards",
        }),
      );
    }
    const options = { signal: active.listeners.signal, capture: true };
    motionPreference.addEventListener("change", clear, options);
    host.ownerDocument.addEventListener(
      "pointerup",
      (event) => {
        if (event.pointerId === active.pointerId) release();
      },
      options,
    );
    host.ownerDocument.addEventListener(
      "pointercancel",
      (event) => {
        if (event.pointerId === active.pointerId) clear();
      },
      options,
    );
    host.ownerDocument.defaultView?.addEventListener("blur", clear, {
      signal: active.listeners.signal,
    });
  }

  const handlers: RippleHandlers<T> = {
    onPointerDown(event) {
      props.onPointerDown?.(event);
      if (!event.defaultPrevented && event.button === 0 && event.isPrimary) {
        start(event.currentTarget, { x: event.clientX, y: event.clientY }, event.pointerId);
      }
    },
    onPointerLeave(event) {
      props.onPointerLeave?.(event);
      if (activeRef.current?.pointerId === event.pointerId) release();
    },
    onKeyDown(event) {
      props.onKeyDown?.(event);
      const activates =
        event.key === "Enter" || (event.key === " " && event.currentTarget.tagName === "BUTTON");
      if (!event.defaultPrevented && !event.repeat && activates) {
        start(event.currentTarget, undefined, undefined, event.key);
      }
    },
    onKeyUp(event) {
      props.onKeyUp?.(event);
      if (event.key === activeRef.current?.key) release();
    },
    onBlur(event) {
      props.onBlur?.(event);
      clear();
    },
  };

  return {
    handlers,
    ripple: <span className="ripple" ref={layerRef} aria-hidden="true" />,
  };
}
