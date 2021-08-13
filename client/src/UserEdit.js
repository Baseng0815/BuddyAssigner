import React, { Component } from 'react';

export default class UserEdit extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <form>
                <fieldset>
                    <legend>Edit User</legend>
                    <table>
                        <tr>
                            <td align="left">Name</td>
                            <td align="right"><input type="text" name="name" /></td>
                        </tr>
                        <tr>
                            <td align="left">Fachbereich</td>
                            <td align="right">
                            <select id="faculty" name="faculty">
                                <option value="FB01">FB01 (Rechtswissenschaften)</option>
                                <option value="FB02">FB02 (Wirtschaftswissenschaften)</option>
                                <option value="FB03">FB03 (Gesellschaftswissenschaften und Philosophie)</option>
                                <option value="FB04">FB04 (Psychologie)</option>
                                <option value="FB05">FB05 (Evangelische Theologie)</option>
                                <option value="FB06">FB06 (Geschichte und Kulturwissenschaften)</option>
                                <option value="FB09">FB09 (Germanistik und Kunstwissenschaften)</option>
                                <option value="FB10">FB10 (Fremdsprachliche Philologien)</option>
                                <option value="FB12">FB12 (Mathematik und Informatik)</option>
                                <option value="FB13">FB13 (Physik)</option>
                                <option value="FB15">FB15 (Chemie)</option>
                                <option value="FB16">FB16 (Pharmazie)</option>
                                <option value="FB17">FB17 (Biologie)</option>
                                <option value="FB19">FB19 (Geographie)</option>
                                <option value="FB20">FB20 (Medizin)</option>
                                <option value="FB21">FB21 (Erziehungswissenschaften)</option>
                            </select></td>
                        </tr>
                        <tr>
                            <td align="left">Email</td>
                            <td align="right"><input type="email" name="email" /></td>
                        </tr>
                        <tr>
                            <td align="left">Typ</td>
                            <td><input class="input-radio" type="radio" name="type" />Kleiner Buddy
                            <input class="input-radio" type="radio" name="type" />Grosser Buddy</td>
                        </tr>
                        <tr>
                            <td align="left">Zug. Buddy</td>
                            <td align="right"><input type="text" disabled="true"
                                placeholder="editing not yet implemented" name="buddy" /></td>
                        </tr>
                    </table>
                </fieldset>
            </form>
        );
    }
}

