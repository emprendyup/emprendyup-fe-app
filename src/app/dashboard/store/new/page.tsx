import InteractiveChatStore from '@/app/components/InteractiveChatStore';

export default async function CreateStorePage() {
  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-3xl h-full">
        <InteractiveChatStore />
      </div>
    </div>
  );
}
