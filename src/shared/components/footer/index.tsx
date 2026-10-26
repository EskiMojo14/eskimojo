import BEMHelper from "react-bem-helper";

const siteFooterBem = BEMHelper("site-footer");

export function Footer() {
  return (
    <footer {...siteFooterBem()}>
      <nav {...siteFooterBem({ element: "links" })} aria-label="Social profiles">
        <a
          {...siteFooterBem({ element: "link" })}
          href="https://github.com/EskiMojo14"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          {...siteFooterBem({ element: "link" })}
          href="https://twitter.com/eskimojo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Twitter
        </a>
        <a
          {...siteFooterBem({ element: "link" })}
          href="https://bsky.app/profile/eskimojo.bsky.social"
          target="_blank"
          rel="noopener noreferrer"
        >
          Bluesky
        </a>
      </nav>
      <p {...siteFooterBem({ element: "credit" })}>
        Artwork by{" "}
        <a
          {...siteFooterBem({ element: "link" })}
          href="https://x.com/popurri_arts"
          target="_blank"
          rel="noopener noreferrer"
        >
          Popurri
        </a>
      </p>
    </footer>
  );
}
