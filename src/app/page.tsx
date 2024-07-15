"use client";
import { useEffect, useRef, useState } from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const myVideo = useRef<HTMLVideoElement | null>(null);
  const peer = useRef<Peer | null>(null);
  const searchParams = useSearchParams();
  const peerId = searchParams.get("id");
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [call, setCall] = useState<MediaConnection | null>(null);
  const [dataConnection, setDataConnection] = useState<DataConnection | null>(
    null
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
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
        setLocalStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
          myVideo.current.play();
        }

        if (peerId && peer.current) {
          const newCall = peer.current.call(peerId, stream);
          const dataConn = peer.current.connect(peerId);
          setCall(newCall);
          setDataConnection(dataConn);

          newCall.on("stream", (remoteStream: MediaStream) => {
            const video = document.createElement("video");
            video.srcObject = remoteStream;
            video.play();
            document.body.append(video);
          });

          dataConn.on("data", (data: unknown) => {
            if (typeof data === "string") {
              setMessages((prevMessages) => [...prevMessages, data]);
              console.log(messages);
            }
          });
        }
      });

    if (peer.current) {
      peer.current.on("call", (incomingCall: MediaConnection) => {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            setLocalStream(stream);
            incomingCall.answer(stream);
            incomingCall.on("stream", (remoteStream: MediaStream) => {
              const video = document.createElement("video");
              video.srcObject = remoteStream;
              video.className = "rounded-lg shadow-md";
              video.play();
              document.body.append(video);
            });
          });
      });

      peer.current.on("connection", (conn: DataConnection) => {
        setDataConnection(conn);
        conn.on("data", (data: unknown) => {
          if (typeof data === "string") {
            setMessages((prevMessages) => [...prevMessages, data]);
          }
        });
      });
    }

    return () => {
      if (peer.current) {
        peer.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
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
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoPaused(!isVideoPaused);
    }
  };

  const endCall = () => {
    if (call) {
      call.close();
    }
    if (dataConnection) {
      dataConnection.close();
    }
    if (peer.current) {
      peer.current.destroy();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() !== "" && dataConnection) {
      dataConnection.send(newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      console.log(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <video ref={myVideo} muted className="rounded-lg shadow-md mb-4" />
      <div className="flex space-x-4">
        <button
          onClick={toggleAudio}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md"
        >
          {isAudioMuted ? "Unmute Audio" : "Mute Audio"}
        </button>
        <button
          onClick={toggleVideo}
          className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md"
        >
          {isVideoPaused ? "Resume Video" : "Pause Video"}
        </button>
        <button
          onClick={endCall}
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md"
        >
          End Call
        </button>
        <button
          onClick={generateLink}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md"
        >
          Generate Call Link
        </button>
      </div>
      <div className="mt-4 w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">Chat</h2>
        <div className="bg-white rounded-lg shadow-md p-4 h-64 overflow-y-scroll">
          {messages.map((msg, index) => (
            <p key={index} className="mb-2">
              {msg}
            </p>
          ))}
        </div>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="w-full text-black mt-2 px-4 py-2 border rounded-lg"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md"
        >
          Send
        </button>
      </div>
    </div>
  );
}
