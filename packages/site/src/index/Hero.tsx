import React, { useCallback, useRef, useState } from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import { BaseSection } from '../components/BaseSection';
import HeroAnimation, { HeroAnimationRef } from '../index/HeroAnimation';

const style = css`
  grid-column: span 16;
  background-color: ${BrandColors.black};
  color: ${BrandColors.white};

  border-top: 1px solid ${BrandColors.grey};

  & .content {
    grid-column: 2 / span 5;

    display: grid;
    place-content: center;
    place-items: start;
    row-gap: 2rem;
    overflow: hidden;

    ${Breakpoints.medium} {
      grid-column: 2 / span 7;
      row-gap: 1rem;
    }

    ${Breakpoints.small} {
      padding: 2.5rem 0.5rem 2.5rem 0;
      grid-column: 2 / span 14;
    }

    h1 {
      line-height: 1;
      ${Breakpoints.medium} {
        br,
        br:after {
          content: ' ';
        }
      }
      ${Breakpoints.small} {
        line-height: 1.2;
      }
    }
  }

  & .animation {
    grid-column: 10 / span 7;

    ${Breakpoints.small} {
      grid-column: span 16;
    }

    justify-self: end;
    justify-content: end;
    place-self: end;
    place-content: end;
  }

  .form-container {
    display: grid;
    grid-template-columns: 100% 100%;
    gap: 1rem;

    form,
    .post-submit {
      transition: transform 600ms ease-in-out;
    }

    form {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr max-content;
      width: 100%;

      &,
      input {
        min-width: 0;
      }

      ${Breakpoints.medium} {
        grid-template-columns: auto max-content;
        gap: 0.75rem;
      }

      ${Breakpoints.small} {
        grid-template-columns: auto;
      }
    }

    .post-submit {
      align-self: center;
      color: var(--colorPeriwinkle);
    }

    &.submitted {
      form {
        transform: translateX(calc(-100% - 1rem));
      }

      .post-submit {
        transform: translateX(calc(-100% - 1rem));
      }
    }
  }
`;

export default function Hero() {
  const animRef = useRef<HeroAnimationRef>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const save = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // TODO: error checking
      if (!email) {
        return;
      }
      const formData = new URLSearchParams();
      formData.append('email', email);
      // TODO: handle failure
      // TODO: config value
      fetch('https://api.kenchi.com/waitlist', {
        method: 'POST',
        body: formData,
      });

      setSubmitted(true);
      animRef.current?.animateAll();
    },
    [email]
  );

  return (
    <BaseSection css={style}>
      <div className="content">
        <h1>Snippets, playbooks, &amp; data at your fingertips</h1>
        <p>
          Kenchi is a privacy-first Chrome extension that supercharges your
          support tools. As a single source of truth, Kenchi reduces cognitive
          load, fosters collaboration across your whole team, and generates
          precise insights about your support conversations.
        </p>
        {false && (
          <div
            className={
              submitted ? 'form-container submitted' : 'form-container'
            }
          >
            <form onSubmit={save}>
              <input
                type="text"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="button cta">
                Join waitlist
              </button>
            </form>
            <p className="post-submit">
              Thanks for signing up! We can't wait to welcome you :)
            </p>
          </div>
        )}
      </div>
      <HeroAnimation ref={animRef} className="animation" />
    </BaseSection>
  );
}
