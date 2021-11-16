require('dotenv').config();

const registerMail =
`Registrierung erfolgreich. Sobald ein passender Buddy gefunden wurde, erhalten
Sie eine weitere Mitteilung mit einer Mailadresse, um Kontakt aufzunehmen. Natuerlich
koennen Sie sich auch ueber andere Wege austauschen, wenn dazu die Moeglichkeit besteht :)

Mit freundlichen Gruessen,
die Stifti-Gruppe Marburg`

const bigBuddyAssignedMail =
`Wir haben Ihnen soeben einen grossen Buddy zugeteilt, mit dem Sie sich austauschen koennen.
Er heisst %s und ist unter '%s' erreichbar.

Mit freundlichen Gruessen,
die Stifti-Gruppe Marburg`

const smallBuddyAssignedMail =
`Wir haben Ihnen soeben einen kleinen Buddy zugeteilt, mit dem Sie sich austauschen koennen.
Er heisst %s und ist unter '%s' erreichbar.

Mit freundlichen Gruessen,
die Stifti-Gruppe Marburg`

/* yes, we store plaintext passwords */
/* cope 😎 */
const conf = {
    mongoUrl    = process.env.MONGOURL || 'mongodb://localhost:27017',
    port        = process.env.PORT || 8081,
    useHttps    = process.env.HTTPS == 'true',
    httpsCert   = process.env.HTTPS_CERT,
    httpsKey    = process.env.HTTPS_KEY,
    mailFrom    = process.env.FROMMAIL,
    mailPass    = process.env.FROMMAILPASS,
    adminPass   = Buffer.from(process.env.ADMINPASS).toLowerCase().toString('base64'),
    userPass    = Buffer.from(process.env.USERPASS).toLowerCase().toString('base64'),
};

module.exports = {
    runtimeConfig,
    registerMail,
    bigBuddyAssignedMail,
    smallBuddyAssignedMail
};
