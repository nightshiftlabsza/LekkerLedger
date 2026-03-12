import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = request.nextUrl.searchParams.get("fileId");
    if (!fileId) {
        return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    try {
        const objectKey = `${session.user.id}/${fileId}`;
        const command = new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: objectKey,
        });

        const downloadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });
        return NextResponse.json({ downloadUrl });
    } catch (err: unknown) {
        console.error("Download presign error:", err);
        return NextResponse.json({ error: "Failed to generate download URL." }, { status: 500 });
    }
}
