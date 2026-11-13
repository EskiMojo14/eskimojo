export function isChristmas(christmas: boolean | undefined, date = new Date()) {
  return christmas === true || date.getUTCMonth() === 11;
}
