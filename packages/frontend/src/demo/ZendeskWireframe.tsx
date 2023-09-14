import { css } from '@emotion/react';
import {
  faBorderAll,
  faChevronDown,
  faEnvelope,
  faPaperclip,
  faPlus,
  faSearch,
  faText,
  faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faChartBar,
  faCog,
  faColumns,
  faEnvelope as faSolidEnvelope,
  faHomeAlt,
  faInbox,
  faShapes,
  faUser,
  faUserCircle as faSolidUserCircle,
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

export const ZendeskWireframe = () => (
  <div css={tw`w-full h-full bg-white flex`}>
    <div css={tw`bg-black flex`}>
      <div
        css={tw`bg-cyan-900 bg-opacity-70 flex flex-col justify-between text-xl text-white text-opacity-50`}
      >
        <div>
          <div css={tw`px-4 py-3 text-lime-600`}>
            <FontAwesomeIcon fixedWidth icon={faShapes} />
          </div>
          <div css={tw`px-4 py-3`}>
            <FontAwesomeIcon fixedWidth icon={faHomeAlt} />
          </div>
          <div css={tw`px-4 py-3`}>
            <FontAwesomeIcon fixedWidth icon={faInbox} />
          </div>
          <div css={tw`px-4 py-3`}>
            <FontAwesomeIcon fixedWidth icon={faChartBar} />
          </div>
          <div css={tw`px-4 py-3`}>
            <FontAwesomeIcon fixedWidth icon={faCog} />
          </div>
        </div>
        <div>
          <div css={tw`px-4 py-3 text-white text-opacity-30`}>
            <FontAwesomeIcon fixedWidth icon={faShapes} />
          </div>
        </div>
      </div>
    </div>

    <div css={tw`flex flex-col w-full`}>
      <div css={tw`flex text-xs font-medium`}>
        <div css={tw`bg-gray-50 px-4 py-3 flex gap-4 items-center`}>
          <FontAwesomeIcon fixedWidth icon={faEnvelope} size="lg" />
          <div css={tw`flex flex-col`}>
            <span css={tw`font-bold`}>
              <PlaceholderText>{CONVO_SUBJECT}</PlaceholderText>
            </span>
            <PlaceholderText>#15</PlaceholderText>
          </div>
          <FontAwesomeIcon fixedWidth icon={faTimes} />
        </div>
        <div
          css={tw`flex-grow flex justify-between items-center bg-white border-0 border-b border-l border-solid border-gray-200`}
        >
          <div css={tw`p-3 flex gap-1 items-center`}>
            <FontAwesomeIcon fixedWidth icon={faPlus} />
            <PlaceholderText>Add</PlaceholderText>
          </div>
          <div css={tw`flex gap-6 px-8 items-center text-gray-500`}>
            <FontAwesomeIcon fixedWidth icon={faSearch} />
            <FontAwesomeIcon fixedWidth icon={faBorderAll} />
            <span css={tw`text-gray-300 text-3xl`}>
              <FontAwesomeIcon fixedWidth icon={faSolidUserCircle} />
            </span>
          </div>
        </div>
      </div>

      <div
        css={tw`bg-gray-50 border-0 border-b border-solid border-gray-300 p-2 flex justify-between items-center`}
      >
        <div
          css={tw`border border-solid border-gray-300 divide-solid divide-gray-300 divide-x divide-y-0 rounded text-sm flex`}
        >
          <div css={tw`px-3 py-0.5`}>
            <PlaceholderText>{CONVO_NAME_FULL}</PlaceholderText>
          </div>
          <div css={tw`px-3 py-0.5`}>
            <PlaceholderText>{CONVO_NAME_FULL}</PlaceholderText>
          </div>
          <div css={tw`px-3 py-0.5 bg-gray-200`}>
            <span
              css={tw`bg-yellow-400 text-yellow-800 text-xxs font-semibold uppercase px-1 py-0.5 rounded mr-1`}
            >
              <PlaceholderText>new</PlaceholderText>
            </span>{' '}
            <PlaceholderText>Ticket #15</PlaceholderText>
          </div>
        </div>
        <div
          css={tw`border border-solid border-gray-300 rounded text-xs py-2 px-8`}
        >
          <PlaceholderText>Apps</PlaceholderText>
        </div>
      </div>

      <div css={tw`flex flex-grow min-h-0`}>
        <div css={tw`flex flex-col w-80`}>
          <div
            css={tw`bg-gray-50 border-0 border-b border-r border-solid border-gray-300 divide-solid divide-gray-300 divide-x divide-y-0 flex items-center text-sm`}
          >
            <div css={tw`py-2 flex-grow flex justify-center`}>
              <FontAwesomeIcon fixedWidth icon={faUser} />
            </div>
            <div css={tw`py-2 flex-grow flex justify-center bg-gray-200`}>
              <FontAwesomeIcon fixedWidth icon={faColumns} />
            </div>
          </div>
          <div
            css={tw`bg-gray-50 border-0 border-r border-solid border-gray-300 flex flex-col flex-grow`}
          >
            <div
              css={tw`p-7 border-0 border-b border-solid border-gray-200 flex flex-col gap-2`}
            >
              <span css={tw`text-xs font-bold`}>
                <PlaceholderText>Assignee</PlaceholderText>
              </span>
              <div
                css={tw`border border-solid border-gray-300 rounded px-3 py-1.5 text-sm bg-white`}
              >
                <PlaceholderText>Support</PlaceholderText>
              </div>
              <span css={tw`text-xs font-bold`}>
                <PlaceholderText>Followers</PlaceholderText>
              </span>
              <div
                css={tw`border border-solid border-gray-300 rounded px-3 py-1.5 text-sm bg-white`}
              >
                &nbsp;
              </div>
            </div>
            <div
              css={tw`p-7 border-0 border-b border-solid border-gray-200 flex flex-col gap-2`}
            >
              <span css={tw`text-xs font-bold -mt-4`}>Tags</span>
              <div
                css={[
                  tw`border border-solid border-gray-300 rounded p-1 bg-white flex flex-wrap items-start gap-1 mb-1`,
                  css`
                    min-height: 3rem;
                  `,
                ]}
              >
                <div
                  id="message-tag"
                  css={tw`hidden flex bg-gray-50 border border-solid border-gray-300 rounded py-0.5 px-1.5 text-xs`}
                >
                  {CONVO_TAG} &times;
                </div>
              </div>
              <div css={tw`flex gap-3`}>
                <div css={tw`flex-grow flex flex-col gap-2`}>
                  <span css={tw`text-xs font-bold`}>
                    <PlaceholderText>Type</PlaceholderText>
                  </span>
                  <div
                    css={tw`border border-solid border-gray-300 rounded p-1.5 text-sm bg-white`}
                  >
                    <PlaceholderText>Task</PlaceholderText>
                  </div>
                </div>
                <div css={tw`flex-grow flex flex-col gap-2`}>
                  <span css={tw`text-xs font-bold`}>
                    <PlaceholderText>Priority</PlaceholderText>
                  </span>
                  <div
                    css={tw`border border-solid border-gray-300 rounded p-1.5 text-sm bg-white`}
                  >
                    <PlaceholderText>Normal</PlaceholderText>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div css={tw`flex-grow flex flex-col`}>
          <div
            css={tw`flex-grow flex flex-col overflow-auto divide-x-0 divide-y divide-gray-300 divide-solid pb-10`}
          >
            <div css={tw`flex gap-4 px-7 py-8`}>
              <div
                css={tw`w-10 h-10 border border-solid border-gray-300 text-gray-500 rounded-full flex items-center justify-center`}
              >
                <FontAwesomeIcon fixedWidth icon={faSolidEnvelope} />
              </div>
              <div css={tw`flex flex-col text-sm text-gray-500`}>
                <h1 css={tw`text-xl font-bold text-gray-800`}>
                  {CONVO_SUBJECT}
                </h1>
                <span>
                  <PlaceholderText>Dec 02, 2020 19:58</PlaceholderText>{' '}
                  {CONVO_NAME_FULL} • {CONVO_EMAIL}{' '}
                  <PlaceholderText>
                    Via support@company.zendesk.com
                  </PlaceholderText>
                </span>
              </div>
            </div>
            <div css={tw`flex gap-4 px-7 py-5`}>
              <div css={tw`text-4xl text-gray-300`}>
                <FontAwesomeIcon fixedWidth icon={faSolidUserCircle} />
              </div>
              <div css={tw`flex flex-col text-sm flex-grow`}>
                <div css={tw`flex gap-4 items-center`}>
                  <span
                    css={tw`font-bold border-0 border-solid border-b-4 border-gray-600 text-gray-600 py-1`}
                  >
                    Public reply
                  </span>
                  <span
                    css={tw`border-0 border-solid border-b-2 border-transparent py-1`}
                  >
                    Internal note
                  </span>
                </div>
                <div
                  css={tw`border border-solid border-gray-300 divide-x-0 divide-y divide-solid divide-gray-300 rounded flex-grow flex flex-col`}
                >
                  <div css={tw`px-3 py-4 text-gray-600`}>
                    To:{' '}
                    <span
                      css={tw`bg-gray-200 rounded-full text-xs font-bold py-0.5 px-3`}
                    >
                      {CONVO_NAME_FULL}
                    </span>
                  </div>
                  <div
                    className="message-text message-outline"
                    css={[
                      tw`p-3`,
                      css`
                        min-height: 10rem;
                      `,
                    ]}
                    contentEditable
                  ></div>
                  <div css={tw`p-4 flex gap-4 text-gray-400`}>
                    <FontAwesomeIcon fixedWidth icon={faText} />
                    <FontAwesomeIcon fixedWidth icon={faPaperclip} />
                  </div>
                </div>
              </div>
            </div>
            <div css={tw`flex gap-4 px-4 py-5`}>
              <div css={tw`text-4xl text-gray-300`}>
                <FontAwesomeIcon fixedWidth icon={faSolidUserCircle} />
              </div>
              <div css={tw`flex flex-col gap-2 text-sm`}>
                <div>
                  <strong css={tw`font-bold`}>{CONVO_NAME_FULL}</strong>
                  <div css={tw`text-gray-500`}>
                    To: <PlaceholderText>Company</PlaceholderText>
                  </div>
                </div>
                <div css={tw`max-w-prose`}>{CONVO_MESSAGE}</div>
              </div>
            </div>
          </div>
          <div
            css={tw`px-2 py-1.5 bg-white border-0 border-t border-solid border-gray-300 flex justify-between`}
          >
            <div
              css={tw`border border-solid border-gray-300 rounded px-4 py-2 text-sm bg-white w-80 flex items-center justify-between`}
            >
              <PlaceholderText>Apply macro</PlaceholderText>
              <FontAwesomeIcon fixedWidth icon={faChevronDown} size="sm" />
            </div>
            <div css={tw`flex gap-1`}>
              <div
                css={tw`px-3 py-2 text-xs font-bold flex gap-1 items-center justify-between`}
              >
                <PlaceholderText>Close tab</PlaceholderText>
                <FontAwesomeIcon fixedWidth icon={faChevronDown} size="sm" />
              </div>
              <div
                css={tw`bg-gray-700 rounded text-sm text-white font-medium divide-x divide-y-0 divide-solid divide-white flex items-center`}
              >
                <span css={tw`px-6 py-2.5`}>
                  Submit as <strong css={tw`font-bold`}>New</strong>
                </span>
                <span css={tw`px-3 py-2.5`}>
                  <FontAwesomeIcon fixedWidth icon={faChevronDown} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
