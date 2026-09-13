import { Link } from 'react-router-dom';

export default function Spotlight() {
  return (
    <div className="spotlight">
      <header><Link to="/">Microsoft Student Club / SCU</Link></header>
      <main id="spotlight-main">
        <h1>Microsoft Student Club</h1>
        <p>Suez Canal University. Made of curious minds.</p>
      </main>
    </div>
  );
}