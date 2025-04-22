import AuthProvider from "@/app/component/AuthProvider";

export default async function Home() {
  return (
    <AuthProvider>
      <div>PRIVATE SUBFOLDER</div>
    </AuthProvider>
  );
}
