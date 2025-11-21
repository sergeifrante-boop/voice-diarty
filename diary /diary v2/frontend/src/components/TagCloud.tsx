export type TagWeight = { tag: string; weight: number };

type Props = {
  tags: TagWeight[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
};

const TagCloud = ({ tags, activeTag, onTagClick }: Props) => {
  if (!tags.length) {
    return <p>Теги появятся после первых записей.</p>;
  }

  const maxWeight = Math.max(...tags.map((t) => t.weight));

  return (
    <section>
      <h2>Облако тегов</h2>
      <div className="tag-cloud">
        {tags.map((item) => {
          const size = 1 + (item.weight / maxWeight) * 1.5;
          return (
            <button
              type="button"
              key={item.tag}
              onClick={() => onTagClick(item.tag)}
              style={{ fontSize: `${size}rem`, background: "none", border: "none", color: activeTag === item.tag ? "#2563eb" : "#111827" }}
            >
              {item.tag} ({item.weight})
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default TagCloud;
