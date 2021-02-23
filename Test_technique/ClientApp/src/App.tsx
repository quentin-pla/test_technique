import * as React from 'react';
import * as Router from 'react-router';
import { Home } from './components/Home';

import './custom.css'

export default class App extends React.Component {
  static displayName = App.name;

  render () {
    return (
      <Router.Route exact path='/' component={Home} />
    );
  }
}
