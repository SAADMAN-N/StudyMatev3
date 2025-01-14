import { Suspense } from "react";
import Home from "./components/home";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="text-white">Hello World</div>
      <Home />
      <Toaster />
    </Suspense>
  );
}

export default App;
