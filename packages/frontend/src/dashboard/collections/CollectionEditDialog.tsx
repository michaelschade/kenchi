import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@kenchi/ui/lib/Dialog';
import { useMeta } from '@kenchi/ui/lib/useMeta';

import EditCollection from '../../collection/EditCollection';

type Props = {
  id: string;
  title: string;
  onBack: () => void;
};

export const CollectionEditDialog = ({ id, title, onBack }: Props) => {
  useMeta({ title });
  return (
    <>
      <DialogHeader>
        <h2>{title}</h2>
      </DialogHeader>
      <EditCollection
        id={id}
        onBack={onBack}
        onUpdate={onBack}
        inputFieldsWrapper={DialogContent}
        buttonWrapper={DialogFooter}
      />
    </>
  );
};
