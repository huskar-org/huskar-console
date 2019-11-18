import React from 'react';
import PropTypes from 'prop-types';
import { routerShape } from 'react-router';
import AuditIndex from './audit';

export default function TeamAudit({ params, router }) {
  const { teamName } = params;
  return (
    <AuditIndex
      router={router}
      key={teamName}
      indexType="team"
      indexScope={teamName}
    />
  );
}

TeamAudit.propTypes = {
  router: routerShape.isRequired,
  params: PropTypes.shape({
    teamName: PropTypes.string,
  }).isRequired,
};
