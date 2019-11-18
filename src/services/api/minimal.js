import XCeptor from 'xceptor';
import store from '../../store';
import * as actions from '../../actions';

let needToDispatch = false;

XCeptor.get(/^/, null, (req, res) => {
  const header = res.headers.find(
    h => h.header.toLowerCase() === 'x-minimal-mode',
  );
  const isMinimalMode = header && header.value === '1';
  if (isMinimalMode) {
    needToDispatch = true;
  }
  if (needToDispatch) {
    store.dispatch(actions.punchMinimalMode(isMinimalMode));
  }
});
