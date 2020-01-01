# Huskar Console

The web console of [Huskar](https://github.com/huskar-org/huskar).

Demo
------

* 面板: https://demo.huskar.org (用户名: `huskar` 密码: `test`)
* API: https://api.demo.huskar.org
* 备注: 每天凌晨三点自动重置数据。

## Getting Start

You should create a `.env` file (from `.env.example`) for development in local.

Example:

```
$ cat .env
NODE_ENV=development
HUSKAR_API_URL=http://huskar-api.example.com
```

Then you could use the presented npm scripts:

```
$ npm install                    # install dependencies
$ npm run clean                  # clean dist directory
$ npm run build                  # build only
$ npm start                      # start the development server
$ npm test                       # run tests
```

## Delopyment


There is a series of configuration items as environment variables:

| Name                               | Context      | Required | Default                               |
| ---------------------------------- | ------------ | -------- | ------------------------------------- |
| `NODE_ENV`                         | Compile time | Required | development                           |
| `HUSKAR_SENTRY_DSN`                | Runtime      | Optional |                                       |
| `HUSKAR_MONITOR_URL`               | Runtime      | Optional | https://monitor.example.com           |
| `HUSKAR_AMQP_DASHBOARD_URL`        | Runtime      | Optional |                                       |
| `HUSKAR_ES_DASHBOARD_URL`          | Runtime      | Optional |                                       |
| `HUSKAR_FEATURE_LIST`              | Runtime      | Optional | stateswitch                           |
| `HUSKAR_EZONE_LIST`                | Runtime      | Optional | global,alta1,altb1                    |
| `HUSKAR_CLUSTER_SPEC_URL`          | Runtime      | Optional |                                       |
| `HUSKAR_DEFAULT_CLUSTER`           | Runtime      | Optional |                                       |
| `HUSKAR_ROUTE_ADMIN_ONLY_EZONE`    | Runtime      | Optional |                                       |

Available feature flags:

* `signup`
* `createapp`
* `stateswitch`
* `delaybutton`
* `infrarawurl`

## Development Knowledge

### Languages

- [ES6 Features](http://es6-features.org)
- [SASS](http://sass-lang.com)

### Toolchains

- [webpack v3](https://webpack.js.org)
- [babel](https://babeljs.io)

### Frameworks and Libraries

- [Redux](http://redux.js.org)
- [React](https://facebook.github.io/react/)
- [React-Router](https://github.com/ReactTraining/react-router)
- [Immutable.js](https://facebook.github.io/immutable-js/)
- [apisdk.js](https://github.com/YanagiEiichi/apisdk)
- [axios](https://github.com/mzabriskie/axios)

### Apps

The [devdocs](http://devdocs.io) is useful for looking up API of those stuff.

### Best Practices

- Pass all eslint rules
- Write pure and micro components instead of stateful and huge components
- Use GA to track new features
