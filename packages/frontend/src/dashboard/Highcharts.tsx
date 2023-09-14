import {
  forwardRef,
  memo,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { useTheme } from '@emotion/react';
import H from 'highcharts';
import merge from 'lodash/merge';
import { createPortal } from 'react-dom';

import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

export type HighchartsProps = {
  options: H.Options;
  loading?: boolean;
  updateArgs?: [boolean, boolean, boolean] | [boolean, boolean];
  containerProps?: React.HTMLProps<HTMLDivElement>;
};

export type HighchartsRef = {
  chart: H.Chart | undefined;
  container: HTMLDivElement | null;
};

const Highcharts = forwardRef(
  (
    { options, loading, updateArgs, containerProps }: HighchartsProps,
    ref: React.Ref<HighchartsRef>
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<H.Chart>();
    const [, rerenderToCreateLoadingPortal] = useReducer(() => true, false);
    const { colors } = useTheme();

    const optionsWithDefaults = useMemo(
      () =>
        merge<H.Options, H.Options>(
          {
            chart: {
              events: {
                load: function () {
                  // Since we don't have a ref on instantiation, our portal with
                  // the loading spinner won't create, so trigger a rerender
                  // once the chart initially loads.
                  rerenderToCreateLoadingPortal();
                },
              },
              backgroundColor: 'transparent',
              borderColor: colors.gray[6],
              plotBorderColor: colors.gray[6],
            },
            title: {
              style: {
                color: colors.gray[12],
              },
            },
            xAxis: {
              title: {
                style: {
                  color: colors.gray[11],
                },
              },
              labels: {
                style: {
                  color: colors.gray[11],
                },
              },
            },
            yAxis: {
              title: {
                style: {
                  color: colors.gray[11],
                },
              },
              labels: {
                style: {
                  color: colors.gray[11],
                },
              },
            },
            legend: {
              enabled: false,
            },
            credits: {
              enabled: false,
            },
            colors: [colors.accent[9]],
          },
          options
        ),
      [colors, options]
    );

    useLayoutEffect(() => {
      if (chartRef.current) {
        chartRef.current.update(
          optionsWithDefaults,
          ...(updateArgs || [true, true])
        );
      } else if (containerRef.current) {
        chartRef.current = H.chart(containerRef.current, optionsWithDefaults);
      }
    });

    useLayoutEffect(() => {
      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = undefined;
        }
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get chart() {
          return chartRef.current;
        },
        get container() {
          return containerRef.current;
        },
      }),
      []
    );

    // Create container for the chart
    return (
      <>
        <div {...containerProps} ref={containerRef} />
        {containerRef.current &&
          loading &&
          createPortal(
            <div
              style={{
                position: 'absolute',
                margin: '0 auto',
                width: '100%',
                top: '50%',
                textAlign: 'center',
              }}
            >
              <LoadingSpinner />
            </div>,
            containerRef.current
          )}
      </>
    );
  }
);

export type Options = H.Options;

export default memo(Highcharts);
