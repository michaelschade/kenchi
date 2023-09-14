import React from 'react';

import { css } from '@emotion/react';

import { BrandColors } from '@kenchi/ui/lib/Colors';

import Breakpoints from '../breakpoints';
import { Accordion } from '../components/Accordion';
import { BaseSection } from '../components/BaseSection';
import { HeadingAndSub } from '../components/HeadingAndSub';

const style = css`
  row-gap: 2rem;
  padding: 4rem 0;
  background-color: ${BrandColors.periwinkleLight};
  *::selection {
    background: ${BrandColors.grey};
    color: ${BrandColors.white};
  }
`;

// These IDs come from https://app.usefathom.com/#/settings/sites/60315/events
const eventIds = {
  dataStorage: 'ROXQF2TS',
  engTeam: 'M19DSTLC',
  setupTime: '0UPGREVV',
  replaceSupportTool: 'WUSUOWWP',
  import: '0L0KDQ42',
  hippa: 'XRQHCRUY',
  editingPermissions: '9WUWUWR0',
  savedReplies: 'TIFRO3XN',
  knowledgeBase: '7KHPLZFZ',
};

const questionsAndAnswers = [
  {
    key: 'dataStorage',
    label: 'How much of my data does Kenchi store?',
    content: (
      <div
        css={css`
          display: grid;
          gap: 0.5rem;
        `}
      >
        <p>
          We store as little data as possible. By default we don't store any
          PII/PHI unless you opt in for deeper analytics and insights. Your
          users are yours and their data stays on your computer. We don't store
          your users' names, emails, internal data about your users, etc.
        </p>
        <p>
          Our{' '}
          <a href="https://get.kenchi.com" target="_blank" rel="noreferrer">
            Chrome extension
          </a>{' '}
          does the heavy lifting. The extension interacts with pages you use
          Kenchi on (such as Zendesk), parses information from the page (like
          your user's name), and then fills that into snippets. This activity
          all takes place locally on your employees' machines, so it's just as
          if they'd typed the snippets themselves—our servers don't see this
          data.{' '}
        </p>
      </div>
    ),
  },
  {
    key: 'engTeam',
    label: 'Will I need my engineering team to help me set up Kenchi?',
    content: (
      <div
        css={css`
          display: grid;
          gap: 0.5rem;
        `}
      >
        <p>
          Nope. Kenchi is a browser extension that anyone can add and
          immediately start using. It sits on top of your browser and will work
          alongside any tool.{' '}
          <a href="https://get.kenchi.com" target="_blank" rel="noreferrer">
            Try it out!
          </a>
        </p>
        <p>
          Add Kenchi to your browser and you will see the extension sits on top
          of any webpage
        </p>
      </div>
    ),
  },
  {
    key: 'setupTime',
    label: 'How long does it take to get Kenchi set up?',
    content: (
      <div
        css={css`
          display: grid;
          gap: 0.5rem;
        `}
      >
        <p>
          You can be logged in and creating snippets in minutes. Play around and
          once you realize how efficient Kenchi will make you and your team,
          upload your saved replies from Intercom, Zendesk, TextExpander, etc.
        </p>
        <p>
          Want to run a pilot? Ready to share with your entire team? No problem.
          Add them as users and have them get the Kenchi browser extension. Once
          they sign in with their gmail account, they will be able to use any
          collection of snippets and playbooks that you have given them access
          to.
        </p>
      </div>
    ),
  },
  {
    key: 'replaceSupportTool',
    label: (
      <>
        Does Kenchi replace Zendesk/
        <wbr />
        Intercom/
        <wbr />
        Salesforce/
        <wbr />
        other support tool?
      </>
    ),
    content: (
      <div
        css={css`
          display: grid;
          gap: 0.5rem;
        `}
      >
        <p>
          No, Kenchi sits on top of any tool you use in a browser. Rather than
          forcing all your teams to use the same platform, Kenchi enhances your
          current tools and allows each team to access the same content while
          meeting the customer on the tools that makes the most sense for them.
        </p>
        <p>
          Kenchi has the flexibility to work as a sidebar next to any browser
          based tool, providing more permissions for viewing and editing
          content, organizing the content to make it faster to find the correct
          answers for customers, centralizing your internal knowledge base,
          creating interactive decision trees and step-by-step instructions, and
          providing more granular data on how snippets and playbooks impact your
          CSAT.{' '}
        </p>
      </div>
    ),
  },
  {
    key: 'import',
    label:
      'Can I import content into Kenchi from systems like Intercom, Zendesk, TextExpander, etc?',
    content: (
      <p>
        Yes! Email us at support@kenchi.com and we will help you import content
        from wherever you need. We have importers ready to go for Intercom,
        Zendesk, and TextExpander, and can help with the heavy lifting from
        other tools as well.
      </p>
    ),
  },
  {
    key: 'hippa',
    label: 'Is Kenchi HIPPA compliant?',
    content: (
      <p>
        Kenchi's servers and employees never have access to PHI. Our servers
        store configuration and documentation, but customer names, email
        addresses, etc. are never sent to our servers. (The only exception is if
        you use our CSAT analytics product, which is a separate setup and
        infrastructure). In this way, Kenchi operates much like any
        ancillary desktop software with regards to HIPAA, not qualifying as a BA
        and thus not needing a BAA.
      </p>
    ),
  },
  {
    key: 'editingPermissions',
    label: 'Can I restrict who can edit content in Kenchi?',
    content: (
      <p>
        Absolutely! Kenchi has fine-grained permission controls. You can decide
        who has access to read, edit, or manage content. You can easily put
        users into groups to consistently give your team access to specific
        snippets and playbooks, while also granting individuals additional
        access than the rest of the group as needed.
      </p>
    ),
  },
  {
    key: 'savedReplies',
    label: `How is Kenchi different from Intercom or Zendesk's saved replies?`,
    content: (
      <ol
        css={css`
          display: grid;
          gap: 0.5rem;
          padding-left: 1rem;
          margin: 0;
          font-size: 18px;
        `}
      >
        <li>
          <strong>A proper search engine: full-text, filters, and more.</strong>{' '}
          Snippets and playbooks are backed with a full-fledged search system;
          for example, Kenchi searches the full text of your content, so if the
          playbook is titled "International rules", you can still find it by
          looking for the countries mentioned within. With search keywords, you
          can help your team find the right content even if they use different
          words ("student", "child", and "user" could all map to the same
          topic).
        </li>
        <li>
          <strong>Organization built for teams and specialists.</strong>{' '}
          Collections provide a folder-like tiering structure to organize
          content into topical areas. Spaces allow you to create specific home
          pages for teams and specialists: Tier 2, Escalations, Trust & Safety,
          and everyone else can search within their own curated Kenchi.
        </li>
        <li>
          <strong>Take action right from your documentation.</strong> Rather
          than keeping your snippets and playbooks separate, you can embed
          snippets inside of playbooks to contextualize how they're best used.
          For example, a "Customer Verification" playbook can includes snippets
          to insert the proper phrases and replies in one click.
        </li>
        <li>
          <strong>CSAT + Kenchi = Action.</strong> Kenchi maps CSAT responses
          from customers back to the snippets and playbooks that were used, so
          you can pinpoint exactly what content to improve to raise CSAT scores.
        </li>
        <li>
          <strong>Works everywhere.</strong> Macros in Intercom and Zendesk are
          stuck in those tools. If you're switching tools, need to talk to a
          customer in email, enable your sales team, and so on, Kenchi will give
          your team standardized replies and playbooks wherever you are. And as
          those processes change, update it once and it's available everywhere.
        </li>
      </ol>
    ),
  },
  {
    key: 'knowledgeBase',
    label: 'How does Kenchi work with my existing knowledge base?',
    content: (
      <p>
        Many companies have replaced their internal wiki pages with playbooks
        inside Kenchi. This gives them one less tool to keep up to date and one
        less place for your team to have to look, while benefitting from
        Kenchi's enhanced integrations and insights.
      </p>
    ),
  },
];

export default function FAQ() {
  return (
    <BaseSection id="faq" css={style}>
      <HeadingAndSub heading="Frequently Asked Questions" />
      <div
        css={css`
          grid-column: 4 / span 10;
          ${Breakpoints.small} {
            grid-column: 2 / span 14;
          }
        `}
      >
        <Accordion
          sections={questionsAndAnswers}
          onOpenSection={(key: string) => {
            window.fathom.trackGoal(eventIds[key as keyof typeof eventIds], 0);
          }}
        />
      </div>
    </BaseSection>
  );
}
