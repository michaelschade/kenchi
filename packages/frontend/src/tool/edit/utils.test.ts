import { SlateNode } from '@kenchi/slate-tools/lib/types';
import {
  deserialize as deserializeSlate,
  serializeSlate,
} from '@kenchi/slate-tools/lib/utils';

const singleLineInput: SlateNode[] = [
  {
    children: [
      { text: 'ABC' },
      {
        type: 'variable',
        source: 'input',
        id: 'DEF',
        placeholder: 'DEF',
        children: [{ text: '' }],
      },
      { text: 'GHI' },
    ],
  },
];

const singleLineOutput = {
  slate: true,
  rich: false,
  singleLine: true,
  children: [
    { text: 'ABC' },
    {
      type: 'variable',
      source: 'input',
      id: 'DEF',
      placeholder: 'DEF',
      children: [{ text: '' }],
    },
    { text: 'GHI' },
  ],
};

it('serializes single line', () => {
  expect(serializeSlate(singleLineInput, { singleLine: true })).toMatchObject(
    singleLineOutput
  );
});

it('deserializes single line', () => {
  expect(deserializeSlate(singleLineOutput)).toMatchObject(singleLineInput);
});

const multiLineInput: SlateNode[] = [
  {
    children: [
      { text: 'ABC' },
      {
        type: 'variable',
        placeholder: '',
        source: 'input',
        id: 'DEF',
        children: [{ text: '' }],
      },
      { text: 'GHI' },
    ],
  },
  {
    children: [
      { children: [{ text: 'JKL' }] },
      {
        type: 'variable',
        placeholder: '',
        source: 'input',
        id: 'MNO',
        children: [{ text: '' }],
      },
      { text: 'PQR' },
    ],
  },
];

const multiLineOutput: any = {
  slate: true,
  rich: false,
  singleLine: false,
  children: [
    {
      children: [
        { text: 'ABC' },
        {
          type: 'variable',
          placeholder: '',
          source: 'input',
          id: 'DEF',
          children: [{ text: '' }],
        },
        { text: 'GHI' },
      ],
    },
    {
      children: [
        { children: [{ text: 'JKL' }] },
        {
          type: 'variable',
          placeholder: '',
          source: 'input',
          id: 'MNO',
          children: [{ text: '' }],
        },
        { text: 'PQR' },
      ],
    },
  ],
};

it('serializes multi line', () => {
  expect(serializeSlate(multiLineInput, {})).toMatchObject(multiLineOutput);
});

it('deserializes multi line', () => {
  expect(deserializeSlate(multiLineOutput)).toMatchObject(multiLineInput);
});
