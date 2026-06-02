"use client";

import { useState } from "react";
import { triggerTestEmails, triggerEventReminders } from "@/app/actions/send-test-emails";

export default function EmailTestPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [reminderResult, setReminderResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  async function handleSendTests() {
    setLoading(true);
    setTestResult("Sending 14 test emails...");
    try {
      const result = await triggerTestEmails("dknightunicorn@gmail.com");
      setTestResult(JSON.stringify(result, null, 2));
    } catch (err) {
      setTestResult(`Error: ${err}`);
    }
    setLoading(false);
  }

  async function handleSendReminders() {
    setReminderLoading(true);
    setReminderResult("Triggering event reminders...");
    try {
      const result = await triggerEventReminders();
      setReminderResult(JSON.stringify(result, null, 2));
    } catch (err) {
      setReminderResult(`Error: ${err}`);
    }
    setReminderLoading(false);
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto", color: "#1e2d18" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Email System Test
      </h1>

      <div style={{ marginBottom: 32, padding: 20, background: "#fff", borderRadius: 8, border: "1px solid #ddd8cc" }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: "#3d6b2a" }}>
          Send All Test Emails
        </h2>
        <p style={{ color: "#7a7060", marginBottom: 16, fontSize: 14 }}>
          Sends 14 branded test emails to dknightunicorn@gmail.com (order confirmation,
          status updates, RSVP, welcome, admin/staff accounts, password reset, account
          activated, subscription, donation, referral, weekly reminder)
        </p>
        <button
          onClick={handleSendTests}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: loading ? "#ddd8cc" : "#3d6b2a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Send All 14 Test Emails"}
        </button>
        {testResult && (
          <pre style={{ marginTop: 16, padding: 12, background: "#f2efe8", borderRadius: 6, fontSize: 12, overflow: "auto", maxHeight: 400 }}>
            {testResult}
          </pre>
        )}
      </div>

      <div style={{ padding: 20, background: "#fff", borderRadius: 8, border: "1px solid #ddd8cc" }}>
        <h2 style={{ fontSize: 18, marginBottom: 12, color: "#3d6b2a" }}>
          Trigger Event Reminders
        </h2>
        <p style={{ color: "#7a7060", marginBottom: 16, fontSize: 14 }}>
          Sends event reminder emails to all confirmed RSVPs for the May 28 launch party.
          Which reminder type is sent depends on days until the event.
        </p>
        <button
          onClick={handleSendReminders}
          disabled={reminderLoading}
          style={{
            padding: "10px 24px",
            background: reminderLoading ? "#ddd8cc" : "#FF9800",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            cursor: reminderLoading ? "wait" : "pointer",
          }}
        >
          {reminderLoading ? "Sending..." : "Send Event Reminders to All RSVPs"}
        </button>
        {reminderResult && (
          <pre style={{ marginTop: 16, padding: 12, background: "#f2efe8", borderRadius: 6, fontSize: 12, overflow: "auto", maxHeight: 400 }}>
            {reminderResult}
          </pre>
        )}
      </div>
    </div>
  );
}
