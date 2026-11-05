import { countsByYear, shortYear, totalItems, totalStandards } from '../data/index.js';

export default function Welcome() {
  return (
    <div className="welcome">
      <div className="icon">△</div>
      <h2>Select a standard</h2>
      <p>
        Click any standard in the sidebar to see all released test items mapped to it. Each card
        opens the released question and its scoring guidelines, saved from Ohio's
        item release guides.
      </p>
      <div className="data-pills">
        {countsByYear.map(({ label, color, count }) => (
          <span
            key={label}
            className="data-pill"
            style={{ color, borderColor: `${color}55`, background: `${color}18` }}
          >
            {shortYear(label)}: {count}
          </span>
        ))}
      </div>
      <p className="total-note">
        {totalItems} total items · {totalStandards} standards covered
      </p>
    </div>
  );
}
