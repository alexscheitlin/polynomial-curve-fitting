import { makeStyles, TextField } from '@material-ui/core';
import React from 'react';

import { Internationalization } from '../types';

interface Props {
  curveName: string;
  onCurveNameChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  xAxisLabel: string;
  onXAxisLabelChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  yAxisLable: string;
  onYAxisLabelChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  description: string;
  onDescriptionChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  i18n: Internationalization;
}

const useStyles = makeStyles(() => ({
  divStyle: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
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
  i18n,
}: Props) => {
  const classes = useStyles();

  return (
    <div className={classes.divStyle}>
      <TextField
        label={i18n.textSettings.curveName.label}
        placeholder={i18n.textSettings.curveName.placeholder}
        variant="outlined"
        type="text"
        value={curveName}
        onChange={e => onCurveNameChange(e)}
      />
      <TextField
        label={i18n.textSettings.xAxis.label}
        placeholder={i18n.textSettings.xAxis.placeholder}
        variant="outlined"
        type="text"
        value={xAxisLabel}
        onChange={e => onXAxisLabelChange(e)}
      />
      <TextField
        label={i18n.textSettings.yAxis.label}
        placeholder={i18n.textSettings.yAxis.placeholder}
        variant="outlined"
        type="text"
        value={yAxisLable}
        onChange={e => onYAxisLabelChange(e)}
      />
      <TextField
        label={i18n.textSettings.description.label}
        placeholder={i18n.textSettings.description.placeholder}
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
