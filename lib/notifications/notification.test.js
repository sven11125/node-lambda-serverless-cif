const axios = require("axios");
// const fetch = require('node-fetch');
const uss_auth_url = "https://auth.novauss.com" // "https://auth.fims.novautm.net";

const getUSSAuthToken = async (
    client_scope
) => {
    const client_id = "3fob1lmd5ahq1fok0ht0nl62qc"; // Assumes AGI_Client_UTM_Access to access
    const client_secret = "5orkq410cdbdhhvqbp2ndhl8bgisua7i4i71emtbk3cta2ghg83";
    const auth_url = `${uss_auth_url}/oauth2/token?grant_type=client_credentials&scope=${client_scope}&client_id=${client_id}&client_secret=${client_secret}&audience=${client_id}`;
    const requestParams = {
        method: "post",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        url: auth_url,
    };
    try {
        const response = await axios(requestParams);
        // console.log(response.data.access_token);
        return [null, response.data.access_token]; // Return [error, data]
    } catch (error) {
        console.log('Error in getUSSAuthToken():', error);
        return [error, error["response"]["data"]];
    }
};

const postConstraintOS = async (
    uss_url,
    json_data,
    client_scope = "utm.constraint_consumption"
) => {
    try {
        [auth_error, auth_token] = await getUSSAuthToken(
            client_scope
        );
    } catch (error) {
        return [error, null];
    }
    const request_url = `${uss_url}/uss/v1/constraints`;
    const request_params = {
        method: "post",
        headers: {
            Authorization: `Bearer ${auth_token}`,
        },
        url: request_url,
        data: json_data,
    };
    // const config = {
    //     method: "post",
    //     headers: {
    //         Authorization: `Bearer ${auth_token}`,
    //     },
    //     url: request_url,
    //     body: JSON.stringify(json_data),
    // };
    try {
        console.log('request_params', request_params);
        const response = await axios(request_params);
        console.log('Response:', response);
        return [null, response];
        
        // const fetchResponse = await fetch(request_url, config);
        // const data = await fetchResponse.text();
        // console.log('Response:', data);
        // return [null, data];

    } catch (error) {
        console.log('Error in test:', error);
        return [error, null];
    }
};

const testData35 = {
    "constraint_id": "9ffcab4c-6808-4213-8d97-0f35a372e96e",
    "constraint": {
        "reference": {
            "id": "9ffcab4c-6808-4213-8d97-0f35a372e96e",
            "owner": "3fob1lmd5ahq1fok0ht0nl62qc",
            "version": 1,
            "ovn": "r8JPGVJo2poZVrmCy+Am66W0DHxDO3ZijL25/oc9m0I=",
            "time_start": {
                "value": "2020-11-23T08:14:00.000Z",
                "format": "RFC3339"
            },
            "time_end": {
                "value": "2020-11-24T08:14:00.000Z",
                "format": "RFC3339"
            },
            "uss_base_url": "https://caas.onesky.xyz"
        },
        "details": {
            "volumes": [
                {
                    "volume": {
                        "outline_polygon": {
                            "vertices": [
                                {
                                    "lng": 7.48128101342947,
                                    "lat": 46.97284246488468
                                },
                                {
                                    "lng": 7.480866938192458,
                                    "lat": 46.9719292103624
                                },
                                {
                                    "lng": 7.4818790743561365,
                                    "lat": 46.97151981302649
                                },
                                {
                                    "lng": 7.482753232367149,
                                    "lat": 46.97233858020792
                                },
                                {
                                    "lng": 7.482339197852878,
                                    "lat": 46.973125878166975
                                }
                            ]
                        },
                        "altitude_lower": {
                            "value": 0.0,
                            "reference": "W84",
                            "units": "M"
                        },
                        "altitude_upper": {
                            "value": 6000.0,
                            "reference": "W84",
                            "units": "M"
                        }
                    },
                    "time_start": {
                        "value": "2020-11-24T09:14:00.000Z",
                        "format": "RFC3339"
                    },
                    "time_end": {
                        "value": "2020-11-25T08:14:00.000Z",
                        "format": "RFC3339"
                    }
                }
            ],
            "type": "PUBLIC_SAFETY"
        }
    },
    "subscriptions": [
        {
            "subscription_id": "47895400-bfad-4923-b531-b4c0fa62f078",
            "notification_index": 3
        }
    ]
}

//

postConstraintOS(
    "https://app.oneskyasia.com/api/inbound", // This doesn't???
    // "https://fims.novautm.net", // This works
    testData35
)