import Link from 'next/link';
import NowPlaying from './NowPlaying';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-content">
        <Link href="/" className="home-link">
          ← ryankrol.co.uk
        </Link>
        <div className="header-right">
          <div className="header-now-playing">
            <NowPlaying />
          </div>
        </div>
      </div>
    </header>
  );
}
