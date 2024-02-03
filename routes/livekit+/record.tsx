import '@livekit/components-styles';
import pkg, {Room} from 'livekit-server-sdk';
import {config} from 'dotenv';

config({path: '.env.development'});

import {GridLayout, ParticipantTile, TrackRefContext, useConnectionState, useTracks,} from '@livekit/components-react';
import {config as appConfig} from "~/config.ts";
import React, {useEffect, useState} from 'react';
import {json, LoaderFunction} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import fetch from 'node-fetch';
import {Track} from "livekit-client";
import VideoRecorder from "~/routes/livekit+/embed/VideoRecorder.tsx";

const {RoomServiceClient} = pkg;


/**
 * Sure, here is a step-by-step documentation on how to create a record with LiveKit:
 * 1. Import the necessary modules: Start by importing the necessary modules from livekit-server-sdk and other packages. This includes RoomServiceClient from livekit-server-sdk, GridLayout, ParticipantTile, TrackRefContext, useTracks from @livekit/components-react, and Track from livekit-client.
 * 2. Fetch the token and LiveKit URL: Make a fetch request to your server to get the token and LiveKit URL. This is usually done in the loader function of your Remix route.
 * 3. Fetch the audio and video track IDs: Make another fetch request to your server to get the audio and video track IDs.
 * 4. Create a room: Instantiate RoomServiceClient and use it to create a room. The createRoom method takes an options object that specifies the name of the room.
 * 5. Return the data: Return the token, LiveKit URL, audio track ID, video track ID, and room ID in the loader function.
 * 6. Use the data in your component: In your React component, use the useLoaderData hook to access the data returned by the loader function. You can then use this data to create a VideoRecorder component.
 * 7. Handle disconnection: Implement a function to handle disconnection events. This function can be passed to the closeOverlay prop of the VideoRecorder component.
 * 8. Create a room when the component is mounted: Use the useEffect hook to create a room when the component is mounted. This involves making a POST request to your server.
 * This guide assumes that you have already set up your server to handle the /livekit/api/getToken, /livekit/api/getTrackIDs, and /livekit/api/createRoom endpoints.
 *
 */

/** LOADER FUNCTION */
export let loader: LoaderFunction = async ({request}) => {
    // Fetch the token and LiveKit URL as before
    const response = await fetch(`${appConfig.base.siteUrl}/livekit/api/getToken`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Fetch the audio and video track IDs from your server
    const trackResponse = await fetch(`${appConfig.base.siteUrl}/livekit/api/getTrackIDs`);
    if (!trackResponse.ok) {
        throw new Error(`HTTP error! status: ${trackResponse.status}`);
    }
    const trackData = await trackResponse.json();

    // Create a room
    const roomService = new RoomServiceClient(
        process.env.LK_HOST,
        process.env.LK_API_KEY,
        process.env.LK_API_SECRET);
    const options = {
        name: 'demo', // Replace with your room name
    };
    let room;
    try {
        room = await roomService.createRoom(options);
    } catch (error) {
        console.error('Failed to create room:', error);
        return json({error: 'Failed to create room'}, {status: 500});
    }

    const newData = {
        ...data,
        LK_HOST: process.env.LK_HOST,
        audioTrackID: trackData.audioTrackID,
        videoTrackID: trackData.videoTrackID,
        room: room.sid,
    };

    return json(newData);
}

/** STAGE */
function Stage() {

    const cameraTracks = useTracks([Track.Source.Camera]);
    const screenShareTrack = useTracks([Track.Source.ScreenShare])[0];

    return (
        <>
            {
                screenShareTrack &&
                <>
                    <ParticipantTile {...screenShareTrack} />
                </>
            }
            <GridLayout tracks={cameraTracks}>
                <TrackRefContext.Consumer>
                    {
                        (track) => <ParticipantTile {...track} />
                    }
                </TrackRefContext.Consumer>
            </GridLayout>
        </>
    );
}

/** VIEW */
export default function App() {
    const data = useLoaderData();
    const [room, setRoom] = useState<Room | null>(null);
    const connectionState = useConnectionState(room);

    useEffect(() => {
        if (data.token && data.LK_HOST) {
            // Create a new Room instance
            const roomInstance = new Room();

            // Prepare the connection
            roomInstance.prepareConnection(data.LK_HOST, data.token);

            // Connect to the room
            roomInstance.connect(data.LK_HOST, data.token).then(() => setRoom(roomInstance));
        }
    }, [data]);

    useEffect(() => {
        if (connectionState === "disconnected") {
            console.log("Disconnected from the room");
        }
    }, [connectionState]);

    return (
        <div className={"h-screen w-screen bg-black"} data-lk-theme="default">
            <VideoRecorder
                token={data.token}
                serverUrl={data.LK_HOST}
                closeOverlay={() => console.log("Disconnected")}
                audioTrackID={data.audioTrackID}
                videoTrackID={data.videoTrackID}
            />
        </div>
    );
};

