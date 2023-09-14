import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render } from '../testUtils';
import { Select } from './Select';

it('has the first option selected by default', async () => {
  const options = [
    {
      label: 'One',
      value: 'one',
    },
    {
      label: 'Two',
      value: 'two',
    },
  ];
  const { getByRole } = render(
    <Select options={options} onSelect={() => {}} />
  );
  expect(getByRole('combobox')).toHaveTextContent('One');
});

it('selects the option with the value from the value prop', async () => {
  const options = [
    {
      label: 'One',
      value: 'one',
    },
    {
      label: 'Two',
      value: 'two',
    },
  ];
  const { getByRole } = render(
    <Select options={options} value="two" onSelect={() => {}} />
  );
  expect(getByRole('combobox')).toHaveTextContent('Two');
});

it('changes the selected option on select', async () => {
  const options = [
    {
      label: 'One',
      value: 'one',
    },
    {
      label: 'Two',
      value: 'two',
    },
  ];
  let selectedValue = 'one';
  const onSelect = (value: string) => {
    selectedValue = value;
  };
  const { findByRole, findAllByRole } = render(
    <Select options={options} onSelect={onSelect} value={selectedValue} />
  );
  const selectTrigger = await findByRole('combobox');

  // We use keyboard interactions here instead of clicking because Radix
  // Select's click handling implementation cannot be easily tested. It depends
  // on some APIs (like releasePointerCapture) that are not implemented in
  // JSDOM.
  selectTrigger.focus();
  userEvent.keyboard('{Enter}');
  const optionElems = await findAllByRole('option');
  userEvent.keyboard('{ArrowDown}');

  // We need to wait for focus to move to the next option before pressing Enter because Radix
  // changes the focused option in a setTimeout.
  // See https://github.com/radix-ui/primitives/blob/4ee9d362fcd5e32edbce9f43f1d41f1bf1a015c1/packages/react/select/src/Select.tsx#L677-L681,
  const optionTwoElem = optionElems[1];
  await waitFor(() => expect(document.activeElement).toBe(optionTwoElem));
  userEvent.keyboard('{Enter}');
  expect(selectedValue).toBe('two');
});
