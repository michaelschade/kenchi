import { Breadcrumb as SentryBreadcrumb, SeverityLevel } from '@sentry/react';

export type BreadcrumbCategory = 'query' | 'mutation' | 'subscription';

export class OperationBreadcrumb {
  /** Breadcrumb data */
  private message?: string;
  private level: SeverityLevel = 'log';
  private category = 'graphql';
  private error?: any;

  /**
   * Set the breadcrumb's message, normally the graphQL operation's name
   * @param {string} message
   * @returns {OperationBreadcrumb}
   */
  setMessage = (message?: string): OperationBreadcrumb => {
    this.message = message;
    return this;
  };

  /**
   * Sets the breadcrumb's category, which is prefixed with `graphQL`
   * @param {Breadcrumb.Category} category
   * @returns {OperationBreadcrumb}
   */
  setCategory = (category?: BreadcrumbCategory): OperationBreadcrumb => {
    this.category = `graphql ${category || ''}`.trim();
    return this;
  };

  /**
   * Set the breadcrumb's error data
   * @param {any | undefined} error
   * @returns {OperationBreadcrumb}
   */
  setError = (error: any | undefined): OperationBreadcrumb => {
    if (error) {
      this.level = 'error';
      if (error instanceof Error) {
        this.error = { name: error.name, message: error.message };
      } else {
        this.error = error;
      }
    }

    return this;
  };

  /**
   * We flush the breadcrumb after it's been sent to Sentry, so we can prevent duplicates.
   * @returns {SentryBreadcrumb}
   */
  flush = (): SentryBreadcrumb => {
    const { message, level, category, error } = this;

    const breadcrumb: SentryBreadcrumb = {
      data: {
        url: message,
      },
      level,
      category,
      type: 'http',
    };

    if (error && breadcrumb.data) {
      breadcrumb.data.error = JSON.stringify(error);
    }

    return breadcrumb;
  };
}
