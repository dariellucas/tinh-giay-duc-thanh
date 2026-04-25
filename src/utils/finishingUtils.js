export function findFinishingByName(finishingDatabase, name) {
  const target = String(name || '').trim().toLowerCase();
  return (finishingDatabase || []).find(
    (item) => String(item?.item || '').trim().toLowerCase() === target,
  );
}
