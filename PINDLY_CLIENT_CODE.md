# Pindly Dating App - Client Code

## File: client/src/App.tsx
```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Chat from "@/pages/Chat";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/profile" component={Profile} />
          <Route path="/messages" component={Messages} />
          <Route path="/chat/:matchId" component={Chat} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

## File: client/src/main.tsx
```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

## File: client/src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 220 14% 4%;
  --muted: 210 40% 98%;
  --muted-foreground: 215 16% 47%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 14% 4%;
  --card: 0 0% 100%;
  --card-foreground: 220 14% 4%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --primary: 0 72% 66%; /* #FF6B6B - vibrant red-pink */
  --primary-foreground: 0 0% 98%;
  --secondary: 174 72% 56%; /* #4ECDC4 - teal */
  --secondary-foreground: 0 0% 9%;
  --accent: 45 97% 54%; /* #FFE66D - bright yellow */
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --ring: 0 72% 66%;
  --radius: 0.75rem;
  --success: 142 52% 70%; /* #96CEB4 - soft green */
  --warning: 42 100% 70%; /* #FFEAA7 - warm yellow */
}

.dark {
  --background: 220 14% 4%;
  --foreground: 0 0% 95%;
  --muted: 215 28% 17%;
  --muted-foreground: 217 11% 65%;
  --popover: 220 14% 4%;
  --popover-foreground: 0 0% 95%;
  --card: 220 14% 4%;
  --card-foreground: 0 0% 95%;
  --border: 215 28% 17%;
  --input: 215 28% 17%;
  --primary: 0 72% 66%;
  --primary-foreground: 0 0% 98%;
  --secondary: 174 72% 56%;
  --secondary-foreground: 0 0% 98%;
  --accent: 45 97% 54%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --ring: 0 72% 66%;
  --success: 142 52% 70%;
  --warning: 42 100% 70%;
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}

@layer utilities {
  .swipe-card {
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
  }
  
  .swipe-card.swiping-left {
    transform: translateX(-100%) rotate(-15deg);
    opacity: 0;
  }
  
  .swipe-card.swiping-right {
    transform: translateX(100%) rotate(15deg);
    opacity: 0;
  }
  
  .gradient-overlay {
    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%);
  }
  
  .pulse-ring {
    animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
  }
  
  @keyframes pulse-ring {
    0% { transform: scale(0.33); }
    80%, 100% { opacity: 0; }
  }
  
  .floating-hearts {
    animation: float-hearts 3s ease-in-out infinite;
  }
  
  @keyframes float-hearts {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground));
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--foreground));
}
```

## File: client/src/hooks/useAuth.ts
```typescript
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
```

## File: client/src/hooks/useWebSocket.ts
```typescript
import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      // Authenticate with the server
      ws.current?.send(JSON.stringify({
        type: "auth",
        userId,
      }));
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const onMessage = (callback: (message: WebSocketMessage) => void) => {
    if (ws.current) {
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    }
  };

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [userId]);

  return {
    isConnected,
    sendMessage,
    onMessage,
  };
}
```

## File: client/src/lib/queryClient.ts
```typescript
import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorMessage = await res.text();
    throw new Error(errorMessage || `HTTP error! status: ${res.status}`);
  }
}

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  body?: any
) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(body && { "Content-Type": "application/json" }),
    },
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => (context: { queryKey: readonly string[] }) => Promise<T> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const url = queryKey[0];
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (res.status === 401) {
        if (on401 === "returnNull") {
          return null as T;
        }
        throw new Error("Unauthorized");
      }

      await throwIfResNotOk(res);
      return res.json() as T;
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        if (on401 === "returnNull") {
          return null as T;
        }
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message === "Unauthorized") {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      },
    },
  },
});
```

## File: client/src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## File: client/src/pages/Landing.tsx
```typescript
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
```

Continue with more client pages and components in the next part...