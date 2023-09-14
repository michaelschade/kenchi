import mockMessageRouter from '../../../__mocks__/@michaelschade/kenchi-message-router';
import {
  clearMockMessageRouter,
  expectSentCommand,
  sendCommand,
} from '../../../test/helpers/messageRouter';
import FrontExtractor from './front';

const sendRecordsUpdated = (records: any[]) =>
  sendCommand('pageScript', 'frontCommand', {
    type: 'data:recordsUpdated',
    records,
  });

beforeEach(() => clearMockMessageRouter());
it('injects the front script on init', () => {
  const frontExtractor = new FrontExtractor();
  frontExtractor.initialize(mockMessageRouter);
  expectSentCommand({
    destination: 'contentScript',
    command: 'injectScript',
    args: { name: 'front' },
  });
});

describe('Updating data', () => {
  it('pushes author data to listeners', () => {
    let variables = {};
    const frontExtractor = new FrontExtractor();
    frontExtractor.initialize(mockMessageRouter);
    frontExtractor.addListener((data) => (variables = data));

    sendRecordsUpdated([
      {
        type: 'teammate',
        data: {
          email: 'itchy@example.com',
          givenName: 'Itchy',
          familyName: 'The Mouse',
        },
      },
    ]);

    expect(variables).toEqual(
      expect.objectContaining({
        authorEmail: 'itchy@example.com',
        authorDomain: 'example.com',
        authorName: 'Itchy The Mouse',
        authorFirstName: 'Itchy',
      })
    );
  });

  it('pushes recipient data to listeners', () => {
    let variables = {};
    const frontExtractor = new FrontExtractor();
    frontExtractor.initialize(mockMessageRouter);
    frontExtractor.addListener((data) => (variables = data));

    sendRecordsUpdated([
      {
        type: 'conversation',
        data: {
          recipient: {
            handle: 'scratchy@example.com',
            name: 'Scratchy The Cat',
          },
        },
      },
    ]);

    expect(variables).toEqual(
      expect.objectContaining({
        recipientEmail: 'scratchy@example.com',
        recipientDomain: 'example.com',
        recipientName: 'Scratchy The Cat',
        recipientFirstName: 'Scratchy',
      })
    );
  });
});

describe('Invalid data', () => {
  let variables: Object;
  beforeEach(() => {
    variables = {};
    const frontExtractor = new FrontExtractor();
    frontExtractor.initialize(mockMessageRouter);
    frontExtractor.addListener((data) => (variables = data));
  });

  it('is resilient to unexpected author data', () => {
    sendRecordsUpdated([
      {
        type: 'teammate',
        data: {
          email: 'itchy@example.com',
          givenName: 'Itchy',
          familyName: 'The Mouse',
        },
      },
    ]);

    sendRecordsUpdated([
      {
        type: 'teammate',
        data: {},
      },
    ]);

    expect(variables).toEqual(
      expect.objectContaining({
        authorEmail: 'itchy@example.com',
        authorDomain: 'example.com',
        authorName: 'Itchy The Mouse',
        authorFirstName: 'Itchy',
      })
    );
  });

  it('is resilient to unexpected recipient data', () => {
    sendRecordsUpdated([
      {
        type: 'conversation',
        data: {
          recipient: {
            handle: 'scratchy@example.com',
            name: 'Scratchy The Cat',
          },
        },
      },
    ]);

    sendRecordsUpdated([
      {
        type: 'conversation',
        data: {},
      },
    ]);

    sendRecordsUpdated([
      {
        type: 'conversation',
        data: {
          recipient: {},
        },
      },
    ]);

    expect(variables).toEqual(
      expect.objectContaining({
        recipientEmail: 'scratchy@example.com',
        recipientDomain: 'example.com',
        recipientName: 'Scratchy The Cat',
        recipientFirstName: 'Scratchy',
      })
    );
  });

  it('is resilient to unexpected message formats', () => {
    sendRecordsUpdated([
      {
        type: 'teammate',
        data: {
          email: 'itchy@example.com',
          givenName: 'Itchy',
          familyName: 'The Mouse',
        },
      },
      {
        type: 'conversation',
        data: {
          recipient: {
            handle: 'scratchy@example.com',
            name: 'Scratchy The Cat',
          },
        },
      },
    ]);

    sendCommand('pageScript', 'frontCommand', {
      type: 'data:unexpectedCommand',
      records: [
        {
          type: 'conversation',
          data: {
            recipient: {
              handle: 'scratchy@example.com',
              name: 'Scratchy The Cat',
            },
          },
        },
      ],
    });

    sendRecordsUpdated([
      {
        type: 'invalid-data-type',
        data: {
          email: 'itchy@example.com',
          givenName: 'Itchy',
          familyName: 'The Mouse',
        },
      },
    ]);

    expect(variables).toEqual({
      authorEmail: 'itchy@example.com',
      authorDomain: 'example.com',
      authorName: 'Itchy The Mouse',
      authorFirstName: 'Itchy',
      recipientEmail: 'scratchy@example.com',
      recipientDomain: 'example.com',
      recipientName: 'Scratchy The Cat',
      recipientFirstName: 'Scratchy',
    });
  });
});
