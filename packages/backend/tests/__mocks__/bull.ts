// jest automatically mocks modules that reside in the corresponding location with the __mocks__ folder
// https://jestjs.io/docs/manual-mocks#mocking-node-modules
// This mocks the Bull queue and exposes the queue and a helper to clear the queue

export const mockQueue: Array<any> = [];
export const clearMockQueue = () => {
  mockQueue.splice(0, mockQueue.length);
};

class MockBullQueue<TJobType> {
  add(job: TJobType) {
    mockQueue.unshift(job);
    return Promise.resolve(job);
  }
}

export default MockBullQueue;
