import { css } from '@emotion/react';
import {
  faChevronDown,
  faClock,
  faFile,
  faInbox,
  faPaperPlane,
  faStar,
  faTimes,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import tw from 'twin.macro';

import {
  CONVO_EMAIL,
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
  grid-template-rows: minmax(0, min-content) minmax(0, auto);
  grid-template-columns: minmax(0, min-content) minmax(0, auto);

  .logo {
    grid-row: 1 / span 1;
    grid-column: 1 / span 1;
  }
  .topbar {
    grid-row: 1 / span 1;
    grid-column: 2 / span 1;
  }
  .sidebar {
    grid-row: 2 / span 1;
    grid-column: 1 / span 1;
  }
  .inbox {
    grid-row: 2 / span 1;
    grid-column: 2 / span 1;
  }

  /* Style it */

  .logo,
  .topbar {
    ${tw`border-0 border-solid border-gray-100 border-b-2`}
  }

  .logo {
    ${tw`flex items-center justify-center p-3`}
  }

  .logo,
  .sidebar {
    ${tw`pr-4`}
  }

  .topbar {
    ${tw`flex items-center justify-between py-2 pr-2`}

    .search {
      ${tw`box-border bg-gray-100 rounded-lg px-5 py-3 w-2/3`}
    }

    .avatar {
      ${tw`rounded-full w-12 h-12 bg-gray-100`}
    }
  }

  .sidebar {
    ${tw`w-60`}

    button.compose {
      ${tw`flex items-center bg-white rounded-full shadow py-2 pl-4 pr-6 mx-2 my-4 border-0 text-sm font-medium text-gray-700 ring-1 ring-inset ring-black ring-opacity-10`}

      img {
        ${tw`mr-3`}
      }
    }

    nav a {
      ${tw`block px-4 py-1 rounded-r-full text-black text-sm leading-6`}
      .icon {
        ${tw`inline-block w-12 text-center text-gray-500`}
      }

      &:hover {
        ${tw`no-underline`}
      }
      &:hover:not(:nth-child(1)) {
        cursor: default;
      }

      &:nth-child(1) {
        ${tw`bg-red-100 text-red-600 font-semibold`}
        .icon {
          ${tw`text-current`}
        }
      }
    }
  }

  .inbox {
    ${tw`pr-8`}

    .subject {
      ${tw`flex items-center gap-2`}
      h1 {
        ${tw`text-2xl py-4 pl-20 font-normal`}
      }
      .tag {
        ${tw`hidden text-xs bg-gray-200 text-gray-500 rounded font-medium px-1 py-0.5`}
      }
    }

    .entry,
    .reply {
      ${tw`flex py-5`}
    }
    .entry:not(:last-of-type) {
        ${tw`border-0 border-solid border-gray-200 border-b`}
      }
    }
    .avatar {
      ${tw`flex-shrink-0 w-12 h-12 mx-4 rounded-full bg-gray-100`}
    }
    .message {
      ${tw`flex-grow`}

      .header {
        ${tw`pb-4`}

        .from,
        .to {
          ${tw`text-xs text-gray-700`}
          strong {
            ${tw`text-sm text-black`}
          }
        }
      }
      .body {
        ${tw`text-sm max-w-prose`}
      }
    }

    .reply {
      .message {
        ${tw`p-4 rounded-lg ring-1 ring-inset ring-black ring-opacity-10 transition space-y-4`}

        &:focus-within {
          ${tw`shadow-lg`}
        }
        [contenteditable] {
          min-height: 4rem;
          ${tw`outline-none`}
        }
        button[type="submit"] {
          all: unset;
          ${tw`box-border`}

          ${tw`rounded bg-blue-600 text-white px-6 py-2 font-medium`}
        }
      }
    }
  }
`;

export const GmailWireframe = () => (
  <div css={style}>
    <div className="logo">
      <img
        src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_2x_r2.png"
        alt="Gmail logo"
        style={{ width: '109px', height: '40px' }}
      />
    </div>
    <div className="topbar">
      <div className="search">
        <PlaceholderText>Search mail</PlaceholderText>
      </div>
      <div className="avatar" />
    </div>
    <div className="sidebar">
      <button type="button" className="compose" disabled>
        <img
          src="https://www.gstatic.com/images/icons/material/colored_icons/2x/create_32dp.png"
          alt="Compose icon"
          style={{ width: '32px', height: '32px' }}
        />
        <PlaceholderText>Compose</PlaceholderText>
      </button>
      <nav>
        <a href="#inbox">
          <span className="icon">
            <FontAwesomeIcon fixedWidth icon={faInbox} />
          </span>
          <PlaceholderText>Inbox</PlaceholderText>
        </a>
        <a href="#starred">
          <span className="icon">
            <FontAwesomeIcon fixedWidth icon={faStar} />
          </span>
          <PlaceholderText>Starred</PlaceholderText>
        </a>
        <a href="#snoozed">
          <span className="icon">
            <FontAwesomeIcon fixedWidth icon={faClock} />
          </span>
          <PlaceholderText>Snoozed</PlaceholderText>
        </a>
        <a href="#sent">
          <span className="icon">
            <FontAwesomeIcon fixedWidth icon={faPaperPlane} />
          </span>
          <PlaceholderText>Sent</PlaceholderText>
        </a>
        <a href="#drafts">
          <span className="icon">
            <FontAwesomeIcon fixedWidth icon={faFile} />
          </span>
          <PlaceholderText>Drafts</PlaceholderText>
        </a>
        <a href="#more">
          <span className="icon">
            <FontAwesomeIcon fixedWidth icon={faChevronDown} size="xs" />
          </span>
          <PlaceholderText>More</PlaceholderText>
        </a>
      </nav>
    </div>
    <div className="inbox">
      <div className="subject">
        <h1>{CONVO_SUBJECT}</h1>
        <span className="tag" id="message-tag">
          {CONVO_TAG} <FontAwesomeIcon fixedWidth icon={faTimes} size="sm" />
        </span>
      </div>
      <div className="thread">
        <div className="entry">
          <div className="avatar"></div>
          <div className="message">
            <div className="header">
              <div className="from">
                <strong>{CONVO_NAME_FULL}</strong> &lt;{CONVO_EMAIL}&gt;
              </div>
              <div className="to">to me</div>
            </div>
            <div className="body">{CONVO_MESSAGE}</div>
          </div>
        </div>

        <div className="reply">
          <div className="avatar"></div>
          <div className="message message-outline">
            <div className="message-text" contentEditable></div>
            <button type="submit">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
