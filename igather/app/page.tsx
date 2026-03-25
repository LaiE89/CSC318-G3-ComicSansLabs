import { ChatListPage } from "@/components/igather/chat-list-page";
import { PhoneShell } from "@/components/igather/phone-shell";

export default function Home() {
  return (
    <PhoneShell>
      <ChatListPage />
    </PhoneShell>
  );
}
