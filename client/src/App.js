import { useState } from 'react';

import {
    BrowserRouter as Router,
    Switch, Route, Link
} from 'react-router-dom';

import logo from './logo.svg';
import './App.css';

import LandingPage from './LandingPage';
import AdminPage from './AdminPage';
import DSE from './dse';

const App = (props) => {
    return (
        <div className="App">
            <Router>
                <Switch>
                    <Route path="/admin">
                        <AdminPage />
                    </Route>
                    <Route path="/datenschutz">
                        <DSE />
                    </Route>
                    <Route path="/">
                        <LandingPage />
                    </Route>
                </Switch>
            </Router>
        </div>
    );
}

export default App;
