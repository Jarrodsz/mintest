import React, {useState} from 'react';
import {
    ControlBar,
    GridLayout,
    LiveKitRoom,
    ParticipantTile,
    TrackRefContext,
    useTracks
} from '@livekit/components-react';
import {FlipHorizontal} from "lucide-react";
import {formatTime, startCountdown, stopCountdown, toggleFlip} from "~/components/recorder/utils/functions.ts";
import {Track} from 'livekit-client';
import { X as CloseIcon } from 'lucide-react';
import '@livekit/components-styles';
import {config as appConfig} from "~/config.ts";

const CloseButton: React.FC<{ closeVideo: () => void }> = ({ closeVideo }) => (
    <button onClick={closeVideo}>
        <CloseIcon />
    </button>
);

function Stage() {
    const cameraTracks = useTracks([Track.Source.Camera]);
    const screenShareTrack = useTracks([Track.Source.ScreenShare])[0];

    if (!Array.isArray(cameraTracks)) {
        console.error('useTracks did not return an array for cameraTracks');
        return null;
    }

    if (screenShareTrack && !Array.isArray(screenShareTrack)) {
        console.error('useTracks did not return an array for screenShareTrack');
        return null;
    }

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

const VideoRecorder: React.FC<{
    token: string,
    serverUrl: string,
    closeOverlay: () => void,
    audioTrackID: string,
    videoTrackID: string
}> = ({token, serverUrl, closeOverlay, audioTrackID, videoTrackID}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connect, setConnect] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);
    const [recordingCountdown, setRecordingCountdown] = useState<number | null>(300);

    const closeVideo = () => {
        setConnect(false);
        closeOverlay();
    };

    const startRecording = async () => {
        const response = await fetch(`${appConfig.base.siteUrl}${process.env.LK_HOST}/startTrackCompositeEgress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room: 'my-room',
                audioTrackID: audioTrackID,
                videoTrackID: videoTrackID,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const egressData = await response.json();
        console.log('Egress ID:', egressData.egressId);
    };

    return (
        <div className={"h-screen w-screen"} data-lk-theme="default">
            <LiveKitRoom
                token={token}
                serverUrl={serverUrl}
                connect={connect}
                onConnected={() => setIsConnected(true)}
                onDisconnected={() => setConnect(false)}
                audio={true}
                video={true}
            >
                {isConnected &&
                    <div className={"relative"}>
                        <div className="z-50 absolute bottom-4 left-0 right-0">
                            <div className="p-4 flex justify-between w-full items-center">
                                <div className="flex justify-center items-center w-full">
                                    {/*//just a regular button with some styling*/}
                                    <RecordButton
                                        startRecording={startRecording}
                                        stopRecording={() => stopCountdown(setIsConnected)}
                                    />
                                </div>
                                <div className="bg-white text-xl p-0.5 pr-2 pl-2  bg-opacity-20 rounded-lg">
                                    <div className="flex justify-end items-center space-x-2">
                                    <span
                                        className="text-white">{recordingCountdown ? formatTime(recordingCountdown) : '00:00'}</span>
                                        <span className="text-gray-400">/</span>
                                        <span className="text-gray-400">05:00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Stage/>
                        <div className="absolute top-0 left-0 right-0 mx-auto">
                            <CloseButton closeVideo={closeVideo}/>
                            <ControlBar/>
                        </div>
                    </div>
                }
            </LiveKitRoom>
        </div>
    );
};

export default VideoRecorder;
