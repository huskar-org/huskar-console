import React from 'react';
import PropTypes from 'prop-types';
import Octicon from 'react-octicon';
import Datetime from 'react-datetime';
import moment from 'moment';
import Button from '../button';
import { handlePressEnterKey } from '../utils';
import './datepicker.sass';
import './react-datetime.sass';

class TimeRange {
  static datetimeFormat = 'YYYY-MM-DD HH:mm';

  static dateFormat = 'YYYY-MM-DD';

  static timeFormat = 'HH:mm';

  constructor(text, diff = null, unit = null) {
    this.text = text;
    this.diff = Number.parseInt(diff, 10);
    this.unit = unit;
  }

  get beginAt() {
    return moment()
      .subtract(+this.diff, this.unit)
      .format(this.datetimeFormat);
  }

  get endAt() {
    return moment().format(this.datetimeFormat);
  }
}

const now = () => moment().format(TimeRange.datetimeFormat);
const startOfToday = () => moment().startOf('day').format(TimeRange.datetimeFormat);

const quickRanges = {
  days: [
    new TimeRange('Today'),
    new TimeRange('Last 1 day', 1, 'days'),
    new TimeRange('Last 3 days', 3, 'days'),
    new TimeRange('Last 7 days', 7, 'days'),
  ],
  hours: [
    new TimeRange('Last 1 hour', 1, 'hours'),
    new TimeRange('Last 3 hours', 3, 'hours'),
    new TimeRange('Last 6 hours', 6, 'hours'),
    new TimeRange('Last 12 hours', 12, 'hours'),
  ],
};

export default class DatePicker extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    defaultValue: PropTypes.shape({
      beginAt: PropTypes.string,
      endAt: PropTypes.string,
    }),
  };

  static defaultProps = {
    defaultValue: {},
  };

  state = {
    showMenu: false,
    beginAt: '',
    endAt: '',
    shortDesc: '',
  };

  getDescription = (beginAt, endAt) => (
    (beginAt && endAt)
      ? `${moment(beginAt).format(TimeRange.datetimeFormat)} to ${moment(endAt).format(TimeRange.datetimeFormat)}`
      : ''
  );

  handleMouseLeave = () => {
    const showMenu = false;
    this.setState({ showMenu });
  }

  toggleDatePicker = () => {
    let { showMenu } = this.state;
    showMenu = !showMenu;
    this.setState({ showMenu });
  };

  handleChange = name => (time) => {
    if (!time.format) return;
    this.setState({ [name]: time.format(TimeRange.datetimeFormat) });
  };

  handleQuickChange = timerange => () => {
    const { beginAt, endAt, text } = timerange;
    let { showMenu } = this.state;
    showMenu = !showMenu;
    this.setState({ beginAt, endAt, showMenu, shortDesc: text });
    this.props.onChange({ beginAt, endAt });
  };

  handleClickApply = () => {
    const beginAt = this.state.beginAt || startOfToday();
    const endAt = this.state.endAt || now();
    this.setState({ showMenu: false, shortDesc: null });
    this.props.onChange({ beginAt, endAt });
  };

  render() {
    const { dateFormat, timeFormat } = TimeRange;
    const { defaultValue } = this.props;
    const beginAt = this.state.beginAt || defaultValue.beginAt;
    const endAt = this.state.endAt || defaultValue.endAt;
    const description = this.state.shortDesc || this.getDescription(beginAt, endAt);

    return (
      <div className="date-picker">
        <span
          role="button"
          tabIndex="-1"
          name="date-picker"
          onClick={this.toggleDatePicker}
          onKeyPress={handlePressEnterKey(this.toggleDatePicker)}
          className="date-picker__overall"
        >
          <Octicon name="calendar" />
          <span className="date-picker--time-text">{description}</span>
        </span>
        {this.state.showMenu && (
          <div onMouseLeave={this.handleMouseLeave} className="date-picker__container">
            <div className="date-picker__date-range">
              <h6>Time Range</h6>
              <div className="date-picker__item">
                <span className="date-picker__item-label">From:</span>
                <Datetime
                  dateFormat={dateFormat}
                  timeFormat={timeFormat}
                  onChange={this.handleChange('beginAt')}
                  value={new Date(beginAt || startOfToday())}
                />
              </div>
              <div className="date-picker__item">
                <span className="date-picker__item-label">To:</span>
                <Datetime
                  dateFormat={dateFormat}
                  timeFormat={timeFormat}
                  onChange={this.handleChange('endAt')}
                  value={new Date(endAt || now())}
                />
              </div>
              <Button
                onClick={this.handleClickApply}
              >
                Apply
              </Button>
            </div>
            <div className="date-picker__quick-range">
              <h6>Quick Range</h6>
              <ul className="date-picker__quick-range-content">
                {quickRanges.days.map(x => (
                  <li
                    key={x.text}
                    className="date-picker__quick-range-item"
                  >
                    <span
                      role="button"
                      tabIndex="-1"
                      onClick={this.handleQuickChange(x)}
                      onKeyPress={handlePressEnterKey(this.handleQuickChange(x))}
                    >
                      {x.text}
                    </span>
                  </li>))}
              </ul>
              <ul className="date-picker__quick-range-content">
                {quickRanges.hours.map(x => (
                  <li
                    className="date-picker__quick-range-item"
                    key={x.text}
                  >
                    <span
                      role="button"
                      tabIndex="-1"
                      onClick={this.handleQuickChange(x)}
                      onKeyPress={handlePressEnterKey(this.handleQuickChange(x))}
                    >
                      {x.text}
                    </span>
                  </li>))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }
}
