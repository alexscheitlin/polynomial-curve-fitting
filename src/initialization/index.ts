import { Curve, DefaultProps, Internationalization, Props, Settings } from '../types';
import { generateCurve } from './curve';
import { generateI18n } from './internationalization';
import { generateSettings } from './settings';

export const initValues = (
  props: Props,
  defaultProps: DefaultProps
): [Settings, Curve, Internationalization] => {
  const settings = generateSettings(props, defaultProps);
  const curve = generateCurve(props, defaultProps, settings);
  const i18n = generateI18n(props, defaultProps);
  return [settings, curve, i18n];
};
