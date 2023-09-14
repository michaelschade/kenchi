import { Conforms } from './types';

type AppAndHud = Conforms<{
  emberCommand: {
    origin: 'pageScript';
    args: Record<string, unknown>;
    resp: void;
  };

  'gmail:updateVariables': {
    origin: 'contentScript';
    args: Record<string, unknown>;
    resp: void;
  };

  frontCommand: {
    origin: 'pageScript';
    args: Record<string, unknown>;
    resp: void;
  };

  urlChanged: {
    origin: 'background';
    args: { url: string };
    resp: void;
  };
}>;

export default AppAndHud;
