import React, { useCallback, useState } from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import { BaseSection } from '../components/BaseSection';
import { HeadingAndSub } from '../components/HeadingAndSub';

const pricingCTASectionStyle = css`
  background-color: ${BrandColors.black};
  color: ${BrandColors.white};
  padding: 5rem 0;
  row-gap: 2.5rem;

  ${Breakpoints.small} {
    padding: 2.5rem 0;
    row-gap: 1.5rem;
  }

  .form-container {
    display: grid;
    grid-template-columns: 100% 100%;
    gap: 1rem;
    grid-column: 5 / span 8;
    ${Breakpoints.small} {
      grid-column: 2 / span 14;
    }
    overflow: hidden;
    // This padding-bottom is a hack to make it so we don't cut off the focus
    // box shadow
    padding: 4px;

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

export const PricingCTASection = () => {
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
    },
    [email]
  );
  return (
    false && (
      <BaseSection css={pricingCTASectionStyle} id="join-waitlist">
        <HeadingAndSub heading="Join our waitlist" />
        <div
          className={submitted ? 'form-container submitted' : 'form-container'}
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
      </BaseSection>
    )
  );
};
