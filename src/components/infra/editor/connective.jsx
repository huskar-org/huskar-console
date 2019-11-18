import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Octicon from 'react-octicon';
import { checkInfraConnective } from '../../../actions/index';
import { InfraConfigTypes } from '../../../structures';
import { ApplicationLabel, ClusterLabel } from '../../inline/index';
import Table from '../../table';
import Button from '../../button';
import './connective.sass';

class ConnectiveResult extends React.Component {
  static propTypes = {
    applicationName: PropTypes.string.isRequired,
    infraType: PropTypes.oneOf(Object.keys(InfraConfigTypes.types)).isRequired,
    valueUrlMap: PropTypes.objectOf(PropTypes.objectOf(
      PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    )).isRequired,
    onLoad: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    checkResult: PropTypes.arrayOf(PropTypes.shape({
      applicationName: PropTypes.string,
      dsn: PropTypes.string,
      status: PropTypes.string,
      message: PropTypes.string,
    })),
  };

  static defaultProps = {
    checkResult: [],
  };

  componentDidMount() {
    this.checkUrls();
  }

  handleClickCancel = () => {
    this.props.onCancel();
  };

  checkUrls = () => {
    const { applicationName, onLoad, valueUrlMap, infraType } = this.props;
    const type = InfraConfigTypes.findByKey(infraType).codeName;
    Object.values(valueUrlMap)
      .forEach(item => onLoad(applicationName, type, item.url));
  };

  renderUrlMap = valueUrlMap => (
    Object.values(valueUrlMap)
      .map((item, index) => this.renderItem(item, index))
  );

  renderItem = (item, index) => {
    const { applicationName, checkResult } = this.props;
    const result = checkResult.find((
      value => value.applicationName === applicationName && value.dsn === item.url
    ));
    return (
      <tr key={`${item.url}-${index}-tr`}>
        <td>{this.renderItemUrl(item)}</td>
        {result ? (
          <td
            className={`infra-connective-result__result infra-connective-result__result--${result.status}`}
          >
            <Octicon name={result.status === 'success' ? 'check' : 'stop'} />
            <span>{result.message}</span>
          </td>
        ) : (
          <td>
            <i className="infra-connective-result__checking-icon" />
            <span>测试中...</span>
          </td>
        )}
      </tr>
    );
  };

  renderItemUrl = ({ applicationName, clusterName, isRawUrl, url }) => (
    <div key={url} className="infra-config__location">
      {isRawUrl ? (
        <code className="infra-config__raw-url">{url}</code>
      ) : (
        <ApplicationLabel value={applicationName}>
          <ClusterLabel value={clusterName} />
        </ApplicationLabel>
      )}
    </div>
  );

  render() {
    const { valueUrlMap } = this.props;
    return (
      <dl key="infra-connective-result" className="infra-connective-result">
        <dt>连接测试</dt>
        <dd>
          <Table>
            <thead>
              <tr>
                <td>Location</td>
                <td>Connectivity</td>
              </tr>
            </thead>
            <tbody>
              {this.renderUrlMap(valueUrlMap)}
            </tbody>
          </Table>
        </dd>
        <dd className="infra-connective-result__actions">
          <Button onClick={this.handleClickCancel}>返回</Button>
        </dd>
      </dl>

    );
  }
}

const mapStateToProps = (state) => {
  const checkResult = state.infraConnective.get('result').toJS();
  return { checkResult };
};

const mapDispatchToProps = dispatch => ({
  onLoad: (applicationName, type, dsn) => dispatch(
    checkInfraConnective(applicationName, type, dsn),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(ConnectiveResult);
