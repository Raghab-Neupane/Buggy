import { useEffect, useState } from "react";

export default function LiveLogs() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/dashboard")
            .then((res) => res.json())
            .then((data) => setLogs(data))
            .catch(console.error);
    }, []);

    return (
        <div>
            <h2>Logs</h2>

            {logs.map((log, index) => (
                <div key={index}>
                    <strong>{log.level}</strong> - {log.message}
                </div>
            ))}
        </div>
    );
}