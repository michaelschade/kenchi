import { css, useTheme } from '@emotion/react';
import { faSquare } from '@fortawesome/pro-regular-svg-icons';
import { faCheckSquare } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactSelect, {
  components as selectComponents,
  OptionProps,
} from 'react-select';
import tw from 'twin.macro';

export type MultiSelectOptionType = {
  id: string;
  name: string;
};

const MultiSelectOption = ({
  children,
  ...props
}: OptionProps<MultiSelectOptionType, true>) => (
  <selectComponents.Option {...props} isSelected={false}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {children}
      <span
        css={({ colors }) =>
          props.isSelected
            ? css`
                color: ${colors.accent[9]};
              `
            : tw`text-black text-opacity-30`
        }
      >
        <FontAwesomeIcon icon={props.isSelected ? faCheckSquare : faSquare} />
      </span>
    </div>
  </selectComponents.Option>
);

type Props = {
  'aria-label'?: string;
  selectedOptionIds: string[];
  onChange: (optionIds: string[]) => void;
  showTokens?: boolean;
  isPending?: boolean;
  autoFocus?: boolean;
  defaultMenuIsOpen?: boolean;
  id?: string;
  options: MultiSelectOptionType[];
  loading?: boolean;
};

const MultiSelect = ({
  'aria-label': ariaLabel,
  selectedOptionIds,
  onChange,
  showTokens = false,
  isPending = false,
  autoFocus,
  defaultMenuIsOpen,
  id,
  options,
  loading,
}: Props) => {
  const value = options.filter((option) =>
    selectedOptionIds.includes(option.id)
  );
  const { colors } = useTheme();
  return (
    <ReactSelect<MultiSelectOptionType, true>
      aria-label={ariaLabel}
      inputId={id}
      isMulti
      isClearable={false}
      controlShouldRenderValue={showTokens}
      hideSelectedOptions={false}
      isLoading={isPending || loading}
      isDisabled={isPending || loading}
      autoFocus={autoFocus}
      menuPlacement="auto"
      defaultMenuIsOpen={defaultMenuIsOpen}
      placeholder={
        value.length > 0
          ? value.map((option) => option.name).join(', ')
          : 'Choose…'
      }
      getOptionLabel={(option) => option.name}
      getOptionValue={(option) => option.id}
      components={{ Option: MultiSelectOption }}
      // This menuPortalTarget prop and pointerEvents: 'auto' constitute a bit
      // of a hack. We must portal the ReactSelect with menuPortalTarget in
      // order for the open menu to be able to extend beyond the bounds of the
      // Dailog. And we must set pointerEvents: 'auto' to allow interaction
      // with the open menu, since our Dialog uses Radix Dialog, which
      // prevents interaction outside of itself (as is the correct behavior of
      // a modal dialog). Since the menu content is portalled, it's outside of
      // the Dialog's DOM tree.
      // TODO(dave): remove that hack if/when we switch to Radix Select.
      menuPortalTarget={document.body}
      styles={{
        // Fix width and overflow issues when this is in a table cell
        // TODO: allow passing styles through props?
        container: () => ({
          position: 'relative',
          minWidth: '125px',
        }),
        control: (defaultStyles, state) => ({
          ...defaultStyles,
          boxShadow: 'none',
          '&:focus-within': {
            boxShadow: `0 0 0 0.2rem ${colors.accent[7]}`,
            borderColor: colors.accent[8],
          },
        }),
        menuPortal: (base) => ({
          ...base,
          pointerEvents: 'auto',
        }),
      }}
      options={options}
      value={value}
      onChange={(selectedOptionOrOptions) => {
        // Because react-select supports both single and multi-select, the type
        // signature of `onChange` is effectively: (value[] | value | null)
        // Therefore we need to do this weird dance to make sure we always have
        // an array of values.
        // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/32553
        let optionIds: string[] = [];
        if (selectedOptionOrOptions) {
          optionIds = selectedOptionOrOptions.map((option) => option.id);
        }
        onChange(optionIds);
      }}
    />
  );
};

export default MultiSelect;
