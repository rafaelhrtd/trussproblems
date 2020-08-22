import React from 'react';
import ReactDOM from 'react-dom';
import './index.global.scss';
import Layout from './hoc/Layout/Layout.js';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Layout />, document.getElementById('root'));

registerServiceWorker();
