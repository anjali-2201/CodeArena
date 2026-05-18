/**
 * Database Seed Script
 * Run: node utils/seed.js
 * Seeds sample problems and test cases into MongoDB
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');

const problems = [
  {
    name: 'Two Sum',
    difficulty: 'Easy',
    statement: `Given an array of integers **nums** and an integer **target**, return the indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`,
    code: '',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    testCases: [
      { input: '4\n2 7 11 15\n9', output: '0 1' },
      { input: '3\n3 2 4\n6', output: '1 2' },
      { input: '2\n3 3\n6', output: '0 1' },
    ],
  },
  {
    name: 'Reverse String',
    difficulty: 'Easy',
    statement: `Write a function that reverses a string. The input string is given as an array of characters.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.\n\nRead a string from input and print the reversed string.`,
    code: '',
    examples: [
      {
        input: 'hello',
        output: 'olleh',
        explanation: 'The reversed string of "hello" is "olleh".',
      },
      {
        input: 'Hannah',
        output: 'hannaH',
        explanation: 'The reversed string of "Hannah" is "hannaH".',
      },
    ],
    constraints: [
      '1 <= s.length <= 10^5',
      's[i] is a printable ASCII character.',
    ],
    testCases: [
      { input: 'hello', output: 'olleh' },
      { input: 'Hannah', output: 'hannaH' },
      { input: 'abcdef', output: 'fedcba' },
    ],
  },
  {
    name: 'Palindrome Number',
    difficulty: 'Easy',
    statement: `Given an integer **x**, return **true** if x is a palindrome, and **false** otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.\n\nRead an integer from input and print "true" or "false".`,
    code: '',
    examples: [
      {
        input: '121',
        output: 'true',
        explanation: '121 reads as 121 from left to right and from right to left.',
      },
      {
        input: '-121',
        output: 'false',
        explanation: 'From left to right, it reads -121. From right to left it becomes 121-. Therefore it is not a palindrome.',
      },
    ],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    testCases: [
      { input: '121', output: 'true' },
      { input: '-121', output: 'false' },
      { input: '10', output: 'false' },
      { input: '12321', output: 'true' },
    ],
  },
  {
    name: 'FizzBuzz',
    difficulty: 'Easy',
    statement: `Given an integer **n**, return a string array answer (1-indexed) where:\n\n- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.\n- answer[i] == "Fizz" if i is divisible by 3.\n- answer[i] == "Buzz" if i is divisible by 5.\n- answer[i] == i (as a string) if none of the above conditions are true.\n\nRead n from input and print each answer on a new line.`,
    code: '',
    examples: [
      {
        input: '3',
        output: '1\n2\nFizz',
        explanation: 'For n=3: 1, 2, Fizz',
      },
      {
        input: '5',
        output: '1\n2\nFizz\n4\nBuzz',
        explanation: 'For n=5: 1, 2, Fizz, 4, Buzz',
      },
    ],
    constraints: ['1 <= n <= 10^4'],
    testCases: [
      { input: '3', output: '1\n2\nFizz' },
      { input: '5', output: '1\n2\nFizz\n4\nBuzz' },
      { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
  },
  {
    name: 'Maximum Subarray',
    difficulty: 'Medium',
    statement: `Given an integer array **nums**, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.\n\nRead n (size) on first line, then n space-separated integers on the second line. Print the maximum subarray sum.`,
    code: '',
    examples: [
      {
        input: '9\n-2 1 -3 4 -1 2 1 -5 4',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      {
        input: '1\n1',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6' },
      { input: '1\n1', output: '1' },
      { input: '5\n5 4 -1 7 8', output: '23' },
    ],
  },
  {
    name: 'Valid Parentheses',
    difficulty: 'Medium',
    statement: `Given a string **s** containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\nRead a string from input and print "true" or "false".`,
    code: '',
    examples: [
      {
        input: '()',
        output: 'true',
        explanation: 'Simple valid parentheses.',
      },
      {
        input: '()[]{}',
        output: 'true',
        explanation: 'All brackets are properly closed.',
      },
      {
        input: '(]',
        output: 'false',
        explanation: 'Mismatched brackets.',
      },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.',
    ],
    testCases: [
      { input: '()', output: 'true' },
      { input: '()[]{}', output: 'true' },
      { input: '(]', output: 'false' },
      { input: '([)]', output: 'false' },
      { input: '{[]}', output: 'true' },
    ],
  },
  {
    name: 'Merge Sorted Array',
    difficulty: 'Medium',
    statement: `You are given two integer arrays **nums1** and **nums2**, sorted in non-decreasing order, and two integers **m** and **n**, representing the number of elements in nums1 and nums2 respectively.\n\nMerge nums1 and nums2 into a single array sorted in non-decreasing order.\n\nInput format: First line has m and n. Second line has m integers (nums1). Third line has n integers (nums2).\nPrint the merged sorted array as space-separated integers.`,
    code: '',
    examples: [
      {
        input: '3 3\n1 2 3\n2 5 6',
        output: '1 2 2 3 5 6',
        explanation: 'Merging [1,2,3] and [2,5,6] gives [1,2,2,3,5,6].',
      },
    ],
    constraints: [
      '0 <= m, n <= 200',
      '1 <= m + n <= 200',
      '-10^9 <= nums1[i], nums2[j] <= 10^9',
    ],
    testCases: [
      { input: '3 3\n1 2 3\n2 5 6', output: '1 2 2 3 5 6' },
      { input: '1 0\n1', output: '1' },
      { input: '4 4\n1 3 5 7\n2 4 6 8', output: '1 2 3 4 5 6 7 8' },
    ],
  },
  {
    name: 'Longest Common Subsequence',
    difficulty: 'Hard',
    statement: `Given two strings **text1** and **text2**, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.\n\nRead two strings from input (one per line) and print the length of their LCS.`,
    code: '',
    examples: [
      {
        input: 'abcde\nace',
        output: '3',
        explanation: 'The longest common subsequence is "ace" and its length is 3.',
      },
      {
        input: 'abc\nabc',
        output: '3',
        explanation: 'The longest common subsequence is "abc" and its length is 3.',
      },
    ],
    constraints: [
      '1 <= text1.length, text2.length <= 1000',
      'text1 and text2 consist of only lowercase English characters.',
    ],
    testCases: [
      { input: 'abcde\nace', output: '3' },
      { input: 'abc\nabc', output: '3' },
      { input: 'abc\ndef', output: '0' },
    ],
  },
  {
    name: 'N-Queens',
    difficulty: 'Hard',
    statement: `The **n-queens** puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.\n\nGiven an integer **n**, return the number of distinct solutions to the n-queens puzzle.\n\nRead n from input and print the number of solutions.`,
    code: '',
    examples: [
      {
        input: '4',
        output: '2',
        explanation: 'There are two distinct solutions to the 4-queens puzzle.',
      },
      {
        input: '1',
        output: '1',
        explanation: 'There is one solution for a 1x1 board.',
      },
    ],
    constraints: ['1 <= n <= 9'],
    testCases: [
      { input: '1', output: '1' },
      { input: '4', output: '2' },
      { input: '8', output: '92' },
    ],
  },
  {
    name: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    statement: `Given two sorted arrays **nums1** and **nums2** of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).\n\nInput: First line has m and n. Second line has m integers. Third line has n integers.\nPrint the median with one decimal place.`,
    code: '',
    examples: [
      {
        input: '2 1\n1 3\n2',
        output: '2.0',
        explanation: 'merged array = [1,2,3] and median is 2.0',
      },
      {
        input: '2 2\n1 2\n3 4',
        output: '2.5',
        explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5',
      },
    ],
    constraints: [
      'nums1.length == m',
      'nums2.length == n',
      '0 <= m <= 1000',
      '0 <= n <= 1000',
      '1 <= m + n <= 2000',
      '-10^6 <= nums1[i], nums2[i] <= 10^6',
    ],
    testCases: [
      { input: '2 1\n1 3\n2', output: '2.0' },
      { input: '2 2\n1 2\n3 4', output: '2.5' },
    ],
  },
];

async function seed() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-judge';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await Problem.deleteMany({});
    await TestCase.deleteMany({});
    console.log('🗑️  Cleared existing problems and test cases');

    for (const prob of problems) {
      const { testCases, ...problemData } = prob;
      const createdProblem = await Problem.create(problemData);

      const testCaseDocs = testCases.map((tc) => ({
        input: tc.input,
        output: tc.output,
        problem: createdProblem._id,
      }));

      await TestCase.insertMany(testCaseDocs);
      console.log(`✅ Seeded: ${createdProblem.name} (${testCases.length} test cases)`);
    }

    console.log(`\n🎉 Seeding complete! ${problems.length} problems added.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

seed();
