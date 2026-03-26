import { PhoneShell } from "@/components/igather/phone-shell";
import { getChatGroupName } from "@/lib/chat-groups";
import ChatGroupClient from "./chat-group-client";

export default async function ChatGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const n = Number(groupId);
  const groupIndex = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const groupName = getChatGroupName(groupIndex);

  return (
    <PhoneShell>
      <ChatGroupClient groupIndex={groupIndex} groupName={groupName} />
    </PhoneShell>
  );
}

