import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from '@apollo/client';
import { CookiesProvider } from 'react-cookie';
import { BrowserRouter } from 'react-router-dom';

import { createApolloClient, CurrentUserProvider } from '@sammyers/dc-shared';

import App from './components/App';

import reportWebVitals from './reportWebVitals';

import './index.css';

const apolloClient = createApolloClient();

ReactDOM.render(
  <CookiesProvider>
    <ApolloProvider client={apolloClient}>
      <CurrentUserProvider>
        <BrowserRouter>
          <React.StrictMode>
            <App />
          </React.StrictMode>
        </BrowserRouter>
      </CurrentUserProvider>
    </ApolloProvider>
  </CookiesProvider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
