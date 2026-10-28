import { useEffect, useId, useRef, useState } from "react";
import BEMHelper from "react-bem-helper";

import { IconButton } from "#/shared/components/buttons/icon-button";
import { MdSymbol } from "#/shared/components/symbol";

import { roles } from "./constants";

const homeHeroBem = BEMHelper("home-hero");
const roleList = new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(roles);

export function HomeHero() {
  const titleId = useId();
  const heroRef = useRef<HTMLElement>(null);
  const rolesRef = useRef<HTMLSpanElement>(null);
  const [paused, setPaused] = useState(false);
  const animationAction = paused ? "Resume role animation" : "Pause role animation";

  useEffect(() => {
    const container = rolesRef.current;
    if (!container) throw new Error("Cannot measure roles without the home hero role container.");
    const elements = container.querySelectorAll<HTMLElement>(".home-hero__role");
    const observer = new ResizeObserver(() => {
      elements.forEach((element, index) => {
        container.style.setProperty(
          `--home-hero-role-width-${index + 1}`,
          `${element.getBoundingClientRect().width}px`,
        );
      });
    });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function skipRole() {
    const animations = heroRef.current
      ?.getAnimations({ subtree: true })
      .filter(
        (animation): animation is CSSAnimation =>
          animation instanceof CSSAnimation &&
          (animation.animationName.startsWith("home-hero-role-") ||
            animation.animationName === "home-hero-progress"),
      );
    const progress = animations?.find(
      (animation) => animation.animationName === "home-hero-progress",
    );
    const interval = progress?.effect?.getComputedTiming().duration;
    if (
      !animations ||
      typeof progress?.currentTime !== "number" ||
      typeof interval !== "number" ||
      interval <= 0
    ) {
      throw new Error("Cannot skip a role without an active home hero animation.");
    }

    let target = (Math.floor(progress.currentTime / interval) + 1) * interval;
    if (paused) {
      const fade = animations.find(
        (animation) => animation.animationName === "home-hero-role-fade",
      );
      const effect = fade?.effect;
      const duration = effect?.getComputedTiming().duration;
      const visibleFrame =
        effect instanceof KeyframeEffect
          ? effect.getKeyframes().find((frame) => frame.opacity === "1")
          : undefined;
      if (typeof duration !== "number" || !visibleFrame) {
        throw new Error("Cannot find the home hero role's visible animation frame.");
      }
      // Seek inside the hold, avoiding rounding at the outgoing fade's boundary.
      target += visibleFrame.computedOffset * duration + 1;
    }
    for (const animation of animations) animation.currentTime = target;
  }

  return (
    <section {...homeHeroBem()} ref={heroRef} aria-labelledby={titleId} data-paused={paused}>
      <div {...homeHeroBem({ element: "content" })}>
        <h1 id={titleId} {...homeHeroBem({ element: "title" })}>
          Hi, I&apos;m eskimojo.
        </h1>
        <p {...homeHeroBem({ element: "description" })}>
          <span {...homeHeroBem({ element: "static-description" })}>I'm {roleList}.</span>
          <span {...homeHeroBem({ element: "animated-description" })} aria-hidden="true">
            I'm{" "}
            <span {...homeHeroBem({ element: "roles" })} ref={rolesRef}>
              {roles.map((role) => (
                <span key={role} {...homeHeroBem({ element: "role" })}>
                  {role}.
                </span>
              ))}
              <span {...homeHeroBem({ element: "progress" })}>
                <span {...homeHeroBem({ element: "progress-fill" })} />
              </span>
            </span>
          </span>
        </p>
        <div {...homeHeroBem({ element: "controls" })}>
          <IconButton
            {...homeHeroBem({ element: "button" })}
            aria-label={animationAction}
            tooltip={animationAction}
            icon={<MdSymbol>{paused ? "play_arrow" : "pause"}</MdSymbol>}
            onClick={() => setPaused((previous) => !previous)}
            variant="outlined"
          />
          <IconButton
            {...homeHeroBem({ element: "button" })}
            aria-label="Next role"
            tooltip="Next role"
            icon={<MdSymbol>skip_next</MdSymbol>}
            onClick={skipRole}
            variant="outlined"
          />
        </div>
      </div>
    </section>
  );
}
