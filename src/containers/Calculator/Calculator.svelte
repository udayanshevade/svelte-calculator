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
    return stack.join(' ');
  };
</script>

<script lang="ts">
  import classnames from 'classnames';
  import Display from '../../components/Display/Display.svelte';
  import Button from '../../components/Button/Button.svelte';
  import { config } from './config';
  import {
    isNumber,
    isValidNumber,
    isString,
    suffix,
    suffixNumbers,
    suffixDecimal,
    operationHandlers,
  } from './helpers';

  let stack: Operation[] = [];

  $: displayValue = getDisplayValue(stack);

  let activeKey: Operation = null;
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

  const handleButtonClick = (newOperation: Operation) => {
    if (newOperation === 'clear') {
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

    if (newOperation === '=') {
      // ignore duplicate operation
      // e.g. [1, '+', 1, '=', 2] --> [1, '+', 1, '=', 2] (no change)
      if (secondLastOperation === '=') return;
      // compute updated result
      const result = computeValue(stack);
      // e.g. [2, '*', 6] --> [2, '*', 6, '=', 12]
      stack[stack.length] = '=';
      stack[stack.length] = result;
    } else if (secondLastOperation === '=') {
      if (isNumber(newOperation)) {
        // start a new stack with a new number
        // e.g. [12, '/', 4, '=', 3] --> [5]
        stack = [newOperation];
      } else {
        // or start a new stack with the result
        // e.g. [3, '*', 4, '=', 12] --> [12, '+']
        stack = [lastOperation, newOperation];
      }
    } else if (isNumber(lastOperation) && isNumber(newOperation)) {
      // EDGE CASE: ignore consecutive 0's in a new numeric operation
      if (lastOperation === 0 && newOperation === 0) return;
      stack[stack.length - 1] = suffixNumbers(lastOperation, newOperation);
    } else if (isNumber(lastOperation) && newOperation === '.') {
      // noop if the lastOperation is already a decimal
      // e.g. [12.34] --> [12.34] (no change)
      if (Math.round(lastOperation) !== lastOperation) return;
      // else convert it to a decimal value
      // e.g. [12] --> ['12.']
      // temporarily converts to a string to allow a trailing decimal point
      let suffixToAppend: string;
      // EDGE CASE: value being converted to decimal is -0
      if (Object.is(lastOperation, -0)) {
        suffixToAppend = suffix('-0', newOperation);
      } else {
        suffixToAppend = suffixDecimal(lastOperation, newOperation);
      }
      stack[stack.length - 1] = suffixToAppend;
    } else if (isString(lastOperation) && newOperation === '.') {
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
        let suffixToAppend: string | number;
        if (newOperation === 0) {
          suffixToAppend = suffix(lastOperation, newOperation);
        } else {
          // if it is non-zero, the decimal can be coerced to a number
          suffixToAppend = Number(suffix(lastOperation, newOperation));
        }
        stack[stack.length - 1] = suffixToAppend;
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

  const handleKeydown = (e: KeyboardEvent) => {
    const keyNum = Number(e.key);
    if (isNaN(keyNum)) {
      if (/[\/\*\-\+\=]/.test(e.key)) {
        activeKey = e.key;
        handleButtonClick(e.key);
      } else if (e.key === 'Enter') {
        activeKey = '=';
        handleButtonClick('=');
      } else if (e.key === 'Escape') {
        activeKey = 'clear';
        handleButtonClick('clear');
      }
    } else {
      activeKey = keyNum;
      handleButtonClick(keyNum);
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
  }
  .calculator-inner {
    border-radius: 1rem;
    border: 1px solid #222;
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
    <Display {displayValue} />
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
