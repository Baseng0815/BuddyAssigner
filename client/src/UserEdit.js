import { useState, useEffect } from 'react';


const UserEdit = (props) => {
    const initialFormData = {
        name: props.name || '',
        faculty: props.faculty || 'FB01',
        email: props.email || '',
        type: props.type || 'small',
        count: props.count || 1,
        buddy: props.buddy || ''
    };

    const [formData, updateFormData] = useState({});
    useEffect(() => {
        updateFormData(initialFormData);
    }, [props]);

    const handleChange = (e) => {
        if (e.target.name == 'type' && e.target.value == 'small') {
            updateFormData({
                ...formData,
                count: 1,
                [e.target.name]: e.target.value.trim()
            });
        } else {
            updateFormData({
                ...formData,
                [e.target.name]: e.target.value.trim()
            });
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        props.onSubmit(formData);
    }

    return (
        <form>
            <fieldset>
                <legend>{props.title}</legend>
                <table>
                    <tbody>
                        <tr>
                            <td align="left">Name</td>
                            <td align="right"><input type="text" name="name" onChange={handleChange} value={formData.name} /></td>
                            </tr>
                        <tr>
                            <td align="left">Fachbereich</td>
                            <td align="right">
                            <select id="faculty" name="faculty" value={formData.faculty} onChange={handleChange}>
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
                            <td align="right"><input type="email" name="email" onChange={handleChange} value={formData.email} /></td>
                        </tr>
                        <tr>
                            <td align="left">Typ</td>
                            <td><input className="input-radio" type="radio" value="small" name="type" onChange={handleChange} checked={formData.type == "small"} />Kleiner Buddy
                        <input className="input-radio" type="radio" value="big" name="type" onChange={handleChange} checked={formData.type == "big"} />Grosser Buddy</td>
                        </tr>
                        <tr>
                            <td align="left">Anzahl</td>
                            <td><input type="number" min="1" max="69" name="count" disabled={formData.type == 'small'} onChange={handleChange} value={formData.count} /></td>
                        </tr>
                        <tr>
                            <td align="left">Zug. Buddy</td>
                            <td align="right"><input type="text" name="buddy" disabled value={formData.buddy} /></td>
                        </tr>
                    </tbody>
                </table>
                <button onClick={handleSubmit}>Submit</button>
            </fieldset>
        </form>
    );
}

export default UserEdit;
