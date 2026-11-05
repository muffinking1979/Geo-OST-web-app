import { sections, standards } from '../data/index.js';

export default function Sidebar({ selected, onSelect }) {
  return (
    <nav className="sidebar">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          {section.standards.map((code) => (
            <button
              key={code}
              type="button"
              className={`std-item${code === selected ? ' active' : ''}`}
              aria-current={code === selected ? 'page' : undefined}
              onClick={() => onSelect(code)}
            >
              <span className="std-code">{code}</span>
              <span className="std-badge">{standards[code].items.length}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
