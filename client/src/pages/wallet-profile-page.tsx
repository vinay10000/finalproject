import { Header } from "@/components/layout/Header";
import WalletProfile from "@/components/profile/WalletProfile";

export default function WalletProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-10">
        <main>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Wallet Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your blockchain wallet connection and security settings
              </p>
            </div>
            
            <WalletProfile />
          </div>
        </main>
      </div>
    </div>
  );
}