import { useState } from 'react';

import logo from './logo.svg';

import UserEdit from './UserEdit';

const LandingPage = (props) => {
    const [formData, updateFormData] = useState();

    const handleUserAdd = (user) => {
        let passphrase = '';
        passphrase = prompt('Zur Sicherheit: wie heisst unser Referent mit Nachnamen?');
        if (!passphrase) {
            alert('Passwortfeld leer, bitte erneut versuchen.');
            return;
        }

        const auth = 'Basic ' + btoa(passphrase);
        fetch('http://localhost:8081/post/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth
            },
            body: JSON.stringify({
                name:       user.name,
                faculty:    user.faculty,
                email:      user.email,
                type:       user.type,
                count:      user.count
            })
        }).then(async (response) => {
            if (response.ok) {
                alert('Registrierung erfolgreich.');
            } else {
                const error = await response.text();
                alert('Something went wrong: ' + error);
            }
        });
    }

    return (
        <div className="login-page">
            <UserEdit title="Registrierung" onSubmit={handleUserAdd}/>
        </div>
    );
}

export default LandingPage;
