import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  ApplicationLabel,
  ClusterLabel,
  IntentLabel,
  ZoneLabel,
  EncryptedLabel,
} from '../../components/inline';
import {
  ENCRYPTION_PREFIX,
  OVERALL_CLUSTER,
} from '../../constants/common';
import { DESENSITIZED_TIP } from '../../constants/text';
import { BEACON_CONTAINER_URL } from '../../constants/hrefs';
import { ContainerId } from '../../structures';
import { checkIsDesensitized, desensitizeActionDataItem } from './utils';
import AuditValueDetail from './audit-value-detail';
import './audit.sass';

function define(func) {
  const actionType = ({ action }) => func(action.actionData, action.actionName);
  actionType.propTypes = {
    action: PropTypes.shape({
      actionName: PropTypes.string,
      actionData: PropTypes.shape({
        // All possible properties
        teamName: PropTypes.string,
        teamDesc: PropTypes.string,
        applicationName: PropTypes.string,
        username: PropTypes.string,
        authority: PropTypes.string,
        clusterName: PropTypes.string,
        physicalName: PropTypes.string,

        data: PropTypes.shape({
          old: PropTypes.any,
          new: PropTypes.any,
        }),

        overwrite: PropTypes.bool,
        affected: PropTypes.number,
        nested: PropTypes.object,
        stored: PropTypes.bool,
      }),
    }),
    onRollback: PropTypes.func,
  };
  return actionType;
}

const formatTeamInfo = data => `${data.teamDesc || data.teamName} (${data.teamName})`;

export const CREATE_TEAM = define(data => (
  <div>Create team <code>{formatTeamInfo(data)}</code></div>
));

export const ARCHIVE_TEAM = define(data => (
  <div>Archive team <code>{formatTeamInfo(data)}</code></div>
));

export const DELETE_TEAM = define(data => (
  <div>Delete team <code>{formatTeamInfo(data)}</code></div>
));

export const CREATE_APPLICATION = define(data => (
  <div>
    Create application <ApplicationLabel value={data.applicationName} /> in
    {' '}team <code>{formatTeamInfo(data)}</code>
  </div>
));

export const ARCHIVE_APPLICATION = define(data => (
  <div>
    Archive application <ApplicationLabel value={data.applicationName} /> from
    team <code>{formatTeamInfo(data)}</code>
  </div>
));

export const DELETE_APPLICATION = define(data => (
  <div>
    Delete application <ApplicationLabel value={data.applicationName} /> from
    {' '}team <code>{formatTeamInfo(data)}</code>
  </div>
));

export const CREATE_USER = define(data => (
  <div>Create user <code>{data.username}</code></div>
));

export const ARCHIVE_USER = define(data => (
  <div>Archive user <code>{data.username}</code></div>
));

export const DELETE_USER = define(data => (
  <div>Delete user <code>{data.username}</code></div>
));

export const CHANGE_USER_PASSWORD = define(data => (
  <div>Change password of <code>{data.username}</code></div>
));

export const FORGOT_USER_PASSWORD = define(data => (
  <div>Request to reset password of <code>{data.username}</code></div>
));

export const GRANT_HUSKAR_ADMIN = define(data => (
  <div>Grant <code>{data.username}</code> to super admin</div>
));

export const DISMISS_HUSKAR_ADMIN = define(data => (
  <div>Dismiss <code>{data.username}</code> from super admin</div>
));

export const OBTAIN_USER_TOKEN = define(data => (
  <div title={data.username}>Login with password</div>
));

export const GRANT_TEAM_ADMIN = define(data => (
  <div>
    Grant <code>{data.username}</code> to team admin
    of <code>{formatTeamInfo(data)}</code>
  </div>
));

export const DISMISS_TEAM_ADMIN = define(data => (
  <div>
    Dismiss <code>{data.username}</code> from team admin
    of <code>{formatTeamInfo(data)}</code>
  </div>
));

export const GRANT_APPLICATION_AUTH = define(data => (
  <div>
    Grant <code>{data.username}</code> to <code>{data.authority}</code> the
    application <ApplicationLabel value={data.applicationName} />
  </div>
));

export const DISMISS_APPLICATION_AUTH = define(data => (
  <div>
    Dismiss <code>{data.username}</code> to <code>{data.authority}</code> the
    application <ApplicationLabel value={data.applicationName} />
  </div>
));


const serializeConfig = (value) => {
  if (typeof value === 'string') {
    return value || '';
  }
  return JSON.stringify(value);
};

const renderInstanceKey = (keyType, key) => {
  if (keyType === 'service') {
    const containerId = ContainerId.parse(key);
    if (!containerId.isEmpty) {
      const beaconUrl = BEACON_CONTAINER_URL(containerId.toString());
      const beaconIcon = 'docker';
      return (
        <span>
          <code>{key}</code>
          <a
            href={beaconUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="view-audit__beacon-link"
            title="Monitor the container which is running this instance"
          >
            <i className={`view-audit__beacon-icon view-audit__beacon-icon--${beaconIcon} icon-${beaconIcon}`} />
          </a>
        </span>
      );
    }
  }
  return <span><code>{key}</code></span>;
};

const defineConfigAction = (verb, keyType, allowDefault = true) => define(({
  key,
  clusterName,
  applicationName,
  data,
  newIsEncrypted,
}) => {
  let oldEncrypted = _.toString(data && data.old).startsWith(ENCRYPTION_PREFIX);
  const newEncrypted = newIsEncrypted || (
    _.toString(data && data.new).startsWith(ENCRYPTION_PREFIX));
  if (newEncrypted) {
    oldEncrypted = true;
  }

  return (
    <div title={!data ? DESENSITIZED_TIP : ''}>
      {data && data.old === null ? verb.replace('Update', 'Create') : verb}
      {' '}{renderInstanceKey(keyType, key)}{' on '}
      <ApplicationLabel value={applicationName}>
        <ClusterLabel value={clusterName || ''} allowDefault={allowDefault} />
      </ApplicationLabel>
      {data && (data.old || data.new) ? (
        <AuditValueDetail
          oldValue={data.old && !oldEncrypted && serializeConfig(data.old)}
          newValue={data.new && !newEncrypted && serializeConfig(data.new)}
        >
          <div className="detail">
            {data.old ? (
              <code className="detail-deletion">
                {oldEncrypted ? EncryptedLabel() : serializeConfig(data.old)}
              </code>
            ) : null}
            {data.new ? (
              <code className="detail-creation">
                {newEncrypted ? EncryptedLabel() : serializeConfig(data.new)}
              </code>
            ) : null}
          </div>
        </AuditValueDetail>
      ) : null}
    </div>
  );
});

export const UPDATE_WEIGHT = defineConfigAction('Update weight', 'serviceWeight', false);
export const UPDATE_SERVICE = defineConfigAction('Update service', 'service', false);
export const DELETE_SERVICE = defineConfigAction('Delete service', 'service', false);
export const UPDATE_SWITCH = defineConfigAction('Update switch', 'switch');
export const DELETE_SWITCH = defineConfigAction('Delete switch', 'switch');
export const UPDATE_CONFIG = defineConfigAction('Update config', 'config');
export const DELETE_CONFIG = defineConfigAction('Delete config', 'config');
export const UPDATE_CLUSTER_INFO = defineConfigAction('Update cluster info', 'clusterInfo');
export const UPDATE_SERVICE_INFO = defineConfigAction('Update service info', 'serviceInfo');

const defineClusterAction = (verb, prep, type) => define(data => (
  <div>
    {verb} {type} cluster <ClusterLabel value={data.clusterName} /> {prep}{' '}
    <ApplicationLabel value={data.applicationName} />
  </div>
));

export const CREATE_SERVICE_CLUSTER = defineClusterAction('Create', 'in', 'service');
export const DELETE_SERVICE_CLUSTER = defineClusterAction('Delete', 'from', 'service');
export const CREATE_SWITCH_CLUSTER = defineClusterAction('Create', 'in', 'switch');
export const DELETE_SWITCH_CLUSTER = defineClusterAction('Delete', 'from', 'switch');
export const CREATE_CONFIG_CLUSTER = defineClusterAction('Create', 'in', 'config');
export const DELETE_CONFIG_CLUSTER = defineClusterAction('Delete', 'from', 'config');

const defineBatchAction = type => define(data => (
  <div title={checkIsDesensitized(data) ? DESENSITIZED_TIP : ''}>
    Import {type} from file, <code>{data.affected}</code> items affected
    {data.overwrite ? ' with' : ' without'} overwritten
    {(data.stored && !checkIsDesensitized(data)) ? (
      <AuditValueDetail>
        <div className="detail">
          {_.map(data.nested || data.data.nested, (clusters, applicationName) => (
            _.map(clusters, (pairs, clusterName) => (
              _.map(pairs, (value, key) => (
                <code className="detail-information">
                  <span className="path">
                    <ApplicationLabel value={applicationName}>
                      <ClusterLabel value={clusterName} allowDefault />
                    </ApplicationLabel>
                    {` - ${key}`}
                  </span>
                  <span className="comma">,</span>
                  <span className="value">{value}</span>
                </code>
              ))
            ))
          ))}
        </div>
      </AuditValueDetail>
    ) : null}
  </div>
));

export const IMPORT_SERVICE = defineBatchAction('service');
export const IMPORT_SWITCH = defineBatchAction('switch');
export const IMPORT_CONFIG = defineBatchAction('config');

export const ASSIGN_CLUSTER_LINK = define(data => (
  <div>
    {'Link '}
    <ApplicationLabel value={data.applicationName}>
      <ClusterLabel value={data.clusterName || ''} />
    </ApplicationLabel>
    {' to '}
    <ApplicationLabel value={data.applicationName}>
      <ClusterLabel value={data.physicalName || ''} />
    </ApplicationLabel>
  </div>
));

export const DELETE_CLUSTER_LINK = define(data => (
  <div>
    {'Cancel link '}
    <ApplicationLabel value={data.applicationName}>
      <ClusterLabel value={data.clusterName || ''} />
    </ApplicationLabel>
    {' to '}
    <ApplicationLabel value={data.applicationName}>
      <ClusterLabel value={data.physicalName || ''} />
    </ApplicationLabel>
  </div>
));

export const UPDATE_ROUTE = define(data => (
  <div>
    Setup route policy ( <IntentLabel value={data.intent} /> )
    {' from '}
    <ApplicationLabel value={data.applicationName}>
      <ClusterLabel value={data.clusterName} />
    </ApplicationLabel>
    {' to '}
    <ApplicationLabel value={data.destApplicationName}>
      <ClusterLabel value={data.destClusterName} />
    </ApplicationLabel>
  </div>
));

export const DELETE_ROUTE = define(data => (
  <div>
    Delete route policy ( <IntentLabel value={data.intent} /> )
    {' from '}
    <ApplicationLabel value={data.applicationName}>
      <ClusterLabel value={data.clusterName} />
    </ApplicationLabel>
    {' to '}
    <ApplicationLabel value={data.destApplicationName}>
      {data.destClusterName && <ClusterLabel value={data.destClusterName} />}
    </ApplicationLabel>
  </div>
));

export const UPDATE_DEFAULT_ROUTE = define(data => (
  <div>
    Setup <strong>default</strong> route policy
    {' ( '}
    <IntentLabel value={data.intent} />
    {' / '}
    {data.ezone === OVERALL_CLUSTER
      ? <ClusterLabel value={OVERALL_CLUSTER} allowDefault />
      : <ZoneLabel value={data.ezone} />}
    {' ) to '}
    {data.ezone === OVERALL_CLUSTER
      ? <ClusterLabel value={data.clusterName} />
      : <ClusterLabel value={`${data.ezone}-${data.clusterName}`} />}
  </div>
));

export const DELETE_DEFAULT_ROUTE = define(data => (
  <div>
    Delete <strong>default</strong> route policy
    {' ( '}
    <IntentLabel value={data.intent} />
    {' / '}
    {data.ezone === OVERALL_CLUSTER
      ? <ClusterLabel value={OVERALL_CLUSTER} allowDefault />
      : <ZoneLabel value={data.ezone} />}
    {' )'}
  </div>
));

export const UPDATE_INFRA_CONFIG = define((data, actionName) => {
  const newData = data.data && data.data.new
    && desensitizeActionDataItem(actionName, data, data.data.new);
  const oldData = data.data && data.data.old
    && desensitizeActionDataItem(actionName, data, data.data.old);
  const valueData = data.value && desensitizeActionDataItem(actionName, data, data.value);
  return (
    <div title={checkIsDesensitized(data) ? DESENSITIZED_TIP : ''}>
      {`Update ${data.infraType} config `}
      <code>{data.infraName}</code>
      {' on '}
      <ApplicationLabel value={data.applicationName}>
        {data.scopeType === 'idcs'
          ? <ZoneLabel value={data.scopeName} allowUndeclared />
          : <ClusterLabel value={data.scopeName} />}
      </ApplicationLabel>
      {!checkIsDesensitized(data) && (
        (data.data ? (
          <AuditValueDetail
            newValue={data.data.new && serializeConfig(newData)}
            oldValue={data.data.old && serializeConfig(oldData)}
          >
            <div className="detail">
              <code className="detail-creation">
                {serializeConfig(newData)}
              </code>
              <code className="detail-deletion">
                {serializeConfig(oldData)}
              </code>
            </div>
          </AuditValueDetail>
        ) : (
          <AuditValueDetail>
            <div className="detail">
              <code className="detail-creation">
                {serializeConfig(valueData)}
              </code>
            </div>
          </AuditValueDetail>
        )))}
    </div>);
});

export const DELETE_INFRA_CONFIG = define((data, actionName) => {
  const oldData = data.data && data.data.old
    && desensitizeActionDataItem(actionName, data, data.data.old);
  return (
    <div>
      {`Delete ${data.infraType} config `}
      <code>{data.infraName}</code>
      {' on '}
      <ApplicationLabel value={data.applicationName}>
        {data.scopeType === 'idcs'
          ? <ZoneLabel value={data.scopeName} allowUndeclared />
          : <ClusterLabel value={data.scopeName} />}
      </ApplicationLabel>
      {!checkIsDesensitized(data) && data.data && (
        <AuditValueDetail>
          <div className="detail">
            <code className="detail-deletion">
              {serializeConfig(oldData)}
            </code>
          </div>
        </AuditValueDetail>
      )}
    </div>);
});

const ROUTE_PROGRAM_STATUS_LIST = { D: '未灰度', C: '观察中', E: '灰度中', S: '已开启' };
export const PROGRAM_UPDATE_ROUTE_STAGE = define(({ applicationName, oldStage, newStage }) => (
  <div>
    {'更改 SOA route program 灰度状态: '}
    <ApplicationLabel value={applicationName} />
    {` 从 ${ROUTE_PROGRAM_STATUS_LIST[oldStage]} 到 ${ROUTE_PROGRAM_STATUS_LIST[newStage]}`}
  </div>
));
