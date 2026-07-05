import { distributeRoundRobin } from '../lib/masonryColumns';

export default function MasonryColumns({ items, columnCount, renderItem, className, columnClassName }) {
  const columns = distributeRoundRobin(items, columnCount);

  return (
    <div className={className}>
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className={columnClassName}>
          {column.map((item, indexInColumn) => {
            const originalIndex = indexInColumn * columnCount + columnIndex;
            return renderItem(item, originalIndex);
          })}
        </div>
      ))}
    </div>
  );
}
