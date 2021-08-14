import React, { Component } from 'react';

export default class Table extends Component {
    constructor(props) {
        super(props);

        this.state = { data: [
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
            { name: 'Shedexx', faculty: 'FB12' },
        ] };
    }

    render() {
        return (
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Faculty</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.data.map(elem =>
                        <tr>
                            <td>{elem.name}</td>
                            <td>{elem.faculty}</td>
                        </tr>)}
                </tbody>
            </table>
        );
    }
}
