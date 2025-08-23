import Link from 'next/link';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-content">
        <Link href="/" className="home-link">
          ← ryankrol.co.uk
        </Link>
      </div>
    </header>
  );
}