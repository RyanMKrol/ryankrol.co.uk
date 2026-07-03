const SOCIAL_LINKS = [
  { key: 'instagram', label: 'instagram', href: 'https://instagram.com/_ryankrol' },
  { key: 'facebook', label: 'facebook', href: 'https://facebook.com/krol.ryan' },
  { key: 'github', label: 'github', href: 'https://github.com/RyanMKrol' },
  { key: 'linkedin', label: 'linkedin', href: 'https://linkedin.com/in/ryan-krol-265308a2/' },
  { key: 'lastfm', label: 'last.fm', href: 'https://last.fm/user/somethingmeaty' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-social-links">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="footer-copyright">
          © ryan krol · made with too much free time
        </div>
      </div>
    </footer>
  );
}
