import {json, LoaderFunction} from "@remix-run/node";
import {AccessToken} from 'livekit-server-sdk';
import React from "react";
import {useLoaderData} from "@remix-run/react";

import { config } from 'dotenv';
config({ path: '.env.development' });


export let loader: LoaderFunction = async ({request}) => {

    const roomName: string = 'demo';
    const participantName: string = 'jordan';

    const at = new AccessToken(
        process.env.LK_API_KEY,
        process.env.LK_API_SECRET, {
            identity: participantName,
        });

    console.log("at:", at);

    at.addGrant({roomJoin: true,
                        room: roomName});

    const token = at.toJwt();
    console.log("token:", token);

    const user = {
        name: participantName,
        room: roomName,
        token: token
    };

    return json(user);
}
