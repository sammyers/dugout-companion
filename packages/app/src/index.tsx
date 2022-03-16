import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from '@apollo/client';
import { CookiesProvider } from 'react-cookie';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { CurrentUserProvider, createApolloClient } from '@sammyers/dc-shared';

import App from 'components/App';

import { store, persistor } from 'state/store';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import './index.css';

const apolloClient = createApolloClient();

ReactDOM.render(
  <CookiesProvider>
    <ApolloProvider client={apolloClient}>
      <CurrentUserProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <BrowserRouter>
              <React.StrictMode>
                <App />
              </React.StrictMode>
            </BrowserRouter>
          </PersistGate>
        </Provider>
      </CurrentUserProvider>
    </ApolloProvider>
  </CookiesProvider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
