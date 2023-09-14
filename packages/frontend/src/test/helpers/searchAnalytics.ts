import insightsMock from '../../__mocks__/search-insights';
import { SearchEventName } from '../../search/analytics';

export const expectSearchEvent = ({
  eventName,
  objectID,
  position,
}: {
  eventName: SearchEventName;
  objectID: string;
  position: number;
}) => {
  expect(insightsMock).toBeCalledWith(
    'clickedObjectIDsAfterSearch',
    expect.objectContaining({
      eventName,
      objectIDs: [objectID],
      positions: [position],
    })
  );
};

export const expectNoSearchEvents = () =>
  expect(insightsMock).not.toBeCalledWith(
    'clickedObjectIDsAfterSearch',
    expect.anything()
  );
