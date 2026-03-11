import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');

    if (!fileId) {
        return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    try {
        // Enforce user isolation by prefixing the S3 object key with their ID
        const objectKey = `${session.user.id}/${fileId}`;

        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: objectKey,
            ContentType: 'application/octet-stream', // Everything is encrypted binary blobs
        });

        // Signed URL expires in 15 minutes
        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

        return NextResponse.json({ uploadUrl });
    } catch (err: unknown) {
        console.error("Presign error:", err);
        return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
    }
}
