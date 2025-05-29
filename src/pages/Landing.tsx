import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex flex-col justify-center items-center text-white px-6">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <i className="fas fa-heart text-primary text-3xl"></i>
        </div>
        <h1 className="text-4xl font-bold mb-2">Pindly</h1>
        <p className="text-white/90 text-lg">Find meaningful connections and lasting relationships</p>
      </div>
      
      <div className="w-full max-w-sm space-y-4">
        <Button 
          onClick={handleLogin}
          className="w-full bg-white text-dark py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow h-auto"
        >
          Get Started
        </Button>
        <Button 
          onClick={handleLogin}
          variant="outline"
          className="w-full border-2 border-white text-white py-4 rounded-2xl font-semibold text-lg bg-transparent hover:bg-white/10 h-auto"
        >
          Sign In
        </Button>
      </div>
      
      <p className="text-sm mt-8 opacity-70 text-center">
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
}
