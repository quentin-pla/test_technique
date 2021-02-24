import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import {Provider, teamsTheme} from "@fluentui/react-northstar";

ReactDOM.render(
  <BrowserRouter>
      <Provider theme={teamsTheme}>
        <App />
      </Provider>
  </BrowserRouter>, 
  document.getElementById('root')
);

registerServiceWorker();

