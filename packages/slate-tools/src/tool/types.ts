import { SlateNode } from '../types';

export type ToolInput = {
  id: string;
  source: 'input' | 'page';
  placeholder: string;
};

export type SlateConfig = {
  slate: true;
  rich: boolean;
  singleLine: boolean;
  children: SlateNode[];
};
