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

  useEffect(() => {
    // Initialize Peer with Render-hosted server details
    peer.current = new Peer({
      host: "peerserver-66mv.onrender.com", // Replace with your Render host URL
      port: 443, // Render uses HTTPS, typically on port 443
      path: "/peerjs",
      secure: true, // Make sure to use secure connection
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
      // Clean up PeerJS connection on component unmount
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

  return (
    <div>
      <video ref={myVideo} muted />
      <button onClick={generateLink}>Generate Call Link</button>
    </div>
  );
}
