import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { requireStorageAccess, StorageAccessError } from "@/lib/server-storage-access";

export async function DELETE(request: NextRequest) {
    const fileId = request.nextUrl.searchParams.get("fileId");
    if (!fileId) {
        return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    try {
        const { session } = await requireStorageAccess(request);
        const objectKey = `${session.user.id}/${fileId}`;
        await r2.send(new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: objectKey,
        }));

        return NextResponse.json({ deleted: true });
    } catch (err: unknown) {
        if (err instanceof StorageAccessError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }
        console.error("Storage delete error:", err);
        return NextResponse.json({ error: "Failed to delete the encrypted file." }, { status: 500 });
    }
}
