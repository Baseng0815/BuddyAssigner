import { useState, useEffect } from 'react';

import Table from './Table';
import UserEdit from './UserEdit';

const AdminPage = (props) => {
    const [passwordData, updatePasswordData]    = useState({ password: '' });
    const [userData, updateUserData]            = useState({ users: [] });
    const [miscData, updateMiscData]            = useState({ editing: {}});

    /* in case we are updating the table while editing */
    useEffect(() => {
        for (let user of userData.users) {
            if (user.email == miscData.editing.email) {
                console.log(user);
                updateMiscData({
                    editing: user
                });
            }
        }
    }, [userData.users]);

    const fetchUsers = () => {
        const auth = 'Basic ' + btoa(passwordData.password);
        fetch('http://localhost:8081/get/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth
            }
        }).then(async (response) => {
            if (!response.ok) {
                const error = await response.error();
                alert(error);
                return;
            }

            const data = await response.json();
            updateUserData({
                users: data.users
            });
        }).catch(err => {
            alert(err);
        });
    }

    const onTableUpdatePress = (e) => {
        e.preventDefault();

        fetchUsers();
    }

    const handleChangePassword = (e) => {
        updatePasswordData({
            password: e.target.value
        });
    }

    const handleUserEdit = (user) => {
        const auth = 'Basic ' + btoa(passwordData.password);
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
                count:      user.count,
                buddys:     user.buddys
            })
        }).then(async (response) => {
            if (response.ok) {
                alert('Aktion erfolgreich.')
                fetchUsers();
            } else {
                const error = await response.text();
                alert(error);
            }
        }).catch(err => {
            alert(err);
        });
    }

    const handleTableEditClick = (mail) => {
        for (let user of userData.users) {
            if (user.email == mail) {
                updateMiscData({
                    editing: user
                });
            }
        }
    }

    const handleTableDeleteClick = (mail) => {
        for (let user of userData.users) {
            if (user.email == mail) {
                if (window.confirm('Delete user ' + user.name + '?')) {
                    const auth = 'Basic ' + btoa(passwordData.password);
                    fetch('http://localhost:8081/delete/user/' + encodeURIComponent(mail), {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': auth
                        },
                    }).then(async (response) => {
                        if (response.ok) {
                            alert('Aktion erfolgreich.')
                            fetchUsers();
                        } else {
                            const error = await response.text();
                            alert(error);
                        }
                    }).catch(err => {
                        alert(err);
                    });
                }
            }
        }
    }

    console.log(miscData.editing);

    return (
        <div className="admin-page">
            <Table users={userData.users} editClick={handleTableEditClick}
                deleteClick={handleTableDeleteClick} />
            <div>
            <UserEdit title="Edit/Add User" onSubmit={handleUserEdit} {...miscData.editing} />
            <form>
                <fieldset>
                    <legend>Password</legend>
                    <label for="password">Passwort</label>
                    <input type="password" name="password" onChange={handleChangePassword} />
                    <button onClick={onTableUpdatePress}>Tabelle updaten</button>
                </fieldset>
            </form>
            </div>
        </div>
    );
}

export default AdminPage;
