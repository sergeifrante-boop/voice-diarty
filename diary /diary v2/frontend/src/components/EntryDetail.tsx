import { EntryDetailModel } from "../App";

type Props = {
  entry: EntryDetailModel;
  apiUrl: string;
};

const EntryDetail = ({ entry, apiUrl }: Props) => (
  <div>
    <h2>{entry.title}</h2>
    <p><strong>Настроение:</strong> {entry.mood_label}</p>
    <div>
      <h3>Теги</h3>
      <div className="tags">
        {entry.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
    <div>
      <h3>Транскрипт</h3>
      <p>{entry.transcript}</p>
    </div>
    <div>
      <h3>Наблюдения</h3>
      <ul>
        {entry.insights.map((insight, index) => (
          <li key={index}>{insight}</li>
        ))}
      </ul>
    </div>
  </div>
);

export default EntryDetail;
