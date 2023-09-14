import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@kenchi/ui/lib/Dialog';
import { useMeta } from '@kenchi/ui/lib/useMeta';

import CreateCollection, {
  CreateCollectionProps,
} from '../../collection/CreateCollection';

type Props = {
  title: string;
};

const NewCollectionDialog = (props: Props & CreateCollectionProps) => {
  const { title, onBack, onCreate } = props;
  useMeta({ title });
  return (
    <>
      <DialogHeader>
        <h2>{title}</h2>
      </DialogHeader>
      <CreateCollection
        onCreate={onCreate}
        onBack={onBack}
        inputFieldsWrapper={DialogContent}
        buttonWrapper={DialogFooter}
      />
    </>
  );
};
export default NewCollectionDialog;
