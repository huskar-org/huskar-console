import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { InfraConfigTypes, WellKnownData } from '../../structures';
import Highlight from '../highlight';
import {
  LANGUAGE_MAP,
  INSTALLATION_EXAMPLE_MAP,
  USAGE_EXAMPLE_MAP,
} from '../../constants/infra-tutorial';
import './tutorial.sass';

export default class InfraConfigTutorial extends React.Component {
  static propTypes = {
    infraType: PropTypes.oneOf(Object.keys(InfraConfigTypes.types)).isRequired,
    infraName: PropTypes.string.isRequired,
    valueUrlMap: PropTypes.objectOf(
      PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.number]),
      ),
    ).isRequired,
    wellKnownData: PropTypes.instanceOf(WellKnownData).isRequired,
  };

  state = {
    language: 'PYTHON',
    isRawUrl: false,
  };

  handleChangeLanguage = language => (event) => {
    event.preventDefault();
    this.setState({ language });
  }

  render() {
    const { infraType, infraName, valueUrlMap, wellKnownData } = this.props;
    const { language, isRawUrl } = this.state;
    const languageInfo = LANGUAGE_MAP[language];
    const javaVersion = wellKnownData.getLatestJava();
    const pythonVersion = wellKnownData.getLatestPython();
    const installation = INSTALLATION_EXAMPLE_MAP(
      javaVersion, pythonVersion,
    )[language];
    const usage = USAGE_EXAMPLE_MAP[language];
    return (
      <div className="infra-config-tutorial">
        <div className="infra-config-tutorial__tab">
          {_.toPairs(LANGUAGE_MAP).map(([key, info]) => (
            <a
              key={key}
              className="infra-config-tutorial__tab-item"
              href={`#language-${key}`}
              onClick={this.handleChangeLanguage(key)}
            >
              <i className={`infra-config-tutorial__tab-icon icon-${info.icon}`} />
              <span
                className={[
                  'infra-config-tutorial__tab-text',
                  key === language
                    && 'infra-config-tutorial__tab-text--active',
                ].filter(x => x).join(' ')}
              >
                {info.label}
              </span>
            </a>
          ))}
        </div>
        {(
          <div className="infra-config-tutorial__content">
            <h4 className="infra-config-tutorial__content-headline">Installation</h4>
            {installation.toolchains
              .filter(({ skipForRawUrl }) => !skipForRawUrl || !isRawUrl)
              .filter(({ onlyForInfraType }) => !onlyForInfraType || onlyForInfraType === infraType)
              .map(({ toolchain, code, highlight }) => (
                <div key={toolchain}>
                  Using {toolchain}:
                  <Highlight value={code} language={highlight} />
                </div>
              ))}
            {installation.docs && (
              <div>
                {'See also the '}
                <a
                  href={installation.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="infra-config-tutorial__link"
                >
                  full document.
                </a>
              </div>
            )}
            <h4 className="infra-config-tutorial__content-headline">Usage</h4>
            <Highlight
              value={usage[infraType](infraName, valueUrlMap)}
              language={languageInfo.highlight}
            />
          </div>
        )}
      </div>
    );
  }
}
