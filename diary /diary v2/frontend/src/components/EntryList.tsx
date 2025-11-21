import { EntrySummary } from "../App";

type Props = {
  entries: EntrySummary[];
  onSelect: (id: string) => void;
};

const EntryList = ({ entries, onSelect }: Props) => {
  if (!entries.length) {
    return <p>Записей пока нет.</p>;
  }
  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <article key={entry.id} className="entry-card" onClick={() => onSelect(entry.id)}>
          <h3>{entry.title || "Без названия"}</h3>
          <small>
            {new Date(entry.created_at).toLocaleString()} · {entry.mood_label}
          </small>
          <p>{entry.transcript_preview}</p>
          <div className="tags">
            {entry.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
};

export default EntryList;
