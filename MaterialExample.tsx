import { Button, Fade, Typography, makeStyles } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import BathtubIcon from '@material-ui/icons/Bathtub';
import React from 'react';

interface StyleProps {
  color: string;
}

const useStyles = makeStyles(theme => ({
  root: {
    position: 'fixed',
    bottom: theme.spacing(2),
    left: theme.spacing(2),

    // create styles similar to CSS
    border: '1px solid black',
    width: 500,

    // access the theme here, this is our custom theme that we created
    // default: theme.spacing(2) = 16px
    padding: theme.spacing(2),

    // add box-shadows as follows, much better than with a long string
    boxShadow: theme.shadows[5],

    // this border-radius is also defined in our custom theme
    borderRadius: theme.shape.borderRadius,
  },
  button: {
    // nested selectors
    '&:hover': {
      background: 'red',
    },
  },
  // adjust the style based on props (e.g., the user clicked the button)
  iconPanel: (props: StyleProps) => ({ backgroundColor: props.color }),
}));

const MaterialExample = () => {
  const [bgColor, setBgColor] = React.useState('#fff');

  // create the object that hold the classes
  const classes = useStyles({ color: bgColor });

  return (
    <Fade in={true}>
      <div className={classes.root}>
        <Typography variant="h3">Example Material UI Component</Typography>
        <Typography variant="body1">
          This component contains some code that shows how to add styling to your components similar
          to styled-components
        </Typography>

        <Button className={classes.button} variant="contained" color="primary">
          Button with changed hover class
        </Button>

        <div className={classes.iconPanel}>
          <Typography>Icon from Material UI</Typography>
          <GitHubIcon />
          <BathtubIcon />
        </div>

        <Button variant="outlined" onClick={() => setBgColor('green')}>
          Change Background
        </Button>
      </div>
    </Fade>
  );
};

export default MaterialExample;
