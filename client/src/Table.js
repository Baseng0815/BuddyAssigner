import React, { Component } from 'react';

export default class Table extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Fachbereich</th>
                        <th>Email</th>
                        <th>Typ</th>
                        <th>Anzahl</th>
                        <th>Zug. Buddy</th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.users.map(user =>
                        <tr>
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
}
