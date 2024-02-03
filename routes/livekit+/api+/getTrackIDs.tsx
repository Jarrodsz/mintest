import WebSocket from 'ws';
import { json, LoaderFunction } from "@remix-run/node";

export let loader: LoaderFunction = async ({request}) => {
    const roomName = 'demo'; // Replace with your room name
    const participantIdentity = 'jordan'; // Replace with your participant identity

    // Create a promise that resolves when the WebSocket connection is open
    const wsOpenPromise = new Promise((resolve, reject) => {
        const ws = new WebSocket(`${process.env.LK_HOST}/livekit/api/rooms/${roomName}/participants/${participantIdentity}`);

        ws.on('open', function open() {
            resolve(ws);
        });

        ws.on('error', function error(err) {
            reject(err);
        });
    });

    // Wait for the WebSocket connection to open
    const ws = await wsOpenPromise;

    // Send a message to the server
    ws.send(JSON.stringify({
        'Authorization': `Bearer ${process.env.LK_API_KEY}:${process.env.LK_API_SECRET}`
    }));

    // Create a promise that resolves when a message is received from the server
    const wsMessagePromise = new Promise((resolve, reject) => {
        ws.on('message', function incoming(data) {
            resolve(data);
        });

        ws.on('error', function error(err) {
            reject(err);
        });
    });

    // Wait for a message from the server
    const participant = await wsMessagePromise;

    const tracks = participant.tracks;

    let audioTrackID: string | undefined;
    let videoTrackID: string | undefined;

    for (const track of tracks) {
        if (track.type === 'audio') {
            audioTrackID = track.sid;
        } else if (track.type === 'video') {
            videoTrackID = track.sid;
        }

        if (audioTrackID && videoTrackID) {
            break;
        }
    }

    return json({ audioTrackID, videoTrackID });
}
