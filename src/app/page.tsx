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
  const [remoteVideo, setRemoteVideo] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Initialize Peer with Render-hosted server details
    peer.current = new Peer({
      host: "peerserver-66mv.onrender.com",
      port: 443,
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
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
          myVideo.current.play();
        }

        if (peerId && peer.current) {
          const call = peer.current.call(peerId, stream);
          call.on("stream", (remoteStream: MediaStream) => {
            if (!remoteVideo) {
              const video = document.createElement("video");
              video.srcObject = remoteStream;
              video.className = "rounded-lg shadow-md";
              video.controls = true;
              video.play();
              document.body.append(video);
              setRemoteVideo(video);
            }
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
              if (!remoteVideo) {
                const video = document.createElement("video");
                video.srcObject = remoteStream;
                video.className = "rounded-lg shadow-md";
                video.controls = true;
                video.play();
                document.body.append(video);
                setRemoteVideo(video);
              }
            });
          });
      });
    }

    return () => {
      // Clean up PeerJS connection on component unmount
      if (peer.current) {
        peer.current.destroy();
      }
      if (remoteVideo) {
        remoteVideo.remove();
      }
    };
  }, [peerId, remoteVideo]);

  const generateLink = () => {
    if (myPeerId) {
      const link = `${window.location.origin}/?id=${myPeerId}`;
      console.log(link);
      navigator.clipboard.writeText(link).then(() => {
        alert("Link copied to clipboard: " + link);
      });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <video ref={myVideo} muted className="rounded-lg shadow-md mb-4" />
      <button
        onClick={generateLink}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Generate Call Link
      </button>
    </div>
  );
}
