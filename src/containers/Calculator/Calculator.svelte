<script lang="ts" context="module">
  type Operation = number | string;
  type ButtonConfig = {
    id: string,
    title: string,
    text: string,
    value: number | string,
    className?: string
  };

  export const config: ButtonConfig[][] = [
    [{ id: "clear", title: "Clear", text: "AC", value: "clear" }],
    [
      { id: "seven", title: "Seven", text: "7", value: 7 },
      { id: "eight", title: "Eight", text: "8", value: 8 },
      { id: "nine", title: "Nine", text: "9", value: 9 },
      { id: "divide", title: "Divide", text: "/", value: "/" },
    ],
    [
      { id: "four", title: "Four", text: "4", value: 4 },
      { id: "five", title: "Five", text: "5", value: 5 },
      { id: "six", title: "Six", text: "6", value: 6 },
      { id: "multiply", title: "Multiply", text: "*", value: "*" },
    ],
    [
      { id: "one", title: "One", text: "1", value: 1 },
      { id: "two", title: "Two", text: "2", value: 2 },
      { id: "three", title: "Three", text: "3", value: 3 },
      { id: "subtract", title: "Subtract", text: "-", value: "-" },
    ],
    [
      { id: "zero", title: "Zero", text: "0", value: 0 },
      { id: "decimal", title: "Decimal", text: ".", value: "." },
      {
        id: "equals",
        title: "Equals",
        text: "=",
        value: "=",
        className: "button--equals",
      },
      { id: "add", title: "Add", text: "+", value: "+" },
    ],
  ];

  // operation handlers
  export const operationHandlers = {
    '+': (a: number, b: number): number => a + b,
    '-': (a: number, b: number): number => a - b,
    '*': (a: number, b: number): number => a * b,
    '/': (a: number, b: number): number => a / b,
  };

  const toFixedDigits = 10;
  // reduce the array by immediate execution
  // TODO: use formula logic
  export const computeValue = (stack: Operation[]): number => {
    const output = stack.reduce((acc: number, next: Operation, i: number) => {
      const asNumber = Number(next);
      if (isValidNumber(asNumber)) {
        if (i === 0) return asNumber;
        const lastOperation = stack[i - 1];
        return operationHandlers[lastOperation](acc, asNumber);
      }
      return acc;
    }, 0);
    // round to fixed number of digits
    return Number(output.toFixed(toFixedDigits));
  };

  // utils
  const isNumber = (val: Operation): val is number => typeof val === "number";
  const isValidNumber = (val: number): boolean => !isNaN(val);
  const isString = (val: Operation): val is string => typeof val === "string";
  const suffix = (prevVal: Operation, newVal: Operation): string => {
    return `${prevVal}${newVal}`;
  };
  const suffixNums = (prevVal: number, newVal: number): number => {
    const updatedNum = suffix(prevVal, newVal);
    return Number(updatedNum);
  };
  const suffixDecimal = (prevVal: number, newVal: '.'): string => {
    return suffix(prevVal, newVal);
  };
</script>

<script lang="ts">
  import Display from "../../components/Display/Display.svelte";
  import Button from "../../components/Button/Button.svelte";

  let stack: Operation[] = [];

  $: displayValue = stack.join(" ") || '0';

  const handleButtonClick = (newOperation: Operation) => {
    // TODO: handle button click
    if (newOperation === "clear") {
      stack = [];
      return;
    }

    if (!stack.length) {
      if (isNumber(newOperation)) {
        stack = [newOperation];
      }
      return;
    }

    const lastOperation = stack[stack.length - 1];
    const secondLastOperation = stack[stack.length - 2];
    if (isNumber(lastOperation) && isNumber(newOperation)) {
      // EDGE CASE: ignore consecutive 0's in a new numeric operation
      if (lastOperation === 0 && newOperation === 0) return;
      stack[stack.length - 1] = suffixNums(lastOperation, newOperation);
    } else if (isNumber(lastOperation) && newOperation === ".") {
      // noop if the lastOperation is already a decimal
      // e.g. [12.34] --> [12.34] (no change)
      if (Math.round(lastOperation) !== lastOperation) return;
      // else convert it to a decimal value
      // e.g. [12] --> ['12.']
      // temporarily converts to a string to allow a trailing decimal point
      stack[stack.length - 1] = suffixDecimal(lastOperation, newOperation);
    } else if (isString(lastOperation) && newOperation === ".") {
      // EDGE CASE: lastOperation is a string decimal with a trailing '.'
      // and newOperation is another decimal point
      // e.g. ['12.'] --> ['12.'] (no change)
      if (isValidNumber(Number(lastOperation))) return;
      // else append new decimal starting with automatic '0'
      // e.g. [12, '/'] --> [12, '/', '0.']
      stack = [...stack, suffixDecimal(0, newOperation)];
    } else if (isString(lastOperation) && isNumber(newOperation)) {
      // EDGE CASE: last number is a string decimal with trailing point
      // and needs to be continued with a numerical newOperation
      // e.g. ['12.'] --> [12.3]
      const asNumber = Number(lastOperation);
      if (isValidNumber(asNumber)) {
        // if the new operation is a 0, do not coerce to a number yet
        // it still needs to be a string, or it will be reduced to 0
        if (newOperation === 0) {
          stack[stack.length - 1] = suffix(lastOperation, newOperation);
        } else {
          // if it is non-zero, the decimal can be coerced to a number
          stack[stack.length - 1] = Number(suffix(lastOperation, newOperation));
        }
      } else if (
        lastOperation === '-' &&
        typeof operationHandlers[secondLastOperation] === 'function'
      ) {
        stack[stack.length - 1] = Number(suffix(lastOperation, newOperation));
      } else {
        // else we're just adding a new number operation to the stack
        // after some other string operation
        // e.g. [123, '/'] --> [123, '/', 3]
        stack = [...stack, newOperation];
      }
    } else if (isString(lastOperation) && isString(newOperation)) {
      // EDGE CASE: if newOperation is '-', accommodate it
      // e.g. ['1', '/'] --> ['1', '/', '-']
      if (newOperation === '-') {
        stack = [...stack, newOperation];
      } else if (
        lastOperation === '-' &&
        typeof operationHandlers[secondLastOperation] === 'function' &&
        typeof operationHandlers[newOperation] === 'function'
      ) {
        // EDGE CASE: if lastOperation was '-' and secondLastOperation was also an operator,
        // and the new operation is also an operator
        // overwrite the secondLastOperation as well
        stack = [...stack.slice(0, stack.length - 2), newOperation];
      } else {
        // else simply overwrite that lastOperation with the newOperation,
        // e.g. [123, '/'] --> [123, '*']
        stack[stack.length - 1] = newOperation;
      }
    } else {
      stack = [...stack, newOperation];
    }
  };
</script>

<div class="calculator">
  <Display {displayValue} />
  {#each config as rowConfig}
    <div class="row">
      {#each rowConfig as { id, value, title, className, text } (id)}
        <Button
          {id}
          {title}
          className={`button ${className}`}
          {text}
          {value}
          onClick={() => handleButtonClick(value)} />
      {/each}
    </div>
  {/each}
</div>
