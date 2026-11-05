import { useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Welcome from './components/Welcome.jsx';
import StandardDetail from './components/StandardDetail.jsx';
import { standards } from './data/index.js';

// The selected standard lives in the URL hash (e.g. #G.CO.5) so it can be
// bookmarked and the browser back button works.
const readHash = () => {
  const code = decodeURIComponent(window.location.hash.slice(1));
  return standards[code] ? code : null;
};

export default function App() {
  const [selected, setSelected] = useState(readHash);
  const mainRef = useRef(null);

  useEffect(() => {
    const onHashChange = () => setSelected(readHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [selected]);

  const selectStandard = (code) => {
    window.location.hash = encodeURIComponent(code);
  };

  return (
    <>
      <Header />
      <div className="layout">
        <Sidebar selected={selected} onSelect={selectStandard} />
        <main className="main" ref={mainRef}>
          {selected ? <StandardDetail code={selected} /> : <Welcome />}
        </main>
      </div>
    </>
  );
}
