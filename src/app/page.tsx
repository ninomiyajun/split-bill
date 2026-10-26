import EvenSplitForm from "./_components/even-split-form";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col gap-8 bg-white px-6 py-12 dark:bg-black sm:px-8 sm:py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          割り勘の計算
        </h1>
        <EvenSplitForm />
      </main>
    </div>
  );
}
