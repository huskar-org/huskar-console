import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import './datetime.sass';

const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

moment.locale(['zh-CN', 'en-US']);

function DateTime(props) {
  const value = moment(props.value);
  const relative = props.relative === null ? props.defaultRelative : props.relative;
  return (
    <time
      role="presentation"
      dateTime={value.toISOString()}
      onClick={props.onClick}
      className="inline-datetime"
      title={relative ? value.format(DATETIME_FORMAT) : value.fromNow()}
    >
      {relative ? value.fromNow() : value.format(DATETIME_FORMAT)}
    </time>
  );
}

DateTime.propTypes = {
  value: PropTypes.instanceOf(Date).isRequired,
  onClick: PropTypes.func.isRequired,
  defaultRelative: PropTypes.bool.isRequired,
  relative: PropTypes.bool,
};

DateTime.defaultProps = {
  relative: null,
};

function mapStateToProps(state) {
  const { preference } = state;
  const defaultRelative = preference.get('isDateTimeRelative');
  return { defaultRelative };
}

function mapDispatchToProps(dispatch) {
  return {
    onClick: (event) => {
      event.preventDefault();
      dispatch(actions.toggleDateTimeRelative());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DateTime);
