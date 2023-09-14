import FlatQueue from 'flatqueue';
import wait from 'waait';

import { BitArray } from '../utils';

// Inspired by https://stackoverflow.com/questions/2661818/javascript-get-xpath-of-a-node
type Segment = {
  localName: string;
  id?: string;
  index?: number;
  inputName?: string;
  classNames?: string[];
};
enum IncludeOptions {
  segment,
  id,
  index,
  inputName,
  classNames,
}
const NON_CLASS_SKIP_OPTIONS: number = IncludeOptions.classNames;

export const filterId = (id: string) =>
  !id.match(/^ember\d+$/) &&
  !id.match(/^expandable_section_\d+$/) &&
  !id.match(/^checkbox\d+$/) &&
  !id.match(/^menu\d+-button$/);

export function getXPathSegments(origElem: HTMLElement) {
  const segs: Segment[] = [];

  // First get all class names so we can identify if they're generated
  const classCounts: number[] = [];
  document.querySelectorAll('*').forEach((e) => {
    e.classList.forEach((c) => {
      const nameLength = c.length;
      classCounts[nameLength] = (classCounts[nameLength] || 0) + 1;
    });
  });
  // This counts uses, not unique class names
  const totalClassesUsed = classCounts.reduce(
    (totalCount, count) => totalCount + count,
    0
  );
  let bannedClassLength: number | null = null;
  if (totalClassesUsed > 100) {
    // On FB's home page, 23539 of the 23616 classes have the same length. 90% length coverage should be strict enough
    const maxAllowableCountPerLength = Math.round(totalClassesUsed * 0.9);
    const overusedClassLength = classCounts.findIndex(
      (count) => count > maxAllowableCountPerLength
    );
    if (overusedClassLength !== -1) {
      bannedClassLength = overusedClassLength;
      console.log(`Skipping all class names of length ${overusedClassLength}`);
    }
  }

  for (
    var elem: HTMLElement | null = origElem;
    elem?.nodeType === 1;
    elem = elem.parentNode as HTMLElement | null
  ) {
    const seg: Segment = {
      localName: elem.localName.toLowerCase(),
    };
    const id = elem.getAttribute('id');
    if (
      id &&
      filterId(id) &&
      document.querySelectorAll(`#${id}`).length === 1
    ) {
      seg.id = id;
    }

    // Presume short class names aren't helpful (e.g. px-1 from bootstrap)
    const classNames = [...elem.classList].filter(
      (s) => s && (!bannedClassLength || s.length !== bannedClassLength)
    );
    if (classNames && classNames.length > 0) {
      seg.classNames = classNames;
    }

    if (
      seg.localName === 'input' ||
      seg.localName === 'textarea' ||
      seg.localName === 'select'
    ) {
      seg.inputName = elem.getAttribute('name') || undefined;
    }
    if (!seg.id) {
      // Index is lame and also more expensive to compute, only do it if we don't have an ID.
      // TODO: this is only a top-level index on node type, do we want to do anything with selective indexes
      for (
        var i = 1, sib = elem.previousSibling as HTMLElement | null;
        sib;
        sib = sib.previousSibling as HTMLElement | null
      ) {
        if (sib.localName === elem.localName) i++;
      }
      seg.index = i;
    }
    segs.unshift(seg);
  }

  return segs;
}

export function getSearchTime(segs: Segment[]) {
  const totalElements = document.querySelectorAll('*').length;

  // Value from 0 - 1
  const complexity = (value: number, min: number, max: number) => {
    return (Math.min(max, Math.max(min, value)) - min) / (max - min);
  };

  const classNamesCounts = segs.map((seg) => seg.classNames?.length || 0);
  const optionsPerSeg = Math.max(...classNamesCounts) + NON_CLASS_SKIP_OPTIONS;

  // Simple: 100 segs*options & 1000 page elements
  // Complex page: 200 segs*options & 3000 page elements
  // Compount both and spread it between 4s and 12s for search time
  const segsComplexity = complexity(segs.length * optionsPerSeg, 100, 200);
  const pageComplexity = complexity(totalElements, 1000, 3000);
  return Math.ceil(segsComplexity * pageComplexity * 8 + 4) * 1000;
}

type SegmentTrial = {
  segIdx: number;
  progress: number;
  includes: BitArray;
};

let perf: Record<string, number> = {};
export async function minimizeSegments(
  segs: Segment[],
  searchTime: number
): Promise<string | null> {
  perf = {};
  const finished = new FlatQueue<[BitArray, number]>();

  const queue = new FlatQueue<SegmentTrial>();
  const classNamesCounts = segs.map((seg) => seg.classNames?.length || 0);
  const optionsPerSeg = Math.max(...classNamesCounts) + NON_CLASS_SKIP_OPTIONS;
  const includes = new BitArray(segs.length * optionsPerSeg);
  includes.set(
    (segs.length - 1) * optionsPerSeg + IncludeOptions.segment,
    true
  ); // We need the last segment
  queue.push({ progress: 0, segIdx: segs.length - 1, includes }, 0);

  console.log(`Running XPath search for ${searchTime}ms`);

  const maxTime = Date.now() + searchTime;
  let count = 0,
    bailed = false;
  const perfBar: number[] = [];
  const finishedBar: number[] = [0];
  let perfBarStart = performance.now();
  let barIndex = 0;

  while (queue.peek()) {
    count++;
    if (count % 100 === 0) {
      const perfNow = performance.now();
      perfBar[barIndex++] = perfNow - perfBarStart;
      finishedBar[barIndex] = 0;
      perfBarStart = perfNow;
      const timeLeft = maxTime - Date.now();
      if (timeLeft <= 0) {
        bailed = true;
        break;
      }

      await wait();
    }

    const value = queue.peekValue() as number;
    const { progress, segIdx, includes } = queue.pop() as SegmentTrial;
    if (isUniqueXPath(compileSegments(segs, includes, optionsPerSeg, true))) {
      finished.push([includes, count], value);
      finishedBar[barIndex]++;
      continue;
    }

    // Failed
    if (segIdx === -1) {
      continue;
    }

    let advanceSegment = false;
    let terminateSegment = false;
    const trial = {
      progress,
      segIdx,
      includes: includes.clone(),
    };

    const seg = segs[segIdx];
    const includeOffset = segIdx * optionsPerSeg;

    switch (progress) {
      case 0:
        trial.progress++;
        if (segIdx + 1 !== segs.length) {
          // Last one is already set
          trial.includes.set(includeOffset + IncludeOptions.segment, true);
          break;
        }
      // eslint-disable-next-line no-fallthrough
      case 1:
        // If we're skipping we implicitly skip the rest of these
        if (!trial.includes.get(includeOffset + IncludeOptions.segment)) {
          advanceSegment = true;
          break;
        }

        trial.progress++;
        if (seg.id) {
          trial.includes.set(includeOffset + IncludeOptions.id, true);
          break;
        }
      // eslint-disable-next-line no-fallthrough
      case 2:
        // If we have ID we implicitly skip the rest of these
        if (seg.id && trial.includes.get(includeOffset + IncludeOptions.id)) {
          terminateSegment = true;
          break;
        }

        trial.progress++;
        if (seg.index) {
          trial.includes.set(includeOffset + IncludeOptions.index, true);
          break;
        }
      // eslint-disable-next-line no-fallthrough
      case 3:
        trial.progress++;
        if (seg.inputName) {
          trial.includes.set(includeOffset + IncludeOptions.inputName, true);
          break;
        }
      // eslint-disable-next-line no-fallthrough
      default:
        const classNameIdx = trial.progress - 4;
        if (seg.classNames && classNameIdx < seg.classNames.length) {
          trial.includes.set(
            includeOffset + IncludeOptions.classNames + classNameIdx,
            true
          );
          trial.progress++;
        } else {
          advanceSegment = true;
        }
    }

    if (advanceSegment) {
      trial.segIdx--;
      trial.progress = 0;
      queue.push(trial, scoreTrial(segs, trial, optionsPerSeg));
    } else if (terminateSegment) {
      // We're done, fast track this into the finished queue
      queue.push(
        {
          progress: 0,
          segIdx: -1,
          includes,
        },
        scoreTrial(segs, trial, optionsPerSeg)
      );
    } else {
      // Try one branch with changes, one without
      queue.push(trial, scoreTrial(segs, trial, optionsPerSeg));
      queue.push(
        {
          progress: trial.progress,
          segIdx: trial.segIdx,
          includes,
        },
        scoreTrial(segs, trial, optionsPerSeg)
      );
    }
  }

  console.log(
    `Finished run ${
      bailed && '(bailed out early)'
    } after ${count} checks (timing ${sparkline(perfBar)})`
  );
  console.log(`Performance timings:`, perf);

  const best = finished.peek();
  if (best) {
    console.log(
      `Found best score (${finished.peekValue()}) out of ${
        finished.length
      } valid paths (search distribution ${sparkline(finishedBar)}, this was #${
        best[1]
      })`
    );
    return compileSegments(segs, best[0], optionsPerSeg, false);
  } else {
    console.log(`No results found in time`);
    return null;
  }
}

function scoreTrial(
  segs: Segment[],
  { includes }: SegmentTrial,
  optionsPerSeg: number
) {
  // Lower is better
  const start = performance.now();
  const rtn = segs.reduce((count, seg, i) => {
    const includeOffset = i * optionsPerSeg;
    if (!includes.get(includeOffset + IncludeOptions.segment)) {
      // Skipping is great!
      return count;
    }
    if (seg.id && includes.get(includeOffset + IncludeOptions.id)) {
      // IDs are pretty good (we won't add other things on top of an ID)
      return count + 2;
    }
    let newCount = count;
    if (
      seg.inputName &&
      includes.get(includeOffset + IncludeOptions.inputName)
    ) {
      newCount += 2;
    }
    if (seg.index && includes.get(includeOffset + IncludeOptions.index)) {
      // Indexes suck
      newCount += 10;
    }
    if (seg.classNames) {
      seg.classNames.forEach((className, classNameIndex) => {
        if (
          includes.get(
            includeOffset + IncludeOptions.classNames + classNameIndex
          )
        ) {
          // Longer classnames seem better?
          newCount +=
            4 - (className.length > 10 ? 2 : className.length > 5 ? 1 : 0);
        }
      });
    }

    if (newCount === count) {
      // We don't like empty nodes, they're usually structural rather than semantic
      newCount += 10;
    } else {
      newCount += 1;
    }

    // But if we have an empty node type
    return newCount;
  }, 0);
  perf.startTrial = (perf.startTrial || 0) + performance.now() - start;
  return rtn;
}

function sparkline(numbers: number[]) {
  var bar = [0, 1, 2, 3, 4, 5, 6].map(function (n) {
    return String.fromCharCode(9601 + n);
  });
  var min = Math.min.apply(Math, numbers);
  var max = Math.max.apply(Math, numbers);
  var div = (max - min) / (bar.length - 1);
  if (min === max) return Array(numbers.length).join(bar[bar.length - 1]);
  return numbers
    .map(function (p) {
      return bar[Math.round((p - min) / div)];
    })
    .join('');
}

export function compileAllSegments(segs: Segment[]) {
  const classNamesCounts = segs.map((seg) => seg.classNames?.length || 0);
  const optionsPerSeg = Math.max(...classNamesCounts) + NON_CLASS_SKIP_OPTIONS;

  const everything = new BitArray(segs.length * optionsPerSeg);
  for (var i = 0; i < segs.length * optionsPerSeg; i++) {
    everything.set(i, true);
  }
  // Using 0 optionsPerSeg causes us to check the same BitArray indexes for
  // each segment
  return compileSegments(segs, everything, optionsPerSeg, false);
}

function compileSegments(
  segs: Segment[],
  includes: BitArray,
  optionsPerSeg: number,
  forRunning: boolean
) {
  const start = performance.now();
  let idStart = -1;
  let compiled = segs.map((seg, i) => {
    const includeOffset = optionsPerSeg * i;
    if (!includes.get(includeOffset + IncludeOptions.segment)) {
      return '';
    }
    if (seg.id && includes.get(includeOffset + IncludeOptions.id)) {
      idStart = i;
      return `id("${seg.id}")`;
    }
    let path = seg.localName;
    if (seg.index && includes.get(includeOffset + IncludeOptions.index)) {
      path += `[${seg.index}]`;
    }
    if (
      seg.inputName &&
      includes.get(includeOffset + IncludeOptions.inputName)
    ) {
      path += `[name="${seg.inputName}"]`;
    }
    if (seg.classNames) {
      seg.classNames.forEach((className, i) => {
        if (!includes.get(includeOffset + IncludeOptions.classNames + i)) {
          return;
        }
        if (forRunning) {
          // Use a looser search for perf, worst case we exclude some possibilities
          path += `[contains(@class, "${className}")]`;
        } else {
          path += `[has-class("${className}")]`;
        }
      });
    }
    return path;
  });
  if (idStart === -1) {
    compiled.unshift('');
  } else {
    compiled = compiled.slice(idStart);
  }
  const rtn = compiled.join('/').replace(/\/{2,}/g, '//');
  perf.compileSegments =
    (perf.compileSegments || 0) + performance.now() - start;
  return rtn;
}

function isUniqueXPath(xpath: string) {
  const start = performance.now();
  const res = document.evaluate(
    `count(${xpath}) = 1`,
    document,
    null,
    XPathResult.BOOLEAN_TYPE
  );
  perf.isUniqueXPath = (perf.isUniqueXPath || 0) + performance.now() - start;
  return res.booleanValue;
}
