import { useEffect, useState } from "react";
import logsData from "../livelogs.json";

export default function LiveLogs() {
    const [logs, setLogs] = useState(logsData);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/logs");

        ws.onopen = () => {
            console.log("Connected");
        };

        ws.onmessage = (event) => {
            console.log("Received:", event.data);

            setLogs((prev) => [
                ...prev,
                {
                    level: "info",
                    message: event.data,
                },
            ]);
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

        ws.onclose = () => {
            console.log("Connection Closed");
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <div className="bg-black text-green-400 font-mono p-4 rounded-lg h-full overflow-y-auto">
            {logs.map((log, index) => (
                <div key={index}>
                    [{log.level}] {log.message}
                </div>
            ))}
        </div>
    );
}