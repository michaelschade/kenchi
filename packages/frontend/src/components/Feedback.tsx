import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { gql, useMutation } from '@apollo/client';
import styled from '@emotion/styled';
import {
  faBullhorn,
  faCheck,
  faPaperPlane,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { captureMessage } from '@sentry/react';
import classNames from 'classnames/bind';
import { useLocation } from 'react-router-dom';

import { BaseColors } from '@kenchi/ui/lib/Colors';

import {
  SendUserFeedbackMutation,
  SendUserFeedbackMutationVariables,
} from '../graphql/generated';
import { trackEvent } from '../utils/analytics';

const Wrapper = styled.div`
  position: relative;
  height: 32px;
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 0.7em;
  line-height: 1.75;
  color: hsl(204, 4%, 77%);
`;

const Input = styled.input`
  /* from bootstrap */
  display: block;
  width: 100%;
  font-weight: 400;
  line-height: 1.5;
  background-clip: padding-box;

  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out,
    background 0.2s ease-in-out;
  box-shadow: 0 0 0 transparent;

  /* custom */
  height: 100%;
  font-size: 0.8rem;
  border: 1px solid transparent;
  border-radius: 20px;
  padding-left: 0.75rem;
  padding-right: 35px;

  &:focus {
    outline: 0;
  }

  .theme-dark & {
    color: ${({ theme }) => theme.colors.accent[1]};
    border-color: ${({ theme }) => theme.colors.accent[11]};
    background-color: ${({ theme }) => theme.colors.accent[12]};
    &::placeholder {
      color: ${({ theme }) => theme.colors.accent[8]};
    }

    &:focus {
      box-shadow: 0 0 3px 2px ${({ theme }) => theme.colors.accent[9]};
      border-color: ${({ theme }) => theme.colors.accent[8]};
    }
  }

  .theme-light & {
    color: ${({ theme }) => theme.colors.gray[11]};
    border-color: ${({ theme }) => theme.colors.gray[6]};
    background-color: ${({ theme }) => theme.colors.gray[3]};

    &:focus {
      box-shadow: 0 0 3px 2px ${({ theme }) => theme.colors.subtleShadow};
      border-color: ${({ theme }) => theme.colors.gray[7]};
      background-color: ${({ theme }) => theme.colors.gray[2]};
    }
  }
`;

const Submit = styled.button`
  position: absolute;
  border: none;
  border-radius: 500px;
  padding-right: 8px;
  padding-top: 3px;
  height: 22px;
  width: 22px;
  right: 5px;
  top: 0;
  bottom: 0;
  margin: auto;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap;
  transition: background 0.25s ease-in-out, width 0.25s ease-in;

  .theme-dark & {
    color: ${({ theme }) => theme.colors.accent[1]};
    background: ${({ theme }) => theme.colors.accent[9]};

    &[disabled] {
      background: ${({ theme }) => theme.colors.accent[11]};
    }
  }

  .theme-light & {
    color: ${({ theme }) => theme.colors.accent[11]};
    background: ${({ theme }) => theme.colors.accent[6]};

    &[disabled] {
      color: ${({ theme }) => theme.colors.gray[11]};
      background: ${({ theme }) => theme.colors.gray[6]};
    }
  }

  &:active,
  &:focus {
    outline: 0;
  }

  &.submitted,
  &[disabled].submitted {
    color: #fff;
    background: ${BaseColors.success};
  }

  .action {
    position: absolute;
    font-weight: 600;
    left: 25px;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
  }

  svg {
    position: absolute;
    width: 12px;
    height: 12px;
    top: 0;
    bottom: 0;
    margin: auto;
  }
`;

const DEFAULT_PROMPTS = [
  'I really wish...',
  'This page needs...',
  "I don't like...",
  'I love that...',
];

export const MUTATION = gql`
  mutation SendUserFeedbackMutation(
    $feedback: String!
    $path: String!
    $prompt: String!
  ) {
    sendUserFeedback(feedback: $feedback, path: $path, prompt: $prompt)
  }
`;

type FeedbackProps = {
  focused?: boolean;
  theme?: 'light' | 'dark';
  prompts?: string[];
};

export default function Feedback({
  focused,
  theme = 'dark',
  prompts = DEFAULT_PROMPTS,
}: FeedbackProps) {
  const randPrompt = useCallback(
    () => prompts[Math.floor(Math.random() * prompts.length)],
    [prompts]
  );

  const [placeholder, setPlaceholder] = useState(randPrompt());
  const [submitted, setSubmitted] = useState(false);
  const [resetForm, setResetForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [sendFeedback] = useMutation<
    SendUserFeedbackMutation,
    SendUserFeedbackMutationVariables
  >(MUTATION);

  useEffect(() => {
    if (focused) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [inputRef, focused]);

  useEffect(() => {
    if (resetForm) {
      setFeedback('');
      setSubmitted(false);
      setPlaceholder(randPrompt());
      setTimeout(() => focused && inputRef.current?.focus(), 0);
      setResetForm(false);
    }
  }, [resetForm, inputRef, focused, randPrompt]);

  const doSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const path = location.pathname + location.search;
    // Capture a message so we get log lines in case they're reporting an issue
    captureMessage('User feedback sent');
    trackEvent({
      category: 'feedback',
      action: 'user',
      label: 'Submit feedback',
      path,
    });
    sendFeedback({
      variables: {
        path,
        prompt: placeholder,
        feedback,
      },
    });
    // TODO: maybe catch and report errors? shrug for now
    setSubmitted(true);
    setTimeout(() => setResetForm(true), 3000);
  };

  let icon, action, width;
  if (submitted) {
    icon = <FontAwesomeIcon icon={faCheck} style={{ left: '9px' }} />;
    action = 'Thank you! :)';
    width = '105px';
  } else if (feedback) {
    icon = (
      <FontAwesomeIcon
        icon={faPaperPlane}
        style={{ left: '5px' }}
        title="Send feedback"
      />
    );
    width = '22px';
  } else {
    icon = <FontAwesomeIcon icon={faBullhorn} style={{ left: '7px' }} />;
    action = 'Give feedback';
    width = '105px';
  }

  return (
    <form onSubmit={doSubmit}>
      <Wrapper className={`theme-${theme}`}>
        <Input
          type="text"
          ref={inputRef}
          placeholder={placeholder}
          value={feedback}
          disabled={submitted}
          onChange={(e) => setFeedback(e.target.value)}
          className="hotkeys-allow-up hotkeys-allow-down"
        />

        <Submit
          type="submit"
          disabled={!feedback || submitted}
          style={{ width }}
          className={classNames({ submitted })}
        >
          {icon}
          {action && <span className="action">{action}</span>}
        </Submit>
      </Wrapper>
    </form>
  );
}
