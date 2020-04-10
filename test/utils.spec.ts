import * as Utils from '../src/utils';

test('round 1.4 to 1', () => {
  expect(Utils.round(1.4, 0)).toBe(1);
});

test('round 1.6 to 2', () => {
  expect(Utils.round(1.6, 0)).toBe(2);
});

test('round 7.128 to 7.13', () => {
  expect(Utils.round(7.128, 2)).toBe(7.13);
});

test('create empty range', () => {
  expect(Utils.range(0)).toEqual([]);
});

test('create rage from 0 to 0', () => {
  expect(Utils.range(1)).toEqual([0]);
});

test('create rage from 0 to 1', () => {
  expect(Utils.range(2)).toEqual([0, 1]);
});

test('create rage from 0 to 7', () => {
  expect(Utils.range(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
});
