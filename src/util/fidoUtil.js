import { Encode, Decode } from "./base64-utils";
let base64 = require('base-64');

export let preformatGetAssertReq = (getAssert) => {

    for (let allowCred of getAssert.allowCredentials) {
        allowCred.id = Decode(allowCred.id);
    }
    const assertionReq = {
        challenge: Decode(getAssert.challenge),
        allowCredentials: getAssert.allowCredentials
    }
    return assertionReq;
};

export let responseToObject = (response) => {

    if (response.u2fResponse) {
        return response;
    } else {
        let clientExtensionResults = {};

        try {
            clientExtensionResults = response.getClientExtensionResults();
        } catch (e) {
            console.error("getClientExtensionResults failed", e);
        }

        if (response.response.attestationObject) {
            return {
                clientExtensionResults,
                id: response.id,
                response: {
                    attestationObject: Encode(response.response.attestationObject),
                    clientDataJSON: Encode(response.response.clientDataJSON)
                },
                type: response.type
            };
        } else {
            return {
                clientExtensionResults,
                id: response.id,
                response: {
                    authenticatorData: Encode(response.response.authenticatorData),
                    clientDataJSON: Encode(response.response.clientDataJSON),
                    signature: Encode(response.response.signature),
                    userHandle: response.response.userHandle && Encode(response.response.userHandle)
                },
                type: response.type
            };
        }
    }
};


export let decodePublicKeyCredentialCreationOptions = (request) => {

    const excludeCredentials = request.excludeCredentials.map((credential) => {
        return { ...credential, id: Decode(credential.id) };
    });

    return {
        ...request,
        attestation: "direct",
        challenge: Decode(request.challenge),
        excludeCredentials: excludeCredentials,
        user: {
            ...request.user,
            id: Decode(request.user.id)
        }
    };
};

export let basicAuth = (username, password) => {

    let base64EncodedCredentials = base64.encode(username + ":" + password);
    return "Basic " + base64EncodedCredentials;
}