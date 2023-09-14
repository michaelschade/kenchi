import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { css } from '@emotion/react';
import {
  faCrosshairs,
  faExclamationTriangle,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';

import { BaseColors } from '@kenchi/ui/lib/Colors';
import { FormGroup, TextArea } from '@kenchi/ui/lib/Form';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { isExtension } from '../../utils';
import useMessageRouter from '../../utils/useMessageRouter';
import { parseXPath } from '../../utils/xpath';

const containerStyle = css`
  display: flex;

  div,
  input {
    flex-grow: 1;
  }
`;

const selectorStyle = css`
  margin-left: 5px;
  padding: 7px;
  cursor: pointer;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.picking {
    color: #35dc45cc;
  }

  &.error {
    opacity: 1;
    color: ${BaseColors.error};
  }
`;

enum PickingState {
  off,
  picking,
  minimizing,
}

const XPathInputContext = createContext<
  [boolean, (running: boolean) => void] | null
>(null);

export function XPathInputProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <XPathInputContext.Provider value={useState<boolean>(false)}>
      {children}
    </XPathInputContext.Provider>
  );
}

function useXPathInputContext() {
  const context = useContext(XPathInputContext);
  if (!context) {
    throw new Error('XPathInput must be wrapped in an XPathInputProvider');
  }
  return context;
}

type XPathInputProps = {
  id: string;
  value: string;
  onChange: (xpath: string) => void;
};
export default function XPathInput({ id, value, onChange }: XPathInputProps) {
  const [minimizerRunning, setMinimizerRunning] = useXPathInputContext();

  const [xPathError, setXPathError] = useState(false);
  const [pickingState, setPickingState] = useState<PickingState>(
    PickingState.off
  );
  const [focus, setFocus] = useState(false);

  const validateXPath = useCallback((xpath: string) => {
    let error = false;
    try {
      document.createExpression(parseXPath(xpath));
    } catch (e) {
      error = true;
    }
    setXPathError(error);
  }, []);

  const messageRouter = useMessageRouter<'app'>();
  const startSelect = useCallback(async () => {
    await messageRouter.sendCommand('pageScript', 'domPicker:start', {
      ui: false,
    });
    setPickingState(PickingState.picking);
  }, [messageRouter]);

  useEffect(() => {
    if (pickingState !== PickingState.picking) {
      return;
    }
    const cancel = async () => {
      await messageRouter.sendCommand('pageScript', 'domPicker:cancel');
      setPickingState(PickingState.off);
    };
    window.addEventListener('click', cancel);
    return () => window.removeEventListener('click', cancel);
  }, [messageRouter, pickingState]);

  useEffect(() => {
    if (!focus || !messageRouter || xPathError || !value) {
      return;
    }
    const xpath = parseXPath(value);
    messageRouter.sendCommand('pageScript', 'domPicker:focus', { xpath });
    return () => {
      messageRouter.sendCommand('pageScript', 'domPicker:cancelFocus', {
        xpath,
      });
    };
  }, [messageRouter, focus, xPathError, value]);

  useEffect(() => {
    if (pickingState === PickingState.off) {
      return;
    }
    const updateFullXPath = async ({ fullXPath }: { fullXPath: string }) => {
      setPickingState(PickingState.minimizing);
      setMinimizerRunning(true);
      validateXPath(fullXPath);
      onChange(fullXPath);
    };
    const updateMinimizedXPath = async ({
      minimizedXPath,
    }: {
      minimizedXPath: string | null;
    }) => {
      setPickingState(PickingState.off);
      setMinimizerRunning(false);
      if (!minimizedXPath) {
        return;
      }
      validateXPath(minimizedXPath);
      onChange(minimizedXPath);
    };
    messageRouter.addCommandHandler(
      'pageScript',
      'domPickerSelected',
      updateFullXPath
    );
    messageRouter.addCommandHandler(
      'pageScript',
      'domPickerFinished',
      updateMinimizedXPath
    );
    return () => {
      messageRouter.removeCommandHandler(
        'pageScript',
        'domPickerSelected',
        updateFullXPath
      );
      messageRouter.removeCommandHandler(
        'pageScript',
        'domPickerFinished',
        updateMinimizedXPath
      );
    };
  }, [
    validateXPath,
    messageRouter,
    pickingState,
    onChange,
    value,
    setMinimizerRunning,
  ]);

  const otherMinimizerRunning =
    minimizerRunning && pickingState !== PickingState.minimizing;
  let domPickerTitle: string | undefined = undefined;
  if (!isExtension()) {
    domPickerTitle =
      'Quick selection can only be done via the Kenchi extension';
  } else if (otherMinimizerRunning) {
    domPickerTitle =
      'The quick seletor is finishing up with another step, please wait a moment';
  }

  const disabled = !isExtension() || otherMinimizerRunning;

  return (
    <FormGroup id={id}>
      <div css={containerStyle}>
        <TextArea
          placeholder="XPath"
          disabled={pickingState === PickingState.minimizing}
          icon={xPathError ? faExclamationTriangle : undefined}
          error={xPathError ? 'Invalid XPath' : undefined}
          value={value}
          onChange={(e) => {
            const xpath = e.target.value;
            validateXPath(xpath);
            onChange(xpath);
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        <span
          css={selectorStyle}
          className={classNames({
            disabled,
            picking: pickingState === PickingState.picking,
            minimizing: pickingState === PickingState.minimizing,
            error: xPathError,
          })}
          title={domPickerTitle}
          onClick={() => {
            if (!disabled) {
              startSelect();
            }
          }}
        >
          {pickingState === PickingState.minimizing ? (
            <LoadingSpinner name="xpath input" />
          ) : (
            <FontAwesomeIcon icon={faCrosshairs} />
          )}
        </span>
      </div>
    </FormGroup>
  );
}
