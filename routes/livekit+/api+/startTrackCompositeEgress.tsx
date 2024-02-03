import {json, LoaderFunction} from "@remix-run/node";
import {EgressClient, EncodedFileType} from 'livekit-server-sdk';

const LK_HOST = process.env.LK_HOST || '';
const LK_API_KEY = process.env.LK_API_KEY || '';
const LK_API_SECRET = process.env.LK_API_SECRET || '';

const egressClient = new EgressClient(LK_HOST, LK_API_KEY, LK_API_SECRET);

export let loader: LoaderFunction = async ({request}) => {
    const { room, audioTrackID, videoTrackID } = JSON.parse(await request.text());

    const output = {
        fileType: EncodedFileType.MP4,
        filepath: 'livekit-demo/track-composite-test.mp4',
        s3: {
            accessKey: process.env.AWS_ACCESS_KEY || '',
            secret: process.env.AWS_SECRET || '',
            region: process.env.AWS_REGION || '',
            bucket: process.env.AWS_BUCKET || ''
        }
    };

    const info = await egressClient.startTrackCompositeEgress(room, output, audioTrackID, videoTrackID);
    const egressId = info.egressId;

    return json({ egressId });
}
