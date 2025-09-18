export function getCity(city: string) {
  switch (city) {
    case 'spb':
      return 'piter';
    case 'msk':
      return 'moscow';
    case 'nsk':
      return 'novosibirsk';
    case 'ekb':
      return 'ekaterinburg';
    case 'nn':
      return 'nnov';
    case 'rnd':
      return 'rostov';
    default:
      return city;
  }
}
