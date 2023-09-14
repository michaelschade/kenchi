import { forwardRef, useMemo } from 'react';

import H from 'highcharts';
import merge from 'lodash/merge';

import Highcharts, { HighchartsProps, HighchartsRef } from '../Highcharts';

export const CHART_HEIGHT = 300;

export function pointFormatter(
  decimalPoints = 0,
  suffix = ''
): H.FormatterCallbackFunction<H.Point> {
  return function () {
    const lines = [
      `${this.series.name}: <strong>${H.numberFormat(
        this.y!,
        decimalPoints
      )}${suffix}</strong>`,
    ];

    // @ts-ignore
    const count = this.count;
    if (count) {
      lines.push(`Total ratings: <strong>${count}</strong>`);
    }

    // @ts-ignore
    const minValue = this.getZone().valueForTooltip;
    if (minValue && this.x > minValue) {
      lines.push(`<em>Partial data</em>`);
    }

    return lines.join('<br />');
  };
}

export const Sparkline = forwardRef(
  ({ options, ...props }: HighchartsProps, ref: React.Ref<HighchartsRef>) => {
    const optionsWithDefaults = useMemo(
      () =>
        merge<H.Options, H.Options>(
          {
            chart: {
              events: {
                render: function () {
                  const el = this.container.parentElement;
                  if (el) {
                    el.style.overflow = 'visible';
                  }
                },
              },
              backgroundColor: undefined,
              borderWidth: 0,
              type: 'area',
              margin: [2, 0, 2, 0],
              height: 30,
              style: {
                overflow: 'visible',
              },
            },
            title: {
              text: '',
            },
            credits: {
              enabled: false,
            },
            xAxis: {
              visible: false,
            },
            yAxis: {
              endOnTick: false,
              startOnTick: false,
              labels: {
                enabled: false,
              },
              title: {
                text: null,
              },
              tickPositions: [0],
            },
            legend: {
              enabled: false,
            },
            tooltip: {
              hideDelay: 0,
              outside: true,
              shared: true,
            },
            plotOptions: {
              series: {
                pointPlacement: 'on',
                animation: false,
                lineWidth: 1,
                shadow: false,
                connectNulls: true,
                states: {
                  hover: {
                    lineWidth: 1,
                  },
                },
                marker: {
                  radius: 1,
                  states: {
                    hover: {
                      radius: 2,
                    },
                  },
                },
                // fillOpacity: 0.25,
              },
              column: {
                negativeColor: '#910000',
                borderColor: 'silver',
              },
            },
          },
          options
        ),
      [options]
    );
    return <Highcharts ref={ref} options={optionsWithDefaults} {...props} />;
  }
);

export const FullChart = forwardRef(
  ({ options, ...props }: HighchartsProps, ref: React.Ref<HighchartsRef>) => {
    const optionsWithDefaults = useMemo(
      () =>
        merge<H.Options, H.Options>(
          {
            plotOptions: {
              series: {
                connectNulls: true,
                tooltip: {
                  headerFormat: '<strong>{point.key}</strong><br />',
                  pointFormatter: pointFormatter(),
                },
                pointPlacement: 'on',
              },
            },
            chart: {
              events: {
                render: function () {
                  this.container
                    .querySelectorAll(
                      '.highcharts-xaxis-labels text:first-child'
                    )
                    .forEach((e) => e.setAttribute('text-anchor', 'start'));
                  this.container
                    .querySelectorAll(
                      '.highcharts-xaxis-labels text:last-child'
                    )
                    .forEach((e) => {
                      e.setAttribute('text-anchor', 'end');
                      const x = e.getAttribute('x');
                      if (x) {
                        // No clue why this is necessary...
                        e.setAttribute('x', `${parseFloat(x) + 14}`);
                      }
                    });
                },
              },
            },

            xAxis: {
              labels: {
                style: {
                  textOverflow: 'none',
                  whiteSpace: 'nowrap',
                },
                rotation: 0,
                formatter: function () {
                  if (this.isFirst || this.isLast) {
                    return `${this.value}`;
                  } else {
                    return '';
                  }
                },
              },
            },
          },
          options
        ),
      [options]
    );

    return <Highcharts ref={ref} options={optionsWithDefaults} {...props} />;
  }
);
