import { notFound } from "next/navigation";
import { ProofVerifier } from "@/components/proof-verifier";

export const dynamic = "force-dynamic";

export default async function ProofPage({
  params,
}: {
  params: Promise<{ blobId: string }>;
}) {
  const { blobId } = await params;
  if (!/^[A-Za-z0-9_-]{10,}$/.test(blobId)) notFound();
  return <ProofVerifier blobId={blobId} />;
}
