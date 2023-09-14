import styled from '@emotion/styled';

import { CustomModal } from '../components/Modals';
import EditCollection, { EditCollectionProps } from './EditCollection';

const ButtonsWrapper = styled.div`
  padding-top: 1rem;
`;

export default function EditCollectionModal(
  props: EditCollectionProps & { isOpen: boolean }
) {
  const { isOpen, ...rest } = props;
  return (
    <CustomModal isOpen={isOpen} onBack={props.onBack} title="Edit Collection">
      <EditCollection {...rest} buttonWrapper={ButtonsWrapper} />
    </CustomModal>
  );
}
