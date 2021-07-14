import React from "react";
import './App.css';
import Button from "@material-ui/core/Button";
import { Encode } from "./util/base64-utils";
import { preformatGetAssertReq, responseToObject, decodePublicKeyCredentialCreationOptions, basicAuth } from "./util/fidoUtil";

const axios = require('axios').default;

var USERNAME = "sam";
var PASSWORD = "sam123";
var TENANTDOMAIN = "carbon.super";
var STOREDOMAIN = "PRIMARY"
var ORIGIN = "http://localhost:3000";

function callStartAuth() {
    const body = {
        "username": USERNAME,
        "tenantDomain": TENANTDOMAIN,
        "storeDomain": STOREDOMAIN,
        "appId": ORIGIN
    }

    let headers2 = {
        'accept': 'application/json',
        'Authorization': basicAuth(USERNAME, PASSWORD),
        'Content-Type': 'application/json'
    };

    return axios.post('https://localhost:9443/ndb/rest/v1/fido2/start-authentication', body, { headers2 })
        .then(response => {
            return response.data;
        })

        .catch(error => {
            console.error('There was an error!', error);
        });
};

function sendWebAuthnResponse(body, requestId) {
    var clientExtensionResults = {};

    try {
        clientExtensionResults = body.getClientExtensionResults();
    } catch (e) {
        console.error('getClientExtensionResults failed', e);
    }
    let headers = {
        'accept': 'application/json',
        'Authorization': basicAuth(USERNAME, PASSWORD),
        'Content-Type': 'application/json'
    };
    let responseJson = {
        requestId: requestId,
        credential: {
            id: body.id,
            response: {
                authenticatorData: Encode(body.response.authenticatorData),
                clientDataJSON: Encode(body.response.clientDataJSON),
                signature: Encode(body.response.signature),
                userHandle: body.response.userHandle && Encode(body.response.userHandle)
            }
            ,
            clientExtensionResults,
            type: body.type
        }
    }


    let body = {
        "username": USERNAME,
        "tenantDomain": TENANTDOMAIN,
        "storeDomain": STOREDOMAIN,
        "responseJson": JSON.stringify(responseJson)
    }
    return axios.post('https://localhost:9443/ndb/rest/v1/fido2/finish-authentication', body, headers)
        .then((response) => {
            return response;
        })
        .catch(error => {
            console.error('There was an error!', error);
        });
}

function startRegistration(appId) {

    let headers = {
        'Authorization': basicAuth(USERNAME, PASSWORD),
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
    };

    let body = {
        "appId": appId
    }

    return axios.post(`https://localhost:9443/api/users/v2/me/webauthn/start-usernameless-registration?appId=${appId}`, body, { headers: headers })
        .then((response) => {
            return response.data;
        })
        .catch(error => {
            console.error('There was an error!', error);
        });
}


function finishRegistration(result, requestId) {

    let body = {
        "requestId": requestId,
        "credential": responseToObject(result)
    }

    let headers = {
        'Authorization': basicAuth(USERNAME, PASSWORD),
        'Content-type': 'application/json'
    };

    return axios.post(`https://localhost:9443/api/users/v2/me/webauthn/finish-registration`, JSON.stringify(body), { headers: headers })
        .then((response) => {
            return response;
        })
        .catch(error => {
            console.error('There was an error!', error);
        });
}

function authenticate() {
    let requestId = "";

    callStartAuth().then(response => {
        var responseObj = JSON.parse(response);
        requestId = responseObj.requestId;
        let publicKey = preformatGetAssertReq(responseObj.publicKeyCredentialRequestOptions);

        return navigator.credentials.get({ publicKey: publicKey });

    }).then(response => {
        return sendWebAuthnResponse(response, requestId);
    }).then(response => {
        if (response.status === 204) {
            alert(`Authentication Sucessfull`);
        } else {
            alert(`Server responed with error. The message is: ${response.message}`);
        }
    }).catch(err => {
        console.log(err);
    })
}


function register() {
    let name = ORIGIN;
    let requestId = "";
    startRegistration(name).then((response) => {
        requestId = response.requestId;
        let publicKey = decodePublicKeyCredentialCreationOptions(response.publicKeyCredentialCreationOptions);
        return navigator.credentials.create({ publicKey: publicKey2 })
    }).then((newCred) => {
        return finishRegistration(newCred, requestId);
    }).then(response => {
        if (response.status === 200) {
            alert(`Registration Sucessfull`);
        } else {
            alert(`Server responed with error. The message is: ${response.message}`);
        }
    }).catch(err => {
        console.log(err);
    })
}


function App() {
    return (
        <div className="App">
            <Button variant="contained" color="secondary" style={{ margin: '10px' }}
                onClick={(e) => authenticate()}> Submit</Button>
            <Button variant="contained" color="primary" style={{ margin: '10px' }}
                onClick={(e) => register()}> Register</Button>
        </div>
    );
}

export default App;