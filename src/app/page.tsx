"use client";
import { useEffect, useRef, useState } from "react";
import Peer, { MediaConnection } from "peerjs";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const myVideo = useRef<HTMLVideoElement | null>(null);
  const peer = useRef<Peer | null>(null);
  const searchParams = useSearchParams();
  const peerId = searchParams.get("id");
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  useEffect(() => {
    peer.current = new Peer({
      host: "peerserver-66mv.onrender.com", // Corrected host URL
      port: 443, // Render uses HTTPS, typically on port 443
      path: "/peerjs",
      secure: true,
    });

    peer.current.on("open", (id: string) => {
      console.log("My peer ID is: " + id);
      setMyPeerId(id);
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
          myVideo.current.play();
        }

        if (peerId && peer.current) {
          const call = peer.current.call(peerId, stream);
          call.on("stream", (remoteStream: MediaStream) => {
            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.play();
            document.body.append(video);
          });
        }
      });

    if (peer.current) {
      peer.current.on("call", (call: MediaConnection) => {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            call.answer(stream);
            call.on("stream", (remoteStream: MediaStream) => {
              const video = document.createElement("video");
              video.srcObject = remoteStream;
              video.className = "rounded-lg shadow-md";
              video.play();
              document.body.append(video);
            });
          });
      });
    }

    return () => {
      if (peer.current) {
        peer.current.destroy();
      }
    };
  }, [peerId]);

  const generateLink = () => {
    if (myPeerId) {
      const link = `${window.location.origin}/?id=${myPeerId}`;
      console.log(link);
      navigator.clipboard.writeText(link).then(() => {
        alert("Link copied to clipboard: " + link);
      });
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const endCall = () => {
    if (peer.current) {
      peer.current.destroy();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-gray-100 p-4">
        {/* Placeholder for the content on the left side */}
        <div>Left Side Content</div>
      </div>
      <div className="flex flex-col items-center w-1/3 bg-white shadow-lg p-4">
        <video ref={myVideo} muted className="w-full mb-4 rounded-md" />
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleAudio}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            {isAudioMuted ? "Unmute Audio" : "Mute Audio"}
          </button>
          <button
            onClick={toggleVideo}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            {isVideoMuted ? "Turn On Video" : "Turn Off Video"}
          </button>
          <button
            onClick={endCall}
            className="px-4 py-2 bg-red-500 text-white rounded-md"
          >
            End Call
          </button>
          <button
            onClick={generateLink}
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Generate Call Link
          </button>
        </div>
      </div>
    </div>
  );
}
