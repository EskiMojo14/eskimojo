import "./index.css";

export function Footer() {
  return (
    <footer className="site-footer">
      <nav className="site-footer__links" aria-label="Social profiles">
        <a className="site-footer__link" href="https://github.com/EskiMojo14">
          GitHub
        </a>
        <a className="site-footer__link" href="https://twitter.com/eskimojo">
          Twitter
        </a>
        <a className="site-footer__link" href="https://bsky.app/profile/eskimojo.bsky.social">
          Bluesky
        </a>
      </nav>
    </footer>
  );
}
