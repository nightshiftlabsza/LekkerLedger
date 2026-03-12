import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { r2 } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function DELETE(request: NextRequest) {
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
        await r2.send(new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: objectKey,
        }));

        return NextResponse.json({ deleted: true });
    } catch (err: unknown) {
        console.error("Storage delete error:", err);
        return NextResponse.json({ error: "Failed to delete the encrypted file." }, { status: 500 });
    }
}
