import {
  ApolloLink,
  FetchResult,
  NextLink,
  Observable,
  Operation,
} from '@apollo/client/core';
import { Observer } from '@apollo/client/utilities/observables/Observable';
import { addBreadcrumb } from '@sentry/react';

import { Span, trackSpan } from '../utils/analytics';
import { BreadcrumbCategory, OperationBreadcrumb } from './SentryBreadcrumb';

export class LoggingLink extends ApolloLink {
  /**
   * This is where the GraphQL operation is received
   * A breadcrumb will be created for the operation, and error/response data will be handled
   * @param {ApolloOperation} op
   * @param {NextLink} forward
   * @returns {Observable<FetchResult> | null}
   */
  request = (
    op: Operation,
    forward: NextLink
  ): Observable<FetchResult> | null => {
    // Create a new breadcrumb for this specific operation
    const breadcrumb = new OperationBreadcrumb();

    const { name, type } = this.getOperationDetails(op);
    breadcrumb.setMessage(name).setCategory(type);

    const span = trackSpan('graphql_request', {
      service_name: 'network',
      operation_name: name,
      operation_type: type,
    });

    // Start observing the operation for results
    return new Observable<FetchResult>((observer) => {
      const subscription = forward(op).subscribe({
        next: (result: FetchResult) =>
          this.handleResult(result, breadcrumb, observer),
        complete: () => this.handleComplete(breadcrumb, span, observer),
        error: (error: any) => this.handleError(breadcrumb, error, observer),
      });

      // Close the subscription
      return () => subscription?.unsubscribe();
    });
  };

  getOperationDetails = (
    op: Operation
  ): { name: string; type: BreadcrumbCategory | undefined } => {
    const def = op.query.definitions[0];
    return {
      name: op.operationName,
      type: def.kind === 'OperationDefinition' ? def.operation : undefined,
    };
  };

  /**
   * Handle the operation's response
   * The breadcrumb is not yet attached to Sentry after this method
   * @param {FetchResult} result
   * @param {OperationBreadcrumb} breadcrumb
   * @param observer
   */
  handleResult = (
    result: FetchResult,
    breadcrumb: OperationBreadcrumb,
    observer: Observer<FetchResult>
  ): void => {
    if (result.errors) {
      breadcrumb.setError(result.errors);
    }

    observer.next?.(result);
  };

  /**
   * Changes the level and type of the breadcrumb to `error`
   * Furthermore, if the includeError option is truthy, the error data will be attached
   * Then, the error will be attached to Sentry
   * @param {OperationBreadcrumb} breadcrumb
   * @param error
   * @param observer
   */
  handleError = (
    breadcrumb: OperationBreadcrumb,
    error: any,
    observer: Observer<FetchResult>
  ): void => {
    breadcrumb.setError(error);
    observer.error?.(error);
  };

  /**
   * Since no error occurred, it is time to attach the breadcrumb to Sentry
   * @param {OperationBreadcrumb} breadcrumb
   * @param observer
   */
  handleComplete = (
    breadcrumb: OperationBreadcrumb,
    span: Span,
    observer: Observer<FetchResult>
  ): void => {
    const breadcrumbData = breadcrumb.flush();
    addBreadcrumb(breadcrumbData);
    span.end({ error: !!breadcrumbData.data?.error });
    observer.complete?.();
  };
}
