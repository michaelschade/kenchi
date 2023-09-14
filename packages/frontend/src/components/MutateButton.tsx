import { faCheckCircle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { errorFromMutation, ModifyResult } from '../graphql/errorFromMutation';

type Props = React.ComponentPropsWithoutRef<typeof PrimaryButton> & {
  result: ModifyResult;
  Component?: typeof PrimaryButton;
};

export const MutateButton = ({
  children,
  result,
  Component = PrimaryButton,
  ...props
}: Props) => {
  const loading = result.loading;
  const success = !loading && result.data && !errorFromMutation(result);
  return (
    <Component disabled={result.loading || props.disabled} {...props}>
      {children}
      {result.loading && (
        <>
          {' '}
          <LoadingSpinner />
        </>
      )}
      {success && (
        <>
          {' '}
          <FontAwesomeIcon icon={faCheckCircle} />
        </>
      )}
    </Component>
  );
};
