import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { PostForm } from '@/components/appearances/post-form';

export default function PostPage() {
  return (
    <AppShell>
      <Header title="Post an Appearance" description="Find a per diem attorney to cover your court appearance" />
      <PostForm />
    </AppShell>
  );
}
