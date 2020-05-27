import React from 'react';
import MathJax from 'react-mathjax2';

interface Props {
  equation: string;
}

const Equation = ({ equation }: Props) => {
  return (
    <MathJax.Context input="ascii">
      <MathJax.Node>{equation}</MathJax.Node>
    </MathJax.Context>
  );
};

export default Equation;
