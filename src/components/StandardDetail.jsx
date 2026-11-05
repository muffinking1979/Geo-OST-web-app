import QuestionCard from './QuestionCard.jsx';
import { standards } from '../data/index.js';

export default function StandardDetail({ code }) {
  const { description, items } = standards[code];
  return (
    <div className="std-detail">
      <div className="detail-header">
        <div className="detail-header-top">
          <h2>{code}</h2>
          <span className="item-count">{items.length} items</span>
        </div>
        <p className="std-full-desc">{description}</p>
      </div>
      <div className="cards-grid">
        {items.map((item) => (
          <QuestionCard key={`${item.year}-${item.question}`} item={item} />
        ))}
      </div>
    </div>
  );
}
