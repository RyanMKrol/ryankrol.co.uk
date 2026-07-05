export function distributeRoundRobin(items, columnCount) {
  if (columnCount <= 1) return [items];

  const columns = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => {
    columns[i % columnCount].push(item);
  });
  return columns;
}
