import { GroupChatClient } from "@/components/igather/group-chat-client";
import { PhoneShell } from "@/components/igather/phone-shell";

export default function ChatPage() {
  return (
    <PhoneShell>
      <GroupChatClient />
    </PhoneShell>
  );
}
