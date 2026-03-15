import { NextRequest, NextResponse } from "next/server";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireStorageAccess, StorageAccessError } from "@/lib/server-storage-access";

export async function GET(request: NextRequest) {
    const fileId = request.nextUrl.searchParams.get("fileId");
    if (!fileId) {
        return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    try {
        const { session } = await requireStorageAccess(request);
        const objectKey = `${session.user.id}/${fileId}`;
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: objectKey,
        });

        const downloadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });
        return NextResponse.json({ downloadUrl });
    } catch (err: unknown) {
        if (err instanceof StorageAccessError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }
        console.error("Download presign error:", err);
        return NextResponse.json({ error: "Failed to generate download URL." }, { status: 500 });
    }
}
