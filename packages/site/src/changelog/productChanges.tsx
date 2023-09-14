import React, { ReactNode } from 'react';

import { DateTime } from 'luxon';

import Emoji from '@kenchi/ui/lib/Emoji';

export type ProductChangeType = {
  description: ReactNode;
  date: DateTime;
  category: ProductChangeCategory;
};

export type ProductChangeCategory =
  | 'Dashboard'
  | 'Editor'
  | 'Extension'
  | 'Potpourri';

export const productChanges: ProductChangeType[] = [
  // Your new change here:

  // {
  //   description: <p>You can now do something new and wonderful in Kenchi</p>,
  //   date: DateTime.fromISO('2020-01-01'),
  //   category: 'Potpourri',
  // },
  {
    description: (
      <p>
        Kenchi playbooks now support collapsible sections, so you can easily
        hide less-often-used parts of your documentation.
      </p>
    ),
    date: DateTime.fromISO('2020-04-18'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        Do you like <a href="https://app.frontapp.com">Front</a>? So do we! Now
        Kenchi works with Front and populates author and recipient info in your
        snippets. <Emoji emoji="🎉" />
      </p>
    ),
    date: DateTime.fromISO('2022-04-12'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        New to Kenchi? We're so glad you're here! And you're here just in time
        for the new{' '}
        <a href="https://app.kenchi.com/dashboard/quickstart">quickstart</a>{' '}
        flow. Get up and running on Kenchi lickety-split.
      </p>
    ),
    date: DateTime.fromISO('2022-04-05'),
    category: 'Potpourri',
  },
  {
    description: (
      <p>
        There is now a changelog! You are looking at it. Thanks for stopping by.
        Check back here soon or follow{' '}
        <a
          href="https://twitter.com/getkenchi"
          rel="noopener noreferrer"
          target="_blank"
        >
          @getkenchi
        </a>{' '}
        for more updates.
      </p>
    ),
    date: DateTime.fromISO('2022-03-28'),
    category: 'Potpourri',
  },
  {
    description: (
      <p>
        <Emoji emoji="🏃‍♀️" /> Intercom CSAT sync just got way faster: see the
        latest data from your users overlaid alongside playbooks and snippets
        within the day rather than waiting multiple days.
      </p>
    ),
    date: DateTime.fromISO('2022-03-23'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        In our ongoing effort to battle test our editor, we've made more
        improvements to list formatting and our tests to import content from
        other sources.
      </p>
    ),
    date: DateTime.fromISO('2022-03-24'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        We added a preview tooltip when adding snippets to playbooks to make it
        easier to pick the right content. Good idea, Elselynn!
      </p>
    ),
    date: DateTime.fromISO('2022-03-23'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        We fixed formatting when copying a message from Gmail into Kenchi.
        Recruiters, sales teams: it's now way easier to save your snippets as
        you work.
      </p>
    ),
    date: DateTime.fromISO('2022-03-23'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        We added direct links for creating playbooks, snippets, and quick links,
        getting rid of our old multi-step flow. (It's about time.)
      </p>
    ),
    date: DateTime.fromISO('2022-03-10'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        We fixed a bug causing folks to get logged out more often than they
        should. Now Kenchi should always be ready to go!
      </p>
    ),
    date: DateTime.fromISO('2022-03-25'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        You can now limit <strong>Quick Snippets</strong> to a specific space.
        So, if your sales team is in Gmail looking to move fast, they can type{' '}
        <code>;</code> and access only the snippets they use without ever
        leaving their keyboard.
      </p>
    ),
    date: DateTime.fromISO('2022-03-24'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        Insights charts now show a dotted line to indicate when data is
        incomplete, say if the date range for the chart includes today. Today
        isn't quite over yet!
      </p>
    ),
    date: DateTime.fromISO('2022-03-16'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        We made a major update to the search engine in Kenchi. You can now
        search the full text content of your playbooks and snippets. And search
        is now smarter, so you will get fewer, more relevant results.
      </p>
    ),
    date: DateTime.fromISO('2022-02-18'),
    category: 'Potpourri',
  },
  {
    description: (
      <p>
        <Emoji emoji="🔠" /> or <Emoji emoji="🔡" />? Same same if you ask us:
        and our dashboard agrees. Sorting is now case insensitive.
      </p>
    ),
    date: DateTime.fromISO('2022-02-22'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        We now link to the dashboard as the primary target for all playbooks and
        snippets outside of the extension. We hope this makes it easier for you
        to share common knowledge in your team's Slack channels and training.
      </p>
    ),
    date: DateTime.fromISO('2022-02-15'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        We fixed a bug keeping your keyboard cursor inside of a link, instead of
        allowing you to create a link and type unformatted text afterward.
      </p>
    ),
    date: DateTime.fromISO('2022-02-02'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        <strong>Introducing Quick Snippets</strong> for Gmail &amp; Intercom.
        Type <code>;</code> and instantly search your snippets without opening
        our sidebar, letting you quickly expand{' '}
        <a
          href="https://www.loom.com/share/6cf27b87a995470d9a987b3b407b829a"
          target="_blank noreferrer"
        >
          quick shortcuts
        </a>{' '}
        to entire replies. We'd love feedback, and especially to hear if there
        are other sites for which we should enable this.
      </p>
    ),
    date: DateTime.fromISO('2022-02-28'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        Sorting, pagination, and filters now consistently update the URL
        throughout our dashboard, making it even easier to save common views and
        share them with your team.
      </p>
    ),
    date: DateTime.fromISO('2022-02-25'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        What we all came here for: emoji improvements! <Emoji emoji="✍️ " />{' '}
        <Emoji emoji="💅" /> We now autofocus the search box when you set an
        emoji, and improved our emoji selector in the dashboard collection page.
      </p>
    ),
    date: DateTime.fromISO('2022-02-27'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        We updated the default permission for users, groups, and your
        organization to <em>create & edit</em> instead of <em>view only</em>.
      </p>
    ),
    date: DateTime.fromISO('2022-02-25'),
    category: 'Potpourri',
  },
  {
    description: (
      <p>
        You can now search by collection name and description to find snippets,
        playbooks, and collections. Look out for more search changes coming
        soon!
      </p>
    ),
    date: DateTime.fromISO('2022-02-09'),
    category: 'Potpourri',
  },
  {
    description: (
      <p>
        Take your data to go! You can now export the tables from the playbooks,
        snippets, and collection pages in the Kenchi dashboard to a CSV.
      </p>
    ),
    date: DateTime.fromISO('2022-01-30'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        <Emoji emoji="🥁" /> All of our dashboard editor changes have been
        building up to this: introducing our{' '}
        <strong>insights-driven editor</strong>. We now include usage, CSAT
        comments, scores, top users, and more when reading and editing content
        in Kenchi. No more guessing why users are upset, who on your team to ask
        for input, or hunting down example tickets: it's all brought right to
        you. (We also gave our playbook editor a new facelift.)
      </p>
    ),
    date: DateTime.fromISO('2022-01-31'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        We improved some edge cases with how our editor handles bulleted lists.
      </p>
    ),
    date: DateTime.fromISO('2022-01-18'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        We fixed a bug preventing <code>Enter</code> from running the first
        playbook or snippet.
      </p>
    ),
    date: DateTime.fromISO('2022-01-29'),
    category: 'Extension',
  },
  {
    description: (
      <>
        <p>
          Dashboard, dashboard, dashboard. We love that you love it, so we've
          been heads down polishing up the rough edges:
        </p>
        <ul>
          <li>Create collections from the Dashboard</li>
          <li>
            <code>Cmnd + Click</code> any row to open it up in a new
            tab&mdash;queue up as many snippet and playbook edits as you like..
          </li>
          <li>
            Added quick links for creating new playbooks, snippets, and users.
          </li>
          <li>
            Fixed a bug sorting playbooks by collection name. (Whoops, good
            catch!)
          </li>
          <li>
            Rolled out our new editor UI in preparation for your top analytics
            request :)
          </li>
          <li>List all saved drafts from the dashboard.</li>
        </ul>
      </>
    ),
    date: DateTime.fromISO('2021-12-17'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        It's time: you already call 'em Playbooks and Snippets, so we're
        catching up to you. Workflows have been renamed to Playbooks, and
        Automations to Snippets.
      </p>
    ),
    date: DateTime.fromISO('2021-12-15'),
    category: 'Potpourri',
  },
  {
    description: (
      <p>
        You can now see a full list of all playbooks and snippets in the
        dashboard without going collection-by-collection. We hope this helps!
      </p>
    ),
    date: DateTime.fromISO('2021-11-08'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        Joining the full-page playbook and snippet editor, you can now read
        playbooks and snippets on the big screen. Consider sending your newer
        teammates here to read up on your team's key playbooks before they dive
        into the inbox.
      </p>
    ),
    date: DateTime.fromISO('2021-11-03'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        Inserting a snippet in Zendesk now restores your keyboard cursor
        position in the textarea so you can go right back to personalizing your
        reply.
      </p>
    ),
    date: DateTime.fromISO('2021-11-10'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        Table filters are now saved to your URL to make frequent searches easier
        to save and share with your team. Try filtering your playbooks list in a
        collection for low CSAT, then review at your team meeting!
      </p>
    ),
    date: DateTime.fromISO('2021-11-10'),
    category: 'Extension',
  },
  {
    description: (
      <p>Images nested inside lists now work better inside of Intercom.</p>
    ),
    date: DateTime.fromISO('2021-11-04'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        We've heard that Intercom's native bulleted list formatting is
        restrictive. We added a translator to let you use nested lists in Kenchi
        and supported applications, and still keep them nicely formatted in
        systems like Intercom.
      </p>
    ),
    date: DateTime.fromISO('2021-11-04'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        You can now disable users to keep your users page tidy. (We rely on
        Google login for SSO, so if you off-board a teammate from Google, Kenchi
        will automatically prevent new logins as well.)
      </p>
    ),
    date: DateTime.fromISO('2021-11-17'),
    category: 'Potpourri',
  },
  {
    description: (
      <p>
        <Emoji emoji="📈" /> <Emoji emoji="🔎" /> Goodbye, long list of
        snippets. Hello, data-driven content management. We've taken our
        collection-level insights and brought them to your playbook and snippet
        tables. You can now sort your content by usage and CSAT from systems
        like Intercom.
      </p>
    ),
    date: DateTime.fromISO('2021-10-29'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        Search, filter, sort: your tables have it all! As part of our new
        insights ship, we've introduced powerful filtering throughout the entire
        dashboard.
      </p>
    ),
    date: DateTime.fromISO('2021-10-28'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        It's dashboard month here at Kenchi, and it doesn't stop with insights.
        We're rolling out a new editor for creating playbooks and snippets to
        make room for your top requests&mdash;coming soon :)
      </p>
    ),
    date: DateTime.fromISO('2021-10-09'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        We fixed up a few editor bugs. You can now delete links with the
        backspace and delete keys, and the <code>Enter</code> shortcut works
        from the insert snippet modals.
      </p>
    ),
    date: DateTime.fromISO('2021-10-25'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        You can now search for collections alongside snippets and playbooks. We
        added descriptions to help your new team members discover similar
        content more easily.
      </p>
    ),
    date: DateTime.fromISO('2021-10-25'),
    category: 'Potpourri',
  },
  {
    description: (
      <>
        <p>
          It's a big month with an extension polish and bug bash. Here are some
          small improvements we made that we hope have a big impact on your day:
        </p>
        <ul>
          <li>
            <code>Shift + Enter</code> from the search box will now open our new
            preview modal, so you have mouse-free confidence over what you're
            about to run.
          </li>
          <li>
            We fixed a bug where our <code>h</code> shortcut (that takes you
            back to our extension home page) would also type in the search box.
          </li>
          <li>
            We also found (and fixed) a bug preventing the <code>Enter</code>{' '}
            key from reliably running a snippet in the preview modal.
          </li>
          <li>
            Setting Kenchi to open by default (or any other site customization
            from the <em>Settings</em> menu) saves more quickly and reliably. We
            tidied up the personalization options while we were in there.
          </li>
          <li>
            Custom variables are much more reliable in Intercom now, and will
            always prompt you to fill them out first.
          </li>
        </ul>
      </>
    ),
    date: DateTime.fromISO('2021-10-06'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        This one deserves its own update: you can at long last{' '}
        <strong>preview a snippet</strong> before running it. Thanks to everyone
        for the feedback! Click the little eye icon, or press{' '}
        <code>Shift + Enter</code>.
      </p>
    ),
    date: DateTime.fromISO('2021-10-01'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        <em>Since you've been gone&hellip;</em> now works for snippets.
        (Finally!) Describe important changes to your team as you make them, and
        Kenchi will help keep everyone on the same page with updates to the
        relevant team members.
      </p>
    ),
    date: DateTime.fromISO('2021-09-30'),
    category: 'Potpourri',
  },
  {
    description: (
      <p>
        Whoops: we added validation to our editor so you can't create snippets
        and playbooks without giving them a name.
      </p>
    ),
    date: DateTime.fromISO('2021-09-10'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        You can already add links, and now you can remove them as well! Click on
        any link in the editor for newly released link options.
      </p>
    ),
    date: DateTime.fromISO('2021-09-10'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        Introducing <strong>Insights</strong>, our brand new analytics toolkit
        to give your team better data about what's working (and what isn't).
        Track snippet and playbook usage, and line that up with CSAT from
        Intercom to incorporate your customer's feedback real-time.
      </p>
    ),
    date: DateTime.fromISO('2021-08-31'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        Growing team? We got you. We improved user management in our dashboard,
        including pagination.
      </p>
    ),
    date: DateTime.fromISO('2021-08-31'),
    category: 'Dashboard',
  },
  {
    description: (
      <p>
        We fixed up a few bugs with our editor: you can now include change
        alerts for <em>Since you've been gone&hellip;</em> with suggested edits,
        and the Publish and Suggest buttons work better for newly created
        drafts.
      </p>
    ),
    date: DateTime.fromISO('2021-08-31'),
    category: 'Editor',
  },
  {
    description: (
      <p>
        You can now quickly access the Collection edit page from the{' '}
        <code>&hellip;</code> menu.
      </p>
    ),
    date: DateTime.fromISO('2021-08-27'),
    category: 'Extension',
  },
  {
    description: (
      <p>
        We got rid of a pesky bug where your mouse pointer could steal focus
        from the search box. Now you can quickly press <code>ctrl + space</code>
        , search for your snippet, and hit enter&mdash;all without looking.
      </p>
    ),
    date: DateTime.fromISO('2021-08-21'),
    category: 'Extension',
  },
];
