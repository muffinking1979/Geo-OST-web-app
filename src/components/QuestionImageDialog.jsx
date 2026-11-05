import { useEffect, useRef, useState } from 'react';

const src = (path) => `${import.meta.env.BASE_URL}${path}`;

// Shows the released question as images: pages rendered from the scoring-guide PDFs
// (2016–2025) or screenshots from the Item Release Library (2026+).
// Native <dialog> gives us Esc-to-close, focus trapping, and the backdrop.
export default function QuestionImageDialog({ item, onClose }) {
  const ref = useRef(null);
  const [showScoring, setShowScoring] = useState(false);
  const scoring = item.scoringImages ?? [];

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  // Clicks on the backdrop land on the <dialog> element itself.
  const onClick = (e) => {
    if (e.target === ref.current) ref.current.close();
  };

  return (
    <dialog ref={ref} className="question-dialog" onClose={onClose} onClick={onClick}>
      <div className="question-dialog-header">
        <span className="question-dialog-title">
          {item.year} · {item.question}
          {item.title ? ` · ${item.title}` : ''}
        </span>
        <button type="button" className="question-dialog-close" onClick={() => ref.current.close()} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="question-dialog-body">
        {item.images.map((path, i) => (
          <img
            key={path}
            className="question-dialog-image"
            src={src(path)}
            alt={i === 0 ? item.text : `${item.question}, page ${i + 1}`}
          />
        ))}
        {showScoring &&
          scoring.map((path, i) => (
            <img
              key={path}
              className="question-dialog-image scoring"
              src={src(path)}
              alt={`Scoring guidelines for ${item.question}, page ${i + 1}`}
            />
          ))}
      </div>
      <div className="question-dialog-footer">
        {item.answer && <span className="answer-key">Answer: {item.answer}</span>}
        {scoring.length > 0 && (
          <button type="button" className="link-button" onClick={() => setShowScoring((s) => !s)}>
            {showScoring ? 'Hide scoring guidelines' : 'Show scoring guidelines'}
          </button>
        )}
      </div>
    </dialog>
  );
}
