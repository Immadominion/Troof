import { notFound } from "next/navigation";
import { AnalyzeRun } from "@/components/analyze-run";
import { NETWORKS, type Network } from "@/lib/constants";
import { isLikelySuiAddress } from "@/lib/format";

export default async function AnalyzeRunPage({
  params,
}: {
  params: Promise<{ network: string; address: string }>;
}) {
  const { network, address } = await params;
  if (!(network in NETWORKS) || !isLikelySuiAddress(address)) notFound();
  return (
    <div className="pt-16 sm:pt-20">
      <AnalyzeRun network={network as Network} address={address} />
    </div>
  );
}
