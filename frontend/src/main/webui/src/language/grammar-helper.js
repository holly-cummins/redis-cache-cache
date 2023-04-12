export function prependAt({ place, isPlural }) {
  if (isPlural === 'true' || isPlural === true) {
    return `aux ${place}`;
  }

  if (place?.startsWith('Le')) {
    return place.replace('Le', 'au');
  }

  if (place?.startsWith('L')) {
    return place.replace('L', 'a l');
  }
  return `au ${place}`;
}
