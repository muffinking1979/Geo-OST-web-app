import { totalItems, totalStandards, yearRange, years } from '../data/index.js';

export default function Header() {
  return (
    <header>
      <h1>Ohio Geometry OST — Released Items by Standard</h1>
      <span className="sub">{years.length} YEARS · REBUILT</span>
      <span className="pill">
        {totalItems} items · {totalStandards} standards · {yearRange}
      </span>
    </header>
  );
}
