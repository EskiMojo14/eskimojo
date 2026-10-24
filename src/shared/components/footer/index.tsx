import { createBem } from "#/shared/lib/bem";

const siteFooterBem = createBem("site-footer");

export function Footer() {
  return (
    <footer {...siteFooterBem()}>
      <nav {...siteFooterBem({ element: "links" })} aria-label="Social profiles">
        <a {...siteFooterBem({ element: "link" })} href="https://github.com/EskiMojo14">
          GitHub
        </a>
        <a {...siteFooterBem({ element: "link" })} href="https://twitter.com/eskimojo">
          Twitter
        </a>
        <a
          {...siteFooterBem({ element: "link" })}
          href="https://bsky.app/profile/eskimojo.bsky.social"
        >
          Bluesky
        </a>
      </nav>
    </footer>
  );
}
