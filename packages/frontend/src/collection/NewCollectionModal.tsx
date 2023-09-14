import { CustomModal } from '../components/Modals';
import CreateCollection, { CreateCollectionProps } from './CreateCollection';

export default function NewCollectionModal(
  props: CreateCollectionProps & { isOpen: boolean }
) {
  const { isOpen, ...rest } = props;
  return (
    <CustomModal isOpen={isOpen} onBack={props.onBack} title="New Collection">
      <CreateCollection {...rest} />
    </CustomModal>
  );
}
