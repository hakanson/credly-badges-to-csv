const path = require('path');
const fetch = require('node-fetch');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const csvWriter = createCsvWriter({
    header: ['\ufeffName', 'Issuer', 'Certification', 'Issued At', 'Expires At'],
    path: 'certifications.csv'
});

let acclaimUsers = [
    "kevin-hakanson"
].sort();

const users = {};
const issuersSet  = new Set();
const certLists = {};

let records = [];

async function main() {
    let urls = [];
    acclaimUsers.forEach( async (userValue) => {
        let badgeURL = `https://www.youracclaim.com/users/${userValue}/badges.json`;
        urls.push(badgeURL);
    });

    let requests = urls.map(url => fetch(url));

    Promise.all(requests).then(function (responses) {
        // Get a JSON object from each of the responses
        return Promise.all(responses.map(function (response) {
            return response.json();
        }));
    }).then(jsondata => jsondata.forEach(data => {

        const username = data.data[0].issued_to;
        console.log(username);
        let user = users[username];
        if (!user) {
            user = users[username] = { "certs": [] };
        }
        data.data.forEach( (dataValue, dataIndex) => {
            let cert = {
                "username": username,
                "issuer": dataValue.issuer.entities[0].entity.name,
                "certname": dataValue.badge_template.name,
                "issued": dataValue.issued_at_date,
                "expires": dataValue.expires_at_date
            };

            let certRecord = [cert.username, cert.issuer, cert.certname, cert.issued, cert.expires];
            records.push(certRecord);
        });
    })).catch(function (error) {
        // if there's an error, log it
        console.log(error);
    }).finally(() => {
        csvWriter.writeRecords(records)       // returns a promise
            .then(() => {
                console.log('\ncertifications.csv');
            });     
    });
}

main();
