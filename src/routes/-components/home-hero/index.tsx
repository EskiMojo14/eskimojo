import { useId, useState } from "react";
import BEMHelper from "react-bem-helper";

import { IconButton } from "#/shared/components/buttons/icon-button";
import { MdSymbol } from "#/shared/components/symbol";

const homeHeroBem = BEMHelper("home-hero");
const roles = [
  "a web developer",
  "an open source contributor",
  "a Redux maintainer",
  "a musician",
  "an Overwatch casual",
  "a cat dad",
];
const roleList = new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(roles);

export function HomeHero() {
  const titleId = useId();
  const [paused, setPaused] = useState(false);
  const animationAction = paused ? "Resume role animation" : "Pause role animation";

  return (
    <section {...homeHeroBem()} aria-labelledby={titleId} data-paused={paused}>
      <div {...homeHeroBem({ element: "content" })}>
        <h1 id={titleId} {...homeHeroBem({ element: "title" })}>
          Hi, I&apos;m eskimojo.
        </h1>
        <p {...homeHeroBem({ element: "description" })}>
          <span {...homeHeroBem({ element: "static-description" })}>I'm {roleList}.</span>
          <span {...homeHeroBem({ element: "animated-description" })} aria-hidden="true">
            I'm{" "}
            <span {...homeHeroBem({ element: "roles" })}>
              {roles.map((role) => (
                <span key={role} {...homeHeroBem({ element: "role" })}>
                  {role}.
                </span>
              ))}
            </span>
          </span>
        </p>
        <div {...homeHeroBem({ element: "control" })}>
          <svg
            {...homeHeroBem({ element: "progress" })}
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
          >
            <path
              {...homeHeroBem({ element: "progress-track" })}
              d="M46 24A22 22 0 1 1 2 24A22 22 0 1 1 46 24Z"
            />
            <path
              {...homeHeroBem({ element: "progress-fill" })}
              d="M46 24A22 22 0 1 1 2 24A22 22 0 1 1 46 24Z"
              pathLength="100"
            />
          </svg>
          <IconButton
            {...homeHeroBem({ element: "pause" })}
            size="extra-small"
            aria-label={animationAction}
            tooltip={animationAction}
            icon={<MdSymbol>{paused ? "play_arrow" : "pause"}</MdSymbol>}
            onClick={() => setPaused((previous) => !previous)}
          />
        </div>
      </div>
    </section>
  );
}
