import { css } from '@emotion/react';
import {
  faAlignLeft,
  faAt,
  faBell,
  faBookOpen,
  faChartBar,
  faPaperPlane,
  faTimesCircle,
  faUserCircle,
  faUsers,
  faWalkieTalkie,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faInbox,
  faUserCircle as faSolidUserCircle,
  faUsers as faSolidUsers,
  faWalkieTalkie as faSolidWalkieTalkie,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import {
  CONVO_MESSAGE,
  CONVO_NAME_FULL,
  CONVO_SUBJECT,
  CONVO_TAG,
} from './constants';
import { PlaceholderText } from './PlaceholderText';

const style = css`
  ${tw`w-full h-full bg-white`}

  /* Lay out the page */

  display: grid;
  grid-template-columns:
    minmax(0, min-content) minmax(0, min-content) minmax(0, min-content)
    minmax(0, auto) minmax(0, min-content);

  .nav {
    ${tw`bg-gray-200 bg-opacity-80 flex flex-col justify-between`}

    .top {
      ${tw`text-gray-800`}
      .icon {
        ${tw`px-2 py-5`}
      }
    }
    .bottom {
      ${tw`text-gray-500`}
      .icon {
        ${tw`px-2 py-2`}
      }
    }

    .icon {
      ${tw`flex text-xl items-center justify-center`}
      &.logo {
        ${tw`text-4xl py-4`}
      }
      &.active {
        ${tw`text-indigo-600 bg-gray-100`}
      }
      &.avatar {
        ${tw`text-3xl text-gray-300`}
      }
    }
  }

  .inbox {
    ${tw`bg-gray-100 px-6 py-4 w-56`}
    h1 {
      ${tw`text-2xl font-bold mb-5`}
    }
    .section {
      ${tw`text-sm py-2`}
      h2 {
        ${tw`text-sm`}
      }

      ul {
        ${tw`m-0 p-0 py-2`}
      }
      li {
        ${tw`list-none m-0 py-1.5`}
        svg {
          ${tw`mr-2`}
        }
        &.active {
          ${tw`text-indigo-600 font-semibold`}
        }
      }
    }
  }

  .conversations {
    ${tw`w-64 shadow-2xl border-0 border-solid border-l border-gray-300`}

    h1 {
      ${tw`p-5 text-2xl font-bold mb-5`}
      svg {
        ${tw`text-lg mr-3`}
      }
    }

    .entry {
      ${tw`bg-indigo-100 p-4 border-0 border-solid border-l-2 border-indigo-600`}
      .from {
        ${tw`text-sm font-bold text-indigo-600 flex items-center mb-4`}
        svg {
          ${tw`text-2xl mr-3 text-gray-400`}
        }
      }
      .subject {
        ${tw`text-sm truncate font-semibold`}
      }
      .summary {
        ${tw`text-sm truncate`}

        br,
        br:after {
          content: ' ';
        }
      }
    }
  }

  .conversation {
    ${tw`bg-white border-0 border-solid border-l border-r border-gray-300 flex flex-col`}

    background-image: url(https://static.intercomassets.com/ember/assets/images/messenger-backgrounds/background-1-99a36524645be823aabcd0e673cb47f8.png);

    .header {
      ${tw`flex-shrink-0 bg-white border-0 border-solid border-b border-gray-200 p-4 text-sm text-gray-500`}
      h1 {
        ${tw`text-gray-900`}
      }
    }
    .messages {
      ${tw`flex-grow`}

      .message {
        ${tw`flex p-4`}

        & > svg {
          ${tw`text-3xl text-gray-300 mr-3 bg-white rounded-full`}
        }

        .card {
          ${tw`flex-grow bg-gray-200 rounded-md text-sm px-4 py-3`}

          #message-tag {
            ${tw`hidden`}
          }

          .tag {
            ${tw`mt-3 inline-block bg-white rounded border border-solid border-gray-300 px-2.5 py-0.5 text-gray-500 font-medium`}
            span {
              ${tw`underline mr-1`}
            }
            svg {
              ${tw`cursor-pointer`}
            }
          }
        }
      }
    }
    .reply {
      ${tw`flex-shrink-0 flex flex-col bg-white m-4 rounded-md border border-solid border-gray-300 shadow-md p-2`}

      [contenteditable] {
        min-height: 4em;
        ${tw`outline-none m-2`}
      }
      button[type='submit'] {
        ${tw`self-end bg-indigo-600 border-0 text-white font-bold px-3 py-1.5 rounded-md text-sm`}
      }
    }
  }

  .conversation-details {
    ${tw`w-64 bg-gray-100 p-2 space-y-2`}

    h1 {
      ${tw`px-3 pt-1 pb-10 text-base mb-4 border-0 border-solid border-b border-gray-300 -mx-2`}
    }

    .card {
      ${tw`bg-white rounded-md border border-solid border-gray-200 px-3 py-4 text-sm text-gray-500`}
      h4 {
        ${tw`mb-4 text-gray-900`}
      }
    }
  }
`;

export const IntercomWireframe = () => {
  return (
    <div css={style}>
      <div className="nav">
        <div className="top">
          <div className="icon logo">
            <FontAwesomeIcon fixedWidth icon={faSolidWalkieTalkie} />
          </div>
          <div className="icon active">
            <FontAwesomeIcon fixedWidth icon={faInbox} />
          </div>
          <div className="icon">
            <FontAwesomeIcon fixedWidth icon={faPaperPlane} />
          </div>
          <div className="icon">
            <FontAwesomeIcon fixedWidth icon={faUsers} />
          </div>
          <div className="icon">
            <FontAwesomeIcon fixedWidth icon={faBookOpen} />
          </div>
          <div className="icon">
            <FontAwesomeIcon fixedWidth icon={faWalkieTalkie} />
          </div>
          <div className="icon">
            <FontAwesomeIcon fixedWidth icon={faChartBar} />
          </div>
        </div>
        <div className="bottom">
          <div className="icon">
            <FontAwesomeIcon fixedWidth icon={faBell} />
          </div>
          <div className="icon avatar">
            <FontAwesomeIcon fixedWidth icon={faSolidUserCircle} />
          </div>
        </div>
      </div>
      <div className="inbox">
        <h1>
          <PlaceholderText>Inbox</PlaceholderText>
        </h1>
        <div className="section">
          <h2>
            <PlaceholderText>Conversations</PlaceholderText>
          </h2>
          <ul>
            <li>
              <FontAwesomeIcon fixedWidth icon={faSolidUserCircle} />
              <PlaceholderText>You</PlaceholderText>
            </li>
            <li>
              <FontAwesomeIcon fixedWidth icon={faAt} />
              <PlaceholderText>Mentions</PlaceholderText>
            </li>
            <li>
              <FontAwesomeIcon fixedWidth icon={faUserCircle} />
              <PlaceholderText>Unassigned</PlaceholderText>
            </li>
            <li className="active">
              <FontAwesomeIcon fixedWidth icon={faSolidUsers} />
              <PlaceholderText>All</PlaceholderText>
            </li>
          </ul>
        </div>
        <div className="section">
          <h2>
            <PlaceholderText>Snippet</PlaceholderText>
          </h2>
        </div>
        <div className="section">
          <h2>
            <PlaceholderText>Your preferences</PlaceholderText>
          </h2>
        </div>
      </div>
      <div className="conversations">
        <h1>
          <FontAwesomeIcon fixedWidth icon={faAlignLeft} />
          <PlaceholderText>All</PlaceholderText>
        </h1>
        <div className="entries">
          <div className="entry">
            <div className="from">
              <FontAwesomeIcon icon={faSolidUserCircle} />
              {CONVO_NAME_FULL}
            </div>
            <div className="subject">{CONVO_SUBJECT}</div>
            <div className="summary">{CONVO_MESSAGE}</div>
          </div>
        </div>
      </div>

      <div className="conversation">
        <div className="header">
          <h1>{CONVO_NAME_FULL}</h1>
          <p>{CONVO_SUBJECT}</p>
        </div>
        <div className="messages">
          <div className="message">
            <FontAwesomeIcon icon={faSolidUserCircle} />
            <div className="card">
              {CONVO_MESSAGE}
              <div className="tags">
                <div id="message-tag" className="tag">
                  <span>{CONVO_TAG}</span>
                  <FontAwesomeIcon
                    onClick={() => {
                      const tag = document.getElementById('message-tag');
                      if (tag) {
                        tag.style.display = 'none';
                      }
                    }}
                    icon={faTimesCircle}
                    size="xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="reply message-outline">
          <div className="message-text" contentEditable></div>
          <button type="submit">Send</button>
        </div>
      </div>

      <div className="conversation-details">
        <h1>
          <PlaceholderText>Conversation details</PlaceholderText>
        </h1>
        <div className="card">
          <h4>
            <PlaceholderText>Latest conversations</PlaceholderText>
          </h4>
          <PlaceholderText>No conversations</PlaceholderText>
        </div>
        <div className="card">
          <h4>
            <PlaceholderText>Notes</PlaceholderText>
          </h4>
          <PlaceholderText>No notes</PlaceholderText>
        </div>
        <div className="card">
          <h4>
            <PlaceholderText>Tags</PlaceholderText>
          </h4>
          <PlaceholderText>No tags</PlaceholderText>
        </div>
        <div className="card">
          <h4>
            <PlaceholderText>Similar conversations</PlaceholderText>
          </h4>
          <PlaceholderText>No conversations</PlaceholderText>
        </div>
      </div>
    </div>
  );
};
