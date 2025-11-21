type CalendarEntry = {
  id: string;
  title: string;
  time: string;
  tags: string[];
};

type Day = {
  date: string;
  entries: CalendarEntry[];
};

type Props = {
  month: string;
  days: Day[];
  onMonthChange: (value: string) => void;
};

const monthsBack = Array.from({ length: 6 }).map((_, idx) => {
  const date = new Date();
  date.setMonth(date.getMonth() - idx);
  return date.toISOString().slice(0, 7);
});

const CalendarView = ({ month, days, onMonthChange }: Props) => (
  <section>
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <h2>Календарь</h2>
      <select value={month} onChange={(e) => onMonthChange(e.target.value)}>
        {monthsBack.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
    <div className="calendar-list">
      {days.map((day) => (
        <div key={day.date}>
          <strong>{day.date}</strong>
          {day.entries.map((entry) => (
            <div key={entry.id} style={{ marginLeft: "1rem" }}>
              <span>
                {entry.time} · {entry.title}
              </span>
              <div className="tags">
                {entry.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </section>
);

export default CalendarView;
