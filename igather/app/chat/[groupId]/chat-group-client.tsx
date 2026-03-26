"use client";

import { useEffect } from "react";
import { GroupChatClient } from "@/components/igather/group-chat-client";
import { writeActiveChatGroupId } from "@/lib/active-chat-group";

export default function ChatGroupClient({
  groupIndex,
  groupName,
}: {
  groupIndex: number;
  groupName: string;
}) {
  useEffect(() => {
    writeActiveChatGroupId(groupIndex);
  }, [groupIndex]);

  return (
    <GroupChatClient groupIndex={groupIndex} groupName={groupName} />
  );
}

