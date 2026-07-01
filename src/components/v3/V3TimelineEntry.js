import { useState } from 'react';

export default function V3TimelineEntry({ date, type, summary, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="v3-entry">
      <div className="v3-entry-gutter">{date}</div>
      <div className="v3-entry-body">
        <button type="button" className="v3-entry-summary" onClick={() => setExpanded(!expanded)}>
          <span className="v3-entry-toggle">{expanded ? '−' : '+'}</span>
          <span className="v3-entry-type">[{type}]</span>
          <span>{summary}</span>
        </button>
        {expanded && children && <div className="v3-entry-detail">{children}</div>}
      </div>

      <style jsx>{`
        .v3-entry {
          display: flex;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid #ececea;
        }

        .v3-entry-gutter {
          flex: 0 0 84px;
          color: #767672;
          font-variant-numeric: tabular-nums;
        }

        .v3-entry-body {
          flex: 1;
          min-width: 0;
        }

        .v3-entry-summary {
          display: flex;
          align-items: baseline;
          gap: 8px;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font: inherit;
          color: #1a1a1a;
          text-align: left;
          cursor: pointer;
          width: 100%;
        }

        .v3-entry-toggle {
          color: #767672;
        }

        .v3-entry-type {
          color: #767672;
        }

        .v3-entry-detail {
          padding: 8px 0 0 20px;
          color: #3a3a38;
        }
      `}</style>
    </div>
  );
}
