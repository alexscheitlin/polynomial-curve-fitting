import { makeStyles, MenuItem, StepConnector, TextField, Typography } from '@material-ui/core';
import React from 'react';

import { Internationalization } from '../types';
import * as Utils from '../utils/utils';
import Equation from './Equation';

interface Props {
  orderOptions: number[];
  order: number;
  onOrderChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  coefficientPrecision: number;
  coefficients: number[];
  onCoefficientChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => void;

  xAxisMin: number;
  xAxisMax: number;
  yAxisMin: number;
  yAxisMax: number;
  pointCoordinatePrecision: number;
  points: number[][];
  onPointCoordinateChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    coordinateIndex: number
  ) => void;

  i18n: Internationalization;
}

const useStyles = makeStyles(() => ({
  divStyle: {
    display: 'flex',
    flexDirection: 'column',
  },
  numberInput: {
    width: '110px',
  },
  stepConnector: {
    margin: '15px 0',
  },

  flex: {
    display: 'flex',
  },
  flexWrap: {
    flexWrap: 'wrap',
  },
  alignSelfCenter: {
    alignSelf: 'center',
  },
}));

const CurveSettings = ({
  orderOptions,
  order,
  onOrderChange,
  coefficientPrecision,
  coefficients,
  onCoefficientChange,
  xAxisMin,
  xAxisMax,
  yAxisMin,
  yAxisMax,
  pointCoordinatePrecision,
  points,
  onPointCoordinateChange,
  i18n,
}: Props) => {
  const classes = useStyles();

  return (
    <div className={classes.divStyle}>
      <TextField
        select
        label={i18n.curveSettings.polynomialOrder.label}
        variant="outlined"
        margin="dense"
        value={order}
        onChange={e => onOrderChange(e)}
      >
        {orderOptions.map(option => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>

      <StepConnector className={classes.stepConnector}></StepConnector>

      <div className={`${classes.flex} ${classes.flexWrap}`}>
        {coefficients.map((coefficient, i) => {
          return (
            <div key={i} className={classes.flex}>
              <TextField
                type="number"
                variant="outlined"
                margin="dense"
                className={classes.numberInput}
                value={coefficient}
                onChange={e => onCoefficientChange(e, i)}
                inputProps={{
                  step: Utils.precisionToStepSize(coefficientPrecision),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Typography className={classes.alignSelfCenter}>
                <Equation
                  equation={Utils.generatePolynomialTerm(coefficients.length, i, 'x')}
                ></Equation>
              </Typography>
            </div>
          );
        })}
      </div>

      <StepConnector className={classes.stepConnector}></StepConnector>

      <div>
        {points.map((point, i) => {
          return (
            <div key={i} className={classes.flex}>
              <Typography className={classes.alignSelfCenter}>P{i + 1}</Typography>
              <TextField
                label={i18n.curveSettings.xCoordinate.label}
                type="number"
                variant="outlined"
                margin="dense"
                className={classes.numberInput}
                value={point[0]}
                onChange={e => onPointCoordinateChange(e, i, 0)}
                inputProps={{
                  min: xAxisMin,
                  max: xAxisMax,
                  step: Utils.precisionToStepSize(pointCoordinatePrecision),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label={i18n.curveSettings.yCoordinate.label}
                type="number"
                variant="outlined"
                margin="dense"
                className={classes.numberInput}
                value={point[1]}
                onChange={e => onPointCoordinateChange(e, i, 1)}
                inputProps={{
                  min: yAxisMin,
                  max: yAxisMax,
                  step: Utils.precisionToStepSize(pointCoordinatePrecision),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CurveSettings;
