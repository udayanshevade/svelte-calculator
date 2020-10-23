<script lang="ts" context="module">
  import type { Operation } from './helpers';
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

  export const getDisplayValue = (stack: Operation[]): string => {
    if (!stack.length) return '0';
    return stack
      .map((val) => {
        if (isNumber(val)) {
          return Math.min(val, Number.MAX_SAFE_INTEGER);
        }
        return val;
      })
      .join(' ');
  };
</script>

<script lang="ts">
  import classnames from 'classnames';
  import Display from '../../components/Display/Display.svelte';
  import Button from '../../components/Button/Button.svelte';
  import { config } from './config';
  import {
    isNumber,
    isDigit,
    isValidNumber,
    isString,
    isOperator,
    suffix,
    mergeNumbers,
    suffixDecimal,
    operationHandlers,
  } from './helpers';

  let stack: Operation[] = [];

  $: displayValue = getDisplayValue(stack);

  let activeKey: Operation = null;
  let warning: string = null;

  let highlightedTimeoutId: number = null;
  const highlightedTimeout = 125;
  $: {
    if (activeKey !== null) {
      highlightedTimeoutId = setTimeout(() => {
        activeKey = null;
      }, highlightedTimeout);
    } else {
      clearTimeout(highlightedTimeoutId);
    }
  }

  let warningTimeoutId: number = null;
  const warningTimeout = 1500;
  $: {
    if (warning !== null) {
      warningTimeoutId = setTimeout(() => {
        warning = null;
      }, warningTimeout);
    } else {
      clearTimeout(warningTimeoutId);
    }
  }

  const handleDigitOperation = (newOperation: number) => {
    const lastOperation = stack[stack.length - 1];
    const secondLastOperation = stack[stack.length - 2];
    const lastOperationIsANumber = isValidNumber(Number(lastOperation));
    const lastOperationIsAnOperator = isOperator(lastOperation);
    const lastOperationIsAString = isString(lastOperation);
    const secondLastOperationIsAnOperator = isOperator(secondLastOperation);
    const hasComputedResult = secondLastOperation === '=';

    if (hasComputedResult) {
      // start a new stack with a new number
      // e.g. [12, '/', 4, '=', 3] --> [5]
      stack = [newOperation];
      return;
    }

    if (lastOperationIsANumber) {
      // track temporary string decimal representations,
      // which are useful for maintaining a trailing '.'
      if (lastOperationIsAString) {
        // if the new operation is 0, do not coerce the full value to a number yet.
        // it still needs to be a string, or it will be pared down prematurely
        let valueToAppend: string | number;
        // e.g. ['123.'] --> ['123.0']
        valueToAppend = suffix(lastOperation, newOperation);
        if (newOperation > 0) {
          // a non-zero value can be coerced to a number
          // e.g. ['123.'] --> [123.4]
          valueToAppend = Number(valueToAppend);
        }
        stack[stack.length - 1] = valueToAppend;
        return;
      }

      // prevent consecutive 0 digits unless position is valid
      // e.g. [0] --> [0] (no change)
      if (lastOperation === 0 && newOperation === 0) return;
      // just merge consecutive numerical values otherwise
      // e.g. [20] --> [200]
      const newNum = mergeNumbers(lastOperation, Number(newOperation));
      // ^ TODO: figure out why TS is complaining about newOperation despite type guard inside `isDigit`
      const safeNum = Math.min(newNum, Number.MAX_SAFE_INTEGER);
      stack[stack.length - 1] = safeNum;
      if (safeNum === Number.MAX_SAFE_INTEGER) {
        warning = 'Digit limit reached';
      }
      return;
    }

    if (lastOperationIsAnOperator) {
      if (lastOperation === '-' && secondLastOperationIsAnOperator) {
        // accommmodate '-' after another operator (for negative numbers)
        // e.g. [12345, '/', '-'] --> [12345, '/', -3]
        stack[stack.length - 1] = Number(suffix(lastOperation, newOperation));
      } else {
        // else just add the new number to the stack
        // e.g. [12345, '/'] --> [12345, '/', 3]
        stack = [...stack, newOperation];
      }
      return;
    }
  };

  const handleDecimalOperation = (newOperation: '.') => {
    const lastOperation = stack[stack.length - 1];
    const lastOperationIsANumber = isValidNumber(Number(lastOperation));
    const lastOperationIsAnOperator = isOperator(lastOperation);
    if (lastOperationIsANumber) {
      // ignore if the last number is already a decimal
      // e.g. [12.34] --> [12.34] (no change)
      if (Math.round(Number(lastOperation)) !== lastOperation) return;
      // EDGE CASE: value being converted to decimal is -0,
      // which otherwise gets coerced to '0'
      if (Object.is(lastOperation, -0)) {
        // so this retains the negative value
        // e.g. [-0] --> ['-0.']
        stack[stack.length - 1] = suffix('-0', newOperation);
      } else {
        // else we just string concatenate the decimal and the number
        // e.g. [123] --> ['123.']
        stack[stack.length - 1] = suffixDecimal(lastOperation, newOperation);
      }
      return;
    }

    if (lastOperationIsAnOperator) {
      // e.g. [12, '/'] --> [12, '/', '0.']
      stack = [...stack, suffixDecimal(0, newOperation)];
      return;
    }
  };

  const handleOperatorOperation = (newOperation: '+' | '-' | '/' | '*') => {
    const lastOperation = stack[stack.length - 1];
    const secondLastOperation = stack[stack.length - 2];
    const lastOperationIsANumber = isValidNumber(Number(lastOperation));
    const lastOperationIsAnOperator = isOperator(lastOperation);
    const secondLastOperationIsAnOperator = isOperator(secondLastOperation);
    const hasComputedResult = secondLastOperation === '=';
    const newOperationIsSubtract = newOperation === '-';
    const lastOperationIsSubtract = lastOperation === '-';
    const lastOperationIsAdd = lastOperation === '+';

    if (hasComputedResult) {
      // start new stack with the result
      // e.g. [3, '*', 4, '=', 12] --> [12, '+']
      stack = [lastOperation, newOperation];
      return;
    }

    if (lastOperationIsANumber) {
      stack = [...stack, newOperation];
      return;
    }

    if (lastOperationIsAnOperator) {
      if (newOperationIsSubtract && lastOperationIsSubtract) {
        // convert two consecutive '-' operators to '+'
        // e.g. [1, '-'] --> [1, '+']
        stack[stack.length - 1] = '+';
      } else if (newOperationIsSubtract && lastOperationIsAdd) {
        // e.g. [1, '+'] --> [1, '-']
        stack[stack.length - 1] = '-';
      } else if (newOperationIsSubtract) {
        // e.g. [1] --> [1, '-']
        stack = [...stack, newOperation];
      } else if (lastOperationIsSubtract && secondLastOperationIsAnOperator) {
        // if lastOperation is '-' and is preceded by another operator
        // overwrite both with the new operator
        // e.g. [123, '/', '-'] --> [123, '*']
        stack = [...stack.slice(0, stack.length - 2), newOperation];
      } else {
        // else just overwrite the last operator
        // e.g. [123, '/'] --> [123, '*']
        stack[stack.length - 1] = newOperation;
      }
    }
  };

  const handleEqualsOperation = (newOperation: '=') => {
    const lastOperation = stack[stack.length - 1];
    const secondLastOperation = stack[stack.length - 2];
    const lastOperationIsAnOperator = isOperator(lastOperation);
    const lastOperationIsANumber = isValidNumber(Number(lastOperation));
    const hasComputedResult = secondLastOperation === '=';
    // ignore duplicate operation
    // e.g. [1, '+', 1, '=', 2] --> [1, '+', 1, '=', 2] (no change)
    if (hasComputedResult) return;

    if (lastOperationIsAnOperator) {
      // replace the previous operator, then compute
      // e.g. [1, '+', 1, '/'] --> [1, '+', 1, '=', 2]
      const result = computeValue(stack);
      stack = [...stack.slice(0, stack.length - 1), newOperation, result];
      return;
    }

    if (lastOperationIsANumber) {
      // otherwise just compute the result
      // e.g. [1, '+', 1, '=', 2] --> [1, '+', 1, '=', 2]
      const result = computeValue(stack);
      stack = [...stack, newOperation, result];
    }
  };

  const handleButtonClick = (newOperation: Operation) => {
    if (newOperation === 'clear') {
      stack = [];
      return;
    }

    if (!stack.length) {
      if (isDigit(newOperation)) {
        stack = [newOperation];
      } else if (isOperator(newOperation) || newOperation === '.') {
        handleButtonClick(0);
        handleButtonClick(newOperation);
      }
      return;
    }

    if (newOperation === '=') {
      handleEqualsOperation(newOperation);
      return;
    }

    if (isDigit(newOperation)) {
      handleDigitOperation(newOperation);
      return;
    }

    if (newOperation === '.') {
      handleDecimalOperation(newOperation);
      return;
    }

    if (isOperator(newOperation)) {
      handleOperatorOperation(newOperation);
      return;
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    let valueToHandle = null;
    if (isDigit(e.key)) {
      valueToHandle = Number(e.key);
    } else if (/[\/\*\-\+\=]/.test(e.key)) {
      valueToHandle = e.key;
    } else if (e.key === 'Enter') {
      valueToHandle = '=';
    } else if (e.key === 'Escape') {
      valueToHandle = 'clear';
    } else if (e.key === '.') {
      valueToHandle = '.';
    }
    if (valueToHandle !== null) {
      activeKey = valueToHandle;
      handleButtonClick(valueToHandle);
    }
  };
</script>

<style>
  .calculator {
    border-radius: 1rem;
    border: 2px solid #222;
    background: #333;
    max-width: 100%;
    width: 15rem;
    padding: 0.5rem;
    margin: 0 auto;
  }
  .calculator-inner {
    border-radius: 1rem;
    border: 1px solid #222;
    width: 100%;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fill, calc(25% - 0.075rem));
    grid-column-gap: 0.1rem;
  }
  .row--full {
    grid-template-columns: auto;
  }
  .calculator .row--full :global(.button) {
    margin: 0.25rem 0 0.5rem;
    width: auto;
  }
  .calculator .row:last-of-type :global(.button) {
    margin-bottom: 0.25rem;
  }
  .calculator .row:last-of-type :global(.button:first-of-type) {
    border-bottom-left-radius: 0.5rem;
  }
  .calculator .row:last-of-type :global(.button:last-of-type) {
    border-bottom-right-radius: 0.5rem;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div class="calculator">
  <div class="calculator-inner">
    <Display {displayValue} {warning} />
    {#each config as { className: rowClassName, config: rowConfig }}
      <div class={classnames('row', rowClassName)}>
        {#each rowConfig as { id, value, title, className, text } (id)}
          <Button
            {id}
            {title}
            className={classnames(className)}
            {text}
            {value}
            onClick={() => handleButtonClick(value)}
            highlighted={activeKey === value} />
        {/each}
      </div>
    {/each}
  </div>
</div>
