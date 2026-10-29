import BEMHelper from "react-bem-helper";

const siteFooterBem = BEMHelper("site-footer");

export function Footer() {
  return (
    <footer {...siteFooterBem()}>
      <nav {...siteFooterBem({ element: "links" })}>
        <a
          {...siteFooterBem({ element: "link" })}
          href="https://github.com/EskiMojo14/eskimojo"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
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
