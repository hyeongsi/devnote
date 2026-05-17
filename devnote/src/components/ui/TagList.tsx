import { Badge } from './Badge';

export function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {tags.map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </div>
  );
}
