export type SearchEventName = 'click';
export type TrackSearchEvent = (
  eventName: SearchEventName,
  objectID: string,
  position: number
) => void;
