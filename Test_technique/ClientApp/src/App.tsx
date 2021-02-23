import React from 'react';
import { Route } from 'react-router-dom';
import { Home } from './components/Home';

import './custom.css'

export default class App extends React.Component {
  static displayName = App.name;

  render () {
    return (
      <Route exact path='/' component={Home} />
    );
  }
}
