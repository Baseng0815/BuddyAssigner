import React, { Component } from 'react';

const Table = (props) => {
    return (
        <table className="user-table">
            <thead>
                <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Fachbereich</th>
                    <th>Email</th>
                    <th>Typ</th>
                    <th>Anzahl</th>
                    <th>Zug. Buddy</th>
                </tr>
            </thead>
            <tbody>
                {props.users.map(user =>
                    <tr>
                        <td><button onClick={() => props.editClick(user.email)}>Edit</button></td>
                        <td>{user.name}</td>
                        <td>{user.faculty}</td>
                        <td>{user.email}</td>
                        <td>{user.type}</td>
                        <td>{user.count}</td>
                        <td>{user.buddy}</td>
                    </tr>)}
            </tbody>
        </table>
    );
}

export default Table;
