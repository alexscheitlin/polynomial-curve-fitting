import * as React from 'react';
import Head from 'next/head';

type Props = {
  title?: string;
};

const Layout: React.FC<Props> = ({ children, title = 'This is the default title' }) => (
  <div>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    {children}
    <footer>
      <hr />
      <span>`I'm here to stay (Footer)`</span>
    </footer>
  </div>
);

export default Layout;
