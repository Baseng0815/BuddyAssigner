import { useState } from 'react';

import logo from './logo.svg';
import './App.css';

import Table from './Table';
import UserEdit from './UserEdit';

const App = (props) => {
    const [logData, updateLogData] = useState({ text: '' });

    const log = (msg) => {
        updateLogData({
            text: logData.text + '\n' + msg
        });
    }

    const handleUserEdit = (user) => {
        console.log(user);

        fetch('http://localhost:8081/post/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name:       user.name,
                faculty:    user.faculty,
                email:      user.email,
                type:       user.type,
                count:      user.count
            })
        }).then(async (response) => {
            const result = await response.text();
            log(result);
        });
    }

    return (
        <div className="App">
            <Table />
            <div>
                <UserEdit name="Bastian Engel" faculty="FB12" email="1shedex2@gmail.com"
                    type="small" count="1" buddy="none" onSubmit={handleUserEdit}/>
                <textarea readonly value={logData.text} />
            </div>
        </div>
    );
}

export default App;
