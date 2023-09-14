module.exports = {
  plugins: [
    '@sentry/gatsby',
    `gatsby-plugin-emotion`,
    `gatsby-plugin-pnpm`,
    `gatsby-plugin-remove-trailing-slashes`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: 'gatsby-plugin-react-svg',
      options: {
        rule: {
          include: /logos/,
        },
      },
    },
  ],
};
