import { useEffect, useState } from "react";
import logsData from "../livelogs.json";

export default function LiveLogs() {
    const [logs, setLogs] = useState(logsData);

    useEffect(() => {
        console.log("Logs component mounted");
    }, []);

    return (
        <div className="bg-black text-green-400 font-mono p-4 rounded-lg h-full overflow-y-auto">
            {logs.map((log, index) => (
                <div key={index}>
                    {JSON.stringify(log)}
                </div>
            ))}
        </div>
    );
}