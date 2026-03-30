import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const genericWebhookUrl = process.env.GENERIC_WEBHOOK_URL;

        if (!genericWebhookUrl) {
            console.warn("GENERIC_WEBHOOK_URL is not set in environment. Payload received:", payload);
            return NextResponse.json({ success: true, message: "Webhook received but not forwarded due to missing URL" });
        }

        // Forward the payload to Zapier/Discord/Slack
        const response = await fetch(genericWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: "assignment_created",
                data: payload.record // Assuming Supabase payload structure
            })
        });

        if (!response.ok) {
            console.error("Upstream webhook failed:", response.statusText);
            return NextResponse.json({ error: "Upstream webhook failed" }, { status: 502 });
        }

        return NextResponse.json({ success: true, message: "Webhook successfully forwarded" });
    } catch (error: any) {
        console.error("Webhook processing error:", error.message);
        return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
    }
}
