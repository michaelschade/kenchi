import {
  ApolloLink,
  NextLink,
  Observable,
  Operation,
} from '@apollo/client/core';
import {
  ObservableSubscription,
  Observer,
} from '@apollo/client/utilities/observables/Observable';
import { addBreadcrumb, captureMessage } from '@sentry/react';
import { DefinitionNode } from 'graphql';
import qs from 'qs';

import { isExtension } from '../utils';

const API_URL = `${process.env.REACT_APP_API_HOST}/graphql`;

let csrfToken: string | null = null;
export function hasCSRFToken() {
  return !!csrfToken;
}

const definitionIsMutation = (d: DefinitionNode) => {
  return d.kind === 'OperationDefinition' && d.operation === 'mutation';
};

let inFlightViewerPromise: Promise<void> | null;
const fetchViewer = () => {
  if (!inFlightViewerPromise) {
    const fetchViewerImpl = async () => {
      try {
        // TODO: this doesn't expire so we could store it in localStorage across page loads
        // TODO: we should also make csrfTokens expire every so-often
        const res = await fetch(
          API_URL +
            '?' +
            qs.stringify({ query: 'query { viewer { csrfToken } }' }),
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        let json: any = null;
        if (res.status === 200) {
          json = await res.json();
          if (json.data) {
            csrfToken = json.data.viewer.csrfToken;
            return;
          }
        }
        console.log('Unable to fetch CSRF token', res.status, json);
      } catch (error) {
        // TypeError is a network or CORS error
        // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful
        if (error instanceof TypeError) {
          addBreadcrumb({
            category: 'graphql',
            message: 'Network error fetching CSRF token',
            level: 'warning',
            data: { fetchError: error.message },
          });
        } else {
          throw error;
        }
      }
    };
    inFlightViewerPromise = fetchViewerImpl().finally(
      () => (inFlightViewerPromise = null)
    );
  }
  return inFlightViewerPromise;
};

class CSRFOperation<TValue = any> {
  private values: any[] = [];
  private error: any;
  private complete = false;
  private canceled = false;
  private observers: (Observer<TValue> | null)[] = [];
  private currentSubscription: ObservableSubscription | null = null;
  private retryCount = 0;

  constructor(private operation: Operation, private nextLink: NextLink) {}

  /**
   * Register a new observer for this operation.
   *
   * If the operation has previously emitted other events, they will be
   * immediately triggered for the observer.
   */
  public subscribe(observer: Observer<TValue>) {
    if (this.canceled) {
      throw new Error(
        `Subscribing to a retryable link that was canceled is not supported`
      );
    }
    this.observers.push(observer);

    // If we've already begun, catch this observer up.
    for (const value of this.values) {
      observer.next && observer.next(value);
    }

    if (this.complete) {
      observer.complete && observer.complete();
    } else if (this.error) {
      observer.error && observer.error(this.error);
    }
  }

  /**
   * Remove a previously registered observer from this operation.
   *
   * If no observers remain, the operation will stop retrying, and unsubscribe
   * from its downstream link.
   */
  unsubscribe(observer: Observer<TValue>) {
    const index = this.observers.indexOf(observer);
    if (index < 0) {
      throw new Error(
        `CSRFLink BUG! Attempting to unsubscribe unknown observer!`
      );
    }
    // Note that we are careful not to change the order of length of the array,
    // as we are often mid-iteration when calling this method.
    this.observers[index] = null;

    // If this is the last observer, we're done.
    if (this.observers.every((o) => o === null)) {
      this.cancel();
    }
  }

  /**
   * Start the initial request.
   */
  start() {
    if (this.currentSubscription) return; // Already started.

    // We're guessing when we're issuing a POST request vs. a GET, since for
    // POSTs we don't want to bother trying a missing CSRF we know is going to
    // fail.
    if (
      !csrfToken &&
      this.operation.query.definitions.some(definitionIsMutation)
    ) {
      this.scheduleRetry();
    } else {
      this.try();
    }
  }

  /**
   * Stop retrying for the operation, and cancel any in-progress requests.
   */
  cancel() {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
    }
    this.currentSubscription = null;
    this.canceled = true;
  }

  try() {
    this.operation.setContext({
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    this.currentSubscription = this.nextLink(this.operation).subscribe({
      next: this.onNext,
      error: this.onError,
      complete: this.onComplete,
    });
  }

  onNext = (value: any) => {
    if (value.errors && value.errors[0].message === 'expired_csrf') {
      if (window.gapiCookieError && isExtension()) {
        console.log(
          'Cannot refresh CSRF because third party cookies are disabled, ignoring.'
        );
      } else if (this.retryCount < 2) {
        this.retryCount++;
        this.scheduleRetry();
        return;
      } else {
        captureMessage('Failed CSRF refresh after 2 tries, raising error');
      }
    }

    this.values.push(value);
    for (const observer of this.observers) {
      if (!observer) continue;
      observer.next && observer.next(value);
    }
  };

  onComplete = () => {
    if (this.values.length === 0) {
      // This is the complete for the error, supress it.
      return;
    }
    this.complete = true;
    for (const observer of this.observers) {
      if (!observer) continue;
      observer.complete && observer.complete();
    }
  };

  onError = (error: any) => {
    this.error = error;
    for (const observer of this.observers) {
      if (!observer) continue;
      observer.error && observer.error(error);
    }
  };

  scheduleRetry() {
    fetchViewer().then(() => this.try());
  }
}

export default function CSRFLink() {
  // Kick off a viewer fetch as soon as we're instantiated
  fetchViewer();
  return new ApolloLink((op, forward) => {
    const retryable = new CSRFOperation(op, forward);
    retryable.start();

    return new Observable((observer) => {
      retryable.subscribe(observer);
      return () => {
        retryable.unsubscribe(observer);
      };
    });
  });
}
