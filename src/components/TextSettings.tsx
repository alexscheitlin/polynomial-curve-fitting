import { makeStyles, TextField } from '@material-ui/core';
import React from 'react';

const PLACEHOLDER_CURVE_NAME = 'Curve Name';
const PLACEHOLDER_X_AXIS_LABEL = 'X-Axis Label';
const PLACEHOLDER_Y_AXIS_LABEL = 'Y-Axis Label';
const PLACEHOLDER_DESCRIPTION = 'Description';

const LABEL_CURVE_NAME = 'Name';
const LABEL_X_AXIS_LABEL = 'X-Axis';
const LABEL_Y_AXIS_LABEL = 'Y-Axis';
const LABEL_DESCRIPTION = 'Description';

interface Props {
  curveName: string;
  onCurveNameChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  xAxisLabel: string;
  onXAxisLabelChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  yAxisLable: string;
  onYAxisLabelChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  description: string;
  onDescriptionChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const useStyles = makeStyles(() => ({
  divStyle: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

const TextSettings = ({
  curveName,
  onCurveNameChange,
  xAxisLabel,
  onXAxisLabelChange,
  yAxisLable,
  onYAxisLabelChange,
  description,
  onDescriptionChange,
}: Props) => {
  const classes = useStyles();

  return (
    <div className={classes.divStyle}>
      <TextField
        label={LABEL_CURVE_NAME}
        placeholder={PLACEHOLDER_CURVE_NAME}
        variant="outlined"
        type="text"
        value={curveName}
        onChange={e => onCurveNameChange(e)}
      />
      <TextField
        label={LABEL_X_AXIS_LABEL}
        placeholder={PLACEHOLDER_X_AXIS_LABEL}
        variant="outlined"
        type="text"
        value={xAxisLabel}
        onChange={e => onXAxisLabelChange(e)}
      />
      <TextField
        label={LABEL_Y_AXIS_LABEL}
        placeholder={PLACEHOLDER_Y_AXIS_LABEL}
        variant="outlined"
        type="text"
        value={yAxisLable}
        onChange={e => onYAxisLabelChange(e)}
      />
      <TextField
        label={LABEL_DESCRIPTION}
        placeholder={PLACEHOLDER_DESCRIPTION}
        variant="outlined"
        multiline
        rows={5}
        value={description}
        onChange={e => onDescriptionChange(e)}
      />
    </div>
  );
};

export default TextSettings;
