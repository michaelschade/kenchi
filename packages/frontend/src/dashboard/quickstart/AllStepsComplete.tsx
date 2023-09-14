import React, { useEffect, useState } from 'react';

import { css } from '@emotion/react';

import { Dialog } from '@kenchi/ui/lib/Dialog';
import { Link } from '@kenchi/ui/lib/Text';
import { UnstyledLink } from '@kenchi/ui/lib/UnstyledLink';

import { trackEvent } from '../../utils/analytics';

const videoIframeWrapperStyle = css`
  position: relative;
  margin: 0.5rem;
  padding-bottom: 60.05%;
  height: 0;

  & > iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

export const AllStepsComplete = () => {
  useEffect(() => {
    trackEvent({
      category: 'quickstart',
      action: 'open_all_done',
    });
  }, []);
  const [showVideo, setShowVideo] = useState(false);
  return (
    <>
      <Dialog
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        width="large"
      >
        <div css={videoIframeWrapperStyle}>
          <iframe
            title="Getting Started with Kenchi"
            src="https://www.loom.com/embed/1cb89495b91b4b858b0e56ebe220298c?hideEmbedTopBar=true"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </Dialog>
      <p>
        <strong>You're good to go!</strong> Kenchi only gets more powerful from
        here&mdash;we'd be thrilled to help you make the most of it.
      </p>
      <ul>
        <li>
          <UnstyledLink
            target="_blank"
            to="https://calendly.com/kenchi-michael/workshop-onboarding"
            rel="noreferrer noopener"
            onClick={() => {
              trackEvent({
                category: 'quickstart',
                action: 'click_schedule_workshop',
              });
            }}
          >
            Schedule a free workshop
          </UnstyledLink>{' '}
          with our co-founder{' '}
          <UnstyledLink
            target="_blank"
            to="https://www.linkedin.com/in/michaelschade/"
            rel="noreferrer noopener"
            onClick={() => {
              trackEvent({
                category: 'quickstart',
                action: 'click_michael_link',
              });
            }}
          >
            Michael
          </UnstyledLink>
          .
        </li>
        <li>
          <Link
            onClick={() => {
              trackEvent({
                category: 'quickstart',
                action: 'click_watch_video',
              });
              setShowVideo(true);
            }}
          >
            Watch a video walk-through
          </Link>{' '}
          of Kenchi's key features.
        </li>
        <li>
          Have content to import?{' '}
          <UnstyledLink
            to="mailto:support@kenchi.com?subject=Importing+content&body=Hi+Kenchi,%0A%0AI+have+content+to+import!+It+is+in+[name+of+tool]"
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => {
              trackEvent({
                category: 'quickstart',
                action: 'click_import_content_help_link',
              });
            }}
          >
            Email us
          </UnstyledLink>{' '}
          and we'll help you import it.
        </li>
      </ul>
    </>
  );
};
