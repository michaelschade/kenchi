import { css } from '@emotion/react';
import {
  faArrowRight,
  faCheckCircle,
  faExclamationTriangle,
  faSearch,
  faTimes,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHistory, useParams } from 'react-router-dom';
import tw from 'twin.macro';

import { isFailure, isSuccess } from '@kenchi/shared/lib/Result';
import { isSlateEmpty } from '@kenchi/slate-tools/lib/utils';
import { KenchiTheme } from '@kenchi/ui/lib/Colors';
import { Separator } from '@kenchi/ui/lib/Dashboard/Separator';
import { Dialog, DialogContent, DialogHeader } from '@kenchi/ui/lib/Dialog';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import Tooltip from '@kenchi/ui/lib/Tooltip';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import { ImportEntry } from '../../importers';
import Renderer from '../../slate/Renderer';
import IntercomActions from './IntercomActions';
import ZendeskActions from './ZendeskActions';

type Props = {
  entry: ImportEntry;
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
  state: 'invalid' | 'skipped' | 'ready' | 'pending' | 'error' | 'complete';
  error?: string;
  toolUrl?: string;
};

export const ImportToggleRow = ({
  entry,
  checked,
  onChange,
  disabled,
  state,
  error,
  toolUrl,
}: Props) => {
  const history = useHistory();
  const { id: importId, entryId } = useParams<{
    id: string;
    entryId?: string;
  }>();

  const closeDialog = () => history.push(`/dashboard/import/${importId}`);
  const {
    slate,
    zendeskTags,
    zendeskAssign,
    zendeskSetTicketStatus,
    intercomTags,
  } = entry;

  const hasFailure =
    isFailure(slate) ||
    (zendeskTags && isFailure(zendeskTags)) ||
    (zendeskAssign && isFailure(zendeskAssign)) ||
    (zendeskSetTicketStatus && isFailure(zendeskSetTicketStatus)) ||
    (intercomTags && isFailure(intercomTags));

  const emptySlateContent =
    isSuccess(slate) && slate.data.length === 1 && isSlateEmpty(slate.data[0]);

  return (
    <tr>
      <td css={tw`w-px relative`}>
        <input
          type="checkbox"
          css={[
            tw`transform scale-110`,
            css`
              cursor: inherit;
            `,
          ]}
          checked={checked}
          onChange={() => {
            if (!disabled && onChange) {
              onChange();
            }
          }}
          disabled={disabled || !onChange}
        />
      </td>
      <td>
        {toolUrl ? (
          <UnstyledLink
            to={toolUrl}
            target="_blank"
            css={tw`flex gap-2 items-baseline`}
          >
            {entry.name}
            <FontAwesomeIcon icon={faArrowRight} size="xs" />
          </UnstyledLink>
        ) : (
          entry.name
        )}
      </td>
      <td className="group" css={tw`w-1/2 text-sm relative`}>
        {!hasFailure ? (
          <div
            css={[
              css`
                overflow: hidden;
                text-overflow: ellipsis;
              `,
            ]}
          >
            <ZendeskActions
              tagsConfig={zendeskTags?.data}
              assign={zendeskAssign?.data}
              setStatus={zendeskSetTicketStatus?.data}
            />
            <IntercomActions tags={intercomTags?.data} />
            {emptySlateContent ? null : (
              <>
                <Separator />
                <div
                  css={[
                    tw`transition group-hover:opacity-20 max-w-xs`,
                    css`
                      display: -webkit-box;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                    `,
                  ]}
                >
                  <Renderer contents={slate.data} />
                </div>
              </>
            )}

            <UnstyledLink
              to={`/dashboard/import/${importId}/preview/${entry.id}`}
              css={tw`absolute inset-0 transition opacity-0 group-hover:opacity-100 flex absolute inset-0 cursor-pointer justify-center items-center font-semibold hover:no-underline`}
            >
              <div css={tw`relative px-4 py-3`}>
                <div
                  css={({ colors }: KenchiTheme) => css`
                    ${tw`absolute inset-0 backdrop-filter backdrop-blur`}
                    background-color: ${colors.gray[4]};
                  `}
                ></div>
                <div css={tw`relative flex gap-1 items-center`}>
                  <FontAwesomeIcon icon={faSearch} />
                  Preview
                </div>
              </div>
            </UnstyledLink>
            <Dialog isOpen={entry.id === entryId} onClose={closeDialog}>
              <DialogHeader css={tw`flex justify-between`}>
                <h2>Preview: {entry.name}</h2>
                <div
                  css={tw`inline-flex p-2 -m-2 cursor-pointer text-gray-300`}
                  onClick={closeDialog}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </div>
              </DialogHeader>
              <DialogContent>
                <ZendeskActions
                  tagsConfig={zendeskTags?.data}
                  assign={zendeskAssign?.data}
                  setStatus={zendeskSetTicketStatus?.data}
                />
                {emptySlateContent ? null : (
                  <>
                    <Separator />
                    <Renderer contents={slate.data} />
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <span css={tw`text-yellow-600`}>Error importing {entry.name}</span>
        )}
      </td>
      <td css={tw`text-center`}>
        {error ? (
          <Tooltip overlay={error}>
            <span css={tw`text-yellow-400`}>
              <FontAwesomeIcon icon={faExclamationTriangle} fixedWidth />
            </span>
          </Tooltip>
        ) : null}
        {state === 'pending' ? (
          <LoadingSpinner name="import toggle row pending" />
        ) : null}
        {state === 'complete' ? (
          <span css={tw`text-green-500`}>
            <FontAwesomeIcon icon={faCheckCircle} fixedWidth />
          </span>
        ) : null}
      </td>
    </tr>
  );
};
