export type Operation = number | string;

// operation handlers
export const operationHandlers = {
  '+': (a: number, b: number): number => a + b,
  '-': (a: number, b: number): number => a - b,
  '*': (a: number, b: number): number => a * b,
  '/': (a: number, b: number): number => a / b,
};

// utils
export const isNumber = (val: Operation): val is number =>
  typeof val === 'number';
export const isValidNumber = (val: number): boolean => !isNaN(val);

export const isString = (val: Operation): val is string =>
  typeof val === 'string';

export const suffix = (prevVal: Operation, newVal: Operation): string => {
  return `${prevVal}${newVal}`;
};

export const suffixNumbers = (prevVal: number, newVal: number): number => {
  const updatedNum = suffix(prevVal, newVal);
  return Number(updatedNum);
};

export const suffixDecimal = (prevVal: number, newVal: '.'): string => {
  return suffix(prevVal, newVal);
};
