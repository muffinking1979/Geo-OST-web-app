import data from './items.json';

export const { years, sections, standards } = data;

export const yearColor = Object.fromEntries(years.map((y) => [y.label, y.color]));

const allItems = Object.values(standards).flatMap((s) => s.items);

export const totalItems = allItems.length;
export const totalStandards = Object.keys(standards).length;

export const countsByYear = years.map((y) => ({
  ...y,
  count: allItems.filter((item) => item.year === y.label).length,
}));

// "Spring 2017" -> "2017".
export const shortYear = (label) => label.replace(/^Spring\s+/, '');

const yearNumbers = years.map((y) => Number(shortYear(y.label)));
export const yearRange = `${Math.min(...yearNumbers)}–${Math.max(...yearNumbers)}`;
