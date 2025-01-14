import { Suspense } from "react";
import Home from "./components/home";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center">
        <img 
          src="/spinning_cat.gif" 
          alt="Loading..." 
          className="w-32 h-32"
        />
      </div>
    }>
      <Home />
      <Toaster />
    </Suspense>
  );
}

export default App;
