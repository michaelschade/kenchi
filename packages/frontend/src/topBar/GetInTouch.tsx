import tw from 'twin.macro';

import Feedback from '../components/Feedback';

export default function GetInTouch() {
  return (
    <>
      <p>
        We want to hear from you! Your feedback is how we make Kenchi better: no
        matter how small, we want to hear it. There are a few ways you can get
        in touch.
      </p>
      <h3>Type anything here</h3>
      <div css={tw`pb-2`}>
        <Feedback theme="light" />
      </div>
      <h3>Book time</h3>
      <p>
        You can{' '}
        <a
          target="_blank"
          href="https://calendly.com/kenchi-michael/30m"
          rel="noreferrer"
        >
          book time
        </a>{' '}
        directly with our CEO, Michael. He loves to chat about support
        efficency.
      </p>
      <h3>Email us</h3>
      <p>
        Drop us a note at{' '}
        <a href="mailto:support@kenchi.com">support@kenchi.com</a> and we'll get
        back to you as soon as we can.
      </p>
      <h3>Join us on Slack</h3>
      <p>
        If your company is working with us, you likely have a shared Slack
        channel. Ask to join it: we post product updates there and it's a great
        place to share quick feedback.
      </p>
    </>
  );
}
