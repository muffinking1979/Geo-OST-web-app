import { useState } from 'react';
import QuestionImageDialog from './QuestionImageDialog.jsx';
import { yearColor } from '../data/index.js';

export default function QuestionCard({ item }) {
  const { year, question, type, answer, text, images, pdfUrl } = item;
  const [open, setOpen] = useState(false);
  return (
    <div className="question-card">
      <div className="card-meta">
        <span className="year-tag" style={{ background: yearColor[year] }}>
          {year}
        </span>
        <span className="q-num">{question}</span>
        <span className="q-type">{type}</span>
        {answer && <span className="answer-key">Answer: {answer}</span>}
      </div>
      <p className="question-text">{text}</p>
      {(images?.length > 0 || pdfUrl) && (
        <div className="card-note">
          {images?.length > 0 && (
            <>
              🖼️ Shows the released question&nbsp;
              <button type="button" className="link-button" onClick={() => setOpen(true)}>
                View question →
              </button>
            </>
          )}
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              📄 Open in scoring guide PDF ↗
            </a>
          )}
        </div>
      )}
      {open && <QuestionImageDialog item={item} onClose={() => setOpen(false)} />}
    </div>
  );
}
