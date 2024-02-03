import { json, LoaderFunction } from "@remix-run/node";

import { RoomServiceClient, Room } from 'livekit-server-sdk';

export let loader: LoaderFunction = async ({request}) => {

    const LK_HOST = process.env.LK_HOST;
    const LK_API_KEY = process.env.LK_API_KEY;
    const LK_API_SECRET = process.env.LK_API_SECRET;

    if (!LK_HOST || !LK_API_KEY || !LK_API_SECRET) {
        throw new Error('Environment variables LK_HOST, LK_API_KEY, or LK_API_SECRET are not defined');
    }

    
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const roomService = new RoomServiceClient(
        process.env.LK_HOST,
        process.env.LK_API_KEY,
        process.env.LK_API_SECRET
    );
    const options = {
        name: 'demo', // Replace with your room name
        emptyTimeout: 10 * 60, // 10 minutes
        maxParticipants: 1,
    };
    let room;
    try {
        room = await roomService.createRoom(options);
    } catch (error) {
        console.error('Failed to create room:', error);
        return json({error: 'Failed to create room'}, {status: 500});
    }

    return json({ room: room.sid });
}
