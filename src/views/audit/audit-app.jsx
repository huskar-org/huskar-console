import React from 'react';
import PropTypes from 'prop-types';
import { routerShape } from 'react-router';
import AuditIndex from './audit';

export default function AppAudit({ params, router }) {
  const { applicationName } = params;
  return (
    <AuditIndex
      router={router}
      key={applicationName}
      indexType="application"
      indexScope={applicationName}
    />
  );
}

AppAudit.propTypes = {
  router: routerShape.isRequired,
  params: PropTypes.shape({
    applicationName: PropTypes.string,
  }).isRequired,
};
