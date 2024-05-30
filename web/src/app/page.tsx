"use client";

import { Button, Card, Spacer, Progress } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { getPassword, startEC2Instances, stopEC2Instances } from "./actions";

interface InstanceStatus {
  instanceId: string;
  state: string;
  password?: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statuses, setStatuses] = useState<InstanceStatus[]>([]);

  const fetchStatuses = async () => {
    try {
      const response = await fetch("/api/instance-status");
      const data = await response.json();
      setStatuses(data);
    } catch (error) {
      console.error("Failed to fetch instance statuses", error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleAction = async (action: "start" | "stop") => {
    setLoading(true);
    setMessage("");

    try {
      let response;
      if (action === "start") {
        response = await startEC2Instances();
      } else {
        response = await stopEC2Instances();
      }

      setMessage(response.message);
      fetchStatuses(); // Refresh statuses after action
    } catch (error) {
      setMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGetPassword = async (instanceId: string) => {
    const res = await getPassword(instanceId);

    if (res) {
      if (res.message) setMessage(res.message);
      setStatuses((prevStatuses) =>
        prevStatuses.map((status) =>
          status.instanceId === instanceId
            ? { ...status, password: res.password }
            : status,
        ),
      );
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold text-center">EC2 Control</h1>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => handleAction("start")}
          disabled={loading}
          className={`px-4 py-2 bg-green-500 text-white rounded-md ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"}`}
        >
          Start Instances
        </button>
        <button
          onClick={() => handleAction("stop")}
          disabled={loading}
          className={`px-4 py-2 bg-red-500 text-white rounded-md ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600"}`}
        >
          Stop Instances
        </button>
      </div>
      {message && <p className="text-center text-gray-700">{message}</p>}
      <h2 className="text-xl font-semibold">Instance Statuses</h2>
      <ul className="list-disc list-inside space-y-2">
        {statuses.map((status) => (
          <li key={status.instanceId} className="text-gray-700">
            {status.instanceId}: {status.state}
            <button onClick={() => handleGetPassword(status.instanceId)}>
              Get Password
            </button>
            {status.password && <p>Password: {status.password}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const runtime = "edge";
