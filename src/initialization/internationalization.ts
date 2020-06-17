import { DefaultProps, Internationalization, Props } from '../types';

export const generateI18n = (props: Props, defaultProps: DefaultProps): Internationalization => {
  const i18n = props?.internationalization;
  const defaultI18n = defaultProps.internationalization;

  return {
    common: {
      determinationCoefficient:
        i18n?.common?.determinationCoefficient || defaultI18n.common.determinationCoefficient,
      resetZoom: i18n?.common?.resetZoom || defaultI18n.common.resetZoom,
    },
    curveSettings: {
      title: i18n?.curveSettings?.title || defaultI18n.curveSettings.title,
      polynomialOrder: {
        label:
          i18n?.curveSettings?.polynomialOrder?.label ||
          defaultI18n.curveSettings.polynomialOrder.label,
      },
      xCoordinate: {
        label:
          i18n?.curveSettings?.xCoordinate?.label || defaultI18n.curveSettings.xCoordinate.label,
      },
      yCoordinate: {
        label:
          i18n?.curveSettings?.yCoordinate?.label || defaultI18n.curveSettings.yCoordinate.label,
      },
    },
    textSettings: {
      title: i18n?.textSettings?.title || defaultI18n.textSettings.title,
      curveName: {
        label: i18n?.textSettings?.curveName?.label || defaultI18n.textSettings.curveName.label,
        placeholder:
          i18n?.textSettings?.curveName?.placeholder ||
          defaultI18n.textSettings.curveName.placeholder,
      },
      xAxis: {
        label: i18n?.textSettings?.xAxis?.label || defaultI18n.textSettings.xAxis.label,
        placeholder:
          i18n?.textSettings?.xAxis?.placeholder || defaultI18n.textSettings.xAxis.placeholder,
      },
      yAxis: {
        label: i18n?.textSettings?.yAxis?.label || defaultI18n.textSettings.yAxis.label,
        placeholder:
          i18n?.textSettings?.yAxis?.placeholder || defaultI18n.textSettings.yAxis.placeholder,
      },
      description: {
        label: i18n?.textSettings?.description?.label || defaultI18n.textSettings.description.label,
        placeholder:
          i18n?.textSettings?.description?.placeholder ||
          defaultI18n.textSettings.description.placeholder,
      },
    },
  };
};
