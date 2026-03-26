"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/igather/phone-shell";
import { GroupChatClient } from "@/components/igather/group-chat-client";
import { readActiveChatGroupId } from "@/lib/active-chat-group";

export default function ChatPage() {
  const router = useRouter();
  const [groupIndex, setGroupIndex] = useState(0);

  useEffect(() => {
    const id = readActiveChatGroupId(0);
    setGroupIndex(id);
    router.replace(`/chat/${id}`);
  }, [router]);

  return (
    <PhoneShell>
      <GroupChatClient groupIndex={groupIndex} />
    </PhoneShell>
  );
}
