import { css } from '@emotion/react';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';
import { useHistory } from 'react-router-dom';

import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';

const style = css`
  font-size: 0.9em;

  address {
    margin-left: 15px;
  }
`;

// TODO: dedupe when kenchi.com/privacy (same content as of June 22)
export default function Privacy() {
  const history = useHistory();

  return (
    <>
      <HeaderBar>
        <HeaderIconLink onClick={() => history.push('/')} icon={faArrowLeft} />
        <SectionHeader>Privacy Policy</SectionHeader>
      </HeaderBar>

      <ContentContainer css={style}>
        <p>Last Updated: March 26, 2020</p>
        <p>
          This privacy policy (&ldquo;Policy&rdquo;) describes how Kenchi, Inc.
          and its related companies (&ldquo;Company&rdquo;) collect, use and
          share personal information of consumer users of this website,
          kenchi.com (the &ldquo;Site&rdquo;). This Policy also applies to any
          of our other websites that post this Policy. This Policy does not
          apply to websites that post different statements.
        </p>

        <p>
          We care a lot about your privacy. One of our founding principles is to
          give you powerful tools, but to do so in a way that respects your data
          and enhances your security. With that in mind, we strive to collect
          and store information only insomuch as it allows us to build better
          products and services for you. If you have any questions,{' '}
          <a href="mailto:support@kenchi.com">get in touch</a> with us.
        </p>

        <h2>What we collect</h2>

        <p>We get information about you in a range of ways:</p>

        <p>
          <strong>Information you give us</strong>
          <br />
          We collect your name, email address, username as well as other
          information you directly give us on our Site.
        </p>

        <p>
          <strong>Information we get from others</strong>
          <br />
          We may get information about you from other sources. We may add this
          to information we get from this Site.
        </p>

        <p>
          <strong>Information automatically collected</strong>
          <br />
          We automatically log information about you and your computer. For
          example, when visiting our Site, we log your computer operating system
          type, browser type, browser language, the website you visited before
          browsing to our Site, pages you viewed, how long you spent on a page,
          access times and information about your use of and actions on our
          Site.
        </p>

        <p>
          <strong>Cookies</strong>
          <br />
          We may log information using "cookies." Cookies are small data files
          stored on your hard drive by a website. We may use both session
          Cookies (which expire once you close your web browser) and persistent
          Cookies (which stay on your computer until you delete them) to provide
          you with a more personal and interactive experience on our Site. This
          type of information is collected to make the Site more useful to you
          and to tailor the experience with us to meet your special interests
          and needs.
        </p>

        <h2>Use of personal information</h2>

        <p>We use your personal information as follows:</p>

        <ul>
          <li>
            We use your personal information to operate, maintain, and improve
            our sites, products, and services.
          </li>
          <li>
            We use your personal information to respond to comments and
            questions and provide customer service.
          </li>
          <li>
            We use your personal information to send information including
            confirmations, invoices, technical notices, updates, security
            alerts, and support and administrative messages.
          </li>
          <li>
            We use your personal information to link or combine user information
            with other personal information.
          </li>
          <li>
            We use your personal information to provide and deliver products and
            services customers request.
          </li>
        </ul>

        <h2>Sharing of personal information</h2>

        <p>We may share personal information as follows:</p>

        <ul>
          <li>
            We may share personal information with your consent. For example,
            you may let us share personal information with others for their own
            marketing uses. Those uses will be subject to their privacy
            policies.
          </li>
          <li>
            We may share personal information when we do a business deal, or
            negotiate a business deal, involving the sale or transfer of all or
            a part of our business or assets. These deals can include any
            merger, financing, acquisition, or bankruptcy transaction or
            proceeding.
          </li>
          <li>
            We may share personal information for legal, protection, and safety
            purposes.
            <ul>
              <li>We may share information to comply with laws.</li>
              <li>
                We may share information to respond to lawful requests and legal
                processes.
              </li>
              <li>
                We may share information to protect the rights and property of
                Kenchi, Inc., our agents, customers, and others. This includes
                enforcing our agreements, policies, and terms of use.
              </li>
              <li>
                We may share information in an emergency. This includes
                protecting the safety of our employees and agents, our
                customers, or any person.
              </li>
            </ul>
          </li>
          <li>
            We may share information with those who need it to do work for us.
          </li>
        </ul>

        <p>
          We may also share aggregated and/or anonymized data with others for
          their own uses.
        </p>

        <h2>Information choices and changes</h2>

        <p>
          Our marketing emails tell you how to &ldquo;opt-out.&rdquo; If you opt
          out, we may still send you non-marketing emails. Non-marketing emails
          include emails about your accounts and our business dealings with you.
        </p>

        <p>
          You may send requests about personal information to our Contact
          Information below. You can request to change contact choices, opt-out
          of our sharing with others, and update your personal information.
        </p>

        <p>
          You can typically remove and reject cookies from our Site with your
          browser settings. Many browsers are set to accept cookies until you
          change your settings. If you remove or reject our cookies, it could
          affect how our Site works for you.
        </p>

        <h2>Contact information</h2>

        <p>
          We welcome your comments or questions about this privacy policy (or
          anything else!). The best way to get ahold of us is via email:
        </p>

        <address>
          <a href="mailto:support@kenchi.com">support@kenchi.com</a>
        </address>

        <p>If you prefer, you may also contact us at our address:</p>

        <address>
          <strong>Kenchi, Inc.</strong>
          <br />
          301 Mission St
          <br />
          Unit 22A
          <br />
          San Francisco, California 94105
        </address>

        <h2>Changes to this privacy policy</h2>

        <p>
          We may change this privacy policy. If we make any changes, we will
          change the Last Updated date above.
        </p>
      </ContentContainer>
    </>
  );
}
