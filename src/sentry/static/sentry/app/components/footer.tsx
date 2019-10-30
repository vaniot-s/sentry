import React from 'react';
import styled from 'react-emotion';

import {t} from 'app/locale';
import ConfigStore from 'app/stores/configStore';
import ExternalLink from 'app/components/links/externalLink';
import Hook from 'app/components/hook';
import getDynamicText from 'app/utils/getDynamicText';

const Footer = () => {
  const config = ConfigStore.getConfig();
  return (
    <footer>
      <div className="container">
        <div className="pull-right">
          <FooterLink className="hidden-xs" href="/api/">
            {t('API')}
          </FooterLink>
          <FooterLink href="/docs/">{t('Docs')}</FooterLink>
          <FooterLink
            className="hidden-xs"
            href="https://github.com/getsentry/sentry"
            rel="noreferrer"
          >
            {t('Contribute')}
          </FooterLink>
          {config.isOnPremise && (
            <FooterLink className="hidden-xs" href="/out/">
              {t('Migrate to SaaS')}
            </FooterLink>
          )}
        </div>
        {config.isOnPremise && (
          <div className="version pull-left">
            {'Sentry '}
            {getDynamicText({
              fixed: 'Acceptance Test',
              value: config.version.current,
            })}
          </div>
        )}
        <a href="/" tabIndex={-1} className="icon-sentry-logo" />
        <Hook name="footer" />
      </div>
    </footer>
  );
};

const FooterLink = styled(ExternalLink)`
  &.focus-visible {
    outline: none;
    box-shadow: ${p => p.theme.blue} 0 2px 0;
  }
`;

export default Footer;
