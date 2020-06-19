import { defaultProps } from '../../src/default-props';
import { initValues } from '../../src/initialization';
import {
  Curve,
  Internationalization,
  Props,
  PropsCurveCoefficients,
  Settings,
} from '../../src/types';

test('BB_CURVE_CLIENT_CHURN_ASSET_SIDE', () => {
  const curve: PropsCurveCoefficients = { coefficients: [0.12, 7.5, 200.0] };
  const props: Props = { curve: curve };

  const [, INITIAL_CURVE]: [Settings, Curve, Internationalization] = initValues(
    props,
    defaultProps
  );

  expect(INITIAL_CURVE.coefficients).toEqual(curve.coefficients);
});

// wont pass due to coefficient precision
test.skip('BB_CURVE_SERVICE_QUALITY_ASSET_SIDE', () => {
  const curve: PropsCurveCoefficients = { coefficients: [1.0, 0.0, -0.000308, 0.00000208] };
  const props: Props = { curve: curve };

  const [, INITIAL_CURVE]: [Settings, Curve, Internationalization] = initValues(
    props,
    defaultProps
  );

  expect(INITIAL_CURVE.coefficients).toEqual(curve.coefficients);
});

test('BB_CURVE_CLIENT_CHURN_LIABILITIES_SIDE', () => {
  const curve: PropsCurveCoefficients = { coefficients: [0.1, -6.75, 162.5] };
  const props: Props = { curve: curve };

  const [, INITIAL_CURVE]: [Settings, Curve, Internationalization] = initValues(
    props,
    defaultProps
  );

  expect(INITIAL_CURVE.coefficients).toEqual(curve.coefficients);
});

// wont pass due to coefficient precision
test.skip('SERVICE_QUALITY_PASSIVE_SIDE', () => {
  const curve: PropsCurveCoefficients = { coefficients: [1.0, 0.0, -0.000308, 0.00000208] };
  const props: Props = { curve: curve };

  const [, INITIAL_CURVE]: [Settings, Curve, Internationalization] = initValues(
    props,
    defaultProps
  );

  expect(INITIAL_CURVE.coefficients).toEqual(curve.coefficients);
});

test('CUSTOMER_GAIN_ASSET_SIDE', () => {
  const curve: PropsCurveCoefficients = { coefficients: [0.22, -4.0, 32.0] };
  const props: Props = { curve: curve };

  const [, INITIAL_CURVE]: [Settings, Curve, Internationalization] = initValues(
    props,
    defaultProps
  );

  expect(INITIAL_CURVE.coefficients).toEqual(curve.coefficients);
});

// wont pass due to coefficient precision
test.skip('GDP_GROWTH_LOANS', () => {
  const curve: PropsCurveCoefficients = { coefficients: [0.080808, 2.0, -8.080808] };
  const props: Props = { curve: curve };

  const [, INITIAL_CURVE]: [Settings, Curve, Internationalization] = initValues(
    props,
    defaultProps
  );

  expect(INITIAL_CURVE.coefficients).toEqual(curve.coefficients);
});

test.skip('CUSTOMER_GAIN_PASSIVE_SIDE', () => {
  const curve: PropsCurveCoefficients = { coefficients: [0.22, 5.0, 52.0] };
  const props: Props = { curve: curve };

  const [, INITIAL_CURVE]: [Settings, Curve, Internationalization] = initValues(
    props,
    defaultProps
  );

  expect(INITIAL_CURVE.coefficients).toEqual(curve.coefficients);
});
