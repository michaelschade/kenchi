export type DemoUserData = {
  email: string;
  firstName: string;
  lastName: string;
};

// This is multiplied by `usageMultiple` to decide the max amount of data to
// generate. Weekdays we'll randomly generate between 50% and 100% of this
// value, weekends 0% - 50%.
export const DEFAULT_MAX_DAILY_PLAYBOOK_VIEWS = 4;
export const DEFAULT_MAX_DAILY_SNIPPET_RUNS = 10;

export const DEMO_USERS: DemoUserData[] = [
  {
    email: 'michael@kenchi.team',
    firstName: 'Michael',
    lastName: 'Schade',
  },
  {
    email: 'brian@kenchi.team',
    firstName: 'Brian',
    lastName: 'Krausz',
  },
  {
    email: 'dave@kenchi.team',
    firstName: 'Dave',
    lastName: 'Cole',
  },
  {
    email: 'pantera@kenchi.team',
    firstName: 'Peter',
    lastName: 'Arzhintar',
  },
];

export type DemoWorkflowData = {
  name: string;
  icon: string;
  description: string;
  contents: string;
  usageMultiple?: number;
};

export type DemoToolData = {
  name: string;
  icon: string;
  description: string;
  contents: string;
  usageMultiple?: number;
};

export type DemoCollectionData = {
  name: string;
  icon: string;
  description: string;
  workflows: DemoWorkflowData[];
  tools: DemoToolData[];
};

export const DEMO_COLLECTIONS: DemoCollectionData[] = [
  {
    name: 'Account & Security',
    icon: '🔐',
    description: '',
    workflows: [
      {
        name: '[Tier 1] GDPR Sub Processor FAQ',
        icon: '📃',
        description: '',
        contents: `<p>The General Data Protection Regulation (GDPR) is a regulation of the European Union (EU) that became effective on May 25, 2018. It strengthens and builds on the EU’s current data protection framework, the General Data Protection Regulation (GDPR) replaces the 1995 Data Protection Directive.</p>
<p>The GDPR sets out the rules for how personal data must be collected, processed and stored by organizations operating in the EU. It also establishes new rights for individuals with respect to their personal data.</p>
<p>Organizations that process the personal data of EU citizens must comply with the GDPR unless they can demonstrate that they meet certain conditions.</p>
<h2>What is a Sub Processor?</h2>
<p>A sub processor is a third party that processes personal data on behalf of a controller or processor. A sub processor may be located in the European Union or in a third country.</p>
<p>Under the GDPR, controllers and processors must enter into a written contract with any sub processors they engage. The contract must set out the specific obligations of the sub processor with respect to the personal data being processed.</p>
<p>Organizations that engage sub processors must also ensure that the sub processor does not engage any further sub processors without the prior written authorization of the controller or processor.</p>
<h2>What is the purpose of this document?</h2>
<p>The purpose of this document is to provide a list of GDPR sub processors that support team [Tier 1] uses.</p>
<p>This list will be updated on a regular basis as new sub processors are engaged or as existing sub processors are removed.</p>
<tool tool="GDPR Sub Processor List"></tool>
`,
      },
      {
        name: '[Tier 2] GDPR escalation',
        icon: '🙋‍♂️',
        description: '',
        contents: `<p>This is a guide for the support team on how to escalation GDPR related issues.</p>
<p>If you receive a GDPR related issue, please follow these steps:</p>
<ol>
<li>
  <p>Firstly, try to resolve the issue yourself by requesting more info where appropriate:</p>
  <tool tool="GDPR deletion - need more info"></tool>
  <p>If you are unable to do so, please escalate the issue to your supervisor.</p>
</li>
<li><p>If the supervisor is unable to resolve the issue, they will escalate it to the Privacy team.</p></li>
<li><p>The Privacy team will investigate the issue and determine the best course of action.</p></li>
<li><p>If the Privacy team determines that the issue needs to be escalated further, they will do so to the relevant authorities.</p></li>
</ol>
`,
      },
      {
        name: 'Data Recovery Troubleshooting',
        icon: '🙋‍♂️',
        description: '',
        contents: `<p>This guide is for support team members who need to troubleshoot software data recovery issues.</p>
<p>There are a few things to keep in mind when troubleshooting software data recovery issues:</p>
<ol>
<li><p>Make sure that the software is compatible with the operating system.</p></li>
<li><p>Make sure that the software is up to date.</p></li>
<li><p>Make sure that the data is not corrupted.</p></li>
<li><p>Make sure that the software is configured correctly.</p></li>
<li><p>Make sure that the software is able to read the data from the storage device.</p></li>
<li><p>Make sure that the data is not encrypted.</p></li>
<li><p>Make sure that the software is able to write the data to the storage device.</p></li>
<li><p>Make sure that the software is able to access the internet.</p></li>
<li><p>Make sure that the software is not blocked by a firewall.</p></li>
<li><p>Make sure that the software is not being used by another program.</p></li>
</ol>`,
      },
      {
        name: 'Delete account: duplicate emails',
        icon: '❌',
        description: '',
        contents: `<p>If you come across a duplicate email in a customer's account, you will need to delete one of the emails. Here is a step by step guide on how to do this:</p>
<ol>
<li><p>Login to the customer's account</p></li>
<li><p>Click on the "Email" tab</p></li>
<li><p>Find the duplicate email and click on the "Delete" button</p></li>
<li><p>Confirm the deletion by clicking on the "OK" button</p></li>
</ol><tool tool="Confirm account deletion request"></tool>`,
        usageMultiple: 1.1,
      },
      {
        name: 'Delete account: no duplicates',
        icon: '❌',
        description: '',
        contents: `<p>If a customer requests that their account be deleted, support team members should follow these steps:</p>
<ol>
<li><p>Verify that the customer is requesting their own account be deleted. If the customer is requesting that someone else's account be deleted, support team members should refer them to the appropriate authorities. If you need more info:</p><tool tool="Verify - need additional info"></tool></li>
<li><p>If the customer is requesting their own account be deleted, support team members should take the following steps:</p>
<ul>
<li><p>Log into the account using the customer's credentials.</p></li>
<li><p>Navigate to the account settings page.</p></li>
<li><p>Scroll to the bottom of the page and click on the "Delete Account" button.</p></li>
<li><p>Confirm that the customer wants their account deleted by clicking on the "Delete Account" button again.</p></li>
<li><p>Let the customer know:</p><tool tool="Confirm account deletion request"></tool></li>
<li><p>Once the account has been deleted, support team members should log out of the account.</p></li>
</ul></li>
</ol>`,
      },
      {
        name: 'Disable user analytics',
        icon: '📉',
        description: '',
        contents: `<p>If you need to disable user analytics for a specific user, you can do so by following these steps:</p>
<ol>
<li><p>Log in to our internal admin as a user with admin privileges.</p></li>
<li><p>Navigate to the user's profile page.</p></li>
<li><p>Click the "Edit" button.</p></li>
<li><p>Scroll down to the "User rights" section.</p></li>
<li><p>Uncheck the "enable user analytics" checkbox.</p></li>
<li><p>Click the "Save changes" button.</p></li>
</ol>
<p>That's it! The user will no longer have their user analytics enabled, and their data will not be collected or used for any purpose.</p>
<tool tool="Disable user analytics - how to"></tool>
`,
      },
      {
        name: 'DMCA removal request',
        icon: '🗑',
        description: '',
        contents: `<h2>What is DMCA?</h2>
<p>The Digital Millennium Copyright Act (DMCA) is a U.S. copyright law that protects owners of copyrighted material from online infringement.</p>
<h2>How are DMCA removal request submitted?</h2>
<p>To submit a DMCA removal request, you will need to send a written notice to the service provider that includes the following information:</p>
<ol>
<li><p>Identification of the copyrighted work that you believe has been infringed</p></li>
<li><p>Identification of the material that you believe is infringing and that you want removed</p></li>
<li><p>Your contact information, including your address, telephone number, and email address</p></li>
<li><p>A statement from you that you have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law</p></li>
<li><p>A statement from you, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or are authorized to act on the copyright owner's behalf</p></li>
</ol>
<p>Once you have gathered all of the required information, you can send your DMCA removal request to the service provider's designated copyright agent.</p>
<h2>If this is not a valid DMCA request</h2>
<tool tool="Moderation - policy explanation"></tool>`,
      },
      {
        name: 'Escalation guide',
        icon: '🙋‍♂️',
        description: '',
        contents: `<p>If you are experiencing an issue with a customer that you are unable to resolve, please follow these steps:</p>
<ol>
<li><p>First, try to resolve the issue yourself. If you are unable to do so, please consult with a team member who may be able to assist you.</p></li>
<li><p>If the issue cannot be resolved by the team, it will need to be escalated. To do so, please fill out the Escalation Guide form located on the wiki.</p></li>
<li>
  <p>Once the form has been filled out, please send it to the support team manager for review.</p>
  <tool tool="Angry user escalation"></tool>
  <tool tool="Moderation - escalation"></tool>
</li>
<li><p>The support team manager will review the issue and decide whether or not it needs to be escalated. If it is determined that the issue does need to be escalated, the support team manager will then contact the appropriate department or individual to resolve the issue.</p></li>
</ol>`,
      },
      {
        name: 'GDPR deletion request',
        icon: '🗑',
        description: '',
        contents: `<p>When a customer or user requests that their data be deleted in accordance with GDPR, there are a few steps that must be taken in order to comply with the law. This guide outlines those steps so that the support team can handle GDPR deletion requests efficiently and in accordance with the law.</p>
<ol>
<li><p>Verify that the request is coming from the actual data subject. This can be done by requiring the individual to log in to their account and submit the request through a form or portal that is designed for this purpose. If you need more info:</p><<tool tool="Verify - need additional info"></tool><tool tool="GDPR deletion - need more info"></tool>/li>
<li><p>Once it has been verified that the request is coming from the data subject, the support team must take all reasonable steps to delete the data in question. This may include deleting the data from any backups or logs that are kept, as well as ensuring that any third-party services that have access to the data are also instructed to delete it. If this will take time:</p><tool tool="GDPR deletion - acknowledge"></tool></li>
<li><p>Once the data has been deleted, the support team should confirm this to the individual who made the request. They should also provide information on what steps were taken to delete the data, so that the individual can be confident that their data has been completely removed.</p><tool tool="GDPR deletion - success!"></tool></li>
</ol>`,
      },
      {
        name: 'Recover account',
        icon: '🗑',
        description: '',
        contents: `<p>When a customer contacts support to recover their account, the support team will need to take the following steps:</p>
<ol>
<li>
  <p>Verify the customer's identity. The support team will need to ask the customer for their name, email address, and account username.</p>
  <tool tool="Verify - need additional info"></tool>
</li>
<li>
  <p>Reset the customer's password. The support team will need to generate a new password for the customer and send it to them via email.</p>
  <tool tool="2FA reset"></tool>
</li>
<li>
  <p>Unlock the customer's account. If the customer's account is locked, the support team will need to unlock it.</p>
  <tool tool="Account recovery - success!"></tool>
  <tool tool="Account recovery - needs manual work"></tool>
</li>
<li>
  <p>Restore the customer's data. If the customer's data has been deleted, the support team will need to restore it from backup.</p>
  <tool tool="Account recovery - unable to recover"></tool>
  <tool tool="Account recovery - needs manual work"></tool>
</li>
</ol>
`,
      },
      {
        name: 'Recover content',
        icon: '🗑',
        description: '',
        contents: `<h2>What is Recover content?</h2>
<p>Recover content is a process of retrieving content that has been lost or deleted. This can be done manually or through automated means.</p>
<h2>When should Recover content be used?</h2>
<p>Recover content should be used when content has been lost or deleted and it needs to be retrieved.</p>
<h2>How to Recover content</h2>
<p>There are two ways to Recover content: manually or through automated means.</p>
<h2>Manual Recover content</h2>
<p>If the content is lost or deleted, but you know where it is, you can try to Recover content manually. To do this, you will need to contact the person who created the content and ask them to send you a copy.</p>
<tool tool="Account recovery - needs manual work"></tool>
<h2>Automated Recover content</h2>
<p>If the content is lost or deleted and you do not know where it is, you can try to Recover content through automated means. Automated Recover content can be done through a number of different tools, such as Google Drive or Microsoft OneDrive.</p>
<tool tool="Account recovery - success!"></tool>
<h2>Which method should I use?</h2>
<p>The method you use to Recover content will depend on the situation. If you know where the content is, you can try to Recover content manually. If you do not know where the content is, you can try to Recover content through automated means.</p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Verify & fix permissions',
        icon: '🩺',
        description: '',
        contents: `<p>If you are having trouble verifying or fixing account permissions, this guide will help you get back on track.</p>
<p>There are a few things you need to know before you begin:</p>
<ol>
<li>
  <p>Make sure you have the correct permissions for the account you are trying to fix.</p>
  <tool tool="Verify - need additional info"></tool>
</li>
<li><p>Check that the account is active and not locked.</p></li>
<li><p>If you are still having trouble, contact your administrator for help.</p></li>
</ol>
<p>Now that you have that information, let's get started!</p>
<ol>
<li>
  <p>Log into the account you are having trouble with. If they have 2FA enabled, they will need to help reset it:</p>
  <tool tool="2FA reset"></tool>
</li>
<li><p>Click on the "Settings" tab.</p></li>
<li><p>In the left sidebar, click on "Accounts".</p></li>
<li><p>Find the account you want to fix in the list of accounts and click on it.</p></li>
<li><p>In the "Permissions" section, click on the "Fix Permissions" button.</p></li>
<li><p>You will see a list of permissions that need to be fixed. Click on the "Fix" button next to each one.</p></li>
<li><p>Once all of the permissions have been fixed, click on the "Save" button at the bottom of the page.</p></li>
</ol>
<p>Our customer should now be able to access the account.</p>
<tool tool="Account recovery - success!"></tool>
`,
      },
      {
        name: 'Verify account ownership',
        icon: '🔐',
        description: '',
        contents: `<p>When a customer contacts support to verify ownership of an account, the support team member should:</p>
<ol>
<li>
  <p>Request the customer's account username and email address associated with the account.</p>
  <tool tool="Verify - need additional info"></tool>
</li>
<li><p>Search for the customer's account in the database.</p></li>
<li><p>If the account is found, compare the customer's provided email address with the email address on record for the account.</p></li>
<li>
  <p>If the email addresses match, the customer is the owner of the account. The support team member should provide the customer with the account information.</p>
  <tool tool="Domain verification - approved"></tool>
</li>
<li>
  <p>If the email addresses do not match, the customer is not the owner of the account. The support team member should not provide the customer with the account information.</p>
  <tool tool="Verify - wrong email"></tool>
</li>
</ol>
`,
        usageMultiple: 1.1,
      },
    ],
    tools: [
      {
        name: 'GDPR Sub Processor List',
        icon: '',
        description: '',
        contents: `
<p>Our latest lis of GDPR Sub Processors is:</p>
<p></p>
<ol>
<li><p>Google Analytics</p></li>
<li><p>HubSpot</p></li>
<li><p>Intercom</p></li>
<li><p>Mixpanel</p></li>
<li><p>Salesforce</p></li>
</ol>`,
      },
      {
        name: '2FA reset',
        icon: '📵',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about resetting your 2FA. We are happy to help you with this.</p>
<p></p>
<p>In order to reset your 2FA, please follow these steps:</p>
<p></p>
<ol>
<li><p>Go to our website and log into your account.</p></li>
<li><p>Click on the "Account" tab.</p></li>
<li><p>Under the "Security" section, click on the "2-Factor Authentication" tab.</p></li>
<li><p>Click on the "Reset" button.</p></li>
<li><p>Follow the instructions on the screen to reset your 2FA.</p></li>
</ol>
<p>If you have any further questions or concerns, please do not hesitate to reach out to us. Thank you for being a loyal customer.</p><p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
        usageMultiple: 1.3,
      },
      {
        name: 'Account recovery - needs manual work',
        icon: '♻️',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us. We are sorry to hear that you are having trouble accessing your account.</p>
<p></p>
<p>Unfortunately, account recovery is a manual process that can only be completed by our support team. We would be happy to help you with this, but we will need some information from you first.</p>
<p></p>
<p>Please reply to this message with your full name, date of birth, and the email address associated with your account. Once we have that information, we can begin working on recovering your account for you.</p>
<p></p>
<p>Thank you for your patience and understanding.</p><p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Account recovery - success!',
        icon: '♻️',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us. We were able to recover your account and you should now be able to log in and access your account. If you have any further questions or issues, please don't hesitate to reach out to us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Account recovery - unable to recover',
        icon: '♻️',
        description: '',
        contents: `<p>Thank you for your inquiry <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>. We are sorry to hear that you are having difficulty accessing your account. Unfortunately, we are unable to recover your account for you. We recommend that you create a new account. </p><p></p><p>Thank you for your understanding.</p><p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Confirm account deletion request',
        icon: '❌',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about deleting your account. We're sorry to see you go!</p>
<p></p>
<p>In order to delete your account, please follow the steps below:</p>
<p></p>
<ol>
<li><p>Log in to your account</p></li>
<li><p>Click on the "Settings" tab</p></li>
<li><p>Scroll down to the bottom of the page and click on the "Delete Account" button</p></li>
</ol>
<p>Once you have clicked the "Delete Account" button, your account will be permanently deleted.</p>
<p></p>
<p>We're sorry to see you go and we hope you have a great day.</p><p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Disable user analytics - how to',
        icon: '📉',
        description: '',
        contents: `<p>If you would like to disable user analytics, you can follow these steps:</p>
<p></p>
<ol>
<li><p>Log into your account and go to the "Settings" page.</p></li>
<li><p>Scroll down to the "User Analytics" section and click on the "Disable" button.</p></li>
<li><p>Save your changes.</p></li>
</ol>
<p>User analytics will now be disabled for your account.</p><p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'GDPR deletion - acknowledge',
        icon: '🗑',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for contacting us regarding your GDPR deletion request.</p>
<p></p>
<p>We have received your request and will begin processing it as soon as possible. Please note that it may take up to 30 days for your request to be completed.</p>
<p></p>
<p>Thank you for your patience and understanding.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable></p>`,
      },
      {
        name: 'GDPR deletion - need more info',
        icon: '🗑',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for your inquiry. In order to delete your account in accordance with GDPR regulations, we need more information from you. Please reply to this message with your full name, address, and account number, and we will be happy to process your request.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'GDPR deletion - success!',
        icon: '🗑',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for contacting us about deleting your account in accordance with GDPR. I can confirm that your account has been successfully deleted and all of your data has been removed from our systems.</p>
<p></p>
<p>If you have any further questions or concerns, please do not hesitate to contact us.</p>
<p></p>
<p>Thank you for your cooperation.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'SAML SSO - how to setup',
        icon: '🔐',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Here are the steps to set up SAML SSO:</p>
<p></p>
<ol>
<li><p>Log in to your account and go to the 'Security' tab.</p></li>
<li><p>Click on the 'Set up SAML SSO' button.</p></li>
<li><p>Enter your SAML SSO settings and click 'Save'.</p></li>
<li><p>That's it! You should now be able to log in using SAML SSO.</p></li>
</ol><p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Transfer account owner',
        icon: '➡️',
        description: '',
        contents: `<ol>
<li><p>Log into your account and go to the account settings page</p></li>
<li><p>Scroll down to the "Account Owner" section and click the "Transfer Account Owner" button</p></li>
<li><p>Enter the email address of the new account owner and click the "Transfer" button</p></li>
<li><p>A confirmation email will be sent to the new account owner's email address</p></li>
<li><p>Once the new account owner accepts the transfer, the account ownership will be transferred to them</p></li>
</ol>`,
        usageMultiple: 1.1,
      },
      {
        name: 'Verify - need additional info',
        icon: '🙋‍♂️',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>!</p>
<p></p>
<p>Thank you for reaching out to us. In order to verify your account, we will need some additional information from you. Can you please provide your account number and the email address associated with your account? Once we have that information, we can take a look and see what we can do to verify your account.</p>
<p></p>
<p>Thank you for your time and patience. We look forward to hearing from you soon.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
        usageMultiple: 1.1,
      },
      {
        name: 'Verify - wrong email',
        icon: '🙋‍♂️',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us.</p>
<p></p>
<p>We're sorry to hear that you are having trouble verifying your email address. We would be happy to help you with that.</p>
<p></p>
<p>First, please make sure that you are entering the correct email address. If you are, then please try again and be sure to use the correct verification code.</p>
<p></p>
<p>If you are still having trouble, please feel free to contact us for further assistance.</p>
<p></p>
<p>Thank you for your patience and for using our service.</p><p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
    ],
  },
  {
    name: 'Billing',
    description: '',
    icon: '💸',
    workflows: [
      {
        name: 'Billing escalation process',
        icon: '🙋‍♂️',
        description: '',
        contents: `<p>If a customer contacts our support team with a billing issue, the following process should be followed:</p>
<ol>
<li><p>First, try to resolve the issue directly with the customer. If you are able to do so, great! If not, proceed to step 2.</p></li>
<li><p>Escalate the issue to a senior customer support representative. They will reach out to the customer and try to resolve the issue.</p></li>
<li><p>If the senior customer support representative is unable to resolve the issue, they will escalate it to our billing department.</p></li>
<li><p>The billing department will reach out to the customer and try to resolve the issue.</p></li>
<li><p>If the billing department is unable to resolve the issue, they will escalate it to our accounting department.</p></li>
<li><p>The accounting department will reach out to the customer and try to resolve the issue.</p></li>
<li><p>If the accounting department is unable to resolve the issue, they will escalate it to our legal department.</p></li>
<li><p>The legal department will reach out to the customer and try to resolve the issue.</p></li>
<li><p>If the legal department is unable to resolve the issue, the customer will be advised to seek legal counsel on their own.</p></li>
</ol>`,
      },
      {
        name: 'Change billing frequency',
        icon: '🎢',
        description: '',
        contents: `<p>If a customer would like to change their billing frequency, the customer support team should follow these steps:</p>
<ol>
<li>
  <p>Verify their account:</p>
  <tool tool="Verify - need additional info"></tool>
  <tool tool="Verify - wrong email"></tool>
</li>
<li><p>Log into the customer's account in the customer management system.</p></li>
<li><p>Locate the customer's billing information.</p></li>
<li><p>Change the billing frequency to the desired frequency.</p></li>
<li><p>Save the changes.</p></li>
<li><p>Notify the customer of the change.</p></li>
</ol>`,
      },
      {
        name: 'Changing account plan (downgrade, upgrade, & non-profit credit) ',
        icon: '',
        description: '',
        contents: `<h2>Overview</h2>
<p>The process for changing a customer's account plan is simple, but there are a few things to keep in mind to ensure a smooth transition. This guide will walk you through the steps of changing a customer's account plan, as well as some common issues that can arise.</p>
<ol>
<li><p>Log into the customer's account in the billing system.</p></li>
<li><p>Locate the account plan that the customer is currently on.</p></li>
<li><p>Select the new account plan that the customer should be switched to.</p></li>
<li><p>Enter the billing information for the new account plan.</p></li>
<li><p>Save the changes.</p></li>
</ol>
<h2>The customer accidentally upgraded</h2>
<tool tool="Accidental upgrade - enterprise"></tool>
<tool tool="Accidental upgrade - large payment"></tool>
<tool tool="Accidental upgrade - VAT refunds"></tool>
<h2>The customer's billing information is outdated.</h2>
<p>If the customer's billing information is outdated, you will need to update it before proceeding with the account plan change.</p>
<tool tool="Decline - expired card"></tool>
<h2>The customer does not have enough credit to switch to the new plan.</h2>
<p>If the customer does not have enough credit to switch to the new account plan, you will need to either downgrade the account plan or provide the customer with a credit to cover the difference.</p>
<tool tool="Refund - credit to account"></tool>
<h2>The customer's account is past due.</h2>
<p>If the customer's account is past due, you will need to either downgrade the account plan or provide the customer with a credit to cover the outstanding balance.</p>
<tool tool="Refund - credit to account"></tool>
<tool tool="Decline - FAQ"></tool>
<h2>The customer is not eligible for the new account plan.</h2>
<p>If the customer is not eligible for the new account plan, you will need to downgrade the account plan.</p>
<tool tool="Qualification - company size"></tool>
`,
      },
      {
        name: 'Discounts & Coupons',
        icon: '🎟',
        description: '',
        contents: `<p>Billing is one of the most important aspects of customer support. It is important to be clear and concise when communicating with customers about billing. The following guide will help customer support representatives with billing inquiries:</p>
<p>The best way to handle discounts and coupons is to have a clear and concise policy in place. The following are some tips for handling discounts and coupons:</p>
<ul>
<li>
  <p>Confirm a customer's eligibility:</p>
  <tool tool="Qualification - startup incubator"></tool>
  <tool tool="Qualification - non-profit status"></tool>
  <tool tool="Qualification - company size"></tool>
  <tool tool="Qualification - use case"></tool>
</li>
<li>
  <p>Be clear about the terms and how the discount works when you apply it:</p>
<tool tool="Billing - startup rate applied"></tool>
<tool tool="Billing - volume rate approved"></tool>
<tool tool="Non-profit - approved"></tool>
</li>
<li><p>Make sure the customer understands the terms and conditions of the discount or coupon.</p></li>
<li><p>Do not apply the discount or coupon unless the customer explicitly asks for it.</p></li>
<li><p>Be transparent about the discount or coupon code. Do not try to hide it in the fine print.</p></li>
<li><p>Do not offer a discount or coupon unless you are certain the customer will use it.</p></li>
<li><p>Do not offer a discount or coupon that is not applicable to the customer's purchase.</p></li>
<li><p>Make sure the discount or coupon is applied correctly to the customer's account.</p></li>
<li><p>Do not apply a discount or coupon retroactively.</p></li>
<li><p>Do not offer a discount or coupon that is not authorized by the company.</p></li>
</ul>`,
      },
      {
        name: 'Find customer in Stripe',
        icon: '💳',
        description: '',
        contents: `<p>There are a few ways to locate a specific customer in Stripe:</p>
<ol>
<li><p>If you have the customer's email address, you can search for them in the Stripe Dashboard by entering it into the search bar.</p></li>
<li><p>If you have the customer's Stripe ID, you can enter it into the search bar. The Stripe ID is a unique identifier that is generated for each customer.</p></li>
<li><p>If you have the customer's card number, you can enter it into the search bar. This will bring up the customer's card information, and you can then click on the customer's name to be taken to their customer profile.</p></li>
<li><p>If you have a general idea of when the customer signed up or made their last payment, you can use the Date Range feature in the Stripe Dashboard to narrow down your search. Simply click on the Date Range drop-down menu and select the appropriate time frame.</p></li>
</ol>
`,
      },
      {
        name: 'Non-profits: codes, qualification, and FAQ',
        icon: '',
        description: '',
        contents: `<h2>What is a Non-profit?</h2>
<p>A non-profit is a organization that uses its surplus revenue to achieve its goals, rather than distributing it's surplus to shareholders or owners. The main purpose of a non-profit is to benefit the public, rather than private interests.</p>
<h2>What are the codes for Non-profits?</h2>
<p>There are a few different codes that are typically used for non-profits. These include the 501(c)(3) code, which is the most common, as well as the 509(a) and 170(b)(1)(A)(vi) codes.</p>
<h2>What are the qualification for Non-profits?</h2>
<p>To qualify as a non-profit, an organization must be organized and operated for one or more of the following purposes: religious, charitable, educational, scientific, literary, testing for public safety, fostering national or international amateur sports competition, or preventing cruelty to children or animals. Additionally, non-profits must not be organized for profit or gain, and must be exempt from federal and state taxes.</p>
<h2>For pricing discounts</h2>
<tool tool="Qualification - non-profit status"></tool>
<tool tool="Non-profit - need more info"></tool>
<tool tool="Non-profit - approved"></tool>
<h2>What are some common FAQ about Non-profits?</h2>
<ul>
<li><p>How do I start a non-profit?</p></li>
<li><p>How do I get 501(c)(3) status?</p></li>
<li><p>How do I register my non-profit?</p></li>
<li><p>What are the benefits of starting a non-profit?</p></li>
<li><p>What are the requirements for maintaining non-profit status?</p></li>
<li><p>What are some common pitfalls of starting a non-profit?</p></li>
</ul>
`,
      },
      {
        name: 'Non-profits: verifying applications',
        icon: '',
        description: '',
        contents: `<p>There are a few ways to verify if a customer qualifies for the non-profit discount.</p>
<ol>
<li>
  <p>check if the customer is registered as a non-profit organization with the IRS. The IRS has a searchable database of organizations that are registered as non-profits.</p>
  <tool tool="Qualification - non-profit status"></tool>
</li>
<li><p>check if the customer has a 501(c)(3) designation. This designation is given to organizations that are exempt from federal taxes.</p></li>
<li><p>check if the customer is registered as a non-profit organization with the state in which they are located. Each state has different requirements for registering as a non-profit, so the best way to check is to search for the organization on the state's website.</p></li>
</ol>
<p>If we aren't sure if the customer qualifies, we need to ask for supporting documentation:</p>
<tool tool="Non-profit - need more info"></tool>
<p>If they already provided this info, you can apply the discount:</p>
<tool tool="Non-profit - approved"></tool>
`,
      },
      {
        name: 'Payment declined',
        icon: '💳',
        description: '',
        contents: `<p>If a customer's payment declines, there are a few things that our customer support team can do to help troubleshoot the issue.</p>
<p>First, they should ask the customer if they have tried to retry the payment. If the customer has not tried to retry the payment, they should encourage them to do so. If the payment still declines, the customer support team can ask the customer for more details about the decline. They should also check to see if the customer's billing information is up to date.</p>
<tool tool="Decline - FAQ"></tool>
<p>If the customer's payment declines and they have tried to retry the payment, the customer support team can ask the customer for more details about the decline. They should also check to see if the customer's billing information is up to date. If the customer's billing information is not up to date, they should update it and then retry the payment.</p>
<tool tool="Decline - expired card"></tool>
<p>If the payment still declines after the customer has tried to retry it and their billing information is up to date, the customer support team can reach out to the customer's bank or credit card company to ask why the payment was declined. They may be able to provide more information that can help troubleshoot the issue.</p>
<p>Once the customer support team has gathered all of the information they can, they can reach out to the customer with a resolution.</p>`,
      },
      {
        name: 'Refund troubleshooting',
        icon: '💳',
        description: '',
        contents: `<p>If a customer reports that they have not received a refund that they were expecting, the customer support team should take the following steps:</p>
<ol>
<li>
  <p>First, check to see if the refund has been processed by the company. This can typically be done by logging into the company's refund system or by checking with the finance department.</p>
  <tool tool="Refund - reference number"></tool>
</li>
<li><p>If the refund has been processed, the next step is to check with the customer's bank to see if the refund has been received and posted to the account.</p></li>
<li><p>If the refund is not showing up in the customer's bank account, the next step is to contact the bank to see if there is any information they can provide on the refund.</p></li>
<li>
  <p>If the bank is unable to provide any information on the refund, the next step is to contact the company that issued the refund to see if they can provide any information on the status of the refund.</p>
  <tool tool="Refund - reference number"></tool>
</li>
<li><p>If the company is unable to provide any information on the refund, the next step is to contact the customer's credit card company to see if they can provide any information on the refund.</p></li>
<li>
  <p>If the credit card company is unable to provide any information on the refund, the next step is to escalate the issue to a supervisor or manager. You can also provide a credit until resolved:</p>
  <tool tool="Refund - credit to account"></tool>
</li>
</ol>
`,
      },
      {
        name: 'Sales or Enterprise triage checklist',
        icon: '📝',
        description: '',
        contents: `<p>The following is a guide to help you determine whether or not a company is a good enterprise sales prospect. This guide includes three main criteria: target market size, employee count, and geographic availability.</p>
<h2>Target Market Size:</h2>
<p>To be a good enterprise sales prospect, the company must have a target market size of at least $100 million. This ensures that there is enough potential revenue to justify the cost of a sales team.</p>
<p>They could also be a vetted startup:</p>
<tool tool="Qualification - startup incubator"></tool>
<h2>Employee Count:</h2>
<p>To be a good enterprise sales prospect, the company must have at least 1,000 employees. This ensures that there is a large enough potential customer base to justify the cost of a sales team.</p>
<tool tool="Qualification - company size"></tool>
<h2>Geographic Availability:</h2>
<p>To be a good enterprise sales prospect, the company must be available in at least 10 countries. This ensures that there is a large enough potential customer base to justify the cost of a sales team.</p>
<h2>Other Info:</h2>
<p>If they do qualify, learn more about who they are to help our kickoff call:</p>
<tool tool="Qualification - use case"></tool>
`,
      },
      {
        name: 'Tax/VAT escalations',
        icon: '💸',
        description: '',
        contents: `<h2>What is a Tax/VAT Escalation?</h2>
<p>A Tax/VAT Escalation is when a customer contacts us to dispute a tax/VAT charge that has been applied to their account.</p>
<tool tool="VAT - intro explanation"></tool>
<tool tool="VAT - additional detail"></tool>
<h2>What are the common causes of Tax/VAT Escalations?</h2>
<p>There are a few common causes of Tax/VAT Escalations:</p>
<ul>
  <li><p>The customer is based in a country where tax/VAT is not applicable</p></li>
  <li><p>The customer has already paid tax/VAT on the subscription/purchase</p></li>
  <li><p>The tax/VAT rate applied is incorrect</p></li>
  <li><p>The customer is exempt from paying tax/VAT</p></li>
</ul>
<h2>How do we resolve Tax/VAT Escalations?</h2>
<p>There are a few steps that need to be followed in order to resolve a Tax/VAT Escalation:</p>
<ol>
<li>
  <p>Collect all of the relevant information from the customer</p>
  <tool tool="VAT - Need additional info"></tool>
  <tool tool="VAT - number request"></tool>
  <p>This includes:</p>
  <ul>
  <li><p>The subscription/purchase details</p></li>
  <li><p>The tax/VAT invoice</p></li>
  <li><p>Any proof of payment of tax/VAT (if applicable)</p></li>
  </ul>
</li>
<li>
  <p>Verify the customer's information</p>
  <p>This involves checking the customer's information against our records to see if there are any discrepancies.</p>
  <tool tool="VAT - Confirm setup"></tool>
</li>
<li>
  <p>Escalate the issue to the relevant team</p>
  <ul>
    <li>
      <p>If we are able to confirm that the customer is entitled to a refund, we will escalate the issue to the Finance team in order to process the refund.</p>
      <tool tool="Accidental upgrade - VAT refunds"></tool>
    </li>
    <li>
      <p>If we are unable to confirm that the customer is entitled to a refund, we will escalate the issue to the Tax/VAT team in order to investigate further.</p>
      <tool tool="VAT - additional detail"></tool>
    </li>
  </ul>
</li>
<li><p>Follow up with the customer. Once the issue has been escalated, we will follow up with the customer to keep them updated on the status of their refund.</p></li>
</ol>`,
        usageMultiple: 1.1,
      },
      {
        name: 'Tax/VAT FAQ',
        icon: '💸',
        description: '',
        contents: `<p>This internal wiki guide is for the support team and covers billing-related questions on tax and value-added tax (VAT).</p>
<h2>What is tax?</h2>
<p>Tax is a mandatory financial charge or some other type of levy imposed upon a taxpayer (an individual or legal entity) by a governmental organization in order to fund various public expenditures. A failure to pay, along with evasion of or resistance to taxation, is punishable by law.</p>
<h2>What is value-added tax (VAT)?</h2>
<p>Value-added tax (VAT) is a consumption tax levied on the sale of goods and services. It is imposed at each stage of the production and distribution process, from the initial purchase of raw materials to the final sale of the finished product. The tax is typically calculated as a percentage of the selling price of the good or service.</p>
<h2>What are the different types of taxes?</h2>
<p>There are many different types of taxes, but the most common are income taxes, sales taxes, property taxes, and corporate taxes. Other less common types of taxes include sin taxes (e.g. on alcohol and tobacco), import/export taxes, and payroll taxes.</p>
<h2>How does taxation work?</h2>
<p>Taxation works by levying a financial charge on taxpayers. The charge is typically calculated as a percentage of the taxpayer's income, sales, property value, or assets. The taxpayer is then required to pay the tax to the government.</p>
<h2>What are the different types of tax systems?</h2>
<p>There are many different types of tax systems, but the most common are progressive, regressive, and proportional.</p>
<p>Progressive tax systems tax individuals at higher rates as their income increases. This type of system is often used to fund social welfare programs.</p>
<p>Regressive tax systems tax individuals at lower rates as their income increases. This type of system is often used to fund flat-rate government programs like national defense.</p>
<p>Proportional tax systems tax individuals at the same rate regardless of their income. This type of system is often used to fund specific government programs or services.</p>
<h2>What is the difference between a tax and a fee?</h2>
<p>A tax is a mandatory financial charge imposed by the government, while a fee is a voluntary charge imposed by a private entity.</p>
`,
        usageMultiple: 1.1,
      },
    ],
    tools: [
      {
        name: 'Accidental upgrade - enterprise',
        icon: '',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about your accidental upgrade to our business plan. We are sorry for any confusion or inconvenience this may have caused. We would be happy to help you downgrade your plan back to the enterprise plan.</p>
<p></p>
<p>To downgrade your plan, please follow the steps below:</p>
<p></p>
<ol>
<li><p>Log in to your account</p></li>
<li><p>Click on the "Billing" tab</p></li>
<li><p>Select the "Downgrade" option next to your current plan</p></li>
<li><p>Choose the "Enterprise" plan from the drop-down menu</p></li>
<li><p>Click on the "Downgrade" button</p></li>
</ol>
<p>If you have any further questions or concerns, please do not hesitate to contact us. Thank you for choosing our product.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Accidental upgrade - large payment',
        icon: '',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us. We're sorry to hear that you accidentally upgraded your account and made a larger payment than you intended.</p>
<p></p>
<p>We can certainly refund the difference between the two payments, and we will also make sure that your account is downgraded to the correct level.</p>
<p></p>
<p>Please let us know if there is anything else we can do to help.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Accidental upgrade - VAT refunds',
        icon: '',
        description: '',
        contents: `<p>Thank you for reaching out to us about your accidental upgrade. We are sorry for any inconvenience this may have caused.</p>
<p></p>
<p>We would be happy to refund you for the VAT charged on the upgrade. Please provide us with your VAT invoice and we will process the refund for you.</p>
<p></p>
<p>If you have any further questions or concerns, please do not hesitate to contact us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'ACH - Received confirmation',
        icon: '🏦',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us. We can confirm that we have received your ACH payment and it is being processed. We will notify you once the payment has been processed and your account has been updated.</p>
<p></p>
<p>Thank you for your patience and thank you for using our product.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'ACH - Need additional info',
        icon: '🏦',
        description: '',
        contents: `<p>Thank you for reaching out to us, <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>. In order to better assist you, could you please provide additional information about your inquiry? Are you having trouble setting up ACH payment methods? Are you experiencing issues with ACH payments? Are you looking for more information about our ACH payment process? Please let us know and we will be happy to help. Thank you!</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'ACH - Failed/missing payment alert',
        icon: '',
        description: '',
        contents: `<p>Thank you for reaching out to us about your failed/missing payment. We are sorry to hear that you are having trouble with your payment and we would be happy to help you sort it out.</p>
<p></p>
<p>There are a few reasons why your payment may have failed or gone missing. The first reason is that the payment may not have gone through your bank. This can happen for a number of reasons, such as if you do not have enough funds in your account or if your bank is having technical difficulties. If this is the case, we recommend that you try to make the payment again or contact your bank to see if there is anything they can do to help.</p>
<p></p>
<p>Another reason why your payment may have failed is that the information you entered when you made the payment may have been incorrect. This can happen if you accidentally entered the wrong account number or routing number. If this is the case, we recommend that you try to make the payment again with the correct information.</p>
<p></p>
<p>If you are still having trouble making a payment, please do not hesitate to contact us and we will be happy to help you further. Thank you for being a customer and we hope that you have a great day.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'VAT - Confirm setup',
        icon: '💸',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thanks for signing up! I can confirm that the VAT has been added to your account and you will be able to see it on your next invoice. Thank you for your patience and understanding as we work to get this sorted out.</p>
<p></p>
<p>If you have any other questions or concerns, please don't hesitate to reach out to us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'VAT - Need additional info',
        icon: '💸',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We're happy to help you get started with this process. VAT is a value added tax that is applied to certain goods and services in the European Union. In order to comply with EU VAT laws, businesses must register for a VAT number and charge VAT on their products and services.</p>
<p></p>
<p>There are a few things to keep in mind when setting up VAT for your SaaS product. First, you will need to register for a VAT number with the EU. You can find more information on how to do this here: [link to VAT registration website]. Once you have a VAT number, you will need to add it to your account settings in your SaaS product.</p>
<p></p>
<p>Once you have registered for a VAT number and added it to your account, you will need to start charging VAT on your products and services. You can find more information on how to do this here: [link to VAT charging website].</p>
<p></p>
<p>Thank you for your time and we hope this helps. If you have any further questions, please do not hesitate to reach out to us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Decline - FAQ',
        icon: '💳',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about your declined credit card. We're sorry to hear that you're having trouble using your card.</p>
<p></p>
<p>There are a few reasons why your card may have been declined. One possibility is that the billing address you have on file with your credit card company doesn't match the address you entered when you were trying to make your purchase.</p>
<p></p>
<p>Another possibility is that your credit card company has flagged your account as being potentially fraudulent. If this is the case, you'll need to contact your credit card company to resolve the issue.</p>
<p></p>
<p>We understand that it can be frustrating to have your credit card declined. We hope that this information is helpful and that you'll be able to resolve the issue with your credit card company soon.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
        usageMultiple: 1.1,
      },
      {
        name: 'Decline - expired card',
        icon: '💳',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us. We're sorry to hear that your credit card has expired and you're having difficulty updating your payment information. We understand how important it is to keep your account current, and we're happy to help you through this process.</p>
<p></p>
<p>To update your credit card information, please log in to your account and click on the "Billing" tab. Then, click on the "Update Credit Card" button and enter your new credit card information. Once your new credit card information has been entered, click on the "Update" button to save your changes.</p>
<p></p>
<p>If you have any further questions or concerns, please don't hesitate to contact us. We're always happy to help.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Plan downgrade - success (with refund)',
        icon: '⬇️',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about your plan downgrade. We are sorry to hear that you were not satisfied with your previous plan and that you experienced some trouble with the process.</p>
<p></p>
<p>We are happy to report that your downgrade was successful and that you have been credited for the inconvenience. We hope that you will be happy with your new plan and that you will continue to use our service.</p>
<p></p>
<p>Thank you for your patience and for being a loyal customer.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Non-profit - approved',
        icon: '',
        description: '',
        contents: `<p>We are happy to let you know that you have been approved for Non-profit pricing. This means that you will be able to receive a discounted rate on your products and services. We are committed to supporting Non-profits and are happy to be able to offer this discount to you. If you have any questions or need any assistance, please do not hesitate to let us know. Thank you for your support of Non-profits and we look forward to continuing to support you in your work.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Non-profit - need more info',
        icon: '',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about our Non-profit pricing. We are happy to help!</p>
<p></p>
<p>We offer a special discounted rate for Non-profit organizations. We understand that these organizations often have limited budgets, so we want to help them get the most out of our products.</p>
<p></p>
<p>I've listed our non-profit pricing in your account. To qualify for this pricing, please provide us with proof of your 501(c)(3) status. We will then review your request and get back to you as soon as possible.</p>
<p></p>
<p>Thank you for your interest in our products and we hope that you will take advantage of our special Non-profit pricing. If you have any further questions, please do not hesitate to contact us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Refund - credit to account',
        icon: '💰',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for contacting us about your billing issue. We are sorry to hear that you were unhappy with the charge to your account. We can certainly understand how this could be confusing and frustrating.</p>
<p></p>
<p>We can see that the charge in question was for a subscription to our service. Our records show that this subscription was purchased on June 1st and was set to automatically renew on a monthly basis.</p>
<p></p>
<p>We can refund the charge to your account if you would like, but we would also like to offer some additional information that may be helpful.</p>
<p></p>
<p>If you have any questions or concerns about your subscription, or if you would like to cancel it, please do not hesitate to contact us. We would be more than happy to assist you.</p>
<p></p>
<p>Thank you for choosing our service.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Refund - ACH',
        icon: '💰',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us regarding your refund.</p>
<p></p>
<p>We are sorry to hear that you are not satisfied with your purchase and would like a refund. We would be happy to process a refund for you.</p>
<p></p>
<p>Please note that it may take up to 5-10 business days for the refund to appear on your account. If you have any further questions or concerns, please do not hesitate to let us know.</p>
<p></p>
<p>Thank you for your patience and understanding.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Refund - reference number',
        icon: '💰',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about your refund. I'm sorry to hear that you haven't received it yet. I can certainly understand how frustrating that can be.</p>
<p></p>
<p>I can see from our records that your refund was processed on our end last week. Unfortunately, once a refund is processed, it is up to the financial institution to post the refund to your account. This can sometimes take a few business days.</p>
<p></p>
<p>If you still haven't received your refund after a few business days, I would recommend contacting your financial institution directly to inquire about the status of the refund. They will be able to give you more information about when you can expect to see the refund in your account.</p>
<p></p>
<p>I apologize for any inconvenience this may have caused. If you have any other questions or concerns, please don't hesitate to let us know.</p>
<p></p>
<p>Thank you for your patience.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'VAT - intro explanation',
        icon: '💸',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us! In general, VAT is a tax that is levied on the sale of goods and services in the European Union. The current VAT rate in the EU is 20%. However, there are some exceptions to this rule. For example, VAT does not apply to the sale of digital goods, such as e-books, online courses, or software. Additionally, VAT does not apply to the sale of goods that are shipped outside of the EU.</p>
<p></p>
<p>If you have any other questions about VAT, or anything else, please don't hesitate to reach out to us. We're always happy to help.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'VAT - additional detail',
        icon: '💸',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about VAT. We are happy to provide some information about VAT and how it works with our service.</p>
<p></p>
<p>VAT, or value-added tax, is a tax that is levied on the value of goods and services. In many countries, VAT is levied on the sale of goods and services, and the amount of tax is based on the value of the good or service. VAT is typically a percentage of the sale price, and the rate can vary depending on the country.</p>
<p></p>
<p>In the European Union, VAT is levied on the sale of goods and services within the EU. The rate of VAT varies from country to country, and the amount of tax that is due is based on the value of the good or service. For example, in Germany the VAT rate is 19%, and in the Netherlands the VAT rate is 21%.</p>
<p></p>
<p>If you are a business that sells goods or services within the EU, you are required to charge VAT on your sales. You will then need to remit the VAT to the tax authority in the country where the sale took place. For example, if you are a German business and you sell a good or service to a customer in the Netherlands, you will need to charge Dutch VAT on the sale and remit the VAT to the Dutch tax authorities.</p>
<p></p>
<p>If you are a business that sells goods or services outside of the EU, you are not required to charge VAT on your sales. However, you may be required to remit VAT to the tax authority in the country where the sale took place. For example, if you are a German business and you sell a good or service to a customer in the United States, you will not need to charge VAT on the sale, but you may need to remit VAT to the US tax authorities.</p>
<p></p>
<p>Thank you for your question. If you have any further questions, please do not hesitate to contact us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'VAT - number request',
        icon: '💸',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We are happy to help you with this request. A VAT number is a unique identifier that is assigned to businesses by the government in order to collect VAT.</p>
<p></p>
<p>In order to obtain a VAT number, you will need to contact your local tax authority and request one. Once you have obtained a VAT number, you will need to provide it to us so that we can process your request.</p>
<p></p>
<p>Thank you for your cooperation. We look forward to assisting you further.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'VAT - verified',
        icon: '💸',
        description: '',
        contents: `<p>Thanks for reaching out! We can confirm that your VAT is verified and you should be all set. If you have any further questions or concerns, please don't hesitate to reach out. We're always happy to help!</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
    ],
  },
  {
    name: 'Enterprise & AM',
    description: '',
    icon: '💼',
    workflows: [
      {
        name: 'Advanced roles, groups, & permissions',
        icon: '',
        description: '',
        contents: `<p>Welcome to the enterprise & account managed account features guide for the support team. This guide will cover the following topics:</p>
<h2>Advanced roles:</h2>
<p>There are three advanced roles that can be assigned to users in an enterprise or account managed account: Administrator, Manager, and Member.</p>
<p>Administrators have full access to all features and settings in an enterprise or account managed account. They can add and remove users, change account settings, and create and manage groups.</p>
<p>Managers have access to most features and settings in an enterprise or account managed account. They can add and remove users, change account settings, and create and manage groups. They cannot, however, delete the account or change the billing settings.</p>
<p>Members have limited access to an enterprise or account managed account. They can view account settings and groups, but cannot make any changes.</p>
<h2>Groups:</h2>
<p>Groups are a way to organize users in an enterprise or account managed account. Groups can be used to control access to features and data, and to make it easier to manage large numbers of users.</p>
<p>There are two types of groups: static and dynamic. Static groups are created by an administrator or manager, and cannot be changed by members. Dynamic groups are created by members, and can be changed by anyone in the group.</p>
<p>Static groups are typically used to control access to features and data. For example, an administrator might create a static group for all users who should have access to a certain feature.</p>
<p>Dynamic groups are typically used to make it easier to manage large numbers of users. For example, a manager might create a dynamic group for all users in a certain department.</p>
<h2>Permissions:</h2>
<p>Permissions control what users can do in an enterprise or account managed account. There are four types of permissions: read, write, execute, and delete.</p>
<p>Read permissions allow a user to view data. Write permissions allow a user to edit data. Execute permissions allow a user to run programs. Delete permissions allow a user to delete data.</p>
<p>Permissions can be assigned to users or groups. When a permission is assigned to a group, all members of that group will have the permission. When a permission is assigned to a user, only that user will have the permission.</p>
<p>To assign permissions, an administrator or manager must first create a group. Then, they can add users to the group and assign permissions to the group.</p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Audit log - beta access',
        icon: '🕵️‍♀️',
        description: '',
        contents: `<p>Audit logs are an important part of keeping your enterprise account secure. They provide a record of all login activity, so you can see when someone logs in, what they do while they're logged in, and when they log out. This guide will explain the new enterprise and account managed account features for audit logs.</p>
<h2>Enterprise Accounts</h2>
<p>Audit logs for enterprise accounts are now available in the Admin Console. To view the audit logs, go to Admin Console > Security > Audit Logs.</p>
<p>The audit logs will show you the date and time of each login, the IP address used, the browser used, and the activity that was performed.</p>
<h2>Account Managed Accounts</h2>
<p>Audit logs for account managed accounts are now <strong>available in beta</strong> in the Account Manager. To view the audit logs, go to Account Manager > Security > Audit Logs.</p>
<p>If the user has a verified account, you can now add them to the beta:</p>
<tool tool="Audit log - beta approved"></tool>
<p>The audit logs will show you the date and time of each login, the IP address used, the browser used, and the activity that was performed.</p>
<h2>Alerts</h2>
<p>Both enterprise and account managed accounts have the same features for audit logs. However, account managed accounts have an additional feature that allows you to set up alerts for certain activities. For example, you can set up an alert so that you're notified whenever someone logs in from a new IP address.</p>
<p>To set up an alert, go to Account Manager > Security > Audit Logs, and then click the "Alerts" tab. From there, you can create a new alert and specify the conditions that will trigger it.</p>
<tool tool="Audit log - alerts setup"></tool>
<h2>CSV exports</h2>
<tool tool="Audit log - CSV exports"></tool>
`,
      },
      {
        name: 'Deprovisioning legacy accounts',
        icon: '',
        description: '',
        contents: `<p>When an account is no longer needed, it is important to de-provision it in order to prevent unauthorized access and to free up resources. De-provisioning an account involves revoking all permissions and access associated with the account, and then deleting the account.</p>
<p>In order to de-provision an account, follow these steps:</p>
<ol>
<li><p>Revoke all permissions and access associated with the account. This includes revoking any access keys, deleting any security credentials, and removing the account from any groups or roles.</p></li>
<li>
  <p>Delete the account. This can be done through the customer support portal or by contacting customer support.</p>
<tool tool="Confirm account deletion request"></tool>
</li>
<li><p>Once the account has been deleted, be sure to remove any lingering traces of the account from your system. This includes removing any entries in your directory service, deleting any files or data associated with the account, and un-linking any third-party accounts.</p></li>
<li><p>Finally, notify the account owner that the account has been de-provisioned and that they will no longer have access to any resources.</p></li>
</ol>`,
      },
      {
        name: 'Domain Verification Process',
        icon: '🔐',
        description: '',
        contents: `<p>The Domain Verification Process is a new process that all customers must go through in order to verify their domain. This process is necessary in order to ensure that all customers are using a valid and authorized domain.</p>
<p>The Domain Verification Process consists of two steps:</p>
<ol>
<li><p>The customer must first verify their domain through the Domain Verification Process website.</p></li>
<li><p>Once the domain has been verified, the customer must then add a DNS TXT record to their domain in order to complete the verification process.</p></li>
</ol>
<p>In order to verify their domain, customers must first visit the Domain Verification Process website and enter their domain name. They will then be prompted to select their registrar from a list of registrars. Once the registrar has been selected, the customer will be given instructions on how to verify their domain.</p>
<p>Once the domain has been verified, the customer must then add a DNS TXT record to their domain. The DNS TXT record must be added to the following subdomain: _domainverification.</p>
<p>The TXT record must contain the following value:</p>
<p>domain-verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</p>
<p>Once the DNS TXT record has been added, the customer's domain will be verified and they will be able to use their domain.</p>
`,
      },
      {
        name: 'Onboarding new account',
        icon: '🎓',
        description: '',
        contents: `<p>In order to provide the best possible service to our customers, it is important that new accounts are set up correctly in Salesforce. This guide will provide you with the steps necessary to correctly onboard a new account and set it up in Salesforce.</p>
<ol>
<li><p>The first step is to create a new customer record in Salesforce. This can be done by navigating to the "Customers" tab and clicking on the "New" button.</p></li>
<li><p>Fill out the required fields on the customer record. Be sure to include the customer's name, contact information, and any relevant account details.</p></li>
<li><p>Once the customer record has been created, the next step is to create a new contact record for the customer. This can be done by navigating to the "Contacts" tab and clicking on the "New" button.</p></li>
<li><p>Fill out the required fields on the contact record. Be sure to include the customer's name, contact information, and any relevant account details.</p></li>
<li><p>Once the contact record has been created, the next step is to create a new task in Salesforce. This can be done by navigating to the "Tasks" tab and clicking on the "New" button.</p></li>
<li><p>In the "Subject" field, enter the name of the customer you are onboarding.</p></li>
<li><p>In the "Due Date" field, enter the date that you would like the account to be set up in Salesforce.</p></li>
<li><p>In the "Description" field, enter any relevant details about the account that you need to remember.</p></li>
<li><p>Click on the "Save" button to create the task.</p></li>
<li><p>The final step is to assign the task to the relevant team member. This can be done by clicking on the "Edit" button for the task and then selecting the team member's name from the "Assigned To" drop-down menu.</p></li>
</ol>
<p>Following these steps will ensure that new accounts are correctly set up in Salesforce and that our customers receive the best possible service.</p>`,
      },
      {
        name: 'SAML SSO Configuration',
        icon: '🔐',
        description: '',
        contents: `<p>SAML SSO (Single Sign On) allows users to authenticate to a web application using an external identity provider. In order to setup SAML SSO in our dashboard, users will need to first create a SAML application in their identity provider. Once the SAML application is created, users will need to generate a SAML certificate and add it to the SAML application. Finally, users will need to add the SAML application to our dashboard and configure the SAML settings.</p>
<h2>Prerequisites</h2>
<p>First, ensure the customer is on a plan that supports SSO. If not, and they agree to upgrade, confirm the billing change:</p>
<tool tool="Billing - SSO enabled"></tool>
<p>If they seem very technical, you can give them the deep dive onboarding:</p>
<tool tool="SAML SSO setup"></tool>
<p>Otherwise, we have a simplified version:</p>
<tool tool="SAML SSO - how to setup"></tool>
<h2>Creating a SAML Application in Your Identity Provider</h2>
<p>The first step in setting up SAML SSO is to create a SAML application in your identity provider. This will generate a SAML certificate which you will need in the next step.</p>
<p>To create a SAML application in your identity provider, please follow the instructions specific to your provider.</p>
<h2>Generating a SAML Certificate</h2>
<p>Once you have created a SAML application in your identity provider, you will need to generate a SAML certificate. This certificate will be used to sign the SAML assertions sent to our dashboard.</p>
<p>To generate a SAML certificate, please follow the instructions specific to your identity provider.</p>
<h2>Adding the SAML Certificate to the SAML Application</h2>
<p>After you have generated a SAML certificate, you will need to add it to the SAML application in your identity provider. This will ensure that the SAML assertions sent to our dashboard are signed with the correct certificate.</p>
<p>To add the SAML certificate to the SAML application, please follow the instructions specific to your identity provider.</p>
<h2>Adding the SAML Application to Our Dashboard</h2>
<p>Once you have created the SAML application and added the SAML certificate, you will need to add the SAML application to our dashboard. This will allow our dashboard to communicate with the SAML application.</p>
<p>To add the SAML application to our dashboard, please follow the instructions specific to your identity provider.</p>
<h2>Configuring the SAML Settings</h2>
<p>After the SAML application has been added to our dashboard, you will need to configure the SAML settings. This will ensure that the SAML assertions sent to our dashboard are processed correctly.</p>
<p>To configure the SAML settings, please follow the instructions specific to your identity provider.</p>
`,
      },
      {
        name: 'SCIM Token | How to find',
        icon: '🔐',
        description: '',
        contents: `<h2>The SCIM token for Okta can be found in the customer's dashboard account settings:</h2>
<tool tool="SCIM token - where to find"></tool>
<h2>To add the SCIM token to their dashboard account settings, the customer support team member will need to:</h2>
<ol>
<li><p>Login to the customer's Okta account</p></li>
<li><p>Click on the "Administration" tab</p></li>
<li><p>Click on the "API Integration" link</p></li>
<li><p>Click on the "Manage API Integration" link</p></li>
<li><p>Click on the "Edit" link next to the SCIM token</p></li>
<li><p>Copy the SCIM token</p></li>
<li><p>Login to the customer's dashboard account</p></li>
<li><p>Click on the "Account Settings" link</p></li>
<li><p>Paste the SCIM token into the "SCIM Token" field</p></li>
<li><p>Click the "Update" button</p></li>
</ol>
`,
      },
      {
        name: 'SOC 2',
        icon: '',
        description: '',
        contents: `<p>Our SOC 2 report is an independent evaluation of our organization's controls related to security, availability, processing integrity, confidentiality, and privacy of customer data. The report is based on the SOC 2 Trust Services Criteria, which are aligned with the AICPA's generally accepted security principles.</p>
<p>The purpose of our SOC 2 report is to provide our customers with assurance that we have implemented controls to protect their data in accordance with industry standards. Our SOC 2 report is available to our customers upon request.</p>
<p>We are proud to have achieved SOC 2 compliance and to be able to offer our customers this additional level of assurance. This overview usually answers most questions:</p>
<tool tool="SOC 2"></tool>`,
      },
    ],
    tools: [
      {
        name: 'Audit log - beta approved',
        icon: '🕵️‍♀️',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us about our audit log feature. We're excited to let you know that this feature has been approved for beta testing!</p>
<p></p>
<p>The audit log feature will allow you to track all changes made to your account, including who made the change and when. This will be a valuable tool for keeping track of your account activity and ensuring that only authorized changes are made.</p>
<p></p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
        usageMultiple: 1.1,
      },
      {
        name: 'Audit log - CSV exports',
        icon: '🕵️‍♀️',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Our Audit Log feature allows you to download a CSV of all actions taken on a B2B SaaS product. This is great for tracking user activity and keeping a record of changes made to the product.</p>
<p></p>
<p>To export the CSV, simply go to the Audit Log tab in the product, and click the "Export" button. The CSV will be downloaded to your computer, and you can open it in any spreadsheet program.</p>
<p></p>
<p>Thanks for using our product!</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Audit log - alerts setup',
        icon: '🕵️‍♀️',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We're excited to announce that our Audit Log -alerts is now live!</p>
<p></p>
<p>This means that you can now receive alerts whenever certain events happen in your account, such as when a user logs in or when a file is downloaded.</p>
<p></p>
<p>To get started, simply go to the Audit Log - Alerts page in your account settings and enable the alerts that you're interested in.</p>
<p></p>
<p>We hope you find this new feature useful!</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Book time with me',
        icon: '📆',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for your interest in scheduling a call with me. In order to best serve you, please let me know what days and times work best for you to have a call. I look forward to hearing from you soon.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Qualification - non-profit status',
        icon: '❓',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for your continued support of our platform. We are excited to announce that we are assigning you an account manager because you are a non-profit organization. This account manager will be responsible for ensuring that your account is up and running smoothly and will be your main point of contact for any questions or concerns you may have.</p>
<p></p>
<p>We believe that this extra level of support will be beneficial to you and help you get the most out of our platform. If you have any questions, please don't hesitate to reach out to your account manager.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Qualification - startup incubator',
        icon: '❓',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We are excited to have you as part of our community! In order to best support your success, we are assigning you an account manager. Your account manager will be your main point of contact and can help you with any questions or concerns you have.</p>
<p></p>
<p>If you have any questions, please don't hesitate to reach out to your account manager. We are here to help you succeed!</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Quarterly biz review - successes',
        icon: '',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>I am writing to provide an update on our enterprise quarterly business review. I am pleased to report that we have had a successful quarter and are on track to meeting our yearly goals.</p>
<p></p>
<p>Some of our key successes this quarter include:</p>
<p></p>
<ul>
<li><p>Increased sales by XX%</p></li>
<li><p>Decreased costs by XX%</p></li>
<li><p>Introduced new product/service that has been well-received by customers</p></li>
</ul>
<p>I believe that these successes are a result of our hard work and dedication to our enterprise. I am confident that we will continue to see success in the future.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Demo - company too small',
        icon: '',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for your interest in our product demo. Unfortunately, your company is too small for a demo at this time. We are only able to provide demos to companies with at least 10 employees.</p>
<p></p>
<p>Thank you for your understanding.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Domain verification - approved',
        icon: '✅',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We're glad to hear you're interested in verifying your domain. This process allows you to assert control over your domain and prove your ownership to Google. Once verified, you'll be able to use your domain for Gmail, Drive, and other Google products designed for businesses.</p>
<p></p>
<p>To get started, please visit the Domain Verification page and sign in with your Google Account. Once you're signed in, you'll be able to enter your domain name and begin the verification process.</p>
<p></p>
<p>If you have any questions, our support team will be happy to help.</p>
<p></p>
<p>Thank you for your interest, and we look forward to helping you get the most out of our business products.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'IP whitelisting',
        icon: '🔐',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>It's likely that you'll need to whitelist our IP address to ensure that your product works properly. IP whitelisting is a security measure that allows you to specify which IP addresses are allowed to access your account.</p>
<p></p>
<p>Our IP address is: 54.39.121.155</p>
<p></p>
<p>To whitelist our IP address, please follow these instructions:</p>
<p></p>
<ol>
<li><p>Log in to your account on the SaaS product.</p></li>
<li><p>Go to the account or security settings.</p></li>
<li><p>Add our IP address to the whitelist.</p></li>
</ol>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'SCIM token - where to find',
        icon: '🔐',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Here's how to find and use your SCIM token:</p>
<p></p>
<ol>
<li><p>Login to your account on the B2B SaaS company's website.</p></li>
<li><p>Click on your name in the top right corner, and then click on "Settings."</p></li>
<li><p>In the "Settings" menu, click on "Integrations."</p></li>
<li><p>On the "Integrations" page, you should see a section labeled "SCIM."</p></li>
<li><p>Click on the "generate new token" button.</p></li>
<li><p>Copy the token that is generated.</p></li>
<li><p>In your SCIM client, paste the token into the "SCIM token" field.</p></li>
<li><p>Save your changes.</p></li>
</ol>
<p>If you have any questions, please feel free to contact us</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'SAML SSO setup',
        icon: '🔐',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Assuming you have a SAML identity provider (IdP) such as Microsoft Active Directory Federation Services (ADFS), you will need to configure your SAML IdP with the following information in order to set up SAML SSO:</p>
<p></p>
<ol>
<li><p>The SAML SSO URL, which is the URL where users will be redirected to for SAML authentication. This will be provided by your SAML IdP.</p></li>
<li><p>The SAML issuer, which is a unique identifier for your SAML SSO service. This will also be provided by your SAML IdP.</p></li>
<li><p>The SAML callback URL, which is the URL that your SAML IdP will redirect to after a successful SAML authentication. This URL will need to be registered with your SAML IdP.</p></li>
</ol>
<p>Once you have this information, you will need to configure your SAML SSO service with this information in order to complete the setup.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Require 2fa',
        icon: '👮‍♂️',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>In order to require two-factor authentication, you will need to take the following steps:</p>
<p></p>
<ol>
<li><p>Navigate to the "Security" tab in your account settings.</p></li>
<li><p>Under the "Two-Factor Authentication" section, click "Edit".</p></li>
<li><p>Select "Require Two-Factor Authentication for all logins" and click "Save".</p></li>
</ol>
<p>Once you have completed these steps, two-factor authentication will be required for all future logins to your account. If you have any questions or need any assistance, please let us know.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
    ],
  },
  {
    name: 'Product 101',
    description: '',
    icon: '🎓',
    workflows: [
      {
        name: 'Localization requests',
        icon: '🗺',
        description: '',
        contents: `<p>Localization requests can come in from a variety of sources - from users submitting tickets or feature requests, to developers submitting code changes. It's important that we have a standard process for handling these requests so that we can ensure timely and accurate responses.</p>
<p>Here's a basic overview of how to triage localization requests:</p>
<h2>Check if the request is already in progress</h2>
<p>Before starting any work on a new localization request, it's important to check if someone else on the team is already working on it. This can save a lot of time and duplication of effort.</p>
<p>To do this, check the team's localization request tracker. If the request is already listed there, no further action is needed - someone on the team is already working on it. Share our roadmap with this user:</p>
<tool tool="Localization roadmap"></tool>
<tool tool="TY for feedback"></tool>
<h2>Evaluate the request</h2>
<p>If the request is not already in progress, the next step is to evaluate it. This involves determining whether the request is a valid localization request, and whether it can be completed within the team's current capacity.</p>
<p>To do this, first check that the request meets the following criteria:</p>
<p>The request is for a new localization, or an update to an existing localization</p>
<p>The request is complete and includes all relevant information (e.g. file name, line number, English text, desired translation)</p>
<p>The request is clear and concise, and does not require additional clarification</p>
<p>If the request meets all of the above criteria, the next step is to check whether it can be completed within the team's current capacity. This involves considering the following factors:</p>
<p>The size of the requested localization (e.g. a few words, a sentence, a paragraph, an entire page)</p>
<p>The complexity of the requested localization (e.g. simple text, complex text with multiple variables, text with HTML markup)</p>
<p>The team's current workload and priorities</p>
<p>If the team has the capacity to complete the request, then it can be assigned to a member of the team for completion. If the team does not have the capacity to complete the request, then it may need to be deferred to a later time, or an alternative solution may need to be sought.</p>
<h2>Assign the request</h2>
<p>If the request is determined to be a valid localization request that can be completed within the team's current capacity, the next step is to assign it to a member of the team.</p>
<p>The request can be assigned to any team member, but it's generally best to assign it to someone who is available and has the relevant skills and experience.</p>
<h2>Complete the request</h2>
<p>Once the request has been assigned, it's the responsibility of the team member to complete the work. This involves carrying out the localization request, and then updating the relevant files and systems.</p>
<p>Once the request has been completed, the team member will update the localization request tracker to reflect the status of the request.</p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Changing account owners',
        icon: '🔀',
        description: '',
        contents: `<p>Account ownership changes have to be managed by the user themselves due to the possibility of leaking their private data. We should help them with basic security protocols and ensure they understand the severity and irreversibility of this change:</p>
<tool tool="Transfer account owner"></tool>`,
      },
      {
        name: 'Customizing product features',
        icon: '⚙️',
        description: '',
        contents: `<p>This guide is designed to help customer support representatives troubleshoot and customize product features <em>for</em> customers. It includes tips on how to:</p>
<ul>
<li><p>Access the customer's account</p></li>
<li><p>Update the customer's profile</p></li>
<li><p>Change the customer's password</p></li>
<li><p>Add or remove products from the customer's account</p></li>
<li><p>Enable or disable product features</p></li>
</ul>
<p>If you have any questions about this guide or anything else, feel free to reach out to your support team manager.</p>
<p>If the customer is asking how to customize stuff themselves (yay!):</p>
<tool tool="Customizing your account 101"></tool>
<h2>Accessing the customer's account:</h2>
<ol>
<li>
  <p>To access the customer's account, you will need their permission. First, ensure they are the account owner; if not:</p>
  <tool tool="Verify - need additional info"></tool>
  <tool tool="Verify - wrong email"></tool>
</li>
<li><p>Once you have their login information, log into their account by going to the login page on the website.</p></li>
<li><p>If you are having trouble logging in, try resetting the password. To do this, click on the "Forgot Password?" link on the login page.</p></li>
<li><p>Enter the customer's email address and click "Reset Password."</p></li>
<li><p>An email will be sent to the customer with a link to reset their password.</p></li>
<li><p>Once the customer has reset their password, they will be able to log in and access their account.</p></li>
</ol>
<h2>Updating the customer's profile:</h2>
<ol>
<li><p>To update the customer's profile, log into their account and click on the "Profile" tab.</p></li>
<li><p>From here, you can edit the customer's personal information, such as their name, address, and phone number.</p></li>
<li><p>You can also upload a new profile photo by clicking on the "Upload Photo" button.</p></li>
<li><p>Once you have made all of the desired changes, click "Save Changes" to update the customer's profile.</p></li>
</ol>
<h2>Changing the customer's password:</h2>
<ol>
<li><p>To change the customer's password, log into their account and click on the "Profile" tab.</p></li>
<li><p>Scroll down to the "Change Password" section.</p></li>
<li><p>Enter the customer's current password in the "Old Password" field.</p></li>
<li><p>Enter the customer's desired new password in the "New Password" and "Confirm Password" fields.</p></li>
<li><p>Once you have entered the customer's new password, click "Change Password" to save the changes.</p></li>
</ol>
<h2>Adding or removing products from the customer's account:</h2>
<ol>
<li><p>To add or remove products from the customer's account, log into their account and click on the "Products" tab.</p></li>
<li><p>From here, you can add new products to the customer's account by clicking on the "Add Product" button.</p></li>
<li><p>You can also remove products from the customer's account by clicking on the "Remove" button next to the desired product.</p></li>
<li><p>Once you have added or removed the desired products, click "Save Changes" to update the customer's account.</p></li>
</ol>
<h2>Enabling or disabling product features:</h2>
<ol>
<li><p>To enable or disable product features, log into the customer's account and click on the "Products" tab.</p></li>
<li><p>From here, you can enable or disable features for each product by clicking on the "Enable" or "Disable" button next to the desired feature.</p></li>
<li><p>Once you have enabled or disabled the desired features, click "Save Changes" to update the customer's account.</p></li>
</ol>
`,
      },
      {
        name: 'Feature requests & feedback',
        icon: '📣',
        description: '',
        contents: `<p>First of all, feedback is a joy to receive! Make sure we thank them:</p>
<tool tool="TY for feedback"></tool>
<tool tool="Free stickers!"></tool>
<p>Product feature requests can come in through a variety of channels - email, phone, social media, in-app feedback forms, etc. It can be difficult to keep track of all of these requests and to decide which ones to prioritize. This is where triage comes in.</p>
<p>Triage is the process of assessing and prioritizing product feature requests. The goal is to identify the requests that are most important to the company and its customers, and to prioritize these requests for the development team.</p>
<p>There are a few different factors to consider when triaging product feature requests:</p>
<ol>
<li><p>The customer's needs: What is the customer trying to accomplish with this request? Is it a must-have for them? How many other customers are requesting the same thing?</p></li>
<li><p>The company's goals: What is the company trying to achieve? Does this request align with the company's goals?</p></li>
<li><p>The feasibility of the request: Can we actually build this? Is it technically possible? How much effort will it take?</p></li>
<li><p>The impact of the request: How will this request impact the product? Will it be a small change or a major overhaul? How many other areas of the product will be affected?</p></li>
<li><p>The timing of the request: Is this something that the customer needs right away? Can it wait a few months?</p></li>
</ol>
<p>Based on these factors, you can prioritize product feature requests. The most important requests should be given to the development team as soon as possible, while less important requests can be scheduled for later.</p>
<p>When in doubt, it's always a good idea to consult with the customer or with other stakeholders to get more information about a request. And, of course, keep track of all requests so that you can follow up and provide updates to the customer.</p>
`,
      },
      {
        name: 'Importing content from other services',
        icon: '',
        description: '',
        contents: `<h2>What is Intercom?</h2>
<p>Intercom is a customer relations management (CRM) and customer support platform that helps businesses manage their customer relationships. It offers a suite of tools to help businesses communicate with their customers, including live chat, email, and in-app messaging.</p>
<h2>What is TextExpander?</h2>
<p>TextExpander is a text expansion and productivity tool that helps users save time by automatically expanding abbreviations and macros into full text. It offers a wide range of features to help users customize their text expansions, and also integrates with a number of third-party applications.</p>
<h2>What is Zendesk Guide?</h2>
<p>Zendesk Guide is a knowledge management software that helps businesses create and manage their online help documentation. It offers a wide range of features to help businesses create and maintain their documentation, including a WYSIWYG editor, version control, and integration with Zendesk Support.</p>
<h2>How to Import Content from Intercom</h2>
<p>In order to import content from Intercom, you will first need to export your data from Intercom. To do this, go to your Intercom account and click on the "Export data" link in the settings menu.</p>
<p>Once you have exported your data, you will need to format it for import into your wiki. Intercom exports data in JSON format, so you will need to convert it to a format that your wiki can understand. We recommend using the JSON to Wiki Converter tool to convert your data.</p>
<p>Once you have converted your data, you can import it into your wiki using the "Import from file" feature.</p>
<h2>How to Import Content from TextExpander</h2>
<p>In order to import content from TextExpander, you will first need to export your snippets from TextExpander. To do this, go to your TextExpander account and click on the "Snippets" tab.</p>
<p>Then, click on the "Export" button in the top-right corner of the screen.</p>
<p>Once you have exported your snippets, you will need to format them for import into your wiki. TextExpander exports snippets in XML format, so you will need to convert them to a format that your wiki can understand. We recommend using the XML to Wiki Converter tool to convert your data.</p>
<p>Once you have converted your data, you can import it into your wiki using the "Import from file" feature.</p>
<h2>How to Import Content from Zendesk Guide</h2>
<p>In order to import content from Zendesk Guide, you will first need to export your articles from Zendesk Guide. To do this, go to your Zendesk Guide account and click on the "Articles" tab.</p>
<p>Then, click on the "Export" button in the top-right corner of the screen.</p>
<p>Once you have exported your articles, you will need to format them for import into your wiki. Zendesk Guide exports articles in HTML format, so you will need to convert them to a format that your wiki can understand. We recommend using the HTML to Wiki Converter tool to convert your data.</p>
<p>Once you have converted your data, you can import it into your wiki using the "Import from file" feature.</p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Inviting new team members',
        icon: '',
        description: '',
        contents: `<ol>
<li><p>Go to your account settings by clicking the settings icon in the upper right-hand corner of the screen.</p></li>
<li><p>In the "Team" section of your settings, click the "Invite New Member" button.</p></li>
<li><p>Enter the email address of the person you'd like to invite in the "Email Address" field.</p></li>
<li><p>Select the role you'd like the person to have on your team from the "Role" drop-down menu.</p></li>
<li><p>Click the "Send Invite" button.</p></li>
</ol>
<p>The person you've invited will now receive an email with instructions on how to create an account and join your team.</p>
`,
      },
      {
        name: 'Keyboard shortcuts FAQ',
        icon: '⌨️',
        description: '',
        contents: `<p>Below are some frequently asked questions about keyboard shortcuts. Our online lessons have received rave reviews, so are the best way for folks to get started:</p>
<tool tool="Onboarding - webinar"></tool>
<p>Q: What is the shortcut for opening the help menu?</p>
<p>A: The shortcut for opening the help menu is F1.</p>
<p>Q: What is the shortcut for opening the settings menu?</p>
<p>A: The shortcut for opening the settings menu is F2.</p>
<p>Q: What is the shortcut for opening the search menu?</p>
<p>A: The shortcut for opening the search menu is F3.</p>
<p>Q: What is the shortcut for opening the history menu?</p>
<p>A: The shortcut for opening the history menu is F4.</p>
<p>Q: What is the shortcut for opening the bookmark menu?</p>
<p>A: The shortcut for opening the bookmark menu is F5.</p>
<p>Q: What is the shortcut for opening the download menu?</p>
<p>A: The shortcut for opening the download menu is F6.</p>
<p>In addition, these shortcuts can help users get speed up more quickly:</p>
<p>Ctrl+C – Copy the selected text or object.</p>
<p>Ctrl+X – Cut the selected text or object.</p>
<p>Ctrl+V – Paste the text or object that is in the clipboard.</p>
<p>Ctrl+Z – Undo the last action.</p>
<p>Ctrl+Y – Redo the last undone action.</p>
<p>Ctrl+B – Bold the selected text.</p>
<p>Ctrl+I – Italicize the selected text.</p>
<p>Ctrl+U – Underline the selected text.</p>
<p>Ctrl+A – Select all text or objects.</p>
<p>Ctrl+F – Find text or an object.</p>
<p>Ctrl+G – Go to a specific line or page.</p>
<p>Ctrl+H – Replace text or an object.</p>
<p>Ctrl+J – Justify the selected text.</p>
<p>Ctrl+K – Insert a hyperlink.</p>
<p>Ctrl+L – Align the selected text or object to the left.</p>
<p>Ctrl+E – Center the selected text or object.</p>
<p>Ctrl+R – Align the selected text or object to the right.</p>
<p>Ctrl+M – Indent the selected text or object.</p>
<p>Ctrl+Shift+M – Outdent the selected text or object.</p>
<p>Ctrl+[ – Decrease the font size.</p>
<p>Ctrl+] – Increase the font size.</p>
<p>Ctrl+Spacebar – Remove the formatting from the selected text.</p>
<p>Ctrl+Shift+L – Bulleted list.</p>
<p>Ctrl+Shift+N – Numbered list.</p>
<p>Advanced Shortcuts</p>
<p>Ctrl+Shift+C – Copy the selected text or object as plain text.</p>
<p>Ctrl+Shift+X – Cut the selected text or object as plain text.</p>
<p>Ctrl+/ – Comment out the selected text or object.</p>
<p>Ctrl+Shift+/ – Uncomment the selected text or object.</p>
<p>Ctrl+Shift+\\ – Insert a page break.</p>
<p>Ctrl+Shift+A – Insert an anchor.</p>
<p>Ctrl+Shift+K – Insert a link to an anchor.</p>
<p>Ctrl+Shift+O – Insert an image.</p>
<p>Ctrl+Shift+F – Insert a file.</p>
<p>Ctrl+Shift+G – Insert a video.</p>
<p>Ctrl+Shift+T – Insert a table.</p>
<p>Ctrl+Shift+D – Insert a horizontal line.</p>
<p>Ctrl+Shift+S – Insert a symbol.</p>
<p>Ctrl+Shift+1 – Heading 1.</p>
<p>Ctrl+Shift+2 – Heading 2.</p>
<p>Ctrl+Shift+3 – Heading 3.</p>
<p>Ctrl+Shift+4 – Heading 4.</p>
<p>Ctrl+Shift+5 – Heading 5.</p>
<p>Ctrl+Shift+6 – Heading 6.</p>
<p>Ctrl+Shift+7 – Normal text.</p>`,
        usageMultiple: 1.3,
      },
    ],
    tools: [
      {
        name: 'Account owner change - complete',
        icon: '🔀',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for informing us of the change in account ownership. We have now updated our records to reflect the new account owner. If you have any further questions or concerns, please do not hesitate to contact us. Thank you for your business.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Account owner change - how to',
        icon: '🔀',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us. We are sorry to hear that you are having trouble changing the account owner on your account.</p>
<p></p>
<p>There are a few steps that you need to take in order to change the account owner. First, you need to log into your account and go to the "Settings" page. On the "Settings" page, you will see a section called "Account Owner." In the "Account Owner" section, you will need to enter the new account owner's information.</p>
<p></p>
<p>After you have entered the new account owner's information, you will need to click the "Save Changes" button. Once you have clicked the "Save Changes" button, the new account owner will be able to access the account.</p>
<p></p>
<p>If you have any further questions or concerns, please do not hesitate to contact us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Customizing your account 101',
        icon: '⚙️',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us. We would be happy to help you customize your account.</p>
<p></p>
<p>There are a few ways to customize your account. You can change your password, add or remove devices, and change your billing information.</p>
<p></p>
<p>To change your password, log into your account and click on the "Settings" tab. From there, click on the "Change Password" link.</p>
<p></p>
<p>To add or remove devices, log into your account and click on the "Devices" tab. From there, you can add or remove devices from your account.</p>
<p></p>
<p>To change your billing information, log into your account and click on the "Billing" tab. From there, you can update your credit card information or change your billing address.</p>
<p></p>
<p>If you have any other questions, please let us know.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Free stickers!',
        icon: '🆓',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>!</p>
<p></p>
<p>Thank you so much for being an awesome customer! As a little thank you, we wanted to send you some free stickers! We hope you enjoy them and continue being a great customer!</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
        usageMultiple: 1.3,
      },
      {
        name: 'Localization roadmap',
        icon: '🗺',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for your interest in our Localization roadmap. At this time, we do not have any specific details to share about our plans. However, we are committed to continuing to improve our Localization offerings and make them more accessible to our customers.</p>
<p></p>
<p>Thank you for your patience as we work to improve our Localization offerings. We appreciate your feedback and look forward to continuing to provide you with the best possible experience.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'TY for feedback',
        icon: '🙌',
        description: '',
        contents: `<p>Hey <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>!</p>
<p></p>
<p>Thank you so much for your feedback! We are so excited to hear that you had such a great experience with our product/service. We strive to provide the best possible experience for our customers, and your feedback helps us to continue improving.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Beta - CSV exports',
        icon: '🧪',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We'd like to invite you to participate in our Beta for CSV exports. This is a new feature we're working on and we would love to get your feedback.</p>
<p></p>
<p>To participate, simply log into your account and go to the settings page. From there, you'll be able to export your data as a CSV file.</p>
<p></p>
<p>We hope you'll take advantage of this opportunity to help us shape this new feature. If you have any questions or feedback, please don't hesitate to reach out.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.3,
      },
      {
        name: 'Beta - improved shortcuts',
        icon: '🧪',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We are excited to announce that our new beta is now live! We’ve made some great improvements to our keyboard shortcuts that we think you’ll love.</p>
<p></p>
<p>To access the beta, simply login to your account and click on the “beta” tab. From there, you’ll be able to use all of the new features and improvements.</p>
<p></p>
<p>We can’t wait to hear what you think of the new beta. Thank you, as always, for being a loyal customer.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'iOS - App Store',
        icon: '📲',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>To download our app from the iPhone app store, simply open the app store on your device and search for our app by name. Once you find our app, tap the “Get” button to initiate the download.</p>
<p></p>
<p>Once the download is complete, our app will be automatically installed on your device. You can then access our app by tapping the icon on your device’s home screen.</p>
<p></p>
<p>Thank you for your interest in our app!</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>`,
      },
      {
        name: 'Android store',
        icon: '📲',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>To get our app from the Android app store, simply follow these steps:</p>
<p></p>
<ol>
<li><p>Open the app store on your Android device.</p></li>
<li><p>Search for our app by name.</p></li>
<li><p>Tap on the app to view more information about it.</p></li>
<li><p>Tap the "Install" button to install the app on your device.</p></li>
</ol>
<p>Thank you for your interest in our app!</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Mobile - image uploading',
        icon: '📲',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for using our mobile app for image uploading. Here are instructions on how to use the app:</p>
<p></p>
<ol>
<li><p>open the app and sign in with your account information</p></li>
<li><p>select the "upload images" option from the main menu</p></li>
<li><p>browse your device's photo gallery and select the images you wish to upload</p></li>
<li><p>once you have selected all the images you wish to upload, tap the "upload" button</p></li>
<li><p>wait for the upload to complete, then tap the "done" button</p></li>
</ol>
<p>That's all there is to it! If you have any questions or need assistance, please feel free to contact us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Mobile - voice shortcuts',
        icon: '📲',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for using our mobile app! We are always striving to make our app more user-friendly and efficient.</p>
<p></p>
<p>One of the great features of our app is the voice shortcuts. You can use your voice to perform various tasks on the app, such as opening a new document, saving a file, or printing a document.</p>
<p></p>
<p>To use the voice shortcuts, simply tap the microphone icon on the app toolbar and speak your command. The app will then execute the task.</p>
<p></p>
<p>We hope you find this feature helpful and convenient. If you have any questions or suggestions, please don't hesitate to contact us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
    ],
  },
  {
    name: 'Sales / SDR',
    description: '',
    icon: '🤝',
    workflows: [],
    tools: [
      {
        name: 'Billing - SSO enabled',
        icon: '🔐',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>!</p>
<p></p>
<p>We're excited to let you know that SSO is now enabled on our platform. This means that you can now use a single sign-on provider to login to your account. This will make it easier for you to access your account and will improve your overall experience.</p>
<p></p>
<p>If you have any questions or need help getting started, please don't hesitate to reach out to our support team.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Billing - startup rate applied',
        icon: '💰',
        description: '',
        contents: `<p>Hi <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>!</p>
<p></p>
<p>We wanted to let you know that we have applied discount pricing to your account because you are a startup. This means that you will now get a 20% discount on all products and services.</p>
<p></p>
<p>We believe that startups are the future and we want to help you succeed. We hope that this discount will help you get off to a great start.</p>
<p></p>
<p>If you have any questions, please don't hesitate to contact us.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Billing - volume rate approved',
        icon: '💰',
        description: '',
        contents: `<p>Hey <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for being a high-volume customer with us. We have applied a discount to your account so that you can continue to get the best pricing on our products and services.</p>
<p></p>
<p>Thank you for your business, and we look forward to continuing to serve you in the future.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Qualification - use case',
        icon: '❓',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for your inquiry. Can you please provide more information about your use case? We would love to learn more about how you plan to use our product.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Onboarding - webinar',
        icon: '',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>!</p>
<p></p>
<p>We would like to invite you to our upcoming webinar to learn how to make the most of our product. This webinar will be packed with tips and tricks to help you get the most out of our product and take your business to the next level.</p>
<p></p>
<p>You will not want to miss this! Register now and we'll send you the details.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Qualification - company size',
        icon: '❓',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>!</p>
<p></p>
<p>Thank you for your interest in our company. In order to best determine if our sales team can be of assistance to you, we need to know a bit more about your company size and use case. Can you please provide more information on this so we can better assess if we can be of assistance?</p>
<p></p>
<p>Thank you for your time and we look forward to hearing from you soon.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
    ],
  },
  {
    name: 'Trust & Safety',
    description: '',
    icon: '⛑',
    workflows: [
      {
        name: 'Content moderation FAQ',
        icon: '👩‍⚖️',
        description: '',
        contents: `<p>The Trust & Safety / Risk Operations team is responsible for keeping our community safe. This includes moderating content, handling abuse reports, and investigating suspicious activity.</p>
<p>We are here to keep the community safe and help users in need. We take our job seriously and work hard to maintain a safe and welcoming environment for all.</p>
<p>If you see something that violates our Community Guidelines or Terms of Service, please report it to us. We can't take action if we don't know about it.</p>
<p>When you report something to us, we'll review it and take appropriate action. This might include removing the content, issuing a warning to the person who posted it, or even suspending their account.</p>
<p>We know that not everyone will agree with our decisions, but we stand by them. We appreciate your help in keeping the community safe.</p>
<h2>What kind of content violates the Community Guidelines or Terms of Service?</h2>
<p>There are a few different types of content that could violate our guidelines or terms. Our policies are:</p>
<tool tool="Moderation - policy explanation"></tool>
<h2>How do I report something?</h2>
<p>If you see something that violates our guidelines or terms, you can report it to us by clicking the "report" button on the post or profile. You can also escalate internally:</p>
<tool tool="Moderation - escalation"></tool>
<h2>What happens when I report something?</h2>
<p>When you report something to us, we'll review it and take appropriate action. This might include removing the content, issuing a warning to the person who posted it, or even suspending their account.</p>
<h2>I don't agree with the action you took on my report. What can I do?</h2>
<p>We understand that not everyone will agree with our internal decisions. We stand by our decisions and appreciate your help in keeping the community safe.</p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Content moderation escalations',
        icon: '👩‍⚖️',
        description: '',
        contents: `<p>You have a lot of responsibility when it comes to moderating content and taking feedback from users. Here's a guide on how to re-review and escalate content moderation and take-down feedback from users, so you can be sure you're doing everything properly.</p>
<p>When a user submits feedback about content that they believe should be moderated or taken down, it's important to re-review the content in question to determine if it violates any of your company's policies. If it does, then you should escalate the feedback to the appropriate team or individual for further review.</p>
<tool tool="Moderation - escalation"></tool>
<p>If you're not sure whether or not the content violates any policies, or if you believe the user's feedback is not valid, then you can reach out to the user directly to get more information. In some cases, it may be to remind them of our policies to help the discussion in good faith:</p>
<tool tool="Moderation - policy explanation"></tool>
<p>If their content was in fact valid according to our policies, that's okay! Mistakes happen. We should apologize and explain so we can improve:</p>
<tool tool="Moderation - apologize, re-approved"></tool>
<p>Remember, it's important to take all user feedback seriously and to review all content thoroughly before making any decisions. By following this guide, you can be sure that you're handling content moderation and take-down feedback in the best way possible.</p>
`,
      },
      {
        name: 'Suspicious account behavior review',
        icon: '🤨',
        description: '',
        contents: `<p>The Trust & Safety team will review the following activity to determine if an account has been hacked or is in violation of our content moderation policies:</p>
<p>Unusual login activity, including but not limited to:</p>
<ul>
<li><p>Multiple failed login attempts</p></li>
<li><p>Logging in from multiple IP addresses</p></li>
<li><p>Logging in from unusual locations</p></li>
<li><p>Anomalous activity on the account, such as:</p></li>
<li><p>Sending large numbers of messages</p></li>
<li><p>Adding and removing large numbers of friends or followers</p></li>
<li><p>Liking or commenting on a large number of posts</p></li>
<li><p>Creating or sharing a large number of posts or videos</p></li>
<li><p>Any other activity that appears to be out of the ordinary</p></li>
</ul>
<p>If any of the above activity is detected, the Trust & Safety team will investigate further to determine if the account has been hacked or is in violation of our content moderation policies. Use these snippets to kick off our process:</p>
<tool tool="Suspicious behavior - basic questions"></tool>
<tool tool="Suspicious behavior - schedule call"></tool>
`,
      },
      {
        name: 'Content moderation for promoted accounts',
        icon: '👩‍⚖️',
        description: '',
        contents: `<p>When a report is received for content posted by a high-value account, there are a few key things to keep in mind in order to ensure an efficient and accurate triage:</p>
<ol>
<li><p>Check the account's history: Is this the first time this account has posted content that has been reported? If so, it's likely that the content in question is not in violation of our policies and can be ignored. However, if the account has a history of posting violating content, it's worth taking a closer look.</p></li>
<li><p>Consider the account's reach: How many people are likely to see the content in question? If it's a large account with a lot of followers, it's worth taking a closer look to see if the content violates our policies.</p></li>
<li><p>Evaluate the severity of the report: Is the content in question graphic or violent? If so, it's likely a violation of our policies and should be removed. If not, it's probably not a violation and can be ignored.</p></li>
<li><p>Look at the context of the post: Is the content in question posted in a public forum? If so, it's likely that it does not violate our policies and can be ignored. However, if it's posted in a private group or message board, it's worth taking a closer look.</p></li>
<li>
  <p>Review our policies: Is the content in question clearly in violation of our policies? If so, it should be removed. If not, it's probably not a violation and can be ignored.</p>
  <tool tool="Moderation - policy explanation"></tool>
</li>
</ol>
<p>If all else fails and the account owner is upset, follow our special escalation policy:</p>
<tool tool="Angry user escalation"></tool>
`,
      },
    ],
    tools: [
      {
        name: 'Rejected user - initial notice',
        icon: '❌',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We regret to inform you that your account has been rejected.</p>
<p></p>
<p>Please understand that this decision was not made lightly. Our risk operations team carefully reviews every account that is submitted to us. Unfortunately, we were not able to approve your account at this time.</p>
<p></p>
<p>We understand that this may be disappointing news. If you have any questions or would like to appeal this decision, please do not hesitate to contact us.</p>
<p></p>
<p>Thank you for your understanding.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Angry user escalation',
        icon: '😡',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us regarding your account. We understand that you are upset about our decision to reject your application, but we stand by our decision and cannot change it.</p>
<p></p>
<p>There are a number of factors that go into our decision-making process, and we believe that this decision is in the best interest of both our company and our customers. We apologize for any inconvenience this may have caused.</p>
<p></p>
<p>Thank you for your understanding.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Moderation - escalation',
        icon: '👩‍⚖️',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>Thank you for reaching out to us regarding your content that was flagged for violating our policies. We are happy to take another look at your content to determine whether it is in compliance with our policies.</p>
<p></p>
<p>We understand that it can be frustrating when your content is flagged for violating our policies, but we appreciate your understanding and cooperation. We want to make sure that all of the content on our site is in compliance with our policies so that everyone can have a positive experience.</p>
<p></p>
<p>Thank you again for reaching out to us. We appreciate your cooperation and patience.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Moderation - apologize, re-approved',
        icon: '👩‍⚖️',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We would like to apologize for mistakenly removing your content. We have reinstated your content and are sorry for any inconvenience this may have caused.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Moderation - policy explanation',
        icon: '👩‍⚖️',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>!</p>
<p></p>
<p>Thank you for taking the time to learn about our content moderation policies. We take the safety and security of our community very seriously, and we want to make sure that everyone feels comfortable and respected when using our platform.</p>
<p></p>
<p>Our moderation team works hard to ensure that all content meets our community guidelines. We review all posts and comments for appropriateness and remove anything that violates our guidelines. We also take reports of abuse and harassment very seriously, and we will take action to remove any content that makes our community members feel unsafe.</p>
<p></p>
<p>We understand that not everyone will always agree with our moderation decisions, but we believe that our policies are in the best interest of our community as a whole. We appreciate your understanding and cooperation in helping to keep our platform a safe and welcoming place for everyone.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
        usageMultiple: 1.1,
      },
      {
        name: 'Suspicious behavior - basic questions',
        icon: '🤨',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We recently noticed some unusual login activity on your account and wanted to reach out to confirm that everything is still secure. In particular, we noticed the following:</p>
<p></p>
<ul>
<li><p>There was a login from an unrecognized device last week</p></li>
<li><p>There was a login from an unrecognized location on Monday</p></li>
<li><p>Your password was changed the following day</p></li>
</ul>
<p>Please let us know if you recognize all of these activities and whether or not you are still in control of your account. If you have any concerns about the security of your account, please do not hesitate to let us know.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
      {
        name: 'Suspicious behavior - schedule call',
        icon: '🤨',
        description: '',
        contents: `<p>Hello <variable id="recipientFirstName" source="page" placeholder="Recipient first name"></variable>,</p>
<p></p>
<p>We have noticed some suspicious activity on your account and we would like to schedule a call with you to discuss this further.</p>
<p></p>
<p>During our call, we will go over the activity that we have flagged and ask you some questions to verify your identity.</p>
<p></p>
<p>We take account security very seriously and we appreciate your cooperation in helping us keep your account safe.</p>
<p></p><p><variable id="authorFirstName" source="page" placeholder="Author first name"></variable> </p>
`,
      },
    ],
  },
];

export const DEMO_COMMENTS: Record<number, string[]> = {
  1: [
    'It would be helpful to have phone support so that we can get our questions answered more quickly.',
    "I'm not sure if email is the best way to communicate with customer service.",
    "I had a question that I couldn't find the answer to on the website, so I had to email customer service.",
    'It would be helpful to have a phone number to call so that we can get our questions answered more quickly.',
    "I'm not sure if email is the best way to communicate with customer service.",
    "I had a question that I couldn't find the answer to on the website, so I had to email customer service.",
    'It would be helpful to have a phone number to call so that we can get our questions answered more quickly.',
    'Email is not the most efficient way to get our questions answered.',
    'It would be helpful to have a phone number to call so that we can get our questions answered more quickly.',
    'We would appreciate if customer service was more readily available to us via phone.',
    "This product is terrible because the documentation is out of date and doesn't reflect the current state of the product.",
  ],
  2: [
    "I called customer service and asked a simple question, but the representative gave me a long, confusing answer that didn't really help.",
    'I asked customer service for help with a problem and they just kept repeating the same thing over and over.',
    "I don't understand why customer service couldn't just give me a straight answer to my question.",
    'I asked customer service for help and they just kept putting me on hold.',
    'The response was helpful, but wait time on chat was way too long. I would like more support in my time zone please.',
    'I never got the call back I was promised ☹️',
    'I kept getting transferred between departments so this has not been fixed :(',
    'You said you would transfer me, but then I was disconnected.',
    "I'm unhappy with the customer service I received because the representative didn't provide enough information. I felt like they could have been more helpful.",
    'The support team was not able to answer my question accurately.',
    'The website documentation is outdated and in need of updating.',
  ],
  3: [
    'Your customer support team is very friendly and helpful. However, I would appreciate it if you could provide more detailed responses to my inquiries.',
    'I appreciate the help your customer support team has provided me. However, I think it would be helpful if you could provide more options for contacting customer support (e.g. live chat, phone number, etc.).',
    "Your customer support team is very responsive. However, I would appreciate it if you could provide more information up front so that I don't have to keep asking for clarification.",
    'I appreciate the effort your customer support team has put into helping me. However, I think it would be helpful if you could provide more resources on your website (e.g. FAQs, tutorials, etc.).',
    'Your customer support team is very helpful. However, I would appreciate it if you could provide more personalized responses to my inquiries.',
    'Your team could benefit from additional training this topic, but I appreciate your quick replies.',
    'I appreciate the effort your team puts into resolving my issues. I wish you did more to prevent them from happening in the first place.',
    'I am very satisfied with the level of support I receive from your team. However, I think that more could be done to improve the overall customer experience.',
    'It would be nice if the product had a feature that allowed users to collaborate with others on projects.',
    'The response was quick, but I still wish you had more features to help users stay on track with their work.',
  ],
  4: [
    "I've been using this product for a while now and I absolutely love it! It's so easy to use and it's really helped me stay organized.",
    "This is by far the best customer service I've ever experienced! They're always so helpful and they always go above and beyond to help me out.",
    "I absolutely love this product! It's helped me so much and I've never had any problems with it. The customer service is amazing and they're always so helpful.",
    "This is the best customer service I've ever experienced! They're always so friendly and helpful, and they always go above and beyond to help me out.",
    'I would recommend this product to anyone!',
    'The support team for this product is excellent! They are quick to respond to any questions or concerns I have and are always willing to help.',
    'This product and support team are great! They are always quick to respond to any questions or concerns I have and are very helpful. Highly recommend!',
    "I've been very happy with this product so far and the support team has been great! They are always quick to respond to any questions or concerns I have and are very helpful.",
    'The support team for this product is excellent! They are quick to respond to any questions or concerns I have and are always willing to help.',
    "The people I've talked to on this product's support team have been wonderful! They're so friendly and helpful, and they've really made me feel supported throughout my experience with the product.",
    "👏 The support team is doing a great job! They're always quick to respond to my questions and help me out when I need it.",
    "I'm really impressed with the support team's knowledge and professionalism. They've been a great help to me and I really appreciate it!",
    "I'm so grateful to the support team for their help and patience. They've really gone above and beyond to make sure I'm getting the most out of the product. I'm just waiting for an invite to your new beta to fix my current issue 🤞",
    "The support team is absolutely amazing! They're always there to help me out and they make me feel like a valued customer. Thank you so much for everything!",
    "The people I've talked to have been so helpful and friendly!",
    "I'm really impressed with how responsive and knowledgeable the team is. 👏",
    "Every time I've needed help, I've been able to get it quickly and easily.",
    'The support team has always made me feel like a valuable customer ❤️',
    "I'm so glad I chose this product! The support team has been a huge part of that.",
    'This support team is absolutely incredible! They have been so helpful and responsive to all of my questions and concerns. The product is amazing and I am so happy with it!',
    "This team is amazing! They have been super responsive and helpful with everything I've needed. The product is great and I'm loving it so far!",
    "This support team is top notch! They have been so helpful and quick to respond to all of my questions. The product is fantastic and I'm loving it!",
    "I am absolutely blown away by this support team! They have been amazing and so helpful with everything I've needed. The product is great and I'm having a blast with it!",
    'The customer service was very friendly and helpful. It would be great if there were more customization options for the product interface 🙏',
    'The representative was knowledgeable and helped me resolve my issue.',
    'The wait time was minimal and I was quickly helped.',
    'I appreciate the help I received from the customer service representative.',
    'The customer service was excellent and I am very satisfied.',
    'The representative was great and helped me with everything I needed.',
    'I had a good experience with the customer service and am satisfied.',
    'The customer service was good and I received the help I needed.',
    'I am satisfied with the customer service I received.',
    'The customer service was helpful and I am pleased with the service.',
  ],
  5: [
    'The service I received was amazing and I could not have asked for anything more.',
    'I am so impressed with the level of customer service I received.',
    'I have never had such a positive experience with any company before.',
    'I will definitely be using your company again in the future.',
    'I have already recommended your company to others.',
    'I am so glad I chose your company.',
    'Your customer service is outstanding.',
    'I will be sure to tell my friends and family about your company.',
    'Thank you for your wonderful service.',
    'I could not be happier with my experience.',
    'Thank you so much for your help! You were so patient and really took the time to understand my issue. I really appreciate the great support I received from you!',
    "Y'all are amazing! Thank you for walking me through every step of the process and made sure I was comfortable with what was going on. Friendly and made this so much better! 😄",
    "Wow!! 😲 The support I received was amazing! The product is great, and you went above and beyond to help me troubleshoot my issue and get me up and running again. I'm so impressed with hyour level of customer service and would recommend this product to anyone!",
    'OMG you always go above and beyond to make sure that I am taken care of. You have truly earned my loyalty 💖',
    "This product is amazing! I'm so happy with the great answer I received from the customer service team. They were so helpful and the product is great! :D",
    'Great answer! This product is amazing and totally worth the money! 😍',
    "This product is amazing! I'm so happy with the answer I received! Thank you so much! :D :D",
    "This is the best answer I've ever received! The product is amazing and I'm so happy with it! :) :) :)",
    "I've been using this product for a while now and I absolutely love it! I've had some great conversations with the support team and they've been super helpful.",
    "🤯 Wow! The support team was so helpful and knowledgeable! They really know their stuff and were able to answer all of my questions. I'm so impressed with your service.",
    "The customer service I've received from this company has been amazing! I've never had a problem that they haven't been able to help me with and they're always so friendly.",
    "I've been using this product for a while now and I absolutely love it! It's so easy to use and it's really helped me stay organized.",
    "This is by far the best customer service I've ever experienced! They're always so helpful and they always go above and beyond to help me out. 💯💯",
    "I absolutely love this product! It's helped me so much and I've never had any problems with it. The customer service is amazing and they're always so helpful.",
    "This is the best customer service I've ever experienced! They're always so friendly and helpful, and they always go above and beyond to help me out.",
    'You all are so friendly and helpful and have been a great resource for me. I would recommend this product to anyone!',
    'The support team for this product is excellent! They are quick to respond to any questions or concerns I have and are always willing to help 🤜💥🤛',
    'This product and support team are great! They are always quick to respond to any questions or concerns I have and are very helpful. I would highly recommend this product to anyone!',
    'AMAZING. Always quick to respond to any questions or concerns I have and are very helpful. I would highly recommend this product to anyone!',
    "You are quick to respond to any questions or concerns I have and are always willing to help. I've been very happy with the product so far and would recommend it to anyone.",
    "The people I've talked to on this product's support team have been wonderful! They're so friendly and helpful, and they've really made me feel supported throughout my experience with the product.",
    "You are doing a great job! They're always quick to respond to my questions and help me out when I need it.",
    "I'm really impressed with the support team's knowledge and professionalism. They've been a great help to me and I really appreciate it!",
    "I'm so grateful to the support team for their help and patience. They've really gone above and beyond to make sure I'm getting the most out of the product.",
    "The support team is absolutely amazing! They're always there to help me out and they make me feel like a valued customer. Thank you so much for everything!",
    "The people I've talked to have been so helpful and friendly!",
    "I'm really impressed with how responsive and knowledgeable the team is.",
    "Every time I've needed help, I've been able to get it quickly and easily.",
    'You have always made me feel like a valuable customer.',
    "I'm so glad I chose this product! The support team has been a huge part of that.",
    'This support team is absolutely incredible! They have been so helpful and responsive to all of my questions and concerns. The product is amazing and I am so happy with it!',
    "This team is amazing! They have been super responsive and helpful with everything I've needed. The product is great and I'm loving it so far!",
    "This support team is top notch! They have been so helpful and quick to respond to all of my questions. The product is fantastic and I'm loving it!",
    "I am absolutely blown away by this support team! They have been amazing and so helpful with everything I've needed. The product is great and I'm having a blast with it!",
    "This support team is outstanding! They have been so responsive and helpful with everything I've needed. The product is fantastic and I'm absolutely loving it!",
    'So glad I reached out for help!',
    'What a relief to talk to someone who gets it.',
    'I feel so much better after our chat.',
    'Thank you for your compassion and expertise!',
    'I am so grateful for your help!',
    'The support team was fantastic! They were so responsive and helpful 🙌',
    'They really know their stuff! I had a great conversation with them.',
    'They were able to help me solve my problem quickly and efficiently.',
    "I'm so glad I contacted the support team! They were a huge help.",
    'The support team is amazing! They were so patient and helpful 🙌🙌',
    "I'm so grateful to the support team for their help!",
    "Top-notch! They're always so responsive and helpful.",
    'I had an excellent experience with the support team. They were very helpful and knowledgeable.',
    "The support team is outstanding! They're always willing to help and they're very knowledgeable.",
    'I had a great experience with the support team! They were very helpful and informative.',
    'I absolutely love your product! 💯',
    'Your product has made my life so much easier!',
    "I can't believe how well your product works!",
    'I tell all my friends about your product!',
    'I will never use another product again!',
    '🥳 Your customer service is amazing!',
    'I am so happy with your product!',
    'I will be a customer for life!',
    'I have already recommended your product to others!',
    'I cannot thank you enough for your amazing product!',
    "I can't believe how much I love this product!",
    'I would recommend this product to anyone!',
    'This product is life-changing!',
    'I will never use another product again!',
    'This product is worth every penny!',
    'I am so happy with this purchase!',
    'This product is amazing!',
    '🥰🥰 I am absolutely in love with this product!',
    'The customer support team is amazing! They are always quick to respond to my questions and help me resolve any issues I have.',
    "I'm so impressed with the level of customer support offered by this company. They are always willing to help and make sure my experience is positive.",
    "I've never had a better experience with customer support than I have with this company. They are always quick to respond and resolve any issues.",
    "This company provides the best customer support I've ever experienced. They are always responsive and helpful.",
    "I'm so happy with the customer support I've received from this company. They are always quick to respond to my questions and help me resolve any issues.",
    'The customer support team at this company is amazing! They are always quick to respond and help me resolve any issues.',
    "😍 I'm extremely impressed with the quality of customer support offered by this company. They are always willing to help and make sure my experience is positive.",
    "This company provides the best customer support I've ever encountered. They are always responsive and helpful.",
    "I'm absolutely thrilled with the customer support I've received from this company. They are always quick to respond and help me resolve any issues.",
    'Your customer support team is very responsive and helpful.',
    'Your team is very patient and goes above and beyond to help solve customer issues 🙏',
    'Your team is very knowledgeable about your products and services.',
    'Your team is very friendly and accommodating.',
    'Your team is very efficient in solving customer issues.',
    'Your team is very effective in communicating with customers.',
    'Your team is very prompt in responding to customer inquiries.',
    "Your're is very proactive in solving customer problems.",
    'Your team is very helpful in providing customer support. 😀',
    'Your customer support team is excellent and provides outstanding customer service 👏👏',
    'I really appreciate your help! You were so quick to respond and your advice was spot on. I feel like I have a much better understanding of the situation now. Thank you so much!',
    "This support person was awesome! They were patient, detailed, and very helpful. This is the best support experience I've had in a long time.",
    'The help I received was very positive and helpful. They took the time to explain the issue to me in a way that I could understand, and then helped me resolve the issue.',
    'The support chat help I received was very positive. The support person was very knowledgeable and was able to help me resolve my issue. They were also very polite and professional.',
    'Thank you, Dave, for your help! You were very patient and explained things very clearly.',
    "Thank you, Peter! Your help was much appreciated. You were very patient and explained things very clearly. I'm really glad I found this chat support.",
    'Thank you, Brian, for your help! Your instructions were clear and easy to follow. I appreciate your taking the time to walk me through the process.',
  ],
};
