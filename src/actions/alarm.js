import * as types from '../constants/actiontypes';
import { SUMMIT_HOURS } from '../constants/alarm';

export function enterSummitHour() {
  return { type: types.ENTER_SUMMIT_HOUR };
}

export function leaveSummitHour() {
  return { type: types.LEAVE_SUMMIT_HOUR };
}

function getSeconds(time) {
  if (typeof time === 'undefined') {
    const now = new Date();
    return (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
  }
  return (time.hours * 3600) + ((time.minutes || 0) * 60) + (time.seconds || 0);
}

function setupAlarm(begin, end, beginAction, endAction) {
  const seconds = {
    now: getSeconds(),
    begin: getSeconds(begin),
    end: getSeconds(end),
  };
  const nextAlarm = () => {
    const nextSeconds = {
      now: getSeconds(),
      begin: getSeconds(begin) + 86400,
      end: getSeconds(end) + 86400,
    };
    setTimeout(beginAction, (nextSeconds.begin - nextSeconds.now) * 1000);
    setTimeout(endAction, (nextSeconds.end - nextSeconds.now) * 1000);
    setTimeout(nextAlarm, (nextSeconds.begin - nextSeconds.now) * 1000);
  };

  if (seconds.now < seconds.end) {
    if (seconds.now >= seconds.begin) {
      beginAction();
    } else {
      setTimeout(beginAction, (seconds.begin - seconds.now) * 1000);
    }
    setTimeout(endAction, (seconds.end - seconds.now) * 1000);
    setTimeout(nextAlarm, (seconds.begin - seconds.now) * 1000);
  } else {
    nextAlarm();
  }
}

export function setupSummitHourAlarm(store) {
  const beginAction = () => store.dispatch(enterSummitHour());
  const endAction = () => store.dispatch(leaveSummitHour());
  SUMMIT_HOURS.forEach(({ begin, end }) => {
    setupAlarm(begin, end, beginAction, endAction);
  });
}
