import AppAndHud from './appAndHud';
import { Conforms } from './types';

type HUD = Conforms<{
  updateSearch: {
    origin: 'pageScript';
    args: { value: string | null };
    resp: void;
  };

  keyPress: {
    origin: 'pageScript';
    args: {
      key: 'ArrowUp' | 'ArrowDown' | 'Enter' | 'Tab' | 'Escape';
      shiftKey: boolean;
    };
    resp: void;
  };
}> &
  AppAndHud;

export default HUD;
