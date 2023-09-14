import React, { useState } from 'react';

import CreatableSelect from 'react-select/creatable';

import { FormGroup } from '@kenchi/ui/lib/Form';
import { Stack } from '@kenchi/ui/lib/Stack';

import { ActionableItem } from '../../components/ActionableItem';
import { EMAIL_REGEX } from '../../utils';

type Props = {
  emails: string[];
  setEmails: (emails: string[] | ((emails: string[]) => string[])) => void;
  label?: string;
  autoFocus?: boolean;
};

type OptionType = { value: string; label: string };

export default function EmailListFormGroup({
  emails,
  setEmails,
  label,
  autoFocus = false,
}: Props) {
  const [inputValue, setInputValue] = useState(''); // What the user is typing before it's entered

  const addEmail = (email: string) => {
    if (!EMAIL_REGEX.test(inputValue)) {
      return false;
    }

    if (emails.includes(email)) {
      return false;
    }

    setEmails((e: string[]) => [...e, email]);
    return true;
  };

  return (
    <>
      <FormGroup label={label}>
        {(id) => (
          <CreatableSelect<OptionType, true>
            components={{
              DropdownIndicator: null,
            }}
            isMulti
            inputId={id}
            isOptionDisabled={(v) =>
              !EMAIL_REGEX.test(v.value) || emails.includes(v.value)
            }
            isClearable={false}
            noOptionsMessage={(v) => null}
            value={[]}
            inputValue={inputValue}
            onInputChange={(value) => setInputValue(value)}
            formatCreateLabel={(v) => v}
            onChange={(vals, action) => {
              if (!vals && action.action === 'remove-value') {
                // Should never happen
              } else {
                addEmail(vals[0].value);
              }
            }}
            onBlur={() => {
              if (addEmail(inputValue)) {
                setInputValue('');
              }
            }}
            placeholder="Enter email address"
            autoFocus={autoFocus}
          />
        )}
      </FormGroup>
      {emails.length > 0 && (
        <FormGroup>
          <Stack>
            {emails.map((email) => (
              <ActionableItem
                key={email}
                label={email}
                onRemove={() => {
                  setEmails((emails) => emails.filter((e) => e !== email));
                }}
              />
            ))}
          </Stack>
        </FormGroup>
      )}
    </>
  );
}
