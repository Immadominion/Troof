"use client";

import { useState } from "react";
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/format";

export function WalletButton() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [open, setOpen] = useState(false);

  if (account) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="artifact gap-1.5"
        onClick={() => disconnect()}
        title="Disconnect"
      >
        <Wallet className="h-3.5 w-3.5" />
        {shortAddress(account.address)}
        <LogOut className="h-3 w-3 opacity-50" />
      </Button>
    );
  }

  return (
    <ConnectModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="outline" size="sm" className="gap-1.5">
          <Wallet className="h-3.5 w-3.5" /> Connect
        </Button>
      }
    />
  );
}
