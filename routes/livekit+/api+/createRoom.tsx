import { Room, RoomCreateOptions, RoomService } from 'livekit-server-sdk';
import { json, LoaderFunction } from "@remix-run/node";

export let loader: LoaderFunction = async ({request}) => {

    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const roomService = new RoomService();

    const options: RoomCreateOptions = {
        name: 'demo', // Replace with your room name
    };

    let room: Room;
    try {
        room = await roomService.createRoom(options);
    } catch (error) {
        console.error('Failed to create room:', error);
        return json({ error: 'Failed to create room' }, { status: 500 });
    }

    return json({ room: room.sid });
}
