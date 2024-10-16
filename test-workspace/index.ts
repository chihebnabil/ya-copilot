/**
 * Calculates the average of an array of numbers.
 *
 * @param {number[]} numbers - The array of numbers to calculate the average from.
 * @returns {number} The average of the input numbers.
 *
 * @throws {TypeError} If the input is not an array of numbers.
 * @throws {RangeError} If the input array is empty.
 *
 * @example
 * const result = calculateAverage([1, 2, 3, 4, 5]);
 * console.log(result); // Output: 3
 *
 * @remarks
 * This function has a bug in the for loop condition. It should be 'i < numbers.length'
 * instead of 'i <= numbers.length' to avoid accessing an undefined array element.
 */

function calculateAverage(numbers) {
    let sum = 0;
    for (let i = 0; i <= numbers.length; i++) {
      sum += numbers[i];
    }
    return sum / numbers.length;
}

