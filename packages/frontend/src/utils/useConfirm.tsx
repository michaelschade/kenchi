import { ReactNode, useMemo, useState } from 'react';

import ConfirmDialog from '@kenchi/ui/lib/ConfirmDialog';

type ConfirmOpts = {
  textForConfirmButton: string;
  dangerous?: boolean;
};

const useConfirm = (): [
  (description: ReactNode, opts?: ConfirmOpts) => Promise<boolean>,
  React.FunctionComponent
] => {
  const [isOpen, setIsOpen] = useState(false);
  const [onCancel, setOnCancel] = useState(() => () => {});
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const [textForConfirmButton, setTextForConfirmButton] = useState('Confirm');
  const [dangerous, setDangerous] = useState(false);
  const [description, setDescription] = useState<ReactNode>('');

  const confirm = (description: ReactNode, opts?: ConfirmOpts) => {
    setDescription(description);
    if (opts?.textForConfirmButton) {
      setTextForConfirmButton(opts.textForConfirmButton);
    }
    if (opts?.dangerous) {
      setDangerous(opts.dangerous);
    }
    setIsOpen(true);

    const confirmOrCancel = new Promise<void>((resolve, reject) => {
      // the following tomfoolery is necessary to set a state value to a function.
      // see https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react
      setOnConfirm(() => resolve);
      setOnCancel(() => reject);
    });

    return confirmOrCancel.then(
      () => {
        setIsOpen(false);
        return true; // confirmed
      },
      () => {
        setIsOpen(false);
        return false; // cancelled
      }
    );
  };

  const MemoizedConfirmDialog = useMemo(
    () => () => {
      return (
        <ConfirmDialog
          description={description}
          isOpen={isOpen}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onOpenChange={(isOpen) => setIsOpen(isOpen)}
          textForConfirmButton={textForConfirmButton}
          dangerous={dangerous}
        />
      );
    },
    [description, isOpen, onConfirm, onCancel, textForConfirmButton, dangerous]
  );

  return [confirm, MemoizedConfirmDialog];
};

export default useConfirm;
